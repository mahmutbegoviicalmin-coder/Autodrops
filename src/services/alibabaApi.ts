// Alibaba API Service Integration
// Based on: https://openapi.alibaba.com/doc/api.htm

export interface AlibabaConfig {
  appKey: string;
  appSecret: string;
  baseUrl: string;
  accessToken?: string;
}

export interface AlibabaProduct {
  productId: string;
  subject: string;
  price: {
    min: number;
    max: number;
    currency: string;
  };
  minOrderQuantity: number;
  images: string[];
  categoryId: string;
  supplierInfo: {
    companyName: string;
    location: string;
    memberLevel: string;
  };
  attributes: Record<string, any>;
  deliveryTime: string;
  rating?: number;
  reviewCount?: number;
}

export class AlibabaApiService {
  private config: AlibabaConfig;

  constructor(config: AlibabaConfig) {
    this.config = config;
  }

  // Get product categories
  async getCategories() {
    try {
      const response = await fetch(`${this.config.baseUrl}/icbu/product/category/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          app_key: this.config.appKey,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  // Search products with filters
  async searchProducts(params: {
    keyword?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
    sortBy?: 'price' | 'orders' | 'rating';
  }) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('app_key', this.config.appKey);
      queryParams.append('timestamp', Date.now().toString());
      
      // Add search parameters, converting numbers to strings
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);

      const response = await fetch(
        `${this.config.baseUrl}/icbu/product/search?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const data = await response.json();
      return this.transformProducts(data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  // Get detailed product information
  async getProductDetails(productId: string) {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/icbu/product/detail/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      const data = await response.json();
      return this.transformProduct(data.product);
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Failed to fetch product details');
    }
  }

  // Transform Alibaba product to our format
  private transformProduct(alibabaProduct: any): AlibabaProduct {
    return {
      productId: alibabaProduct.productId,
      subject: alibabaProduct.subject,
      price: {
        min: alibabaProduct.priceRange?.min || 0,
        max: alibabaProduct.priceRange?.max || 0,
        currency: alibabaProduct.currency || 'USD',
      },
      minOrderQuantity: alibabaProduct.minOrderQuantity || 1,
      images: alibabaProduct.images || [],
      categoryId: alibabaProduct.categoryId,
      supplierInfo: {
        companyName: alibabaProduct.supplier?.companyName || '',
        location: alibabaProduct.supplier?.location || '',
        memberLevel: alibabaProduct.supplier?.memberLevel || '',
      },
      attributes: alibabaProduct.attributes || {},
      deliveryTime: alibabaProduct.deliveryTime || '7-15 days',
      rating: alibabaProduct.rating || 0,
      reviewCount: alibabaProduct.reviewCount || 0,
    };
  }

  private transformProducts(alibabaProducts: any[]): AlibabaProduct[] {
    return alibabaProducts.map(product => this.transformProduct(product));
  }

  // Generate affiliate/tracking URLs
  generateAffiliateUrl(productId: string, userId: string): string {
    const trackingParams = new URLSearchParams({
      productId,
      affiliateId: this.config.appKey,
      userId,
      timestamp: Date.now().toString(),
    });

    return `https://www.alibaba.com/product-detail/${productId}?${trackingParams}`;
  }
} 