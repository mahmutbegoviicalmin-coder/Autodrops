export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  sellPrice: number; // CJ sell price (our cost)
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryDays: number; // Numeric delivery days
  supplier: string;
  supplierLocation: string;
  supplierUrl?: string;
  category: string;
  imageUrl: string;
  profitMargin: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  trendingScore: number;
  stockAvailable: number;
  tags: string[];
  materialTags?: string[];
  monthlyOrders: number;
  targetCountries?: string[];
  sku?: string;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
  // Enhanced data fields
  costPrice?: number;
  profitAmount?: number;
  recommendedPrice?: number;
  monthlyRevenue?: number;
  revenueConfidence?: 'high' | 'medium' | 'low';
  shippingCost?: number;
  expressAvailable?: boolean;
  inventory?: number;
  // Recommendation flags
  highlyRecommended?: boolean;
}

export interface FilterOptions {
  minRating: number;
  maxDeliveryDays: number;
  targetCountry: string;
  priceRange: [number, number];
  category: string;
  supplierLocation: string;
  competitionLevel: string;
  minProfitMargin: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAuthenticated: boolean;
} 