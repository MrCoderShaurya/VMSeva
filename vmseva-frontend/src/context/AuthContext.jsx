import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check both localStorage (remember me) and sessionStorage (session only)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(r => setUser(r.data))
        .catch(() => {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false, rememberDevice = false) => {
    const deviceToken = localStorage.getItem('deviceToken') || null;
    const { data } = await authAPI.login({ email, password, rememberDevice, deviceToken });
    if (rememberMe) {
      localStorage.setItem('token', data.token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', data.token);
      localStorage.removeItem('token');
    }
    if (data.deviceToken) {
      localStorage.setItem('deviceToken', data.deviceToken);
    }
    const me = await authAPI.me();
    setUser(me.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    // deviceToken intentionally kept so device stays trusted
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
