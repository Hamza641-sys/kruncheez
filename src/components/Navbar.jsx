import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Menu, X, Search, User,
  LogOut, LayoutDashboard, ShoppingBag,
  MapPin, Gift, Settings, ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { name: 'Home',      path: '/' },
  { name: 'Menu',      path: '/menu' },
  { name: 'Offers',    path: '/offers' },
  { name: 'Locations', path: '/locations' },
  { name: 'About Us',  path: '/about' },
  { name: 'Contact',   path: '/contact' },
];

const Navbar = () => {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { user, userData, isAdmin, logout } = useAuth();
  const location  = useLocation();
  const dropRef   = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await logout(); setDropdownOpen(false); };

  const avatar = userData?.name?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || '?';
  const displayName = userData?.name || user?.displayName || 'Account';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-krunch-black/95 backdrop-blur-md shadow-lg shadow-black/50 border-b border-krunch-border'
        : 'bg-transparent'
    }`}>

      {/* ── MAIN NAV ── */}
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-11 h-11 rounded-full border-2 border-krunch-red flex items-center justify-center bg-krunch-black group-hover:border-white transition-colors duration-300">
            <span className="text-krunch-red font-heading font-black text-base">K</span>
          </div>
          <div className="hidden sm:block">
            <div className="font-heading font-black text-lg text-white leading-none tracking-wider">
              THE <span className="text-krunch-red">KRUNCHEEZ</span>
            </div>
            <div className="text-krunch-gray text-[9px] uppercase tracking-widest">
              Fast Food, Chinese & BBQ
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={`text-sm font-body font-semibold uppercase tracking-wider transition-colors duration-200 animated-underline ${
                location.pathname === link.path
                  ? 'text-krunch-red'
                  : 'text-krunch-light hover:text-krunch-red'
              }`}>
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">

          {/* Cart */}
          <button onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-krunch-card border border-krunch-border hover:border-krunch-red transition-all duration-200 group">
            <ShoppingCart size={16} className="text-krunch-gray group-hover:text-white transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-krunch-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* ── AUTH SECTION ── */}
          {user ? (
            /* Logged in — show user dropdown */
            <div className="relative hidden md:block" ref={dropRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-krunch-card border border-krunch-border hover:border-krunch-red rounded-full pl-1 pr-3 py-1 transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-sm flex-shrink-0">
                  {avatar}
                </div>
                <span className="text-white font-body text-xs font-semibold max-w-[80px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={13} className={`text-krunch-gray transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-krunch-dark border border-krunch-border rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-krunch-border bg-krunch-black">
                      <p className="text-white font-body font-semibold text-sm truncate">{displayName}</p>
                      <p className="text-krunch-gray font-body text-xs truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] bg-krunch-red/20 text-krunch-red border border-krunch-red/30 px-2 py-0.5 rounded font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                        <LayoutDashboard size={15} className="text-krunch-red" />
                        My Dashboard
                      </Link>
                      <Link to="/my-orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                        <ShoppingBag size={15} className="text-blue-400" />
                        My Orders
                      </Link>
                      <Link to="/addresses"
                        className="flex items-center gap-3 px-4 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                        <MapPin size={15} className="text-green-400" />
                        Saved Addresses
                      </Link>
                      <Link to="/loyalty"
                        className="flex items-center gap-3 px-4 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                        <Gift size={15} className="text-amber-400" />
                        Loyalty Points
                        {userData?.loyaltyPoints > 0 && (
                          <span className="ml-auto text-amber-400 font-bold text-xs">{userData.loyaltyPoints}</span>
                        )}
                      </Link>
                      <Link to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                        <User size={15} className="text-purple-400" />
                        My Profile
                      </Link>

                      {/* Admin link — only for admins */}
                      {isAdmin && (
                        <>
                          <div className="h-px bg-krunch-border mx-4 my-1" />
                          <Link to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-krunch-red hover:text-white hover:bg-krunch-red/10 transition-all font-body text-sm font-semibold">
                            <Settings size={15} />
                            Admin Panel
                          </Link>
                        </>
                      )}

                      <div className="h-px bg-krunch-border mx-4 my-1" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-krunch-gray hover:text-red-400 hover:bg-red-400/5 transition-all font-body text-sm">
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Not logged in — show Login + Signup */
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login"
                className="flex items-center gap-1.5 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition-all duration-200">
                <User size={13} />
                Login
              </Link>
              <Link to="/signup"
                className="flex items-center gap-1.5 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition-all duration-200 shadow-red-glow">
                Sign Up
              </Link>
            </div>
          )}

          {/* Order Now — desktop */}
          <Link to="/menu"
            className="hidden lg:flex btn-primary btn-shine text-xs py-2.5 px-4">
            Order Now
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white transition-all duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-krunch-dark border-t border-krunch-border overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path}
                  className={`py-3 px-4 rounded-xl font-body font-semibold text-sm uppercase tracking-wider transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-krunch-red text-white'
                      : 'text-krunch-light hover:bg-krunch-card hover:text-white'
                  }`}>
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-krunch-border my-2" />

              {user ? (
                /* Logged in mobile */
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-krunch-card rounded-xl mb-1">
                    <div className="w-9 h-9 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-sm flex-shrink-0">
                      {avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-body font-semibold text-sm truncate">{displayName}</p>
                      <p className="text-krunch-gray font-body text-xs truncate">{user.email}</p>
                    </div>
                    {isAdmin && <span className="ml-auto text-[10px] bg-krunch-red text-white px-2 py-0.5 rounded font-bold">ADMIN</span>}
                  </div>

                  <Link to="/dashboard"
                    className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                    <LayoutDashboard size={15} className="text-krunch-red" /> Dashboard
                  </Link>
                  <Link to="/my-orders"
                    className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                    <ShoppingBag size={15} className="text-blue-400" /> My Orders
                  </Link>
                  <Link to="/loyalty"
                    className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-krunch-gray hover:text-white hover:bg-krunch-card transition-all font-body text-sm">
                    <Gift size={15} className="text-amber-400" /> Loyalty Points
                  </Link>
                  {isAdmin && (
                    <Link to="/admin"
                      className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-krunch-red font-semibold hover:bg-krunch-red/10 transition-all font-body text-sm">
                      <Settings size={15} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-body text-sm mt-1">
                    <LogOut size={15} /> Logout
                  </button>
                </>
              ) : (
                /* Not logged in mobile */
                <div className="flex flex-col gap-2 mt-1">
                  <Link to="/login"
                    className="flex items-center justify-center gap-2 border border-krunch-border text-white font-body font-semibold text-sm py-3 rounded-xl hover:border-krunch-red transition-all">
                    <User size={15} /> Login
                  </Link>
                  <Link to="/signup"
                    className="flex items-center justify-center gap-2 bg-krunch-red text-white font-body font-semibold text-sm py-3 rounded-xl hover:bg-krunch-darkred transition-all">
                    Sign Up Free
                  </Link>
                </div>
              )}

              <Link to="/menu" className="mt-2 btn-primary text-center text-sm">
                Order Now
              </Link>

              <div className="mt-3 pt-3 border-t border-krunch-border">
                <p className="text-krunch-gray text-xs text-center">
                  📞 0317-7787648 &nbsp;|&nbsp; ⏰ 11am – 2am
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
