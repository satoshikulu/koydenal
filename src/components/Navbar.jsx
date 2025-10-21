// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Ana sayfada mıyız kontrolü
  const isHomePage = location.pathname === '/';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          🌾 KöydenAL
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {/* Ana sayfa section linkleri - sadece ana sayfada göster */}
            {isHomePage ? (
              <>
                <li className="nav-item">
                  <a className="nav-link" href="#kategoriler">Kategoriler</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#nedenbiz">Neden Biz?</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#iletisim">İletişim</a>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">Ana Sayfa</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/#kategoriler">Kategoriler</Link>
                </li>
              </>
            )}

            {/* Diğer sayfa linkleri */}
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/urunler' ? 'active' : ''}`}
                to="/urunler"
              >
                Ürünler
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/ilan-ver' ? 'active' : ''}`}
                to="/ilan-ver"
              >
                İlan Ver
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/misafir-ilan-ver' ? 'active' : ''}`}
                to="/misafir-ilan-ver"
                style={{ backgroundColor: '#ffc107', color: '#000', borderRadius: '4px' }}
                title="Üye olmadan ilan ver"
              >
                🚀 Hızlı İlan Ver
              </Link>
            </li>

            {/* Auth bölümü */}
            {user ? (
              <>
                <li className="nav-item">
                  <span className="nav-link" style={{ color: '#ffc107' }}>
                    Merhaba, {user.email}
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm ms-2"
                    onClick={handleLogout}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Çıkış
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                    to="/login"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Giriş
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                    to="/register"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Kayıt
                  </Link>
                </li>
              </>
            )}

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/admin"
                style={{ fontSize: '0.85rem', opacity: 0.8 }}
                title="Admin Paneli"
              >
                ⚙️ Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
