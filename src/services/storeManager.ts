interface StoredConnection {
  id: string;
  platform: 'shopify' | 'woocommerce' | 'bigcommerce' | 'squarespace';
  storeUrl: string;
  credentials: {
    accessToken?: string;
    consumerKey?: string;
    consumerSecret?: string;
  };
  storeName: string;
  connectedAt: string;
  lastUsed: string;
}

interface StoreConnection {
  id: string;
  platform: 'shopify' | 'woocommerce' | 'bigcommerce' | 'squarespace';
  storeUrl: string;
  storeName: string;
  isActive: boolean;
  connectedAt: Date;
  lastUsed: Date;
}

export class PersistentStoreManager {
  private static readonly STORAGE_KEY = 'autodrops_store_connections';
  private connections: Map<string, StoredConnection> = new Map();

  constructor() {
    this.loadConnections();
  }

  // Load connections from localStorage
  private loadConnections(): void {
    try {
      const stored = localStorage.getItem(PersistentStoreManager.STORAGE_KEY);
      if (stored) {
        const connections: StoredConnection[] = JSON.parse(stored);
        connections.forEach(conn => {
          this.connections.set(conn.id, conn);
        });
        console.log(`🔄 Loaded ${connections.length} saved store connections`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load store connections:', error);
    }
  }

  // Save connections to localStorage
  private saveConnections(): void {
    try {
      const connectionsArray = Array.from(this.connections.values());
      localStorage.setItem(PersistentStoreManager.STORAGE_KEY, JSON.stringify(connectionsArray));
      console.log(`💾 Saved ${connectionsArray.length} store connections`);
    } catch (error) {
      console.warn('⚠️ Failed to save store connections:', error);
    }
  }

  // Add or update a store connection
  saveConnection(
    platform: 'shopify' | 'woocommerce' | 'bigcommerce' | 'squarespace',
    storeUrl: string,
    credentials: {
      accessToken?: string;
      consumerKey?: string;
      consumerSecret?: string;
    },
    storeName: string
  ): string {
    const id = this.generateConnectionId(platform, storeUrl);
    const now = new Date().toISOString();
    
    const connection: StoredConnection = {
      id,
      platform,
      storeUrl: this.normalizeUrl(storeUrl),
      credentials: { ...credentials }, // Store encrypted in production
      storeName,
      connectedAt: this.connections.get(id)?.connectedAt || now,
      lastUsed: now
    };

    this.connections.set(id, connection);
    this.saveConnections();
    
    console.log(`✅ Saved ${platform} connection: ${storeName}`);
    return id;
  }

  // Get all saved connections (without sensitive credentials)
  getConnections(): StoreConnection[] {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      platform: conn.platform,
      storeUrl: conn.storeUrl,
      storeName: conn.storeName,
      isActive: this.isConnectionRecent(conn.lastUsed),
      connectedAt: new Date(conn.connectedAt),
      lastUsed: new Date(conn.lastUsed)
    }));
  }

  // Get connection details by ID (including credentials)
  getConnection(id: string): StoredConnection | null {
    const connection = this.connections.get(id);

    if (connection) {
      // Update last used timestamp
      connection.lastUsed = new Date().toISOString();
      this.saveConnections();
    }
    return connection || null;
  }

  // Remove a stored connection
  removeConnection(id: string): boolean {
    const deleted = this.connections.delete(id);
    if (deleted) {
      this.saveConnections();
      console.log(`🗑️ Removed store connection: ${id}`);
    }
    return deleted;
  }

  // Clear all connections
  clearAllConnections(): void {
    this.connections.clear();
    localStorage.removeItem(PersistentStoreManager.STORAGE_KEY);
    console.log('🧹 Cleared all store connections');
  }

  // Check if connection was used recently (within 30 days)
  private isConnectionRecent(lastUsed: string): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lastUsed) > thirtyDaysAgo;
  }

  // Generate unique connection ID
  private generateConnectionId(platform: string, storeUrl: string): string {
    const normalized = this.normalizeUrl(storeUrl);
    return `${platform}_${btoa(normalized).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
  }

  // Normalize store URL for consistent storage
  private normalizeUrl(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  }

  // Get connection statistics
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    platformCounts: Record<string, number>;
  } {
    const connections = this.getConnections();
    const platformCounts: Record<string, number> = {};

    connections.forEach(conn => {
      platformCounts[conn.platform] = (platformCounts[conn.platform] || 0) + 1;
    });

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.isActive).length,
      platformCounts
    };
  }

  // Auto-cleanup old connections (older than 90 days)
  cleanupOldConnections(): number {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    let removedCount = 0;
    for (const [id, conn] of this.connections.entries()) {
      if (new Date(conn.lastUsed) < ninetyDaysAgo) {
        this.connections.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.saveConnections();
      console.log(`🧹 Cleaned up ${removedCount} old connections`);
    }

    return removedCount;
  }

  // Test a stored connection
  async testStoredConnection(id: string): Promise<{ success: boolean; error?: string }> {
    const connection = this.getConnection(id);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Import the integration services
      const { ShopifyIntegration, WooCommerceIntegration } = await import('./storeIntegrations');
      
      if (connection.platform === 'shopify' && connection.credentials.accessToken) {
        const shopify = new ShopifyIntegration(connection.storeUrl, connection.credentials.accessToken);
        return await shopify.testConnection();
      } else if (connection.platform === 'woocommerce' && connection.credentials.consumerKey && connection.credentials.consumerSecret) {
        const woocommerce = new WooCommerceIntegration(
          connection.storeUrl, // Don't add https:// here, let the constructor handle it
          connection.credentials.consumerKey,
          connection.credentials.consumerSecret
        );
        return await woocommerce.testConnection();
      }

      return { success: false, error: 'Unsupported platform or missing credentials' };
    } catch (error) {
      return { success: false, error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

// Create singleton instance
export const storeManager = new PersistentStoreManager();

// Export types
export type { StoreConnection, StoredConnection }; 