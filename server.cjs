const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config(); // Add dotenv support

const app = express();
const PORT = process.env.PORT || 3001;
const cheerio = require('cheerio');
let puppeteer;

// Rate limiting and caching for AliExpress API
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const apiCalls = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_CALLS_PER_WINDOW = 30; // Max 30 calls per minute

// Rate limiting helper
function checkRateLimit(key = 'global') {
  const now = Date.now();
  const window = Math.floor(now / RATE_LIMIT_WINDOW);
  const windowKey = `${key}-${window}`;
  
  const current = apiCalls.get(windowKey) || 0;
  if (current >= MAX_CALLS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  apiCalls.set(windowKey, current + 1);
  
  // Clean up old windows
  for (const [k] of apiCalls) {
    if (k.endsWith(`-${window - 1}`) || k.endsWith(`-${window - 2}`)) {
      apiCalls.delete(k);
    }
  }
  
  return true;
}

// Cache helper
function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Cache hit for: ${key}`);
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 Cached result for: ${key}`);
}

// Clean old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}, CACHE_DURATION);



// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

console.log('🔑 Checking environment variables...');
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
console.log('OpenAI API Key:', OPENAI_KEY ? '✅ Configured' : '❌ Missing');
const ALI_APP_KEY = process.env.ALI_APP_KEY || '';
const ALI_APP_SECRET = process.env.ALI_APP_SECRET || '';
const ALI_REDIRECT_URI = process.env.ALI_REDIRECT_URI || `http://localhost:${PORT}/api/aliexpress/auth/callback`;
let ALI_ACCESS_TOKEN_MEM = process.env.ALI_ACCESS_TOKEN || '';
let ALI_REFRESH_TOKEN_MEM = process.env.ALI_REFRESH_TOKEN || '';
console.log('AliExpress Open Service:', (ALI_APP_KEY && ALI_APP_SECRET) ? '✅ App credentials present' : '❌ Missing app credentials');
function getAliAccessToken() { return ALI_ACCESS_TOKEN_MEM || process.env.ALI_ACCESS_TOKEN || ''; }
function setAliTokens(accessToken, refreshToken) {
  ALI_ACCESS_TOKEN_MEM = accessToken || '';
  ALI_REFRESH_TOKEN_MEM = refreshToken || '';
}
console.log('AliExpress Access Token:', getAliAccessToken() ? '✅ Present' : '⚠️ Missing (required for seller APIs)');

// AI Description Generation endpoint
app.post('/api/ai/generate-description', async (req, res) => {
  const { productInfo } = req.body;
  
  if (!OPENAI_KEY) {
    return res.json({
      success: false,
      error: 'OpenAI API key not configured'
    });
  }

  if (!productInfo || !productInfo.name) {
    return res.status(400).json({
      success: false,
      error: 'Product info with name is required'
    });
  }

  try {
    console.log(`🤖 Generating AI description for: ${productInfo.name}`);

    const prompt = `Create a compelling product description for this fashion item:

**Product Name:** ${productInfo.name}
**Category:** ${productInfo.category || 'Fashion'}
**Price:** $${productInfo.price || 'N/A'}
**Original Description:** ${productInfo.originalDescription || 'No description provided'}
**Tags:** ${productInfo.tags?.join(', ') || 'fashion, trendy'}

Please provide the response in this exact JSON format:
{
  "title": "An irresistible product title (max 60 chars)",
  "shortDescription": "A punchy 1-2 sentence hook that creates desire (max 120 chars)",
  "fullDescription": "A compelling 3-4 paragraph description that tells a story, creates emotion, and drives action. Include benefits, lifestyle appeal, and subtle urgency. Make it feel like it was written by a human, not AI.",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Focus on:
- How this item will make them FEEL
- The lifestyle it represents
- Social situations where they'll shine
- Why they need it NOW
- Specific benefits over generic features
- Natural, conversational tone
- Creating urgency without being pushy

Make it sound like their best friend is recommending this item to them.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert copywriter for a premium dropshipping fashion brand targeting Gen Z and young millennials. Your writing style is:

- Conversational and authentic (never robotic)
- Benefit-focused rather than feature-focused
- Emotionally compelling and aspirational
- Uses modern slang naturally (but not excessively)
- Creates FOMO and urgency
- Includes social proof elements
- SEO-optimized but naturally flowing
- Speaks directly to the customer's desires and lifestyle

Create descriptions that make people feel like they NEED this item to complete their aesthetic and express their personality.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse the JSON response
    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      // Fallback response
      const category = productInfo.category?.toLowerCase() || 'item';
      parsedResponse = {
        title: `${productInfo.name} - Premium ${productInfo.category || 'Fashion'}`,
        shortDescription: `Discover your new favorite ${category} that perfectly captures your unique style.`,
        fullDescription: `<p>Meet your new style obsession: the <strong>${productInfo.name}</strong>. This isn't just another ${category} – it's your secret weapon for turning heads and expressing your authentic self.</p><p>Crafted for the fashion-forward individual who refuses to blend in, this piece effortlessly combines comfort with that coveted "where did you get that?" appeal. Whether you're building the perfect outfit for your feed or just want to feel incredible in your everyday moments, this ${category} delivers.</p><p><strong>Ready to elevate your wardrobe?</strong> Add this to your collection and experience the confidence that comes with wearing something truly special.</p>`,
        seoKeywords: ['fashion', 'trendy', 'style', category, 'clothing'],
        tags: ['fashion', 'trendy', 'new', category, 'popular']
      };
    }

    console.log('✅ AI description generated successfully');
    res.json({
      success: true,
      description: parsedResponse
    });

  } catch (error) {
    console.error('❌ AI description generation failed:', error.message);
    
    // Return fallback description
    const category = productInfo.category?.toLowerCase() || 'item';
    res.json({
      success: true,
      description: {
        title: `${productInfo.name} - Premium ${productInfo.category || 'Fashion'}`,
        shortDescription: `Discover your new favorite ${category} that perfectly captures your unique style.`,
        fullDescription: `<p>Meet your new style obsession: the <strong>${productInfo.name}</strong>. This isn't just another ${category} – it's your secret weapon for turning heads and expressing your authentic self.</p><p>Crafted for the fashion-forward individual who refuses to blend in, this piece effortlessly combines comfort with that coveted "where did you get that?" appeal. Whether you're building the perfect outfit for your feed or just want to feel incredible in your everyday moments, this ${category} delivers.</p><p><strong>Ready to elevate your wardrobe?</strong> Add this to your collection and experience the confidence that comes with wearing something truly special.</p>`,
        seoKeywords: ['fashion', 'trendy', 'style', category, 'clothing'],
        tags: ['fashion', 'trendy', 'new', category, 'popular']
      },
      fallback: true,
      error: error.message
    });
  }
});

// Shopify API proxy endpoint
app.post('/api/shopify/test-connection', async (req, res) => {
  const { storeUrl, accessToken } = req.body;

  if (!storeUrl || !accessToken) {
    return res.status(400).json({ 
      success: false, 
      error: 'Store URL and access token are required' 
    });
  }

  try {
    console.log(`🔍 Testing connection to: https://${storeUrl}/admin/api/2023-10/shop.json`);
    
    const response = await fetch(`https://${storeUrl}/admin/api/2023-10/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Shopify API Error:', response.status, errorData);
      
      return res.json({
        success: false,
        error: `Shopify API Error (${response.status}): ${errorData.errors || response.statusText}`
      });
    }

    const data = await response.json();
    console.log('✅ Shopify connection successful:', data.shop?.name);
    
    res.json({ 
      success: true, 
      shopName: data.shop?.name,
      shopDomain: data.shop?.domain 
    });

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    res.json({
      success: false,
      error: `Connection failed: ${error.message}`
    });
  }
});

// Shopify product creation proxy
app.post('/api/shopify/create-product', async (req, res) => {
  const { storeUrl, accessToken, productData } = req.body;

  try {
    const response = await fetch(`https://${storeUrl}/admin/api/2023-10/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ product: productData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.json({
        success: false,
        error: `Product creation failed (${response.status}): ${JSON.stringify(errorData.errors || response.statusText)}`
      });
    }

    const result = await response.json();
    console.log('✅ Product created:', result.product?.title);
    
    res.json({ 
      success: true, 
      product: result.product 
    });

  } catch (error) {
    console.error('❌ Product creation failed:', error.message);
    res.json({
      success: false,
      error: `Product creation failed: ${error.message}`
    });
  }
});

// WooCommerce API proxy endpoint
app.post('/api/woocommerce/test-connection', async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret } = req.body;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return res.status(400).json({ 
      success: false, 
      error: 'Store URL, consumer key, and consumer secret are required' 
    });
  }

  try {
    const cleanUrl = storeUrl.replace(/\/$/, '');
    const testUrl = `${cleanUrl}/wp-json/wc/v3/system_status`;
    
    console.log(`🔍 Testing WooCommerce connection to: ${testUrl}`);
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ WooCommerce API Error:', response.status, errorData);
      
      return res.json({
        success: false,
        error: `WooCommerce API Error (${response.status}): ${errorData.message || response.statusText}`
      });
    }

    const data = await response.json();
    console.log('✅ WooCommerce connection successful:', data.environment?.home_url);
    
    res.json({ 
      success: true, 
      storeName: data.settings?.title || 'WooCommerce Store',
      storeUrl: data.environment?.home_url || storeUrl,
      wooVersion: data.environment?.version
    });

  } catch (error) {
    console.error('❌ WooCommerce connection failed:', error.message);
    res.json({
      success: false,
      error: `Connection failed: ${error.message}`
    });
  }
});

// WooCommerce product creation proxy
app.post('/api/woocommerce/create-product', async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret, productData } = req.body;

  try {
    const cleanUrl = storeUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    console.log(`🛍️ Creating WooCommerce product: ${productData.name}`);
    
    const response = await fetch(`${cleanUrl}/wp-json/wc/v3/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.json({
        success: false,
        error: `WooCommerce product creation failed (${response.status}): ${JSON.stringify(errorData.message || response.statusText)}`
      });
    }

    const result = await response.json();
    console.log('✅ WooCommerce product created:', result.name);
    
    res.json({ 
      success: true, 
      product: result 
    });

  } catch (error) {
    console.error('❌ WooCommerce product creation failed:', error.message);
    res.json({
      success: false,
      error: `Product creation failed: ${error.message}`
    });
  }
});

// Get WooCommerce categories
app.post('/api/woocommerce/categories', async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret } = req.body;

  try {
    const cleanUrl = storeUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await fetch(`${cleanUrl}/wp-json/wc/v3/products/categories`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.json({
        success: false,
        error: `Failed to fetch categories (${response.status}): ${errorData.message || response.statusText}`
      });
    }

    const categories = await response.json();
    console.log(`✅ Retrieved ${categories.length} WooCommerce categories`);
    
    res.json({ 
      success: true, 
      categories 
    });

  } catch (error) {
    console.error('❌ Failed to fetch WooCommerce categories:', error.message);
    res.json({
      success: false,
      error: `Failed to fetch categories: ${error.message}`
    });
  }
});

// Debug: List recent WooCommerce products
app.post('/api/woocommerce/debug-products', async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret } = req.body;

  try {
    const cleanUrl = storeUrl.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    console.log(`🔍 Fetching recent WooCommerce products for debugging...`);
    
    // Get products with various statuses and detailed info
    const response = await fetch(`${cleanUrl}/wp-json/wc/v3/products?per_page=20&orderby=date&order=desc&status=any`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.json({
        success: false,
        error: `Failed to fetch products (${response.status}): ${errorData.message || response.statusText}`
      });
    }

    const products = await response.json();
    console.log(`🔍 Found ${products.length} total products`);
    
    // Log details about recent products
    products.slice(0, 5).forEach(product => {
      console.log(`📦 Product: "${product.name}" | Status: ${product.status} | Visibility: ${product.catalog_visibility} | ID: ${product.id} | Date: ${product.date_created}`);
    });
    
    res.json({ 
      success: true, 
      totalProducts: products.length,
      recentProducts: products.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        catalog_visibility: p.catalog_visibility,
        date_created: p.date_created,
        permalink: p.permalink,
        type: p.type,
        stock_status: p.stock_status
      }))
    });

  } catch (error) {
    console.error('❌ Failed to fetch WooCommerce products:', error.message);
    res.json({
      success: false,
      error: `Failed to fetch products: ${error.message}`
    });
  }
});

// In-memory received orders (for demo)
const receivedOrders = [];

// Shopify Webhook receiver (orders create)
app.post('/webhooks/shopify/orders', async (req, res) => {
  try {
    console.log('🪝 Shopify webhook received');
    const payload = req.body;
    receivedOrders.push({ source: 'shopify', payload, receivedAt: Date.now() });
    console.log(`✅ Stored Shopify order ${payload?.id || ''}`);
    res.status(200).send('ok');
  } catch (e) {
    console.error('❌ Shopify webhook failed', e.message);
    res.status(500).send('error');
  }
});

// WooCommerce Webhook receiver (order.created)
app.post('/webhooks/woocommerce/orders', async (req, res) => {
  try {
    console.log('🪝 WooCommerce webhook received');
    const payload = req.body;
    receivedOrders.push({ source: 'woocommerce', payload, receivedAt: Date.now() });
    console.log(`✅ Stored Woo order ${payload?.id || ''}`);
    res.status(200).send('ok');
  } catch (e) {
    console.error('❌ WooCommerce webhook failed', e.message);
    res.status(500).send('error');
  }
});
// Alias: some stores send to /orders/create
app.post('/webhooks/woocommerce/orders/create', async (req, res) => {
  try {
    console.log('🪝 WooCommerce webhook received (/orders/create)');
    const payload = req.body;
    receivedOrders.push({ source: 'woocommerce', payload, receivedAt: Date.now() });
    res.status(200).send('ok');
  } catch (e) {
    console.error('❌ WooCommerce webhook failed', e.message);
    res.status(500).send('error');
  }
});

// Debug endpoint to fetch received webhook orders
app.get('/api/webhooks/received', (req, res) => {
  res.json({ success: true, total: receivedOrders.length, items: receivedOrders.slice(-50) });
});

// AliExpress API proxy endpoints (Updated to use new RapidAPI service)
app.post('/api/aliexpress/search', async (req, res) => {
  const { searchText, page = 1 } = req.body || {};
  if (!searchText) {
    return res.status(400).json({ success: false, error: 'Search text is required' });
  }

  // Basic rate limit for search
  if (!checkRateLimit('aliexpress-search')) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded. Please try again shortly.' });
  }

  try {
    if (!ALI_APP_KEY || !ALI_APP_SECRET || !getAliAccessToken()) {
      // HTML scraper fallback – attempt to fetch public search page
      console.warn('⚠️ ALI_APP_KEY/SECRET missing. Using HTML scraper fallback.');
      const q = encodeURIComponent(String(searchText));
      const url = `https://www.aliexpress.com/w/wholesale-${q}.html?page=${Number(page) || 1}`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await resp.text();
      // Try extracting window.runParams data block first (often contains itemList)
      const runParamsMatch = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});/);
      if (runParamsMatch) {
        try {
          const jsonText = runParamsMatch[1];
          const data = JSON.parse(jsonText);
          const list = data?.mods?.itemList?.content || data?.items || [];
          const mapped = (Array.isArray(list) ? list : []).slice(0, 48).map((p, idx) => {
            const title = String(p?.title?.displayTitle || p?.title || p?.subject || 'Unknown Product');
            const image = String(p?.image?.imgUrl || p?.image || p?.thumb || '');
            const priceStr = p?.prices?.salePrice?.minPrice || p?.prices?.salePrice || p?.price || '0';
            const price = Number(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
            const originalStr = p?.prices?.salePrice?.maxPrice || p?.prices?.originalPrice || p?.originalPrice || priceStr;
            const original = Number(String(originalStr).replace(/[^0-9.]/g, '')) || price;
            const orders = Number(p?.trade?.tradeDesc?.replace(/[^0-9]/g, '') || p?.orders || 0);
            const rating = Number(p?.evaluation?.starRating || p?.rating || 0);
            const url = String(p?.productDetailUrl || p?.productUrl || p?.detailUrl || '');
            const id = url || `${title}-${idx}`;
            return {
              id,
              title,
              product_title: title,
              image,
              product_main_image_url: image,
              price,
              sale_price: price,
              original_price: original,
              app_sale_volume: orders,
              evaluate_rate: rating,
              product_url: url,
              detail_url: url,
              category: 'General'
            };
          });
          if (mapped.length > 0) {
            console.log(`✅ Scraper(runParams) extracted ${mapped.length} items`);
            return res.json({ success: true, data: { items: mapped } });
          }
        } catch {}
      }
      if (!resp.ok) {
        console.warn(`Scrape failed (${resp.status}). Falling back to mock.`);
        // Fallback to mock if blocked
        const seed = String(searchText).toLowerCase().split(/\s+/).filter(Boolean);
        const base = ['Wireless','Smart','Portable','Premium','Eco','Ultra','Mini','Pro','Max','Nano'];
        const cats = ['Electronics','Home','Beauty','Fitness','Pets','Tools','Automotive','Toys'];
        const items = Array.from({ length: 24 }).map((_, i) => {
          const kw = seed[i % Math.max(1, seed.length)] || 'gadget';
          const adj = base[i % base.length];
          const price = Number((Math.random() * 40 + 9).toFixed(2));
          const original = Number((price * (1.1 + Math.random() * 0.4)).toFixed(2));
          const orders = Math.floor(Math.random() * 9000 + 100);
          const rating = Number((3.6 + Math.random() * 1.4).toFixed(1));
          const title = `${adj} ${kw} ${i + 1}`.replace(/\b\w/g, s => s.toUpperCase());
          const id = `mock-${Buffer.from(`${title}-${i}`).toString('base64').replace(/=+$/,'')}`;
          return {
            id,
            title,
            product_title: title,
            image: `https://picsum.photos/seed/${encodeURIComponent(id)}/600/600`,
            product_main_image_url: `https://picsum.photos/seed/${encodeURIComponent(id)}/600/600`,
            price,
            sale_price: price,
            original_price: original,
            app_sale_volume: orders,
            evaluate_rate: rating,
            product_url: `https://www.aliexpress.com/item/${id}.html`,
            detail_url: `https://www.aliexpress.com/item/${id}.html`,
            category: cats[i % cats.length]
          };
        });
        return res.json({ success: true, data: { items } });
      }

      // Parse page
      const $ = cheerio.load(html);
      const items = [];
      $('a[href*="/item/"]').slice(0, 48).each((idx, el) => {
        const anchor = $(el);
        const url = anchor.attr('href') || '';
        const container = anchor.closest('div,li');
        let title = anchor.attr('title') || anchor.text().trim();
        if (!title) title = container.find('h1,h2,h3,p,span').first().text().trim();
        const img = container.find('img').attr('src') || container.find('img').attr('image-src') || '';
        const priceText = container.text().match(/\$\s?([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] || '19.99';
        const price = Number(parseFloat(priceText) || 19.99);
        const orders = Number(container.text().match(/(\d+[\,\.]?\d*)\s*orders?/i)?.[1]?.replace(/[,\.]/g,'') || Math.floor(Math.random()*5000+200));
        const rating = Number(parseFloat(container.text().match(/(\d\.\d)\s*out of\s*5/i)?.[1] || (3.8 + Math.random()*1.2).toFixed(1)));
        const id = url || `${title}-${idx}`;
        items.push({
          id,
          title,
          product_title: title,
          image: img,
          product_main_image_url: img,
          price,
          sale_price: price,
          original_price: Number((price * 1.15).toFixed(2)),
          app_sale_volume: orders,
          evaluate_rate: rating,
          product_url: url,
          detail_url: url,
          category: 'General'
        });
      });

      if (items.length === 0) {
        console.warn('Static scrape found 0 items. Trying headless browser...');
        try {
          if (!puppeteer) puppeteer = require('puppeteer');
          const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
          const pageObj = await browser.newPage();
          await pageObj.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36');
          await pageObj.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
          await pageObj.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await pageObj.waitForTimeout(1200);
          const runParams = await pageObj.evaluate(() => {
            try { return window.runParams || null; } catch { return null; }
          });
          const dynItemsSrc = runParams?.mods?.itemList?.content || [];
          await browser.close();
          const dynItems = (Array.isArray(dynItemsSrc) ? dynItemsSrc : []).slice(0, 48).map((p, idx) => {
            const title = String(p?.title?.displayTitle || p?.title || p?.subject || 'Unknown Product');
            const image = String(p?.image?.imgUrl || p?.image || p?.thumb || '');
            const priceStr = p?.prices?.salePrice?.minPrice || p?.prices?.salePrice || p?.price || '0';
            const price = Number(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
            const originalStr = p?.prices?.salePrice?.maxPrice || p?.prices?.originalPrice || p?.originalPrice || priceStr;
            const original = Number(String(originalStr).replace(/[^0-9.]/g, '')) || price;
            const orders = Number(p?.trade?.tradeDesc?.replace(/[^0-9]/g, '') || p?.orders || 0);
            const rating = Number(p?.evaluation?.starRating || p?.rating || 0);
            const loc = String(p?.productDetailUrl || p?.productUrl || p?.detailUrl || '');
            const id = loc || `${title}-${idx}`;
            return {
              id,
              title,
              product_title: title,
              image,
              product_main_image_url: image,
              price,
              sale_price: price,
              original_price: original,
              app_sale_volume: orders,
              evaluate_rate: rating,
              product_url: loc,
              detail_url: loc,
              category: 'General'
            };
          });
          console.log(`✅ Headless scrape extracted ${dynItems.length} items`);
          return res.json({ success: true, data: { items: dynItems } });
        } catch (headlessErr) {
          console.warn('⚠️ Headless scrape failed:', headlessErr?.message || headlessErr);
          return res.json({ success: true, data: { items: [] } });
        }
      }
      console.log(`✅ Scraper extracted ${items.length} items`);
      return res.json({ success: true, data: { items } });
    }

    // Prefer seller API (aliexpress.open) when we have an access token
    if (getAliAccessToken()) {
      console.log(`🔍 Searching AliExpress Seller API for: ${searchText} (page ${page})`);
      const sp = new URLSearchParams({
        access_token: getAliAccessToken(),
        page_no: String(page || 1),
        page_size: '40',
        keywords: String(searchText)
      });
      const sellerUrl = `https://gw.api.alibaba.com/openapi/param2/1/aliexpress.open/aliexpress.solution.product.list.get/${ALI_APP_KEY}?${sp.toString()}`;
      const sResp = await fetch(sellerUrl, { method: 'GET' });
      const sText = await sResp.text();
      if (sResp.ok) {
        let sData; try { sData = JSON.parse(sText); } catch { sData = { raw: sText }; }
        const sItems = sData?.result?.products || sData?.products || sData?.resp_result?.result || [];
        console.log(`✅ Seller API returned ${Array.isArray(sItems) ? sItems.length : 0} items`);
        return res.json({ success: true, data: { items: Array.isArray(sItems) ? sItems : [] } });
      }
      console.warn(`⚠️ Seller API failed (${sResp.status}). Will try Portals then HTML.`);
    }

    console.log(`🔍 Searching AliExpress Portals API for: ${searchText} (page ${page})`);
    // Portals Open (affiliate) API endpoint
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const params = {
      app_key: ALI_APP_KEY,
      timestamp,
      sign_method: 'md5',
      v: '2',
      page_no: String(page || 1),
      page_size: '40',
      keywords: String(searchText)
    };
    const flat = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
    const signBase = `${ALI_APP_SECRET}${flat}${ALI_APP_SECRET}`;
    const sign = crypto.createHash('md5').update(signBase, 'utf8').digest('hex').toUpperCase();
    const qs = new URLSearchParams({ ...params, sign });
    const url = `https://gw.api.alibaba.com/openapi/param2/2/portals.open/api.listPromotionProduct/${ALI_APP_KEY}?${qs.toString()}`;
    const resp = await fetch(url, { method: 'GET' });
    const text = await resp.text();
    if (!resp.ok) {
      console.warn(`⚠️ Portals API failed (${resp.status}). Falling back to HTML scraper.`);
      try {
        const q = encodeURIComponent(String(searchText));
        const pageNum = Number(page) || 1;
        const scrapeUrl = `https://www.aliexpress.com/w/wholesale-${q}.html?page=${pageNum}`;
        const sResp = await fetch(scrapeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        const sHtml = await sResp.text();
        const $ = cheerio.load(sHtml);
        const sItems = [];
        $('a[href*="/item/"]').slice(0, 48).each((idx, el) => {
          const anchor = $(el);
          const u = anchor.attr('href') || '';
          const container = anchor.closest('div,li');
          let t = anchor.attr('title') || anchor.text().trim();
          if (!t) t = container.find('h1,h2,h3,p,span').first().text().trim();
          const img = container.find('img').attr('src') || container.find('img').attr('image-src') || '';
          const priceText = container.text().match(/\$\s?([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] || '19.99';
          const pr = Number(parseFloat(priceText) || 19.99);
          const ord = Number(container.text().match(/(\d+[\,\.]?\d*)\s*orders?/i)?.[1]?.replace(/[\,\.]/g,'') || Math.floor(Math.random()*5000+200));
          const rat = Number(parseFloat(container.text().match(/(\d\.\d)\s*out of\s*5/i)?.[1] || (3.8 + Math.random()*1.2).toFixed(1)));
          const id = u || `${t}-${idx}`;
          sItems.push({
            id,
            title: t,
            product_title: t,
            image: img,
            product_main_image_url: img,
            price: pr,
            sale_price: pr,
            original_price: Number((pr * 1.15).toFixed(2)),
            app_sale_volume: ord,
            evaluate_rate: rat,
            product_url: u,
            detail_url: u,
            category: 'General'
          });
        });
        console.log(`✅ Fallback scraper extracted ${sItems.length} items`);
        return res.json({ success: true, data: { items: sItems } });
      } catch (scrapeErr) {
        console.warn('⚠️ Fallback scraper failed:', scrapeErr?.message || scrapeErr);
        return res.status(resp.status).json({ success: false, error: text || 'Portals API failed' });
      }
    }

    // Response may be JSON or text; try JSON first
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    const items = data?.result?.products || data?.products || data?.resp_result?.result || [];
    console.log(`✅ Portals returned ${Array.isArray(items) ? items.length : 0} items`);

    return res.json({ success: true, data: { items: Array.isArray(items) ? items : [] } });
  } catch (error) {
    console.error('❌ AliExpress Portals search failed:', error.message || error);
    return res.status(500).json({ success: false, error: error.message || 'Search error' });
  }
});

// Quick connectivity check using merchant profile endpoint
app.get('/api/aliexpress/ping', async (req, res) => {
  try {
    if (!ALI_APP_KEY || !ALI_APP_SECRET) {
      return res.status(500).json({ success: false, error: 'ALI_APP_KEY/ALI_APP_SECRET missing' });
    }
    if (!getAliAccessToken()) {
      return res.status(400).json({ success: false, error: 'ALI_ACCESS_TOKEN missing. Complete OAuth to get a seller access token.' });
    }

    const url = `https://gw.api.alibaba.com/openapi/param2/1/aliexpress.open/aliexpress.solution.merchant.profile.get/${ALI_APP_KEY}?access_token=${encodeURIComponent(getAliAccessToken())}`;
    const resp = await fetch(url);
    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: text });
    }
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return res.json({ success: true, data: json });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Ping failed' });
  }
});

app.post('/api/aliexpress/item-detail', async (req, res) => {
  const { itemId } = req.body;
  
  if (!itemId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Item ID is required' 
    });
  }

  // Create cache key
  const cacheKey = `details:${itemId}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ 
      success: true, 
      data: cached,
      cached: true
    });
  }

  // Check rate limit
  if (!checkRateLimit('aliexpress-details')) {
    console.warn('⚠️ Rate limit exceeded for AliExpress details');
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before trying again.',
      retryAfter: 60
    });
  }

  try {
    console.log(`📦 Getting AliExpress item details for: ${itemId}`);
    
    // Add delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await fetch(`https://aliexpress-datahub.p.rapidapi.com/item_detail_2?itemId=${itemId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com'
      }
    });

    if (response.status === 429) {
      console.warn('⚠️ AliExpress API rate limit hit');
      return res.status(429).json({
        success: false,
        error: 'AliExpress API rate limit exceeded. Please try again in a few minutes.',
        retryAfter: 300
      });
    }

    if (!response.ok) {
      throw new Error(`AliExpress API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.result || data;
    console.log(`✅ Retrieved details for: ${result?.title || 'Unknown item'}`);
    
    // Cache the results
    setCache(cacheKey, result);
    
    res.json({ 
      success: true, 
      data: result
    });

  } catch (error) {
    console.error('❌ AliExpress item detail failed:', error.message);
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before trying again.',
        retryAfter: 300
      });
    }
    
    res.json({
      success: false,
      error: `Item detail failed: ${error.message}`
    });
  }
});

app.post('/api/aliexpress/categories', async (req, res) => {
  try {
    console.log('📂 Getting AliExpress categories');
    
    const response = await fetch('https://aliexpress-datahub.p.rapidapi.com/categories', {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`AliExpress API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Retrieved ${data.result?.length || 0} categories`);
    
    res.json({ 
      success: true, 
      data: data.result || data
    });

  } catch (error) {
    console.error('❌ AliExpress categories failed:', error.message);
    res.json({
      success: false,
      error: `Categories failed: ${error.message}`
    });
  }
});

app.post('/api/aliexpress/item-reviews', async (req, res) => {
  const { itemId, page = 1 } = req.body;
  
  if (!itemId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Item ID is required' 
    });
  }

  try {
    console.log(`⭐ Getting reviews for item: ${itemId}`);
    
    const response = await fetch(`https://aliexpress-datahub.p.rapidapi.com/item_review_1?itemId=${itemId}&page=${page}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`AliExpress API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Retrieved reviews for item`);
    
    res.json({ 
      success: true, 
      data: data.result || data
    });

  } catch (error) {
    console.error('❌ AliExpress reviews failed:', error.message);
    res.json({
      success: false,
      error: `Reviews failed: ${error.message}`
    });
  }
});

// AI Product Enhancement endpoint (automatic title improvement)
app.post('/api/ai/enhance-product', async (req, res) => {
  const { productInfo } = req.body;
  
  if (!OPENAI_KEY) {
    return res.json({
      success: false,
      error: 'OpenAI API key not configured'
    });
  }

  if (!productInfo || !productInfo.name) {
    return res.status(400).json({
      success: false,
      error: 'Product info with name is required'
    });
  }

  try {
    console.log(`🔧 Enhancing product title: "${productInfo.name}"`);

    const prompt = `Transform this AliExpress product into an irresistible, premium fashion item:

**Current Title:** ${productInfo.name}
**Category:** ${productInfo.category || 'Fashion'}
**Price:** $${productInfo.price || 'N/A'}
**Original Description:** ${productInfo.originalDescription || 'No description provided'}

Create a compelling, sellable version that:
1. Removes any obvious "dropshipping" or "cheap" language
2. Makes it sound premium and desirable
3. Focuses on benefits and lifestyle appeal
4. Uses modern, trendy language that Gen Z/Millennials love
5. Creates urgency and desire

Respond ONLY with valid JSON in this format:
{
  "title": "An irresistible, premium-sounding title (max 60 chars)",
  "shortDescription": "A compelling 1-2 sentence hook (max 120 chars)",
  "category": "${productInfo.category || 'Fashion'}",
  "tags": ["modern", "trendy", "premium", "stylish", "aesthetic"]
}

Make it sound like something from a high-end boutique, not AliExpress.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a premium fashion brand copywriter. Transform cheap-sounding product titles into premium, desirable ones. Focus on lifestyle, benefits, and emotional appeal. Always respond with valid JSON only.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let enhancement;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enhancement = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON:', aiResponse);
      // Fallback enhancement
      enhancement = {
        title: productInfo.name.length > 60 ? productInfo.name.substring(0, 57) + '...' : productInfo.name,
        shortDescription: `Premium ${productInfo.category.toLowerCase()} perfect for your style`,
        category: productInfo.category,
        tags: ['premium', 'trendy', 'stylish', 'modern', 'aesthetic']
      };
    }

    res.json({
      success: true,
      enhancement: enhancement,
      original: productInfo.name
    });

  } catch (error) {
    console.error('❌ Product enhancement failed:', error);
    
    // Return fallback enhancement
    const fallbackEnhancement = {
      title: productInfo.name.length > 60 ? productInfo.name.substring(0, 57) + '...' : productInfo.name,
      shortDescription: `Premium ${productInfo.category.toLowerCase()} for the modern aesthetic`,
      category: productInfo.category,
      tags: ['trendy', 'premium', 'stylish']
    };

    res.json({
      success: true,
      enhancement: fallbackEnhancement,
      fallback: true,
      error: error.message
    });
  }
});

// Chat endpoint for chatbot (forces English replies)
app.post('/api/chat', async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      return res.status(500).json({ success: false, error: 'OpenAI API key not configured' });
    }

    const { messages = [], model = 'gpt-4o-mini' } = req.body || {};
    const temperature = 0.4;
    const max_tokens = Math.min(220, Number(req.body?.max_tokens || 220) || 220);

    const systemMessage = {
      role: 'system',
      content:
        'You are a helpful teammate for a dropshipping platform (AutoDrops). Default to 1–3 sentences (max ~80 words). Be direct, practical, and human; use light contractions; no filler or apologies unless needed; no emojis. Prefer brief bullets only if it improves clarity. Keep responses high-level unless the user asks for specifics. Always respond in English. If key details are missing, ask one short clarifying question.'
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages: [systemMessage, ...messages],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ success: false, error: err?.error?.message || 'OpenAI error' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ success: true, reply });
  } catch (e) {
    console.error('❌ Chat endpoint failed:', e.message || e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// AliExpress OAuth start: returns authorization URL
app.get('/api/aliexpress/auth/start', (req, res) => {
  try {
    if (!ALI_APP_KEY) {
      return res.status(500).json({ success: false, error: 'ALI_APP_KEY missing' });
    }
    const state = Math.random().toString(36).slice(2);
    const redirect = encodeURIComponent(ALI_REDIRECT_URI);
    const url = `https://oauth.aliexpress.com/authorize?response_type=code&client_id=${ALI_APP_KEY}&redirect_uri=${redirect}&state=${state}`;
    return res.json({ success: true, url, state });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Auth start failed' });
  }
});

// AliExpress OAuth callback: exchanges code for access token
app.get('/api/aliexpress/auth/callback', async (req, res) => {
  try {
    const code = req.query.code || req.query.auth_code || req.query.authorization_code;
    if (!code) {
      return res.status(400).send('Missing code');
    }
    if (!ALI_APP_KEY || !ALI_APP_SECRET) {
      return res.status(500).send('App credentials missing');
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ALI_APP_KEY,
      client_secret: ALI_APP_SECRET,
      redirect_uri: ALI_REDIRECT_URI,
      code: String(code)
    });
    const tokenResp = await fetch('https://oauth.aliexpress.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const tText = await tokenResp.text();
    if (!tokenResp.ok) {
      return res.status(tokenResp.status).send(tText || 'Token exchange failed');
    }
    let json; try { json = JSON.parse(tText); } catch { json = { raw: tText }; }
    const accessToken = json.access_token || json.accessToken || '';
    const refreshToken = json.refresh_token || json.refreshToken || '';
    setAliTokens(accessToken, refreshToken);
    return res.send('AliExpress authorization successful. You can close this window.');
  } catch (e) {
    return res.status(500).send(e.message || 'Auth callback failed');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Shopify & WooCommerce Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to proxy requests to both Shopify and WooCommerce APIs`);
}); 