import { Product } from '../types';
import { cacheManager, CACHE_CONFIGS } from './cacheManager';

// CJDropshipping API Configuration
const CJ_API_KEY = 'b386e9e0e9084294a32177bbb518bf8e';
const CJ_API_BASE_URL = (typeof window !== 'undefined' ? 'http://localhost:3001' : 'https://developers.cjdropshipping.com/api2.0/v1');
// SerpAPI (Google Shopping) for avg market price
const SERP_API_KEY = '62ef8c0170354f439e535c5a20d4d13145762558';

// API Rate Limits and Token Life:
// - Authentication can only be called once every 5 minutes
// - Access token life: 15 days
// - Refresh token life: 180 days
// - Free users: Maximum 1000 requests per day (2024-09-30 update)
// - One IP limited to maximum 3 users (2024-09-30 update)
// - Maximum 200 data per page

interface CJAuthResponse {
  code: number;
  result: boolean;
  message: string;
  data: {
    accessToken: string;
    accessTokenExpiryDate: string;
    refreshToken: string;
    refreshTokenExpiryDate: string;
    createDate: string;
  } | null;
  requestId: string;
}

interface CJVariant {
  vid: string;
  pid: string;
  variantName?: string;
  variantNameEn: string;
  variantSku: string;
  variantUnit?: string;
  variantProperty?: string;
  variantKey: string;
  variantLength: number;
  variantWidth: number;
  variantHeight: number;
  variantVolume: number;
  variantWeight: number;
  variantSellPrice: number;
  createTime?: string;
}

interface CJProduct {
  pid: string;
  productName: string;
  productNameEn: string;
  productSku: string;
  productImage: string;
  productWeight: number;
  productType: string;
  productUnit: string;
  sellPrice: number;
  categoryId: string;
  categoryName: string;
  sourceFrom: number;
  remark?: string;
  createTime?: string;
  customizationVersion?: number;
  listedNum?: number;
  supplierName?: string;
  supplierId?: string;
  status?: string;
  deliveryTime?: number; // Hours: 24, 48, 72, or null
  isVideo?: number; // Is there a video
  saleStatus?: number; // Sale status
  variants?: CJVariant[];
}

interface SearchParams {
  searchText: string;
  page?: number;
  pageSize?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  productType?: 'ORDINARY_PRODUCT' | 'SUPPLIER_PRODUCT';
  deliveryTime?: '24' | '48' | '72'; // Expected to ship within hours
  searchType?: 0 | 2 | 21; // 0=All products, 2=Trending, 21=Trending View More
  countryCode?: string; // e.g., 'CN', 'US'
}

export class CJDropshippingApiService {
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;
  private static accessTokenExpiry: Date | null = null;
  private static lastAuthTime: Date | null = null;

  // Parse price values that may be numbers, numeric strings, or ranges like "0.13 -- 1.30"
  private static normalizePrice(value: any): number {
    if (typeof value === 'number') {
      return isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const matches = value.match(/[0-9]+(?:\.[0-9]+)?/g);
      if (matches && matches.length > 0) {
        const numbers = matches.map((m) => parseFloat(m)).filter((n) => isFinite(n));
        if (numbers.length === 1) return numbers[0];
        if (numbers.length >= 2) {
          const min = Math.min(...numbers);
          const max = Math.max(...numbers);
          return (min + max) / 2;
        }
      }
    }
    return 0;
  }

  // Force a price to end with .99 (psychological pricing)
  private static forceEndingNinetyNine(value: number): number {
    if (!isFinite(value) || value <= 0) return 0.99;
    const centsRounded = Math.round(value * 100) / 100;
    const integerApprox = Math.round(centsRounded);
    const isIntegerCents = Math.abs(centsRounded - integerApprox) < 1e-6;
    if (isIntegerCents) {
      // If ends with .00, reverse to previous integer .99 (e.g., 3.00 -> 2.99)
      const prevInt = Math.max(0, integerApprox - 1);
      return Math.max(0.99, prevInt + 0.99);
    }
    const integerPart = Math.floor(value);
    return integerPart + 0.99;
  }

  // Authentication kept for completeness but NOT used by client anymore
  private static async authenticate(): Promise<string> {
    try {
      console.log('🔐 Authenticating with CJDropshipping API...');
      // Client-side auth disabled; call proxy to ensure token (no-op for client)
      const response = await fetch(`${CJ_API_BASE_URL}/cj/auth/getAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const authData: CJAuthResponse = await response.json();
      if (!response.ok || authData.code !== 200 || !authData.result) {
        throw new Error('Proxy error');
      }
      // We don't need to store token on client; proxy holds it
      return 'ok';
    } catch (error) {
      console.error('❌ CJDropshipping authentication failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Make API request via local proxy (no client token)
  private static async makeApiRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    // Build query string for GET requests
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const queryString = queryParams.toString();
    const url = `${CJ_API_BASE_URL}/cj/${endpoint}${queryString ? `?${queryString}` : ''}`;

    try { console.log(`🚀 CJ API REQUEST (proxied) to: ${endpoint}`, params); } catch {}

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Avoid large logs that can freeze DevTools
    try { console.log(`📡 Response status: ${response.status} ${response.statusText}`); } catch {}

    if (!response.ok) {
      const errorText = await response.text();
      try { console.error(`❌ API Error (${response.status})`); } catch {}
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    try { console.log(`✅ SUCCESS - API Response (truncated)`); } catch {}
    return data;
  }

  // Search for products
  static async searchProducts(params: SearchParams): Promise<Product[]> {
    try {
      console.log(`🔍 Searching CJDropshipping for: ${params.searchText}`);

      // Create cache key
      const cacheKey = 'cj_product_search';
      const cacheParams = {
        searchText: params.searchText,
        page: params.page || 1,
        categoryId: params.categoryId
      };

      // FORCE FRESH DATA - Cache disabled to ensure real CJ API data
      console.log('🚫 Cache disabled - forcing fresh API call to CJ Dropshipping');
      // const cachedProducts = cacheManager.get<Product[]>(cacheKey, cacheParams);
      // if (cachedProducts) {
      //   console.log(`🎯 Cache hit! Returning ${cachedProducts.length} cached products`);
      //   return cachedProducts;
      // }

      // Make API request to search products using correct endpoint
      const searchData = await this.makeApiRequest('product/list', {
        pageNum: params.page || 1,
        pageSize: Math.min(params.pageSize || 20, 200), // Max 200 per page
        productNameEn: params.searchText,
        categoryId: params.categoryId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        productType: params.productType,
        deliveryTime: params.deliveryTime,
        searchType: params.searchType || 0,
        countryCode: params.countryCode
      });

      if (!searchData.result || !searchData.data || !searchData.data.list) {
        throw new Error(`Search failed: ${searchData.message}`);
      }

      // Map the response to our Product interface
      const products = this.mapApiResponseToProducts(searchData.data.list, params.searchText);

      // Cache the successful results
      cacheManager.set(cacheKey, cacheParams, products, CACHE_CONFIGS.SEARCH_RESULTS);

      console.log(`✅ Mapped and cached ${products.length} products from CJDropshipping`);
      return products;

    } catch (error) {
      console.error('❌ CJDropshipping search error:', error);
      throw new Error(`CJDropshipping API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search for high-order-count products with trending boost
  static async searchHighOrderProducts(limit: number = 100, categoryFilter?: string): Promise<Product[]> {
    console.log(`🔍 searchHighOrderProducts called with limit: ${limit}, category: ${categoryFilter || 'all'}`);
    // Simple approach - get products and filter for trending ones
    const results: Product[] = [];
    const seen = new Set<string>();

    try {
      const searchData = await this.makeApiRequest('product/list', {
        pageNum: 1,
        pageSize: 200
      });
      
      const rawList = (searchData && searchData.data && Array.isArray(searchData.data.list)) ? searchData.data.list : [];
      console.log(`📦 Got ${rawList.length} products from CJ API`);
      
      for (const item of rawList) {
        if (results.length >= limit) break;
        
        const product = this.mapSingleProductFromApi(item);
        if (!product || seen.has(product.id)) continue;
        seen.add(product.id);
        
        // Skip clothing and winter items
        const title = (product.title || '').toLowerCase();
        if (title.includes('clothing') || title.includes('clothes') || title.includes('shirt') || 
            title.includes('dress') || title.includes('winter') || title.includes('christmas')) {
          continue;
        }
        
        // Category filtering
        if (categoryFilter && categoryFilter !== '' && categoryFilter !== '🔥 All Categories') {
          const matchesCategory = this.matchesCategory(title, categoryFilter);
          console.log(`🔍 Checking product "${title.substring(0, 30)}..." for category "${categoryFilter}": ${matchesCategory ? 'MATCH' : 'SKIP'}`);
          if (!matchesCategory) continue;
        }
        
        // Get order count
        const orderCount = Number((item as any).orderCount ?? (item as any).orders ?? (item as any).listedNum ?? 0);
        product.monthlyOrders = Math.max(product.monthlyOrders ?? 0, orderCount);
        
        // Only include products with some orders
        if ((product.monthlyOrders ?? 0) >= 100) {
          // Boost tech/smart/trending products
          if (title.includes('smart') || title.includes('tech') || title.includes('wireless') ||
              title.includes('kitchen') || title.includes('pet') || title.includes('fitness')) {
            product.trendingScore = (product.trendingScore || 0) + 50;
          }
          
          results.push(product);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching trending products:', error);
      return [];
    }
    
    // Sort by trending score and monthly orders
    results.sort((a, b) => 
      (b.trendingScore ?? 0) - (a.trendingScore ?? 0) || 
      (b.monthlyOrders ?? 0) - (a.monthlyOrders ?? 0)
    );
    
    console.log(`✅ Found ${results.length} trending products`);
    return results.slice(0, limit);
  }

  // Helper: Check if product matches category
  private static matchesCategory(title: string, category: string): boolean {
    const lowerTitle = title.toLowerCase();
    
    switch (category) {
      case 'electronics':
        return lowerTitle.includes('electronic') || lowerTitle.includes('smart') || 
               lowerTitle.includes('bluetooth') || lowerTitle.includes('wireless') ||
               lowerTitle.includes('led') || lowerTitle.includes('usb') || 
               lowerTitle.includes('charger') || lowerTitle.includes('speaker');
               
      case 'home-kitchen':
        return lowerTitle.includes('kitchen') || lowerTitle.includes('cooking') ||
               lowerTitle.includes('storage') || lowerTitle.includes('organizer') ||
               lowerTitle.includes('utensil') || lowerTitle.includes('home') ||
               lowerTitle.includes('decor') || lowerTitle.includes('cleaning');
               
      case 'health-beauty':
        return lowerTitle.includes('beauty') || lowerTitle.includes('skincare') ||
               lowerTitle.includes('massage') || lowerTitle.includes('health') ||
               lowerTitle.includes('cosmetic') || lowerTitle.includes('facial') ||
               lowerTitle.includes('cream') || lowerTitle.includes('serum');
               
      case 'sports-fitness':
        return lowerTitle.includes('fitness') || lowerTitle.includes('workout') ||
               lowerTitle.includes('exercise') || lowerTitle.includes('gym') ||
               lowerTitle.includes('yoga') || lowerTitle.includes('sport') ||
               lowerTitle.includes('muscle') || lowerTitle.includes('training');
               
      case 'pets':
        return lowerTitle.includes('pet') || lowerTitle.includes('dog') ||
               lowerTitle.includes('cat') || lowerTitle.includes('animal') ||
               lowerTitle.includes('puppy') || lowerTitle.includes('kitten') ||
               lowerTitle.includes('bird') || lowerTitle.includes('fish');
               
      case 'automotive':
        return lowerTitle.includes('car') || lowerTitle.includes('auto') ||
               lowerTitle.includes('vehicle') || lowerTitle.includes('driving') ||
               lowerTitle.includes('wheel') || lowerTitle.includes('engine') ||
               lowerTitle.includes('motorcycle') || lowerTitle.includes('truck');
               
      case 'toys-games':
        return lowerTitle.includes('toy') || lowerTitle.includes('game') ||
               lowerTitle.includes('puzzle') || lowerTitle.includes('play') ||
               lowerTitle.includes('kids') || lowerTitle.includes('children') ||
               lowerTitle.includes('educational') || lowerTitle.includes('fun');
               
      case 'jewelry':
        return lowerTitle.includes('jewelry') || lowerTitle.includes('necklace') ||
               lowerTitle.includes('earring') || lowerTitle.includes('bracelet') ||
               lowerTitle.includes('ring') || lowerTitle.includes('watch') ||
               lowerTitle.includes('pendant') || lowerTitle.includes('chain');
               
      case 'tools':
        return lowerTitle.includes('tool') || lowerTitle.includes('screwdriver') ||
               lowerTitle.includes('hammer') || lowerTitle.includes('drill') ||
               lowerTitle.includes('repair') || lowerTitle.includes('fix') ||
               lowerTitle.includes('hardware') || lowerTitle.includes('wrench');
               
      case 'outdoor':
        return lowerTitle.includes('outdoor') || lowerTitle.includes('camping') ||
               lowerTitle.includes('hiking') || lowerTitle.includes('backpack') ||
               lowerTitle.includes('tent') || lowerTitle.includes('survival') ||
               lowerTitle.includes('adventure') || lowerTitle.includes('nature');
               
      default:
        return true; // Show all if no specific category
    }
  }

  // Get product reviews for analysis
  static async getProductReviews(productId: string, page: number = 1): Promise<any> {
    try {
      console.log(`📝 Getting reviews for CJ product: ${productId}`);

      // Check cache first
      const cacheKey = 'cj_product_reviews';
      const cacheParams = { productId, page };

      const cachedReviews = cacheManager.get<any>(cacheKey, cacheParams);
      if (cachedReviews) {
        console.log(`🎯 Cache hit! Returning cached reviews for: ${productId}`);
        return cachedReviews;
      }

      // Make API request using the newer endpoint (proxied)
      const reviewData = await this.makeApiRequest('product/productComments', {
        pid: productId,
        pageNum: page,
        pageSize: 20
      });

      if (reviewData.success && reviewData.data) {
        // Cache reviews
        cacheManager.set(cacheKey, cacheParams, reviewData.data, CACHE_CONFIGS.REVIEWS);
        console.log(`✅ Retrieved and cached reviews for: ${productId}`);
        return reviewData.data;
      }

      return null;

    } catch (error) {
      console.error('❌ CJDropshipping reviews error:', error);
      return null;
    }
  }

  // Get product inventory by SKU
  static async getProductInventory(sku: string): Promise<any> {
    try {
      console.log(`📦 Getting inventory for SKU: ${sku}`);
      
      // Check cache first
      const cacheKey = 'cj_product_inventory';
      const cacheParams = { sku };
      
      const cachedInventory = cacheManager.get<any>(cacheKey, cacheParams);
      if (cachedInventory) {
        console.log(`🎯 Cache hit! Returning cached inventory for: ${sku}`);
        return cachedInventory;
      }
      
      // Make API request
      const inventoryData = await this.makeApiRequest('product/stock/queryBySku', {
        sku: sku
      });
      
      if (inventoryData.result && inventoryData.data) {
        // Cache inventory data (shorter cache time as it changes frequently)
        cacheManager.set(cacheKey, cacheParams, inventoryData.data, 30 * 60 * 1000); // 30 minutes
        console.log(`✅ Retrieved and cached inventory for: ${sku}`);
        return inventoryData.data;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ CJDropshipping inventory error:', error);
      return null;
    }
  }

  // Get detailed product information
  static async getProductDetails(productId: string): Promise<Product | null> {
    try {
      console.log(`📦 Getting CJDropshipping product details for: ${productId}`);

      // Check cache first
      const cacheKey = 'cj_product_details';
      const cacheParams = { productId };

      const cachedProduct = cacheManager.get<Product>(cacheKey, cacheParams);
      if (cachedProduct) {
        console.log(`🎯 Cache hit! Returning cached product details for: ${productId}`);
        return cachedProduct;
      }

      // Make API request
      const productData = await this.makeApiRequest('product/query', {
        pid: productId
      });

      if (!productData.result || !productData.data) {
        throw new Error('Product details not found');
      }

      const product = this.mapSingleProductFromApi(productData.data);

      if (product) {
        // Cache product details
        cacheManager.set(cacheKey, cacheParams, product, CACHE_CONFIGS.PRODUCT_DETAILS);
        console.log(`✅ Retrieved and cached details for: ${product.title}`);
      }

      return product;

    } catch (error) {
      console.error('❌ CJDropshipping product details error:', error);
      return null;
    }
  }

  // Get categories for filtering
  static async getCategories() {
    try {
      console.log('📂 Getting CJDropshipping categories');

      // Check cache first
      const cacheKey = 'cj_categories';
      const cacheParams = {};

      const cachedCategories = cacheManager.get<any>(cacheKey, cacheParams);
      if (cachedCategories) {
        console.log(`🎯 Cache hit! Returning cached categories`);
        return cachedCategories;
      }

      // Make API request
      const categoryData = await this.makeApiRequest('product/getCategory');

      if (!categoryData.result || !categoryData.data) {
        throw new Error('Failed to fetch categories');
      }

      // Map CJ's nested category structure to flat list
      const categories: Array<{id: string, name: string}> = [];

      categoryData.data.forEach((firstLevel: any) => {
        if (firstLevel.categoryFirstList) {
          firstLevel.categoryFirstList.forEach((secondLevel: any) => {
            if (secondLevel.categorySecondList) {
              secondLevel.categorySecondList.forEach((thirdLevel: any) => {
                if (thirdLevel.categoryId && thirdLevel.categoryName) {
                  categories.push({
                    id: thirdLevel.categoryId,
                    name: thirdLevel.categoryName
                  });
                }
              });
            }
          });
        }
      });

      // Cache categories
      cacheManager.set(cacheKey, cacheParams, categories, CACHE_CONFIGS.CATEGORIES);
      console.log(`✅ Loaded ${categories.length} categories from CJDropshipping`);
      return categories;

    } catch (error) {
      console.error('❌ CJDropshipping categories error:', error);
      // Return default categories as fallback
      return [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Fashion' },
        { id: '3', name: 'Home & Garden' },
        { id: '4', name: 'Sports & Outdoors' },
        { id: '5', name: 'Health & Beauty' },
        { id: '6', name: 'Toys & Games' },
        { id: '7', name: 'Automotive' }
      ];
    }
  }

  // Map API response to our Product interface
  private static mapApiResponseToProducts(apiData: CJProduct[], searchText: string): Product[] {
    const products: Product[] = [];

    if (Array.isArray(apiData)) {
      apiData.forEach((item: CJProduct, index: number) => {
        const product = this.mapSingleProductFromApi(item, `${searchText}-${index}`);
        if (product) {
          products.push(product);
        }
      });
    }

    return products;
  }

  // Map a single product from API response
  public static mapSingleProductFromApi(apiItem: CJProduct, fallbackId?: string): Product | null {
    if (!apiItem) return null;

    try {
      const id = apiItem.pid || fallbackId || Math.random().toString();
      let title = (apiItem as any).productNameEn || (apiItem as any).productName || 'Unknown Product';
      // Some CJ records have productName as a JSON-like array string, parse and pick first meaningful entry
      if (!((apiItem as any).productNameEn) && typeof (apiItem as any).productName === 'string' && (apiItem as any).productName.trim().startsWith('[')) {
        try {
          const arr = JSON.parse((apiItem as any).productName);
          if (Array.isArray(arr) && arr.length > 0) {
            const first = arr.find((s: any) => typeof s === 'string' && s.trim().length > 0);
            if (first) title = first;
          }
        } catch {}
      }
      const imageUrl = (apiItem as any).productImage || '/placeholder-product.jpg';
      const priceNumber = this.normalizePrice((apiItem as any).sellPrice); // our cost
      const recommendedPriceNumber = priceNumber * 2.5; // target markup 2.5x
      const originalPriceNumber = recommendedPriceNumber * 1.15; // strike-through +15%
      const rating = 0; // Default until enriched via product comments
      const reviewCount = Number((apiItem as any).listedNum ?? 0); // Use listed number as proxy for popularity
      const stockAvailable = 0; // Default until enriched via inventory endpoint

      // Apply psychological pricing (.99)
      const displayPrice = this.forceEndingNinetyNine(recommendedPriceNumber);
      const displayOriginalPrice = this.forceEndingNinetyNine(originalPriceNumber);

      // Delivery time: keep simple default since no delivery endpoint
      let deliveryTime = '5-10 days';

      // Calculate profit margin based on selling price vs cost
      const profitMargin = displayPrice > 0
        ? Math.round(((displayPrice - priceNumber) / displayPrice) * 100)
        : 0;

      // CACHE DISABLED FOR PERFORMANCE - calculate monthly orders directly
      // const cacheKey = 'product_monthly_orders';
      // const cacheParams = { productId: id.toString(), listedNum: Number((apiItem as any).listedNum ?? 0), price: displayPrice };
      
      let monthlyOrders: number | null = null; // Force calculation
      
      if (monthlyOrders === null) {
        const listedNum = Number((apiItem as any).listedNum ?? 0);
        
        // Deterministički generator na bazi ID-a za stabilnost
        const seed = parseInt(id.toString().slice(-6), 16) || 1;
        const deterministicRandom = (seed * 9301 + 49297) % 233280 / 233280; // 0..1
        
        // Skalirane procjene kako bi top proizvodi imali 3k+ mjesečno
        if (listedNum > 5000) {
          monthlyOrders = Math.floor(5000 + deterministicRandom * 7000); // 5000-12000
        } else if (listedNum > 1000) {
          monthlyOrders = Math.floor(1500 + deterministicRandom * 3500); // 1500-5000
        } else if (listedNum > 300) {
          monthlyOrders = Math.floor(800 + deterministicRandom * 700); // 800-1500
        } else if (listedNum > 100) {
          monthlyOrders = Math.floor(300 + deterministicRandom * 500); // 300-800
        } else {
          monthlyOrders = Math.floor(80 + deterministicRandom * 220); // 80-300
        }

        // Korekcija po cjenovnom razredu
        if (displayPrice > 50) monthlyOrders = Math.floor(monthlyOrders * 0.8);
        if (displayPrice > 100) monthlyOrders = Math.floor(monthlyOrders * 0.6);
        if (displayPrice < 10) monthlyOrders = Math.floor(monthlyOrders * 1.2);
        
        // CACHE DISABLED FOR PERFORMANCE
        // cacheManager.set(cacheKey, cacheParams, monthlyOrders, 24 * 60 * 60 * 1000);
      }

      // If API provides explicit order count, prefer it over estimation
      const apiOrderCount = Number((apiItem as any).orderCount ?? (apiItem as any).orders ?? (apiItem as any).monthlyOrders ?? 0);
      if (isFinite(apiOrderCount) && apiOrderCount > 0) {
        monthlyOrders = apiOrderCount;
      }

            // CACHE DISABLED FOR PERFORMANCE - calculate delivery days directly  
      // const deliveryCacheKey = 'product_delivery_days';
      // const deliveryCacheParams = { productId: id.toString(), deliveryTime: (apiItem as any).deliveryTime };

      let deliveryDays: number | null = null; // Force calculation
      
      if (deliveryDays === null) {
        deliveryDays = (apiItem as any).deliveryTime 
          ? Math.max(1, Math.floor((apiItem as any).deliveryTime / 24))
          : Math.floor((parseInt(id.toString().slice(-6), 16) || 1) * 9301 + 49297) % 233280 / 233280 * 10 + 5; // 5-15 days default (deterministic)
          
        // CACHE DISABLED FOR PERFORMANCE
        // cacheManager.set(deliveryCacheKey, deliveryCacheParams, deliveryDays, 24 * 60 * 60 * 1000);
      }

      // Generate tags based on category and product name
      const tags = this.generateTags(apiItem);

      // Map sourceFrom number to location
      const supplierLocation = (apiItem as any).sourceFrom === 1 ? 'China' : 'International';
      const sku = (apiItem as any).productSku || (apiItem as any).variantSku;

      const product: Product = {
        id: id.toString(),
        title: title,
        // productName: title, // REMOVED - not part of Product interface
        price: Math.round(displayPrice * 100) / 100,
        originalPrice: Math.round(displayOriginalPrice * 100) / 100,
        sellPrice: Math.round(priceNumber * 100) / 100,
        imageUrl: imageUrl,
        category: (apiItem as any).categoryName || 'General',
        supplier: (apiItem as any).supplierName || 'CJDropshipping',
        supplierLocation: supplierLocation,
        supplierUrl: `https://app.cjdropshipping.com/product-detail/${id}`,
        rating: rating,
        reviewCount: reviewCount,
        profitMargin: profitMargin,
        // Demand/Trending score: popularity (listedNum normalized to 0..1 at 500+) 60% + rating (0..1) 40%
        trendingScore: Math.round(
          Math.min(1, Math.max(0, reviewCount / 500)) * 60 + // 0..60
          Math.min(1, Math.max(0, rating / 5)) * 40           // 0..40
        ),
        competitionLevel: reviewCount > 500 ? 'High' : reviewCount > 100 ? 'Medium' : 'Low',
        tags: tags,
        materialTags: this.extractMaterials(title),
        deliveryTime: deliveryTime,
        deliveryDays: deliveryDays,
        stockAvailable: stockAvailable,
        sku: sku,
        monthlyOrders: monthlyOrders,
        // Enhanced fields
        costPrice: Math.round(priceNumber * 100) / 100,
        profitAmount: Math.round((displayPrice - priceNumber) * 100) / 100,
        monthlyRevenue: Math.round((monthlyOrders * displayPrice) * 100) / 100,
        revenueConfidence: Number((apiItem as any).listedNum ?? 0) > 1000 ? 'high' : Number((apiItem as any).listedNum ?? 0) > 100 ? 'medium' : 'low',
        shippingCost: Math.round(Math.max(2.99, (0.5 + (parseInt(id.toString().slice(-2), 16) || 1) / 100) * 1.5) * 100) / 100,
        expressAvailable: ((apiItem as any).productWeight || 0.5) < 2,
        inventory: stockAvailable
      };

      return product;
    } catch (error) {
      console.error('❌ Error mapping CJ product:', error);
      return null;
    }
  }

  // Generate relevant tags for the product
  private static generateTags(item: CJProduct): string[] {
    const tags = ['cjdropshipping', 'dropshipping'];

    if (item.productNameEn || item.productName) {
      const title = (item.productNameEn || item.productName).toLowerCase();
      if (title.includes('women') || title.includes('lady')) tags.push('women');
      if (title.includes('men') || title.includes('male')) tags.push('men');
      if (title.includes('fashion')) tags.push('fashion');
      if (title.includes('trendy') || title.includes('popular')) tags.push('trending');
      if (title.includes('new')) tags.push('new-arrival');
    }

    if (item.categoryName) {
      tags.push(item.categoryName.toLowerCase().replace(/\s+/g, '-'));
    }

    return tags.slice(0, 6);
  }

  // Extract materials from product title/description
  private static extractMaterials(title: string): string[] {
    const materials: string[] = [];
    const text = title.toLowerCase();
    const knownMaterials = ['cotton', 'polyester', 'denim', 'wool', 'linen', 'silk', 'viscose', 'spandex', 'nylon', 'leather', 'fleece', 'chiffon', 'lace'];

    knownMaterials.forEach(material => {
      if (text.includes(material) && !materials.includes(material)) {
        materials.push(material);
      }
    });

    return materials;
  }

  // Search for trending products
  static async searchTrendingProducts(limit: number = 20): Promise<Product[]> {
    // Cilj: uvijek vratiti 20 proizvoda, bez nakita; preferirane niše iz zahtjeva korisnika
    const preferredKeywords = [
      'home office storage',
      'office organizer',
      'print',
      'printer label',
      'pet leash',
      'pet leashes',
      'pet toy',
      'pet toys',
      'home electronic accessories',
      'phone cable organizer',
      'fitness',
      'gym'
    ];
    const excludeKeywords = ['jewelry', 'jewerly', 'ring', 'necklace', 'earring', 'bracelet', 'christmas', 'xmas', 'christmas tree', 'bed', 'mattress', 'bedding', 'krevet', 'kreveti'];

    // Neki CJ upiti vraćaju najviše ~12 po strani; akumuliramo više stranica
    const pageSize = Math.max(80, limit * 4);
    const maxPages = 6;
    const seen = new Set<string>();
    const results: Product[] = [];

    // 1) trending feed kroz više stranica
    for (let page = 1; page <= maxPages && results.length < limit; page++) {
      const batch = await this.searchProducts({
        searchText: '',
        page,
        pageSize,
        searchType: 2 // Trending
      });

      const filtered = (batch || []).filter(p => {
        const title = (p.title || '').toLowerCase();
        const isExcluded = excludeKeywords.some(k => title.includes(k));
        return !isExcluded;
      });

      for (const p of filtered) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(p);
          if (results.length >= limit) break;
        }
      }
    }

    // 2) Ako i dalje nema dovoljno, ciljano pretrage po ključnim riječima
    for (const kw of preferredKeywords) {
      if (results.length >= limit) break;
      const batch = await this.searchProducts({ searchText: kw, page: 1, pageSize: pageSize });
      for (const p of batch || []) {
        const title = (p.title || '').toLowerCase();
        const isExcluded = excludeKeywords.some(k => title.includes(k));
        if (isExcluded) continue;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(p);
          if (results.length >= limit) break;
        }
      }
    }

    // Ako i dalje nema dovoljno, povuci best-selling kao fallback
    if (results.length < limit) {
      const best = await this.searchBestSellingProducts(limit * 2);
      for (const p of best) {
        if (results.length >= limit) break;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(p);
        }
      }
    }

    // Posljednji fallback: opća pretraga bez keyworda
    if (results.length < limit) {
      for (let page = 1; page <= 6 && results.length < limit; page++) {
        const batch = await this.searchProducts({ searchText: '', page, pageSize: 200, searchType: 0 });
        for (const p of batch || []) {
          const title = (p.title || '').toLowerCase();
          const isExcluded = excludeKeywords.some(k => title.includes(k));
          if (isExcluded) continue;
          if (!seen.has(p.id)) {
            seen.add(p.id);
            results.push(p);
            if (results.length >= limit) break;
          }
        }
      }
    }

    return results.slice(0, limit);
  }

  // Best-selling products across CJ, filtered to meaningful niches (no jewelry/bed)
  static async searchBestSellingProducts(limit: number = 20): Promise<Product[]> {
    const preferredKeywords = [
      'home office storage','office organizer','print','printer label',
      'pet leash','pet leashes','pet toy','pet toys',
      'home electronic accessories','phone cable organizer','fitness','gym'
    ];
    const excludeKeywords = ['jewelry','jewerly','ring','necklace','earring','bracelet','bed','mattress','queen size'];

    const pageSize = Math.max(120, Math.min(200, limit * 6));
    const maxPages = 8;
    const pool: Product[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= maxPages && pool.length < limit; page++) {
      const batch = await this.searchProducts({ searchText: '', page, pageSize, searchType: 0 });
      for (const p of batch || []) {
        if (seen.has(p.id)) continue;
        const title = (p.title || '').toLowerCase();
        const isExcluded = excludeKeywords.some(k => title.includes(k));
        if (isExcluded) continue;
        // dozvoli sve korisne artikle, bez mjesečnog filtra (grid filtrira ≥3000)
        seen.add(p.id);
        pool.push(p);
        if (pool.length >= limit) break;
      }
    }

    // Sort by proxy of sales volume (listedNum → mapped to reviewCount)
    pool.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));

    return pool.slice(0, limit);
  }

  // Quick search helper for common categories
  static async searchByCategory(categoryName: string, limit: number = 20): Promise<Product[]> {
    const categoryKeywords = {
      'Electronics': 'phone case electronics gadget',
      'Fashion': 'clothes dress shirt fashion',
      'Home & Garden': 'home decor kitchen garden',
      'Sports & Outdoors': 'sports fitness outdoor',
      'Health & Beauty': 'beauty health skincare',
      'Toys & Games': 'toys games kids children',
      'Automotive': 'car auto vehicle accessories'
    };

    const searchText = categoryKeywords[categoryName as keyof typeof categoryKeywords] || categoryName;

    return this.searchProducts({
      searchText,
      page: 1,
      pageSize: limit
    });
  }

  // Test the API connection (proxied list request)
  static async testApiConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing CJDropshipping API connection...');
      const result = await this.makeApiRequest('product/list', { pageNum: 1, pageSize: 10 });
      const ok = !!(
        result && (
          result.code === 200 ||
          result.result === true ||
          (result.data && (Array.isArray(result.data.list) || typeof result.data.total !== 'undefined'))
        )
      );
      console.log('✅ CJDropshipping API connection result:', ok);
      return ok;
    } catch (error) {
      console.error('❌ CJDropshipping API connection failed:', error);
      return false;
    }
  }

  // Logout and clear tokens (proxy handles server-side)
  static async logout(): Promise<void> {
    try {
      await fetch(`${CJ_API_BASE_URL}/cj/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.warn('⚠️ Logout request failed:', error);
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      this.accessTokenExpiry = null;
      this.lastAuthTime = null;
      try {
        localStorage.removeItem('cj_accessToken');
        localStorage.removeItem('cj_refreshToken');
        localStorage.removeItem('cj_accessTokenExpiry');
      } catch {}
      console.log('🔐 CJDropshipping tokens cleared');
    }
  }

  // Live rating enrichment using productComments
  static async enrichRating(productId: string): Promise<number | null> {
    try {
      const data = await this.makeApiRequest('product/productComments', {
        pid: productId,
        pageNum: 1,
        pageSize: 20
      });
      // Some responses include a top-level average
      const topAvg = Number(data?.data?.avgStar ?? data?.data?.avgScore ?? data?.data?.averageStar);
      if (isFinite(topAvg) && topAvg >= 0) {
        return Math.max(0, Math.min(5, topAvg));
      }
      const comments = data?.data?.list || [];
      if (!Array.isArray(comments) || comments.length === 0) return null;
      const ratings = comments
        .map((c: any) => Number(c.starLevel ?? c.star ?? c.rating ?? c.score ?? c.starNum))
        .filter((n: any) => isFinite(n) && n >= 0);
      if (ratings.length === 0) return null;
      const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
      return Math.max(0, Math.min(5, avg));
    } catch (e) {
      return null;
    }
  }

  // Live inventory enrichment by SKU
  static async enrichInventoryBySku(sku?: string): Promise<number | null> {
    if (!sku) return null;
    try {
      const inv = await this.makeApiRequest('product/stock/queryBySku', { sku });
      return this.parseInventory(inv);
    } catch (e) {
      return null;
    }
  }

  // Live inventory enrichment by VID
  static async enrichInventoryByVid(vid?: string): Promise<number | null> {
    if (!vid) return null;
    try {
      const inv = await this.makeApiRequest('product/stock/queryByVid', { vid });
      return this.parseInventory(inv);
    } catch (e) {
      return null;
    }
  }

  // Prefer VID-based stock lookup, fallback to SKU
  static async enrichInventory(productId: string, sku?: string): Promise<number | null> {
    // Try SKU first if provided
    const skuResult = await this.enrichInventoryBySku(sku);
    if (typeof skuResult === 'number') return skuResult;
    // Discover a VID from product details, then query by VID
    try {
      const detail = await this.makeApiRequest('product/query', { pid: productId });
      const variants = detail?.data?.variants || detail?.data?.variantList || [];
      if (Array.isArray(variants) && variants.length > 0) {
        // Query up to first 3 variant VIDs and sum their stock
        const vids: string[] = variants
          .slice(0, 3)
          .map((v: any) => v?.vid || v?.variantId || v?.variantIdStr)
          .filter(Boolean);
        if (vids.length === 0) return null;
        const results = await Promise.all(vids.map(v => this.enrichInventoryByVid(v)));
        const sum = results
          .filter((n): n is number => typeof n === 'number' && isFinite(n))
          .reduce((a, b) => a + b, 0);
        return sum > 0 ? sum : null;
      }
    } catch {}
    return null;
  }

  // Parse various inventory response shapes
  private static parseInventory(resp: any): number | null {
    if (!resp) return null;
    // Direct numeric fields
    const direct = Number(resp?.data?.totalQty ?? resp?.data?.stockNum ?? resp?.data?.availableQty ?? resp?.totalQty ?? resp?.stockNum);
    if (isFinite(direct) && direct >= 0) return direct;
    // Array/list of warehouses/variants
    const arr = resp?.data?.list || resp?.data || resp?.list;
    if (Array.isArray(arr)) {
      const sum = arr
        .map((it: any) => Number(it?.totalQty ?? it?.stockNum ?? it?.availableQty ?? it?.qty ?? it?.quantity ?? it?.stock))
        .filter((n: any) => isFinite(n) && n >= 0)
        .reduce((a: number, b: number) => a + b, 0);
      if (sum >= 0) return sum;
    }
    return null;
  }

  // Get accurate min variant price from product details
  static async enrichMinVariantPrice(productId: string): Promise<number | null> {
    try {
      const detail = await this.makeApiRequest('product/query', { pid: productId });
      const variants = detail?.data?.variants || detail?.data?.variantList || [];
      const prices: number[] = Array.isArray(variants)
        ? variants
            .map((v: any) => Number(v.variantSellPrice ?? v.sellPrice))
            .filter((n: any) => isFinite(n) && n > 0)
        : [];
      if (prices.length > 0) return Math.min(...prices);
      const p = Number(detail?.data?.sellPrice);
      return isFinite(p) && p > 0 ? p : null;
    } catch (e) {
      return null;
    }
  }

  // Get Avg Market Price via SerpAPI Google Shopping
  static async getAvgMarketPrice(keyword: string): Promise<number | null> {
    try {
      const cacheKey = 'serp_avg_market_price';
      const cacheParams = { keyword };
      const cached = cacheManager.get<number>(cacheKey, cacheParams);
      if (typeof cached === 'number') return cached;

      if (!SERP_API_KEY) return null;
      const url = `https://serpapi.com/search.json?engine=google_shopping&gl=us&hl=en&q=${encodeURIComponent(keyword)}&api_key=${SERP_API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const data = await resp.json();
      const items = data?.shopping_results || [];
      if (!Array.isArray(items) || items.length === 0) return null;
      const prices: number[] = items
        .map((it: any) => {
          const str = it?.price || it?.extracted_price || it?.prices?.[0]?.extracted_price || '';
          const n = typeof str === 'number' ? str : Number(String(str).replace(/[^0-9.]/g, ''));
          return isFinite(n) ? n : NaN;
        })
        .filter((n: number) => isFinite(n) && n > 0);
      if (prices.length === 0) return null;
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const rounded = Number(avg.toFixed(2));
      cacheManager.set(cacheKey, cacheParams, rounded, 24 * 60 * 60 * 1000);
      return rounded;
    } catch {
      return null;
    }
  }

  // Get enhanced profit data with real-time calculations
  static async getEnhancedProfitData(productId: string, sellPrice: number): Promise<{
    costPrice: number;
    profitMargin: number;
    profitAmount: number;
    recommendedPrice: number;
    competitorPrice?: number;
  } | null> {
    try {
      console.log(`💰 Getting enhanced profit data for product: ${productId}`);
      
      // Check cache first
      const cacheKey = 'cj_profit_data';
      const cacheParams = { productId, sellPrice };
      
      const cachedProfit = cacheManager.get<any>(cacheKey, cacheParams);
      if (cachedProfit) {
        console.log(`🎯 Cache hit! Returning cached profit data for: ${productId}`);
        return cachedProfit;
      }
      
      // Get product details for cost price
      const detail = await this.makeApiRequest('product/query', { pid: productId });
      if (!detail?.data) return null;

      const costPrice = Number(detail.data.sellPrice) || sellPrice * 0.7; // CJ sell price is our cost
      const profitAmount = sellPrice - costPrice;
      const profitMargin = sellPrice > 0 ? (profitAmount / sellPrice) * 100 : 0;
      
      // Calculate recommended price for optimal profit (2-3x markup)
      const recommendedPrice = this.forceEndingNinetyNine(costPrice * 2.5);

      const result = {
        costPrice: Number(costPrice.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(1)),
        profitAmount: Number(profitAmount.toFixed(2)),
        recommendedPrice: Number(recommendedPrice.toFixed(2))
      };
      
      // Cache for 24 hours
      cacheManager.set(cacheKey, cacheParams, result, 24 * 60 * 60 * 1000);
      console.log(`✅ Cached profit data for product: ${productId}`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get profit data:', error);
      return null;
    }
  }

  // Get monthly revenue estimation based on market data
  static async getMonthlyRevenueEstimate(productId: string, sellPrice: number): Promise<{
    estimatedOrders: number;
    monthlyRevenue: number;
    confidence: 'high' | 'medium' | 'low';
    trending: boolean;
  } | null> {
    try {
      console.log(`📊 Getting monthly revenue estimate for product: ${productId}`);
      
      // Check cache first to prevent recalculation
      const cacheKey = 'cj_revenue_estimate';
      const cacheParams = { productId, sellPrice };
      
      const cachedRevenue = cacheManager.get<any>(cacheKey, cacheParams);
      if (cachedRevenue) {
        console.log(`🎯 Cache hit! Returning cached revenue estimate for: ${productId}`);
        return cachedRevenue;
      }
      
      // Get product details for market analysis
      const detail = await this.makeApiRequest('product/query', { pid: productId });
      if (!detail?.data) return null;

      // Use listedNum as popularity indicator
      const listedNum = Number(detail.data.listedNum) || 0;
      
      // Calculate estimated monthly orders based on popularity and price point (deterministic)
      let estimatedOrders = 0;
      let confidence: 'high' | 'medium' | 'low' = 'low';
      
      // Create deterministic "random" based on product ID to ensure consistent results
      const seed = parseInt(productId.slice(-6), 16) || 1; // Use last 6 chars of product ID as seed
      const deterministicRandom = (seed * 9301 + 49297) % 233280 / 233280; // Linear congruential generator
      
      if (listedNum > 1000) {
        estimatedOrders = Math.floor(deterministicRandom * 500 + 300); // 300-800 orders
        confidence = 'high';
      } else if (listedNum > 100) {
        estimatedOrders = Math.floor(deterministicRandom * 200 + 100); // 100-300 orders
        confidence = 'medium';
      } else {
        estimatedOrders = Math.floor(deterministicRandom * 100 + 20); // 20-120 orders
        confidence = 'low';
      }

      // Adjust for price point (higher prices = fewer orders)
      if (sellPrice > 50) estimatedOrders = Math.floor(estimatedOrders * 0.7);
      if (sellPrice > 100) estimatedOrders = Math.floor(estimatedOrders * 0.5);
      if (sellPrice < 10) estimatedOrders = Math.floor(estimatedOrders * 1.5);

      const monthlyRevenue = estimatedOrders * sellPrice;
      const trending = listedNum > 500;

      const result = {
        estimatedOrders,
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        confidence,
        trending
      };
      
      // Cache the result for 24 hours to prevent recalculation
      cacheManager.set(cacheKey, cacheParams, result, 24 * 60 * 60 * 1000);
      console.log(`✅ Cached revenue estimate for product: ${productId}`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get revenue estimate:', error);
      return null;
    }
  }

  // Get enhanced shipping information
  static async getEnhancedShippingData(productId: string): Promise<{
    deliveryDays: number;
    shippingCost: number;
    shippingMethods: Array<{
      name: string;
      days: number;
      cost: number;
      tracking: boolean;
    }>;
    freeShippingThreshold?: number;
    expressAvailable: boolean;
  } | null> {
    try {
      console.log(`🚚 Getting enhanced shipping data for product: ${productId}`);
      
      // Check cache first
      const cacheKey = 'cj_shipping_data';
      const cacheParams = { productId };
      
      const cachedShipping = cacheManager.get<any>(cacheKey, cacheParams);
      if (cachedShipping) {
        console.log(`🎯 Cache hit! Returning cached shipping data for: ${productId}`);
        return cachedShipping;
      }
      
      // Get product details for shipping calculation
      const detail = await this.makeApiRequest('product/query', { pid: productId });
      if (!detail?.data) return null;

      const weight = Number(detail.data.productWeight) || 0.5; // kg
      
      // Calculate shipping based on weight and destination
      const baseShippingCost = Math.max(2.99, weight * 1.5);
      const deliveryDays = detail.data.deliveryTime ? Math.floor(detail.data.deliveryTime / 24) : 7;

      const shippingMethods = [
        {
          name: 'Standard Shipping',
          days: deliveryDays + 3,
          cost: Number(baseShippingCost.toFixed(2)),
          tracking: true
        },
        {
          name: 'Fast Shipping',
          days: Math.max(3, deliveryDays - 2),
          cost: Number((baseShippingCost * 2).toFixed(2)),
          tracking: true
        }
      ];

      // Add express if available for lighter items
      const expressAvailable = weight < 2;
      if (expressAvailable) {
        shippingMethods.push({
          name: 'Express Shipping',
          days: Math.max(1, deliveryDays - 5),
          cost: Number((baseShippingCost * 3.5).toFixed(2)),
          tracking: true
        });
      }

      const result = {
        deliveryDays,
        shippingCost: Number(baseShippingCost.toFixed(2)),
        shippingMethods,
        freeShippingThreshold: 50, // Free shipping over $50
        expressAvailable
      };
      
      // Cache for 24 hours
      cacheManager.set(cacheKey, cacheParams, result, 24 * 60 * 60 * 1000);
      console.log(`✅ Cached shipping data for product: ${productId}`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get shipping data:', error);
      return null;
    }
  }
}

// Find Winning Products - Enhanced search with winning product criteria
export const findWinningProducts = async (params: {
  minMonthlyOrders?: number;
  minProfitMargin?: number;
  maxDeliveryDays?: number;
  minRating?: number;
  priceMin?: number;
  priceMax?: number;
  categoryName?: string;
} = {}): Promise<Product[]> => {
  try {
    console.log('🏆 Searching for winning products with criteria:', params);
    
    // Build search parameters optimized for winning products
    const searchParams: any = {
      pageNum: 1,
      pageSize: 50, // Get more results to filter from
      // Sort by popularity/sales volume if available
      orderBy: 'sales_desc',
    };

    // Add category filter if specified
    if (params.categoryName && params.categoryName !== '') {
      // Try to find category ID from name
      const categories = await getCJCategories();
      const category = categories.find((cat: any) => 
        cat.name.toLowerCase().includes(params.categoryName!.toLowerCase())
      );
      if (category) {
        searchParams.categoryId = category.id;
      }
    }

    // Add price range filters
    if (params.priceMin && params.priceMin > 0) {
      searchParams.priceMin = params.priceMin;
    }
    if (params.priceMax && params.priceMax > 0) {
      searchParams.priceMax = params.priceMax;
    }

    const response = await (CJDropshippingApiService as any).makeApiRequest('product/list', searchParams);

    if (!response?.data?.list) {
      console.log('🏆 No winning products found');
      return [];
    }

    let products = response.data.list.map((item: any) => CJDropshippingApiService.mapSingleProductFromApi(item)).filter(Boolean) as Product[];
    
    // Apply winning product filters
    products = products.filter(product => {
      // Filter by minimum monthly orders (estimated from sales data)
      if (params.minMonthlyOrders && product.monthlyOrders < params.minMonthlyOrders) {
        return false;
      }
      
      // Filter by minimum profit margin
      if (params.minProfitMargin) {
        const profitMargin = ((product.sellPrice - product.originalPrice) / product.sellPrice) * 100;
        if (profitMargin < params.minProfitMargin) {
          return false;
        }
      }
      
      // Filter by maximum delivery days
      if (params.maxDeliveryDays && product.deliveryDays > params.maxDeliveryDays) {
        return false;
      }
      
      // Filter by minimum rating
      if (params.minRating && product.rating < params.minRating) {
        return false;
      }
      
      return true;
    });

    // Sort by winning potential (combination of orders, rating, profit margin)
    products.sort((a, b) => {
      const aScore = (a.monthlyOrders * 0.4) + (a.rating * 20) + (((a.sellPrice - a.originalPrice) / a.sellPrice) * 100 * 0.4);
      const bScore = (b.monthlyOrders * 0.4) + (b.rating * 20) + (((b.sellPrice - b.originalPrice) / b.sellPrice) * 100 * 0.4);
      return bScore - aScore;
    });

    // Take top winning products
    products = products.slice(0, 20);
    
    console.log(`🏆 Found ${products.length} winning products`);
    return products;
    
  } catch (error) {
    console.error('❌ Failed to find winning products:', error);
    return [];
  }
};

// Export convenience functions
export const searchCJProducts = CJDropshippingApiService.searchProducts.bind(CJDropshippingApiService);
export const getCJProductDetails = CJDropshippingApiService.getProductDetails.bind(CJDropshippingApiService);
export const getCJProductReviews = CJDropshippingApiService.getProductReviews.bind(CJDropshippingApiService);
export const getCJProductInventory = CJDropshippingApiService.getProductInventory?.bind?.(CJDropshippingApiService) || (async () => null);
export const getCJCategories = CJDropshippingApiService.getCategories.bind(CJDropshippingApiService);
export const testCJApi = CJDropshippingApiService.testApiConnection.bind(CJDropshippingApiService); 

// Export enhanced data functions
export const getEnhancedProfitData = CJDropshippingApiService.getEnhancedProfitData.bind(CJDropshippingApiService);
export const getMonthlyRevenueEstimate = CJDropshippingApiService.getMonthlyRevenueEstimate.bind(CJDropshippingApiService);
export const getEnhancedShippingData = CJDropshippingApiService.getEnhancedShippingData.bind(CJDropshippingApiService); 