import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for affiliate system
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AFFILIATE_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

// Authentication middleware for serverless
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, body, query } = req;
  const action = query.action;

  try {
    switch (method) {
      case 'POST':
        if (action === 'apply') {
          return await handleAffiliateApplication(req, res);
        } else if (action === 'generate-link') {
          return await handleGenerateAffiliateLink(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'GET':
        if (action === 'stats') {
          return await handleAffiliateStats(req, res);
        } else if (action === 'earnings') {
          return await handleAffiliateEarnings(req, res);
        } else if (action === 'links') {
          return await handleAffiliateLinks(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Affiliate API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Affiliate application handler
async function handleAffiliateApplication(req, res) {
  const { name, email, website, experience, inviteCode } = req.body;

  // Validate input
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Check invite code if provided
  let validInvite = null;
  if (inviteCode) {
    validInvite = await prisma.inviteCode.findFirst({
      where: {
        code: inviteCode,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!validInvite) {
      return res.status(400).json({ error: 'Invalid or expired invite code' });
    }

    // Check usage limit
    if (validInvite.maxUses && validInvite.usedCount >= validInvite.maxUses) {
      return res.status(400).json({ error: 'Invite code has reached its usage limit' });
    }
  }

  // Check if already applied
  const existingApplication = await prisma.affiliate.findUnique({
    where: { email }
  });

  if (existingApplication) {
    return res.status(400).json({ error: 'Application already exists for this email' });
  }

  // Create affiliate application
  const affiliate = await prisma.affiliate.create({
    data: {
      name,
      email,
      website: website || null,
      experience: experience || null,
      status: validInvite ? 'approved' : 'pending', // Auto-approve with valid invite
      inviteCodeId: validInvite?.id || null,
      commissionRate: validInvite ? 0.10 : 0.05, // 10% with invite, 5% without
      affiliateCode: generateAffiliateCode()
    }
  });

  // Update invite code usage
  if (validInvite) {
    await prisma.inviteCode.update({
      where: { id: validInvite.id },
      data: { usedCount: { increment: 1 } }
    });
  }

  res.status(201).json({
    message: 'Affiliate application submitted successfully',
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      status: affiliate.status,
      affiliateCode: affiliate.affiliateCode,
      commissionRate: affiliate.commissionRate
    }
  });
}

// Generate affiliate link handler
async function handleGenerateAffiliateLink(req, res) {
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { productId, campaignName } = req.body;

  // Find affiliate
  const affiliate = await prisma.affiliate.findFirst({
    where: { 
      email: user.email,
      status: 'approved'
    }
  });

  if (!affiliate) {
    return res.status(403).json({ error: 'Affiliate account not found or not approved' });
  }

  // Create affiliate link
  const affiliateLink = await prisma.affiliateLink.create({
    data: {
      affiliateId: affiliate.id,
      productId: productId || null,
      campaignName: campaignName || 'Default Campaign',
      linkCode: generateLinkCode(),
      clicks: 0,
      conversions: 0
    }
  });

  const baseUrl = process.env.FRONTEND_URL || 'https://your-app.vercel.app';
  const generatedLink = `${baseUrl}${productId ? `/product/${productId}` : ''}?ref=${affiliateLink.linkCode}`;

  res.status(201).json({
    message: 'Affiliate link generated successfully',
    link: generatedLink,
    linkCode: affiliateLink.linkCode,
    campaignName: affiliateLink.campaignName
  });
}

// Affiliate stats handler
async function handleAffiliateStats(req, res) {
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Find affiliate
  const affiliate = await prisma.affiliate.findFirst({
    where: { 
      email: user.email,
      status: 'approved'
    }
  });

  if (!affiliate) {
    return res.status(403).json({ error: 'Affiliate account not found or not approved' });
  }

  // Get statistics
  const stats = await prisma.affiliateLink.aggregate({
    where: { affiliateId: affiliate.id },
    _sum: {
      clicks: true,
      conversions: true
    }
  });

  const totalEarnings = await prisma.affiliateEarning.aggregate({
    where: { affiliateId: affiliate.id },
    _sum: {
      amount: true
    }
  });

  res.status(200).json({
    affiliate: {
      name: affiliate.name,
      status: affiliate.status,
      commissionRate: affiliate.commissionRate,
      affiliateCode: affiliate.affiliateCode
    },
    stats: {
      totalClicks: stats._sum.clicks || 0,
      totalConversions: stats._sum.conversions || 0,
      totalEarnings: totalEarnings._sum.amount || 0,
      conversionRate: stats._sum.clicks > 0 ? 
        ((stats._sum.conversions || 0) / stats._sum.clicks * 100).toFixed(2) : 0
    }
  });
}

// Affiliate earnings handler
async function handleAffiliateEarnings(req, res) {
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { page = 1, limit = 20 } = req.query;

  // Find affiliate
  const affiliate = await prisma.affiliate.findFirst({
    where: { 
      email: user.email,
      status: 'approved'
    }
  });

  if (!affiliate) {
    return res.status(403).json({ error: 'Affiliate account not found or not approved' });
  }

  // Get earnings with pagination
  const earnings = await prisma.affiliateEarning.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: parseInt(limit),
    include: {
      affiliateLink: {
        select: {
          campaignName: true,
          linkCode: true
        }
      }
    }
  });

  const total = await prisma.affiliateEarning.count({
    where: { affiliateId: affiliate.id }
  });

  res.status(200).json({
    earnings: earnings.map(earning => ({
      id: earning.id,
      amount: earning.amount,
      orderValue: earning.orderValue,
      status: earning.status,
      campaignName: earning.affiliateLink?.campaignName,
      linkCode: earning.affiliateLink?.linkCode,
      createdAt: earning.createdAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

// Affiliate links handler
async function handleAffiliateLinks(req, res) {
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Find affiliate
  const affiliate = await prisma.affiliate.findFirst({
    where: { 
      email: user.email,
      status: 'approved'
    }
  });

  if (!affiliate) {
    return res.status(403).json({ error: 'Affiliate account not found or not approved' });
  }

  // Get affiliate links
  const links = await prisma.affiliateLink.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' }
  });

  const baseUrl = process.env.FRONTEND_URL || 'https://your-app.vercel.app';

  res.status(200).json({
    links: links.map(link => ({
      id: link.id,
      campaignName: link.campaignName,
      linkCode: link.linkCode,
      fullLink: `${baseUrl}${link.productId ? `/product/${link.productId}` : ''}?ref=${link.linkCode}`,
      clicks: link.clicks,
      conversions: link.conversions,
      conversionRate: link.clicks > 0 ? (link.conversions / link.clicks * 100).toFixed(2) : 0,
      createdAt: link.createdAt
    }))
  });
}

// Helper functions
function generateAffiliateCode() {
  return 'AFF-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function generateLinkCode() {
  return Math.random().toString(36).substr(2, 12);
}
