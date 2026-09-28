import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Star, Truck, Shield } from 'lucide-react';
import Hero from '../components/Hero';
import MenuCategories from '../components/MenuCategories';
import { menuItems } from '../data/menuData';
import FoodCard from '../components/FoodCard';

const features = [
  { icon: <Truck className="text-krunch-red" size={22} />, title: 'Free Delivery', desc: 'Free home delivery on all orders across Rawalpindi' },
  { icon: <Zap className="text-krunch-red" size={22} />, title: 'Fast Service', desc: '30-45 min delivery. Get it hot, get it fast.' },
  { icon: <Star className="text-krunch-red" size={22} />, title: 'Premium Quality', desc: 'Better food, happier you. Every single time.' },
  { icon: <Shield className="text-krunch-red" size={22} />, title: 'Halal Certified', desc: '100% halal. Eat with full trust & confidence.' },
];

const topDeals = menuItems.deals.slice(0, 3);
const popularItems = [
  menuItems.burgers[0],
  menuItems.pizza[0],
  menuItems.wraps[1],
  menuItems.bbq[2],
];

const HomePage = () => {
  return (
    <div className="bg-krunch-black">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <Hero />

      {/* ── FEATURES STRIP ───────────────────────────────────── */}
      <section className="bg-krunch-dark border-y border-krunch-border py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-start gap-3 group"
              >
                <div className="w-10 h-10 bg-krunch-red/10 border border-krunch-red/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-krunch-red/20 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-sm uppercase">{f.title}</h3>
                  <p className="text-krunch-gray font-body text-xs leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENU CATEGORIES ──────────────────────────────────── */}
      <MenuCategories />

      {/* ── HOT DEALS PREVIEW ────────────────────────────────── */}
      <section className="py-20 bg-krunch-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(227,30,36,0.4) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-krunch-red/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">
                Limited Time
              </span>
              <h2 className="section-title text-white">
                HOT DEALS <span className="text-krunch-red">BIGGER SMILES</span>
              </h2>
            </div>
            <Link to="/offers" className="flex items-center gap-2 text-krunch-red font-body font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors group">
              All Deals <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {topDeals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="food-card card-dark p-5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 bg-krunch-red text-white font-heading font-black text-2xl w-12 h-12 flex items-end justify-start pb-0.5 pl-1.5 rounded-bl-xl">
                  {i + 1}
                </div>
                <div className="text-3xl mb-3">🍔🍟🥤</div>
                <h3 className="font-heading font-black text-xl text-white uppercase mb-1 group-hover:text-krunch-red transition-colors">{deal.name}</h3>
                <p className="text-krunch-gray font-body text-xs mb-4 leading-relaxed line-clamp-2">{deal.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-2xl text-krunch-red">Rs. {deal.price.toLocaleString()}</span>
                  <Link to="/offers" className="flex items-center gap-1.5 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-bold text-xs px-3 py-2 rounded-lg transition-colors">
                    Order <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Deal highlight banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 bg-gradient-to-r from-krunch-red to-krunch-darkred rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <p className="font-heading font-black text-2xl text-white uppercase">2 Zinger Burgers + Fries + Drink</p>
              <p className="text-red-200 font-body text-sm mt-0.5">Save Rs. 350 on this combo!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-red-200 font-body text-sm line-through">Rs. 1,350</div>
                <div className="font-heading font-black text-3xl text-white">Rs. 999</div>
              </div>
              <Link to="/offers" className="bg-white text-krunch-red font-heading font-black text-sm px-5 py-3 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-wider whitespace-nowrap">
                Order Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── POPULAR PICKS ────────────────────────────────────── */}
      <section className="py-20 bg-krunch-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">
                Fan Favorites
              </span>
              <h2 className="section-title text-white">
                MOST <span className="text-krunch-red">POPULAR</span>
              </h2>
            </div>
            <Link to="/menu" className="flex items-center gap-2 text-krunch-red font-body font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors group">
              Full Menu <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {popularItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <FoodCard item={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS / SOCIAL PROOF ──────────────────────── */}
      <section className="py-16 bg-krunch-dark border-y border-krunch-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">What People Say</span>
            <h2 className="section-title text-white">CUSTOMER <span className="text-krunch-red">LOVE</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Ali Hassan', text: "Best burgers in Rawalpindi, hands down! The zinger burger is absolutely FIRE 🔥", stars: 5, item: 'Zinger Burger' },
              { name: 'Sarah Malik', text: "The KrunchEez Special pizza is mind-blowing. Cheesy, fresh, and loaded. Ordered 3 times this week!", stars: 5, item: 'KrunchEez Special Pizza' },
              { name: 'Ahmed Raza', text: "BBQ platters are incredible. The Karachi Angara is the spiciest and most delicious thing I've had!", stars: 5, item: 'Karachi Angara' },
            ].map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-dark p-5 group hover:border-krunch-red/40 transition-all"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(r.stars)].map((_, s) => (
                    <Star key={s} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-krunch-light font-body text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-krunch-border">
                  <div>
                    <p className="font-body font-bold text-white text-sm">{r.name}</p>
                    <p className="text-krunch-gray font-body text-xs">{r.item}</p>
                  </div>
                  <div className="text-xl">⭐</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-20 bg-krunch-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(227,30,36,0.08)_0%,transparent_70%)]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-6xl mb-5">🔥</div>
            <h2 className="section-title text-white mb-3">
              HUNGER CAN'T <span className="text-krunch-red">WAIT.</span>
            </h2>
            <p className="text-krunch-gray font-body text-base mb-8 max-w-md mx-auto">
              Order now and experience the boldest flavors Rawalpindi has to offer. Fresh. Hot. Delivered to your door.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/menu" className="btn-primary btn-shine flex items-center gap-2 text-base px-8 py-4 shadow-red-glow">
                Order Now <ArrowRight size={20} />
              </Link>
              <Link to="/offers" className="btn-outline flex items-center gap-2 text-base px-8 py-4">
                View Deals
              </Link>
            </div>
            <p className="text-krunch-gray font-body text-xs mt-6">
              🛵 Free delivery &nbsp;•&nbsp; ✅ Halal &nbsp;•&nbsp; ⏰ Open till 2am
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
