import React, { useState } from 'react';
import { X, Upload, Store, DollarSign, Package, Tags, AlertCircle, CheckCircle, Loader2, Wand2, Percent, TrendingUp, Activity } from 'lucide-react';
import { Product } from '../types';
import { StoreConnection } from '../services/storeManager';
import { AIDescriptionModal } from './AIDescriptionModal';
// Safety shim: ensure useEffect identifier exists even if old bundle expects it
const useEffect = React.useEffect;

interface ProductImportModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  connectedStores: StoreConnection[];
  onImport: (productId: string, storeId: string, importSettings: ImportSettings) => Promise<void>;
}

interface ImportSettings {
  customPrice?: number;
  priceMarkup: number;
  inventory: number;
  customTitle?: string;
  customDescription?: string;
  aiDescription?: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    tags: string[];
  };
  category?: string;
  tags: string[];
}

export function ProductImportModal({ 
  product, 
  isOpen, 
  onClose, 
  connectedStores, 
  onImport 
}: ProductImportModalProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Import settings state with better defaults
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    priceMarkup: 100, // 100% markup by default
    inventory: 50,
    tags: ['dropshipping', 'trending'],
    category: product?.category || 'Clothing',
    customTitle: product?.title || '',
    customDescription: product ? `High-quality ${product.category.toLowerCase()} perfect for fashion-forward individuals. This ${product.title.toLowerCase()} offers excellent value with a ${product.profitMargin}% profit margin and fast delivery within ${product.deliveryTime}.

✨ **Key Features:**
• Premium quality materials
• Trending in the market
• Fast shipping available
• High profit potential
• Perfect for dropshipping

**Why customers love this product:**
This product combines style, quality, and affordability, making it a perfect choice for your store. With its excellent ${product.profitMargin}% profit margin and strong market demand, it's an ideal addition to your product lineup.` : ''
  });

  // Ensure fields default once on open/product change, but never override user edits
  useEffect(() => {
    if (!isOpen || !product) return;
    const defaultDesc = `High-quality ${product.category.toLowerCase()} perfect for fashion-forward individuals. This ${product.title.toLowerCase()} offers excellent value with a ${product.profitMargin}% profit margin and fast delivery within ${product.deliveryTime}.`;
    setImportSettings(prev => ({
      ...prev,
      customTitle: prev.customTitle && prev.customTitle.trim() !== '' ? prev.customTitle : (product.title || ''),
      customDescription: prev.customDescription && prev.customDescription.trim() !== '' ? prev.customDescription : defaultDesc,
      category: prev.category && prev.category.trim() !== '' ? prev.category : (product.category || 'Clothing')
    }));
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const selectedStore = connectedStores.find(store => store.id === selectedStoreId);
  
  // Calculate final price
  const finalPrice = importSettings.customPrice || (product.price * (1 + importSettings.priceMarkup / 100));
  const profitPerSale = finalPrice - product.price;
  const profitMargin = ((profitPerSale / finalPrice) * 100);

  const handleImport = async () => {
    if (!selectedStoreId || !product) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      await onImport(product.id, selectedStoreId, importSettings);
      setImportSuccess(true);
      setTimeout(() => {
        onClose();
        setImportSuccess(false);
        setSelectedStoreId('');
        // Reset settings
        setImportSettings({
          priceMarkup: 100,
          inventory: 50,
          tags: ['dropshipping', 'trending'],
          category: product?.category || 'Clothing',
          customDescription: product ? `High-quality ${product.category.toLowerCase()} perfect for fashion-forward individuals...` : ''
        });
      }, 2000);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAIDescriptionApply = (description: any) => {
    setImportSettings(prev => ({
      ...prev,
      aiDescription: description,
      customTitle: description.title,
      customDescription: description.fullDescription,
      tags: [...prev.tags, ...description.tags].filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
    }));
    setIsAIModalOpen(false);
  };

  const updateSetting = (key: keyof ImportSettings, value: any) => {
    setImportSettings(prev => ({ ...prev, [key]: value }));
  };

  // Small stat card to mirror analyze modal metric cards
  const StatCard: React.FC<{
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle?: string;
    gradient: string;
    color: string;
  }> = ({ icon: Icon, title, value, subtitle, gradient, color }) => (
    <div className={`relative overflow-hidden rounded-xl p-4 ${gradient} border border-gray-700/50 backdrop-blur-sm`}>
      <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-6 -translate-y-6">
        <div className={`w-full h-full rounded-full ${color} opacity-20`} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
          <div className="text-right">
            <div className="text-xl font-bold text-white">{value}</div>
            {subtitle && <div className="text-[11px] text-gray-300">{subtitle}</div>}
          </div>
        </div>
        <div className="text-sm text-gray-300">{title}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-7xl max-h-[95vh] overflow-hidden">
          {/* Header - match analyze with product image */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
            <div className="relative p-6 border-b border-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-xl" />
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="relative w-16 h-16 rounded-xl object-cover border border-gray-600/50 shadow-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Import Product
                    </h2>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-2xl font-bold text-green-400">
                          ${finalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                        <span className="text-gray-300 text-sm">Markup {importSettings.priceMarkup}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 group"
                >
                  <X className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-250px)]">
            {/* Top Stat row to mirror analyze */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={DollarSign}
                title="Original Cost"
                value={`$${product.price.toFixed(2)}`}
                subtitle="supplier"
                gradient="bg-gradient-to-br from-green-900/30 to-emerald-900/30"
                color="bg-green-500"
              />
              <StatCard
                icon={TrendingUp}
                title="Price Markup"
                value={`${importSettings.priceMarkup}%`}
                subtitle="adjustable"
                gradient="bg-gradient-to-br from-purple-900/30 to-violet-900/30"
                color="bg-purple-500"
              />
              <StatCard
                icon={Store}
                title="Selected Store"
                value={selectedStore ? selectedStore.storeName : 'None'}
                subtitle={selectedStore ? selectedStore.platform : 'Choose below'}
                gradient="bg-gradient-to-br from-blue-900/30 to-cyan-900/30"
                color="bg-blue-500"
              />
              <StatCard
                icon={Package}
                title="Inventory"
                value={`${importSettings.inventory}`}
                subtitle="units"
                gradient="bg-gradient-to-br from-orange-900/30 to-red-900/30"
                color="bg-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Product & Store Selection */}
              <div className="space-y-6">
                {/* Product Preview */}
                <div className="p-4 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-lg border border-dark-600"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">
                        {importSettings.customTitle || product.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-purple-400 font-medium">
                          Original: ${product.price.toFixed(2)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-green-400 font-medium">
                          Selling: ${finalPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-yellow-400">⭐ {product.rating > 0 ? product.rating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Selection */}
                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-4">
                  <label className="block text-purple-300 font-medium mb-3">
                    Select Store
                  </label>
                  {connectedStores.length === 0 ? (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 text-sm">
                        No stores connected. Please connect a store first.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {connectedStores.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => setSelectedStoreId(store.id)}
                          className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                            selectedStoreId === store.id
                              ? 'border-purple-500/60 bg-purple-900/20'
                              : 'border-gray-700/50 bg-gray-800/50 hover:border-purple-400/60'
                          } backdrop-blur-sm`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Store className="h-5 w-5 text-purple-400" />
                              <div>
                                <div className="text-white font-medium">{store.storeName}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    store.isActive 
                                      ? 'bg-green-900/30 text-green-400' 
                                      : 'bg-gray-900/30 text-gray-400'
                                  }`}>
                                    {store.platform}
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    {store.storeUrl}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {selectedStoreId === store.id && (
                              <CheckCircle className="h-5 w-5 text-purple-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing Settings with Sliders */}
                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-4">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-400 mr-2" />
                    Pricing & Profit
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Price Markup Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-gray-300">
                          Price Markup
                        </label>
                        <span className="text-purple-400 font-bold">
                          {importSettings.priceMarkup}%
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="300"
                          step="5"
                          value={importSettings.priceMarkup}
                          onChange={(e) => updateSetting('priceMarkup', parseFloat(e.target.value))}
                          className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>150%</span>
                          <span>300%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended: 100-200% for good profit margins
                      </p>
                    </div>

                    {/* Inventory Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-gray-300">
                          Stock Quantity
                        </label>
                        <span className="text-blue-400 font-bold">
                          {importSettings.inventory} units
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="200"
                          step="1"
                          value={importSettings.inventory}
                          onChange={(e) => updateSetting('inventory', parseInt(e.target.value))}
                          className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1</span>
                          <span>100</span>
                          <span>200</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Available: {product.stockAvailable}
                      </p>
                    </div>

                    {/* Profit Summary */}
                    <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-300">Final Price:</span>
                        <span className="text-green-400 font-bold text-lg">
                          ${finalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Profit per sale:</span>
                        <span className="text-green-400 font-semibold">
                          ${profitPerSale.toFixed(2)} ({profitMargin.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Details */}
              <div className="space-y-6">
                {/* Product Title */}
                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={importSettings.customTitle || product.title}
                    onChange={(e) => updateSetting('customTitle', e.target.value)}
                    className="premium-input w-full rounded-2xl"
                    placeholder="Product title"
                  />
                </div>

                {/* Product Description - Always Visible Editor */}
                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Product Description
                    </label>
                    <button
                      onClick={() => setIsAIModalOpen(true)}
                      className="premium-button-secondary flex items-center space-x-2 text-sm"
                    >
                      <Wand2 className="h-4 w-4" />
                      <span>Enhance with AI</span>
                    </button>
                  </div>
                  <textarea
                    value={importSettings.customDescription || ''}
                    onChange={(e) => updateSetting('customDescription', e.target.value)}
                    className="premium-input w-full h-40 resize-none rounded-2xl"
                    placeholder="Enter product description..."
                  />
                  {importSettings.aiDescription && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                      <p className="text-green-300 text-sm flex items-center">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Description enhanced with AI
                      </p>
                    </div>
                  )}
                </div>

                {/* Category and Tags */}
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={importSettings.category}
                        onChange={(e) => updateSetting('category', e.target.value)}
                        className="premium-input w-full rounded-2xl"
                        placeholder="Product category"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={importSettings.tags.join(', ')}
                        onChange={(e) => updateSetting('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                        className="premium-input w-full rounded-2xl"
                        placeholder="dropshipping, trending, fashion"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Summary */}
            {selectedStore && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-3">Import Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">Platform:</span>
                    <div className="text-white font-medium capitalize">{selectedStore.platform}</div>
                  </div>
                  <div>
                    <span className="text-gray-300">Final Price:</span>
                    <div className="text-white font-medium">${finalPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-300">Profit:</span>
                    <div className="text-green-400 font-medium">${profitPerSale.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-300">Stock:</span>
                    <div className="text-white font-medium">{importSettings.inventory} units</div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-300 text-xs">
                    📸 Note: Images will need to be added manually after import due to platform restrictions.
                  </p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {importError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{importError}</p>
              </div>
            )}

            {importSuccess && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/20 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm">Product imported successfully!</p>
              </div>
            )}
          </div>

          {/* Footer - match analyze */}
          <div className="relative p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <span>Ready to import • {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all duration-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedStoreId || isImporting || connectedStores.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Import Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Description Modal */}
      <AIDescriptionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        productInfo={{
          name: product.title,
          category: product.category,
          price: finalPrice,
          originalDescription: importSettings.customDescription || `High-quality ${product.category.toLowerCase()} with ${profitMargin.toFixed(1)}% profit margin.`,
          tags: product.tags
        }}
        onApply={handleAIDescriptionApply}
      />
    </>
  );
} 