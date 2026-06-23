import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      if (token) {
        authAPI.me()
          .then(r => setUser(r.data))
          .catch(() => AsyncStorage.removeItem('token'))
          .finally(() => setLoading(false));
      } else setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    const me = await authAPI.me();
    setUser(me.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (role) => user?.roles?.some(r => r.name === role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
