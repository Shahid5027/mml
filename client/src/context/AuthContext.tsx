import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure default base URL for API communications
axios.defaults.baseURL = 'http://localhost:5000';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  department?: string;
  shiftStartTime: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize dynamic Axios Bearer header with local token changes
  const updateAxiosHeader = (jwtToken: string | null) => {
    if (jwtToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // 1. Restore local session states on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('geoshield_token');
      const savedUser = localStorage.getItem('geoshield_user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          setToken(savedToken);
          setUser(parsedUser);
          updateAxiosHeader(savedToken);
          
          // Proactive health verification: check session validity with server
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          
          if (response.data.user) {
            setUser(response.data.user);
            localStorage.setItem('geoshield_user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.warn('Session restoration failed. Clearing stale credentials:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // 2. Login transaction handler
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: jwtToken, user: loggedUser } = response.data;

      // Save credentials locally
      localStorage.setItem('geoshield_token', jwtToken);
      localStorage.setItem('geoshield_user', JSON.stringify(loggedUser));

      // Update state
      setToken(jwtToken);
      setUser(loggedUser);
      updateAxiosHeader(jwtToken);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login attempt failed. Please check network connection.';
      throw new Error(errorMsg);
    }
  };

  // 3. Logout action
  const logout = () => {
    localStorage.removeItem('geoshield_token');
    localStorage.removeItem('geoshield_user');
    setToken(null);
    setUser(null);
    updateAxiosHeader(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be consumed within an AuthProvider wrapper.');
  }
  return context;
};
