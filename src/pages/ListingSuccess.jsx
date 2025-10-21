// src/pages/ListingSuccess.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ListingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { listingId, secret } = location.state || {};

  useEffect(() => {
    // Eğer state yoksa ana sayfaya yönlendir
    if (!listingId || !secret) {
      navigate('/');
    }
  }, [listingId, secret, navigate]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Gizli anahtar panoya kopyalandı!');
  };

  if (!listingId || !secret) {
    return null; // useEffect yönlendirecek
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-lg">
            <div className="card-header bg-success text-white text-center">
              <h2 className="mb-0">✅ İlan Başarıyla Oluşturuldu!</h2>
            </div>

            <div className="card-body text-center">
              <div className="mb-4">
                <div className="text-success mb-3">
                  <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                  </svg>
                </div>
                <h4>İlanınız admin onayına gönderildi!</h4>
                <p className="text-muted">
                  İlanınız onaylandıktan sonra platformda görüntülenecektir.
                </p>
              </div>

              <div className="alert alert-warning">
                <h5 className="alert-heading">🔐 Gizli Anahtarınızı Kaydedin!</h5>
                <p className="mb-2">
                  İlanınızı yönetmek (güncellemek/silmek) için bu anahtara ihtiyacınız olacak.
                </p>
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg text-center font-monospace"
                    value={secret}
                    readOnly
                    style={{ fontSize: '0.9rem' }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => copyToClipboard(secret)}
                  >
                    📋 Kopyala
                  </button>
                </div>
                <small className="text-muted">
                  Bu anahtarı güvenli bir yerde saklayın ve kimseyle paylaşmayın!
                </small>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => navigate(`/ilan-yonetim/${listingId}?secret=${secret}`)}
                  >
                    📝 İlanı Yönet
                  </button>
                </div>
                <div className="col-6">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => navigate('/urunler')}
                  >
                    🛍️ Ürünlere Gözat
                  </button>
                </div>
                <div className="col-12">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => navigate('/')}
                  >
                    🏠 Ana Sayfaya Dön
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="text-muted">İlan Yönetimi Nasıl Yapılır?</h6>
                <ol className="text-start small">
                  <li>Gizli anahtarınızı güvenli bir yerde saklayın</li>
                  <li>İlanı yönetmek için bu sayfaya geri dönün</li>
                  <li>Gizli anahtar ile ilanınızı güncelleyebilir veya silebilirsiniz</li>
                  <li>Admin onayı sonrası ilanınız yayınlanır</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingSuccess;
