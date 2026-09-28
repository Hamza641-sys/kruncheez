import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Flame, Heart, Star, Users, Clock, ArrowRight } from 'lucide-react';

const values = [
  { icon: <Flame className="text-krunch-red" size={24} />, title: 'Bold Flavors', desc: 'Every recipe crafted for maximum taste. No compromise on flavor, ever.' },
  { icon: <Heart className="text-krunch-red" size={24} />, title: 'Fresh Ingredients', desc: 'We source only the freshest ingredients daily to guarantee quality in every bite.' },
  { icon: <Award className="text-krunch-red" size={24} />, title: 'Halal Certified', desc: '100% halal certified. You eat with full trust and confidence.' },
  { icon: <Star className="text-krunch-red" size={24} />, title: 'World Class Quality', desc: 'Premium food at accessible prices. Fine dining taste, fast food speed.' },
];

const stats = [
  { value: '50,000+', label: 'Happy Customers' },
  { value: '100+', label: 'Menu Items' },
  { value: '3+', label: 'Locations' },
  { value: '5★', label: 'Avg Rating' },
];

const team = [
  { name: 'Head Chef', role: 'Culinary Expert', emoji: '👨‍🍳' },
  { name: 'Pitmaster', role: 'BBQ Specialist', emoji: '🔥' },
  { name: 'Pizza Chef', role: 'Pizza Artisan', emoji: '🍕' },
  { name: 'Delivery Team', role: 'Speed & Freshness', emoji: '🛵' },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">

      {/* Hero Banner */}
      <div className="relative bg-krunch-dark border-b border-krunch-border py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(227,30,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(227,30,36,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-krunch-red/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-3 block">
                Our Story
              </span>
              <h1 className="section-title text-white mb-5">
                REAL FOOD. <br />
                <span className="text-krunch-red">REAL PASSION.</span>
              </h1>
              <p className="text-krunch-gray font-body text-base leading-relaxed mb-4">
                The KrunchEez was born from a simple obsession — making food that doesn't just fill your stomach, but blows your mind. We combined the finest fast food, authentic Chinese, and bold BBQ under one roof to create something truly one-of-a-kind.
              </p>
              <p className="text-krunch-gray font-body text-base leading-relaxed mb-6">
                Based in Rawalpindi, we've quickly become the go-to destination for food lovers who refuse to settle for ordinary. Every item on our menu is a statement — fresh ingredients, bold flavors, and unmatched quality.
              </p>
              <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
                Explore Menu <ArrowRight size={18} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Logo display */}
              <div className="relative w-72 h-72 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-krunch-red/30 animate-pulse" />
                <div className="absolute inset-4 rounded-full border border-krunch-red/20" />
                <div className="absolute inset-8 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-heading font-black text-4xl text-white leading-none">THE</div>
                    <div className="font-heading font-black text-5xl text-krunch-red leading-none">KRUNCHEEZ</div>
                    <div className="text-krunch-gray text-xs font-body uppercase tracking-widest mt-2">Fast Food • Chinese • BBQ</div>
                    <div className="text-3xl mt-3">🐂🔥</div>
                  </div>
                </div>
              </div>

              {/* Floating stats */}
              {stats.map((s, i) => {
                const positions = [
                  'absolute -top-4 -right-4',
                  'absolute top-1/2 -right-8 -translate-y-1/2',
                  'absolute -bottom-4 -left-4',
                  'absolute top-1/2 -left-8 -translate-y-1/2',
                ];
                return (
                  <motion.div
                    key={i}
                    animate={{ y: [0, i % 2 === 0 ? -6 : 6, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i * 0.5, ease: 'easeInOut' }}
                    className={`${positions[i]} bg-krunch-card border border-krunch-border rounded-xl px-3 py-2 text-center shadow-card hidden sm:block`}
                  >
                    <div className="font-heading font-black text-xl text-krunch-red">{s.value}</div>
                    <div className="font-body text-xs text-krunch-gray whitespace-nowrap">{s.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-krunch-red py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-heading font-black text-3xl text-white">{s.value}</div>
                <div className="font-body text-sm text-red-200 uppercase tracking-wider mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">
            What We Stand For
          </span>
          <h2 className="section-title text-white">
            OUR <span className="text-krunch-red">VALUES</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card-dark p-6 group hover:border-krunch-red/50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-krunch-red/10 border border-krunch-red/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-krunch-red/20 transition-colors">
                {v.icon}
              </div>
              <h3 className="font-heading font-bold text-lg text-white uppercase mb-2 group-hover:text-krunch-red transition-colors">
                {v.title}
              </h3>
              <p className="text-krunch-gray font-body text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-krunch-dark border-y border-krunch-border py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">
              Behind the Magic
            </span>
            <h2 className="section-title text-white">
              OUR <span className="text-krunch-red">TEAM</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card-dark p-6 text-center group hover:border-krunch-red/50 transition-all"
              >
                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {t.emoji}
                </div>
                <h3 className="font-heading font-bold text-white text-lg uppercase">{t.name}</h3>
                <p className="text-krunch-gray font-body text-xs mt-1">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title text-white mb-4">
            TASTE THE <span className="text-krunch-red">DIFFERENCE</span>
          </h2>
          <p className="text-krunch-gray font-body text-base mb-8 max-w-md mx-auto">
            Come visit us or order online — experience the flavor that has everyone talking.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/menu" className="btn-primary flex items-center gap-2">
              Order Now <ArrowRight size={18} />
            </Link>
            <Link to="/locations" className="btn-outline flex items-center gap-2">
              Find Us <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
