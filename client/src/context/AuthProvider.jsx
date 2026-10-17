import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { AuthContext } from './useAuth.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  useEffect(() => {
    let active = true;
    api('/auth/me')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (active && error.status !== 401)
          setSessionError('Unable to restore your session. Please log in again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function login(details) {
    const data = await api('/auth/login', { method: 'POST', body: details });
    setUser(data.user);
    setSessionError('');
    return data.user;
  }
  async function register(details) {
    const data = await api('/auth/register', { method: 'POST', body: details });
    setUser(data.user);
    setSessionError('');
    return data.user;
  }
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, sessionError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
