import React, { createContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import Loader from '@/components/Loader';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profileData = await api.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch profile in context', error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('playbook-token');
    localStorage.removeItem('playbook-user');
    sessionStorage.removeItem('playbook-otp-email');
    api.setAuthToken(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // This GET request will establish the session and retrieve the CSRF token
        await api.getHealth();
      } catch (error) {
        console.error('Failed to initialize session. CSRF might fail.', error);
      }

      const token = localStorage.getItem('playbook-token');
      const storedUser = localStorage.getItem('playbook-user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          api.setAuthToken(token);
          await fetchProfile(); // Make sure to await this
        } catch (error) {
          console.error('Failed to parse user from localStorage', error);
          localStorage.removeItem('playbook-token');
          localStorage.removeItem('playbook-user');
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  const login = async (email, password, recaptchaToken) => {
    const data = await api.login(email, password, recaptchaToken);

    if (data.otpRequired) {
      sessionStorage.setItem('playbook-otp-email', email);
      return { otpRequired: true };
    }

    if (data.token && data.user) {
      localStorage.setItem('playbook-token', data.token);
      localStorage.setItem('playbook-user', JSON.stringify(data.user));
      api.setAuthToken(data.token);
      setUser(data.user);
      await fetchProfile();
      return { user: data.user, otpRequired: false };
    }

    return data;
  };

  const signup = async (name, email, password, recaptchaToken) => {
    const data = await api.signup(name, email, password, recaptchaToken);
    return data;
  };

  const completeOtpLogin = async (token, user) => {
    localStorage.setItem('playbook-token', token);
    localStorage.setItem('playbook-user', JSON.stringify(user));
    api.setAuthToken(token);
    setUser(user);
    await fetchProfile();
  };

  const value = {
    user,
    setUser,
    profile,
    setProfile,
    loading,
    login,
    signup,
    logout,
    completeOtpLogin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
