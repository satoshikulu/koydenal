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

  // Fetch listings from Supabase
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('listings')
        .select(`
          *,
          categories!inner(name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters.q) {
        query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,location.ilike.%${filters.q}%`);
      }

      // Apply category filter
      if (filters.kategori) {
        // Map frontend category to database category
        const categoryMap = {
          'besi': 'Hayvancılık',
          'kumes': 'Hayvancılık',
          'sebze': 'Sebzeler',
          'sut': 'Hayvancılık',
          'yem': 'Tahıllar',
          'makine': 'Ekipman'
        };
        
        const categoryName = categoryMap[filters.kategori];
        if (categoryName) {
          query = query.eq('categories.name', categoryName);
        }
      }

      // Apply location filter
      if (filters.mahalle) {
        query = query.ilike('location', `%${filters.mahalle}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Debug: Log the raw data
      console.log('Fetched listings:', data);

      // Transform data to match expected format
      const transformedData = data.map(item => ({
        id: item.id,
        title: item.title,
        cat: item.categories?.name ? item.categories.name.toLowerCase().replace('ı', 'i').replace('ü', 'u').replace('ö', 'o').replace('ç', 'c').replace('ş', 's').replace('ğ', 'g').replace(' ', '-') : 'diğer',
        mahalle: item.location,
        price: item.price,
        unit: item.unit,
        img: item.main_image || item.images?.[0] || 'https://picsum.photos/400/300?random=1',
        desc: item.description,
        contact_email: item.contact_email,
        contact_phone: item.contact_phone
      }));

      setFilteredItems(transformedData);
    } catch (error) {
      console.error('Veri çekilirken hata:', error);
      setError('Veri yüklenirken hata oluştu: ' + error.message);
      // Fallback to demo items if there's an error
      setFilteredItems(demoItems || []);
    } finally {
      setLoading(false);
    }
  };

  // Generate search suggestions
  const generateSuggestions = async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      // Get suggestions from Supabase data
      const { data, error } = await supabase
        .from('listings')
        .select('title, description')
        .eq('status', 'approved')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      const suggestions = new Set();
      data.forEach(item => {
        const titleWords = item.title.toLowerCase().split(/\s+/);
        const descWords = item.description.toLowerCase().split(/\s+/);

        [...titleWords, ...descWords].forEach(word => {
          if (word.includes(query.toLowerCase()) && word !== query.toLowerCase()) {
            suggestions.add(word);
          }
        });
      });

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

  useEffect(() => {
    // Get filters from URL parameters
    const params = new URLSearchParams(location.search);
    const newFilters = {
      q: params.get('search') || '',
      kategori: params.get('kategori') || '',
      mahalle: params.get('mahalle') || ''
    };

    setFilters(newFilters);
  }, [location.search]);

  useEffect(() => {
    // Fetch listings when filters change
    fetchListings();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);

    // Update URL
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
                        📧 E-posta ile İletişim
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => {
                          const phone = item.user_profiles?.phone || item.contact_phone || '';
                          if (phone) {
                            if (phone.startsWith('+90') || phone.startsWith('90')) {
                              window.open(`https://wa.me/${phone.replace(/\D/g, '')}`);
                            } else {
                              window.open(`tel:${phone}`);
                            }
                          } else {
                            alert('Telefon numarası bulunamadı');
                          }
                        }}
                      >
                        📱 Telefon/WhatsApp
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
