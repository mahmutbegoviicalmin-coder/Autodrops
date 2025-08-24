import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Star, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Package, 
  Zap, 
  X,
  Menu,
  BarChart3,
  Timer,
  Grid,
  Sparkles
} from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
}

export interface NewFilterSidebarState {
  priceMin: number;
  priceMax: number;
  minProfitMargin: number;
  maxDeliveryDays: number;
  categoryName: string;
  minMonthlyOrders: number;
  minRating: number;
  isWinningProduct: boolean;
  hasFastShipping: boolean;
  hasVariants: boolean;
  minDiscount: number;
}

interface NewFilterSidebarProps {
  categories: CategoryOption[];
  values: NewFilterSidebarState;
  onChange: (next: NewFilterSidebarState) => void;
  onClear: () => void;
  onFindWinningProducts: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function NewFilterSidebar({ 
  categories, 
  values, 
  onChange, 
  onClear, 
  onFindWinningProducts,
  isVisible,
  onToggle 
}: NewFilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    delivery: true,
    categories: true,
    performance: false,
    advanced: false
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const set = (patch: Partial<NewFilterSidebarState>) => onChange({ ...values, ...patch });

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section,
    badge
  }: { 
    title: string; 
    icon: any; 
    section: keyof typeof expandedSections;
    badge?: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        <span className="text-sm font-semibold text-white group-hover:text-gray-100">{title}</span>
        {badge && (
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
            {badge}
          </span>
        )}
      </div>
      {expandedSections[section] ? 
        <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-300" /> : 
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
      }
    </button>
  );

  // Mobile burger button when sidebar is closed
  if (!isVisible && isMobile) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        title="Open Filters"
      >
        <Menu className="w-5 h-5" />
      </button>
    );
  }

  // Desktop toggle button when sidebar is closed
  if (!isVisible && !isMobile) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-r-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        title="Open Filters"
      >
        <Filter className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-700/50 z-50 overflow-y-auto transform transition-all duration-300 ease-in-out shadow-2xl ${
        isMobile 
          ? 'translate-x-0' 
          : 'lg:translate-x-0'
      }`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/98 backdrop-blur-sm border-b border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Filter className="w-4 h-4 text-white" />
              </div>
              Smart Filters
            </h2>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Content */}
        <div className="p-4 space-y-3">
          
          {/* Find Winning Products Button */}
          <div className="mb-6">
            <button
              onClick={onFindWinningProducts}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 transform hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5" />
              Find Winning Products
            </button>
          </div>

          {/* Ads Library - Coming Soon */}
          <div className="mb-6">
            <div className="relative">
              <button
                disabled
                className="w-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 text-purple-200 font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-not-allowed relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 animate-pulse"></div>
                <BarChart3 className="w-5 h-5 animate-pulse" />
                Ads Library
                <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full animate-pulse">
                  Coming Soon
                </span>
              </button>
              {/* Blinking dot indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full"></div>
            </div>
          </div>

          {/* Price Range Section */}
          <div className="border border-gray-700/50 rounded-xl bg-gray-800/30 backdrop-blur-sm">
            <SectionHeader title="Price Range" icon={DollarSign} section="price" />
            {expandedSections.price && (
              <div className="p-4 space-y-4 border-t border-gray-700/30">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium">Min Price ($)</label>
                    <input
                      type="number"
                      className="w-full bg-gray-800/70 border border-gray-600/60 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      value={values.priceMin}
                      min={0}
                      placeholder="0"
                      onChange={(e) => set({ priceMin: Number(e.target.value || 0) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium">Max Price ($)</label>
                    <input
                      type="number"
                      className="w-full bg-gray-800/70 border border-gray-600/60 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      value={values.priceMax}
                      min={0}
                      placeholder="1000"
                      onChange={(e) => set({ priceMax: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Min Discount (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={values.minDiscount}
                    onChange={(e) => set({ minDiscount: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span className="text-blue-400 font-semibold">{values.minDiscount}%</span>
                    <span>90%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Time Section */}
          <div className="border border-gray-700/50 rounded-xl bg-gray-800/30 backdrop-blur-sm">
            <SectionHeader title="Delivery Time" icon={Timer} section="delivery" />
            {expandedSections.delivery && (
              <div className="p-4 space-y-4 border-t border-gray-700/30">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Max Delivery Time (days)</label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={values.maxDeliveryDays}
                    onChange={(e) => set({ maxDeliveryDays: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 day</span>
                    <span className="text-blue-400 font-semibold">{values.maxDeliveryDays} days</span>
                    <span>60 days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300 font-medium">Fast Shipping Only</span>
                  </div>
                  <button
                    onClick={() => set({ hasFastShipping: !values.hasFastShipping })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      values.hasFastShipping ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                      values.hasFastShipping ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="border border-gray-700/50 rounded-xl bg-gray-800/30 backdrop-blur-sm">
            <SectionHeader 
              title="Categories" 
              icon={Grid} 
              section="categories" 
              badge={values.categoryName ? "1" : "All"}
            />
            {expandedSections.categories && (
              <div className="p-4 border-t border-gray-700/30">
                <div>
                  <label className="block text-xs text-gray-400 mb-3 font-medium">Product Category</label>
                  <select
                    className="w-full bg-gray-800/70 border border-gray-600/60 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    value={values.categoryName}
                    onChange={(e) => set({ categoryName: e.target.value })}
                  >
                    <option value="">🔥 All Categories</option>
                    <optgroup label="🎯 Trending Dropshipping Categories">
                      <option value="electronics">📱 Electronics & Gadgets</option>
                      <option value="home-kitchen">🏠 Home & Kitchen</option>
                      <option value="health-beauty">💄 Health & Beauty</option>
                      <option value="sports-fitness">💪 Sports & Fitness</option>
                      <option value="pets">🐕 Pet Supplies</option>
                      <option value="automotive">🚗 Automotive</option>
                      <option value="toys-games">🎮 Toys & Games</option>
                      <option value="jewelry">💎 Jewelry & Accessories</option>
                      <option value="tools">🔧 Tools & Hardware</option>
                      <option value="outdoor">🏕️ Outdoor & Sports</option>
                      <option value="fashion">👗 Fashion & Apparel</option>
                      <option value="baby">👶 Baby & Kids</option>
                    </optgroup>
                    {categories.length > 0 && (
                      <optgroup label="📂 CJ Categories">
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>{category.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics Section */}
          <div className="border border-gray-700/50 rounded-xl bg-gray-800/30 backdrop-blur-sm">
            <SectionHeader title="Performance Metrics" icon={TrendingUp} section="performance" />
            {expandedSections.performance && (
              <div className="p-4 space-y-4 border-t border-gray-700/30">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Min Profit Margin (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={values.minProfitMargin}
                    onChange={(e) => set({ minProfitMargin: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span className="text-green-400 font-semibold">{values.minProfitMargin}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Min Monthly Orders</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-600/60 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    value={values.minMonthlyOrders}
                    min={0}
                    placeholder="500"
                    onChange={(e) => set({ minMonthlyOrders: Number(e.target.value || 0) })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">Min Rating</label>
                  <select
                    className="w-full bg-gray-800/70 border border-gray-600/60 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    value={values.minRating}
                    onChange={(e) => set({ minRating: Number(e.target.value) })}
                  >
                    <option value={0}>⭐ Any Rating</option>
                    <option value={3}>⭐⭐⭐ 3+ Stars</option>
                    <option value={3.5}>⭐⭐⭐⭐ 3.5+ Stars</option>
                    <option value={4}>⭐⭐⭐⭐ 4+ Stars</option>
                    <option value={4.5}>⭐⭐⭐⭐⭐ 4.5+ Stars</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="border border-gray-700/50 rounded-xl bg-gray-800/30 backdrop-blur-sm">
            <SectionHeader title="Advanced Filters" icon={Sparkles} section="advanced" />
            {expandedSections.advanced && (
              <div className="p-4 space-y-4 border-t border-gray-700/30">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300 font-medium">Winning Products Only</span>
                  </div>
                  <button
                    onClick={() => set({ isWinningProduct: !values.isWinningProduct })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      values.isWinningProduct ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                      values.isWinningProduct ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300 font-medium">Has Variants</span>
                  </div>
                  <button
                    onClick={() => set({ hasVariants: !values.hasVariants })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      values.hasVariants ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${
                      values.hasVariants ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-3 border-t border-gray-700/50 mt-6">
            <button
              onClick={onClear}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-600/60 text-gray-300 hover:bg-gray-800/60 hover:border-gray-500/60 transition-all duration-300 text-sm font-medium"
            >
              Clear All Filters
            </button>
            <div className="text-xs text-gray-500 text-center">
              Filters are applied automatically as you change them
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
