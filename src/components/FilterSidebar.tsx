import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Star, TrendingUp, Clock, DollarSign, Package, Zap } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
}

export interface FilterSidebarState {
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

interface FilterSidebarProps {
  categories: CategoryOption[];
  values: FilterSidebarState;
  onChange: (next: FilterSidebarState) => void;
  onClear: () => void;
  onFindWinningProducts: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function FilterSidebar({ 
  categories, 
  values, 
  onChange, 
  onClear, 
  onFindWinningProducts,
  isVisible,
  onToggle 
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    performance: true,
    shipping: true,
    product: true,
    advanced: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const set = (patch: Partial<FilterSidebarState>) => onChange({ ...values, ...patch });

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section 
  }: { 
    title: string; 
    icon: any; 
    section: keyof typeof expandedSections;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      {expandedSections[section] ? 
        <ChevronUp className="w-4 h-4 text-gray-400" /> : 
        <ChevronDown className="w-4 h-4 text-gray-400" />
      }
    </button>
  );

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-lg shadow-lg transition-colors"
        title="Open Filters"
      >
        <Filter className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 lg:w-80 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:transform-none">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              Filters
            </h2>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters Content */}
        <div className="p-4 space-y-1">
          
          {/* Find Winning Products Button */}
          <div className="mb-6">
            <button
              onClick={onFindWinningProducts}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-5 h-5" />
              Find Winning Products
            </button>
          </div>

          {/* Price Section */}
          <div className="border border-gray-700/50 rounded-lg bg-gray-800/30">
            <SectionHeader title="Price Range" icon={DollarSign} section="price" />
            {expandedSections.price && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Min Price ($)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.priceMin}
                    min={0}
                    placeholder="0"
                    onChange={(e) => set({ priceMin: Number(e.target.value || 0) })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Max Price ($)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.priceMax}
                    min={0}
                    placeholder="1000"
                    onChange={(e) => set({ priceMax: Number(e.target.value || 0) })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Min Discount (%)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.minDiscount}
                    min={0}
                    max={90}
                    placeholder="0"
                    onChange={(e) => set({ minDiscount: Number(e.target.value || 0) })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Performance Section */}
          <div className="border border-gray-700/50 rounded-lg bg-gray-800/30">
            <SectionHeader title="Performance Metrics" icon={TrendingUp} section="performance" />
            {expandedSections.performance && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Min Profit Margin (%)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.minProfitMargin}
                    min={0}
                    max={100}
                    placeholder="20"
                    onChange={(e) => set({ minProfitMargin: Number(e.target.value || 0) })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Min Monthly Orders</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.minMonthlyOrders}
                    min={0}
                    placeholder="500"
                    onChange={(e) => set({ minMonthlyOrders: Number(e.target.value || 0) })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Min Rating</label>
                  <select
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.minRating}
                    onChange={(e) => set({ minRating: Number(e.target.value) })}
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={3.5}>3.5+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Section */}
          <div className="border border-gray-700/50 rounded-lg bg-gray-800/30">
            <SectionHeader title="Shipping & Delivery" icon={Clock} section="shipping" />
            {expandedSections.shipping && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Max Delivery Time (days)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
                    value={values.maxDeliveryDays}
                    min={1}
                    placeholder="30"
                    onChange={(e) => set({ maxDeliveryDays: Number(e.target.value || 30) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Fast Shipping Only</span>
                  <button
                    onClick={() => set({ hasFastShipping: !values.hasFastShipping })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      values.hasFastShipping ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      values.hasFastShipping ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Product Section */}
          <div className="border border-gray-700/50 rounded-lg bg-gray-800/30">
            <SectionHeader title="Product Details" icon={Package} section="product" />
            {expandedSections.product && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Category</label>
                  <select
                    className="w-full bg-gray-800/70 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm"
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
                    </optgroup>
                    {categories.length > 0 && (
                      <optgroup label="📂 Additional Categories">
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>{category.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Has Variants</span>
                  <button
                    onClick={() => set({ hasVariants: !values.hasVariants })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      values.hasVariants ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      values.hasVariants ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="border border-gray-700/50 rounded-lg bg-gray-800/30">
            <SectionHeader title="Advanced Filters" icon={Star} section="advanced" />
            {expandedSections.advanced && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Winning Products Only</span>
                  <button
                    onClick={() => set({ isWinningProduct: !values.isWinningProduct })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      values.isWinningProduct ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      values.isWinningProduct ? 'translate-x-6' : 'translate-x-0'
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
              className="w-full px-4 py-2 rounded-lg border border-gray-700/60 text-gray-300 hover:bg-gray-800/60 transition-colors text-sm"
            >
              Clear All Filters
            </button>
            <div className="text-xs text-gray-500 text-center">
              Filters are applied automatically
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
