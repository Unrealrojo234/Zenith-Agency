// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import pb from '../lib/pocketbase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);

  // Authentication methods
  const login = async (username, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(username, password);
      return authData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, password, passwordConfirm, additionalData = {}) => {
    try {
      const data = {
        username, // Using username instead of email
        password,
        passwordConfirm,
        ...additionalData
      };
      
      const record = await pb.collection('users').create(data);
      await login(username, password); // Automatically login after registration
      return record;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
  };

  useEffect(() => {
    // Listen for auth store changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
      setLoading(false);
    });

    // Check if there's an existing valid auth store
    if (pb.authStore.isValid) {
      pb.collection('users').authRefresh();
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}