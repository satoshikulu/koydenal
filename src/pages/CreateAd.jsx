// src/pages/CreateAd.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const CreateAd = () => {
  const [formData, setFormData] = useState({
    title: '',
    kategori: '',
    price: '',
    unit: '',
    quantity: '',
    mahalle: '',
    locationOther: '',
    description: '',
    sellerName: '',
    phone: '',
    email: '',
    preferred: 'telefon'
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { mahalleler = [] } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // URL parametrelerinden title'ı doldur
    const params = new URLSearchParams(window.location.search);
    const urun = params.get('urun');
    if (urun) {
      setFormData(prev => ({ ...prev, title: urun }));
    }
  }, []);

  // Mahalle değiştiğinde diğer alanı göster/gizle
  useEffect(() => {
    const otherWrap = document.getElementById('locationOtherWrap');
    if (formData.mahalle === 'DİĞER') {
      otherWrap.style.display = 'block';
    } else if (formData.mahalle && formData.mahalle !== 'DİĞER') {
      otherWrap.style.display = 'none';
      // Sadece mahalle değiştiğinde ve DİĞER seçili değilken locationOther'ı temizle
      if (formData.locationOther !== '') {
        // Direkt DOM manipülasyonu ile temizle (state güncellemesi yapma)
        const locationOtherInput = document.getElementById('locationOther');
        if (locationOtherInput) {
          locationOtherInput.value = '';
        }
      }
    }
  }, [formData.mahalle]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setFormData(prev => ({ ...prev, images: files }));

    // Preview oluştur
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.title.trim().length < 8) {
      newErrors.title = 'Başlık en az 8 karakter olmalı.';
    }

    if (!formData.kategori) {
      newErrors.kategori = 'Kategori seçiniz.';
    }

    if (!formData.price || Number(formData.price) < 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz.';
    }

    if (!formData.unit) {
      newErrors.unit = 'Birim seçiniz.';
    }

    if (!formData.quantity || Number(formData.quantity) < 1) {
      newErrors.quantity = 'Miktar 1 ve üzeri olmalı.';
    }

    if (!formData.mahalle) {
      newErrors.mahalle = 'Mahalle seçiniz.';
    }

    if (formData.mahalle === 'DİĞER' && !formData.locationOther.trim()) {
      newErrors.locationOther = 'Lütfen mahalle/köy adını yazınız.';
    }

    if (formData.description.trim().length < 20) {
      newErrors.description = 'Açıklama en az 20 karakter olmalı.';
    }

    if (formData.sellerName.trim().length < 3) {
      newErrors.sellerName = 'Ad soyad gerekli.';
    }

    const phoneRegex = /^0?5\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = '05XXXXXXXXX formatında olmalı.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Misafir kullanıcılar da ilan verebilir, giriş zorunlu değil
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Kategorileri Supabase'den al
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');

      if (categoriesError) {
        throw new Error(`Kategoriler alınamadı: ${categoriesError.message}`);
      }

      // Kategori mapping oluştur (form değerlerini Supabase kategori isimlerine çevir)
      const kategoriMap = {
        'besi': 'hayvancılık',
        'kumes': 'bakliyat', // Kümes hayvanları için bakliyat kullanıyoruz
        'sebze': 'sebzeler',
        'sut': 'meyveler', // Süt ürünleri için meyveler kullanıyoruz
        'yem': 'tahıllar', // Yem için tahıllar kullanıyoruz
        'makine': 'ekipman'
      };

      const kategoriAdi = kategoriMap[formData.kategori];
      if (!kategoriAdi) {
        throw new Error('Geçersiz kategori seçimi');
      }

      // Supabase kategori adıyla eşleşen kategoriyi bul
      const kategori = categoriesData.find(cat => cat.name.toLowerCase() === kategoriAdi);
      if (!kategori) {
        throw new Error(`Kategori bulunamadı: ${kategoriAdi}`);
      }

      const kategoriId = kategori.id;

      // Mahalle bilgisini belirle
      const chosenMahalle = formData.mahalle === 'DİĞER' ? formData.locationOther.trim() : formData.mahalle;

      // İmage upload işlemi (şimdilik placeholder)
      const imageUrls = [];
      if (formData.images && formData.images.length > 0) {
        // TODO: Image upload işlemi eklenecek
        // Şimdilik placeholder URL'ler kullanacağız
        imageUrls.push('https://picsum.photos/400/300?random=' + Date.now());
      }

      // İlan verisi hazırla
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: 'TRY',
        location: chosenMahalle,
        category_id: kategoriId,
        listing_type: 'ürün',
        status: 'pending', // Admin onayı bekleyecek
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        contact_phone: formData.phone,
        contact_email: formData.email || (user ? user.email : null),
        contact_person: formData.sellerName,
        images: imageUrls,
        main_image: imageUrls[0] || null,
        user_id: user ? user.id : null // Misafir kullanıcılar için null
      };

      console.log('İlan verisi:', listingData);

      // Supabase'e kaydet
      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single();

      if (error) {
        throw new Error(`İlan kaydedilemedi: ${error.message}`);
      }

      console.log('İlan başarıyla oluşturuldu:', data);

      // Başarılı mesajı göster ve ana sayfaya yönlendir
      const successMessage = user 
        ? 'İlanınız başarıyla oluşturuldu! Admin onayı sonrası yayınlanacak.' 
        : 'İlanınız başarıyla oluşturuldu! Admin onayı sonrası yayınlanacak. İlanınızı takip etmek için kayıt olmanızı öneririz.';
      alert(successMessage);
      navigate('/');

    } catch (error) {
      console.error('İlan oluşturma hatası:', error);
      setSubmitError(error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

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

      <main className="container py-4 create-ad-container">
        <h1 className="h3 fw-bold mb-3">İlan Ver</h1>
        <p className="text-muted">Satmak istediğiniz ürünü detaylandırın. Temel doğrulamalar form üzerinde yapılır.</p>

        {submitError && (
          <div className="alert alert-danger" role="alert">
            {submitError}
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <form onSubmit={handleSubmit} noValidate className="create-ad-form">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label" htmlFor="title">İlan Başlığı</label>
                      <input
                        id="title"
                        name="title"
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        placeholder="Örn: 20 adet Kangal koyun"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="kategori">Kategori</label>
                      <select
                        id="kategori"
                        name="kategori"
                        className={`form-select ${errors.kategori ? 'is-invalid' : ''}`}
                        value={formData.kategori}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seçiniz</option>
                        <option value="besi">Besi Hayvanı</option>
                        <option value="kumes">Kümes & Yumurta</option>
                        <option value="sebze">Sebze & Meyve</option>
                        <option value="sut">Süt & Peynir</option>
                        <option value="yem">Yem & Tohum</option>
                        <option value="makine">Tarım Makinaları</option>
                      </select>
                      {errors.kategori && <div className="invalid-feedback">{errors.kategori}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="price">Fiyat</label>
                      <div className="input-group">
                        <input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="input-group-text">₺</span>
                      </div>
                      {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="unit">Birim</label>
                      <select
                        id="unit"
                        name="unit"
                        className={`form-select ${errors.unit ? 'is-invalid' : ''}`}
                        value={formData.unit}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seçiniz</option>
                        <option value="adet">Adet</option>
                        <option value="kg">Kg</option>
                        <option value="litre">Litre</option>
                        <option value="bale">Bale</option>
                      </select>
                      {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="quantity">Miktar</label>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="mahalle">Mahalle</label>
                      <select
                        id="mahalle"
                        name="mahalle"
                        className={`form-select ${errors.mahalle ? 'is-invalid' : ''}`}
                        value={formData.mahalle}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seçiniz</option>
                        {mahalleler.map((mahalle) => (
                          <option key={mahalle} value={mahalle}>{mahalle}</option>
                        ))}
                        <option value="DİĞER">Diğer</option>
                      </select>
                      {errors.mahalle && <div className="invalid-feedback">{errors.mahalle}</div>}
                    </div>
                    <div className="col-md-6" id="locationOtherWrap" style={{display: 'none'}}>
                      <label className="form-label" htmlFor="locationOther">Diğer Mahalle / Köy</label>
                      <input
                        id="locationOther"
                        name="locationOther"
                        className={`form-control ${errors.locationOther ? 'is-invalid' : ''}`}
                        placeholder="Örn: XYZ Köyü"
                        value={formData.locationOther}
                        onChange={handleInputChange}
                      />
                      {errors.locationOther && <div className="invalid-feedback">{errors.locationOther}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="description">Açıklama</label>
                      <textarea
                        id="description"
                        name="description"
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        rows="5"
                        placeholder="Ürünle ilgili detaylar (yaş, cins, beslenme, teslim vb.)"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                      <div className="form-text">Güvenlik: Kişisel bilgilerinizi açıklamaya eklemeyin.</div>
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="images">Görseller</label>
                      <input
                        id="images"
                        type="file"
                        className="form-control"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                      <div className="form-text">En fazla 5 görsel yükleyin. İlk görsel kapak olarak kullanılır.</div>
                      {imagePreview.length > 0 && (
                        <div className="d-flex gap-2 flex-wrap mt-2 image-preview-container">
                          {imagePreview.map((src, index) => (
                            <img
                              key={index}
                              src={src}
                              alt={`Preview ${index + 1}`}
                              style={{ height: '80px', width: '80px', objectFit: 'cover' }}
                              className="rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm mt-3">
                <div className="card-body">
                  <h5 className="mb-3">İletişim Bilgileri</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="sellerName">Ad Soyad</label>
                      <input
                        id="sellerName"
                        name="sellerName"
                        className={`form-control ${errors.sellerName ? 'is-invalid' : ''}`}
                        value={formData.sellerName}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.sellerName && <div className="invalid-feedback">{errors.sellerName}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="phone">Telefon</label>
                      <input
                        id="phone"
                        name="phone"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder="05XXXXXXXXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="email">E-posta (Opsiyonel)</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="preferred">Tercih Edilen İletişim</label>
                      <select
                        id="preferred"
                        name="preferred"
                        className="form-select"
                        value={formData.preferred}
                        onChange={handleInputChange}
                      >
                        <option value="telefon">Telefon</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">E-posta</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-grid d-md-flex gap-2 justify-content-md-end mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                  Vazgeç
                </button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'İlan Oluşturuluyor...' : 'İlanı Oluştur'}
                </button>
              </div>
            </form>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm tips-card">
              <div className="card-body">
                <h5 className="mb-2">İpuçları</h5>
                <ul className="small text-muted mb-0">
                  <li>Açıklamayı detaylı yazın, alıcının sorularını azaltın.</li>
                  <li>Net ve güncel fotoğraflar ekleyin.</li>
                  <li>Şüpheli alıcılardan kapora almayın, yüz yüze görüşün.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CreateAd;
