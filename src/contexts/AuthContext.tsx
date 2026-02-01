import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, UserRole } from '@/types';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        setUser(response.data);
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${response.data.firstName} ${response.data.lastName}`,
        });
        return true;
      } else {
        toast({
          title: 'Login failed',
          description: response.message || 'Invalid credentials',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.success && response.data) {
        setUser(response.data);
        toast({
          title: 'Registration successful!',
          description: 'Welcome to RentEase. Your account is pending verification.',
        });
        return true;
      } else {
        toast({
          title: 'Registration failed',
          description: response.message || 'Could not create account',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authApi.resetPassword(email);
      toast({
        title: 'Password reset',
        description: response.message || 'Check your email for reset instructions.',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
