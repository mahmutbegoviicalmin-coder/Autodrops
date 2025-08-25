import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { Header } from './components/Header';
import { PublicNav } from './components/PublicNav';
import { Homepage } from './components/Homepage';

import { ProductGrid } from './components/ProductGrid';
import { EnhancedProductGrid } from './components/EnhancedProductGrid';

import { OrdersDashboard } from './components/OrdersDashboard';


import { AffiliatePage } from './components/AffiliatePage';
import { AffiliateApplyModal } from './components/AffiliateApplyModal';
import { TermsOfUse } from './components/TermsOfUse';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { StoreConnectionModal } from './components/StoreConnectionModal';
import { ProductImportModal } from './components/ProductImportModal';
import { ProductAnalysisModal } from './components/ProductAnalysisModal';
import { AuthModal } from './components/AuthModal';
import { CacheStatsModal } from './components/CacheStatsModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AIChatbotWidget } from './components/AIChatbotWidget';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { storeManager } from './services/storeManager';
import { aiProductEnhancer } from './services/aiProductEnhancer';
import { localTitleEnhancer } from './services/titleEnhancer';

import { searchCJProducts, CJDropshippingApiService } from './services/cjdropshippingApi';
import { Product } from './types';
import { mockOrders } from './data/mockOrders';
import { mockProducts } from './data/mockProducts';
import { NewFilterSidebar, NewFilterSidebarState } from './components/NewFilterSidebar';
import { getCJCategories } from './services/cjdropshippingApi';
import Logo from './assets/logos/AD_logo.png';

function AppContent() {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalKey, setAuthModalKey] = useState(0);
  const [selectedView, setSelectedView] = useState<'homepage' | 'products' | 'orders' | 'affiliate'>(user ? 'products' : 'homepage');
  const [routePath, setRoutePath] = useState<string>(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Simplified filters - only essential ones
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [minMonthlyOrders, setMinMonthlyOrders] = useState<number>(0); // pre-filter threshold (disabled to allow 20+ items)
  
  // Filter Sidebar State
  const [sidebarFilters, setSidebarFilters] = useState<NewFilterSidebarState>({
    priceMin: 0,
    priceMax: 1000,
    minProfitMargin: 20,
    maxDeliveryDays: 30,
    categoryName: '',
    minMonthlyOrders: 500,
    minRating: 0,
    isWinningProduct: false,
    hasFastShipping: false,
    hasVariants: false,
    minDiscount: 0
  });
  const [isFilterSidebarVisible, setIsFilterSidebarVisible] = useState(false);
  const [winningProducts, setWinningProducts] = useState<Product[]>([]);

  // Compute and cache 20 winning products for 72h
  const computeWinningSelection = (source: Product[]) => {
    try {
      const CACHE_KEY = 'dashboard_winning_v1';
      const now = Date.now();
      const ttlMs = 72 * 60 * 60 * 1000; // 72h

      // Try cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached) as { createdAt: number; ids: string[] };
          if (now - data.createdAt < ttlMs) {
            const map = new Map(source.map(p => [p.id, p] as const));
            const restored = data.ids.map(id => map.get(id)).filter(Boolean) as Product[];
            if (restored.length > 0) {
              setWinningProducts(restored.slice(0, 20));
              return;
            }
          }
        } catch {}
      }

      // Build pool: high profit margin AND solid sales
      const pool = source
        .map(p => ({
          ...p,
          // mark highly recommended
          highlyRecommended: (p.monthlyOrders ?? 0) >= 5000
        }))
        .filter(p => (p.profitMargin ?? 0) >= 30 && (p.monthlyOrders ?? 0) >= 3000);

      if (pool.length === 0) {
        setWinningProducts([]);
        localStorage.removeItem(CACHE_KEY);
        return;
      }

      // Rank by score: 60% profit, 40% orders
      const maxOrders = pool.reduce((m, p) => Math.max(m, p.monthlyOrders ?? 0), 1);
      const ranked = [...pool].sort((a, b) => {
        const aScore = (a.profitMargin ?? 0) * 0.6 + ((a.monthlyOrders ?? 0) / maxOrders) * 40 * 0.4;
        const bScore = (b.profitMargin ?? 0) * 0.6 + ((b.monthlyOrders ?? 0) / maxOrders) * 40 * 0.4;
        if (bScore !== aScore) return bScore - aScore;
        // tie-breakers
        const o = (b.monthlyOrders ?? 0) - (a.monthlyOrders ?? 0);
        if (o !== 0) return o;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });

      // Rotation window changes every 72h
      const windowIndex = Math.floor(now / ttlMs);
      const offset = windowIndex % Math.max(1, ranked.length);
      const rotated = ranked.slice(offset).concat(ranked.slice(0, offset));
      const selected = rotated.slice(0, 20);

      setWinningProducts(selected);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ createdAt: now, ids: selected.map(p => p.id) }));
    } catch (e) {
      console.warn('computeWinningSelection failed', e);
      setWinningProducts([]);
    }
  };

  // Lightweight enrichment: fetch only rating and real min variant price (cached), to avoid value drift
  const enrichRatingsAndPrices = (sourceProducts: Product[]) => {
    (async () => {
      try {
        const limit = 0; // privremeno isključi enrichment da izbjegnemo 429 rate limit
        const list = sourceProducts.slice(0, limit);
        const updated: Product[] = [...sourceProducts];

        for (const p of list) {
          const idx = updated.findIndex(u => u.id === p.id);
          if (idx === -1) continue;

          // Cache keys
          const ratingKey = `cj_rating_${p.id}`;
          const priceKey = `cj_min_price_${p.id}`;

          // Rating
          let nextRating: number | null = null;
          const cachedRating = sessionStorage.getItem(ratingKey);
          if (cachedRating !== null) {
            nextRating = Number(cachedRating);
          } else {
            nextRating = await CJDropshippingApiService.enrichRating(p.id);
            if (nextRating !== null) sessionStorage.setItem(ratingKey, String(Number(nextRating.toFixed(1))));
          }

          // Real min price
          let nextMinPrice: number | null = null;
          const cachedPrice = sessionStorage.getItem(priceKey);
          if (cachedPrice !== null) {
            nextMinPrice = Number(cachedPrice);
          } else {
            nextMinPrice = await CJDropshippingApiService.enrichMinVariantPrice(p.id);
            if (nextMinPrice !== null) sessionStorage.setItem(priceKey, String(Number(nextMinPrice.toFixed(2))));
          }

          // Apply updates (ne diramo next.price da AI cijena ostane stabilna)
          const next = { ...updated[idx] } as Product;
          if (typeof nextRating === 'number' && !Number.isNaN(nextRating)) {
            next.rating = Number(nextRating.toFixed(1));
          }
          if (typeof nextMinPrice === 'number' && !Number.isNaN(nextMinPrice) && nextMinPrice > 0) {
            // real CJ cost
            next.costPrice = Number(nextMinPrice.toFixed(2));
            // recompute profit fields based on AI recommended price (next.price)
            const cost = next.costPrice ?? 0;
            const sell = next.price ?? 0;
            next.profitAmount = Number((sell - cost).toFixed(2));
            next.profitMargin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;
          }
          updated[idx] = next;
        }

        // Push updates
        setAllProducts(updated);
      } catch (e) {
        console.warn('Rating/price enrichment skipped:', e);
      }
    })();
  };

  // Test API connection on app load and clear cache (bez direktnog učitavanja da izbjegnemo dupli fetch)
  useEffect(() => {
    console.log('🚀 App loaded - clearing cache and testing CJDropshipping API...');
    
    // Load CJ Categories on app start
    const loadCategories = async () => {
      try {
        console.log('📂 Loading CJ categories...');
        const cjCategories = await getCJCategories();
        setCategories(cjCategories);
        console.log(`✅ Loaded ${cjCategories.length} CJ categories`);
      } catch (error) {
        console.error('❌ Failed to load CJ categories:', error);
        // Keep empty array as fallback
      }
    };
    
    loadCategories();
    
    try {
      localStorage.removeItem('cj_product_search');
      localStorage.removeItem('cj_trending_products');
      sessionStorage.clear();
      console.log('🧹 Cleared frontend cache');
    } catch (e) {
      console.log('⚠️ Could not clear cache:', e);
    }
    // Test CJDropshipping API connection after 24h reset
    CJDropshippingApiService.testApiConnection()
      .then((result: boolean) => {
        console.log('✅ API test result (after 24h):', result);
      })
      .catch((error: any) => {
        console.error('❌ API test failed:', error);
      });
  }, []);

  // Tiny client-side routing for public pages
  useEffect(() => {
    const onPop = () => setRoutePath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Apply all filters when products or filters change
  useEffect(() => {
    if (allProducts.length > 0) {
      console.log(`🔄 Applying filters to ${allProducts.length} products...`);
      console.log(`📋 Current filters:`, sidebarFilters);
      
      const filtered = applySidebarFilters(allProducts, sidebarFilters);
      setFilteredProducts(filtered);
      
      console.log(`✅ Filtered to ${filtered.length} products`);
      if (sidebarFilters.categoryName) {
        console.log(`📂 Category filter: ${sidebarFilters.categoryName}`);
      }
    }
  }, [allProducts, sidebarFilters]);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setRoutePath(path);
    }
  };


  
  // Store connection states
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [connectedStores, setConnectedStores] = useState<any[]>([]);
  
  // Product modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProductForImport, setSelectedProductForImport] = useState<Product | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<Product | null>(null);
  
  // Cache stats modal
  const [isCacheStatsModalOpen, setIsCacheStatsModalOpen] = useState(false);

  const handleSelectPlan = (plan: 'starter' | 'pro') => {
    // Redirect to checkout/purchase page for the selected plan
    try {
      setShowPricingModal(false);
      window.location.href = `/purchase?plan=${plan}`;
    } catch (e) {
      console.log('Redirecting to purchase page for plan:', plan);
    }
  };

  // enrichLoadedProducts function removed to prevent value changes

  // Load initial products and connected stores
  useEffect(() => {
    // Clear any cached enrichment data on app start
    console.log('🧹 Clearing enrichment cache on app start...');
    sessionStorage.clear(); // Clear all cache to start fresh
    
    // loadInitialData will be called after component mounts
    loadConnectedStores();
  }, []);

  // Load initial data after component is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData();
    }, 100); // Small delay to ensure everything is initialized
    
    return () => clearTimeout(timer);
  }, []);

  const loadInitialData = async () => {
    // DIREKTNO koristi backend endpoint - jednostavno i stabilno
    console.log('🎯 Loading products directly from backend /api/winning-products...');
    try {
      const resp = await fetch('http://localhost:3001/api/winning-products');
      const data = await resp.json();
      const arr = Array.isArray(data?.products) ? data.products : [];
      console.log(`📦 Backend returned ${arr.length} products`);
      
      const mapped = arr.map((p: any) => ({
        id: String(p.product_url || p.product_name || Math.random()),
        title: String(p.product_name || 'Unknown Product'),
        price: Number(p.price || 0),
        originalPrice: Number(p.original_price || 0),
        sellPrice: Number((Number(p.price || 0) / 2.5) || 0),
        rating: Number(p.rating || 0),
        reviewCount: 0,
        deliveryTime: '5-10 days',
        deliveryDays: 7,
        supplier: 'CJ',
        supplierLocation: 'CN',
        category: 'General',
        imageUrl: String(p.image_url || ''),
        profitMargin: 60,
        competitionLevel: 'Medium' as const,
        trendingScore: 85,
        stockAvailable: 100,
        tags: [],
        monthlyOrders: Number(p.order_count || 0),
      }));
      
      if (mapped.length > 0) {
        console.log(`✅ Loaded ${mapped.length} winning products from backend`);
        setAllProducts(mapped);
        setFilteredProducts(mapped);
        computeWinningSelection(mapped);
        return;
      }
      
      console.log('⚠️ No products from backend - using mock products');
      // FALLBACK TO MOCKS
      const mocks = mockProducts.map(p => ({
        ...p,
        deliveryDays: 7,
        monthlyOrders: p.reviewCount ?? 800,
        costPrice: Number(((p.price || 0) * 0.45).toFixed(2)),
        profitAmount: Number(((p.price || 0) * 0.55).toFixed(2)),
        profitMargin: Math.round(((p.price - ((p.price || 0) * 0.45)) / (p.price || 1)) * 100)
      } as Product));
      setAllProducts(mocks);
      setFilteredProducts(mocks);
      computeWinningSelection(mocks);
      return;
    } catch (e) {
      console.error('❌ Backend fetch failed:', e);
      console.log('🔄 Backend not available - using mock products');
      const mocks = mockProducts.map(p => ({
        ...p,
        deliveryDays: 7,
        monthlyOrders: p.reviewCount ?? 800,
        costPrice: Number(((p.price || 0) * 0.45).toFixed(2)),
        profitAmount: Number(((p.price || 0) * 0.55).toFixed(2)),
        profitMargin: Math.round(((p.price - ((p.price || 0) * 0.45)) / (p.price || 1)) * 100)
      } as Product));
      setAllProducts(mocks);
      setFilteredProducts(mocks);
      computeWinningSelection(mocks);
      return;
    }
  };

  const loadRealProducts = async (searchText: string = 'home office storage print pet leashes home electronic accessories pet toys fitness') => {
    setIsLoadingProducts(true);
    try {
      console.log(`🔍 Loading high-order products (≥100 monthly orders)...`);
      
      // NO CATEGORY FILTERING to avoid rate limits - filter on frontend
      // const selectedCategory = sidebarFilters.categoryName === '🔥 All Categories' ? '' : sidebarFilters.categoryName;
      
      // First try to get high-order products directly (NO CATEGORY PARAMETER)
      let products = await (CJDropshippingApiService as any).searchHighOrderProducts?.(120, '');
      
      if (!Array.isArray(products) || products.length < 12) {
        console.log(`🔄 Fallback to regular search with filtering...`);
        const searchResults = await searchCJProducts({ searchText, page: 1, pageSize: 200 });
        products = searchResults.filter(p => (p.monthlyOrders ?? 0) >= 100);
        console.log(`📦 Filtered to ${products.length} products with ≥100 orders`);
      } else {
        console.log(`✅ Got ${products.length} high-order products directly`);
      }
      
      console.log('🔍 First high-order product sample:', products[0]);
      
      if (products.length > 0) {
        // Apply monthly orders threshold if available (CJ list may not include it; keep placeholder)
        const withOrders = products.map((p: any) => ({
          ...p,
          monthlyOrders: typeof p.monthlyOrders === 'number' ? p.monthlyOrders : undefined
        }));
        const preFiltered = withOrders; // don't drop items to ensure >=20 in UI
        console.log(`✅ Loaded ${products.length} products from CJDropshipping`);
        
        // Immediately enhance titles locally for better default titles
        const locallyEnhanced = localTitleEnhancer.enhanceProductsBatch(preFiltered);
        setAllProducts(locallyEnhanced);
        setFilteredProducts(locallyEnhanced);
        computeWinningSelection(locallyEnhanced);
        // Start lightweight enrichment for rating and price
        enrichRatingsAndPrices(locallyEnhanced);

        // AI enhancement u pozadini privremeno isključeno radi stabilnosti

        // Background enrichment disabled to prevent value changes
        // enrichLoadedProducts(preFiltered);
      } else {
        console.log('⚠️ No products returned from API, retrying with different search...');
        console.log('🔄 Trying general product search...');
        try {
          const fallbackProducts = await searchCJProducts({ searchText: 'clothes', page: 1, pageSize: 20 });
          if (fallbackProducts.length > 0) {
            console.log(`✅ Fallback search successful: ${fallbackProducts.length} products`);
            const preFiltered = fallbackProducts;
            setAllProducts(preFiltered);
            setFilteredProducts(preFiltered);
            computeWinningSelection(preFiltered);
            // Run enrichment
            enrichRatingsAndPrices(preFiltered);
            // enrichLoadedProducts(preFiltered); // Disabled to prevent value changes
          } else {
            console.log('❌ Still no products found, keeping empty state');
            setAllProducts([]);
            setFilteredProducts([]);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback search also failed:', fallbackError);
          setAllProducts([]);
          setFilteredProducts([]);
        }
      }
    } catch (error) {
      console.error('❌ API failed:', error);
      console.log('🚫 API failure - showing empty state (NO MOCK DATA)');
      setAllProducts([]);
      setFilteredProducts([]);
      
      if (error instanceof Error && error.message.includes('Rate limit')) {
        console.warn('🚫 Rate limit reached - please wait for API to be available');
      } else {
        console.warn('❌ CJDropshipping API failed - check API server status');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Apply filters to a list of products
  const applyFilters = (list: Product[], f: any): Product[] => {
    const deliveryDaysOf = (delivery: string): number => {
      // Expect formats like "1-2 days", "5-10 days"; fallback to 0 (pass-through)
      const m = delivery.match(/(\d+)(?:\s*-\s*(\d+))?\s*days?/i);
      if (!m) return 0;
      const a = parseInt(m[1], 10);
      const b = m[2] ? parseInt(m[2], 10) : a;
      return Math.max(a, b);
    };

    return list.filter(p => {
      if (p.price < f.priceMin) return false;
      if (p.price > f.priceMax) return false;
      if (p.profitMargin < f.minProfitMargin) return false;
      if (deliveryDaysOf(p.deliveryTime) > f.maxDeliveryDays) return false;
      if (f.categoryName && p.category !== f.categoryName) return false;
      return true;
    });
  };

  // Re-apply filters when filters or allProducts change
  // Filtering is handled by sidebar filters

  // Sidebar filter functions
  const clearSidebarFilters = () => {
    setSidebarFilters({
      priceMin: 0,
      priceMax: 1000,
      minProfitMargin: 20,
      maxDeliveryDays: 30,
      categoryName: '',
      minMonthlyOrders: 500,
      minRating: 0,
      isWinningProduct: false,
      hasFastShipping: false,
      hasVariants: false,
      minDiscount: 0
    });
  };

  // Apply sidebar filters to products
  const applySidebarFilters = (products: Product[], filters: NewFilterSidebarState): Product[] => {
    return products.filter(product => {
      // Price range
      if (filters.priceMin > 0 && product.price < filters.priceMin) return false;
      if (filters.priceMax > 0 && product.price > filters.priceMax) return false;
      
      // Profit margin
      if (filters.minProfitMargin > 0) {
        const profitMargin = ((product.price - (product.costPrice || product.price * 0.4)) / product.price) * 100;
        if (profitMargin < filters.minProfitMargin) return false;
      }
      
      // Delivery days
      if (filters.maxDeliveryDays > 0 && product.deliveryDays && product.deliveryDays > filters.maxDeliveryDays) return false;
      
      // Category filtering - improved logic
      if (filters.categoryName && filters.categoryName !== '🔥 All Categories' && filters.categoryName !== '') {
        const productCategory = (product.category || '').toLowerCase();
        const productTitle = (product.title || '').toLowerCase();
        const selectedCategory = filters.categoryName.toLowerCase();
        
        // Debug logging for first few products
        if (products.indexOf(product) < 3) {
          console.log(`🔍 DEBUG Category Filter #${products.indexOf(product)}:`, {
            selectedCategory,
            productCategory,
            productTitle: productTitle.substring(0, 50),
            productId: product.id
          });
        }
        
        let matches = false;
        
        // Direct category match first
        if (productCategory.includes(selectedCategory.replace(/[^a-z]/g, ''))) {
          matches = true;
        }
        // Then check our custom category mappings
        else if (selectedCategory.includes('electronics') || selectedCategory.includes('gadgets')) {
          matches = productCategory.includes('electronics') || productCategory.includes('gadget') || 
                   productTitle.includes('electronic') || productTitle.includes('smart') || 
                   productTitle.includes('usb') || productTitle.includes('charger') || 
                   productTitle.includes('phone') || productTitle.includes('tech') || 
                   productTitle.includes('digital') || productTitle.includes('wifi') || 
                   productTitle.includes('bluetooth') || productTitle.includes('charging');
        }
        else if (selectedCategory.includes('home') || selectedCategory.includes('kitchen')) {
          matches = productCategory.includes('home') || productCategory.includes('kitchen') || 
                   productCategory.includes('household') || productCategory.includes('storage') ||
                   productTitle.includes('home') || productTitle.includes('kitchen') || 
                   productTitle.includes('household') || productTitle.includes('storage') || 
                   productTitle.includes('organizer') || productTitle.includes('decor');
        }
        else if (selectedCategory.includes('health') || selectedCategory.includes('beauty')) {
          matches = productCategory.includes('beauty') || productCategory.includes('health') || 
                   productCategory.includes('care') || productCategory.includes('cosmetic') ||
                   productTitle.includes('beauty') || productTitle.includes('health') || 
                   productTitle.includes('skin') || productTitle.includes('care') || 
                   productTitle.includes('wellness') || productTitle.includes('massage');
        }
        else if (selectedCategory.includes('sports') || selectedCategory.includes('fitness')) {
          matches = productCategory.includes('sport') || productCategory.includes('fitness') || 
                   productCategory.includes('exercise') || productCategory.includes('gym') ||
                   productTitle.includes('fitness') || productTitle.includes('sport') || 
                   productTitle.includes('exercise') || productTitle.includes('workout');
        }
        else if (selectedCategory.includes('pets') || selectedCategory.includes('pet')) {
          matches = productCategory.includes('pet') || productCategory.includes('animal') ||
                   productTitle.includes('pet') || productTitle.includes('dog') || 
                   productTitle.includes('cat') || productTitle.includes('animal');
        }
        else if (selectedCategory.includes('automotive') || selectedCategory.includes('car')) {
          matches = productCategory.includes('automotive') || productCategory.includes('car') || 
                   productCategory.includes('vehicle') || productTitle.includes('car') || 
                   productTitle.includes('auto') || productTitle.includes('vehicle');
        }
        else if (selectedCategory.includes('toys') || selectedCategory.includes('games')) {
          matches = productCategory.includes('toy') || productCategory.includes('game') || 
                   productCategory.includes('play') || productTitle.includes('toy') || 
                   productTitle.includes('game') || productTitle.includes('play');
        }
        else if (selectedCategory.includes('jewelry') || selectedCategory.includes('accessories')) {
          matches = productCategory.includes('jewelry') || productCategory.includes('accessory') || 
                   productCategory.includes('bracelet') || productCategory.includes('necklace') ||
                   productTitle.includes('jewelry') || productTitle.includes('bracelet') || 
                   productTitle.includes('necklace') || productTitle.includes('earring') || 
                   productTitle.includes('ring') || productTitle.includes('watch');
        }
        else if (selectedCategory.includes('tools') || selectedCategory.includes('hardware')) {
          matches = productCategory.includes('tool') || productCategory.includes('hardware') || 
                   productCategory.includes('equipment') || productTitle.includes('tool') || 
                   productTitle.includes('screwdriver') || productTitle.includes('wrench');
        }
        else if (selectedCategory.includes('outdoor') || selectedCategory.includes('camping')) {
          matches = productCategory.includes('outdoor') || productCategory.includes('camping') || 
                   productCategory.includes('hiking') || productTitle.includes('outdoor') || 
                   productTitle.includes('camping') || productTitle.includes('hiking');
        }
        else if (selectedCategory.includes('fashion') || selectedCategory.includes('apparel')) {
          matches = productCategory.includes('fashion') || productCategory.includes('clothing') || 
                   productCategory.includes('apparel') || productCategory.includes('shirt') ||
                   productCategory.includes('dress') || productTitle.includes('fashion') || 
                   productTitle.includes('clothing') || productTitle.includes('shirt');
        }
        else if (selectedCategory.includes('baby') || selectedCategory.includes('kids')) {
          matches = productCategory.includes('baby') || productCategory.includes('kid') || 
                   productCategory.includes('child') || productTitle.includes('baby') || 
                   productTitle.includes('kid') || productTitle.includes('child');
        }
        else {
          // For CJ categories or any unrecognized category, try various matching strategies
          const cleanSelected = selectedCategory.replace(/[^a-z]/g, '');
          const cleanProduct = productCategory.replace(/[^a-z]/g, '');
          
          // Try exact match first
          matches = cleanProduct === cleanSelected ||
                   // Try contains match
                   cleanProduct.includes(cleanSelected) ||
                   cleanSelected.includes(cleanProduct) ||
                   // Try partial match for longer category names
                   (cleanSelected.length > 3 && cleanProduct.includes(cleanSelected.substring(0, 4))) ||
                   (cleanProduct.length > 3 && cleanSelected.includes(cleanProduct.substring(0, 4))) ||
                   // Also check product title for keywords
                   (cleanSelected.length > 3 && productTitle.includes(cleanSelected.substring(0, 4)));
        }
        
        // If still no match, be more lenient and show the product anyway for now
        // This prevents the "0 products" issue while we debug category matching
        if (!matches) {
          console.log(`⚠️ No category match found for "${selectedCategory}" vs "${productCategory}" - showing anyway`);
          matches = true; // Temporarily allow all products through
        }
        
        if (!matches) return false;
      }
      
      // Monthly orders
      if (filters.minMonthlyOrders > 0 && product.monthlyOrders && product.monthlyOrders < filters.minMonthlyOrders) return false;
      
      // Rating
      if (filters.minRating > 0 && product.rating && product.rating < filters.minRating) return false;
      
      // Fast shipping
      if (filters.hasFastShipping && (!product.deliveryDays || product.deliveryDays > 7)) return false;
      
      // Has variants
      if (filters.hasVariants && (!product.variants || product.variants.length <= 1)) return false;
      
      // Minimum discount
      if (filters.minDiscount > 0) {
        const discount = product.originalPrice ? ((product.originalPrice - product.price) / product.originalPrice) * 100 : 0;
        if (discount < filters.minDiscount) return false;
      }
      
      return true;
    });
  };

  // Update filtered products when sidebar filters change
  useEffect(() => {
    // Basic filters
    let filtered = allProducts.filter(product => {
      if (sidebarFilters.priceMin > 0 && product.price < sidebarFilters.priceMin) return false;
      if (sidebarFilters.priceMax > 0 && product.price > sidebarFilters.priceMax) return false;
      if (sidebarFilters.categoryName && !product.category.toLowerCase().includes(sidebarFilters.categoryName.toLowerCase())) return false;
      return true;
    });

    // Enforce winner criteria: high trend + profit
    filtered = filtered.map(p => ({
      ...p,
      // recompute trending to prioritize search interest: 70% orders, 30% rating
      trendingScore: Math.round(((p.monthlyOrders ?? 0) > 0 ? Math.min(1, (p.monthlyOrders ?? 0) / 1000) : 0) * 70 + Math.min(1, (p.rating ?? 0) / 5) * 30)
    }));

    // Sort: trend desc → profit desc → rating desc
    filtered.sort((a, b) => {
      const t = (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
      if (t !== 0) return t;
      const pm = (b.profitMargin ?? 0) - (a.profitMargin ?? 0);
      if (pm !== 0) return pm;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    setFilteredProducts(filtered);
  }, [sidebarFilters, allProducts]);

  const loadConnectedStores = () => {
    const stores = storeManager.getConnections().map(conn => ({
      id: conn.id,
      platform: conn.platform,
      storeName: conn.storeName,
      storeUrl: conn.storeUrl,
      isActive: true,
      connectedAt: new Date(conn.connectedAt),
      lastUsed: new Date(conn.lastUsed)
    }));
    setConnectedStores(stores);
  };





  const handleConnectStore = async (storeData: any) => {
    try {
      // Connection is already saved by StoreConnectionModal, just refresh the list
      console.log('✅ Store connection received:', storeData.id);
      loadConnectedStores(); // Refresh the list
      alert(`✅ ${storeData.platform} store connected successfully!`);
    } catch (error) {
      console.error('❌ Store connection failed:', error);
      alert(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportProduct = async (productId: string, storeId: string, importSettings: any) => {
    const product = allProducts.find(p => p.id === productId);
    const store = connectedStores.find(s => s.id === storeId);
    
    if (!product || !store) {
      console.error('Product or store not found');
      return;
    }

    try {
      console.log(`📦 Importing "${product.title}" to ${store.platform} store with custom settings...`);

      // Use the StoreIntegrationManager for proper import handling
      const { StoreIntegrationManager } = await import('./services/storeIntegrations');
      const manager = new StoreIntegrationManager();

      // Get the stored connection with credentials
      const storedConnection = storeManager.getConnection(store.id);
      if (!storedConnection) {
        throw new Error('Connection details not found');
      }

      console.log('🔍 Retrieved stored connection for import');

      // Validate credentials before proceeding
      if (store.platform === 'woocommerce') {
        if (!storedConnection.credentials.consumerKey || !storedConnection.credentials.consumerSecret) {
          throw new Error('WooCommerce connection is missing consumer key or secret. Please reconnect your store.');
        }
      }

      const connectionConfig = {
        platform: store.platform as 'shopify' | 'woocommerce' | 'bigcommerce' | 'squarespace',
        storeName: store.storeName,
        storeUrl: store.storeUrl, // This should already be properly formatted from store connection
        apiKey: storedConnection.credentials.consumerKey || '',
        apiSecret: storedConnection.credentials.consumerSecret || '',
        accessToken: storedConnection.credentials.accessToken,
      };

      console.log('🔍 Connection config for import:', {
        platform: connectionConfig.platform,
        apiKey: connectionConfig.apiKey ? '✅ Present' : '❌ Missing',
        apiSecret: connectionConfig.apiSecret ? '✅ Present' : '❌ Missing',
        accessToken: connectionConfig.accessToken ? '✅ Present' : '❌ Missing'
      });

      const connection = await manager.connectStore(connectionConfig);
      
      // Import the product with the provided settings
      const importResult = await manager.importProduct(connection.id, product, importSettings);
      
      if (importResult.status === 'success') {
        alert(`✅ Product "${product.title}" imported successfully with your custom settings!`);
      } else {
        throw new Error(importResult.errorMessage || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleProductImport = (product: Product) => {
    setSelectedProductForImport(product);
    setIsImportModalOpen(true);
  };

  const handleProductAnalysis = (product: Product) => {
    setSelectedProductForAnalysis(product);
    setIsAnalysisModalOpen(true);
  };

  const handleProductFavorite = (product: Product) => {
    if (!user?.id) {
      // Show login modal if user is not logged in
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    setFavoriteProducts(prev => {
      const isFavorite = prev.includes(product.id);
      if (isFavorite) {
        // Remove from favorites
        return prev.filter(id => id !== product.id);
      } else {
        // Add to favorites
        return [...prev, product.id];
      }
    });
  };

  // Load favorites from localStorage when user logs in
  useEffect(() => {
    if (user?.id) {
      const savedFavorites = localStorage.getItem(`favoriteProducts_${user.id}`);
      if (savedFavorites) {
        try {
          setFavoriteProducts(JSON.parse(savedFavorites));
        } catch (error) {
          console.error('Failed to load favorites:', error);
          setFavoriteProducts([]);
        }
      } else {
        setFavoriteProducts([]);
      }
    }
    // Note: We don't clear favorites when user logs out - they persist in localStorage
  }, [user?.id]);

  // Save favorites to localStorage whenever they change (only if user is logged in)
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`favoriteProducts_${user.id}`, JSON.stringify(favoriteProducts));
    }
  }, [favoriteProducts, user?.id]);

  // Clear favorites from state when user logs out (but keep in localStorage)
  useEffect(() => {
    if (!user) {
      setFavoriteProducts([]);
    }
  }, [user]);



  // Auto-redirect to products view and show pricing modal for new users
  useEffect(() => {
    if (user && selectedView === 'homepage') {
      setSelectedView('products');
      if (user.subscription.plan === 'free') {
        setShowPricingModal(true);
      }
    }
  }, [user, selectedView]);

  // When user signs out, always return to homepage
  useEffect(() => {
    if (!user) {
      setSelectedView('homepage');
    }
  }, [user]);

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
        {/* Footer */}
        <footer className="mt-auto border-t border-gray-800/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/20" />
              <div className="text-sm text-gray-400">© {new Date().getFullYear()} AutoDrops. All rights reserved.</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <a href="/" className="hover:text-white">Home</a>
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
        </footer>

        {/* Floating AI Chatbot */}
        <AIChatbotWidget />
      </>
    );
  }

  // Public affiliate page route (accessible to non-logged users)
  if (routePath === '/affiliate') {
    return (
      <div className="min-h-screen bg-black">
        {/* Page content */}
        <AffiliatePage 
          onApply={() => { setIsAuthModalOpen(true); }}
          onSignIn={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
        />

        {/* Auth Modal */}
        <AffiliateApplyModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        {/* Chatbot and Toaster */}
        <AIChatbotWidget />
        <Toaster position="top-right" />
      </div>
    );
  }

  if (routePath === '/affiliate-admin') {
    const { AdminAffiliatePanel } = require('./components/AdminAffiliatePanel');
    return (
      <div className="min-h-screen bg-black">
        <AdminAffiliatePanel />
        <AIChatbotWidget />
        <Toaster position="top-right" />
      </div>
    );
  }

  // Terms of Use route
  if (routePath === '/terms') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <PublicNav onAffiliateClick={() => navigate('/affiliate')} />

        <main className="flex-1 p-6 lg:p-8 relative">
          <TermsOfUse />
        </main>

        <footer className="mt-auto border-t border-gray-800/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/20" />
              <div className="text-sm text-gray-400">© {new Date().getFullYear()} AutoDrops. All rights reserved.</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <a href="/" className="hover:text-white">Home</a>
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
        </footer>

        <AIChatbotWidget />
        <Toaster position="top-right" />
      </div>
    );
  }

  // Privacy Policy route
  if (routePath === '/privacy') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <PublicNav onAffiliateClick={() => navigate('/affiliate')} />
        <main className="flex-1 p-6 lg:p-8 relative">
          <PrivacyPolicy />
        </main>
        <footer className="mt-auto border-t border-gray-800/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/20" />
              <div className="text-sm text-gray-400">© {new Date().getFullYear()} AutoDrops. All rights reserved.</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <a href="/" className="hover:text-white">Home</a>
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
        </footer>
        <AIChatbotWidget />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {selectedView === 'homepage' && !user ? (
          <>
            <Homepage
              onGetStarted={() => setSelectedView('products')}
              onViewProducts={() => setSelectedView('products')}
              onViewAffiliate={() => navigate('/affiliate')}
              connectedStoresCount={connectedStores.length}
              totalProducts={allProducts.length}
              onOpenAuth={(mode) => { setAuthMode(mode ?? 'login'); setAuthModalKey(k => k + 1); setIsAuthModalOpen(true); }}
            />
            
          </>
        ) : (
          <>
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
            </div>
            
            <Header 
              selectedView={selectedView as 'products' | 'orders'}
              onViewChange={(view) => setSelectedView(view)}
              
              onConnectStore={() => setIsStoreModalOpen(true)}
              connectedStores={connectedStores}
              isLoadingProducts={isLoadingProducts}
              
              onOpenAuth={(mode) => { setAuthMode(mode ?? 'login'); setAuthModalKey(k => k + 1); setIsAuthModalOpen(true); }}
              onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
              onOpenFavorites={() => setIsFavoritesModalOpen(true)}
              onGoHome={() => setSelectedView('homepage')}
              onToggleFilters={() => setIsFilterSidebarVisible(v => !v)}
            />
      
      <div className={`flex relative flex-1`}>
        <main className="flex-1 p-6 lg:p-8 relative">
          {selectedView === 'products' && (
            <>
{/* FiltersBar removed for cleaner UI */}
              {/* NewFilterSidebar - Modern & Mobile-Responsive */}
              <NewFilterSidebar
                categories={categories}
                values={sidebarFilters}
                onChange={setSidebarFilters}
                onClear={clearSidebarFilters}
                onFindWinningProducts={() => setSidebarFilters(prev => ({ ...prev, isWinningProduct: true }))}
                isVisible={isFilterSidebarVisible}
                onToggle={() => setIsFilterSidebarVisible(v => !v)}
              />
            </>
          )}
          {selectedView === 'products' ? (
            <EnhancedProductGrid 
              products={filteredProducts}
              onProductImport={handleProductImport}
              onProductAnalyze={handleProductAnalysis}
              onProductFavorite={user ? handleProductFavorite : undefined}
              favoriteProducts={favoriteProducts}
              onRetryLoad={() => loadRealProducts('home office storage print pet leashes home electronic accessories pet toys fitness')}
              isLoading={isLoadingProducts}
            />
          ) : selectedView === 'orders' ? (
            <OrdersDashboard orders={mockOrders} />
          ) : selectedView === 'affiliate' ? (
            <AffiliatePage onApply={() => setIsAuthModalOpen(true)} />
          ) : null}
        </main>
      </div>

      {(selectedView === 'products' || selectedView === 'orders') && (
        <footer className="mt-auto border-t border-gray-800/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/20" />
              <div className="text-sm text-gray-400">© {new Date().getFullYear()} AutoDrops. All rights reserved.</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <a href="/" className="hover:text-white">Home</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
        </footer>
      )}

      <StoreConnectionModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onConnect={handleConnectStore}
      />

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        product={selectedProductForImport}
        connectedStores={connectedStores}
        onImport={handleImportProduct}
      />

      <ProductAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        product={selectedProductForAnalysis}
      />

            <CacheStatsModal
              isOpen={isCacheStatsModalOpen}
              onClose={() => setIsCacheStatsModalOpen(false)}
            />
          </>
        )}

        {/* Floating AI Chatbot */}
        <AIChatbotWidget />

        {/* Pricing Modal */}
        {showPricingModal && user && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl shadow-premium-lg border border-dark-600 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-dark-600 relative">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="absolute right-4 top-4 p-2 rounded-lg hover:bg-dark-700 text-gray-300"
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 className="text-3xl font-bold text-white text-center">Choose Your Plan</h2>
                <p className="text-gray-400 text-center mt-2">Unlock premium features to supercharge your dropshipping business</p>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Starter Plan */}
                <div className="border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-b from-purple-900/20 to-dark-700 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                  <p className="text-3xl font-bold text-white mb-4">$29<span className="text-sm text-gray-400">/month</span></p>
                  <ul className="text-gray-300 space-y-2 mb-6">
                    <li>• Unlimited product searches</li>
                    <li>• Advanced profit analysis</li>
                    <li>• Multiple store connections</li>
                    <li>• AI-powered descriptions</li>
                    <li>• Email support</li>
                  </ul>
                  <button onClick={() => handleSelectPlan('starter')} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Continue to Checkout
                  </button>
                </div>
                
                {/* Pro Plan */}
                <div className="border border-gray-600 rounded-xl p-6 bg-dark-700">
                  <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                  <p className="text-3xl font-bold text-white mb-4">$79<span className="text-sm text-gray-400">/month</span></p>
                  <ul className="text-gray-300 space-y-2 mb-6">
                    <li>• Everything in Starter</li>
                    <li>• Advanced analytics dashboard</li>
                    <li>• Automated order management</li>
                    <li>• Custom branding tools</li>
                    <li>• Priority support</li>
                    <li>• API access</li>
                  </ul>
                  <button onClick={() => handleSelectPlan('pro')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Continue to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal (global, always mounted to avoid state desync) */}
        <AuthModal
          key={authModalKey}
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
          onSuccess={(type) => {
            if (type === 'register') setShowPricingModal(true);
            setIsAuthModalOpen(false);
          }}
        />

        {/* Account Settings Modal */}
        <AccountSettingsModal
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
        />

        {/* Favorites Modal */}
        {isFavoritesModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-red-400" />
                  <span>My Favorites ({favoriteProducts.length})</span>
                </h2>
                <button
                  onClick={() => setIsFavoritesModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                {favoriteProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
                    <p className="text-gray-400">Start adding products to your favorites to see them here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allProducts
                      .filter(product => favoriteProducts.includes(product.id))
                      .map(product => (
                        <div key={product.id} className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-2xl overflow-hidden border border-gray-600/50 shadow-xl">
                          <div className="relative">
                            <img 
                              src={product.imageUrl} 
                              alt={product.title}
                              className="w-full h-48 object-cover"
                            />
                            <button
                              onClick={() => handleProductFavorite(product)}
                              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-red-400 hover:text-red-300 transition-colors"
                              title="Remove from favorites"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                          <div className="p-4">
                            <h3 className="text-white font-bold mb-2 line-clamp-2">{product.title}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-white">${product.price.toFixed(2)}</span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setIsFavoritesModalOpen(false);
                                    handleProductAnalysis(product);
                                  }}
                                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                >
                                  Analyze
                                </button>
                                <button
                                  onClick={() => {
                                    setIsFavoritesModalOpen(false);
                                    handleProductImport(product);
                                  }}
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                >
                                  Import
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        

        {/* Cache Stats Modal */}
        <CacheStatsModal
          isOpen={isCacheStatsModalOpen}
          onClose={() => setIsCacheStatsModalOpen(false)}
        />

        {/* Store Connection Modal */}
        <StoreConnectionModal
          isOpen={isStoreModalOpen}
          onClose={() => setIsStoreModalOpen(false)}
          onConnect={handleConnectStore}
        />

        {/* Product Import Modal */}
        <ProductImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          product={selectedProductForImport}
          connectedStores={connectedStores}
          onImport={handleImportProduct}
        />

        {/* Product Analysis Modal */}
        <ProductAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          product={selectedProductForAnalysis}
        />

        {/* Admin quick access (optional): open /affiliate-admin to use */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 