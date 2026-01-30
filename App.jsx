import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './hooks/useAuth'
import { CONFIG } from './config'

// Admin Pages
import AdminLogin from './pages/admin/Login'
import AdminLayout from './layouts/AdminLayout'
import ProductList from './pages/admin/ProductList'
import ProductEditor from './pages/admin/ProductEditor'
import OrderList from './pages/admin/OrderList'
import OrderDetail from './pages/admin/OrderDetail'

import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Success from './pages/Success';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Admin Routes */}
            <Route path={`${CONFIG.ADMIN_PATH}/login`} element={<AdminLogin />} />
            <Route path={CONFIG.ADMIN_PATH} element={<AdminLayout />}>
              <Route index element={<Navigate to={`${CONFIG.ADMIN_PATH}/products`} replace />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/new" element={<ProductEditor />} />
              <Route path="products/:id" element={<ProductEditor />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
            </Route>

            {/* Public Routes with Navbar */}
            <Route element={
              <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                  <Outlet />
                </div>
              </>
            }>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<Success />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
