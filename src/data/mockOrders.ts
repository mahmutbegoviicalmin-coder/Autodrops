import { Product } from '../types';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  products: OrderProduct[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  estimatedDelivery: Date;
  supplierInfo: SupplierInfo;
}

export interface OrderProduct {
  product: any;
  quantity: number;
  price: number;
}

export interface SupplierInfo {
  name: string;
  contact: string;
  website: string;
  notes: string;
}

// Mock products for orders
const mockProduct1: Product = {
  id: '1',
  title: 'Y2K Butterfly Print Crop Top',
  price: 19.99,
  originalPrice: 39.99,
  rating: 4.6,
  reviewCount: 1923,
  deliveryTime: '5-12 days',
  supplier: 'RetroStyle Ltd',
  supplierLocation: 'China',
  category: 'Tops',
  imageUrl: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400',
  profitMargin: 72,
  competitionLevel: 'Low',
  trendingScore: 89,
  stockAvailable: 890,
  tags: ['Y2K', 'Low Competition', 'Instagram Popular']
};

const mockProduct2: Product = {
  id: '2',
  title: 'Minimalist Cargo Pants',
  price: 39.99,
  originalPrice: 79.99,
  rating: 4.7,
  reviewCount: 3156,
  deliveryTime: '10-18 days',
  supplier: 'UrbanFlow',
  supplierLocation: 'Turkey',
  category: 'Pants',
  imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
  profitMargin: 58,
  competitionLevel: 'High',
  trendingScore: 87,
  stockAvailable: 670,
  tags: ['Streetwear', 'TikTok Viral']
};

const mockProduct3: Product = {
  id: '3',
  title: 'Chunky Platform Sneakers',
  price: 49.99,
  originalPrice: 99.99,
  rating: 4.9,
  reviewCount: 4251,
  deliveryTime: '8-15 days',
  supplier: 'SoleStyle',
  supplierLocation: 'Vietnam',
  category: 'Shoes',
  imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
  profitMargin: 68,
  competitionLevel: 'Medium',
  trendingScore: 92,
  stockAvailable: 445,
  tags: ['Shoes', 'High Rating', 'Fast Shipping']
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Ana Petrović',
    customerEmail: 'ana.petrovic@email.com',
    customerPhone: '+385 91 123 4567',
    customerAddress: 'Zagrebačka 123, Zagreb, Croatia',
    products: [
      {
        product: mockProduct1,
        quantity: 2,
        price: 19.99
      }
    ],
    totalAmount: 39.98,
    status: 'pending',
    orderDate: new Date('2024-08-08T10:30:00'),
    estimatedDelivery: new Date('2024-08-20T10:30:00'),
    supplierInfo: {
      name: 'RetroStyle Ltd',
      contact: 'sales@retrostyle.com',
      website: 'https://retrostyle.com',
      notes: 'Fast shipping, good quality. Contact via email for bulk orders.'
    }
  },
  {
    id: 'ORD-002',
    customerName: 'Marko Jovanović',
    customerEmail: 'marko.jovanovic@email.com',
    customerPhone: '+385 92 234 5678',
    customerAddress: 'Splitska 45, Split, Croatia',
    products: [
      {
        product: mockProduct2,
        quantity: 1,
        price: 39.99
      },
      {
        product: mockProduct3,
        quantity: 1,
        price: 49.99
      }
    ],
    totalAmount: 89.98,
    status: 'processing',
    orderDate: new Date('2024-08-07T14:15:00'),
    estimatedDelivery: new Date('2024-08-25T14:15:00'),
    supplierInfo: {
      name: 'UrbanFlow & SoleStyle',
      contact: 'orders@urbanflow.com',
      website: 'https://urbanflow.com',
      notes: 'Combined order from two suppliers. UrbanFlow for pants, SoleStyle for shoes.'
    }
  },
  {
    id: 'ORD-003',
    customerName: 'Jelena Nikolić',
    customerEmail: 'jelena.nikolic@email.com',
    customerPhone: '+385 95 345 6789',
    customerAddress: 'Riječka 78, Rijeka, Croatia',
    products: [
      {
        product: mockProduct1,
        quantity: 1,
        price: 19.99
      }
    ],
    totalAmount: 19.99,
    status: 'shipped',
    orderDate: new Date('2024-08-06T09:45:00'),
    estimatedDelivery: new Date('2024-08-18T09:45:00'),
    supplierInfo: {
      name: 'RetroStyle Ltd',
      contact: 'sales@retrostyle.com',
      website: 'https://retrostyle.com',
      notes: 'Order shipped via DHL. Tracking number: DHL123456789'
    }
  },
  {
    id: 'ORD-004',
    customerName: 'Petar Đorđević',
    customerEmail: 'petar.djordjevic@email.com',
    customerPhone: '+385 98 456 7890',
    customerAddress: 'Osječka 12, Osijek, Croatia',
    products: [
      {
        product: mockProduct3,
        quantity: 2,
        price: 49.99
      }
    ],
    totalAmount: 99.98,
    status: 'delivered',
    orderDate: new Date('2024-08-05T16:20:00'),
    estimatedDelivery: new Date('2024-08-17T16:20:00'),
    supplierInfo: {
      name: 'SoleStyle',
      contact: 'info@solestyle.com',
      website: 'https://solestyle.com',
      notes: 'Order delivered successfully. Customer satisfied with quality.'
    }
  },
  {
    id: 'ORD-005',
    customerName: 'Marija Stojanović',
    customerEmail: 'marija.stojanovic@email.com',
    customerPhone: '+385 99 567 8901',
    customerAddress: 'Varaždinska 34, Varaždin, Croatia',
    products: [
      {
        product: mockProduct2,
        quantity: 1,
        price: 39.99
      }
    ],
    totalAmount: 39.99,
    status: 'cancelled',
    orderDate: new Date('2024-08-04T11:10:00'),
    estimatedDelivery: new Date('2024-08-16T11:10:00'),
    supplierInfo: {
      name: 'UrbanFlow',
      contact: 'orders@urbanflow.com',
      website: 'https://urbanflow.com',
      notes: 'Order cancelled by customer. Refund processed.'
    }
  },
  {
    id: 'ORD-006',
    customerName: 'Ivan Popović',
    customerEmail: 'ivan.popovic@email.com',
    customerPhone: '+385 91 678 9012',
    customerAddress: 'Karlovačka 56, Karlovac, Croatia',
    products: [
      {
        product: mockProduct1,
        quantity: 3,
        price: 19.99
      },
      {
        product: mockProduct2,
        quantity: 1,
        price: 39.99
      }
    ],
    totalAmount: 99.96,
    status: 'pending',
    orderDate: new Date('2024-08-08T08:30:00'),
    estimatedDelivery: new Date('2024-08-22T08:30:00'),
    supplierInfo: {
      name: 'RetroStyle Ltd & UrbanFlow',
      contact: 'orders@retrostyle.com',
      website: 'https://retrostyle.com',
      notes: 'Large order. Contact both suppliers for bulk pricing.'
    }
  }
];
