const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Add dotenv support

const app = express();
const PORT = process.env.PORT || 3001;

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
console.log('RapidAPI Key:', process.env.RAPIDAPI_KEY ? '✅ Configured' : '❌ Missing');

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
  const { searchText, page = 1, category = '', minPrice = '', maxPrice = '' } = req.body;
  
  // Use hardcoded API key for new service
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = 'aliexpress-datahub.p.rapidapi.com';
  
  if (!searchText) {
    return res.status(400).json({ 
      success: false, 
      error: 'Search text is required' 
    });
  }

  // Create cache key
  const cacheKey = `search:${searchText}:${page}:${category}:${minPrice}:${maxPrice}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ 
      success: true, 
      data: { items: cached },
      cached: true
    });
  }

  // Check rate limit
  if (!checkRateLimit('aliexpress-search')) {
    console.warn('⚠️ Rate limit exceeded for AliExpress search');
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before trying again.',
      retryAfter: 60
    });
  }

  try {
    console.log(`🔍 Searching AliExpress for: ${searchText} using new RapidAPI service`);
    
    // Build query parameters for new API
    let queryParams = `q=${encodeURIComponent(searchText)}`;
    if (page) queryParams += `&page=${page}`;
    if (category) queryParams += `&category=${encodeURIComponent(category)}`;
    if (minPrice) queryParams += `&min_price=${minPrice}`;
    if (maxPrice) queryParams += `&max_price=${maxPrice}`;

    // Add delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try the item_search_2 endpoint for product search
    const response = await fetch(`https://${RAPIDAPI_HOST}/item_search_2?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Accept': 'application/json'
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
    console.log('🔍 API Response received:', data);
    
    // Extract products from API response (aliexpress-datahub format)
    const products = data.result?.resultList || [];
    console.log(`✅ Found ${products.length} products from API`);
    
    // Cache the results
    setCache(cacheKey, products);
    
    res.json({ 
      success: true, 
      data: { items: products }
    });

  } catch (error) {
    console.error('❌ AliExpress search failed:', error.message);
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before trying again.',
        retryAfter: 300
      });
    }
    
    res.json({
      success: false,
      error: `Search failed: ${error.message}`
    });
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

app.listen(PORT, () => {
  console.log(`🚀 Shopify & WooCommerce Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to proxy requests to both Shopify and WooCommerce APIs`);
}); 