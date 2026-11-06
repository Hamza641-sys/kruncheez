import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import LogoCircle from './LogoCircle';
import { useRestaurantSettings } from '../hooks/useRestaurantSettings';

const quickLinks = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  { label: 'Offers', path: '/offers' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Locations', path: '/locations' },
];

const menuHighlights = [
  { label: 'Burgers', path: '/menu' },
  { label: 'BBQ & Platters', path: '/menu' },
  { label: 'Pizza', path: '/menu' },
  { label: 'Wraps & Rolls', path: '/menu' },
  { label: 'Chinese', path: '/menu' },
  { label: 'Deals', path: '/offers' },
];

const Footer = () => {
  const s = useRestaurantSettings();
  const phones = [s.phone1, s.phone2, s.phone3].filter(Boolean);
  return (
    <footer className="bg-krunch-dark border-t border-krunch-border">

      {/* CTA Strip */}
      <div className="bg-krunch-red py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-heading font-black text-xl text-white uppercase">
              Ready to Order? 🔥
            </p>
            <p className="text-red-200 font-body text-sm">Free home delivery on all orders</p>
          </div>
          <div className="flex gap-3">
            <Link to="/menu" className="bg-white text-krunch-red font-heading font-black text-sm px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors uppercase tracking-wider">
              Order Online
            </Link>
            <a href="tel:03177787648" className="border-2 border-white text-white font-heading font-bold text-sm px-5 py-2.5 rounded-full hover:bg-white hover:text-krunch-red transition-colors uppercase tracking-wider">
              Call Now
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 footer-grid">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-5">
              <LogoCircle size="lg" />
              <div>
                <div className="font-heading font-black text-xl text-white leading-none">
                  THE <span className="text-krunch-red">THE KRUNCHEEZ</span>
                </div>
                <div className="text-krunch-gray text-[10px] uppercase tracking-widest mt-0.5">
                  Fast Food • Chinese • BBQ
                </div>
              </div>
            </div>

            <p className="text-krunch-gray font-body text-sm leading-relaxed mb-5">
              The ultimate destination for bold flavors, fresh ingredients, and unforgettable food experiences in Peshawar.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[
                {
                  label: 'Instagram', hover: 'hover:bg-pink-600', url: 'https://www.instagram.com/theTHE KRUNCHEEZ',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                },
                {
                  label: 'Facebook', hover: 'hover:bg-blue-600', url: 'https://www.facebook.com/theTHE KRUNCHEEZ',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                },
                {
                  label: 'TikTok', hover: 'hover:bg-neutral-700', url: 'https://www.tiktok.com/@thekruncheez',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>
                },
                {
                  label: 'YouTube', hover: 'hover:bg-red-700', url: 'https://www.youtube.com/@thekruncheez',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                },
              ].map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  title={s.label}
                  className={`w-9 h-9 rounded-xl bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-transparent ${s.hover} transition-all duration-200`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-heading font-bold text-white uppercase text-sm tracking-widest mb-5">Explore</h4>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-krunch-gray hover:text-white font-body text-sm transition-colors group"
                  >
                    <ArrowRight size={12} className="text-krunch-red opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu */}
          <div>
            <h4 className="font-heading font-bold text-white uppercase text-sm tracking-widest mb-5">Menu</h4>
            <ul className="flex flex-col gap-2.5">
              {menuHighlights.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-krunch-gray hover:text-white font-body text-sm transition-colors group"
                  >
                    <ArrowRight size={12} className="text-krunch-red opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-white uppercase text-sm tracking-widest mb-5">Location</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-krunch-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-body text-xs font-semibold">Main Branch</p>
                  <p className="text-krunch-gray font-body text-xs leading-relaxed">{s.address}</p>
                </div>
              </div>
              <div className="h-px bg-krunch-border" />
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-krunch-red flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  {phones.map(p => (
                    <a key={p} href={`tel:${p.replace(/-/g,'')}`} className="text-krunch-gray hover:text-white font-body text-xs transition-colors">{p}</a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-krunch-red flex-shrink-0" />
                <p className="text-krunch-gray font-body text-xs">
                  {s.openTime ? `${s.openTime} – ${s.closeTime} (Daily)` : '11:00 AM – 2:00 AM (Daily)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-krunch-border">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-krunch-gray font-body text-xs text-center sm:text-left">
            © {new Date().getFullYear()} The KrunchEez. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-krunch-gray font-body text-xs">Real Food. Real Passion.</span>
          </div>
          <div className="flex gap-4">
            <Link to="/contact" className="text-krunch-gray hover:text-white font-body text-xs transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="text-krunch-gray hover:text-white font-body text-xs transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


