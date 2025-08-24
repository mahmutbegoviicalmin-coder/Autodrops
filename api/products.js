// CJ Dropshipping API Integration for Vercel
import fetch from 'node-fetch';

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

// Rate limiting and caching
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
    return cached.data;
  }
  return null;
}

function setCached(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export default async function handler(req, res) {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.action === 'search') {
          return await handleProductSearch(req, res);
        } else if (query.action === 'categories') {
          return await handleCategories(req, res);
        } else if (query.action === 'details') {
          return await handleProductDetails(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Product search handler
async function handleProductSearch(req, res) {
  const { q: query, page = 1, limit = 20, category, minPrice, maxPrice } = req.query;
  
  // Check rate limit
  if (!checkRateLimit()) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  // Create cache key
  const cacheKey = `search_${query}_${page}_${limit}_${category}_${minPrice}_${maxPrice}`;
  
  // Check cache
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    // CJ Dropshipping API call
    const apiUrl = 'https://developers.cjdropshipping.com/api2.0/v1/product/list';
    const headers = {
      'CJ-Access-Token': process.env.CJ_ACCESS_TOKEN || '',
      'Content-Type': 'application/json'
    };

    const params = new URLSearchParams({
      pageNum: page,
      pageSize: limit,
      ...(query && { productName: query }),
      ...(category && { categoryId: category }),
      ...(minPrice && { priceMin: minPrice }),
      ...(maxPrice && { priceMax: maxPrice })
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`CJ API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform data to match frontend expectations
    const transformedData = {
      products: data.data?.list?.map(product => ({
        id: product.productId,
        name: product.productName,
        price: product.sellPrice,
        originalPrice: product.listPrice,
        image: product.productImage,
        category: product.categoryName,
        rating: product.productScore || 4.5,
        sales: product.sellNum || 0,
        description: product.productDescription
      })) || [],
      total: data.data?.total || 0,
      page: parseInt(page),
      totalPages: Math.ceil((data.data?.total || 0) / limit)
    };

    // Cache the result
    setCached(cacheKey, transformedData);

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// Categories handler
async function handleCategories(req, res) {
  // Check rate limit
  if (!checkRateLimit()) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  const cacheKey = 'categories';
  
  // Check cache
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    // CJ Dropshipping Categories API
    const apiUrl = 'https://developers.cjdropshipping.com/api2.0/v1/product/getCategory';
    const headers = {
      'CJ-Access-Token': process.env.CJ_ACCESS_TOKEN || '',
      'Content-Type': 'application/json'
    };

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`CJ API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform categories data
    const categories = data.data?.map(cat => ({
      id: cat.categoryId,
      name: cat.categoryName,
      parentId: cat.parentId,
      level: cat.level
    })) || [];

    // Cache the result
    setCached(cacheKey, { categories });

    res.status(200).json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

// Product details handler
async function handleProductDetails(req, res) {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check rate limit
  if (!checkRateLimit()) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  const cacheKey = `product_details_${productId}`;
  
  // Check cache
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    // CJ Dropshipping Product Details API
    const apiUrl = 'https://developers.cjdropshipping.com/api2.0/v1/product/query';
    const headers = {
      'CJ-Access-Token': process.env.CJ_ACCESS_TOKEN || '',
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${apiUrl}?productId=${productId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`CJ API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = data.data;
    
    // Transform product details
    const productDetails = {
      id: product.productId,
      name: product.productName,
      price: product.sellPrice,
      originalPrice: product.listPrice,
      images: product.productImages || [product.productImage],
      category: product.categoryName,
      rating: product.productScore || 4.5,
      sales: product.sellNum || 0,
      description: product.productDescription,
      variants: product.variants || [],
      specifications: product.specifications || {},
      shipping: product.shippingInfo || {}
    };

    // Cache the result
    setCached(cacheKey, productDetails);

    res.status(200).json(productDetails);
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
}
