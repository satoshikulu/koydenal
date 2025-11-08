import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
// Navbar moved to root `src/components` (single source of truth)
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Eager loading - Ana sayfalar
import Home from './pages/Home';
import Products from './pages/Products';

// Lazy loading - Daha az kullanılan sayfalar
const CreateAd = lazy(() => import('./pages/CreateAd'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ListingSuccess = lazy(() => import('./pages/ListingSuccess'));

// Lazy loading - Admin panelleri (büyük bileşenler)
const NewAdminPanel = lazy(() => import('./components/NewAdminPanel'));
const AdminApprovalDashboard = lazy(() => import('./components/AdminApprovalDashboard'));

// GuestListingForm kaldırıldı - CreateAd zaten misafir kullanıcıları destekliyor

// Lazy loading - Test bileşenleri
const TestEnv = lazy(() => import('./components/TestEnv'));
const TestSupabase = lazy(() => import('./components/TestSupabase'));

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    fontSize: '1.2rem',
    color: '#667eea'
  }}>
    <div>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
      <div>Yükleniyor...</div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <DataProvider>
          <Router>
            <div className="App">
              {/* KöydenAL Brand Header */}
              <div className="bg-success text-white py-2 text-center">
                <h1 className="display-6 fw-bold mb-0">🌾 KöydenAL</h1>
                <p className="mb-0">Doğrudan Çiftçiden Tüketiciye</p>
              </div>

              <Navbar />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/urunler" element={<Products />} />
                  <Route path="/ilan-ver" element={<CreateAd />} />
                  <Route path="/ilan-basarili" element={<ListingSuccess />} />
                  <Route path="/ilan-detay/:id" element={<ProductDetail />} />
                  <Route path="/admin" element={<NewAdminPanel />} />
                  <Route path="/admin/onay" element={<AdminApprovalDashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/test-env" element={<TestEnv />} />
                  <Route path="/test-supabase" element={<TestSupabase />} />
                </Routes>
              </Suspense>
              <Footer />
            </div>
          </Router>
        </DataProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
