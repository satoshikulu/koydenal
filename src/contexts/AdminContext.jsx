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
    let mounted = true;

    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        console.log('🔍 Checking admin status...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('📥 getUser response:', { user: user?.email, error: userError });

        if (!mounted) return;

        if (userError) {
          console.error('❌ Auth error:', userError);
          setIsAdmin(false);
          setUser(null);
          setLoading(false);
          return;
        }

        if (user) {
          console.log('👤 User found:', user.email, '- Fetching profile...');
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, status')
            .eq('id', user.id)
            .single();

          console.log('📥 Profile response:', { profile, error: profileError });

          if (!mounted) return;

          if (profileError) {
            console.error('❌ Profile error:', profileError);
            setIsAdmin(false);
            setUser(user);
            setLoading(false);
            return;
          }

          console.log('👤 Admin check:', {
            userId: user.id,
            role: profile?.role,
            status: profile?.status,
            isAdmin: profile?.role === 'admin' && profile?.status === 'approved'
          });

          setIsAdmin(profile?.role === 'admin' && profile?.status === 'approved');
          setUser(user);
        } else {
          console.log('👤 No user logged in');
          setIsAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error checking admin status:', error);
        if (mounted) {
          setIsAdmin(false);
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('🏁 Setting loading to false...');
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true); // Loading başlat
          console.log('🔄 Fetching profile for signed in user...');

          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role, status')
            .eq('id', session.user.id)
            .single();

          console.log('📥 Profile response on sign in:', { profile, error: profileError });

          if (!mounted) return;

          if (profileError) {
            console.error('❌ Profile error on sign in:', profileError);
            setIsAdmin(false);
            setUser(session.user);
            setLoading(false);
            return;
          }

          console.log('👤 User signed in:', {
            userId: session.user.id,
            role: profile?.role,
            status: profile?.status,
            isAdmin: profile?.role === 'admin' && profile?.status === 'approved'
          });

          setIsAdmin(profile?.role === 'admin' && profile?.status === 'approved');
          setUser(session.user);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('👤 User signed out');
          setIsAdmin(false);
          setUser(null);
          setLoading(false); // Hemen loading'i kapat
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔄 Initial session event - ignoring (handled by checkAdminStatus)');
        } else {
          console.log('🔄 Other auth event:', event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAsAdmin = async (email, password) => {
    try {
      console.log('🔐 Admin login attempt:', email);

      // Supabase auth ile giriş yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        return { success: false, error: authError.message };
      }

      // Kullanıcının admin olup olmadığını kontrol et
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, status')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        await supabase.auth.signOut();
        return { success: false, error: 'Profil bilgisi alınamadı' };
      }

      if (profile.role !== 'admin') {
        console.error('❌ Not admin:', profile.role);
        await supabase.auth.signOut();
        return { success: false, error: 'Bu hesap admin yetkisine sahip değil' };
      }

      if (profile.status !== 'approved') {
        console.error('❌ Not approved:', profile.status);
        await supabase.auth.signOut();
        return { success: false, error: 'Admin hesabınız henüz onaylanmamış' };
      }

      console.log('✅ Admin login successful');
      setIsAdmin(true);
      setUser(authData.user);
      return { success: true };
    } catch (error) {
      console.error('❌ Admin login error:', error);
      return { success: false, error: 'Giriş hatası oluştu' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      setLoading(true); // Loading başlat
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setIsAdmin(false);
      setUser(null);
      setLoading(false); // Loading bitir
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setIsAdmin(false);
      setUser(null);
      setLoading(false); // Hata durumunda da loading bitir
    }
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