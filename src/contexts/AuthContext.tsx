import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signOutUser,
  updateUserProfile,
  mapFirebaseUserToUser,
  sendPasswordResetEmail,
} from '../services/authService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  isEmailVerified: boolean;
  subscription: {
    plan: 'free' | 'starter' | 'pro';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const user = await mapFirebaseUserToUser(firebaseUser);
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to get user data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    if (!validateEmail(credentials.email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!credentials.password) {
      throw new Error('Password is required');
    }

    setLoading(true);
    try {
      const user = await signInWithEmailAndPassword(credentials);
      setUser(user);
      toast.success('Login successful! Welcome back! 🎉');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      const user = await mapFirebaseUserToUser(firebaseUser);
      setUser(user);
      toast.success('Google sign-in successful! Welcome! 🎉');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    // Validation
    if (!validateEmail(credentials.email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!validatePassword(credentials.password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (!credentials.firstName.trim() || !credentials.lastName.trim()) {
      throw new Error('First name and last name are required');
    }

    setLoading(true);
    try {
      const user = await signUpWithEmailAndPassword(credentials);
      setUser(user);
      toast.success('Account created successfully! Welcome to AutoDrops! 🎉');
      
      if (!user.isEmailVerified) {
        toast('Please check your email to verify your account 📧', {
          duration: 6000,
          icon: '📧',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      toast.success('If an account exists for this email, a password reset link has been sent');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset email';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    setLoading(true);
    try {
      await updateUserProfile(user.id, data);
      const updatedUser = { ...user, ...data, updatedAt: new Date().toISOString() };
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
