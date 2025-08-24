import React, { useState, useEffect } from 'react';
import { X, Store, Loader, CheckCircle, AlertCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { StoreSetupGuide } from './StoreSetupGuide';
import { storeManager, StoreConnection } from '../services/storeManager';

interface StoreConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connection: any) => void;
}

export const StoreConnectionModal: React.FC<StoreConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'shopify' | 'woocommerce' | 'bigcommerce' | 'squarespace'>('shopify');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [savedConnections, setSavedConnections] = useState<StoreConnection[]>([]);

  // Form data
  const [storeUrl, setStoreUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');

  // Load saved connections when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedConnections();
      // Auto-cleanup old connections
      storeManager.cleanupOldConnections();
    }
  }, [isOpen]);

  const loadSavedConnections = () => {
    const connections = storeManager.getConnections();
    setSavedConnections(connections);
    console.log(`📋 Loaded ${connections.length} saved connections`);
  };

  const handleConnect = async () => {
    if (!storeUrl.trim()) {
      setConnectionError('Store URL is required');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    setConnectionSuccess(null);

    try {
      let result;
      let storeName = '';

      if (selectedPlatform === 'shopify') {
        if (!accessToken.trim()) {
          throw new Error('Access token is required for Shopify');
        }

        const { ShopifyIntegration } = await import('../services/storeIntegrations');
        const shopify = new ShopifyIntegration(storeUrl, accessToken);
        result = await shopify.testConnection();
        storeName = storeUrl; // Will be updated after successful connection
      } else if (selectedPlatform === 'woocommerce') {
        if (!consumerKey.trim() || !consumerSecret.trim()) {
          throw new Error('Consumer Key and Secret are required for WooCommerce');
        }

        const { WooCommerceIntegration } = await import('../services/storeIntegrations');
        const woocommerce = new WooCommerceIntegration(storeUrl, consumerKey, consumerSecret);
        result = await woocommerce.testConnection();
        storeName = storeUrl; // Will be updated after successful connection
      } else {
        throw new Error(`${selectedPlatform} integration is not yet available`);
      }

      if (result.success) {
        // Save the connection persistently
        console.log('🔍 Saving connection with credentials');

        const connectionId = storeManager.saveConnection(
          selectedPlatform,
          storeUrl,
          {
            accessToken: selectedPlatform === 'shopify' ? accessToken : undefined,
            consumerKey: selectedPlatform === 'woocommerce' ? consumerKey : undefined,
            consumerSecret: selectedPlatform === 'woocommerce' ? consumerSecret : undefined,
          },
          storeName
        );

        setConnectionSuccess(`Successfully connected to ${selectedPlatform}!`);
        
        // Notify parent component
        onConnect({
          id: connectionId,
          platform: selectedPlatform,
          storeUrl,
          storeName,
          isActive: true
        });

        // Refresh the saved connections list
        loadSavedConnections();

        // Clear form
        setStoreUrl('');
        setAccessToken('');
        setConsumerKey('');
        setConsumerSecret('');
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUseConnection = async (connection: StoreConnection) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Test the saved connection
      const result = await storeManager.testStoredConnection(connection.id);
      
      if (result.success) {
        setConnectionSuccess(`Connected to ${connection.storeName}!`);
        onConnect(connection);
      } else {
        throw new Error(result.error || 'Saved connection is no longer valid');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to use saved connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('Are you sure you want to delete this saved connection?')) {
      storeManager.removeConnection(connectionId);
      loadSavedConnections();
    }
  };

  const resetForm = () => {
    setStoreUrl('');
    setAccessToken('');
    setConsumerKey('');
    setConsumerSecret('');
    setConnectionError(null);
    setConnectionSuccess(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-dark-800 rounded-2xl shadow-premium-lg border border-dark-600 w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-dark-600 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-gradient rounded-xl flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Connect Your Store</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Connect once, use everywhere
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Saved Connections */}
            {savedConnections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 text-purple-400 mr-2" />
                  Saved Connections
                </h3>
                <div className="space-y-3">
                  {savedConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="p-4 bg-dark-700 rounded-lg border border-dark-600 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Store className="h-5 w-5 text-purple-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{connection.storeName}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              connection.isActive 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-gray-900/30 text-gray-400'
                            }`}>
                              {connection.platform}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            Last used: {connection.lastUsed.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUseConnection(connection)}
                          disabled={isConnecting}
                          className="premium-button-secondary text-sm px-3 py-1"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dark-600 my-6"></div>
              </div>
            )}

            {/* Platform Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Connection</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'shopify', name: 'Shopify', icon: '🛍️' },
                  { id: 'woocommerce', name: 'WooCommerce', icon: '🛒' },
                  { id: 'bigcommerce', name: 'BigCommerce', icon: '📦', disabled: true },
                  { id: 'squarespace', name: 'Squarespace', icon: '⬜', disabled: true }
                ].map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => platform.disabled ? null : setSelectedPlatform(platform.id as any)}
                    disabled={platform.disabled}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      selectedPlatform === platform.id
                        ? 'border-purple-500 bg-purple-900/20'
                        : platform.disabled
                        ? 'border-dark-600 bg-dark-700 opacity-50 cursor-not-allowed'
                        : 'border-dark-600 bg-dark-700 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="text-white font-medium">{platform.name}</div>
                    {platform.disabled && (
                      <div className="text-gray-500 text-xs mt-1">Coming Soon</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-purple-400 font-medium mb-2">
                  Store URL
                </label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder={
                    selectedPlatform === 'shopify' 
                      ? 'your-store.myshopify.com' 
                      : 'https://yourstore.com'
                  }
                  className="premium-input w-full"
                />
              </div>

              {selectedPlatform === 'shopify' && (
                <div>
                  <label className="block text-purple-400 font-medium mb-2">
                    Admin API Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="shpat_..."
                    className="premium-input w-full"
                  />
                </div>
              )}

              {selectedPlatform === 'woocommerce' && (
                <>
                  <div>
                    <label className="block text-purple-400 font-medium mb-2">
                      Consumer Key
                    </label>
                    <input
                      type="text"
                      value={consumerKey}
                      onChange={(e) => setConsumerKey(e.target.value)}
                      placeholder="ck_..."
                      className="premium-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-400 font-medium mb-2">
                      Consumer Secret
                    </label>
                    <input
                      type="password"
                      value={consumerSecret}
                      onChange={(e) => setConsumerSecret(e.target.value)}
                      placeholder="cs_..."
                      className="premium-input w-full"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Status Messages */}
            {connectionError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{connectionError}</p>
              </div>
            )}

            {connectionSuccess && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/20 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm">{connectionSuccess}</p>
              </div>
            )}

            {/* Need Help Banner */}
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-blue-400 font-medium">Need help setting up?</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Step-by-step guides for each platform
                  </p>
                </div>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="premium-button-secondary text-sm"
                >
                  View Guide
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-dark-600 bg-dark-900/50">
            <div className="flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                🔒 Your credentials are stored securely in your browser
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={resetForm}
                  className="premium-button-secondary"
                >
                  Reset
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="premium-button flex items-center space-x-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4" />
                      <span>Connect Store</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guide Modal */}
      <StoreSetupGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </>
  );
}; 