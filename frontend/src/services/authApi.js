import axios from 'axios';

// Base API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if it exists
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fiq-auth-token') || sessionStorage.getItem('fiq-auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors like 401 Unauthorized
authApi.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const originalRequest = error.config;

    if (status === 401) {
      const isLoginOrRegister = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register');
      if (!isLoginOrRegister) {
        // Clear tokens and credentials from both storages
        localStorage.removeItem('fiq-auth-token');
        localStorage.removeItem('fiq-auth-user');
        sessionStorage.removeItem('fiq-auth-token');
        sessionStorage.removeItem('fiq-auth-user');
        
        // Dispatch unauthorized event to alert AuthProvider
        window.dispatchEvent(new Event('fiq-unauthorized'));
        
        // Redirect to login if currently in a protected route
        if (window.location.pathname.startsWith('/app')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Structure error messages cleanly for the frontend forms
    const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

// API endpoint calls
export const register = async (name, email, password, confirmPassword) => {
  return authApi.post('/auth/register', {
    full_name: name,
    email,
    password,
    confirm_password: confirmPassword,
  });
};

export const login = async (email, password) => {
  return authApi.post('/auth/login', {
    email,
    password,
  });
};

export const logout = async () => {
  return authApi.post('/auth/logout');
};

export const getCurrentUser = async () => {
  return authApi.get('/auth/me');
};

export const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
  return authApi.put('/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
    confirm_new_password: confirmNewPassword,
  });
};

export const googleLogin = async (code, state) => {
  let url = `/auth/google/callback?code=${encodeURIComponent(code)}`;
  if (state) {
    url += `&state=${encodeURIComponent(state)}`;
  }
  return authApi.get(url);
};

export const forgotPassword = async (email) => {
  return authApi.post('/auth/forgot-password', { email });
};

export const validateResetToken = async (token) => {
  return authApi.get(`/auth/reset-password/${encodeURIComponent(token)}`);
};

export const resetPassword = async (token, password, confirmPassword) => {
  return authApi.post('/auth/reset-password', {
    token,
    password,
    confirm_password: confirmPassword,
  });
};

export default authApi;
