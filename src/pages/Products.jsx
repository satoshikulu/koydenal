import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Products = () => {
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    kategori: '',
    mahalle: ''
  });

  const { demoItems, mahalleler } = useData();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setFilters({...filters, q: value});
    generateSuggestions(value);
  };

  useEffect(() => {
    // URL parametrelerinden filtreleri al
    const params = new URLSearchParams(location.search);
    const newFilters = {
      q: params.get('search') || '',
      kategori: params.get('kategori') || '',
      mahalle: params.get('mahalle') || ''
    };

    setFilters(newFilters);
    applyFilters(newFilters);
  }, [location.search]);

  const filterItems = (state) => {
    const qLower = state.q.trim().toLowerCase();

    if (!qLower) {
      // Eğer arama terimi yoksa kategori ve mahalle filtrelerini uygula
      return demoItems.filter(it => {
        const matchCat = !state.kategori || it.cat === state.kategori;
        const matchMah = !state.mahalle || it.mahalle === state.mahalle;
        return matchCat && matchMah;
      });
    }

    return demoItems.filter(it => {
      const titleLower = it.title.toLowerCase();
      const descLower = it.desc.toLowerCase();

      // Tam eşleşme kontrolü
      const exactMatch = titleLower.includes(qLower) || descLower.includes(qLower);

      // Kısmi eşleşme kontrolü (kelime bazında)
      const searchWords = qLower.split(/\s+/);
      const partialMatch = searchWords.some(word =>
        titleLower.includes(word) || descLower.includes(word)
      );

      // Yazım hatası toleransı için basit benzerlik kontrolü
      const fuzzyMatch = searchWords.some(word =>
        findSimilarWords(word, titleLower) || findSimilarWords(word, descLower)
      );

      const matchCat = !state.kategori || it.cat === state.kategori;
      const matchMah = !state.mahalle || it.mahalle === state.mahalle;

      return (exactMatch || partialMatch || fuzzyMatch) && matchCat && matchMah;
    });
  };

  // Basit yazım hatası toleransı için benzerlik fonksiyonu
  const findSimilarWords = (searchWord, text) => {
    if (searchWord.length < 3) return false;

    const words = text.split(/\s+/);
    return words.some(word => {
      if (word.length < 3) return false;

      // Levenshtein mesafesi benzeri basit kontrol
      const longer = word.length > searchWord.length ? word : searchWord;
      const shorter = word.length > searchWord.length ? searchWord : word;

      if (longer.length - shorter.length > 2) return false;

      let differences = 0;
      for (let i = 0; i < shorter.length; i++) {
        if (longer[i] !== shorter[i]) differences++;
      }

      return differences <= 1; // Sadece 1 karakter farklılık
    });
  };

  const applyFilters = (filterState) => {
    const filtered = filterItems(filterState);
    setFilteredItems(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);

    // URL'i güncelle
    const params = new URLSearchParams();
    if (newFilters.q) params.set('search', newFilters.q);
    if (newFilters.kategori) params.set('kategori', newFilters.kategori);
    if (newFilters.mahalle) params.set('mahalle', newFilters.mahalle);

    const newUrl = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    navigate(newUrl, { replace: true });

    applyFilters(newFilters);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFilterChange(filters);
  };

  const getFilterSummary = () => {
    const parts = [];
    if (filters.kategori) parts.push(`kategori: ${filters.kategori}`);
    if (filters.mahalle) parts.push(`mahalle: ${filters.mahalle}`);
    if (filters.q) parts.push(`arama: "${filters.q}"`);
    return parts.length > 0 ? ` • ${parts.join(' • ')}` : '';
  };

  return (
    <>
      {/* Filters */}
      <div className="filters py-3 bg-light border-bottom">
        <div className="container">
          <form id="filterForm" onSubmit={handleSubmit} className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="position-relative">
                <input
                  id="q"
                  className="form-control"
                  placeholder="Arama: koyun, yumurta, süt..."
                  value={filters.q}
                  onChange={handleSearchInputChange}
                />
                {searchSuggestions.length > 0 && (
                  <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-sm mt-1 z-index-1000">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover-bg-light cursor-pointer"
                        onClick={() => {
                          setFilters({...filters, q: suggestion});
                          setSearchSuggestions([]);
                          handleFilterChange({...filters, q: suggestion});
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select
                id="kategori"
                className="form-select"
                value={filters.kategori}
                onChange={(e) => setFilters({...filters, kategori: e.target.value})}
              >
                <option value="">Tüm Kategoriler</option>
                <option value="besi">Besi Hayvanı</option>
                <option value="kumes">Kümes & Yumurta</option>
                <option value="sebze">Sebze & Meyve</option>
                <option value="sut">Süt & Peynir</option>
                <option value="yem">Yem & Tohum</option>
                <option value="makine">Tarım Makinaları</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <select
                id="mahalle"
                className="form-select"
                value={filters.mahalle}
                onChange={(e) => setFilters({...filters, mahalle: e.target.value})}
              >
                <option value="">Tümü (Mahalle)</option>
                {mahalleler.map((mahalle) => (
                  <option key={mahalle} value={mahalle}>{mahalle}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button className="btn btn-success" type="submit">Filtrele</button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <main className="container py-4">
        <div id="resultsMeta" className="mb-3 text-muted">
          {filteredItems.length} sonuç bulundu{getFilterSummary()}
        </div>

        {filteredItems.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-warning">
              Uygun ilan bulunamadı. Filtreleri genişletmeyi deneyin.
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <img
                    className="card-img-top"
                    src={item.img}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '250px',
                      objectFit: 'cover'
                    }}
                  />
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge rounded-pill bg-success-subtle text-success text-uppercase">
                        {item.cat}
                      </span>
                      <small className="text-muted">
                        {item.region} • {item.mahalle}
                      </small>
                    </div>
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text fw-bold text-success">
                      {item.price} <small className="text-muted">/{item.unit}</small>
                    </p>
                    <div className="mt-auto d-grid gap-2">
                      <button
                        className="btn btn-success"
                        onClick={() => navigate(`/ilan-detay/${item.id}`)}
                      >
                        İlanı Gör
                      </button>
                      <button
                        className="btn btn-outline-success"
                        onClick={() => window.open(`mailto:satici@example.com?subject=${encodeURIComponent('KöydenDirekt - ' + item.title)}`)}
                      >
                        İletişime Geç
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Products;
