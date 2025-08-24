import React, { useEffect, useState } from 'react';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Star, 
  Target, 
  Calendar, 
  ExternalLink,
  Award,
  BarChart3,
  PieChart,
  Zap,
  ShoppingCart,
  Clock,
  Globe,
  Activity,
  CheckCircle
} from 'lucide-react';
import { Product } from '../types';
import { getCategoryIconByName } from '../data/categoryIcons';

interface ProductAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

// Animated Progress Circle Component
const AnimatedCircle: React.FC<{
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  value: string;
}> = ({ percentage, size, strokeWidth, color, label, value }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      </div>
    </div>
  );
};

// Animated Progress Bar Component
const AnimatedProgressBar: React.FC<{
  percentage: number;
  color: string;
  height?: string;
  showPercentage?: boolean;
}> = ({ percentage, color, height = 'h-3', showPercentage = true }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-700/50 rounded-full ${height} overflow-hidden relative`}>
        <div
          className={`${height} rounded-full transition-all duration-1000 ease-out relative`}
          style={{
            width: `${animatedWidth}%`,
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
            boxShadow: `0 0 10px ${color}40`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>{Math.round(animatedWidth)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  gradient: string;
}> = ({ icon: Icon, title, value, subtitle, color, gradient }) => (
  <div className={`relative overflow-hidden rounded-xl p-4 ${gradient} border border-white/10 backdrop-blur-sm`}>
    <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-6 -translate-y-6">
      <div className={`w-full h-full rounded-full ${color} opacity-20`} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtitle && <div className="text-xs text-gray-300">{subtitle}</div>}
        </div>
      </div>
      <div className="text-sm text-gray-300">{title}</div>
    </div>
  </div>
);

export const ProductAnalysisModal: React.FC<ProductAnalysisModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  if (!isOpen || !product) return null;

  const profitMargin = product.profitMargin || 35;
  const competitionLevel = product.competitionLevel || 'Medium';
  const demandScore = product.trendingScore || 75;
  const costPrice = product.price * (1 - profitMargin / 100);
  const profitPerSale = product.price - costPrice;
  const monthlyOrders = product.monthlyOrders || 850;
  const deliveryDays = Math.round(product.deliveryDays) || 7;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-900/20 border-green-500/20';
    if (score >= 60) return 'bg-yellow-900/20 border-yellow-500/20';
    return 'bg-red-900/20 border-red-500/20';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
          
          <div className="relative p-6 border-b border-gray-700/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                {/* Enhanced Product Image */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-xl" />
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="relative w-20 h-20 rounded-xl object-cover border border-gray-600/50 shadow-lg"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {product.title}
                  </h2>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-2xl font-bold text-green-400">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {product.rating > 0 ? product.rating.toFixed(1) : '4.5'}
                      </span>
                      <span className="text-gray-400">({product.reviewCount || 156} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full border border-purple-500/30">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 text-sm font-medium">
                        {demandScore}% Trending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 group"
              >
                <X className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-250px)]">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              icon={DollarSign}
              title="Profit Margin"
              value={`${profitMargin.toFixed(1)}%`}
              subtitle="per sale"
              color="bg-green-500"
              gradient="bg-gradient-to-br from-green-900/30 to-emerald-900/30"
            />
            <MetricCard
              icon={TrendingUp}
              title="Demand Score"
              value={`${demandScore}`}
              subtitle="out of 100"
              color="bg-purple-500"
              gradient="bg-gradient-to-br from-purple-900/30 to-violet-900/30"
            />
            <MetricCard
              icon={ShoppingCart}
              title="Monthly Orders"
              value={monthlyOrders.toLocaleString()}
              subtitle="estimated"
              color="bg-blue-500"
              gradient="bg-gradient-to-br from-blue-900/30 to-cyan-900/30"
            />
            <MetricCard
              icon={Clock}
              title="Delivery"
              value={`${deliveryDays}`}
              subtitle="days avg"
              color="bg-orange-500"
              gradient="bg-gradient-to-br from-orange-900/30 to-red-900/30"
            />
          </div>

          <div className="space-y-8">
            {/* Performance Analytics - Enhanced with Circular Charts */}
            <div className="space-y-6">
              
              {/* Performance Dashboard - removed circular progress visuals as requested */}

              {/* Profit Breakdown - Enhanced */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <PieChart className="h-6 w-6 text-green-400 mr-3" />
                  Financial Breakdown
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Cost Price</span>
                      <span className="text-white font-bold">${costPrice.toFixed(2)}</span>
                    </div>
                    <AnimatedProgressBar
                      percentage={(costPrice / product.price) * 100}
                      color="#EF4444"
                      height="h-2"
                      showPercentage={false}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Profit per Sale</span>
                      <span className="text-green-400 font-bold">${profitPerSale.toFixed(2)}</span>
                    </div>
                    <AnimatedProgressBar
                      percentage={profitMargin}
                      color="#10B981"
                      height="h-2"
                      showPercentage={false}
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Revenue (Monthly Est.)</span>
                      <span className="text-purple-400 font-bold text-lg">
                        ${(product.price * monthlyOrders).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Intelligence */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Activity className="h-6 w-6 text-blue-400 mr-3" />
                  Market Intelligence
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Competition Level</span>
                      <span className="text-yellow-400 font-semibold">{competitionLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Saturation</span>
                      <span className="text-white">
                        {competitionLevel === 'Low' ? '25%' : competitionLevel === 'Medium' ? '65%' : '85%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trend Duration</span>
                      <span className="text-white">8 months</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-green-400 font-semibold">
                        {profitMargin > 40 ? '92%' : profitMargin > 25 ? '78%' : '65%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ROI Potential</span>
                      <span className="text-purple-400 font-semibold">
                        {Math.round(profitMargin * 2.5)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Level</span>
                      <span className={`font-semibold ${profitMargin > 40 ? 'text-green-400' : profitMargin > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {profitMargin > 40 ? 'Low' : profitMargin > 25 ? 'Medium' : 'High'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Details Section - Full Width */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Supplier & Logistics */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Globe className="h-6 w-6 text-green-400 mr-3" />
                  Supplier & Logistics
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Supplier:</span>
                    <span className="text-white font-semibold">{product.supplier}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Location:</span>
                    <span className="text-white font-semibold">{product.supplierLocation}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Delivery Time:</span>
                    <span className="text-orange-400 font-semibold">{product.deliveryTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <span className="text-gray-300">Stock Status:</span>
                    <span className="text-green-400 font-semibold">✓ Available</span>
                  </div>
                  
                  {product.supplierUrl && (
                    <a
                      href={product.supplierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 w-full p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all duration-200 hover:bg-purple-600/30"
                    >
                      <ExternalLink className="h-5 w-5" />
                      <span className="font-medium">View Supplier Page</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Product Details & Category */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Target className="h-6 w-6 text-blue-400 mr-3" />
                  Product Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    {(() => {
                      const { icon, color } = getCategoryIconByName(product.category);
                      return (
                        <>
                          <span className={`text-2xl ${color}`}>{icon}</span>
                          <div>
                            <div className="text-white font-semibold">{product.category}</div>
                            <div className="text-gray-400 text-sm">Product Category</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400 mb-3">Tags & Keywords:</div>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Engine - removed as requested */}
            </div>
          </div>
        </div>
        {/* Enhanced Footer */}
        <div className="relative p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-sm text-gray-300">
                  Live Analysis • Updated {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Powered by AI Analytics Engine
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.open(product.supplierUrl, '_blank')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all duration-200 text-sm font-medium"
              >
                View Source
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 