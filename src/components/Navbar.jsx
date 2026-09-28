import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Phone, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Menu', path: '/menu' },
  { name: 'Offers', path: '/offers' },
  { name: 'Locations', path: '/locations' },
  { name: 'About Us', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-krunch-black/95 backdrop-blur-md shadow-lg shadow-black/50 border-b border-krunch-border'
          : 'bg-transparent'
      }`}
    >
      {/* Top info bar — removed */}

      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full border-2 border-krunch-red flex items-center justify-center bg-krunch-black group-hover:border-white transition-colors duration-300">
            <span className="text-krunch-red font-heading font-black text-lg">K</span>
          </div>
          <div className="hidden sm:block">
            <div className="font-heading font-black text-xl text-white leading-none tracking-wider">
              THE <span className="text-krunch-red">KRUNCHEEZ</span>
            </div>
            <div className="text-krunch-gray text-[10px] uppercase tracking-widest">
              Fast Food, Chinese & BBQ
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link animated-underline text-sm font-semibold transition-colors duration-200 ${
                location.pathname === link.path ? 'text-krunch-red' : 'text-krunch-light hover:text-krunch-red'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white transition-all duration-200">
            <Search size={16} />
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-krunch-card border border-krunch-border hover:border-krunch-red transition-all duration-200 group"
          >
            <ShoppingCart size={18} className="text-krunch-gray group-hover:text-white transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-krunch-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-red">
                {cartCount}
              </span>
            )}
          </button>

          {/* Order Now CTA */}
          <Link
            to="/menu"
            className="hidden md:flex btn-primary btn-shine text-sm py-2.5 px-5"
          >
            Order Now
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white transition-all duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } bg-krunch-dark border-t border-krunch-border`}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`py-3 px-4 rounded-lg font-body font-semibold text-sm uppercase tracking-wider transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-krunch-red text-white'
                  : 'text-krunch-light hover:bg-krunch-card hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/menu"
            className="mt-3 btn-primary text-center text-sm"
          >
            Order Now
          </Link>
          <div className="mt-3 pt-3 border-t border-krunch-border">
            <p className="text-krunch-gray text-xs text-center">
              📞 0317-7787648 &nbsp;|&nbsp; ⏰ 11am – 2am
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
