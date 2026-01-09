// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProductDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListingDetail = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            categories(name),
            user_profiles(full_name, email, phone)
          `)
          .eq('id', id)
          .eq('status', 'approved')
          .single();

        if (error) {
          console.error('İlan detayı çekilirken hata:', error);
          setItem(null);
        } else {
          setItem(data);
        }
      } catch (error) {
        console.error('İlan detayı çekilirken hata:', error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListingDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">🌾 KöydenAL</a>
            <div className="ms-auto d-flex gap-2">
              <a className="btn btn-outline-light btn-sm" href="/">Ana Sayfa</a>
              <a className="btn btn-light btn-sm" href="/urunler">Ürünler</a>
            </div>
          </div>
        </nav>
        <main className="container py-4">
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">🌾 KöydenAL</a>
            <div className="ms-auto d-flex gap-2">
              <a className="btn btn-outline-light btn-sm" href="/">Ana Sayfa</a>
              <a className="btn btn-light btn-sm" href="/urunler">Ürünler</a>
            </div>
          </div>
        </nav>
        <main className="container py-4">
          <div className="alert alert-warning">İlan bulunamadı veya onaylanmamış.</div>
          <button className="btn btn-primary" onClick={() => navigate('/urunler')}>
            Ürünlere Dön
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">🌾 KöydenAL</a>
          <div className="ms-auto d-flex gap-2">
            <a className="btn btn-outline-light btn-sm" href="/">Ana Sayfa</a>
            <a className="btn btn-light btn-sm" href="/urunler">Ürünler</a>
            <a className="btn btn-success btn-sm" href="/ilan-ver">İlan Ver</a>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <div className="row g-4">
          <div className="col-12">
            {/* Image Gallery */}
            <div className="row g-2 mb-4">
              <div className="col-12">
                <img
                  src={item.main_image || item.images?.[0] || 'https://picsum.photos/400/300?random=1'}
                  alt={item.title}
                  className="cover shadow-sm rounded w-100"
                  style={{ height: '400px', objectFit: 'cover' }}
                />
              </div>
              {item.images && item.images.length > 1 && (
                item.images.slice(1).map((img, index) => (
                  <div key={index} className="col-6 col-md-3">
                    <img
                      src={img}
                      alt={`${item.title} ${index + 2}`}
                      className="img-fluid rounded shadow-sm"
                      style={{ height: '120px', objectFit: 'cover' }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="col-lg-8">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h1 className="h3 fw-bold mb-0">{item.title}</h1>
              <span className="badge bg-success-subtle text-success fs-6 px-3 py-2">
                {item.categories?.name || 'Kategorisiz'}
              </span>
            </div>

            <div className="text-muted mb-3">
              📍 {item.location} • 👤 {item.user_profiles?.full_name || 'Bilinmiyor'}
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <div className="h4 text-success fw-bold mb-1">
                      {item.price ? `${item.price} ${item.currency}` : 'Fiyat Sorunuz'}
                    </div>
                    {item.unit && <div className="text-muted">/ {item.unit}</div>}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card bg-light">
                  <div className="card-body text-center">
                    <div className="h4 text-primary fw-bold mb-1">
                      {item.quantity || 'Stok'} {item.unit}
                    </div>
                    <div className="text-muted">Mevcut Stok</div>
                  </div>
                </div>
              </div>
            </div>

            <h5 className="mb-3">Açıklama</h5>
            <p className="lead">{item.description}</p>

            <div className="mt-4">
              <h6>İlan Bilgileri</h6>
              <ul className="list-unstyled">
                <li><strong>Oluşturulma:</strong> {new Date(item.created_at).toLocaleDateString('tr-TR')}</li>
                <li><strong>Tür:</strong> {item.listing_type}</li>
                {item.contact_person && <li><strong>İletişim Kişisi:</strong> {item.contact_person}</li>}
              </ul>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">İletişim Bilgileri</h5>

                {item.contact_phone && (
                  <div className="mb-3">
                    <strong>📞 Telefon:</strong>
                    <div className="mt-1">
                      <a href={`tel:${item.contact_phone}`} className="btn btn-outline-primary btn-sm me-2">
                        Ara
                      </a>
                      <a href={`https://wa.me/9${item.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba, "${item.title}" ilanınızla ilgileniyorum.`)}`} className="btn btn-success btn-sm">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {item.contact_email && (
                  <div className="mb-3">
                    <strong>✉️ E-posta:</strong>
                    <div className="mt-1">
                      <a href={`mailto:${item.contact_email}?subject=${encodeURIComponent(`KöydenAL - ${item.title}`)}`} className="btn btn-outline-secondary btn-sm">
                        E-posta Gönder
                      </a>
                    </div>
                  </div>
                )}

                <div className="alert alert-info mt-3">
                  <small>
                    💡 Bu ilan admin tarafından onaylanmıştır ve güvenilir bir satıcı tarafından yayınlanmıştır.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetail;
