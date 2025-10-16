import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Home = () => {
  const [mode, setMode] = useState(null);
  const { categories, mahalleler, demoItems } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMahalle, setSelectedMahalle] = useState('');
  const [activeChip, setActiveChip] = useState(null);

  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Arama önerileri için fonksiyon
  const generateSuggestions = (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const qLower = query.toLowerCase();
    const suggestions = new Set();

    if (demoItems && demoItems.length > 0) {
      demoItems.forEach(item => {
        const titleWords = item.title.toLowerCase().split(/\s+/);
        const descWords = item.desc.toLowerCase().split(/\s+/);

        // Başlık ve açıklama kelimeleri ile eşleşme
        [...titleWords, ...descWords].forEach(word => {
          if (word.includes(qLower) && word !== qLower) {
            suggestions.add(word);
          }
        });

        // Kategori isimleri ile eşleşme
        const categoryNames = {
          'besi': 'besi hayvanı',
          'kumes': 'kümes yumurta',
          'sebze': 'sebze meyve',
          'sut': 'süt peynir',
          'yem': 'yem tohum',
          'makine': 'tarım makinaları'
        };

        Object.entries(categoryNames).forEach(([key, value]) => {
          if (value.includes(qLower)) {
            suggestions.add(value);
          }
        });
      });
    }

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  };

  const handleBuyClick = () => {
    setMode('buy');
    // Doğrudan ürün arama sayfasına yönlendir
    window.location.href = '/urunler';
  };

  const handleSellClick = () => {
    setMode('sell');
    // İlan verme sayfasına yönlendir
    window.location.href = '/ilan-ver';
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    generateSuggestions(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!mode) {
      alert("Önce 'Ürünümü Sat' veya 'Ürünümü Bul' seçin!");
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedMahalle) params.set('mahalle', selectedMahalle);

    if (mode === 'buy') {
      window.location.href = `/urunler?${params.toString()}`;
    } else {
      window.location.href = `/ilan-ver?urun=${encodeURIComponent(searchTerm)}&${params.toString()}`;
    }
  };

  const handleChipClick = (cat) => {
    setActiveChip(cat);
    setMode('buy');
    window.location.href = `/urunler?kategori=${encodeURIComponent(cat)}`;
  };

  if (!categories || !mahalleler) {
    return <div className="text-center p-5">Yükleniyor...</div>;
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="fw-bold mb-3">Üretici ile Alıcıyı Tek Platformda Buluşturuyoruz</h1>
          <p className="lead mb-4 wave-text">Tarladan sofraya, doğrudan ve güvenli ticaret</p>
          <div className="hero-buttons">
            <button
              className="btn btn-sell"
              onClick={handleSellClick}
            >
              🟢 ÜRÜNÜMÜ SAT
            </button>
            <button
              className="btn btn-buy"
              onClick={handleBuyClick}
            >
              🟠 ÜRÜNÜMÜ BUL
            </button>
          </div>
        </div>
      </section>

      {/* Search Area */}
      <div className="search-area">
        <h4 className="fw-bold mb-3">Ne arıyorsunuz?</h4>
        <form onSubmit={handleSearch} className="d-flex justify-content-center flex-wrap" role="search" aria-label="Site içi arama">
          <div className="position-relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchInputChange}
              placeholder={mode === 'sell' ? "Satmak istediğiniz ürünü yazın..." : "Örn: koyun, yumurta, süt, patates..."}
              aria-label="Arama"
              required
              className="form-control me-2 mb-2"
            />
            {searchSuggestions.length > 0 && (
              <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-sm mt-1 z-index-1000">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover-bg-light cursor-pointer"
                    onClick={() => {
                      setSearchTerm(suggestion);
                      setSearchSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <select
            value={selectedMahalle}
            onChange={(e) => setSelectedMahalle(e.target.value)}
            aria-label="Mahalle seç"
            className="form-select me-2 mb-2"
          >
            <option value="">Tümü (Mahalle)</option>
            {mahalleler.map((mahalle) => (
              <option key={mahalle} value={mahalle}>{mahalle}</option>
            ))}
          </select>
          <button className="btn btn-success mb-2">Ara</button>
        </form>
        <p className="text-muted mt-2">Ürününü satmak veya almak istiyorsan yukarıdan seçimini yap!</p>
        <div className="chips mt-3" aria-label="Hızlı kategoriler">
          <span
            className={`chip ${activeChip === 'besi' ? 'active' : ''}`}
            onClick={() => handleChipClick('besi')}
          >
            Besi Hayvanı
          </span>
          <span
            className={`chip ${activeChip === 'kumes' ? 'active' : ''}`}
            onClick={() => handleChipClick('kumes')}
          >
            Kümes & Yumurta
          </span>
          <span
            className={`chip ${activeChip === 'sebze' ? 'active' : ''}`}
            onClick={() => handleChipClick('sebze')}
          >
            Sebze & Meyve
          </span>
          <span
            className={`chip ${activeChip === 'sut' ? 'active' : ''}`}
            onClick={() => handleChipClick('sut')}
          >
            Süt & Peynir
          </span>
          <span
            className={`chip ${activeChip === 'yem' ? 'active' : ''}`}
            onClick={() => handleChipClick('yem')}
          >
            Yem & Tohum
          </span>
          <span
            className={`chip ${activeChip === 'makine' ? 'active' : ''}`}
            onClick={() => handleChipClick('makine')}
          >
            Tarım Makinaları
          </span>
        </div>
      </div>

      {/* Categories */}
      <section id="kategoriler" className="py-5 container text-center">
        <h2 className="fw-bold mb-4">Popüler Kategoriler</h2>
        <div className="row g-4">
          {categories.map((category) => (
            <div key={category.id} className="col-md-3">
              <div className="category-card">
                <img
                  loading="lazy"
                  src={category.img}
                  alt={category.name}
                  className="w-100"
                />
                <div className="p-3">
                  <h5>{category.name}</h5>
                  <button
                    className="btn btn-success w-100 mt-2"
                    onClick={() => handleChipClick(category.id)}
                  >
                    İlanları Gör
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Neden Biz */}
      <section id="nedenbiz" className="py-5 bg-light text-center">
        <div className="container">
          <h2 className="fw-bold mb-4">Neden KöydenDirekt?</h2>
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="p-4 bg-white rounded-4 shadow-sm">
                <h5>🌱 Yerel Üreticiye Destek</h5>
                <p>Köydeki üreticinin emeği doğrudan tüketiciye ulaşsın.</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="p-4 bg-white rounded-4 shadow-sm">
                <h5>💬 Hızlı İletişim</h5>
                <p>Alıcı ve satıcı doğrudan iletişim kurar, aracı yok!</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="p-4 bg-white rounded-4 shadow-sm">
                <h5>⚡ Güvenli Alım Satım</h5>
                <p>Onaylı kullanıcılar, şeffaf ilan sistemiyle güvenli ticaret.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* İletişim */}
      <section id="iletisim" className="py-5 container">
        <div className="row align-items-center g-4">
          <div className="col-md-6">
            <h2 className="fw-bold mb-3">İletişime Geç</h2>
            <p className="text-muted">Soruların mı var? İş ortaklığı veya öneriler için bize ulaş.</p>
            <a href="mailto:destek@koydendirekt.com" className="btn btn-success me-2">E-posta Gönder</a>
            <a href="https://wa.me/905355878729" target="_blank" rel="noopener" className="btn btn-outline-success">WhatsApp</a>
          </div>
          <div className="col-md-6">
            <div className="p-4 bg-white rounded-4 shadow-sm">
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Teşekkürler! Mesajınız alındı. Kısa sürede dönüş yapacağız.');
                e.target.reset();
              }}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Ad Soyad</label>
                  <input id="name" className="form-control" required />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">E-posta</label>
                  <input id="email" type="email" className="form-control" required />
                </div>
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">Mesaj</label>
                  <textarea id="message" className="form-control" rows="4" required></textarea>
                </div>
                <button className="btn btn-success w-100" type="submit">Gönder</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
