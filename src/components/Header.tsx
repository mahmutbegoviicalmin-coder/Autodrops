import { Menu, User, X, Store, LogOut, Settings, Heart, Filter } from 'lucide-react';
import { getCategoryIconByName } from '../data/categoryIcons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../assets/logos/AD_logo.png';

interface HeaderProps {
  selectedView: 'products' | 'orders';
  onViewChange: (view: 'products' | 'orders') => void;

  onConnectStore?: () => void;
  connectedStores?: any[];
  isLoadingProducts?: boolean;

  currentCategory?: string;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenAccountSettings?: () => void;
  onOpenFavorites?: () => void;
  onGoHome?: () => void;
  onToggleFilters?: () => void;
}

export function Header({ 
  selectedView,
  onViewChange,
  onConnectStore, 
  connectedStores = [],
  currentCategory = 'All',
  onOpenAuth,
  onOpenAccountSettings,
  onOpenFavorites,
  onGoHome,
  onToggleFilters,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="glass-effect border-b border-gray-800/50 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Main Header Row */}
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo - Always visible */}
          <button
            onClick={() => onGoHome?.()}
            className="flex-shrink-0 group"
            title="Go to Homepage"
          >
            <div className="flex items-center space-x-2 lg:space-x-3">
              <img src={Logo} alt="Logo" className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl shadow-lg shadow-purple-500/25 transform group-hover:scale-110 transition-transform duration-300" />
            </div>
          </button>

          {/* Center Section - Navigation & Search */}
          <div className="flex-1 flex items-center justify-center space-x-2 lg:space-x-4 mx-2 lg:mx-6 min-w-0">
            {/* View Toggle - Compact on mobile */}
            <div className="flex bg-gray-900/50 rounded-xl p-1 border border-gray-700/50 backdrop-blur-sm">
              <button
                  onClick={() => onViewChange('products')}
                  className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                    selectedView === 'products'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                  title="Explore Winning Products"
                >
                  <span className="hidden sm:inline">Products</span>
                  <span className="sm:hidden">📦</span>
                </button>

              <button
                onClick={() => onViewChange('orders')}
                className={`px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                  selectedView === 'orders'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
                title="Orders Dashboard"
              >
                <span className="hidden sm:inline">Orders</span>
                <span className="sm:hidden">📋</span>
              </button>

              

              
            </div>



            {/* Current Category Display - Hidden on mobile (skip generic "All") */}
            {selectedView === 'products' && currentCategory &&
             currentCategory.toLowerCase() !== 'all' &&
             currentCategory !== '🔥 All Categories' && (
              <div className="hidden xl:flex items-center space-x-2 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                {(() => {
                  const { icon, color } = getCategoryIconByName(currentCategory);
                  return (
                    <>
                      <span className={`text-sm ${color}`}>{icon}</span>
                      <span className="text-xs font-medium text-white">
                        {currentCategory}
                      </span>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">


            {/* Store Connection */}
            {onConnectStore && (
              <button
                onClick={onConnectStore}
                className="flex items-center space-x-1 lg:space-x-2 bg-gray-900/50 hover:bg-gray-800/50 text-white px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                title={connectedStores.length > 0 ? `${connectedStores.length} Connected` : 'Connect Store'}
              >
                <Store className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden lg:inline text-xs">
                  {connectedStores.length > 0 ? `${connectedStores.length}` : 'Connect'}
                </span>
                <span className="lg:hidden text-xs font-bold">
                  {connectedStores.length > 0 ? connectedStores.length : ''}
                </span>
              </button>
            )}

            {/* Advanced Filters Toggle removed (sidebar already has it) */}

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <div className="flex items-center space-x-2">
                  <div className="hidden lg:block text-right">
                    <p className="text-xs text-white font-medium">{user.fullName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <div className="flex items-center justify-end mt-1">
                      <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-0.5 rounded-full text-white font-bold">
                        {user.subscription.plan.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25"
                    title={user.fullName}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full" />
                    ) : (
                      <User className="h-3 w-3 lg:h-4 lg:w-4" />
                    )}
                  </button>
                </div>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900/90 border border-gray-700/50 rounded-xl shadow-2xl z-50 backdrop-blur-sm">
                    <div className="p-4 border-b border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.fullName}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-0.5 rounded-full text-white font-bold">
                              {user.subscription.plan.toUpperCase()}
                            </span>
                            {!user.isEmailVerified && (
                              <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded-full text-white font-bold ml-2">
                                UNVERIFIED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAccountSettings?.();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenFavorites?.();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        <span>My Favorites</span>
                      </button>
                      
                      <button 
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                        }}
                        disabled={loading}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{loading ? 'Signing Out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="bg-gray-900/50 border border-gray-700/50 text-white hover:bg-gray-800/50 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-sm px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg font-semibold text-xs lg:text-sm"
                >
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">👤</span>
                </button>
                {/* Only show Explore Winning Products to logged-in users, so hide the Sign Up button */}
              </div>
            )}
          </div>
        </div>


      </div>
    </header>
  );
} 