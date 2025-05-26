import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { User } from '@shared/schema';
import { STORAGE_KEYS } from '@/utils/constants';
import { addActivity } from '@/lib/data';

type AuthUser = Omit<User, 'password'>;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useLocalStorage<AuthState>(STORAGE_KEYS.AUTH_TOKEN, {
    user: null,
    token: null
  });
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would make an API call to the server
      // For offline mode, we'll validate against localStorage data
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return false;
      }
      
      // Check if user is active
      if (!user.isActive) {
        return false;
      }
      
      // Generate a mock token (in a real app, this would come from the server)
      const token = `mock_token_${Date.now()}`;
      
      // Update last login time
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return { ...u, lastLogin: new Date() };
        }
        return u;
      });
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      
      // Save auth state
      const authUser: AuthUser = {
        ...user,
        password: undefined,
        lastLogin: new Date()
      };
      
      setAuthState({
        user: authUser,
        token
      });
      
      // Log activity
      addActivity({
        userId: user.id,
        activityType: 'login',
        description: `${user.fullName} قام بتسجيل الدخول`,
        relatedEntityType: 'user',
        relatedEntityId: user.id.toString()
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [setAuthState]);

  const logout = useCallback(() => {
    // Log activity before logout if user exists
    if (authState.user) {
      addActivity({
        userId: authState.user.id,
        activityType: 'logout',
        description: `${authState.user.fullName} قام بتسجيل الخروج`,
        relatedEntityType: 'user',
        relatedEntityId: authState.user.id.toString()
      });
    }
    
    setAuthState({
      user: null,
      token: null
    });
  }, [authState.user, setAuthState]);

  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    if (!authState.user) return;
    
    setAuthState({
      ...authState,
      user: {
        ...authState.user,
        ...userData
      }
    });
  }, [authState, setAuthState]);

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: !!authState.token,
    isAdmin: authState.user?.role === 'admin',
    isManager: authState.user?.role === 'manager' || authState.user?.role === 'admin',
    login,
    logout,
    updateUser,
    loading
  };
}
