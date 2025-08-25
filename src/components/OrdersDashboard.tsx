import React, { useState, useEffect } from 'react';
import { Package, User, Calendar, MapPin, Phone, Mail, ShoppingCart, Truck, CheckCircle, Clock, AlertCircle, RefreshCw, Link2, Copy, Shield, X } from 'lucide-react';
import { Product } from '../types';
import { Order, OrderProduct, SupplierInfo } from '../data/mockOrders';
import { OrdersApiService, OrdersApiConfig, fetchConnectedStoreOrders, updateConnectedOrderStatus } from '../services/ordersApiService';
import { storeManager } from '../services/storeManager';



interface OrdersDashboardProps {
  orders: Order[];
}

export function OrdersDashboard({ orders: mockOrders }: OrdersDashboardProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedStores, setConnectedStores] = useState<OrdersApiConfig[]>([]);
  // demo/live toggle removed; we only show live orders
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [webhookTab, setWebhookTab] = useState<'shopify' | 'woocommerce'>('shopify');
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>('pending');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [saveStatusError, setSaveStatusError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'processing': return 'text-blue-400 bg-blue-900/20';
      case 'shipped': return 'text-purple-400 bg-purple-900/20';
      case 'delivered': return 'text-green-400 bg-green-900/20';
      case 'cancelled': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Load connected stores using stored credentials
  useEffect(() => {
    const loadConnectedStores = () => {
      try {
        const basic = storeManager.getConnections();
        const configs: OrdersApiConfig[] = [];
        for (const b of basic) {
          const full = storeManager.getConnection(b.id);
          if (!full) continue;
          if (b.platform === 'woocommerce' && full.credentials.consumerKey && full.credentials.consumerSecret) {
            const url = full.storeUrl.startsWith('http') ? full.storeUrl : `https://${full.storeUrl}`;
            configs.push({ storeType: 'woocommerce', storeUrl: url, apiKey: full.credentials.consumerKey, apiSecret: full.credentials.consumerSecret });
          } else if (b.platform === 'shopify' && full.credentials.accessToken) {
            configs.push({ storeType: 'shopify', storeUrl: full.storeUrl, apiKey: full.credentials.accessToken } as OrdersApiConfig);
          }
        }
        setConnectedStores(configs);
        console.log('📋 Prepared API configs:', configs);
      } catch (error) {
        console.error('❌ Failed to prepare connected store configs:', error);
      }
    };

    loadConnectedStores();
    
    // Also check every 5 seconds for new connections
    const interval = setInterval(loadConnectedStores, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live orders from connected stores
  const fetchLiveOrders = async () => {
    if (connectedStores.length === 0) {
      console.log('⚠️ No connected stores found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Fetching live orders from connected stores...');
      const allOrders: Order[] = [];

      for (const store of connectedStores) {
        try {
          const storeOrders = await fetchConnectedStoreOrders(store);
          allOrders.push(...storeOrders);
          console.log(`✅ Fetched ${storeOrders.length} orders from ${store.storeType} store`);
        } catch (error) {
          console.error(`❌ Failed to fetch orders from ${store.storeType} store:`, error);
        }
      }

      setLiveOrders(allOrders);
      console.log(`🎉 Total live orders loaded: ${allOrders.length}`);
      
    } catch (error) {
      console.error('❌ Failed to fetch live orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch orders when stores are connected
  useEffect(() => {
    if (connectedStores.length > 0 && !isLoading) {
      fetchLiveOrders();
    }
  }, [connectedStores]);

  useEffect(() => {
    if (selectedOrder) {
      setSelectedStatus(selectedOrder.status);
      setSaveStatusError(null);
    }
  }, [selectedOrder?.id]);

  // Always use live orders (no mock data)
  const currentOrders = liveOrders;

  const filteredOrders = currentOrders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (connectedStores.length === 0) {
      setSaveStatusError('No connected stores. Connect your store first.');
      return false;
    }
    setIsSavingStatus(true);
    setSaveStatusError(null);
    try {
      let updated = false;
      for (const store of connectedStores) {
        try {
          const success = await updateConnectedOrderStatus(store, orderId, newStatus);
          if (success) { updated = true; break; }
        } catch {}
      }
      if (!updated) {
        setSaveStatusError('Failed to update order in connected stores. Check credentials and permissions.');
        return false;
      }
      await fetchLiveOrders();
      const refreshed = liveOrders.find(o => o.id === orderId);
      if (refreshed) setSelectedOrder(refreshed);
      return true;
    } finally {
      setIsSavingStatus(false);
    }
  };

  const webhookBase = 'http://localhost:3001';
  const shopifyWebhookUrl = `${webhookBase}/webhooks/shopify/orders`;
  const woocommerceWebhookUrl = `${webhookBase}/webhooks/woocommerce/orders`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch {
      console.log('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders Dashboard</h1>
          <p className="text-gray-400">
            {connectedStores.length > 0
              ? `Displaying live orders from ${connectedStores.length} connected store${connectedStores.length !== 1 ? 's' : ''}`
              : 'Connect your Shopify or WooCommerce store to view live orders'}
          </p>
          {connectedStores.length > 0 && (
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={fetchLiveOrders}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-full text-xs font-medium transition-all"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-dark-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{currentOrders.length}</div>
            <div className="text-sm text-gray-400">Live Orders</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">
              ${currentOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Total Revenue</div>
          </div>
          {connectedStores.length > 0 && (
            <div className="bg-dark-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{connectedStores.length}</div>
              <div className="text-sm text-gray-400">Connected Stores</div>
            </div>
          )}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="p-3 rounded-xl border border-gray-700/50 bg-gray-800/50 hover:border-purple-500/60 hover:bg-gray-700/50 transition-colors backdrop-blur-sm flex items-center space-x-2"
            title="Webhooks Guide"
          >
            <Shield className="h-5 w-5 text-purple-400" />
            <span className="text-gray-300 text-sm hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>

      {/* Guide modal trigger is in header; modal is below */}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders by customer name, email, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full premium-input rounded-lg"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="premium-input rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
            <div className="p-6 border-b border-dark-600">
              <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  {connectedStores.length === 0 ? (
                    <div>
                      <p className="text-gray-400 mb-2">No connected stores found</p>
                      <p className="text-sm text-gray-500">
                        Connect your WooCommerce or Shopify store to see live orders here.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 mb-2">No orders found</p>
                      <p className="text-sm text-gray-500">
                        {'No live orders available'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-6 border-b border-dark-600 cursor-pointer transition-all hover:bg-dark-700 ${
                      selectedOrder?.id === order.id ? 'bg-dark-700 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">#{order.id}</h3>
                          <p className="text-sm text-gray-400">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                        <p className="text-lg font-bold text-white mt-1">${order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          {order.orderDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Order Details</h3>
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-400" />
                      <span>Customer Information</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-white">{selectedOrder.customerEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-white">{selectedOrder.customerPhone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-white">{selectedOrder.customerAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Products</h4>
                    <div className="space-y-3">
                      {selectedOrder.products.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{item.product.title}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-green-400" />
                      <span>Supplier Information</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Supplier:</span>
                        <span className="text-white ml-2">{selectedOrder.supplierInfo.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Contact:</span>
                        <span className="text-white ml-2">{selectedOrder.supplierInfo.contact}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Website:</span>
                        <a href={selectedOrder.supplierInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 ml-2 hover:underline">
                          {selectedOrder.supplierInfo.website}
                        </a>
                      </div>
                      {selectedOrder.supplierInfo.notes && (
                        <div>
                          <span className="text-gray-400">Notes:</span>
                          <p className="text-white mt-1">{selectedOrder.supplierInfo.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Update Status</h4>
                    <div className="space-y-3">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as Order['status'])}
                        className="w-full premium-input rounded-lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {saveStatusError && (
                        <div className="text-red-400 text-xs">{saveStatusError}</div>
                      )}
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, selectedStatus)}
                        disabled={isSavingStatus}
                        className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isSavingStatus ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 text-center">
              <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Webhooks Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-purple-400" />
                <div>
                  <h3 className="text-white font-semibold">How to receive live orders via Webhooks</h3>
                  <p className="text-gray-400 text-sm">Connect Shopify or WooCommerce so new orders appear automatically.</p>
                </div>
              </div>
              <button onClick={() => setIsGuideOpen(false)} className="p-2 hover:bg-gray-800/60 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-64px)]">
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setWebhookTab('shopify')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${webhookTab==='shopify' ? 'bg-purple-600 text-white' : 'bg-dark-700 text-gray-300'}`}
                >Shopify</button>
                <button
                  onClick={() => setWebhookTab('woocommerce')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${webhookTab==='woocommerce' ? 'bg-purple-600 text-white' : 'bg-dark-700 text-gray-300'}`}
                >WooCommerce</button>
              </div>

              {webhookTab === 'shopify' ? (
                <div className="space-y-4 text-sm">
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Webhook URL</h4>
                    <div className="flex items-center justify-between bg-dark-800 border border-dark-600 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2 text-gray-300 overflow-x-auto">
                        <Link2 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">{shopifyWebhookUrl}</span>
                      </div>
                      <button onClick={() => copy(shopifyWebhookUrl)} className="text-gray-300 hover:text-white"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>In Shopify Admin, go to <span className="text-white">Settings → Notifications → Webhooks</span>.</li>
                    <li>Click <span className="text-white">Create webhook</span>, choose event <span className="text-white">Orders create</span> (you can also add Orders paid, fulfilled).</li>
                    <li>Set the <span className="text-white">URL</span> to the webhook above. Format: <span className="text-white">{shopifyWebhookUrl}</span>.</li>
                    <li>Set <span className="text-white">Webhook API version</span> to 2023-10 or later, and <span className="text-white">JSON</span> as the format.</li>
                    <li>Optionally set a <span className="text-white">secret</span> for HMAC verification. Save the webhook.</li>
                  </ol>
                  <p className="text-gray-400 text-xs">Tip: If your server is not public, expose <span className="text-white">http://localhost:3001</span> with a tunnel (e.g., <span className="text-white">ngrok http 3001</span>) and use that HTTPS URL.</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="bg-dark-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Webhook URL</h4>
                    <div className="flex items-center justify-between bg-dark-800 border border-dark-600 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2 text-gray-300 overflow-x-auto">
                        <Link2 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">{woocommerceWebhookUrl}</span>
                      </div>
                      <button onClick={() => copy(woocommerceWebhookUrl)} className="text-gray-300 hover:text-white"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>In WordPress Admin, go to <span className="text-white">WooCommerce → Settings → Advanced → Webhooks</span>.</li>
                    <li>Click <span className="text-white">Add Webhook</span> and set <span className="text-white">Status</span> to Active.</li>
                    <li>Set <span className="text-white">Topic</span> to <span className="text-white">Order created</span> (add others like updated, paid if needed).</li>
                    <li>Set the <span className="text-white">Delivery URL</span> to the webhook above. Format: <span className="text-white">{woocommerceWebhookUrl}</span>.</li>
                    <li>Provide a <span className="text-white">Secret</span> to sign webhooks, then Save.</li>
                  </ol>
                  <p className="text-gray-400 text-xs">Tip: If your site blocks localhost, expose your proxy with a public HTTPS URL (ngrok, Cloudflare Tunnel) and use that.</p>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-400">
                <p>Note: Webhook endpoints are received by our proxy server on port 3001. Keep the server running while testing.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
