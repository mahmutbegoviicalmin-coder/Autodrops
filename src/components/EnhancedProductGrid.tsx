import { 
  BarChart3, Eye, ShoppingCart, Star, Truck, TrendingUp, Loader2, Database, 
  Flame, Heart, Award, Zap, Clock, DollarSign, Package, Users, 
  ArrowUpRight, Sparkles, Target, Crown, Gift
} from 'lucide-react';
import { Product } from '../types';
import { getCategoryIconByName } from '../data/categoryIcons';
import { useEffect, useState } from 'react';

const ENABLE_SERPAPI = false;

interface EnhancedProductGridProps {
  products: Product[];
  onProductImport?: (product: Product) => void;
  onProductAnalyze?: (product: Product) => void;
  onProductFavorite?: (product: Product) => void;
  favoriteProducts?: string[];
  onRetryLoad?: () => void;
  isLoading?: boolean;
}

interface EnhancedProductCardProps {
  product: Product;
  onAnalyze?: (product: Product) => void;
  onImport?: (product: Product) => void;
  onFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  index?: number;
}

function EnhancedProductCard({ product, onAnalyze, onImport, onFavorite, isFavorite, index = 0 }: EnhancedProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [avgMarket, setAvgMarket] = useState<number | null>(null);

  useEffect(() => {
    if (!ENABLE_SERPAPI) return;
    if (index >= 4) return;
    let mounted = true;
    const key = `avg_market_${product.id}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setAvgMarket(Number(cached));
      return;
    }
    // Disabled external market price enrichment (CJ dependency removed)
    return () => { mounted = false; };
  }, [product.id, product.title, index]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 border-emerald-400/30';
    if (score >= 60) return 'bg-amber-500/20 border-amber-400/30';
    return 'bg-red-500/20 border-red-400/30';
  };

  const getProfitColor = (profit: number) => {
    if (profit >= 30) return 'text-emerald-400';
    if (profit >= 20) return 'text-blue-400';
    return 'text-gray-400';
  };

  const isWinningProduct = (product.monthlyOrders ?? 0) >= 100;
  const inRangeOrders = (product.monthlyOrders ?? 0) >= 3000;
  const is3000Plus = (product.monthlyOrders ?? 0) >= 3000;
  const isTrending = product.trendingScore >= 70;
  const profitMargin = product.profitAmount && product.price > 0 
    ? (product.profitAmount / product.price) * 100 
    : ((product.price - product.sellPrice) / product.price) * 100;

  return (
    <div 
      className="group relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Winning Product Glow */}
      {isWinningProduct && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 rounded-2xl blur-xl -z-10 group-hover:from-purple-500/20 group-hover:via-blue-500/20 group-hover:to-emerald-500/20 transition-all duration-500" />
      )}

      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800/50 animate-pulse flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-600" />
          </div>
        )}
        <img 
          src={product.imageUrl} 
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'} group-hover:scale-110`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Trending Badge */}
          {isTrending && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
              product.trendingScore >= 90 
                ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 border-orange-400/40 text-orange-200' 
                : getScoreBg(product.trendingScore)
            }`}>
              {product.trendingScore >= 90 ? (
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {product.trendingScore}% Hot
            </div>
          )}
          
          {/* Winning Product Badge */}
          {isWinningProduct && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/40 text-purple-200 backdrop-blur-md animate-pulse">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              Winner
            </div>
          )}

          {/* 3000+ Orders Badge */}
          {inRangeOrders && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 border border-emerald-400/70 text-white shadow-md">
              <Users className="w-3.5 h-3.5" />
              {(product.monthlyOrders || 0).toLocaleString()} /mo
            </div>
          )}

          {/* Recommended Badge (3000+ orders) */}
          {inRangeOrders && is3000Plus && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 border border-emerald-400/70 text-white shadow-md">
              <Award className="w-3.5 h-3.5" />
              Recommended
            </div>
          )}
        </div>

        {/* Top Right Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          {/* Competition Level */}
          <div className={`px-2.5 py-1 backdrop-blur-md rounded-full text-xs font-medium border ${
            product.competitionLevel === 'High' 
              ? 'bg-red-500/20 text-red-200 border-red-400/40' 
              : product.competitionLevel === 'Medium'
              ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
          }`}>
            {product.competitionLevel}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(product);
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
              isFavorite 
                ? 'bg-red-500/20 border-red-400/40 text-red-400' 
                : 'bg-gray-900/50 border-gray-600/40 text-gray-400 hover:text-red-400 hover:border-red-400/40'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Overlay Info */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/95 to-transparent transform transition-transform duration-300 ${
          isHovered ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>{product.monthlyOrders} orders/mo</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.round(Number(product.deliveryDays || 0))} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Title and Rating */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2 leading-tight">
            {product.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {product.rating > 0 ? (
              <>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white font-semibold text-sm">{product.rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">No rating</span>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          {(() => {
            const { icon, color } = getCategoryIconByName(product.category);
            return (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/60 backdrop-blur-sm border border-gray-600/30 ${color}`}>
                <span className="text-sm">{icon}</span>
                <span>{product.category}</span>
              </span>
            );
          })()}
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {/* Cost on top (estimated) */}
              <div className="text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-gray-500" />
                  Cost: <span className="text-gray-300 font-semibold">${(product.costPrice || product.sellPrice || 0).toFixed(2)}</span>
                </span>
              </div>
              {/* AI Recommended Price (primary) */}
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white relative inline-flex items-center">
                  ${product.price}
                  <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 text-purple-200 animate-pulse">AI Researched</span>
                </span>
              </div>
              {/* Avg market under AI price */}
              <div className="text-xs text-gray-400">Avg market: <span className="font-semibold">${(avgMarket ?? product.originalPrice).toFixed(2)}</span></div>
              <div className={`text-sm font-semibold ${getProfitColor(profitMargin)}`}>
                {profitMargin.toFixed(0)}% Profit
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Monthly Revenue</div>
              <div className="text-lg font-bold text-emerald-400">
                ${(product.monthlyRevenue || (product.monthlyOrders * product.price)).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
            <div className="text-center">
              <div className="text-xs text-gray-400">Demand</div>
              <div className={`text-sm font-bold ${getScoreColor(product.trendingScore)}`}>
                {product.trendingScore}%
              </div>
            </div>
            <div className="text-center border-x border-gray-700/30">
              <div className="text-xs text-gray-400">Profit</div>
              <div className={`text-sm font-bold ${getProfitColor(profitMargin)}`}>
                {profitMargin.toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Shipping</div>
              <div className={`text-sm font-bold ${product.deliveryDays <= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {Math.round(Number(product.deliveryDays || 0))}d
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze?.(product);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 font-medium text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Analyze
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImport?.(product);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-200 font-semibold text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Import
          </button>
        </div>

        {/* Additional Info on Hover */}
        <div className={`overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pt-3 border-t border-gray-700/30">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Ships from: {product.supplierLocation}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                <span>Stock: {product.inventory || product.stockAvailable || 'Available'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnhancedProductGrid({ 
  products, 
  onProductImport, 
  onProductAnalyze, 
  onProductFavorite,
  favoriteProducts = [],
  onRetryLoad,
  isLoading = false 
}: EnhancedProductGridProps) {
  // Filtriraj: samo korisni dropshipping proizvodi sa 3000+ narudžbi, bez "christmas" i kreveta
  const excludeKeywords = ['christmas', 'xmas', 'christmas tree', 'bed', 'mattress', 'bedding', 'krevet', 'kreveti'];
  const base = (products || []).filter(p => {
    const title = (p.title || '').toLowerCase();
    return !excludeKeywords.some(k => title.includes(k));
  });

  // Strict: samo 100+ narudžbi, bez popunjavanja ispod praga  
  const minDisplayCount = 12;
  const merged = base
    .filter(p => ((p.monthlyOrders ?? 0) >= 100)) // Lowered from 3000 to 100
    .sort((a, b) => (b.monthlyOrders ?? 0) - (a.monthlyOrders ?? 0))
    .slice(0, minDisplayCount);

  const ordered = merged
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0) || (b.monthlyOrders ?? 0) - (a.monthlyOrders ?? 0) || (b.rating ?? 0) - (a.rating ?? 0));
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 border-r-blue-500 rounded-full animate-spin animate-reverse"></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-white">Loading Premium Products</h3>
          <p className="text-gray-400">Discovering winning products for your store...</p>
        </div>
      </div>
    );
  }

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-gray-700/50">
            <Package className="w-10 h-10 text-gray-500" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <div className="text-center space-y-3 max-w-md">
          <h3 className="text-2xl font-bold text-white">No Products Found</h3>
          <p className="text-gray-400 leading-relaxed">
            Try adjusting your filters or search criteria to discover amazing products for your store.
          </p>
          {onRetryLoad && (
            <button
              onClick={onRetryLoad}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            >
              <ArrowUpRight className="w-4 h-4" />
              Reload Products
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {ordered.map((product, idx) => (
          <EnhancedProductCard
            key={product.id}
            product={product}
            onAnalyze={onProductAnalyze}
            onImport={onProductImport}
            onFavorite={onProductFavorite}
            isFavorite={favoriteProducts.includes(product.id)}
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}
