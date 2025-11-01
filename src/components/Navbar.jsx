//# src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Sprout, Zap, Settings } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef(null);
  const togglerRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Ana sayfada mıyız kontrolü
  const isHomePage = location.pathname === '/';

  const closeMobileMenu = (e) => {
    if (e && e.target) {
      const link = e.target.closest && e.target.closest('.nav-link');
      if (!link) return;
    }

    const nav = navRef.current;
    const toggler = togglerRef.current;
    if (!nav) return;

    if (window.bootstrap && window.bootstrap.Collapse) {
      const Collapse = window.bootstrap.Collapse;
      const instance = Collapse.getInstance(nav) || new Collapse(nav, { toggle: false });
      try {
        instance.hide();
      } catch {
        if (nav.classList.contains('show')) {
          nav.classList.remove('show');
          nav.setAttribute('aria-expanded', 'false');
          if (toggler) toggler.classList.add('collapsed');
        }
      }
      return;
    }

    if (nav.classList.contains('show')) {
      nav.classList.remove('show');
      nav.setAttribute('aria-expanded', 'false');
      if (toggler) toggler.classList.add('collapsed');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <Sprout className="me-2" size={24} />
          KöydenAL
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          ref={togglerRef}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav" ref={navRef} onClick={closeMobileMenu}>
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
                <Zap className="me-1" size={16} />
                Hızlı İlan Ver
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
                <Settings className="me-1" size={16} />
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
