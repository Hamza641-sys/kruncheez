import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/auth/ProtectedRoute';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';

// Public Pages
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import OffersPage from './pages/OffersPage';
import AboutPage from './pages/AboutPage';
import LocationsPage from './pages/LocationsPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Customer Pages
import DashboardPage from './pages/customer/DashboardPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import TrackOrderPage from './pages/customer/TrackOrderPage';
import AddressesPage from './pages/customer/AddressesPage';
import LoyaltyPage from './pages/customer/LoyaltyPage';
import ReviewPage from './pages/customer/ReviewPage';
import ProfilePage from './pages/customer/ProfilePage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMenu from './pages/admin/AdminMenu';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminPromos from './pages/admin/AdminPromos';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Public layout (with navbar + footer)
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <CartSidebar />
    {children}
    <Footer />
  </>
);

const AppLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>

        {/* ── PUBLIC ROUTES (with navbar/footer) ── */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/menu" element={<PublicLayout><MenuPage /></PublicLayout>} />
        <Route path="/offers" element={<PublicLayout><OffersPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/locations" element={<PublicLayout><LocationsPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        {/* Checkout — needs login */}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <PublicLayout><CheckoutPage /></PublicLayout>
          </ProtectedRoute>
        } />

        {/* ── AUTH ROUTES (no navbar) ── */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* ── CUSTOMER ROUTES (protected) ── */}
        <Route path="/dashboard" element={<ProtectedRoute><PublicLayout><DashboardPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><PublicLayout><MyOrdersPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/track/:orderId" element={<ProtectedRoute><PublicLayout><TrackOrderPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><PublicLayout><AddressesPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/loyalty" element={<ProtectedRoute><PublicLayout><LoyaltyPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/review/:orderId" element={<ProtectedRoute><PublicLayout><ReviewPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PublicLayout><ProfilePage /></PublicLayout></ProtectedRoute>} />

        {/* ── ADMIN ROUTES (admin only) ── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="promos"    element={<AdminPromos />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings"  element={<AdminSettings />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={
          <div className="min-h-screen bg-krunch-black flex items-center justify-center text-center px-4">
            <div>
              <div className="text-8xl mb-4">🍔</div>
              <h1 className="font-heading font-black text-6xl text-white uppercase mb-3">404</h1>
              <p className="text-krunch-gray font-body text-base mb-6">Oops! This page doesn't exist.</p>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </div>
        } />
      </Routes>

      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </>
  );
};

function App() {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppLayout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
