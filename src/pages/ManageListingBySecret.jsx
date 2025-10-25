import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Edit, Trash2, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

const ManageListingBySecret = () => {
  const { secret } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (secret) {
      loadListing();
    }
  }, [secret]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*, categories(name, icon)')
        .eq('listing_secret', secret)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('İlan bulunamadı. Gizli anahtar yanlış olabilir.');
        return;
      }

      setListing(data);
    } catch (error) {
      console.error('Listing load error:', error);
      setError('İlan yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('⚠️ İlanınızı kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('listing_secret', secret);

      if (error) throw error;

      alert('✅ İlanınız başarıyla silindi');
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ İlan silinemedi: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>İlan yükleniyor...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={styles.error}>
        <div style={styles.errorIcon}>❌</div>
        <h2>İlan Bulunamadı</h2>
        <p>{error || 'Gizli anahtar yanlış veya ilan silinmiş olabilir.'}</p>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>İlanımı Yönet</h1>
          <StatusBadge status={listing.status} />
        </div>

        {/* Listing Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.listingTitle}>{listing.title}</h2>
              <p style={styles.category}>
                {listing.categories?.icon} {listing.categories?.name}
              </p>
            </div>
          </div>

          <div style={styles.cardBody}>
            <InfoRow label="Fiyat" value={`${listing.price} ${listing.currency}`} />
            <InfoRow label="Miktar" value={`${listing.quantity} ${listing.unit}`} />
            <InfoRow label="Lokasyon" value={listing.location} />
            <InfoRow label="İletişim" value={listing.contact_phone} />
            <InfoRow label="Satıcı" value={listing.contact_person} />
            <InfoRow label="Oluşturulma" value={formatDate(listing.created_at)} />
            
            {listing.approved_at && (
              <InfoRow label="Onaylanma" value={formatDate(listing.approved_at)} />
            )}
            
            {listing.rejection_reason && (
              <div style={styles.rejectionBox}>
                <strong>Reddetme Nedeni:</strong>
                <p>{listing.rejection_reason}</p>
              </div>
            )}
          </div>

          <div style={styles.description}>
            <h4 style={styles.descTitle}>Açıklama</h4>
            <p style={styles.descText}>{listing.description}</p>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            {listing.status === 'pending' && (
              <div style={styles.pendingInfo}>
                <Clock size={20} />
                <span>İlanınız admin onayı bekliyor</span>
              </div>
            )}
            
            {listing.status === 'approved' && (
              <div style={styles.approvedInfo}>
                <CheckCircle size={20} />
                <span>İlanınız yayında!</span>
              </div>
            )}
            
            {listing.status === 'rejected' && (
              <div style={styles.rejectedInfo}>
                <XCircle size={20} />
                <span>İlanınız reddedildi</span>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button onClick={() => navigate(`/ilan-detay/${listing.id}`)} style={styles.viewButton}>
                <Eye size={18} />
                <span>İlanı Görüntüle</span>
              </button>
              
              <button onClick={handleDelete} style={styles.deleteButton}>
                <Trash2 size={18} />
                <span>İlanı Sil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>📌 Bilgi</h4>
          <ul style={styles.infoList}>
            <li>Gizli anahtarınızı kimseyle paylaşmayın</li>
            <li>İlanınız admin onayından sonra yayınlanır</li>
            <li>Onaylanan ilanları silebilirsiniz</li>
            <li>Reddedilen ilanlar için yeni ilan oluşturabilirsiniz</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatusBadge = ({ status }) => {
  const config = {
    pending: { text: 'Beklemede', bg: '#FFF3CD', color: '#856404', icon: <Clock size={16} /> },
    approved: { text: 'Onaylandı', bg: '#D4EDDA', color: '#155724', icon: <CheckCircle size={16} /> },
    rejected: { text: 'Reddedildi', bg: '#F8D7DA', color: '#721C24', icon: <XCircle size={16} /> }
  };
  const { text, bg, color, icon } = config[status] || config.pending;
  return (
    <span style={{ ...styles.badge, background: bg, color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon}
      {text}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={styles.infoRow}>
    <span style={styles.infoLabel}>{label}:</span>
    <span style={styles.infoValue}>{value}</span>
  </div>
);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '2rem 1rem'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: '2rem'
  },
  cardHeader: {
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #f0f0f0'
  },
  listingTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 0.5rem 0'
  },
  category: {
    fontSize: '1rem',
    color: '#7f8c8d',
    margin: 0
  },
  cardBody: {
    display: 'grid',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  infoRow: {
    display: 'flex',
    gap: '0.5rem'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#7f8c8d',
    minWidth: '120px'
  },
  infoValue: {
    color: '#2c3e50'
  },
  description: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    background: '#f8f9fa',
    borderRadius: '12px'
  },
  descTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.8rem'
  },
  descText: {
    fontSize: '0.95rem',
    color: '#495057',
    lineHeight: 1.6,
    margin: 0
  },
  rejectionBox: {
    background: '#F8D7DA',
    border: '1px solid #F5C6CB',
    borderRadius: '8px',
    padding: '1rem',
    color: '#721C24'
  },
  actions: {
    paddingTop: '1.5rem',
    borderTop: '2px solid #f0f0f0'
  },
  pendingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: '#FFF3CD',
    borderRadius: '8px',
    color: '#856404',
    marginBottom: '1rem',
    fontWeight: '600'
  },
  approvedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: '#D4EDDA',
    borderRadius: '8px',
    color: '#155724',
    marginBottom: '1rem',
    fontWeight: '600'
  },
  rejectedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: '#F8D7DA',
    borderRadius: '8px',
    color: '#721C24',
    marginBottom: '1rem',
    fontWeight: '600'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  viewButton: {
    flex: 1,
    minWidth: '150px',
    padding: '0.8rem 1.5rem',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s'
  },
  deleteButton: {
    flex: 1,
    minWidth: '150px',
    padding: '0.8rem 1.5rem',
    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s'
  },
  badge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  infoBox: {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  infoTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '1rem'
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  error: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    textAlign: 'center',
    padding: '2rem'
  },
  errorIcon: {
    fontSize: '5rem',
    marginBottom: '1rem'
  },
  backButton: {
    marginTop: '1rem',
    padding: '0.8rem 2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

export default ManageListingBySecret;
