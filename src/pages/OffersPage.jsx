import { motion } from 'framer-motion';
import { ShoppingCart, Zap, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuItems } from '../data/menuData';
import toast from 'react-hot-toast';

const dealColors = [
  'from-red-900/30 to-krunch-card',
  'from-orange-900/20 to-krunch-card',
  'from-red-900/30 to-krunch-card',
  'from-amber-900/20 to-krunch-card',
  'from-red-900/30 to-krunch-card',
  'from-orange-900/20 to-krunch-card',
  'from-red-900/30 to-krunch-card',
  'from-amber-900/20 to-krunch-card',
  'from-red-900/30 to-krunch-card',
  'from-orange-900/20 to-krunch-card',
];

const dealEmojis = ['🍔🍟🥤', '🍕🍗🍟', '🌯🍗🥤', '🍔🌯🍗', '🍕🍔🍗', '🍕🍗🍟', '🍔🍟🌯', '🍕🥤', '🍕🥤', '🍕🥤'];

const savingsMap = {
  'd1': 150, 'd2': 220, 'd3': 280, 'd4': 350,
  'd5': 450, 'd6': 500, 'd7': 650, 'd8': 300,
  'd9': 400, 'd10': 580,
};

const OffersPage = () => {
  const { addToCart } = useCart();
  const deals = menuItems.deals;

  const handleAdd = (deal) => {
    addToCart(deal);
    toast.success(`${deal.name} added to cart!`, {
      style: {
        background: '#1A1A1A',
        color: '#fff',
        border: '1px solid #E31E24',
        borderRadius: '12px',
      },
      iconTheme: { primary: '#E31E24', secondary: '#fff' },
    });
  };

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      {/* Page Header */}
      <div className="relative bg-krunch-dark border-b border-krunch-border py-14 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(227,30,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(227,30,36,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-krunch-red/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-krunch-red/20 border border-krunch-red/40 rounded-full px-5 py-2 mb-5">
              <Zap size={16} className="text-krunch-red" />
              <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest">
                Exclusive Deals
              </span>
            </div>
            <h1 className="section-title text-white mb-3">
              HOT DEALS <span className="text-krunch-red">BIGGER SMILES</span>
            </h1>
            <p className="text-krunch-gray font-body text-base max-w-lg mx-auto">
              10 exclusive combo deals crafted for every craving. Save big, eat bigger. Limited time offers!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-krunch-red py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Active Deals', value: '10' },
              { label: 'Max Savings', value: 'Rs. 650' },
              { label: 'Free Delivery', value: 'On All Deals' },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-heading font-black text-xl text-white">{s.value}</div>
                <div className="font-body text-xs text-red-200 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal, index) => {
            const savings = savingsMap[deal.id] || 200;
            const items = deal.description.split(' + ');

            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                whileHover={{ y: -4 }}
                className={`food-card card-dark bg-gradient-to-br ${dealColors[index]} relative overflow-hidden group`}
              >
                {/* Deal number badge */}
                <div className="absolute top-0 right-0 bg-krunch-red text-white font-heading font-black text-3xl w-16 h-16 flex items-end justify-start pb-1 pl-2 rounded-bl-2xl">
                  {index + 1}
                </div>

                {/* Badge */}
                {deal.badge && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {deal.badge}
                  </div>
                )}

                {/* Content */}
                <div className="p-5 pt-6">
                  {/* Emoji */}
                  <div className="text-4xl mb-3 select-none">{dealEmojis[index]}</div>

                  <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wide mb-1 group-hover:text-krunch-red transition-colors">
                    {deal.name}
                  </h3>

                  {/* Items list */}
                  <div className="mt-3 mb-4 space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-krunch-light text-sm font-body">
                        <span className="w-1.5 h-1.5 bg-krunch-red rounded-full flex-shrink-0" />
                        {item.trim()}
                      </div>
                    ))}
                  </div>

                  {/* Savings tag */}
                  <div className="inline-flex items-center gap-1.5 bg-green-900/40 border border-green-700/40 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                    <Zap size={11} />
                    SAVE Rs. {savings}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-krunch-border">
                    <div>
                      <div className="text-krunch-gray text-xs font-body line-through">
                        Rs. {(deal.price + savings).toLocaleString()}
                      </div>
                      <div className="text-krunch-red font-heading font-black text-3xl leading-none">
                        Rs. {deal.price.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(deal)}
                      className="flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-red-glow"
                    >
                      <ShoppingCart size={15} />
                      Order
                    </button>
                  </div>
                </div>

                {/* Hover glow border */}
                <div className="absolute inset-0 border-2 border-krunch-red/0 group-hover:border-krunch-red/30 rounded-xl transition-all duration-300 pointer-events-none" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-krunch-red/20 to-krunch-dark border border-krunch-red/30 rounded-2xl p-8 text-center"
        >
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="font-heading font-black text-3xl text-white uppercase mb-2">
            Can't Decide? <span className="text-krunch-red">Call Us!</span>
          </h2>
          <p className="text-krunch-gray font-body text-sm mb-5">
            Our team will help you pick the best deal for your group size
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:03177787648"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              📞 0317-7787648
            </a>
            <a
              href="tel:03084509090"
              className="btn-outline flex items-center gap-2 text-sm"
            >
              📞 0308-4509090
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OffersPage;
