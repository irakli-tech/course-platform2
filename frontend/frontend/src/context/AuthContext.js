import React, { createContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, username, email, role }
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [authLoading, setAuthLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get('auth/me/');
      setUser(res.data);
    } catch (err) {
      // ტოკენი ვადაგასულია/არასწორია
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setUser(null);
      setAuthLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setAuthLoading(true);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  // პროფილის რედაქტირების შემდეგ (ProfilePage) local user state-ის განახლება,
  // სერვერისკენ დამატებითი round-trip-ის გარეშე.
  const refreshUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, token, authLoading, isTeacher, isStudent, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
