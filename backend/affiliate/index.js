const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Simple root route so opening http://localhost:3000 shows a message
app.get('/', (_req, res) => {
  res.send('Affiliate API is running. Use /api/affiliate/register or /api/login.');
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Proxy for remove background API to keep API key server-side
// removed /api/remove-bg route per request

// Admin-only middleware
const adminOnly = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Affiliate register (optional invite code)
app.post('/api/affiliate/register', async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });

    // If invite codes are being used, validate
    if (inviteCode) {
      const code = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
      if (!code || !code.active) return res.status(400).json({ error: 'Invalid invite code' });
      if (code.expiresAt && new Date(code.expiresAt) < new Date()) return res.status(400).json({ error: 'Invite code expired' });
      if (code.usedCount >= code.maxUses) return res.status(400).json({ error: 'Invite code usage limit reached' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password_hash: hashed, role: 'affiliate' } });
    const code = `${name.split(' ')[0].toUpperCase()}${Math.floor(Math.random() * 10000)}`;
    await prisma.affiliate.create({
      data: {
        user_id: user.id,
        affiliate_code: code,
        referral_link: `https://yourbrand.com?ref=${code}`,
      },
    });

    if (inviteCode) {
      await prisma.inviteCode.update({
        where: { code: inviteCode },
        data: { usedCount: { increment: 1 } },
      });
    }
    res.json({ message: 'Application submitted. Await admin approval.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login (affiliate or admin)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: user.role });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: pending affiliates
app.get('/api/admin/pending', adminOnly, async (_req, res) => {
  const pending = await prisma.affiliate.findMany({ where: { status: 'pending' }, include: { User: true } });
  res.json(pending);
});

// Admin: approve
app.post('/api/admin/approve/:id', adminOnly, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await prisma.affiliate.update({ where: { id }, data: { status: 'active' } });
  res.json({ message: 'Affiliate approved' });
});

// Admin: generate invite code
app.post('/api/admin/invite-codes', adminOnly, async (req, res) => {
  const { label, maxUses = 1, expiresAt } = req.body || {};
  const code = `AFF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const invite = await prisma.inviteCode.create({
    data: { code, label: label || null, maxUses, expiresAt: expiresAt ? new Date(expiresAt) : null },
  });
  res.json(invite);
});

// Admin: list invite codes
app.get('/api/admin/invite-codes', adminOnly, async (_req, res) => {
  const codes = await prisma.inviteCode.findMany({ orderBy: { created_at: 'desc' } });
  res.json(codes);
});

// Admin: deactivate code
app.post('/api/admin/invite-codes/:code/deactivate', adminOnly, async (req, res) => {
  const { code } = req.params;
  const updated = await prisma.inviteCode.update({ where: { code }, data: { active: false } });
  res.json(updated);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Affiliate server running on :${PORT}`));


