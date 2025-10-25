//# src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Sprout, Zap, Settings } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
      document.body.classList.remove('mobile-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && !e.target.closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  // Ana sayfada mıyız kontrolü
  const isHomePage = location.pathname === '/';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <Sprout className="me-2" size={24} />
          KöydenAL
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          style={{
            border: 'none',
            background: 'none',
            padding: '0.5rem',
            borderRadius: '4px',
            transition: 'all 0.3s ease'
          }}
        >
          <span
            className="navbar-toggler-icon"
            style={{
              transition: 'all 0.3s ease',
              transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'
            }}
          ></span>
        </button>

        {/* Mobile Menu Overlay */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <div
              className={`mobile-menu-backdrop ${isMenuOpen ? 'show' : ''}`}
              onClick={closeMenu}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1040,
                opacity: isMenuOpen ? 1 : 0,
                visibility: isMenuOpen ? 'visible' : 'hidden',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(2px)'
              }}
            />

            {/* Mobile Menu */}
            <div
              className={`mobile-menu-container ${isMenuOpen ? 'show' : ''}`}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '280px',
                height: '100vh',
                backgroundColor: 'white',
                zIndex: 1050,
                transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isMenuOpen ? '-10px 0 30px rgba(0,0,0,0.1)' : 'none',
                overflowY: 'auto',
                padding: '1rem 0'
              }}
            >
              {/* Close button */}
              <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid #eee' }}>
                <button
                  onClick={closeMenu}
                  style={{
                    background: 'none',
                    border: 'none',
                    float: 'right',
                    fontSize: '1.5rem',
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = '#495057';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6c757d';
                  }}
                >
                  ×
                </button>
                <div style={{ clear: 'both' }}></div>
              </div>

              {/* Menu Items */}
              <ul className="navbar-nav" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {/* Ana sayfa section linkleri - sadece ana sayfada göster */}
                {isHomePage ? (
                  <>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <a
                        className="nav-link"
                        href="#kategoriler"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        Kategoriler
                      </a>
                    </li>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <a
                        className="nav-link"
                        href="#nedenbiz"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        Neden Biz?
                      </a>
                    </li>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <a
                        className="nav-link"
                        href="#iletisim"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        İletişim
                      </a>
                    </li>
                  </>
                ) : (
                  <>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <Link
                        className="nav-link"
                        to="/"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        Ana Sayfa
                      </Link>
                    </li>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <Link
                        className="nav-link"
                        to="/#kategoriler"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        Kategoriler
                      </Link>
                    </li>
                  </>
                )}

                {/* Diğer sayfa linkleri */}
                <li style={{ margin: '0.5rem 1rem' }}>
                  <Link
                    className={`nav-link ${location.pathname === '/urunler' ? 'active' : ''}`}
                    to="/urunler"
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      color: location.pathname === '/urunler' ? '#0d6efd' : '#495057',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    Ürünler
                  </Link>
                </li>
                <li style={{ margin: '0.5rem 1rem' }}>
                  <Link
                    className={`nav-link ${location.pathname === '/ilan-ver' ? 'active' : ''}`}
                    to="/ilan-ver"
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      color: location.pathname === '/ilan-ver' ? '#0d6efd' : '#495057',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    İlan Ver
                  </Link>
                </li>
                <li style={{ margin: '0.5rem 1rem' }}>
                  <Link
                    className={`nav-link ${location.pathname === '/misafir-ilan-ver' ? 'active' : ''}`}
                    to="/misafir-ilan-ver"
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      backgroundColor: location.pathname === '/misafir-ilan-ver' ? '#ffc107' : '#ffc107',
                      color: '#000',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateX(5px) scale(1.02)';
                      e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateX(0) scale(1)';
                      e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
                    }}
                    title="Üye olmadan ilan ver"
                  >
                    🚀 Hızlı İlan Ver
                  </Link>
                </li>

                {/* Auth bölümü */}
                {user ? (
                  <>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <span
                        className="nav-link"
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: '#ffc107',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        Merhaba, {user.email}
                      </span>
                    </li>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Çıkış
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <Link
                        className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                        to="/login"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: location.pathname === '/login' ? '#0d6efd' : '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        Giriş
                      </Link>
                    </li>
                    <li style={{ margin: '0.5rem 1rem' }}>
                      <Link
                        className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                        to="/register"
                        onClick={closeMenu}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: location.pathname === '/register' ? '#0d6efd' : '#495057',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f8f9fa';
                          e.target.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.transform = 'translateX(0)';
                        }}
                      >
                        Kayıt
                      </Link>
                    </li>
                  </>
                )}

                <li style={{ margin: '0.5rem 1rem' }}>
                  <Link
                    className="nav-link"
                    to="/admin"
                    onClick={closeMenu}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      color: '#6c757d',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.transform = 'translateX(5px)';
                      e.target.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateX(0)';
                      e.target.style.opacity = '0.8';
                    }}
                    title="Admin Paneli"
                  >
                    ⚙️ Admin
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Desktop Menu */}
        {!isMobile && (
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
        )}
      </div>
    </nav>
  );
};

export default Navbar;
