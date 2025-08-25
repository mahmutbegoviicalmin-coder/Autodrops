import { Product } from '../types';

interface EnhancedProduct extends Product {
  originalTitle?: string;
  aiEnhanced?: boolean;
  enhancementMethod?: 'local' | 'openai';
}

export class LocalTitleEnhancer {
  private premiumWords = [
    'Premium', 'Luxury', 'Elite', 'Designer', 'Boutique', 'Exclusive',
    'Trendy', 'Chic', 'Stylish', 'Modern', 'Contemporary', 'Aesthetic'
  ];

  private energeticWords = [
    'Stunning', 'Amazing', 'Perfect', 'Beautiful', 'Gorgeous', 'Elegant',
    'Sophisticated', 'Irresistible', 'Must-Have', 'Essential', 'Statement'
  ];

  private removeWords = [
    'aliexpress', 'wholesale', 'dropship', 'factory', 'cheap', 'hot sale',
    'promotion', 'free shipping', 'big discount', 'mix order', 'lot',
    'pieces', 'pcs', 'bulk', 'oem', 'odm', 'china', 'guangzhou', 'yiwu'
  ];

  private categoryMappings = {
    'Women\'s Clothing': 'Fashion',
    'Men\'s Clothing': 'Menswear', 
    'Jewelry & Accessories': 'Accessories',
    'Shoes': 'Footwear',
    'Bags & Luggage': 'Bags',
    'Beauty & Health': 'Beauty',
    'Sports & Entertainment': 'Active'
  };

  enhanceProduct(product: Product): EnhancedProduct {
    const enhancedTitle = this.enhanceTitle(product.title, product.category);
    
    return {
      ...product,
      originalTitle: product.title,
      title: enhancedTitle,
      category: this.categoryMappings[product.category as keyof typeof this.categoryMappings] || product.category,
      tags: this.enhanceTags(product.tags || [], product.category),
      aiEnhanced: true,
      enhancementMethod: 'local'
    };
  }

  enhanceProductsBatch(products: Product[]): EnhancedProduct[] {
    console.log(`🚀 Enhancing ${products.length} product titles locally...`);
    
    const enhanced = products.map(product => this.enhanceProduct(product));
    
    console.log(`✨ Enhanced ${enhanced.length} product titles`);
    return enhanced;
  }

  private enhanceTitle(originalTitle: string, category: string): string {
    let title = originalTitle;

    // Remove unwanted words (case insensitive)
    this.removeWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      title = title.replace(regex, '');
    });

    // Clean up extra spaces and normalize
    title = title.replace(/\s+/g, ' ').trim();
    
    // Remove common aliexpress patterns
    title = title.replace(/\d+\s*(pcs?|pieces?|lot)/gi, '');
    title = title.replace(/size\s*[xs-xl]+/gi, '');
    title = title.replace(/color\s*\w+/gi, '');
    title = title.replace(/\b(new|hot)\s+(sale|item)\b/gi, '');
    title = title.replace(/\b(mix|assorted)\s+/gi, '');
    
    // Remove excessive punctuation and clean up
    title = title.replace(/[!]{2,}/g, '!');
    title = title.replace(/[.]{2,}/g, '');
    title = title.replace(/[-]{2,}/g, '-');
    title = title.replace(/\s+/g, ' ').trim();

    // Capitalize properly
    title = this.toTitleCase(title);

    // Add premium word if title is too basic
    if (this.needsPremiumWord(title)) {
      const premiumWord = this.selectPremiumWord(category);
      title = `${premiumWord} ${title}`;
    }

    // Ensure reasonable length
    if (title.length > 60) {
      title = this.truncateTitle(title);
    }

    // Ensure minimum quality
    if (title.length < 10 || this.isLowQuality(title)) {
      title = this.generateFallbackTitle(originalTitle, category);
    }

    return title;
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => {
      // Don't capitalize articles, conjunctions, prepositions (unless first word)
      const lowercaseWords = ['and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with', 'of', 'in'];
      const word = txt.toLowerCase();
      
      if (lowercaseWords.includes(word) && str.indexOf(txt) !== 0) {
        return word;
      }
      
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  private needsPremiumWord(title: string): boolean {
    const hasEnergeticWord = this.energeticWords.some(word => 
      title.toLowerCase().includes(word.toLowerCase())
    );
    const hasPremiumWord = this.premiumWords.some(word => 
      title.toLowerCase().includes(word.toLowerCase())
    );
    
    return !hasEnergeticWord && !hasPremiumWord && title.length < 40;
  }

  private selectPremiumWord(category: string): string {
    // Category-specific premium words
    const categoryWords = {
      'clothing': ['Chic', 'Trendy', 'Stylish', 'Modern'],
      'fashion': ['Luxury', 'Designer', 'Boutique', 'Elite'],
      'accessories': ['Premium', 'Elegant', 'Sophisticated'],
      'footwear': ['Comfort', 'Stylish', 'Premium'],
      'bags': ['Designer', 'Luxury', 'Premium'],
      'beauty': ['Professional', 'Premium', 'Luxury']
    };

    const categoryKey = category.toLowerCase();
    const words = categoryWords[categoryKey as keyof typeof categoryWords] || this.premiumWords;
    
    return words[Math.floor(Math.random() * words.length)];
  }

  private truncateTitle(title: string): string {
    if (title.length <= 60) return title;
    
    // Try to cut at a word boundary
    const truncated = title.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 30) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  private isLowQuality(title: string): boolean {
    // Check for common low-quality patterns
    const badPatterns = [
      /^\w{1,3}\s/,  // Very short first words
      /\d{5,}/,      // Long numbers
      /[A-Z]{5,}/,   // All caps sequences
      /[^a-zA-Z0-9\s\-]/g  // Excessive special characters
    ];

    return badPatterns.some(pattern => pattern.test(title));
  }

  private generateFallbackTitle(originalTitle: string, category: string): string {
    const premiumWord = this.selectPremiumWord(category);
    const cleanCategory = this.categoryMappings[category as keyof typeof this.categoryMappings] || category;
    
    // Extract the first meaningful word from original title
    const words = originalTitle.split(' ').filter(word => 
      word.length > 3 && !this.removeWords.includes(word.toLowerCase())
    );
    
    const mainWord = words[0] || cleanCategory;
    
    return `${premiumWord} ${this.toTitleCase(mainWord)} Collection`;
  }

  private enhanceTags(originalTags: string[], category: string): string[] {
    const premiumTags = ['premium', 'trendy', 'stylish', 'modern', 'aesthetic', 'boutique'];
    const categoryTag = category.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    
    // Combine original tags with premium tags, remove duplicates
    const allTags = [...originalTags, ...premiumTags, categoryTag];
    return [...new Set(allTags)].slice(0, 8); // Limit to 8 tags
  }
}

// Export singleton instance
export const localTitleEnhancer = new LocalTitleEnhancer(); 