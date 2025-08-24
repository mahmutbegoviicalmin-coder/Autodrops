import { useState, useEffect } from 'react';
import { X, Database, Trash2, BarChart3, Clock, HardDrive } from 'lucide-react';
import { cacheManager } from '../services/cacheManager';

interface CacheStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CacheStats {
  memoryEntries: number;
  storageEntries: number;
  storageSize: number;
}

export function CacheStatsModal({ isOpen, onClose }: CacheStatsModalProps) {
  const [stats, setStats] = useState<CacheStats>({ memoryEntries: 0, storageEntries: 0, storageSize: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen, refreshKey]);

  const updateStats = () => {
    const newStats = cacheManager.getCacheStats();
    setStats(newStats);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all cached data? This will increase API usage.')) {
      cacheManager.clearAll();
      setRefreshKey(prev => prev + 1);
      console.log('🧹 All cache data cleared by user');
    }
  };

  const handleInvalidateSearches = () => {
    if (confirm('Clear all search result caches? New searches will use API credits.')) {
      cacheManager.invalidate('search_products');
      setRefreshKey(prev => prev + 1);
      console.log('🧹 Search caches cleared by user');
    }
  };

  if (!isOpen) return null;

  const storagePercentage = Math.min((stats.storageSize / (100 * 1024 * 1024)) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Cache Statistics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Memory Cache Stats */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Memory Cache</h3>
            </div>
            <div className="text-sm text-blue-700">
              <p><strong>{stats.memoryEntries}</strong> entries stored</p>
              <p className="text-xs mt-1">Fast access, cleared on refresh</p>
            </div>
          </div>

          {/* Storage Cache Stats */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <HardDrive className="w-4 h-4 mr-2 text-green-600" />
              <h3 className="font-semibold text-green-800">Persistent Storage</h3>
            </div>
            <div className="text-sm text-green-700">
              <p><strong>{stats.storageEntries}</strong> entries stored</p>
              <p><strong>{formatBytes(stats.storageSize)}</strong> used</p>
              
              {/* Storage Usage Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Usage</span>
                  <span>{storagePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      storagePercentage > 80 ? 'bg-red-500' : 
                      storagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${storagePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Cache Benefits */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Cache Benefits</h3>
            </div>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Saves API credits and money 💰</p>
              <p>• Faster loading times ⚡</p>
              <p>• Works offline for cached data 📱</p>
              <p>• Reduces rate limiting issues 🚫</p>
            </div>
          </div>

          {/* Cache TTL Info */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Cache Lifetimes</h3>
            <div className="text-sm text-purple-700 space-y-1">
              <p>• Search results: <strong>1 hour</strong></p>
              <p>• Product details: <strong>24 hours</strong></p>
              <p>• Categories: <strong>7 days</strong></p>
              <p>• Reviews: <strong>12 hours</strong></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={updateStats}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh Stats
            </button>
            <button
              onClick={handleInvalidateSearches}
              className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors text-sm"
            >
              Clear Searches
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Cache automatically cleans up expired entries every 5 minutes
          </div>
        </div>
      </div>
    </div>
  );
} 