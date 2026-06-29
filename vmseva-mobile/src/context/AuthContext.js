import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, setAuthToken } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setAuthToken(token);
          const r = await authAPI.me();
          setUser(r.data);
        }
      } catch (e) {
        console.log('Error loading auth token:', e);
        await AsyncStorage.removeItem('token');
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    setAuthToken(data.token);
    const me = await authAPI.me();
    setUser(me.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  };

  const hasRole = (roleName) => user?.roles?.some(r => r.name === roleName);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
