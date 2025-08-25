import { Package, Shirt, Layers, ShoppingBag, Shield } from 'lucide-react';

export interface CategoryIcon {
  name: string;
  icon: JSX.Element;
  color: string;
  description: string;
}

export const categoryIcons: CategoryIcon[] = [
  {
    name: 'All',
    icon: <Package className="w-4 h-4" />,
    color: 'text-purple-400',
    description: 'Svi proizvodi'
  },
  {
    name: 'Hoodies',
    icon: <Shirt className="w-4 h-4" />,
    color: 'text-blue-400',
    description: 'Hoodies i dukserice'
  },
  {
    name: 'Tops',
    icon: <Layers className="w-4 h-4" />,
    color: 'text-pink-400',
    description: 'Gornji dio odjeće'
  },
  {
    name: 'Pants',
    icon: <Layers className="w-4 h-4" />,
    color: 'text-green-400',
    description: 'Hlače i pantalone'
  },
  {
    name: 'Dresses',
    icon: <ShoppingBag className="w-4 h-4" />,
    color: 'text-red-400',
    description: 'Haljine i haljinice'
  },
  {
    name: 'Outerwear',
    icon: <Shield className="w-4 h-4" />,
    color: 'text-yellow-400',
    description: 'Gornja odjeća i jakne'
  }
];

export const getCategoryIcon = (categoryName: string): CategoryIcon => {
  return categoryIcons.find(cat => cat.name === categoryName) || categoryIcons[0];
};

export const getCategoryIconByName = (name: string) => {
  const category = categoryIcons.find(cat => cat.name === name);
  return category ? { icon: category.icon, color: category.color } : { icon: <Package className="w-4 h-4" />, color: 'text-gray-400' };
};
