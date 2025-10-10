// src/pages/ProductDetail.jsx
import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';

const ProductDetail = () => {
  const { id } = useParams();
  const { demoItems } = useData();

  const item = demoItems.find(item => item.id === parseInt(id));

  if (!item) {
    return (
      <>
        <nav className="navbar navbar-expand-lg navbar-dark">
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">🌾 KöydenDirekt</a>
            <div className="ms-auto d-flex gap-2">
              <a className="btn btn-outline-light btn-sm" href="/">Ana Sayfa</a>
              <a className="btn btn-light btn-sm" href="/urunler">Ürünler</a>
            </div>
          </div>
        </nav>
        <main className="container py-4">
          <div className="alert alert-warning">İlan bulunamadı.</div>
        </main>
      </>
    );
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">🌾 KöydenDirekt</a>
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
            <img
              src={item.img}
              alt={item.title}
              className="cover shadow-sm rounded"
              style={{ width: '100%', height: '360px', objectFit: 'cover' }}
            />
          </div>
          <div className="col-lg-8">
            <h1 className="h3 fw-bold mb-2">{item.title}</h1>
            <div className="text-muted mb-3">
              {item.region} • {item.mahalle} • <span className="badge bg-success-subtle text-success">{item.cat}</span>
            </div>
            <p>{item.desc}</p>
          </div>
          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="h4 text-success fw-bold">
                  {item.price} <small className="text-muted">/{item.unit}</small>
                </div>
                <div className="d-grid gap-2 mt-3">
                  <button
                    className="btn btn-success"
                    onClick={() => window.open(`mailto:satici@example.com?subject=${encodeURIComponent('KöydenDirekt - ' + item.title)}`)}
                  >
                    E-posta ile İletişim
                  </button>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => window.open(`https://wa.me/905000000000?text=${encodeURIComponent('Merhaba, ilanınızla ilgileniyorum: ' + item.title)}`)}
                  >
                    WhatsApp
                  </button>
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
