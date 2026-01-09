import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır!');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Kayıt başlıyor...', { email: formData.email, full_name: formData.full_name });
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            address: formData.address
          }
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }

      console.log('✅ Auth başarılı:', authData);

      // Kullanıcı profili oluşturuldu mu kontrol et
      if (authData.user) {
        console.log('👤 Kullanıcı ID:', authData.user.id);
        
        // Profil oluşturulmasını bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Profili kontrol et
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Profil kontrol hatası:', profileError);
        } else {
          console.log('✅ Profil oluşturuldu:', profile);
        }
      }

      alert('🎉 Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.');
      navigate('/login');
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      setError(error.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Image */}
      <div style={styles.backgroundImage} />
      <div style={styles.overlay} />

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.formCard}>
          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>🌾</div>
            <h1 style={styles.logoText}>KöydenAL</h1>
            <p style={styles.tagline}>Doğrudan Çiftçiden Tüketiciye</p>
          </div>

          {/* Title */}
          <div style={styles.titleSection}>
            <h2 style={styles.title}>Üye Ol</h2>
            <p style={styles.subtitle}>Hesap oluşturun ve hemen başlayın</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ad Soyad</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="Adınız ve soyadınız"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>E-posta</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="ornek@email.com"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="0555 123 45 67"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Adres (Opsiyonel)</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Şehir, İlçe"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Şifre</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="En az 6 karakter"
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Şifre Tekrar</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Şifrenizi tekrar girin"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Kayıt Yapılıyor...' : '🚀 Üye Ol'}
            </button>
          </form>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Zaten hesabınız var mı?{' '}
              <Link to="/login" style={styles.footerLink}>
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem'
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255, 218, 185, 0.85) 0%, rgba(255, 228, 196, 0.85) 50%, rgba(255, 239, 213, 0.85) 100%)',
    backdropFilter: 'blur(5px)',
    zIndex: 1
  },
  content: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '480px'
  },
  formCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '3rem 2.5rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logoIcon: {
    fontSize: '3.5rem',
    marginBottom: '0.5rem'
  },
  logoText: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#8B4513',
    margin: '0 0 0.3rem 0'
  },
  tagline: {
    fontSize: '0.9rem',
    color: '#A0826D',
    margin: 0
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#5D4037',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#8D6E63',
    margin: 0
  },
  errorBox: {
    background: 'linear-gradient(135deg, #FFB6B9 0%, #FFC9C9 100%)',
    color: '#8B0000',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    border: '1px solid rgba(139, 0, 0, 0.2)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#6D4C41'
  },
  input: {
    width: '100%',
    padding: '0.9rem 1rem',
    border: '2px solid #E0D5C7',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'rgba(255, 255, 255, 0.8)'
  },
  passwordWrapper: {
    position: 'relative'
  },
  eyeButton: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '0.5rem'
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #D4A574 0%, #C19A6B 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 20px rgba(196, 154, 107, 0.3)',
    marginTop: '0.5rem'
  },
  footer: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #E0D5C7',
    textAlign: 'center'
  },
  footerText: {
    color: '#8D6E63',
    fontSize: '0.95rem',
    margin: 0
  },
  footerLink: {
    color: '#A0826D',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.3s'
  }
};

export default Register;
