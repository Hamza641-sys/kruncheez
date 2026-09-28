import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Navigation, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const locations = [
  {
    id: 1,
    name: 'Boatclub Road — Main Branch',
    address: 'New Officers Housing Society, Boatclub Road, Rawalpindi',
    phone: ['0317-7787648', '0308-4509090', '0335-6609178'],
    hours: '11:00 AM – 2:00 AM',
    tag: 'MAIN BRANCH',
    tagColor: 'bg-krunch-red',
    emoji: '🏠',
    mapLink: 'https://maps.google.com/?q=New+Officers+Housing+Society+Boatclub+Road+Rawalpindi',
    features: ['Dine In', 'Take Away', 'Home Delivery', 'Parking'],
  },
  {
    id: 2,
    name: 'Bahria Town Branch',
    address: 'Bahria Town, Rawalpindi',
    phone: ['0317-7787648'],
    hours: '11:00 AM – 2:00 AM',
    tag: 'BRANCH',
    tagColor: 'bg-amber-600',
    emoji: '🏢',
    mapLink: 'https://maps.google.com/?q=Bahria+Town+Rawalpindi',
    features: ['Dine In', 'Take Away', 'Home Delivery'],
  },
  {
    id: 3,
    name: 'Chaklala Branch',
    address: 'Chaklala, Rawalpindi',
    phone: ['0308-4509090'],
    hours: '11:00 AM – 2:00 AM',
    tag: 'BRANCH',
    tagColor: 'bg-amber-600',
    emoji: '🏬',
    mapLink: 'https://maps.google.com/?q=Chaklala+Rawalpindi',
    features: ['Dine In', 'Take Away', 'Home Delivery'],
  },
];

const LocationsPage = () => {
  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">

      {/* Header */}
      <div className="relative bg-krunch-dark border-b border-krunch-border py-14 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(227,30,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(227,30,36,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-krunch-red/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-3 block">
              Find Us
            </span>
            <h1 className="section-title text-white mb-3">
              OUR <span className="text-krunch-red">LOCATIONS</span>
            </h1>
            <p className="text-krunch-gray font-body text-base max-w-md mx-auto">
              3 convenient locations across Rawalpindi — always close to your craving.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Locations Cards */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {locations.map((loc, index) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="card-dark p-6 group hover:border-krunch-red/50 transition-all duration-300 relative overflow-hidden"
            >
              {/* Tag */}
              <div className={`absolute top-4 right-4 ${loc.tagColor} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>
                {loc.tag}
              </div>

              {/* Emoji */}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {loc.emoji}
              </div>

              <h3 className="font-heading font-bold text-xl text-white uppercase mb-3 group-hover:text-krunch-red transition-colors leading-tight">
                {loc.name}
              </h3>

              {/* Address */}
              <div className="flex items-start gap-2 mb-4">
                <MapPin size={15} className="text-krunch-red flex-shrink-0 mt-0.5" />
                <p className="text-krunch-gray font-body text-sm leading-relaxed">{loc.address}</p>
              </div>

              {/* Phone numbers */}
              <div className="flex flex-col gap-1 mb-4">
                {loc.phone.map((p, i) => (
                  <a key={i} href={`tel:${p.replace(/-/g, '')}`} className="flex items-center gap-2 text-krunch-light hover:text-krunch-red transition-colors font-body text-sm">
                    <Phone size={13} className="text-krunch-red" />
                    {p}
                  </a>
                ))}
              </div>

              {/* Hours */}
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} className="text-krunch-red" />
                <span className="text-krunch-light font-body text-sm">{loc.hours}</span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-5">
                {loc.features.map((f, i) => (
                  <span key={i} className="text-xs bg-krunch-black border border-krunch-border text-krunch-gray px-2.5 py-1 rounded-lg font-body">
                    {f}
                  </span>
                ))}
              </div>

              {/* Get directions */}
              <a
                href={loc.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-red-glow w-full justify-center"
              >
                <Navigation size={15} />
                Get Directions
              </a>

              {/* Hover glow */}
              <div className="absolute inset-0 border-2 border-krunch-red/0 group-hover:border-krunch-red/20 rounded-xl transition-all duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Map embed placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-dark overflow-hidden"
        >
          <div className="p-5 border-b border-krunch-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-krunch-red" />
              <h3 className="font-heading font-bold text-lg text-white uppercase">Main Branch — Boatclub Road</h3>
            </div>
            <a
              href="https://maps.google.com/?q=New+Officers+Housing+Society+Boatclub+Road+Rawalpindi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-krunch-red font-body text-sm font-semibold hover:text-white transition-colors"
            >
              Open in Maps <ArrowRight size={14} />
            </a>
          </div>
          <div className="relative bg-krunch-dark h-80 flex items-center justify-center overflow-hidden">
            {/* Google Maps iframe */}
            <iframe
              title="KrunchEez Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.0!2d73.0!3d33.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sNew+Officers+Housing+Society%2C+Boatclub+Rd%2C+Rawalpindi!5e0!3m2!1sen!2s!4v1000000000000"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
          </div>
        </motion.div>

        {/* Delivery info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 bg-gradient-to-r from-krunch-red/10 to-krunch-dark border border-krunch-red/20 rounded-2xl p-6 text-center"
        >
          <div className="text-3xl mb-2">🛵</div>
          <h3 className="font-heading font-bold text-xl text-white uppercase mb-1">Free Home Delivery</h3>
          <p className="text-krunch-gray font-body text-sm">
            We deliver fresh & hot to your doorstep. Call us or order online!
          </p>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            Order Now <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationsPage;
