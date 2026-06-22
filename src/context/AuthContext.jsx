import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        }
      } catch (e) {
        console.warn('Invalid user data in localStorage. Clearing corrupt value.');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      // TODO: Replace with actual API call
      const mockUser = {
        id: '1',
        email,
        name: 'Test User',
        preferences: {}
      };
      
      setUser(mockUser);
      try {
        localStorage.setItem('user', JSON.stringify(mockUser));
      } catch (_) {
        // Ignore storage write errors (quota/permissions)
      }
      return mockUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, password, name) => {
    try {
      setError(null);
      // TODO: Replace with actual API call
      const mockUser = {
        id: '1',
        email,
        name,
        preferences: {}
      };
      
      setUser(mockUser);
      try {
        localStorage.setItem('user', JSON.stringify(mockUser));
      } catch (_) {
        // Ignore storage write errors (quota/permissions)
      }
      return mockUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
    } catch (_) {
      // Ignore storage remove errors
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 