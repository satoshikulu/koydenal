import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import CreateAd from './pages/CreateAd';
import ProductDetail from './pages/ProductDetail';
import Footer from './components/Footer';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="App">
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
            <Route path="/ilan-detay/:id" element={<ProductDetail />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
