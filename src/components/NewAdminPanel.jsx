import React, { useEffect, useState } from 'react';
import { AdminProvider, useAdmin } from '../contexts/AdminContext';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const NewAdminPanelContent = () => {
  const { isAdmin, loading } = useAdmin();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Loading başladığında timeout'u sıfırla
    setLoadingTimeout(false);
    
    // 10 saniye sonra timeout uyarısı göster
    const timeout = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
        console.warn('⚠️ Admin loading timeout - 10 saniye geçti');
        console.log('💡 Sayfayı yenilemeyi deneyin veya giriş bilgilerinizi kontrol edin');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
            Admin Paneli Yükleniyor...
          </h3>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Lütfen bekleyin, sistem kontrol ediliyor...
          </p>

          {loadingTimeout && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '1rem',
              color: '#856404',
              fontSize: '0.85rem'
            }}>
              <strong>⚠️ Yükleme zaman aşımı!</strong><br />
              Browser console'u (F12) kontrol edin.<br />
              Admin kullanıcısı mevcut olmayabilir.
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <AdminLogin />;
};

const NewAdminPanel = () => {
  return (
    <AdminProvider>
      <NewAdminPanelContent />
    </AdminProvider>
  );
};

export default NewAdminPanel;