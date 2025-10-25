import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../contexts/AdminContext';
import {
    Users, FileText, Clock, CheckCircle, XCircle,
    Star, TrendingUp, LogOut, RefreshCw, Search, Trash2
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { isAdmin, logout } = useAdmin();
    const [activeTab, setActiveTab] = useState('users');
    const [filter, setFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingUsers: 0,
        totalListings: 0,
        pendingListings: 0
    });

    useEffect(() => {
        if (isAdmin) {
            loadStats();
            loadData();
        }
    }, [isAdmin, activeTab, filter, searchTerm]);

    const loadStats = async () => {
        try {
            console.log('📊 Loading stats...');
            const [usersRes, pendingUsersRes, listingsRes, pendingListingsRes] = await Promise.all([
                supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
                supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('listings').select('*', { count: 'exact', head: true }),
                supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            console.log('📊 Stats results:', {
                totalUsers: usersRes.count,
                pendingUsers: pendingUsersRes.count,
                totalListings: listingsRes.count,
                pendingListings: pendingListingsRes.count
            });

            setStats({
                totalUsers: usersRes.count || 0,
                pendingUsers: pendingUsersRes.count || 0,
                totalListings: listingsRes.count || 0,
                pendingListings: pendingListingsRes.count || 0
            });
        } catch (error) {
            console.error('❌ Stats error:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') await loadUsers();
            else await loadListings();
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        let query = supabase.from('user_profiles').select('*');
        if (filter !== 'all') query = query.eq('status', filter);
        if (searchTerm) query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
    };

    const loadListings = async () => {
        console.log('📋 Loading listings with filter:', filter, 'search:', searchTerm);
        let query = supabase.from('listings').select('*, user_profiles(full_name, email, phone), categories(name, icon)');
        if (filter !== 'all') query = query.eq('status', filter);
        if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.error('❌ Listings error:', error);
            throw error;
        }
        console.log('📋 Listings loaded:', data?.length, 'items');
        setListings(data || []);
    };

    const handleUserAction = async (userId, action, reason = '') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const updates = { status: action, approved_by: user.id, approved_at: new Date().toISOString() };
            if (action === 'rejected') updates.rejection_reason = reason;
            const { error } = await supabase.from('user_profiles').update(updates).eq('id', userId);
            if (error) throw error;
            alert(`✅ Kullanıcı ${action === 'approved' ? 'onaylandı' : 'reddedildi'}`);
            loadStats();
            loadData();
        } catch (error) {
            console.error('User action error:', error);
            alert('❌ İşlem başarısız: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`⚠️ ${userEmail} kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?`)) return;
        try {
            await supabase.from('listings').delete().eq('user_id', userId);
            const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
            if (error) throw error;
            alert('✅ Kullanıcı başarıyla silindi');
            loadStats();
            loadData();
        } catch (error) {
            console.error('Delete user error:', error);
            alert('❌ Kullanıcı silinemedi: ' + error.message);
        }
    };

    const handleListingAction = async (listingId, action, reason = '') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const updates = { status: action, approved_by: user.id, approved_at: new Date().toISOString() };
            if (action === 'rejected') updates.rejection_reason = reason;
            const { error } = await supabase.from('listings').update(updates).eq('id', listingId);
            if (error) throw error;
            await supabase.from('admin_actions').insert({ admin_id: user.id, listing_id: listingId, action, reason });
            alert(`✅ İlan ${action === 'approved' ? 'onaylandı' : 'reddedildi'}`);
            loadStats();
            loadData();
        } catch (error) {
            console.error('Listing action error:', error);
            alert('❌ İşlem başarısız: ' + error.message);
        }
    };

    const toggleFeatured = async (listingId, currentStatus) => {
        try {
            const { error } = await supabase.from('listings').update({
                is_featured: !currentStatus,
                featured_until: !currentStatus ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
            }).eq('id', listingId);
            if (error) throw error;
            alert(`✅ İlan ${!currentStatus ? 'öne çıkarıldı' : 'normal hale getirildi'}`);
            loadData();
        } catch (error) {
            console.error('Featured toggle error:', error);
            alert('❌ İşlem başarısız: ' + error.message);
        }
    };

    const toggleOpportunity = async (listingId, currentStatus) => {
        try {
            const { error } = await supabase.from('listings').update({ is_opportunity: !currentStatus }).eq('id', listingId);
            if (error) throw error;
            alert(`✅ İlan ${!currentStatus ? 'fırsat ilanı yapıldı' : 'normal hale getirildi'}`);
            loadData();
        } catch (error) {
            console.error('Opportunity toggle error:', error);
            alert('❌ İşlem başarısız: ' + error.message);
        }
    };

    if (!isAdmin) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>🔒</div>
                <h2 style={styles.errorTitle}>Erişim Engellendi</h2>
                <p style={styles.errorText}>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Modern Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.logoContainer}>
                        <span style={styles.logoIcon}>🌾</span>
                        <div>
                            <h1 style={styles.title}>Admin Paneli</h1>
                            <p style={styles.subtitle}>KöydenAL Yönetim Merkezi</p>
                        </div>
                    </div>
                </div>
                <button onClick={async () => { await logout(); navigate('/admin'); }} style={styles.logoutBtn}>
                    <LogOut size={20} />
                    <span>Çıkış</span>
                </button>
            </div>

            {/* Modern Stats Cards */}
            <div style={styles.statsGrid}>
                <StatCard icon={<Users size={28} />} title="Toplam Kullanıcı" value={stats.totalUsers} gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                <StatCard icon={<Clock size={28} />} title="Bekleyen Kullanıcı" value={stats.pendingUsers} gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
                <StatCard icon={<FileText size={28} />} title="Toplam İlan" value={stats.totalListings} gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" />
                <StatCard icon={<Clock size={28} />} title="Bekleyen İlan" value={stats.pendingListings} gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" />
            </div>

            {/* Modern Tabs */}
            <div style={styles.tabsContainer}>
                <button onClick={() => setActiveTab('users')} style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }}>
                    <Users size={20} />
                    <span>Kullanıcılar</span>
                    {stats.pendingUsers > 0 && <span style={styles.badge}>{stats.pendingUsers}</span>}
                </button>
                <button onClick={() => setActiveTab('listings')} style={{ ...styles.tab, ...(activeTab === 'listings' ? styles.tabActive : {}) }}>
                    <FileText size={20} />
                    <span>İlanlar</span>
                    {stats.pendingListings > 0 && <span style={styles.badge}>{stats.pendingListings}</span>}
                </button>
            </div>

            {/* Modern Filters */}
            <div style={styles.filtersContainer}>
                <div style={styles.filterGroup}>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
                        <option value="pending">⏰ Beklemede</option>
                        <option value="approved">✅ Onaylandı</option>
                        <option value="rejected">❌ Reddedildi</option>
                        <option value="all">📊 Tümü</option>
                    </select>
                    <div style={styles.searchBox}>
                        <Search size={20} style={styles.searchIcon} />
                        <input type="text" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                    </div>
                </div>
                <button onClick={loadData} style={styles.refreshBtn}>
                    <RefreshCw size={20} />
                    <span>Yenile</span>
                </button>
            </div>

            {/* Content */}
            <div style={styles.content}>
                {loading ? (
                    <div style={styles.loading}>
                        <div style={styles.spinner} />
                        <p style={styles.loadingText}>Yükleniyor...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <UsersList users={users} onAction={handleUserAction} onDelete={handleDeleteUser} />
                ) : (
                    <ListingsList listings={listings} onAction={handleListingAction} onToggleFeatured={toggleFeatured} onToggleOpportunity={toggleOpportunity} />
                )}
            </div>
        </div>
    );
};

// Modern Stat Card Component
const StatCard = ({ icon, title, value, gradient }) => (
    <div style={{ ...styles.statCard, background: gradient }}>
        <div style={styles.statIcon}>{icon}</div>
        <div style={styles.statContent}>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statTitle}>{title}</div>
        </div>
    </div>
);

// Users List Component
const UsersList = ({ users, onAction, onDelete }) => {
    if (users.length === 0) return <div style={styles.empty}>👥 Kullanıcı bulunamadı</div>;
    return (
        <div style={styles.grid}>
            {users.map(user => (
                <div key={user.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={styles.userAvatar}>{user.full_name?.charAt(0) || '👤'}</div>
                        <div style={styles.cardHeaderInfo}>
                            <h3 style={styles.cardTitle}>{user.full_name}</h3>
                            <p style={styles.cardSubtitle}>{user.email}</p>
                        </div>
                        <StatusBadge status={user.status} />
                    </div>
                    <div style={styles.cardBody}>
                        <InfoRow icon="📱" label="Telefon" value={user.phone || '-'} />
                        <InfoRow icon="📍" label="Adres" value={user.address || '-'} />
                        <InfoRow icon="📅" label="Kayıt" value={formatDate(user.created_at)} />
                    </div>
                    <div style={styles.cardActions}>
                        {user.status === 'pending' && (
                            <>
                                <button onClick={() => onAction(user.id, 'approved')} style={{ ...styles.actionBtn, ...styles.approveBtn }}>
                                    <CheckCircle size={18} />
                                    <span>Onayla</span>
                                </button>
                                <button onClick={() => { const reason = prompt('Reddetme nedeni:'); if (reason) onAction(user.id, 'rejected', reason); }} style={{ ...styles.actionBtn, ...styles.rejectBtn }}>
                                    <XCircle size={18} />
                                    <span>Reddet</span>
                                </button>
                            </>
                        )}
                        <button onClick={() => onDelete(user.id, user.email)} style={{ ...styles.actionBtn, ...styles.deleteBtn }}>
                            <Trash2 size={18} />
                            <span>Sil</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Listings List Component
const ListingsList = ({ listings, onAction, onToggleFeatured, onToggleOpportunity }) => {
    if (listings.length === 0) return <div style={styles.empty}>📋 İlan bulunamadı</div>;
    return (
        <div style={styles.grid}>
            {listings.map(listing => (
                <div key={listing.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={styles.cardHeaderInfo}>
                            <h3 style={styles.cardTitle}>{listing.title}</h3>
                            <p style={styles.cardSubtitle}>{listing.categories?.icon} {listing.categories?.name}</p>
                        </div>
                        <div style={styles.badges}>
                            {listing.is_featured && <span style={styles.featuredBadge}>⭐ Öne Çıkan</span>}
                            {listing.is_opportunity && <span style={styles.opportunityBadge}>🔥 Fırsat</span>}
                            <StatusBadge status={listing.status} />
                        </div>
                    </div>
                    <div style={styles.cardBody}>
                        <InfoRow icon="💰" label="Fiyat" value={`${listing.price} ${listing.currency}`} />
                        <InfoRow icon="📦" label="Miktar" value={`${listing.quantity} ${listing.unit}`} />
                        <InfoRow icon="📍" label="Lokasyon" value={listing.location} />
                        <InfoRow icon="📱" label="İletişim" value={listing.contact_phone} />
                        <InfoRow icon="👤" label="Satıcı" value={listing.user_profiles?.full_name || 'Misafir'} />
                    </div>
                    <div style={styles.cardActions}>
                        {listing.status === 'pending' && (
                            <>
                                <button onClick={() => onAction(listing.id, 'approved')} style={{ ...styles.actionBtn, ...styles.approveBtn }}>
                                    <CheckCircle size={18} />
                                    <span>Onayla</span>
                                </button>
                                <button onClick={() => { const reason = prompt('Reddetme nedeni:'); if (reason) onAction(listing.id, 'rejected', reason); }} style={{ ...styles.actionBtn, ...styles.rejectBtn }}>
                                    <XCircle size={18} />
                                    <span>Reddet</span>
                                </button>
                            </>
                        )}
                        {listing.status === 'approved' && (
                            <>
                                <button onClick={() => onToggleFeatured(listing.id, listing.is_featured)} style={{ ...styles.actionBtn, ...styles.featureBtn }}>
                                    <Star size={18} />
                                    <span>{listing.is_featured ? 'Kaldır' : 'Öne Çıkar'}</span>
                                </button>
                                <button onClick={() => onToggleOpportunity(listing.id, listing.is_opportunity)} style={{ ...styles.actionBtn, ...styles.opportunityBtn }}>
                                    <TrendingUp size={18} />
                                    <span>{listing.is_opportunity ? 'Kaldır' : 'Fırsat'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helper Components
const StatusBadge = ({ status }) => {
    const config = {
        pending: { text: 'Beklemede', bg: '#FFF3CD', color: '#856404' },
        approved: { text: 'Onaylandı', bg: '#D4EDDA', color: '#155724' },
        rejected: { text: 'Reddedildi', bg: '#F8D7DA', color: '#721C24' }
    };
    const { text, bg, color } = config[status] || config.pending;
    return <span style={{ ...styles.statusBadge, background: bg, color }}>{text}</span>;
};

const InfoRow = ({ icon, label, value }) => (
    <div style={styles.infoRow}>
        <span style={styles.infoIcon}>{icon}</span>
        <span style={styles.infoLabel}>{label}:</span>
        <span style={styles.infoValue}>{value}</span>
    </div>
);

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// Modern Styles
const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem'
    },
    header: {
        background: 'white',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    logoIcon: {
        fontSize: '3rem'
    },
    title: {
        margin: 0,
        fontSize: '1.8rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    subtitle: {
        margin: '0.3rem 0 0 0',
        fontSize: '0.9rem',
        color: '#7f8c8d'
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.8rem 1.5rem',
        background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.95rem',
        transition: 'all 0.3s',
        boxShadow: '0 4px 15px rgba(235, 51, 73, 0.3)'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    statCard: {
        borderRadius: '20px',
        padding: '2rem',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        transition: 'transform 0.3s',
        cursor: 'pointer'
    },
    statIcon: {
        fontSize: '2.5rem',
        opacity: 0.9
    },
    statContent: {
        flex: 1
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '0.3rem'
    },
    statTitle: {
        fontSize: '0.95rem',
        opacity: 0.9
    },
    tabsContainer: {
        background: 'white',
        borderRadius: '20px',
        padding: '0.5rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '0.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    },
    tab: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1rem',
        background: 'transparent',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        color: '#7f8c8d',
        transition: 'all 0.3s',
        position: 'relative'
    },
    tabActive: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },
    badge: {
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        background: '#ff4757',
        color: 'white',
        borderRadius: '12px',
        padding: '0.2rem 0.6rem',
        fontSize: '0.75rem',
        fontWeight: '700'
    },
    filtersContainer: {
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    },
    filterGroup: {
        flex: 1,
        display: 'flex',
        gap: '1rem'
    },
    select: {
        padding: '0.8rem 1rem',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.3s',
        minWidth: '150px'
    },
    searchBox: {
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    searchIcon: {
        position: 'absolute',
        left: '1rem',
        color: '#7f8c8d'
    },
    searchInput: {
        width: '100%',
        padding: '0.8rem 1rem 0.8rem 3rem',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.3s'
    },
    refreshBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.8rem 1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.95rem',
        transition: 'all 0.3s',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },
    content: {
        minHeight: '400px'
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        marginTop: '1rem',
        color: '#7f8c8d',
        fontSize: '1.1rem'
    },
    empty: {
        textAlign: 'center',
        padding: '4rem',
        background: 'white',
        borderRadius: '20px',
        color: '#7f8c8d',
        fontSize: '1.2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s',
        border: '1px solid rgba(0,0,0,0.05)'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #f0f0f0'
    },
    userAvatar: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: '700'
    },
    cardHeaderInfo: {
        flex: 1
    },
    cardTitle: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#2c3e50'
    },
    cardSubtitle: {
        margin: '0.3rem 0 0 0',
        fontSize: '0.85rem',
        color: '#7f8c8d'
    },
    badges: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'flex-end'
    },
    statusBadge: {
        padding: '0.4rem 0.8rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600'
    },
    featuredBadge: {
        padding: '0.4rem 0.8rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white'
    },
    opportunityBadge: {
        padding: '0.4rem 0.8rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: 'white'
    },
    cardBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        marginBottom: '1rem'
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem'
    },
    infoIcon: {
        fontSize: '1.2rem'
    },
    infoLabel: {
        fontWeight: '600',
        color: '#7f8c8d',
        minWidth: '80px'
    },
    infoValue: {
        color: '#2c3e50'
    },
    cardActions: {
        display: 'flex',
        gap: '0.8rem',
        flexWrap: 'wrap',
        paddingTop: '1rem',
        borderTop: '2px solid #f0f0f0'
    },
    actionBtn: {
        flex: 1,
        minWidth: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.7rem 1rem',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.9rem',
        transition: 'all 0.3s',
        color: 'white'
    },
    approveBtn: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)'
    },
    rejectBtn: {
        background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
        boxShadow: '0 4px 15px rgba(235, 51, 73, 0.3)'
    },
    deleteBtn: {
        background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',
        boxShadow: '0 4px 15px rgba(192, 57, 43, 0.3)'
    },
    featureBtn: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
    },
    opportunityBtn: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
    },
    errorContainer: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '2rem'
    },
    errorIcon: {
        fontSize: '5rem',
        marginBottom: '1rem'
    },
    errorTitle: {
        fontSize: '2rem',
        marginBottom: '0.5rem'
    },
    errorText: {
        fontSize: '1.1rem',
        opacity: 0.9
    }
};

export default AdminDashboard;


// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-admin-styles]')) {
  styleSheet.setAttribute('data-admin-styles', 'true');
  document.head.appendChild(styleSheet);
}
