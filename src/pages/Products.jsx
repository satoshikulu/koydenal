import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';

const Products = () => {
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    kategori: '',
    mahalle: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { mahalleler, demoItems } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  // Önce demo verilerini göster
  useEffect(() => {
    setFilteredItems(demoItems || []);
    setLoading(false);
  }, [demoItems]);

  // Arama önerileri için fonksiyon
  const generateSuggestions = async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      // Önce demo verilerinden önerileri al
      const suggestions = new Set();
      if (demoItems && demoItems.length > 0) {
        demoItems.forEach(item => {
          const titleWords = item.title.toLowerCase().split(/\s+/);
          const descWords = item.desc.toLowerCase().split(/\s+/);

          [...titleWords, ...descWords].forEach(word => {
            if (word.includes(query.toLowerCase()) && word !== query.toLowerCase()) {
              suggestions.add(word);
            }
          });
        });
      }

      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
    } catch (error) {
      console.error('Arama önerileri hatası:', error);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setFilters({...filters, q: value});
    generateSuggestions(value);
  };

  // Demo verilerini filtrele
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce demo verilerini kullan
      let filtered = demoItems || [];

      // Arama filtresi
      if (filters.q) {
        const searchTerm = filters.q.toLowerCase();
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.desc.toLowerCase().includes(searchTerm)
        );
      }

      // Kategori filtresi
      if (filters.kategori) {
        filtered = filtered.filter(item => item.cat === filters.kategori);
      }

      // Mahalle filtresi
      if (filters.mahalle) {
        filtered = filtered.filter(item =>
          item.mahalle && item.mahalle.includes(filters.mahalle)
        );
      }

      setFilteredItems(filtered);

      // Supabase'den de veri çekmeyi dene (opsiyonel)
      try {
        let query = supabase
          .from('listings')
          .select(`
            *,
            categories(name),
            user_profiles(full_name, email, phone)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (filters.q) {
          query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,location.ilike.%${filters.q}%`);
        }

        const { data: supabaseData, error: supabaseError } = await query;

        if (!supabaseError && supabaseData && supabaseData.length > 0) {
          // Supabase verilerini demo verileriyle birleştir
          setFilteredItems([...supabaseData, ...filtered]);
        }
      } catch (supabaseErr) {
        console.log('Supabase verisi alınamadı, demo verileri kullanılıyor');
      }

    } catch (error) {
      console.error('Veri çekilirken hata:', error);
      setError('Veri yüklenirken hata oluştu');
      // Hata durumunda da demo verilerini göster
      setFilteredItems(demoItems || []);
    } finally {
      setLoading(false);
    }
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
  }, [location.search]);

  useEffect(() => {
    // Filtreler değiştiğinde demo verilerini filtrele
    if (demoItems && demoItems.length > 0) {
      fetchListings();
    }
  }, [filters, demoItems]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);

    // URL'i güncelle
    const params = new URLSearchParams();
    if (newFilters.q) params.set('search', newFilters.q);
    if (newFilters.kategori) params.set('kategori', newFilters.kategori);
    if (newFilters.mahalle) params.set('mahalle', newFilters.mahalle);

    const newUrl = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    navigate(newUrl, { replace: true });
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
          {loading ? 'Yükleniyor...' : `${filteredItems.length} sonuç bulundu${getFilterSummary()}`}
        </div>

        {error && (
          <div className="alert alert-warning">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-warning">
              Uygun ilan bulunamadı. Filtreleri genişletmeyi deneyin.
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm product-card">
                  <img
                    className="card-img-top"
                    src={item.img || item.main_image || item.images?.[0] || 'https://picsum.photos/400/300?random=1'}
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
                        {item.cat || item.categories?.name || 'Kategorisiz'}
                      </span>
                      <small className="text-muted">
                        {item.mahalle || item.location || 'Konum belirtilmemiş'}
                      </small>
                    </div>
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text fw-bold text-success">
                      {item.price ? `${item.price} ₺` : 'Fiyat Belirtilmemiş'}
                      {item.unit && <small className="text-muted"> / {item.unit}</small>}
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
                        onClick={() => {
                          const email = item.user_profiles?.email || item.contact_email || 'info@koydendal.com';
                          window.open(`mailto:${email}?subject=${encodeURIComponent('KöydenAL - ' + item.title)}`);
                        }}
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
