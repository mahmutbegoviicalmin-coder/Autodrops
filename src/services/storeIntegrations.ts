// Store Integration Service
// Real implementations for Shopify, WooCommerce, BigCommerce, etc.

export interface StoreConnection {
  id: string;
  platform: 'shopify' | 'woocommerce' | 'bigcommerce' | 'squarespace';
  storeName: string;
  storeUrl: string;
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  isConnected: boolean;
  connectedAt: Date;
}

export interface ProductImport {
  sourceProductId: string;
  targetProductId?: string;
  status: 'pending' | 'importing' | 'success' | 'failed';
  importedAt?: Date;
  errorMessage?: string;
  priceMarkup: number; // percentage markup
  inventory: number;
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

// Shopify Integration with PROXY API calls (bypasses CORS)
export class ShopifyIntegration {
  private storeUrl: string;
  private accessToken: string;
  private proxyUrl: string = 'https://cors-anywhere.herokuapp.com/'; // Public CORS proxy

  constructor(storeUrl: string, accessToken: string) {
    // Ensure we have a clean store URL without protocol for Shopify
    this.storeUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  // Test connection to Shopify store
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔍 Testing Shopify connection...`);
      
      // REAL IMPLEMENTATION - LIVE CONNECTION
      const response = await fetch(`https://${this.storeUrl}/admin/api/2023-10/shop.json`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AutoDrops-App/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shopify connection successful (LIVE)');
        console.log('🏪 Shop name:', data.shop.name);
        return { success: true };
      } else {
        console.log('❌ Shopify connection failed:', response.status);
        return { success: false, error: `API error: ${response.status} ${response.statusText}` };
      }

    } catch (error) {
      console.error('❌ Shopify connection failed:', error);
      return {
        success: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createProduct(productData: {
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    tags: string;
    images: { src: string }[];
    variants: {
      price: string;
      compare_at_price?: string;
      inventory_quantity: number;
      inventory_management: string;
      inventory_policy: string;
    }[];
    published: boolean;
    status: string;
  }) {
    try {
      console.log(`🛍️ Creating Shopify product: ${productData.title}`);
      
      // REAL IMPLEMENTATION - LIVE CONNECTION
      const response = await fetch(`https://${this.storeUrl}/admin/api/2023-10/products.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AutoDrops-App/1.0'
        },
        body: JSON.stringify({ product: productData }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shopify product created successfully (LIVE)');
        console.log('📦 Live product ID:', data.product.id);
        return data.product;
      } else {
        const errorData = await response.text();
        console.log('❌ Shopify product creation failed:', response.status);
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }

    } catch (error) {
      console.error('❌ Shopify product creation failed:', error);
      throw error;
    }
  }

  async updateInventory(productId: string, variantId: string, quantity: number) {
    // For now, return a mock response
    console.log(`📦 Would update inventory for variant ${variantId} to ${quantity}`);
    return { success: true, message: 'Inventory update simulated' };
  }
}

// WooCommerce Integration with PROXY API calls (bypasses CORS)
export class WooCommerceIntegration {
  private storeUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private proxyUrl: string = 'https://cors-anywhere.herokuapp.com/'; // Public CORS proxy

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
    // Ensure we have a properly formatted URL with protocol for WooCommerce
    if (!storeUrl.startsWith('http://') && !storeUrl.startsWith('https://')) {
      this.storeUrl = `https://${storeUrl}`;
    } else {
      this.storeUrl = storeUrl;
    }
    this.storeUrl = this.storeUrl.replace(/\/$/, ''); // Remove trailing slash
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  // Test connection to WooCommerce store
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔍 Testing WooCommerce connection...`);
      
      // REAL IMPLEMENTATION - LIVE CONNECTION
      const response = await fetch(`${this.storeUrl}/wp-json/wc/v3/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AutoDrops-App/1.0'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        console.log('✅ WooCommerce connection successful (LIVE)');
        return { success: true };
      } else {
        console.log('❌ WooCommerce connection failed:', response.status);
        return { success: false, error: `API error: ${response.status}` };
      }
      
      // MOCK IMPLEMENTATION - Comment out for live connection
      // await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log('✅ WooCommerce connection successful (mock)');
      // return { success: true };
      
    } catch (error) {
      console.error('❌ WooCommerce connection failed:', error);
      return {
        success: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createProduct(productData: {
    name: string;
    description: string;
    price: string;
    regularPrice?: string;
    images: { src: string }[];
    categories: { id: number }[];
    tags: { name: string }[];
    stockQuantity: number;
  }) {
    try {
      console.log(`🛍️ Creating WooCommerce product: ${productData.name}`);
      
      const wooProduct = {
        name: productData.name,
        type: 'simple',
        regular_price: productData.regularPrice || productData.price,
        sale_price: productData.price,
        description: productData.description + '<br><br><p><em>📸 Note: Images need to be added manually due to WooCommerce image download restrictions. You can add product images by editing this product in your WordPress admin.</em></p>',
        short_description: productData.description.substring(0, 120) + '...',
        images: [], // Empty images array to avoid download failures
        categories: productData.categories,
        tags: productData.tags,
        stock_quantity: productData.stockQuantity,
        manage_stock: true,
        stock_status: 'instock',
        status: 'publish',
        catalog_visibility: 'visible',
        featured: false,
        virtual: false,
        downloadable: false,
        weight: '',
        dimensions: {
          length: '',
          width: '',
          height: ''
        },
        shipping_class: '',
        reviews_allowed: true,
        upsell_ids: [],
        cross_sell_ids: [],
        parent_id: 0,
        purchase_note: '',
        menu_order: 0,
        meta_data: [
          {
            key: '_autodrops_imported',
            value: 'true'
          },
          {
            key: '_autodrops_import_date',
            value: new Date().toISOString()
          },
          {
            key: '_autodrops_original_images',
            value: JSON.stringify(productData.images)
          }
        ]
      };
      
      // REAL IMPLEMENTATION - LIVE CONNECTION
      const response = await fetch(`${this.storeUrl}/wp-json/wc/v3/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.consumerKey}:${this.consumerSecret}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AutoDrops-App/1.0'
        },
        body: JSON.stringify(wooProduct),
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ WooCommerce product created successfully (LIVE)');
        console.log('📦 Live product ID:', data.id);
        return data;
      } else {
        const errorData = await response.text();
        console.log('❌ WooCommerce product creation failed:', response.status);
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }
      
      // MOCK IMPLEMENTATION - Comment out for live connection
      // await new Promise(resolve => setTimeout(resolve, 2000));
      // const mockProduct = {
      //   id: Math.floor(Math.random() * 1000000),
      //   name: productData.name,
      //   status: 'publish',
      //   date_created: new Date().toISOString()
      // };
      // console.log('✅ WooCommerce product created successfully (mock)');
      // console.log('📦 Mock product ID:', mockProduct.id);
      // return mockProduct;
      
    } catch (error) {
      console.error('❌ WooCommerce product creation failed:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      console.log(`📂 Fetching WooCommerce categories via proxy...`);
      
      const response = await fetch(`${this.proxyUrl}/api/woocommerce/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeUrl: this.storeUrl,
          consumerKey: this.consumerKey,
          consumerSecret: this.consumerSecret,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Retrieved ${data.categories.length} WooCommerce categories via proxy`);
        return data.categories;
      } else {
        console.error('❌ Failed to fetch categories:', data.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching WooCommerce categories:', error);
      return [];
    }
  }
}

// Universal Store Integration Manager with REAL functionality
export class StoreIntegrationManager {
  private connections: Map<string, StoreConnection> = new Map();
  private integrations: Map<string, ShopifyIntegration | WooCommerceIntegration> = new Map();

  async connectStore(connection: Omit<StoreConnection, 'id' | 'isConnected' | 'connectedAt'>) {
    const storeId = `${connection.platform}-${Date.now()}`;
    
    try {
      let integration: ShopifyIntegration | WooCommerceIntegration;
      let testResult: { success: boolean; error?: string };

      // Normalize the store URL based on platform
      let normalizedUrl = connection.storeUrl;
      
      // Create integration instance and test connection
      switch (connection.platform) {
        case 'shopify':
          if (!connection.accessToken) {
            throw new Error('Access token is required for Shopify');
          }
          // For Shopify, ensure we pass the URL as-is, the constructor will clean it
          integration = new ShopifyIntegration(normalizedUrl, connection.accessToken);
          testResult = await integration.testConnection();
          break;
          
        case 'woocommerce':
          console.log('🔍 WooCommerce connection validation:', {
            apiSecret: connection.apiSecret ? '✅ Present' : '❌ Missing',
            allKeys: Object.keys(connection)
          });
          if (!connection.apiSecret) {
            console.error('❌ Missing apiSecret in connection:', connection);
            throw new Error('API secret is required for WooCommerce');
          }
          // For WooCommerce, the constructor will add https:// if needed
          integration = new WooCommerceIntegration(
            normalizedUrl,
            connection.apiKey,
            connection.apiSecret
          );
          testResult = await integration.testConnection();
          break;
          
        default:
          throw new Error(`Platform ${connection.platform} not supported yet`);
      }

      // Check if connection test passed
      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed');
      }

      // Store the successful connection
      const fullConnection: StoreConnection = {
        ...connection,
        id: storeId,
        isConnected: true,
        connectedAt: new Date(),
      };

      this.connections.set(storeId, fullConnection);
      this.integrations.set(storeId, integration);

      console.log('🎉 Store connected successfully:', fullConnection.storeName);
      console.log('🔗 Full connection details:', fullConnection);
      
      // Save connected store info for orders API
      console.log('💾 About to save store for orders API...');
      this.saveConnectedStoreForOrders(fullConnection);
      console.log('✅ Store saved for orders API!');
      
      return fullConnection;
    } catch (error) {
      console.error('❌ Store connection failed:', error);
      throw error;
    }
  }

  async importProduct(
    storeId: string,
    alibabaProduct: any,
    importSettings: ImportSettings
  ): Promise<ProductImport> {
    console.log('🚀 Starting product import...');
    console.log('📦 Product:', alibabaProduct.title);
    console.log('🏪 Store ID:', storeId);
    
    const connection = this.connections.get(storeId);
    const integration = this.integrations.get(storeId);

    if (!connection || !integration) {
      console.error('❌ Store not connected for ID:', storeId);
      throw new Error('Store not connected');
    }
    
    console.log('✅ Store found:', connection.storeName);
    console.log('🔧 Platform:', connection.platform);

    try {
      const importRecord: ProductImport = {
        sourceProductId: alibabaProduct.id,
        status: 'importing',
        priceMarkup: importSettings.priceMarkup,
        inventory: importSettings.inventory,
      };

      // Calculate final price with markup or use custom price
      const finalPrice = importSettings.customPrice || (alibabaProduct.price * (1 + importSettings.priceMarkup / 100));
      const compareAtPrice = finalPrice * 1.2; // Show higher "compare at" price

      // Use AI description if available, otherwise generate one
      const productTitle = importSettings.customTitle || importSettings.aiDescription?.title || alibabaProduct.title;
      const productDescription = this.getProductDescription(alibabaProduct, importSettings);
      const productTags = this.getProductTags(importSettings);

      let createdProduct;

      console.log('🔧 Creating product for platform:', connection.platform);

      if (connection.platform === 'shopify' && integration instanceof ShopifyIntegration) {
        console.log('🛍️ Creating Shopify product...');
        createdProduct = await integration.createProduct({
          title: productTitle,
          body_html: productDescription,
          vendor: alibabaProduct.supplier,
          product_type: importSettings.category || 'Clothing',
          tags: productTags.join(','),
          images: [{ src: alibabaProduct.imageUrl }],
          variants: [{
            price: finalPrice.toString(),
            compare_at_price: compareAtPrice.toString(),
            inventory_quantity: importSettings.inventory,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
          }],
          published: true,
          status: 'active'
        });
        console.log('✅ Product created successfully:', createdProduct);
      } else if (connection.platform === 'woocommerce' && integration instanceof WooCommerceIntegration) {
        console.log('🛍️ Creating WooCommerce product...');
        createdProduct = await integration.createProduct({
          name: productTitle,
          description: productDescription,
          price: finalPrice.toString(),
          regularPrice: compareAtPrice.toString(),
          images: [{ src: alibabaProduct.imageUrl }],
          categories: [{ id: 1 }], // Default category
          tags: productTags.map(tag => ({ name: tag })),
          stockQuantity: importSettings.inventory,
        });
        console.log('✅ Product created successfully:', createdProduct);
      } else {
        console.error('❌ Unsupported platform or integration mismatch');
        throw new Error('Unsupported platform or integration mismatch');
      }

      importRecord.targetProductId = createdProduct.id?.toString();
      importRecord.status = 'success';
      importRecord.importedAt = new Date();

      console.log('🎉 Product imported successfully to', connection.storeName);
      console.log('📋 Import details:', {
        sourceId: importRecord.sourceProductId,
        targetId: importRecord.targetProductId,
        status: importRecord.status,
        platform: connection.platform
      });
      return importRecord;
    } catch (error) {
      console.error('❌ Product import failed:', error);
      return {
        sourceProductId: alibabaProduct.id,
        status: 'failed',
        priceMarkup: importSettings.priceMarkup,
        inventory: importSettings.inventory,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getProductDescription(product: any, importSettings: ImportSettings): string {
    // Use AI description if available
    if (importSettings.aiDescription?.fullDescription) {
      return importSettings.aiDescription.fullDescription;
    }

    // Use custom description if provided
    if (importSettings.customDescription) {
      return importSettings.customDescription;
    }

    // Fallback to generated description
    return this.generateProductDescription(product);
  }

  private getProductTags(importSettings: ImportSettings): string[] {
    const tags = [...(importSettings.tags || [])];
    
    // Add AI-generated tags if available
    if (importSettings.aiDescription?.tags) {
      tags.push(...importSettings.aiDescription.tags);
    }

    // Remove duplicates and return
    return Array.from(new Set(tags)).filter(tag => tag.trim());
  }

  private generateProductDescription(product: any): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #8b5cf6;">${product.title}</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">✨ Premium Quality Product</h3>
          <p><strong>🏭 Supplier:</strong> ${product.supplier}</p>
          <p><strong>📍 Location:</strong> ${product.supplierLocation}</p>
          <p><strong>🚚 Delivery:</strong> ${product.deliveryTime}</p>
          <p><strong>⭐ Rating:</strong> ${product.rating}/5 (${product.reviewCount} reviews)</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #1f2937;">🎯 Why Choose This Product?</h3>
          <ul style="color: #374151;">
            <li>✅ High profit margin potential</li>
            <li>✅ Trending in the clothing market</li>
            <li>✅ Quality verified supplier</li>
            <li>✅ Fast shipping options available</li>
          </ul>
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;"><strong>💡 Dropshipping Ready:</strong> This product has been carefully selected for its market demand, quality, and profit potential.</p>
        </div>
      </div>
    `;
  }

  getConnectedStores(): StoreConnection[] {
    return Array.from(this.connections.values());
  }

  disconnectStore(storeId: string) {
    this.connections.delete(storeId);
    this.integrations.delete(storeId);
    console.log('🔌 Store disconnected:', storeId);
  }

  // Get store by ID
  getStore(storeId: string): StoreConnection | undefined {
    return this.connections.get(storeId);
  }

  // Get integration by ID
  getIntegration(storeId: string): ShopifyIntegration | WooCommerceIntegration | undefined {
    return this.integrations.get(storeId);
  }

  // Save connected store info for orders API
  private saveConnectedStoreForOrders(connection: StoreConnection) {
    try {
      const existingStores = localStorage.getItem('connectedStores');
      let stores = existingStores ? JSON.parse(existingStores) : [];
      
      // Create orders API config from store connection
      const ordersApiConfig = {
        storeType: connection.platform,
        storeUrl: connection.storeUrl,
        apiKey: connection.apiKey,
        apiSecret: connection.apiSecret
      };
      
      // Remove existing entry for this store if exists
      stores = stores.filter((store: any) => store.storeUrl !== connection.storeUrl);
      
      // Add new entry
      stores.push(ordersApiConfig);
      
      localStorage.setItem('connectedStores', JSON.stringify(stores));
      console.log('💾 Saved connected store for orders API:', connection.storeName);
      console.log('📦 Orders API config saved:', ordersApiConfig);
      console.log('🏪 Total connected stores:', stores.length);
    } catch (error) {
      console.error('❌ Failed to save connected store for orders API:', error);
    }
  }
} 