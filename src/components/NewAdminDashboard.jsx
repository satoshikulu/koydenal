import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../contexts/AdminContext';

const NewAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('listings'); // listings, users
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const { isAdmin, logout } = useAdmin();

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'listings') {
        fetchListings();
      } else {
        fetchUsers();
      }
    }
  }, [isAdmin, activeTab, filter, searchTerm]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      // Use the appropriate view based on filter
      let query;
      if (filter === 'pending') {
        query = supabase.from('pending_listings').select('*');
      } else if (filter === 'approved') {
        query = supabase.from('approved_listings').select('*');
      } else if (filter === 'rejected') {
        query = supabase.from('rejected_listings').select('*');
      } else {
        // For 'all' or other cases, fetch from listings table
        query = supabase.from('listings').select(`
          *,
          user_profiles(full_name, email, phone),
          categories(name)
        `);
      }

      // Apply search filter for views
      if (searchTerm && (filter === 'pending' || filter === 'approved' || filter === 'rejected')) {
        query = query.or(`title.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%`);
      } else if (searchTerm) {
        // For direct listings table query
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Order by creation date
      if (filter === 'pending' || filter === 'approved' || filter === 'rejected') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

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
      
      // Use the appropriate view based on filter
      let query;
      if (filter === 'pending') {
        query = supabase.from('pending_users').select('*');
      } else if (filter === 'approved') {
        query = supabase.from('approved_users').select('*');
      } else if (filter === 'rejected') {
        query = supabase.from('rejected_users').select('*');
      } else {
        // For 'all' or other cases, fetch from user_profiles table
        query = supabase.from('user_profiles').select('*');
      }

      // Apply search filter
      if (searchTerm && (filter === 'pending' || filter === 'approved' || filter === 'rejected')) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      } else if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Order by creation date
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

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          listing_id: listingId,
          admin_id: user?.id,
          action: newStatus === 'approved' ? 'approved' : 'rejected',
          reason: reason
        });

      // Refresh the list
      fetchListings();
      setSelectedItem(null);
      
      // Show success message
      alert(`İlan başarıyla ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}!`);
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
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

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Refresh the list
      fetchUsers();
      setSelectedItem(null);
      
      // Show success message
      alert(`Kullanıcı başarıyla ${newStatus === 'approved' ? 'onaylandı' : 'reddedildi'}!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
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
      pending: { text: 'Beklemede', color: '#f39c12' },
      approved: { text: 'Onaylandı', color: '#27ae60' },
      rejected: { text: 'Reddedildi', color: '#e74c3c' }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        backgroundColor: badge.color,
        color: 'white',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {badge.text}
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          Admin Paneli
        </h1>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Çıkış Yap
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #ddd'
      }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'listings' ? '#3498db' : '#f8f9fa',
            color: activeTab === 'listings' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'listings' ? 'bold' : 'normal'
          }}
        >
          İlan Yönetimi
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'users' ? '#3498db' : '#f8f9fa',
            color: activeTab === 'users' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'users' ? 'bold' : 'normal'
          }}
        >
          Kullanıcı Onayları
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>
            Durum:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
            <option value="all">Tümü</option>
          </select>
        </div>

        <div>
          <input
            type="text"
            placeholder={activeTab === 'listings' ? "İlan ara..." : "Kullanıcı ara..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '250px'
            }}
          />
        </div>

        <button
          onClick={activeTab === 'listings' ? fetchListings : fetchUsers}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Ara
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'listings' ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Başlık
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Kullanıcı
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Kategori
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Fiyat
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Durum
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Tarih
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>
                      Yükleniyor...
                    </td>
                  </tr>
                ) : listings.length > 0 ? listings.map((listing) => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {listing.title}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#6c757d',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {listing.location || 'Lokasyon belirtilmemiş'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                          {listing.user_name || listing.user_profiles?.full_name || 'Bilinmiyor'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          {listing.user_email || listing.user_profiles?.email || 'Email yok'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {listing.category_name || listing.categories?.name || 'Kategorisiz'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {listing.price ? `${listing.price} ${listing.currency || 'TRY'}` : 'Fiyat Belirtilmemiş'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(listing.status || 'pending')}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                      {formatDate(listing.created_at)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedItem({ type: 'listing', data: listing })}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Detay
                        </button>
                        {(listing.status === 'pending' || !listing.status) && (
                          <>
                            <button
                              onClick={() => handleListingStatusChange(listing.id, 'approved')}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reddetme nedeni:');
                                if (reason !== null) handleListingStatusChange(listing.id, 'rejected', reason);
                              }}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Reddet
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                      {searchTerm || filter !== 'pending'
                        ? 'Arama kriterlerine uygun ilan bulunamadı.'
                        : 'Henüz bekleyen ilan yok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Users tab content
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Ad Soyad
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Email
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Telefon
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Rol
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Durum
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Tarih
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>
                      Yükleniyor...
                    </td>
                  </tr>
                ) : users.length > 0 ? users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>
                        {user.full_name || 'İsim belirtilmemiş'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.email || 'Email yok'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.phone || 'Telefon yok'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.role || 'user'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(user.status || 'pending')}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedItem({ type: 'user', data: user })}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Detay
                        </button>
                        {(user.status === 'pending' || !user.status) && (
                          <>
                            <button
                              onClick={() => handleUserStatusChange(user.id, 'approved')}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reddetme nedeni:');
                                if (reason !== null) handleUserStatusChange(user.id, 'rejected', reason);
                              }}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Reddet
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                      {searchTerm || filter !== 'pending'
                        ? 'Arama kriterlerine uygun kullanıcı bulunamadı.'
                        : 'Henüz bekleyen kullanıcı kaydı yok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0 }}>
                {selectedItem.type === 'listing' ? 'İlan Detayları' : 'Kullanıcı Detayları'}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ lineHeight: '1.6' }}>
              {selectedItem.type === 'listing' ? (
                <>
                  <p><strong>Başlık:</strong> {selectedItem.data.title}</p>
                  <p><strong>Açıklama:</strong> {selectedItem.data.description || 'Açıklama belirtilmemiş'}</p>
                  <p><strong>Fiyat:</strong> {selectedItem.data.price ? `${selectedItem.data.price} ${selectedItem.data.currency || 'TRY'}` : 'Fiyat Belirtilmemiş'}</p>
                  <p><strong>Lokasyon:</strong> {selectedItem.data.location || 'Lokasyon belirtilmemiş'}</p>
                  <p><strong>Kategori:</strong> {selectedItem.data.category_name || selectedItem.data.categories?.name || 'Kategorisiz'}</p>
                  <p><strong>Tür:</strong> {selectedItem.data.listing_type || 'ürün'}</p>
                  <p><strong>Oluşturulma:</strong> {formatDate(selectedItem.data.created_at)}</p>
                  <p><strong>Kullanıcı:</strong> {selectedItem.data.user_name || selectedItem.data.user_profiles?.full_name || 'Bilinmiyor'}</p>
                  <p><strong>Email:</strong> {selectedItem.data.user_email || selectedItem.data.user_profiles?.email || 'Email yok'}</p>
                  {selectedItem.data.rejection_reason && (
                    <p><strong>Reddetme Nedeni:</strong> {selectedItem.data.rejection_reason}</p>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Ad Soyad:</strong> {selectedItem.data.full_name || 'İsim belirtilmemiş'}</p>
                  <p><strong>Email:</strong> {selectedItem.data.email || 'Email yok'}</p>
                  <p><strong>Telefon:</strong> {selectedItem.data.phone || 'Telefon yok'}</p>
                  <p><strong>Adres:</strong> {selectedItem.data.address || 'Adres belirtilmemiş'}</p>
                  <p><strong>Rol:</strong> {selectedItem.data.role || 'user'}</p>
                  <p><strong>Durum:</strong> {getStatusBadge(selectedItem.data.status || 'pending')}</p>
                  <p><strong>Kayıt Tarihi:</strong> {formatDate(selectedItem.data.created_at)}</p>
                  {selectedItem.data.rejection_reason && (
                    <p><strong>Reddetme Nedeni:</strong> {selectedItem.data.rejection_reason}</p>
                  )}
                  {selectedItem.data.approved_by && (
                    <p><strong>Onaylayan:</strong> {selectedItem.data.approved_by}</p>
                  )}
                  {selectedItem.data.approved_at && (
                    <p><strong>Onay Tarihi:</strong> {formatDate(selectedItem.data.approved_at)}</p>
                  )}

                </>
              )}
            </div>

            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAdminDashboard;