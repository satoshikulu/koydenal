import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../contexts/AdminContext';

const NewAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingListings: 0,
    totalUsers: 0,
    pendingUsers: 0
  });
  const { isAdmin, logout } = useAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      if (activeTab === 'listings') {
        fetchListings();
      } else {
        fetchUsers();
      }
    }
  }, [isAdmin, activeTab, filter, searchTerm]);

  const fetchStats = async () => {
    try {
      const [listingsRes, usersRes] = await Promise.all([
        supabase.from('listings').select('status', { count: 'exact' }),
        supabase.from('user_profiles').select('status', { count: 'exact' })
      ]);

      const pendingListings = listingsRes.data?.filter(l => l.status === 'pending').length || 0;
      const pendingUsers = usersRes.data?.filter(u => u.status === 'pending').length || 0;

      setStats({
        totalListings: listingsRes.count || 0,
        pendingListings,
        totalUsers: usersRes.count || 0,
        pendingUsers
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      let query;
      
      if (filter === 'pending') {
        query = supabase.from('pending_listings').select('*');
      } else if (filter === 'approved') {
        query = supabase.from('approved_listings').select('*');
      } else if (filter === 'rejected') {
        query = supabase.from('rejected_listings').select('*');
      } else {
        query = supabase.from('listings').select(`*, user_profiles(full_name, email, phone), categories(name)`);
      }

      if (searchTerm && (filter === 'pending' || filter === 'approved' || filter === 'rejected')) {
        query = query.or(`title.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%`);
      } else if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query;
      
      if (filter === 'pending') {
        query = supabase.from('pending_users').select('*');
      } else if (filter === 'approved') {
        query = supabase.from('approved_users').select('*');
      } else if (filter === 'rejected') {
        query = supabase.from('rejected_users').select('*');
      } else {
        query = supabase.from('user_profiles').select('*');
      }

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleListingStatusChange = async (listingId, newStatus, reason = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = {
        status: newStatus,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      };

      if (newStatus === 'rejected') {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase.from('listings').update(updateData).eq('id', listingId);
      if (error) throw error;

      await supabase.from('admin_actions').insert({
        listing_id: listingId,
        admin_id: user?.id,
        action: newStatus === 'approved' ? 'approved' : 'rejected',
        reason: reason
      });

      fetchListings();
      fetchStats();
      setSelectedItem(null);
      alert(`✅ İlan başarıyla ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}!`);
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('❌ İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleUserStatusChange = async (userId, newStatus, reason = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = {
        status: newStatus,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      };

      if (newStatus === 'rejected') {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase.from('user_profiles').update(updateData).eq('id', userId);
      if (error) throw error;

      fetchUsers();
      fetchStats();
      setSelectedItem(null);
      alert(`✅ Kullanıcı başarıyla ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('❌ İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Beklemede', color: '#f39c12', icon: '⏳' },
      approved: { text: 'Onaylandı', color: '#27ae60', icon: '✅' },
      rejected: { text: 'Reddedildi', color: '#e74c3c', icon: '❌' }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        background: `linear-gradient(135deg, ${badge.color} 0%, ${badge.color}dd 100%)`,
        color: 'white',
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        boxShadow: `0 2px 8px ${badge.color}40`
      }}>
        <span>{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <span style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}>🔒</span>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Erişim Engellendi</h2>
          <p style={{ color: '#7f8c8d' }}>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              color: 'white',
              margin: 0,
              fontSize: '2rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>👨‍💼</span>
              Admin Paneli
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
              Hoş geldiniz! Sistemi buradan yönetebilirsiniz.
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '0.8rem 1.5rem',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span>🚪</span>
            Çıkış Yap
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                {stats.totalListings}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Toplam İlan</div>
            </div>
            <div style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              fontSize: '6rem',
              opacity: 0.1
            }}>📋</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 30px rgba(240, 147, 251, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                {stats.pendingListings}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Bekleyen İlan</div>
            </div>
            <div style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              fontSize: '6rem',
              opacity: 0.1
            }}>⏳</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 30px rgba(79, 172, 254, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Toplam Kullanıcı</div>
            </div>
            <div style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              fontSize: '6rem',
              opacity: 0.1
            }}>👥</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 8px 30px rgba(250, 112, 154, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏰</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                {stats.pendingUsers}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Bekleyen Kullanıcı</div>
            </div>
            <div style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              fontSize: '6rem',
              opacity: 0.1
            }}>⏰</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1rem 1.5rem',
              background: activeTab === 'listings' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: activeTab === 'listings' ? 'white' : '#7f8c8d',
              border: activeTab === 'listings' ? 'none' : '2px solid #e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: activeTab === 'listings' ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'listings') {
                e.target.style.borderColor = '#667eea';
                e.target.style.color = '#667eea';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'listings') {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.color = '#7f8c8d';
              }
            }}
          >
            <span>📋</span>
            İlan Yönetimi
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '1rem 1.5rem',
              background: activeTab === 'users' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: activeTab === 'users' ? 'white' : '#7f8c8d',
              border: activeTab === 'users' ? 'none' : '2px solid #e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: activeTab === 'users' ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'users') {
                e.target.style.borderColor = '#667eea';
                e.target.style.color = '#667eea';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'users') {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.color = '#7f8c8d';
              }
            }}
          >
            <span>👥</span>
            Kullanıcı Onayları
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2c3e50',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              Durum Filtresi
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            >
              <option value="pending">⏳ Beklemede</option>
              <option value="approved">✅ Onaylandı</option>
              <option value="rejected">❌ Reddedildi</option>
              <option value="all">📊 Tümü</option>
            </select>
          </div>

          <div style={{ flex: 2, minWidth: '300px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2c3e50',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              Arama
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem'
              }}>🔍</span>
              <input
                type="text"
                placeholder={activeTab === 'listings' ? "İlan ara..." : "Kullanıcı ara..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 3rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </div>

          <button
            onClick={activeTab === 'listings' ? fetchListings : fetchUsers}
            style={{
              padding: '0.8rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            <span>🔄</span>
            Yenile
          </button>
        </div>

        {/* Content */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{
              padding: '4rem',
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
              }} />
              <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Yükleniyor...</p>
            </div>
          ) : activeTab === 'listings' ? (
            <div style={{ overflowX: 'auto' }}>
              {listings.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Başlık</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Kullanıcı</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Kategori</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Fiyat</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Durum</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Tarih</th>
                      <th style={{ padding: '1.2rem', textAlign: 'center', fontWeight: '700', color: '#2c3e50' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing, index) => (
                      <tr key={listing.id} style={{
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'all 0.3s ease',
                        background: index % 2 === 0 ? 'white' : '#fafafa'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa'}
                      >
                        <td style={{ padding: '1.2rem' }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '0.3rem' }}>
                            {listing.title}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#95a5a6' }}>
                            📍 {listing.location || 'Lokasyon belirtilmemiş'}
                          </div>
                        </td>
                        <td style={{ padding: '1.2rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#2c3e50' }}>
                            {listing.user_name || listing.user_profiles?.full_name || 'Bilinmiyor'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
                            {listing.user_email || listing.user_profiles?.email || 'Email yok'}
                          </div>
                        </td>
                        <td style={{ padding: '1.2rem', color: '#7f8c8d' }}>
                          {listing.category_name || listing.categories?.name || 'Kategorisiz'}
                        </td>
                        <td style={{ padding: '1.2rem', fontWeight: '600', color: '#27ae60' }}>
                          {listing.price ? `${listing.price} ${listing.currency || 'TRY'}` : 'Belirtilmemiş'}
                        </td>
                        <td style={{ padding: '1.2rem' }}>
                          {getStatusBadge(listing.status || 'pending')}
                        </td>
                        <td style={{ padding: '1.2rem', fontSize: '0.85rem', color: '#95a5a6' }}>
                          {formatDate(listing.created_at)}
                        </td>
                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedItem({ type: 'listing', data: listing })}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)'
                              }}
                              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              👁️ Detay
                            </button>
                            {(listing.status === 'pending' || !listing.status) && (
                              <>
                                <button
                                  onClick={() => handleListingStatusChange(listing.id, 'approved')}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(17, 153, 142, 0.3)'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ✅ Onayla
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reddetme nedeni:');
                                    if (reason !== null) handleListingStatusChange(listing.id, 'rejected', reason);
                                  }}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(235, 51, 73, 0.3)'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ❌ Reddet
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>İlan Bulunamadı</h3>
                  <p style={{ color: '#7f8c8d' }}>
                    {searchTerm || filter !== 'pending'
                      ? 'Arama kriterlerine uygun ilan bulunamadı.'
                      : 'Henüz bekleyen ilan yok.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {users.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Ad Soyad</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Email</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Telefon</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Rol</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Durum</th>
                      <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700', color: '#2c3e50' }}>Tarih</th>
                      <th style={{ padding: '1.2rem', textAlign: 'center', fontWeight: '700', color: '#2c3e50' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id} style={{
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'all 0.3s ease',
                        background: index % 2 === 0 ? 'white' : '#fafafa'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa'}
                      >
                        <td style={{ padding: '1.2rem', fontWeight: '600', color: '#2c3e50' }}>
                          {user.full_name || 'İsim belirtilmemiş'}
                        </td>
                        <td style={{ padding: '1.2rem', color: '#7f8c8d' }}>
                          {user.email || 'Email yok'}
                        </td>
                        <td style={{ padding: '1.2rem', color: '#7f8c8d' }}>
                          {user.phone || 'Telefon yok'}
                        </td>
                        <td style={{ padding: '1.2rem' }}>
                          <span style={{
                            background: user.role === 'admin' 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '15px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td style={{ padding: '1.2rem' }}>
                          {getStatusBadge(user.status || 'pending')}
                        </td>
                        <td style={{ padding: '1.2rem', fontSize: '0.85rem', color: '#95a5a6' }}>
                          {formatDate(user.created_at)}
                        </td>
                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedItem({ type: 'user', data: user })}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(79, 172, 254, 0.3)'
                              }}
                              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              👁️ Detay
                            </button>
                            {(user.status === 'pending' || !user.status) && (
                              <>
                                <button
                                  onClick={() => handleUserStatusChange(user.id, 'approved')}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(17, 153, 142, 0.3)'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ✅ Onayla
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reddetme nedeni:');
                                    if (reason !== null) handleUserStatusChange(user.id, 'rejected', reason);
                                  }}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(235, 51, 73, 0.3)'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                  ❌ Reddet
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                  <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Kullanıcı Bulunamadı</h3>
                  <p style={{ color: '#7f8c8d' }}>
                    {searchTerm || filter !== 'pending'
                      ? 'Arama kriterlerine uygun kullanıcı bulunamadı.'
                      : 'Henüz bekleyen kullanıcı kaydı yok.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedItem && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#2c3e50',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>{selectedItem.type === 'listing' ? '📋' : '👤'}</span>
                  {selectedItem.type === 'listing' ? 'İlan Detayları' : 'Kullanıcı Detayları'}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    color: '#95a5a6',
                    transition: 'all 0.3s ease',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f0f0f0';
                    e.target.style.color = '#2c3e50';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#95a5a6';
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ lineHeight: '1.8' }}>
                {selectedItem.type === 'listing' ? (
                  <>
                    <DetailRow label="Başlık" value={selectedItem.data.title} icon="📝" />
                    <DetailRow label="Açıklama" value={selectedItem.data.description || 'Açıklama belirtilmemiş'} icon="📄" />
                    <DetailRow label="Fiyat" value={selectedItem.data.price ? `${selectedItem.data.price} ${selectedItem.data.currency || 'TRY'}` : 'Fiyat Belirtilmemiş'} icon="💰" />
                    <DetailRow label="Lokasyon" value={selectedItem.data.location || 'Lokasyon belirtilmemiş'} icon="📍" />
                    <DetailRow label="Kategori" value={selectedItem.data.category_name || selectedItem.data.categories?.name || 'Kategorisiz'} icon="🏷️" />
                    <DetailRow label="Tür" value={selectedItem.data.listing_type || 'ürün'} icon="📦" />
                    <DetailRow label="Oluşturulma" value={formatDate(selectedItem.data.created_at)} icon="📅" />
                    <DetailRow label="Kullanıcı" value={selectedItem.data.user_name || selectedItem.data.user_profiles?.full_name || 'Bilinmiyor'} icon="👤" />
                    <DetailRow label="Email" value={selectedItem.data.user_email || selectedItem.data.user_profiles?.email || 'Email yok'} icon="📧" />
                    {selectedItem.data.rejection_reason && (
                      <DetailRow label="Reddetme Nedeni" value={selectedItem.data.rejection_reason} icon="⚠️" highlight />
                    )}
                  </>
                ) : (
                  <>
                    <DetailRow label="Ad Soyad" value={selectedItem.data.full_name || 'İsim belirtilmemiş'} icon="👤" />
                    <DetailRow label="Email" value={selectedItem.data.email || 'Email yok'} icon="📧" />
                    <DetailRow label="Telefon" value={selectedItem.data.phone || 'Telefon yok'} icon="📱" />
                    <DetailRow label="Adres" value={selectedItem.data.address || 'Adres belirtilmemiş'} icon="📍" />
                    <DetailRow label="Rol" value={selectedItem.data.role || 'user'} icon="🎭" />
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontWeight: '600', color: '#7f8c8d', marginRight: '0.5rem' }}>
                        ⚡ Durum:
                      </span>
                      {getStatusBadge(selectedItem.data.status || 'pending')}
                    </div>
                    <DetailRow label="Kayıt Tarihi" value={formatDate(selectedItem.data.created_at)} icon="📅" />
                    {selectedItem.data.rejection_reason && (
                      <DetailRow label="Reddetme Nedeni" value={selectedItem.data.rejection_reason} icon="⚠️" highlight />
                    )}
                    {selectedItem.data.approved_at && (
                      <DetailRow label="Onay Tarihi" value={formatDate(selectedItem.data.approved_at)} icon="✅" />
                    )}
                  </>
                )}
              </div>

              <div style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: '0.8rem 2rem',
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(149, 165, 166, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(149, 165, 166, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(149, 165, 166, 0.3)';
                  }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const DetailRow = ({ label, value, icon, highlight }) => (
  <div style={{
    marginBottom: '1rem',
    padding: '0.8rem',
    background: highlight ? 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)' : '#f8f9fa',
    borderRadius: '10px',
    borderLeft: highlight ? '4px solid #e74c3c' : '4px solid #667eea'
  }}>
    <div style={{
      fontWeight: '600',
      color: '#7f8c8d',
      fontSize: '0.85rem',
      marginBottom: '0.3rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span>{icon}</span>
      {label}
    </div>
    <div style={{
      color: highlight ? '#e74c3c' : '#2c3e50',
      fontSize: '0.95rem',
      fontWeight: highlight ? '600' : '500'
    }}>
      {value}
    </div>
  </div>
);

export default NewAdminDashboard;
