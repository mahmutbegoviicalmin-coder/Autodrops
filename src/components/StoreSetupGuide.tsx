import { useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingBag, Globe, Copy, ExternalLink, CheckCircle, AlertTriangle, Shield, TestTube } from 'lucide-react';

interface StoreSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoreSetupGuide({ isOpen, onClose }: StoreSetupGuideProps) {
  const [activeSection, setActiveSection] = useState<'shopify' | 'woocommerce'>('shopify');
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-effect rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-premium-lg">
        <div className="sticky top-0 glass-effect p-6 border-b border-dark-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Store Setup Guide</h2>
              <p className="text-gray-400">Get your API credentials to connect your store</p>
            </div>
            <button
              onClick={onClose}
              className="premium-button-secondary px-4 py-2 rounded-lg text-sm"
            >
              Close Guide
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Platform Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveSection('shopify')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeSection === 'shopify'
                  ? 'bg-green-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Shopify</span>
            </button>
            <button
              onClick={() => setActiveSection('woocommerce')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeSection === 'woocommerce'
                  ? 'bg-purple-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              <Globe className="h-5 w-5" />
              <span>WooCommerce</span>
            </button>
          </div>

          {/* Shopify Guide */}
          {activeSection === 'shopify' && (
            <div className="space-y-6">
              <div className="p-6 bg-green-900/20 rounded-xl border border-green-500/20">
                <h3 className="text-xl font-bold text-white mb-4">📋 Shopify Private App Setup (2 minutes)</h3>
                <p className="text-gray-300 mb-4">
                  Create a private app in your Shopify admin to get API access for importing products.
                </p>
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                  <p className="text-blue-300 text-sm">
                    💡 <strong>Private apps</strong> are secure and only work with your specific store.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Access Your Shopify Admin</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Log into your Shopify store admin panel
                      </p>
                      <div className="bg-dark-700 p-3 rounded-lg">
                        <p className="text-green-400 text-sm">📍 Usually at yourstore.myshopify.com/admin</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Navigate to Apps Section</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Go to: <span className="font-mono bg-dark-700 px-2 py-1 rounded">Apps → App and sales channel settings</span>
                      </p>
                      <div className="bg-dark-700 p-3 rounded-lg">
                        <p className="text-green-400 text-sm">📍 Look for "Develop apps" link at the bottom</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Enable App Development</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Click <span className="font-mono bg-dark-700 px-2 py-1 rounded">"Allow custom app development"</span> if needed
                      </p>
                      <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                        <p className="text-blue-300 text-sm">
                          💡 This is a one-time setup to enable private app creation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Create Private App</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Click <span className="font-mono bg-dark-700 px-2 py-1 rounded">"Create an app"</span> and configure:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300 text-sm">App name: <strong>AutoDrops Integration</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300 text-sm">Enable <strong>Products</strong> → Read and Write</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300 text-sm">Enable <strong>Inventory</strong> → Read and Write</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Install & Get Token</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Click <span className="font-mono bg-dark-700 px-2 py-1 rounded">"Install app"</span> then copy your <strong>Admin API access token</strong>
                      </p>
                      <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20">
                        <p className="text-yellow-300 text-sm">
                          ⚠️ The token starts with <span className="font-mono">shpca_</span> or <span className="font-mono">shpat_</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-green-900/20 rounded-xl border border-green-500/20">
                <h4 className="text-white font-semibold mb-2">🎉 You're Ready!</h4>
                <p className="text-gray-300 text-sm">
                  Use your store URL (like <span className="font-mono">mystore.myshopify.com</span>) and the access token in AutoDrops to connect your store.
                </p>
              </div>
            </div>
          )}

          {/* WooCommerce Guide */}
          {activeSection === 'woocommerce' && (
            <div className="space-y-6">
              <div className="p-6 bg-purple-900/20 rounded-xl border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-4">📋 WooCommerce API Setup (3 minutes)</h3>
                <p className="text-gray-300 mb-4">
                  Generate API keys in your WordPress WooCommerce store to enable product imports.
                </p>
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                  <p className="text-blue-300 text-sm">
                    💡 <strong>REST API keys</strong> allow secure communication between AutoDrops and your store.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Access WordPress Admin</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Log into your WordPress dashboard where WooCommerce is installed
                      </p>
                      <div className="bg-dark-700 p-3 rounded-lg">
                        <p className="text-purple-400 text-sm">📍 Usually at yourstore.com/wp-admin</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Navigate to API Settings</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Go to: <span className="font-mono bg-dark-700 px-2 py-1 rounded">WooCommerce → Settings → Advanced → REST API</span>
                      </p>
                      <div className="bg-dark-700 p-3 rounded-lg">
                        <p className="text-purple-400 text-sm">📍 Look for the "REST API" tab under Advanced settings</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Create API Key</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Click <span className="font-mono bg-dark-700 px-2 py-1 rounded">"Add key"</span> to create a new API key
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-300 text-sm">Description: <strong>AutoDrops Integration</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-300 text-sm">User: <strong>Select admin user</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-300 text-sm">Permissions: <strong>Read/Write</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Copy Your Credentials</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        After generating, copy both keys:
                      </p>
                      <div className="space-y-2">
                        <div className="bg-dark-700 p-3 rounded-lg">
                          <p className="text-purple-400 text-sm">
                            <strong>Consumer Key:</strong> Starts with <span className="font-mono">ck_</span>
                          </p>
                        </div>
                        <div className="bg-dark-700 p-3 rounded-lg">
                          <p className="text-purple-400 text-sm">
                            <strong>Consumer Secret:</strong> Starts with <span className="font-mono">cs_</span>
                          </p>
                        </div>
                      </div>
                      <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20 mt-3">
                        <p className="text-yellow-300 text-sm">
                          ⚠️ Copy these immediately - the secret won't be shown again!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Testing Section */}
              <div className="space-y-4">
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                      <TestTube className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Test Your Connection</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Before using AutoDrops, test your API connection:
                      </p>
                      <div className="bg-dark-700 p-3 rounded-lg">
                        <code className="text-purple-400 text-xs">
                          curl -X GET "https://yourstore.com/wp-json/wc/v3/system_status" \<br />
                          &nbsp;&nbsp;-u "ck_your_key:cs_your_secret"
                        </code>
                      </div>
                      <p className="text-gray-400 text-xs mt-2">
                        Should return your store's system status without errors
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Security Best Practices</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300 text-sm">Never share your API keys publicly</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300 text-sm">Use HTTPS (SSL) on your store</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300 text-sm">Regularly update WordPress & WooCommerce</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300 text-sm">Monitor API usage in WooCommerce logs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-xl border border-dark-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">Common Issues & Solutions</h4>
                      <div className="space-y-3">
                        <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                          <p className="text-red-300 text-sm font-semibold">❌ "Consumer key is missing"</p>
                          <p className="text-gray-300 text-xs mt-1">Check that both Consumer Key and Secret are correctly entered</p>
                        </div>
                        <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                          <p className="text-red-300 text-sm font-semibold">❌ "401 Unauthorized"</p>
                          <p className="text-gray-300 text-xs mt-1">Ensure your user has admin privileges and API is enabled</p>
                        </div>
                        <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                          <p className="text-red-300 text-sm font-semibold">❌ "SSL required"</p>
                          <p className="text-gray-300 text-xs mt-1">Your store needs HTTPS/SSL certificate for API access</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-purple-900/20 rounded-xl border border-purple-500/20">
                <h4 className="text-white font-semibold mb-2">🎉 You're Ready!</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Use your full store URL (like <span className="font-mono">https://mystore.com</span>) and both API keys in AutoDrops to connect your store.
                </p>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/20">
                  <p className="text-green-300 text-sm">
                    💡 <strong>Pro Tip:</strong> Test the connection first to ensure everything works before importing products!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 