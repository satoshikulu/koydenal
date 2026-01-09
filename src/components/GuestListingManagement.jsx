// src/components/GuestListingManagement.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const GuestListingManagement = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // URL'den gizli anahtarı al (güvenlik için önerilmez, demo için)
    const urlParams = new URLSearchParams(window.location.search);
    const secretFromUrl = urlParams.get('secret');

    if (secretFromUrl) {
      setSecret(secretFromUrl);
      checkListingAccess(listingId, secretFromUrl);
    } else {
      setLoading(false);
      setError('Gizli anahtar gerekli!');
    }
  }, [listingId]);

  const checkListingAccess = async (listingId, secret) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories (name, icon)
        `)
        .eq('id', listingId)
        .eq('listing_secret', secret)
        .single();

      if (error) {
        setError('Geçersiz erişim veya ilan bulunamadı!');
        return;
      }

      setListing(data);
    } catch (err) {
      console.error('Erişim kontrolü hatası:', err);
      setError('Erişim kontrolü sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateListing = async (updates) => {
    try {
      const { data, error } = await supabase.rpc('update_listing_with_secret', {
        listing_id: listingId,
        listing_secret: secret,
        title_param: updates.title,
        description_param: updates.description,
        price_param: updates.price,
        quantity_param: updates.quantity,
        contact_phone_param: updates.phone,
        contact_email_param: updates.email,
        contact_person_param: updates.sellerName
      });

      if (error) throw error;

      if (data) {
        alert('İlan başarıyla güncellendi!');
        window.location.reload();
      } else {
        alert('Güncelleme başarısız! Gizli anahtar yanlış olabilir.');
      }
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      alert('Güncelleme sırasında hata oluştu!');
    }
  };

  const handleDeleteListing = async () => {
    if (!confirm('İlanı silmek istediğinizden emin misiniz?')) return;

    try {
      const { data, error } = await supabase.rpc('delete_listing_with_secret', {
        listing_id: listingId,
        listing_secret: secret
      });

      if (error) throw error;

      if (data) {
        alert('İlan başarıyla silindi!');
        navigate('/');
      } else {
        alert('Silme başarısız! Gizli anahtar yanlış olabilir.');
      }
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Silme sırasında hata oluştu!');
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-2">İlan bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <h4>Erişim Hatası</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <p>İlan bulunamadı veya erişim izniniz yok.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">📝 İlan Yönetimi</h3>
              <small>Gizli anahtar ile erişim</small>
            </div>

            <div className="card-body">
              <div className="alert alert-info">
                <strong>İlan ID:</strong> {listing.id}
                <br />
                <strong>Durum:</strong>
                <span className={`badge ms-2 ${
                  listing.status === 'approved' ? 'bg-success' :
                  listing.status === 'pending' ? 'bg-warning' :
                  listing.status === 'rejected' ? 'bg-danger' :
                  'bg-secondary'
                }`}>
                  {listing.status === 'approved' ? '✅ Onaylandı' :
                   listing.status === 'pending' ? '⏳ Bekliyor' :
                   listing.status === 'rejected' ? '❌ Reddedildi' :
                   '⚫ Pasif'}
                </span>
              </div>

              {listing.status === 'rejected' && listing.rejection_reason && (
                <div className="alert alert-danger">
                  <strong>Red Nedeni:</strong> {listing.rejection_reason}
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">İlan Başlığı</label>
                  <p className="form-control-plaintext">{listing.title}</p>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Fiyat</label>
                  <p className="form-control-plaintext">
                    {listing.price} ₺ / {listing.unit}
                  </p>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Miktar</label>
                  <p className="form-control-plaintext">
                    {listing.quantity} {listing.unit}
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Kategori</label>
                  <p className="form-control-plaintext">
                    {listing.categories?.icon} {listing.categories?.name}
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Lokasyon</label>
                  <p className="form-control-plaintext">{listing.location}</p>
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Açıklama</label>
                  <p className="form-control-plaintext border p-2 rounded">
                    {listing.description}
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">İletişim Kişisi</label>
                  <p className="form-control-plaintext">{listing.contact_person}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Telefon</label>
                  <p className="form-control-plaintext">{listing.contact_phone}</p>
                </div>

                {listing.contact_email && (
                  <div className="col-md-6">
                    <label className="form-label fw-bold">E-posta</label>
                    <p className="form-control-plaintext">{listing.contact_email}</p>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label fw-bold">Tercih Edilen İletişim</label>
                  <p className="form-control-plaintext">
                    {listing.preferred_contact === 'telefon' ? '📞 Telefon' :
                     listing.preferred_contact === 'whatsapp' ? '💬 WhatsApp' :
                     '📧 E-posta'}
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Oluşturulma Tarihi</label>
                  <p className="form-control-plaintext">
                    {new Date(listing.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Son Güncelleme</label>
                  <p className="form-control-plaintext">
                    {new Date(listing.updated_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                {listing.expires_at && (
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Son Geçerlilik Tarihi</label>
                    <p className="form-control-plaintext">
                      {new Date(listing.expires_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label fw-bold">Görüntülenme Sayısı</label>
                  <p className="form-control-plaintext">👁️ {listing.view_count}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">İletişim Sayısı</label>
                  <p className="form-control-plaintext">📞 {listing.contact_count}</p>
                </div>
              </div>

              <div className="alert alert-warning">
                <strong>⚠️ Gizli Anahtar:</strong> {secret.substring(0, 8)}...
                <br />
                <small>Bu anahtarı güvenli bir yerde saklayın. İlanınızı yönetmek için gereklidir.</small>
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate(`/ilan-duzenle/${listingId}?secret=${secret}`)}
                >
                  ✏️ İlanı Düzenle
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={handleDeleteListing}
                >
                  🗑️ İlanı Sil
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/')}
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestListingManagement;
