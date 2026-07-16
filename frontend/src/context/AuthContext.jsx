import { createContext, useContext, useState, useEffect } from 'react';
import { 
  login as loginApi, 
  register as registerApi, 
  logout as logoutApi, 
  getCurrentUser as getCurrentUserApi,
  changePassword as changePasswordApi,
  googleLogin as googleLoginApi
} from '../services/authApi.js';

const AuthContext = createContext(null);

const clearApplicationStorage = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('forecastiq_') || key.startsWith('forecast_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('fiq-auth-token') || sessionStorage.getItem('fiq-auth-token'));
  const [loading, setLoading] = useState(true);

  // Sync token changes to axios or API storage
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('fiq-auth-token') || sessionStorage.getItem('fiq-auth-token');
      if (savedToken) {
        try {
          const currentUser = await getCurrentUserApi();
          setUser(currentUser);
        } catch (error) {
          console.error('Session restoration failed:', error);
          clearApplicationStorage();
          // Clean up state
          localStorage.removeItem('fiq-auth-token');
          localStorage.removeItem('fiq-auth-user');
          sessionStorage.removeItem('fiq-auth-token');
          sessionStorage.removeItem('fiq-auth-user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen for global axios 401 unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      clearApplicationStorage();
      setUser(null);
      setToken(null);
      localStorage.removeItem('fiq-auth-token');
      localStorage.removeItem('fiq-auth-user');
      sessionStorage.removeItem('fiq-auth-token');
      sessionStorage.removeItem('fiq-auth-user');
    };
    window.addEventListener('fiq-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('fiq-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password, remember = true) => {
    setLoading(true);
    try {
      clearApplicationStorage();
      const response = await loginApi(email, password);
      const { access_token, user: userData } = response;
      
      if (remember) {
        localStorage.setItem('fiq-auth-token', access_token);
        localStorage.setItem('fiq-auth-user', JSON.stringify(userData));
        sessionStorage.removeItem('fiq-auth-token');
        sessionStorage.removeItem('fiq-auth-user');
      } else {
        sessionStorage.setItem('fiq-auth-token', access_token);
        sessionStorage.setItem('fiq-auth-user', JSON.stringify(userData));
        localStorage.removeItem('fiq-auth-token');
        localStorage.removeItem('fiq-auth-user');
      }
      
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (code, state) => {
    setLoading(true);
    try {
      clearApplicationStorage();
      const response = await googleLoginApi(code, state);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('fiq-auth-token', access_token);
      localStorage.setItem('fiq-auth-user', JSON.stringify(userData));
      sessionStorage.removeItem('fiq-auth-token');
      sessionStorage.removeItem('fiq-auth-user');
      
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, confirmPassword) => {
    setLoading(true);
    try {
      clearApplicationStorage();
      // 1. Register user
      await registerApi(name, email, password, confirmPassword);
      // 2. Automatically log them in
      const response = await loginApi(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('fiq-auth-token', access_token);
      localStorage.setItem('fiq-auth-user', JSON.stringify(userData));
      sessionStorage.removeItem('fiq-auth-token');
      sessionStorage.removeItem('fiq-auth-user');
      
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi().catch(() => {}); // ignore server errors during logout
    } finally {
      clearApplicationStorage();
      localStorage.removeItem('fiq-auth-token');
      localStorage.removeItem('fiq-auth-user');
      sessionStorage.removeItem('fiq-auth-token');
      sessionStorage.removeItem('fiq-auth-user');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
    const response = await changePasswordApi(oldPassword, newPassword, confirmNewPassword);
    if (response?.user) {
      setUser(response.user);
      localStorage.setItem('fiq-auth-user', JSON.stringify(response.user));
    }
    return response;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('fiq-auth-user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithGoogle,
    logout,
    changePassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
