import { BarChart3, Eye, ShoppingCart, Star, Truck, TrendingUp, Loader2, Database, Flame, Heart } from 'lucide-react';
import { Product } from '../types';
import { getCategoryIconByName } from '../data/categoryIcons';

interface ProductGridProps {
  products: Product[];
  onProductImport?: (product: Product) => void;
  onProductAnalyze?: (product: Product) => void;
  onProductFavorite?: (product: Product) => void;
  favoriteProducts?: string[];
  onRetryLoad?: () => void;
  isLoading?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAnalyze?: (product: Product) => void;
  onImport?: (product: Product) => void;
  onFavorite?: (product: Product) => void;
  isFavorite?: boolean;
}

function ProductCard({ product, onAnalyze, onImport, onFavorite, isFavorite }: ProductCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-900/20 border-green-500/20';
    if (score >= 60) return 'bg-yellow-900/20 border-yellow-500/20';
    return 'bg-red-900/20 border-red-500/20';
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl card-hover group backdrop-blur-sm">
      <div className="relative">
        <img 
          src={product.imageUrl} 
          alt={product.title}
          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border flex items-center gap-1 ${
              product.trendingScore === 100
                ? 'trending-100-badge'
                : getScoreBg(product.trendingScore)
            }`}
          >
            {product.trendingScore === 100 && <Flame className="w-3.5 h-3.5 text-orange-400" />}
            {product.trendingScore}% Trending
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span
            className={`px-2 py-1 backdrop-blur-sm rounded-full text-xs font-medium border ${
              product.competitionLevel === 'Medium'
                ? 'bg-yellow-900/30 text-yellow-200 border-yellow-500/40 animate-pulse-slow ring-1 ring-yellow-400/30'
                : 'bg-black/80 text-white border-gray-600/50'
            }`}
          >
            {product.competitionLevel} Competition
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2">
            {product.title}
          </h3>
          <div className="flex items-center space-x-1 ml-2">
            {product.rating > 0 ? (
              <>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white font-semibold">{product.rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          {(() => {
            const { icon, color } = getCategoryIconByName(product.category);
            return (
              <span className={`text-xs bg-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1 border border-gray-600/30 ${color}`}>
                <span className="text-sm">{icon}</span>
                <span>{product.category}</span>
              </span>
            );
          })()}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black text-white">${product.price.toFixed(2)}</p>
              <p className="text-sm text-gray-400 line-through">${product.originalPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">{product.profitMargin}% Profit</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                <span>{product.rating > 0 ? product.rating.toFixed(1) : '—'}</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-600/30">
              <Truck className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-gray-300">{product.deliveryTime}</p>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            {onFavorite && (
              <button
                onClick={() => onFavorite(product)}
                className={`bg-gray-900/50 border border-gray-700/50 hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm flex items-center justify-center p-3 rounded-xl hover:scale-105 ${
                  isFavorite 
                    ? 'text-red-400 border-red-500/50 hover:border-red-400/50' 
                    : 'text-gray-400 hover:text-red-400 hover:border-red-500/50'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            {onAnalyze && (
              <button
                onClick={() => onAnalyze(product)}
                className="flex-1 bg-gray-900/50 border border-gray-700/50 text-white hover:bg-gray-800/50 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold hover:scale-105"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analyze</span>
              </button>
            )}
            {onImport && (
              <button
                onClick={() => onImport(product)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center space-x-2 py-3 rounded-xl hover:scale-105"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Import</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, onProductImport, onProductAnalyze, onProductFavorite, favoriteProducts = [], onRetryLoad, isLoading = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-400 animate-pulse" />
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 bg-clip-text text-transparent">
              Loading Products
            </span>
          </h1>
          
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Fetching live CJDropshipping data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 bg-clip-text text-transparent">
              No Products Found
            </span>
          </h1>
          
          <p className="text-gray-400 text-center">
            No products found for your search. Try different keywords or adjust your filters.
          </p>
          <div className="flex justify-center space-x-3 mt-4">
            <button className="bg-gray-900/50 border border-gray-700/50 text-white hover:bg-gray-800/50 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm px-4 py-2 rounded-lg">
              Clear Filters
            </button>
            <button 
              onClick={onRetryLoad}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 px-4 py-2 rounded-lg"
            >
              Browse All Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 bg-clip-text text-transparent" 
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.4))',
                  textShadow: '0 0 15px rgba(147, 51, 234, 0.3)'
                }}>
            Your next winning product is waiting, see what we've picked for you
          </span>
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm bg-green-900/20 text-green-400 border border-green-500/20">
            <Database className="h-4 w-4 text-green-400" />
            <span className="font-medium">LIVE DATA</span>
          </div>
          
          <span className="text-gray-400">
                            {products.length} products from CJDropshipping
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products
          .slice()
          .sort((a, b) => {
            const a100 = a.trendingScore === 100 ? 1 : 0;
            const b100 = b.trendingScore === 100 ? 1 : 0;
            if (a100 !== b100) return b100 - a100;
            const aMed = a.competitionLevel === 'Medium' ? 1 : 0;
            const bMed = b.competitionLevel === 'Medium' ? 1 : 0;
            if (aMed !== bMed) return bMed - aMed;
            return b.trendingScore - a.trendingScore;
          })
          .map((product) => (
          <ProductCard 
            key={product.id}
            product={product} 
            onAnalyze={onProductAnalyze}
            onImport={onProductImport}
            onFavorite={onProductFavorite}
            isFavorite={favoriteProducts.includes(product.id)}
          />
        ))}
      </div>
    </div>
  );
} 