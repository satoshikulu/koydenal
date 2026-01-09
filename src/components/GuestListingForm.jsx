// src/components/GuestListingForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

const GuestListingForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    unit: '',
    location: '',
    category: '',
    phone: '',
    email: '',
    sellerName: '',
    preferredContact: 'telefon'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mahalleler = [] } = useData();

  const categories = [
    { id: 'tahıllar', name: 'Tahıllar', icon: '🌾' },
    { id: 'sebzeler', name: 'Sebzeler', icon: '🥕' },
    { id: 'meyveler', name: 'Meyveler', icon: '🍎' },
    { id: 'bakliyat', name: 'Bakliyat', icon: '🫘' },
    { id: 'hayvancılık', name: 'Hayvancılık', icon: '🐄' },
    { id: 'ekipman', name: 'Ekipman', icon: '🚜' }
  ];

  const units = ['adet', 'kg', 'litre', 'bale', 'ton', 'dönüm'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.title.trim().length < 8) {
      newErrors.title = 'Başlık en az 8 karakter olmalı.';
    }

    if (formData.description.trim().length < 20) {
      newErrors.description = 'Açıklama en az 20 karakter olmalı.';
    }

    if (!formData.price || Number(formData.price) < 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz.';
    }

    if (!formData.quantity || Number(formData.quantity) < 1) {
      newErrors.quantity = 'Miktar 1 ve üzeri olmalı.';
    }

    if (!formData.unit) {
      newErrors.unit = 'Birim seçiniz.';
    }

    if (!formData.location) {
      newErrors.location = 'Lokasyon seçiniz.';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori seçiniz.';
    }

    if (formData.sellerName.trim().length < 3) {
      newErrors.sellerName = 'Ad soyad gerekli.';
    }

    const phoneRegex = /^0?5\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Misafir ilan oluşturma başladı...');
      console.log('📝 Form verisi:', formData);

      // Kategoriyi al
      console.log('🔍 Kategori aranıyor:', formData.category);
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', formData.category)
        .single();

      if (categoryError) {
        console.error('❌ Kategori hatası:', categoryError);
        throw new Error('Kategori bulunamadı: ' + categoryError.message);
      }

      if (!categoryData) {
        throw new Error('Kategori bulunamadı');
      }

      console.log('✅ Kategori bulundu:', categoryData);

      // İlan verisini hazırla
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: 'TRY',
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        location: formData.location,
        category_id: categoryData.id,
        listing_type: 'ürün',
        status: 'pending',
        contact_phone: formData.phone,
        contact_email: formData.email || null,
        contact_person: formData.sellerName,
        preferred_contact: formData.preferredContact,
        user_id: null // Misafir kullanıcı
      };

      console.log('📋 İlan verisi hazırlandı:', listingData);

      // İlanı oluştur
      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single();

      if (error) {
        console.error('❌ İlan oluşturma hatası:', error);
        if (error.message.includes('row-level security')) {
          throw new Error('Güvenlik politikası hatası. Lütfen yönetici ile iletişime geçin.');
        }
        throw error;
      }

      console.log('✅ İlan başarıyla oluşturuldu:', data);
      console.log('🔑 Gizli anahtar:', data.listing_secret);
      console.log('📊 İlan ID:', data.id);
      console.log('📋 İlan Durumu:', data.status);

      // Başarılı sayfasına yönlendir
      navigate('/ilan-basarili', {
        state: {
          listingId: data.id,
          secret: data.listing_secret
        }
      });

    } catch (error) {
      console.error('❌ İlan oluşturma hatası:', error);
      alert('İlan oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h3 className="mb-0">🌾 Üye Olmadan İlan Ver</h3>
              <small>Doğrudan çiftçiden tüketiciye</small>
            </div>

            <div className="card-body">
              <div className="alert alert-info">
                <strong>Üye olmadan ilan veriyorsunuz!</strong>
                <br />
                İlanınızı yönetmek için size özel bir gizli anahtar verilecek.
                Bu anahtarı güvenli bir yerde saklayın.
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  {/* Başlık */}
                  <div className="col-md-8">
                    <label className="form-label">İlan Başlığı *</label>
                    <input
                      type="text"
                      name="title"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Örn: 50 kg organik buğday"
                      required
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                  </div>

                  {/* Kategori */}
                  <div className="col-md-4">
                    <label className="form-label">Kategori *</label>
                    <select
                      name="category"
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seçiniz</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                  </div>

                  {/* Fiyat ve Birim */}
                  <div className="col-md-4">
                    <label className="form-label">Fiyat *</label>
                    <div className="input-group">
                      <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                      />
                      <span className="input-group-text">₺</span>
                    </div>
                    {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Miktar *</label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="1"
                      required
                    />
                    {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Birim *</label>
                    <select
                      name="unit"
                      className={`form-select ${errors.unit ? 'is-invalid' : ''}`}
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seçiniz</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
                  </div>

                  {/* Lokasyon */}
                  <div className="col-md-6">
                    <label className="form-label">Lokasyon *</label>
                    <select
                      name="location"
                      className={`form-select ${errors.location ? 'is-invalid' : ''}`}
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seçiniz</option>
                      {mahalleler.map((mahalle) => (
                        <option key={mahalle} value={mahalle}>{mahalle}</option>
                      ))}
                    </select>
                    {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                  </div>

                  {/* İletişim Tercihi */}
                  <div className="col-md-6">
                    <label className="form-label">İletişim Tercihi</label>
                    <select
                      name="preferredContact"
                      className="form-select"
                      value={formData.preferredContact}
                      onChange={handleInputChange}
                    >
                      <option value="telefon">Telefon</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">E-posta</option>
                    </select>
                  </div>

                  {/* Açıklama */}
                  <div className="col-12">
                    <label className="form-label">Açıklama *</label>
                    <textarea
                      name="description"
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Ürün hakkında detaylı bilgi verin..."
                      required
                    ></textarea>
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* İletişim Bilgileri */}
                  <div className="col-md-6">
                    <label className="form-label">Ad Soyad *</label>
                    <input
                      type="text"
                      name="sellerName"
                      className={`form-control ${errors.sellerName ? 'is-invalid' : ''}`}
                      value={formData.sellerName}
                      onChange={handleInputChange}
                      placeholder="Satıcı adı"
                      required
                    />
                    {errors.sellerName && <div className="invalid-feedback">{errors.sellerName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Telefon *</label>
                    <input
                      type="tel"
                      name="phone"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="05XXXXXXXXX"
                      required
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">E-posta (Opsiyonel)</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="satıcı@example.com"
                    />
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/')}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? 'İlan Oluşturuluyor...' : 'Üye Olmadan İlan Ver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestListingForm;
