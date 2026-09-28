import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Instagram, Facebook, ArrowRight, Mail } from 'lucide-react';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full border-2 border-krunch-red flex items-center justify-center bg-krunch-black">
                <span className="text-krunch-red font-heading font-black text-lg">K</span>
              </div>
              <div>
                <div className="font-heading font-black text-xl text-white leading-none">
                  THE <span className="text-krunch-red">KRUNCHEEZ</span>
                </div>
                <div className="text-krunch-gray text-[10px] uppercase tracking-widest mt-0.5">
                  Fast Food • Chinese • BBQ
                </div>
              </div>
            </div>

            <p className="text-krunch-gray font-body text-sm leading-relaxed mb-5">
              The ultimate destination for bold flavors, fresh ingredients, and unforgettable food experiences in Rawalpindi.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { icon: <Instagram size={16} />, label: 'Instagram', hover: 'hover:bg-pink-600' },
                { icon: <Facebook size={16} />, label: 'Facebook', hover: 'hover:bg-blue-600' },
                { icon: <span className="text-xs font-black">TT</span>, label: 'TikTok', hover: 'hover:bg-neutral-800' },
                { icon: <span className="text-xs font-black">YT</span>, label: 'YouTube', hover: 'hover:bg-red-700' },
              ].map((s, i) => (
                <button
                  key={i}
                  title={s.label}
                  className={`w-9 h-9 rounded-xl bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-transparent ${s.hover} transition-all duration-200`}
                >
                  {s.icon}
                </button>
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
            <h4 className="font-heading font-bold text-white uppercase text-sm tracking-widest mb-5">Our Locations</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-krunch-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-body text-xs font-semibold">Main Branch</p>
                  <p className="text-krunch-gray font-body text-xs leading-relaxed">New Officers Housing Society, Boatclub Road, Rawalpindi</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-krunch-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-body text-xs font-semibold">Bahria Town</p>
                  <p className="text-krunch-gray font-body text-xs">Bahria Town, Rawalpindi</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-krunch-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-body text-xs font-semibold">Chaklala</p>
                  <p className="text-krunch-gray font-body text-xs">Chaklala, Rawalpindi</p>
                </div>
              </div>
              <div className="h-px bg-krunch-border" />
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-krunch-red flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  {['0317-7787648', '0308-4509090', '0335-6609178'].map(p => (
                    <a key={p} href={`tel:${p.replace(/-/g,'')}`} className="text-krunch-gray hover:text-white font-body text-xs transition-colors">{p}</a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-krunch-red flex-shrink-0" />
                <p className="text-krunch-gray font-body text-xs">11:00 AM – 2:00 AM (Daily)</p>
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
            <span className="text-2xl">🐂🔥</span>
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
