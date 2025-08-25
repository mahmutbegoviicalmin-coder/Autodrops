import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Globe, 
  Zap, 
  Users, 
  BarChart3,
  ArrowRight,
  Star,
  CheckCircle,
  DollarSign,
  Play,
  Target,
  Search,
  Filter,
  Upload,
  Sparkles,
  Eye,
  Lightbulb,
  Shield,
  MessageCircle,
  Crown,
  Rocket,
  Brain,
  Award,
  Menu,
  X
} from 'lucide-react';
import { GlobalSalesPulse } from './GlobalSalesPulse';
import Logo from '../assets/logos/AD_logo.png';
import GoogleLogoImg from '../assets/logos/Google_Logo_1.png';
import ShopifyLogoImg from '../assets/logos/Shopify.com_Logo_1.png';
import WooCommerceLogoImg from '../assets/logos/WooCommerce_Logo_1.png';
import AliExpressLogoImg from '../assets/logos/AliExpress_ideTm3bGFv_1.png';

// Particle Component
const FloatingParticle = ({ icon, delay, duration, size = 40, startX, startY }: {
  icon: React.ReactNode;
  delay: number;
  duration: number;
  size?: number;
  startX: number;
  startY: number;
}) => (
  <div
    className="floating-particle absolute opacity-20 hover:opacity-60 transition-all duration-500 cursor-pointer"
    style={{
      left: `${startX}%`,
      top: `${startY}%`,
      width: `${size}px`,
      height: `${size}px`,
      animation: `float ${duration}s ease-in-out infinite ${delay}s`,
      transform: 'translate(-50%, -50%)'
    }}
  >
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/40 to-gray-700/40 rounded-xl backdrop-blur-sm border border-gray-600/30 hover:border-gray-400/60 hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 hover:bg-gradient-to-br hover:from-gray-700/50 hover:to-gray-600/50">
      <div className="transform hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </div>
  </div>
);

// SVG Logo Components
const ShopifyLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M15.8 2.1c-.1 0-.2 0-.3.1-.3-.7-.8-1.3-1.4-1.7C13.4.2 12.7 0 12 0c-1.4 0-2.7.7-3.7 1.9-.8 1-1.4 2.3-1.6 3.6-1.8.5-3.1.9-3.2.9-.6.2-.6.2-.7.8L2.7 22l9.3 1.7 9.3-1.7-.1-5.8c0-.1-3.8-14.1-5.4-14.1zM12 5.4c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zm2.5 1.8c-.1.4-.5.7-.9.6-.4-.1-.7-.5-.6-.9.1-.4.5-.7.9-.6.4.1.7.5.6.9z" fill="#95BF47"/>
    <path d="M15.8 2.1c-.1 0-.2 0-.3.1-.3-.7-.8-1.3-1.4-1.7.5 1.1.8 2.4.8 3.8 0 3.9-3.2 7.1-7.1 7.1-.9 0-1.8-.2-2.6-.5L2.7 22l9.3 1.7 9.3-1.7c-.1-5.8-3.9-14.1-5.5-14.1z" fill="#5E8E3E"/>
  </svg>
);

const WooCommerceLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M23.6 9.1c-.1-.3-.2-.6-.4-.9L19.8 1c-.2-.4-.6-.7-1.1-.7H5.3c-.5 0-.9.3-1.1.7L.8 8.2c-.2.3-.3.6-.4.9-.1.4-.1.8 0 1.2L2.1 22c.1.7.7 1.2 1.4 1.2h16.9c.7 0 1.3-.5 1.4-1.2l1.7-11.7c.2-.4.2-.8.1-1.2zM12 19.5c-4.1 0-7.5-3.4-7.5-7.5S7.9 4.5 12 4.5s7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5z" fill="#96588A"/>
    <circle cx="12" cy="12" r="6" fill="#FFFFFF"/>
    <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#96588A"/>
  </svg>
);

// Additional brand logos
const AmazonLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size * 6} height={size * 2} viewBox="0 0 300 100" fill="none">
    <text x="0" y="60" fontFamily="Inter, ui-sans-serif" fontSize="56" fontWeight="800" fill="#0f172a">amazon</text>
    <path d="M18 78c60 25 126 25 204 0" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

const EbayLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size * 6} height={size * 2} viewBox="0 0 300 100" fill="none">
    <text x="0" y="60" fontFamily="Inter, ui-sans-serif" fontSize="56" fontWeight="800" fill="#0f172a">ebay</text>
  </svg>
);

const BigCommerceLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size * 6} height={size * 2} viewBox="0 0 300 100" fill="none">
    <polygon points="0,80 120,20 120,80" fill="#0f172a" />
    <text x="130" y="65" fontFamily="Inter, ui-sans-serif" fontSize="36" fontWeight="800" fill="#0f172a">BIGCOMMERCE</text>
  </svg>
);



const GoogleAnalyticsLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="12" width="4" height="9" rx="2" fill="#4285F4"/>
    <rect x="10" y="6" width="4" height="15" rx="2" fill="#EA4335"/>
    <rect x="17" y="3" width="4" height="18" rx="2" fill="#34A853"/>
  </svg>
);



const DiscordLogo = ({ size = 24, color = '#5865F2' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" fill={color}/>
  </svg>
);

interface HomepageProps {
  onGetStarted: () => void;
  onViewProducts: () => void;
  onViewAffiliate?: () => void;
  connectedStoresCount: number;
  totalProducts: number;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export function Homepage({ onGetStarted, onViewProducts, onViewAffiliate, connectedStoresCount, totalProducts, onOpenAuth }: HomepageProps) {
  const [animatedNumbers, setAnimatedNumbers] = useState({
    products: 0,
    accuracy: 0,
    profit: 0,
    users: 0
  });

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isYearly, setIsYearly] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleScrollToPricing = () => {
    const el = document.getElementById('pricing-title');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Animated counter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedNumbers({
        products: 2500000,
        accuracy: 98,
        profit: 45,
        users: 10000
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      text: "AutoDrops helped me scale from $10k to $100k monthly revenue in just 6 months. The product analytics are game-changing!",
      author: "Sarah Chen",
      role: "E-commerce Entrepreneur",
      avatar: "SC"
    },
    {
      text: "The trend prediction feature is incredible. I've been ahead of every major fashion trend this year thanks to AutoDrops.",
      author: "Marcus Rodriguez",
      role: "Fashion Dropshipper",
      avatar: "MR"
    },
    {
      text: "Best investment I've made for my business. The ROI tracking and competitor analysis saved me thousands in ad spend.",
      author: "Emma Thompson",
      role: "Online Store Owner",
      avatar: "ET"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="w-14 h-14 md:w-16 md:h-16 rounded-xl transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25" />
        </div>
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={onViewAffiliate}
            className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium"
          >
            Become an Affiliate
          </button>
          <button onClick={handleScrollToPricing} className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Pricing
          </button>
          <button className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 font-medium">
            Community
          </button>
          </div>
          {/* Auth CTA only: Get Started */}
          <div className="flex items-center">
            <button 
              onClick={() => onOpenAuth?.('register')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              Get Started
            </button>
          </div>
          {/* Burger */}
            <button 
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-700 text-gray-200 hover:text-white hover:border-gray-500 transition-colors"
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(v => !v)}
            >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 py-3 border-b border-gray-800/50 bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => { onViewAffiliate?.(); setIsMobileMenuOpen(false); }}
              className="w-full text-left text-gray-300 hover:text-white px-2 py-2 rounded-lg hover:bg-gray-800/60"
            >
              Become an Affiliate
            </button>
            <button 
              onClick={() => { handleScrollToPricing(); setIsMobileMenuOpen(false); }}
              className="w-full text-left text-gray-300 hover:text-white px-2 py-2 rounded-lg hover:bg-gray-800/60"
            >
              Pricing
            </button>
            <button 
              className="w-full text-left text-gray-300 hover:text-white px-2 py-2 rounded-lg hover:bg-gray-800/60"
            >
              Community
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        {/* Hero Particles - positioned to avoid text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Left side particles */}
          {/* Removed Shopify logo */}

          <FloatingParticle 
            icon={<DiscordLogo size={26} />} 
            delay={2.5} 
            duration={16} 
            size={65} 
            startX={12} 
            startY={80} 
          />
          
          {/* Right side particles */}
          <FloatingParticle 
            icon={<WooCommerceLogo size={28} />} 
            delay={1} 
            duration={14} 
            size={70} 
            startX={95} 
            startY={25} 
          />

          <FloatingParticle 
            icon={<GoogleAnalyticsLogo size={26} />} 
            delay={3} 
            duration={18} 
            size={60} 
            startX={88} 
            startY={85} 
          />
          
          {/* Top corners - smaller particles */}
          <FloatingParticle 
            icon={<Target className="w-4 h-4 text-purple-400" />} 
            delay={1.5} 
            duration={13} 
            size={35} 
            startX={15} 
            startY={10} 
          />
          <FloatingParticle 
            icon={<TrendingUp className="w-4 h-4 text-green-400" />} 
            delay={3.5} 
            duration={17} 
            size={38} 
            startX={85} 
            startY={8} 
          />
          
          {/* Bottom area - avoiding text */}
          <FloatingParticle 
            icon={<Rocket className="w-4 h-4 text-pink-400" />} 
            delay={2.5} 
            duration={19} 
            size={40} 
            startX={20} 
            startY={95} 
          />
          <FloatingParticle 
            icon={<Brain className="w-4 h-4 text-indigo-400" />} 
            delay={4.5} 
            duration={21} 
            size={36} 
            startX={80} 
            startY={92} 
          />
          
          {/* Very small accent particles */}
          <FloatingParticle 
            icon={<Sparkles className="w-3 h-3 text-yellow-400" />} 
            delay={6} 
            duration={25} 
            size={25} 
            startX={25} 
            startY={40} 
          />
          <FloatingParticle 
            icon={<Star className="w-3 h-3 text-purple-300" />} 
            delay={1} 
            duration={22} 
            size={28} 
            startX={75} 
            startY={45} 
          />
        </div>
        
        <div className="animate-fade-in-up relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="text-sm font-medium text-purple-300">Powered by AI & Real-time Data</span>
            <Rocket className="w-5 h-5 text-blue-400 animate-bounce" />
          </div>
          
          <h1 className="text-4xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="inline-block animate-slide-in-left">Create products that</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-slide-in-right bg-300% animate-gradient">
              sell like crazy
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in delay-300">
            Know what will sell before you list a product. Track trends, analyze competitors, A/B test everything, find outlier products, and see what images are popular in your niche
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-5 mb-12 animate-fade-in delay-500">
            <button
              onClick={() => onOpenAuth?.('register')}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 md:px-10 md:py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 md:gap-3 text-base md:text-lg transform hover:scale-105 shadow-lg hover:shadow-2xl shadow-purple-500/25 h-[52px] md:h-[56px]"
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
              <span className="whitespace-nowrap">Start with AutoDrops Pro</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
            {/* Members joined pill, side-by-side with CTA */}
            <div
              className="group/pill inline-flex items-center h-[56px] gap-3 rounded-full px-5 border backdrop-blur-sm shadow-soft hover:shadow-soft-strong transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, rgba(147,51,234,0.14), rgba(59,130,246,0.14))',
                borderColor: 'rgba(147,51,234,0.35)'
              }}
            >
              <div className="flex -space-x-2">
                {['SC','MF','ET','JP'].map((initials, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full ring-2 ring-purple-500/40 bg-gradient-to-br from-gray-700 to-gray-600 text-white text-[10px] font-semibold flex items-center justify-center animate-fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                    aria-hidden
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-100/90 whitespace-nowrap">27k+ members joined</span>
            </div>
          </div>
        </div>

        {/* Interactive Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto animate-fade-in delay-700">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl p-1 backdrop-blur-sm border border-purple-500/30 shadow-2xl">
            <div className="bg-gray-900/80 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5"></div>
              
              {/* Mock Dashboard */}
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Live Product Analytics</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">Live Data</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-3 mb-2">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                      <span className="text-gray-300">Trending Products</span>
                    </div>
                    <div className="text-2xl font-bold text-white">1,247</div>
                    <div className="text-green-400 text-sm">+23% today</div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-3 mb-2">
                      <Target className="w-6 h-6 text-blue-400" />
                      <span className="text-gray-300">Profit Potential</span>
                    </div>
                    <div className="text-2xl font-bold text-white">67%</div>
                    <div className="text-blue-400 text-sm">High margin</div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-3 mb-2">
                      <Brain className="w-6 h-6 text-purple-400" />
                      <span className="text-gray-300">AI Score</span>
                    </div>
                    <div className="text-2xl font-bold text-white">94/100</div>
                    <div className="text-purple-400 text-sm">Excellent</div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center space-x-2 bg-gray-800/50 rounded-full px-6 py-3 border border-gray-700/50">
                    <Play className="w-5 h-5 text-white" />
                    <span className="text-gray-300">Watch how we decoded the selling formula</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Stats */}
      <div className="relative max-w-7xl mx-auto px-6 -mt-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              label: "Products Analyzed", 
              value: "+2,5M", 
              icon: <ShoppingBag className="w-6 h-6" />,
              color: "purple"
            },
            { 
              label: "Prediction Accuracy", 
              value: animatedNumbers.accuracy + "%", 
              icon: <Target className="w-6 h-6" />,
              color: "blue"
            },
            { 
              label: "Avg Profit Margin", 
              value: animatedNumbers.profit + "%", 
              icon: <TrendingUp className="w-6 h-6" />,
              color: "green"
            }
          ].map((stat, index) => (
            <div 
              key={index} 
              className={`bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:border-${stat.color}-500/50 shadow-lg hover:shadow-2xl animate-slide-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`flex justify-center mb-3 text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-white mb-1 animate-counter">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div id="pricing-section" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-24">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold mb-6">
            The most powerful 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> dropshipping tools</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our tools outperform competitors because they're trained on the largest, most precise dataset in the industry. 
            We process 2,500x more datapoints every day than other tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {[
            {
              icon: <Target className="w-10 h-10 text-purple-400" />,
              title: "Discover viral Outlier Products",
              description: "Find products that are outperforming relative to where they should be (so your products can do the same).",
              gradient: "from-purple-500/10 to-purple-600/10",
              border: "border-purple-500/20",
              delay: "0ms"
            },
            {
              icon: <BarChart3 className="w-10 h-10 text-blue-400" />,
              title: "Research Product & Store Performance",
              description: "Find what drives growth and sales with advanced Analytics and competitor insights.",
              gradient: "from-blue-500/10 to-blue-600/10",
              border: "border-blue-500/20",
              delay: "100ms"
            },
            {
              icon: <Users className="w-10 h-10 text-yellow-400" />,
              title: "Keep up with Competitors",
              description: "Track what's working for other sellers in your niche with real-time monitoring.",
              gradient: "from-yellow-500/10 to-yellow-600/10",
              border: "border-yellow-500/20",
              delay: "300ms"
            },
            {
              icon: <Brain className="w-10 h-10 text-indigo-400" />,
              title: "AI-Powered Product Research",
              description: "Let artificial intelligence find your next winning product with advanced algorithms.",
              gradient: "from-indigo-500/10 to-indigo-600/10",
              border: "border-indigo-500/20",
              delay: "500ms"
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className={`group bg-gradient-to-br ${feature.gradient} border ${feature.border} rounded-2xl p-8 hover:bg-gray-800/30 transition-all duration-500 hover:border-opacity-60 transform hover:scale-105 hover:-translate-y-2 animate-slide-in-up shadow-lg hover:shadow-2xl`}
              style={{ animationDelay: feature.delay }}
            >
              <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Global Sales Pulse */}
      <GlobalSalesPulse />

      {/* Integrations strip */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="relative flex items-center justify-center mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
          <span className="mx-6 text-xs tracking-widest uppercase text-gray-400">Works with leading platforms</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 items-center justify-items-center">
          {[
            GoogleLogoImg,
            ShopifyLogoImg,
            WooCommerceLogoImg,
            AliExpressLogoImg,
          ].map((src, i) => (
            <div key={src} className="logo-strip-item" style={{ animationDelay: `${i * 150}ms` }}>
              <img src={src} alt={`logo-${i}`} className="h-8 w-auto" />
            </div>
          ))}
        </div>
        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      {/* Animated Stats Section */}
      <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <h2 className="text-5xl font-bold mb-6 animate-fade-in">
            We know what will sell better than 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> anyone else</span>
          </h2>
          <p className="text-xl text-gray-300 mb-16 max-w-4xl mx-auto animate-fade-in delay-200">
            Our tools outperform competitors because they're trained on the largest, most precise dataset in the industry. 
            We process 2,500x more datapoints every day than other tools—fueling better insights for your business.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "2.5M+", label: "Products Analyzed Daily", icon: <Search className="w-8 h-8" /> },
              { value: "98.7%", label: "Prediction Accuracy", icon: <Target className="w-8 h-8" /> },
              { value: "156%", label: "Avg Revenue Increase", icon: <TrendingUp className="w-8 h-8" /> },
              { value: "24/7", label: "Real-time Monitoring", icon: <Eye className="w-8 h-8" /> }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-slide-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-purple-400 flex justify-center mb-4 animate-bounce" style={{ animationDelay: `${index * 200}ms` }}>
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 animate-counter">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discord Community Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-blue-600/20 border border-indigo-500/30 rounded-3xl p-12 text-center relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-pulse"></div>
          
          <div className="relative">
            {/* Discord Logo */}
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
              <DiscordLogo size={40} color="#FFFFFF" />
            </div>
            
            <div className="inline-flex items-center space-x-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-6 py-2 mb-6">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-300 font-medium">DISCORD COMMUNITY</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Connect with 17,000+ 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> successful dropshippers</span>
            </h2>
            
            <p className="text-base md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join our members-only Discord where entrepreneurs share what's actually working in dropshipping. 
              Plus, Pro Members get access to a dedicated server where you can get real-time feedback, insights, 
              and direct access to our team.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: <Rocket className="w-6 h-6" />, text: "Early Product Announcements" },
                { icon: <Users className="w-6 h-6" />, text: "Exclusive Workshops" },
                { icon: <Crown className="w-6 h-6" />, text: "Priority Support" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-gray-300 animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="text-indigo-400">{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 md:px-8 md:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto text-sm md:text-base">
              <DiscordLogo size={16} color="#FFFFFF" />
              <span className="whitespace-nowrap">Join Discord Community</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials Carousel */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 animate-fade-in">
          Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">successful entrepreneurs</span>
        </h2>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-lg text-gray-300 leading-relaxed mb-6 min-h-[120px] flex items-center justify-center">
                "{testimonials[currentTestimonial].text}"
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">{testimonials[currentTestimonial].author}</div>
                  <div className="text-gray-400 text-sm">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'bg-purple-500 w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h2 id="pricing-title" className="text-5xl md:text-6xl font-bold mb-6 scroll-mt-24 md:scroll-mt-40">
            Your next product should 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> go viral</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Get started with AutoDrops today
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-lg font-medium transition-colors duration-300 ${!isYearly ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-8 bg-gray-700 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-600"
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-transform duration-300 transform ${isYearly ? 'translate-x-8' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-lg font-medium transition-colors duration-300 ${isYearly ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-3xl p-8 relative backdrop-blur-sm transform hover:scale-105 transition-all duration-300 animate-slide-in-left">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-white">Starter</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">
                  ${isYearly ? '288' : '29.99'}
                </span>
                <span className="text-gray-400 ml-2">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-500 line-through text-lg">
                  ${isYearly ? '360' : '49.99'}
                </span>
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium">
                  {isYearly ? '20% OFF' : '40% OFF'}
                </span>
              </div>
              <p className="text-gray-400">
                {isYearly ? 'Save $72/year • $24/month' : 'Billed monthly'}
              </p>
            </div>
            
            <p className="text-gray-300 mb-8 text-lg">
              <strong>Perfect for getting started.</strong> Essential tools for new dropshippers and small businesses.
            </p>
            
            <ul className="space-y-4 mb-10 text-gray-300">
              {[
                "Product research and trend analysis",
                "Basic competitor monitoring",
                "Up to 100 product searches/month",
                "Email support",
                "Basic analytics dashboard",
                "Community Discord access"
              ].map((feature, index) => (
                <li key={index} className="flex items-start animate-slide-in-right" style={{ animationDelay: `${index * 50}ms` }}>
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={onGetStarted}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-3xl p-8 relative backdrop-blur-sm transform hover:scale-105 transition-all duration-300 animate-slide-in-right">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
                <Crown className="w-4 h-4" />
                <span>Most Popular</span>
              </span>
            </div>
            
            <div className="mb-8 mt-4">
              <h3 className="text-2xl font-bold mb-4 text-white">Pro</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">
                  ${isYearly ? '576' : '59.99'}
                </span>
                <span className="text-gray-400 ml-2">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-500 line-through text-lg">
                  ${isYearly ? '720' : '99.99'}
                </span>
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium">
                  {isYearly ? '20% OFF' : '40% OFF'}
                </span>
              </div>
              <p className="text-gray-400">
                {isYearly ? 'Save $144/year • $48/month' : 'Billed monthly'}
              </p>
            </div>
            
            <p className="text-gray-300 mb-8 text-lg">
              <strong>Our most powerful plan.</strong> Advanced tools for serious entrepreneurs and growing businesses.
            </p>
            
            <ul className="space-y-4 mb-10 text-gray-300">
              {[
                "Unlimited product searches",
                "Advanced competitor analytics",
                "AI-powered trend predictions",
                "Priority support & live chat",
                "Advanced A/B testing tools",
                "Custom alerts and notifications",
                "Pro Discord channels access",
                "API access for integrations"
              ].map((feature, index) => (
                <li key={index} className="flex items-start animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={onGetStarted}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-3xl p-16 backdrop-blur-sm animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Start creating 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> viral products </span>
            today
          </h2>
          <p className="text-base md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Know what works before you list a product. Track trends, analyze competitors, 
            and create images that convert—all backed by real-time AliExpress data and AI insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 md:px-12 md:py-5 rounded-xl font-semibold text-base md:text-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center space-x-3"
            >
              <Rocket className="w-6 h-6 animate-bounce" />
              <span>Get Started Free</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-16 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex items-center space-x-3">
                <img src={Logo} alt="Logo" className="w-14 h-14 rounded-xl" />
              </div>
              <div className="animate-fade-in w-full md:w-auto">
                <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                  <h3 className="font-semibold mb-3 md:mb-0 text-lg">Get to know us</h3>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Help Center</li>
                    
                <li className="hover:text-white transition-colors cursor-pointer">
                  <a href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  <a href="/terms" className="hover:text-white transition-colors">
                    Terms of Use
                  </a>
                </li>
                    <li className="hover:text-white transition-colors cursor-pointer">
                      <a href="/refunds" className="hover:text-white transition-colors">
                        Refund Policy
                      </a>
                    </li>
              </ul>
            </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800/50 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} AutoDrops. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0px) rotate(0deg);
          }
          25% {
            transform: translate(-50%, -50%) translateY(-20px) rotate(2deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px) rotate(-1deg);
          }
          75% {
            transform: translate(-50%, -50%) translateY(-15px) rotate(1deg);
          }
        }
        
        @keyframes particle-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(147, 51, 234, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.6), 0 0 30px rgba(59, 130, 246, 0.4);
          }
        }
        
        @keyframes rotate-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        .animate-fade-in {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out forwards;
        }
        
        .animate-slide-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-counter {
          animation: fade-in-up 1s ease-out forwards;
        }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-700 { animation-delay: 700ms; }
        
        /* Particle specific animations */
        .floating-particle:hover {
          animation-play-state: paused;
          transform: translate(-50%, -50%) scale(1.2) rotate(5deg) !important;
        }
        
        .floating-particle:nth-child(odd) {
          animation-direction: reverse;
        }
        
        .floating-particle:nth-child(3n) {
          animation-duration: 18s;
        }
        
        .floating-particle:nth-child(5n) {
          animation-duration: 22s;
        }
      `}</style>
    </div>
  );
}