import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../contexts/AdminContext';

const ListingManagement = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const { isAdmin, logout } = useAdmin();

  useEffect(() => {
    if (isAdmin) {
      fetchListings();
    }
  }, [isAdmin, filter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('listings')
        .select(`
          *,
          user_profiles(full_name, email, phone),
          categories(name)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (listingId, newStatus, reason = '') => {
    try {
      const updateData = {
        status: newStatus,
        approved_by: (await supabase.auth.getUser()).data.user?.id,
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
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: newStatus === 'approved' ? 'approved' : 'rejected',
          reason: reason
        });

      fetchListings(); // Refresh the list
      setSelectedListing(null);
    } catch (error) {
      console.error('Error updating listing status:', error);
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
          İlan Yönetimi
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
            <option value="all">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>
        </div>

        <div>
          <input
            type="text"
            placeholder="İlan ara..."
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
          onClick={fetchListings}
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

      {/* Listings Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Yükleniyor...
        </div>
      ) : (
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
                {listings.map((listing) => (
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
                          {listing.location}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                          {listing.user_profiles?.full_name || 'Bilinmiyor'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          {listing.user_profiles?.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {listing.categories?.name || 'Kategorisiz'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {listing.price ? `${listing.price} ${listing.currency}` : 'Fiyat Belirtilmemiş'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(listing.status)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                      {formatDate(listing.created_at)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedListing(listing)}
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
                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(listing.id, 'approved')}
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
                                if (reason) handleStatusChange(listing.id, 'rejected', reason);
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
                ))}
              </tbody>
            </table>
          </div>

          {listings.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6c757d'
            }}>
              {searchTerm || filter !== 'all'
                ? 'Arama kriterlerine uygun ilan bulunamadı.'
                : 'Henüz hiç ilan yok.'}
            </div>
          )}
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
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
              <h3 style={{ margin: 0 }}>İlan Detayları</h3>
              <button
                onClick={() => setSelectedListing(null)}
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
              <p><strong>Başlık:</strong> {selectedListing.title}</p>
              <p><strong>Açıklama:</strong> {selectedListing.description}</p>
              <p><strong>Fiyat:</strong> {selectedListing.price ? `${selectedListing.price} ${selectedListing.currency}` : 'Fiyat Belirtilmemiş'}</p>
              <p><strong>Lokasyon:</strong> {selectedListing.location}</p>
              <p><strong>Kategori:</strong> {selectedListing.categories?.name}</p>
              <p><strong>Tür:</strong> {selectedListing.listing_type}</p>
              <p><strong>Oluşturulma:</strong> {formatDate(selectedListing.created_at)}</p>
              {selectedListing.rejection_reason && (
                <p><strong>Reddetme Nedeni:</strong> {selectedListing.rejection_reason}</p>
              )}
            </div>

            <div style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setSelectedListing(null)}
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

export default ListingManagement;
