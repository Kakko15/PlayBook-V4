import { createContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import Loader from '@/components/Loader';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('playbook-token');
    const storedUser = localStorage.getItem('playbook-user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.setAuthToken(token);
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        localStorage.removeItem('playbook-token');
        localStorage.removeItem('playbook-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);

    if (data.otpRequired) {
      sessionStorage.setItem('playbook-otp-email', email);
      return { otpRequired: true };
    }

    if (data.token && data.user) {
      localStorage.setItem('playbook-token', data.token);
      localStorage.setItem('playbook-user', JSON.stringify(data.user));
      api.setAuthToken(data.token);
      setUser(data.user);
      return { user: data.user, otpRequired: false };
    }

    return data;
  };

  const signup = async (name, email, password, recaptchaToken) => {
    const data = await api.signup(name, email, password, recaptchaToken);
    return data;
  };

  const completeOtpLogin = (token, user) => {
    localStorage.setItem('playbook-token', token);
    localStorage.setItem('playbook-user', JSON.stringify(user));
    api.setAuthToken(token);
    setUser(user);
    // Note: sessionStorage email is cleared by the calling component after navigation
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('playbook-token');
    localStorage.removeItem('playbook-user');
    sessionStorage.removeItem('playbook-otp-email');
    api.setAuthToken(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    signup,
    logout,
    completeOtpLogin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
