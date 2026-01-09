import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsAdmin } = useAdmin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting admin login...');
      const result = await loginAsAdmin(email, password);

      if (result.success) {
        console.log('✅ Admin login successful, redirecting...');
        navigate('/admin');
      } else {
        setError(result.error || 'Giriş başarısız');
      }
    } catch (err) {
      console.error('❌ Admin login error:', err);
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
            Admin Paneli
          </h2>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
            Yönetici girişi için email ve şifre girin
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#2c3e50',
                fontWeight: '500'
              }}
            >
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '1rem',
                transition: 'border-color 0.3s'
              }}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#2c3e50',
                fontWeight: '500'
              }}
            >
              Admin Şifresi
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '1rem',
                transition: 'border-color 0.3s'
              }}
              placeholder="Admin şifresini girin"
              required
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Admin Girişi'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#7f8c8d'
        }}>
          <p>🔒 Bu panel sadece yetkili adminler içindir</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
