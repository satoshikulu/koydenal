import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    address: ''  // Yeni adres alanı
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Kullanıcıyı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            address: formData.address  // Adres bilgisini de gönder
          }
        }
      });

      if (authError) throw authError;

      // 2. Kullanıcı profili zaten otomatik oluşturuldu (trigger ile)
      // 3. Kullanıcıyı giriş sayfasına yönlendir
      alert('Kayıt başarılı! Lütfen e-posta adresinizi kontrol edin.');
      navigate('/login');
    } catch (error) {
      console.error('Kayıt hatası:', error);
      setError(error.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Yeni Hesap Oluştur</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Ad Soyad *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-posta *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefon *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Adres</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Şifre *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="login-link">
          Zaten hesabınız var mı? <a href="/login">Giriş yapın</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
