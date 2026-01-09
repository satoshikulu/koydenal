import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminApprovalDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingData();
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('pending_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPendingUsers(data || []);
        console.log('Fetched pending users:', data?.length || 0);
      } else {
        const { data, error } = await supabase
          .from('pending_listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPendingListings(data || []);
        console.log('Fetched pending listings:', data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching pending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    setProcessingId(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      console.log('User approved successfully:', userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      alert('✅ Kullanıcı başarıyla onaylandı!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('❌ Kullanıcı onaylanırken hata oluştu: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const approveListing = async (listingId) => {
    setProcessingId(listingId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('listings')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (error) throw error;

      console.log('Listing approved successfully:', listingId);
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      alert('✅ İlan başarıyla onaylandı!');
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('❌ İlan onaylanırken hata oluştu: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Yükleniyor...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>🔒</div>
        <h2 style={styles.errorTitle}>Erişim Engellendi</h2>
        <p style={styles.errorText}>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>👨‍💼</span>
          Admin Onay Paneli
        </h1>
        <p style={styles.subtitle}>Bekleyen kullanıcıları ve ilanları onaylayın</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tab,
            ...(activeTab === 'users' ? styles.tabActive : {})
          }}
        >
          <span style={styles.tabIcon}>👥</span>
          Bekleyen Kullanıcılar
          {pendingUsers.length > 0 && (
            <span style={styles.badge}>{pendingUsers.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            ...styles.tab,
            ...(activeTab === 'listings' ? styles.tabActive : {})
          }}
        >
          <span style={styles.tabIcon}>📋</span>
          Bekleyen İlanlar
          {pendingListings.length > 0 && (
            <span style={styles.badge}>{pendingListings.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'users' ? (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Bekleyen Kullanıcılar ({pendingUsers.length})
            </h2>
            
            {pendingUsers.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✅</div>
                <p style={styles.emptyText}>Bekleyen kullanıcı yok</p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Ad Soyad</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Telefon</th>
                      <th style={styles.th}>Kayıt Tarihi</th>
                      <th style={styles.th}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user, index) => (
                      <tr 
                        key={user.id} 
                        style={{
                          ...styles.tableRow,
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }}
                      >
                        <td style={styles.td}>
                          <div style={styles.userName}>{user.full_name}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.userEmail}>{user.email}</div>
                        </td>
                        <td style={styles.td}>{user.phone || '-'}</td>
                        <td style={styles.td}>
                          <div style={styles.date}>{formatDate(user.created_at)}</div>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => approveUser(user.id)}
                            disabled={processingId === user.id}
                            style={{
                              ...styles.approveButton,
                              ...(processingId === user.id ? styles.buttonDisabled : {})
                            }}
                          >
                            {processingId === user.id ? '⏳ İşleniyor...' : '✅ Onayla'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Bekleyen İlanlar ({pendingListings.length})
            </h2>
            
            {pendingListings.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✅</div>
                <p style={styles.emptyText}>Bekleyen ilan yok</p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Başlık</th>
                      <th style={styles.th}>Kategori</th>
                      <th style={styles.th}>Kullanıcı</th>
                      <th style={styles.th}>Fiyat</th>
                      <th style={styles.th}>Oluşturulma</th>
                      <th style={styles.th}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingListings.map((listing, index) => (
                      <tr 
                        key={listing.id}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }}
                      >
                        <td style={styles.td}>
                          <div style={styles.listingTitle}>{listing.title}</div>
                          <div style={styles.listingLocation}>📍 {listing.location}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.category}>
                            {listing.category_icon} {listing.category_name}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.userName}>{listing.user_name || 'Misafir'}</div>
                          <div style={styles.userEmail}>{listing.user_email || '-'}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.price}>
                            {listing.price} {listing.currency || 'TRY'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.date}>{formatDate(listing.created_at)}</div>
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => approveListing(listing.id)}
                            disabled={processingId === listing.id}
                            style={{
                              ...styles.approveButton,
                              ...(processingId === listing.id ? styles.buttonDisabled : {})
                            }}
                          >
                            {processingId === listing.id ? '⏳ İşleniyor...' : '✅ Onayla'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem 1rem',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(255, 255, 255, 0.3)',
    borderTop: '5px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'white',
    marginTop: '1rem',
    fontSize: '1.1rem',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
  },
  errorIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
  },
  errorTitle: {
    color: 'white',
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.1rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    color: 'white',
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  titleIcon: {
    fontSize: '2.5rem',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.1rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    minWidth: '200px',
    padding: '1rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    position: 'relative',
  },
  tabActive: {
    background: 'white',
    color: '#667eea',
    borderColor: 'white',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
  },
  tabIcon: {
    fontSize: '1.3rem',
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ff4757',
    color: 'white',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(255, 71, 87, 0.4)',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '1.5rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    transition: 'all 0.2s ease',
    borderBottom: '1px solid #e0e0e0',
  },
  td: {
    padding: '1rem',
    fontSize: '0.95rem',
  },
  userName: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.2rem',
  },
  userEmail: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
  },
  listingTitle: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.3rem',
  },
  listingLocation: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
  },
  category: {
    display: 'inline-block',
    padding: '0.4rem 0.8rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  price: {
    fontWeight: '700',
    color: '#27ae60',
    fontSize: '1rem',
  },
  date: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
  },
  approveButton: {
    padding: '0.6rem 1.2rem',
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)',
  },
  buttonDisabled: {
    background: '#95a5a6',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};

// CSS Animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  table tbody tr:hover {
    background-color: #f0f4ff !important;
    transform: scale(1.01);
  }
  
  button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4) !important;
  }
  
  @media (max-width: 768px) {
    table {
      font-size: 0.85rem;
    }
    th, td {
      padding: 0.7rem !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AdminApprovalDashboard;
