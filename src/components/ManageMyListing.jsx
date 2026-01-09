import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Search } from 'lucide-react';

const ManageMyListing = () => {
  const [secret, setSecret] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (secret.trim()) {
      navigate(`/ilan-yonetim/${secret}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Key size={40} style={styles.icon} />
          <h2 style={styles.title}>İlanımı Yönet</h2>
          <p style={styles.subtitle}>
            Gizli anahtarınızı girerek ilanınızı güncelleyebilir veya silebilirsiniz
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Gizli Anahtar</label>
            <div style={styles.inputWrapper}>
              <Key size={20} style={styles.inputIcon} />
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="abc123def456..."
                style={styles.input}
                required
              />
            </div>
            <p style={styles.hint}>
              İlan oluşturduktan sonra size verilen gizli anahtarı girin
            </p>
          </div>

          <button type="submit" style={styles.button}>
            <Search size={20} />
            <span>İlanımı Bul</span>
          </button>
        </form>

        <div style={styles.info}>
          <h4 style={styles.infoTitle}>💡 Gizli Anahtarınızı Kaybettiniz mi?</h4>
          <p style={styles.infoText}>
            Üzgünüz, gizli anahtar olmadan ilanınıza erişemezsiniz. 
            Güvenlik nedeniyle anahtarlar veritabanında şifreli saklanır.
          </p>
          <p style={styles.infoText}>
            <strong>Çözüm:</strong> Yeni bir ilan oluşturun ve bu sefer anahtarı kaydedin.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem 1rem',
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '2.5rem',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  icon: {
    color: '#667eea',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#7f8c8d',
    lineHeight: 1.6
  },
  form: {
    marginBottom: '2rem'
  },
  inputGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#7f8c8d'
  },
  input: {
    width: '100%',
    padding: '0.9rem 1rem 0.9rem 3rem',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    fontFamily: 'monospace',
    outline: 'none',
    transition: 'all 0.3s'
  },
  hint: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
    marginTop: '0.5rem'
  },
  button: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
  },
  info: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '1.5rem',
    borderLeft: '4px solid #667eea'
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.8rem'
  },
  infoText: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
    lineHeight: 1.6,
    marginBottom: '0.5rem'
  }
};

export default ManageMyListing;
