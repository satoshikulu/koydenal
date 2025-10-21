import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          setIsAdmin(profile?.role === 'admin');
          setUser(user);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          setIsAdmin(profile?.role === 'admin');
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loginAsAdmin = async (password) => {
    try {
      // Check admin password from environment variables
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      
      // Log for debugging
      console.log('Entered password:', password);
      console.log('Expected password from env:', adminPassword);
      
      // Handle case where environment variable might not be loaded
      if (!adminPassword) {
        console.warn('Environment variable VITE_ADMIN_PASSWORD not found, using fallback');
        // Fallback to hardcoded password with clear message
        const fallbackPassword = 'Sevimbebe4242.';
        
        if (password === fallbackPassword || password === 'Sevimbebe4242') {
          setIsAdmin(true);
          return { success: true };
        } else {
          return { success: false, error: `Geçersiz admin şifresi. Beklenen: ${fallbackPassword} (nokta dahil)` };
        }
      }
      
      // Handle case where password might be entered with or without period
      const normalizedPassword = password.trim();
      const normalizedAdminPassword = adminPassword.trim();
      
      // Also check with and without the period
      const passwordWithoutPeriod = normalizedPassword.replace(/\.$/, '');
      const adminPasswordWithoutPeriod = normalizedAdminPassword.replace(/\.$/, '');
      
      // Debug information
      console.log('Normalized match:', normalizedPassword === normalizedAdminPassword);
      console.log('Without period match:', passwordWithoutPeriod === adminPasswordWithoutPeriod);

      if (normalizedPassword === normalizedAdminPassword || 
          passwordWithoutPeriod === adminPasswordWithoutPeriod ||
          normalizedPassword === adminPasswordWithoutPeriod) {
        // Şifre doğruysa doğrudan admin erişimi ver
        setIsAdmin(true);
        return { success: true };
      } else {
        return { success: false, error: `Geçersiz admin şifresi. Beklenen: ${adminPassword} (nokta dahil)` };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Giriş hatası oluştu' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
  };

  const value = {
    isAdmin,
    loading,
    user,
    loginAsAdmin,
    logout
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};