// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

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
            <li className="nav-item">
              <a className="nav-link" href="#kategoriler">Kategoriler</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#nedenbiz">Neden Biz?</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#iletisim">İletişim</a>
            </li>
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
