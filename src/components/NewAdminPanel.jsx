import React from 'react';
import { AdminProvider, useAdmin } from '../contexts/AdminContext';
import AdminLogin from './AdminLogin';
// Changed from NewListingManagement to NewAdminDashboard to include user approval functionality
import NewAdminDashboard from './NewAdminDashboard';

const NewAdminPanelContent = () => {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Yükleniyor...</p>
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

  // Use NewAdminDashboard instead of NewListingManagement to include user approval functionality
  return isAdmin ? <NewAdminDashboard /> : <AdminLogin />;
};

const NewAdminPanel = () => {
  return (
    <AdminProvider>
      <NewAdminPanelContent />
    </AdminProvider>
  );
};

export default NewAdminPanel;