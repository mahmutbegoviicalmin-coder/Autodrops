import { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth, LoginCredentials, RegisterCredentials } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccess?: (type: 'login' | 'register') => void;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, loginWithGoogle, register, loading, resetPassword } = useAuth();
  const [isForgot, setIsForgot] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // trigger enter animation on mount
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Set mode when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (initialMode === 'register') {
      setIsLogin(false);
      setIsForgot(false);
    } else if (initialMode === 'forgot') {
      setIsForgot(true);
      setIsLogin(true);
    } else {
      setIsLogin(true);
      setIsForgot(false);
    }
  }, [isOpen, initialMode]);

  const handleClose = () => {
    // play exit animation then close
    setMounted(false);
    setTimeout(() => onClose(), 220);
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Registration-specific validation
    if (!isLogin) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgot) {
      try {
        await resetPassword(formData.email);
        setIsForgot(false);
        setErrors({});
      } catch (e) {}
      return;
    }

    if (!validateForm()) return;

    try {
      if (isLogin) {
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password,
        };
        await login(credentials);
        onSuccess?.('login');
      } else {
        const credentials: RegisterCredentials = {
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };
        await register(credentials);
        onSuccess?.('register');
      }
      
      // Reset form and close modal on success
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        confirmPassword: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    
    if (score <= 2) return { score, text: 'Weak', color: 'text-red-400' };
    if (score <= 4) return { score, text: 'Medium', color: 'text-yellow-400' };
    return { score, text: 'Strong', color: 'text-green-400' };
  };

  const passwordStrength = !isLogin ? getPasswordStrength(formData.password) : null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      } overflow-y-auto`}
    >
      <div
        className={`bg-dark-800 rounded-2xl shadow-premium-lg border border-dark-600 w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain transform-gpu will-change-transform transition-all duration-300 ease-out ${
          mounted ? 'opacity-100 translate-y-0 scale-100 modal-animate-in' : 'opacity-0 translate-y-2 scale-[0.98]'
        }`}
      >
        <div className="p-6 border-b border-dark-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Join AutoDrops'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors active:scale-95"
              disabled={loading}
            >
              <X className="h-6 w-6 text-gray-400 transform-gpu filter-none" />
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            {isLogin ? 'Sign in to your premium account' : 'Create your premium account'}
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgot && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transform-gpu filter-none z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`premium-input w-full pl-10 ${
                        errors.firstName ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="John"
                      disabled={loading}
                    />
                  </div>
                  {errors.firstName && (
                    <div className="mt-1 flex items-center text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 mr-1 transform-gpu filter-none" />
                      {errors.firstName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`premium-input w-full ${
                      errors.lastName ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="Doe"
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <div className="mt-1 flex items-center text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 mr-1 transform-gpu filter-none" />
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={isForgot ? 'opacity-100' : ''}>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transform-gpu filter-none z-10 pointer-events-none" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`premium-input w-full pl-10 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <div className="mt-1 flex items-center text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1 transform-gpu filter-none" />
                  {errors.email}
                </div>
              )}
            </div>

            {!isForgot && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transform-gpu filter-none z-10 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`premium-input w-full pl-10 pr-12 ${
                    errors.password ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors active:scale-95"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 transform-gpu filter-none" /> : <Eye className="h-5 w-5 transform-gpu filter-none" />}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 flex items-center text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1 transform-gpu filter-none" />
                  {errors.password}
                </div>
              )}
              
              {/* Password Strength Indicator */}
              {!isLogin && formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex space-x-1 mb-1">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          index < passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? 'bg-red-400'
                              : passwordStrength.score <= 4
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.text}
                  </p>
                </div>
              )}
            </div>
            )}

            {!isLogin && !isForgot && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transform-gpu filter-none z-10 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`premium-input w-full pl-10 pr-12 ${
                      errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors active:scale-95"
                    disabled={loading}
                  >
                     {showConfirmPassword ? <EyeOff className="h-5 w-5 transform-gpu filter-none" /> : <Eye className="h-5 w-5 transform-gpu filter-none" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="mt-1 flex items-center text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1 transform-gpu filter-none" />
                    {errors.confirmPassword}
                  </div>
                )}
                {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="mt-1 flex items-center text-sm text-green-400">
                    <CheckCircle className="h-4 w-4 mr-1 transform-gpu filter-none" />
                    Passwords match
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full premium-button py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin transform-gpu filter-none" />
                  {isForgot ? 'Sending reset link...' : isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isForgot ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          {!isForgot && (
            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-gray-400 text-sm">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>
          )}

          {/* Google Sign-In Button */}
          {!isForgot && (
          <button
            onClick={async () => {
              try {
                await loginWithGoogle();
                handleClose();
              } catch (error) {
                // Error is already handled in the context with toast
              }
            }}
            disabled={loading}
            className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin transform-gpu filter-none" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-3 transform-gpu filter-none" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isForgot ? (
                <>
                  Remembered your password?{' '}
                  <button
                    onClick={() => {
                      setIsForgot(false);
                      setIsLogin(true);
                      setErrors({});
                    }}
                    className="text-premium-purple hover:text-premium-purple-bright font-semibold transition-colors"
                    disabled={loading}
                  >
                    Back to Sign In
                  </button>
                </>
              ) : isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  if (isForgot) return;
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    confirmPassword: ''
                  });
                }}
                className="text-premium-purple hover:text-premium-purple-bright font-semibold transition-colors"
                disabled={loading}
              >
                {isForgot ? '' : isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
            {!isForgot && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    setIsForgot(true);
                    setIsLogin(true);
                    setErrors({});
                  }}
                  className="text-sm text-gray-400 hover:text-gray-200"
                  disabled={loading}
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                Premium Features Included:
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Real AliExpress product data</li>
                <li>• AI-powered descriptions</li>
                <li>• Store integrations</li>
                <li>• Profit analysis tools</li>
              </ul>
            </div>
          )}

          {!isLogin && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Use</a>{' '}
              and <a href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}