import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
// Navbar moved to root `src/components` (single source of truth)
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import CreateAd from './pages/CreateAd';
import ProductDetail from './pages/ProductDetail';
import NewAdminPanel from './components/NewAdminPanel';
import AdminApprovalDashboard from './components/AdminApprovalDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Footer from './components/Footer';
import GuestListingForm from './components/GuestListingForm';
import GuestListingManagement from './components/GuestListingManagement';
import ListingSuccess from './pages/ListingSuccess';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <DataProvider>
          <Router>
            <div className="App">
              {/* PWA Bileşenleri */}
              <OfflineIndicator />
              <InstallPrompt />
              
              {/* KöydenAL Brand Header */}
              <div className="bg-success text-white py-2 text-center">
                <h1 className="display-6 fw-bold mb-0">🌾 KöydenAL</h1>
                <p className="mb-0">Doğrudan Çiftçiden Tüketiciye</p>
              </div>

              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/urunler" element={<Products />} />
                <Route path="/ilan-ver" element={<CreateAd />} />
                <Route path="/misafir-ilan-ver" element={<GuestListingForm />} />
                <Route path="/ilan-basarili" element={<ListingSuccess />} />
                <Route path="/ilan-detay/:id" element={<ProductDetail />} />
                <Route path="/ilan-yonetim/:listingId" element={<GuestListingManagement />} />
                <Route path="/admin" element={<NewAdminPanel />} />
                <Route path="/admin/onay" element={<AdminApprovalDashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
              <Footer />
            </div>
          </Router>
        </DataProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
