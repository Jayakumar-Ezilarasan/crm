import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/models';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT to get user info
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: tokenPayload.id,
          email: tokenPayload.email,
          name: tokenPayload.name || 'User',
          role: tokenPayload.role,
        };
        setUser(user);
      } catch (error) {
        console.error('Error decoding token:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;
        
        // Store tokens
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Decode JWT to get user info
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const user: User = {
          id: tokenPayload.id,
          email: tokenPayload.email,
          name: tokenPayload.name || 'User',
          role: tokenPayload.role,
        };
        
        setUser(user);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        // Registration successful - don't throw an error, just return
        return;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 