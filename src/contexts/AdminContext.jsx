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
        
        // Önce session'ı kontrol et
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('📥 getSession response:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          error: sessionError 
        });

        if (!mounted) return;

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setIsAdmin(false);
          setUser(null);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log('👤 No active session');
          setIsAdmin(false);
          setUser(null);
          setLoading(false);
          return;
        }

        const user = session.user;

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

          // İzin verilen durumlar array'i
          const allowedStatuses = ['approved', 'active'];
          const isAdminResult = profile?.role === 'admin' && allowedStatuses.includes(profile?.status);
          
          console.log('👤 Admin check:', {
            userId: user.id,
            role: profile?.role,
            status: profile?.status,
            isAdmin: isAdminResult
          });

          // Store the actual admin status
          setIsAdmin(isAdminResult);
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
        console.log('🔐 Auth state changed:', event);

        if (!mounted) return;

        // Sadece önemli event'lerde işlem yap
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔄 User signed in, checking admin status...');
          await checkAdminStatus();
        } else if (event === 'SIGNED_OUT') {
          console.log('👤 User signed out');
          setIsAdmin(false);
          setUser(null);
          setLoading(false);
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

      // İzin verilen durumlar array'i
      const allowedStatuses = ['approved', 'active'];
      if (!allowedStatuses.includes(profile.status)) {
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