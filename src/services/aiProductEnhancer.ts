import { Product } from '../types';

interface EnhancedProduct extends Product {
  originalTitle?: string;
  aiEnhanced?: boolean;
  aiGeneratedAt?: string;
}

interface AIEnhancementResponse {
  title: string;
  shortDescription: string;
  category?: string;
  tags: string[];
}

export class AIProductEnhancer {
  private apiEndpoint: string;
  private enhancementCache = new Map<string, AIEnhancementResponse>();

  constructor(apiEndpoint = 'http://localhost:3001/api/ai/enhance-product') {
    this.apiEndpoint = apiEndpoint;
  }

  // Main method to enhance a single product
  async enhanceProduct(product: Product): Promise<EnhancedProduct> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(product);
      const cached = this.enhancementCache.get(cacheKey);
      
      if (cached) {
        return this.applyEnhancements(product, cached);
      }

      // Generate enhancement via API
      const enhancement = await this.generateEnhancement(product);
      
      // Cache the result
      this.enhancementCache.set(cacheKey, enhancement);
      
      return this.applyEnhancements(product, enhancement);
      
    } catch (error) {
      console.warn(`Failed to enhance product ${product.id}:`, error);
      // Return original product if enhancement fails
      return {
        ...product,
        aiEnhanced: false
      };
    }
  }

  // Enhance products in batches for better performance
  async enhanceProductsBatch(products: Product[]): Promise<EnhancedProduct[]> {
    console.log(`🤖 Starting AI enhancement for ${products.length} products...`);
    
    const enhancedProducts: EnhancedProduct[] = [];
    const batchSize = 3; // Process 3 at a time to avoid rate limits
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(product => this.enhanceProduct(product));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          enhancedProducts.push(result.value);
        } else {
          console.warn(`Failed to enhance product ${batch[index].id}:`, result.reason);
          enhancedProducts.push({ ...batch[index], aiEnhanced: false });
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const enhancedCount = enhancedProducts.filter(p => p.aiEnhanced).length;
    console.log(`✅ Enhanced ${enhancedCount}/${products.length} products with AI`);
    
    return enhancedProducts;
  }

  private async generateEnhancement(product: Product): Promise<AIEnhancementResponse> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productInfo: {
          name: product.title,
          category: product.category,
          price: product.price,
          originalDescription: `${product.title} - ${product.category}`,
          tags: product.tags || [],
          imageUrl: product.imageUrl
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'AI enhancement failed');
    }

    return data.enhancement;
  }

  private applyEnhancements(product: Product, enhancement: AIEnhancementResponse): EnhancedProduct {
    return {
      ...product,
      originalTitle: product.title, // Keep the original for reference
      title: enhancement.title,
      category: enhancement.category || product.category,
      tags: [...(product.tags || []), ...enhancement.tags].filter((tag, index, arr) => 
        arr.indexOf(tag) === index // Remove duplicates
      ),
      aiEnhanced: true,
      aiGeneratedAt: new Date().toISOString()
    };
  }

  private generateCacheKey(product: Product): string {
    // Create a cache key based on product title and price to avoid regenerating same content
    return `${product.title}_${product.price}_${product.category}`.toLowerCase().replace(/\s+/g, '_');
  }

  // Method to clear cache if needed
  clearCache(): void {
    this.enhancementCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.enhancementCache.size,
      keys: Array.from(this.enhancementCache.keys())
    };
  }
}

// Export a singleton instance
export const aiProductEnhancer = new AIProductEnhancer(); 