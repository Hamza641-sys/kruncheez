import { motion } from 'framer-motion';
import { ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const badgeColors = {
  'POPULAR': 'bg-krunch-red',
  "CHEF'S PICK": 'bg-amber-600',
  'NEW': 'bg-green-600',
  'SPICY': 'bg-orange-600',
  'SPECIAL': 'bg-purple-600',
  'SIGNATURE': 'bg-krunch-red',
  'BEST VALUE': 'bg-krunch-red',
  'TOP TRENDING': 'bg-amber-600',
  'FAMILY': 'bg-blue-600',
  'MEGA DEAL': 'bg-krunch-red',
  'FAMILY FEAST': 'bg-blue-600',
};

// Category emoji map
const categoryEmoji = {
  burgers: '🍔',
  bbq: '🔥',
  wraps: '🌯',
  pizza: '🍕',
  chinese: '🍜',
  pasta: '🍝',
  starters: '🍗',
  sandwich: '🥪',
  chicken: '🍗',
  soup: '🍲',
  platter: '🥘',
  deals: '🏷️',
};

const FoodCard = ({ item, compact = false }) => {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(item);
    toast.success(`${item.name} added to cart!`, {
      style: {
        background: '#1A1A1A',
        color: '#fff',
        border: '1px solid #E31E24',
        borderRadius: '12px',
      },
      iconTheme: { primary: '#E31E24', secondary: '#fff' },
    });
  };

  const badgeClass = item.badge ? (badgeColors[item.badge] || 'bg-krunch-red') : '';
  const emoji = categoryEmoji[item.category] || '🍴';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="food-card card-dark group relative flex flex-col h-full"
    >
      {/* Badge */}
      {item.badge && (
        <div className={`absolute top-3 left-3 z-10 ${badgeClass} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>
          {item.badge}
        </div>
      )}

      {/* Image area */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-krunch-dark to-krunch-black ${compact ? 'h-28' : 'h-40'} flex items-center justify-center`}>
        <div className="text-6xl select-none group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-krunch-card/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className={`font-heading font-bold text-white leading-tight mb-1 group-hover:text-krunch-red transition-colors ${compact ? 'text-base' : 'text-lg'}`}>
          {item.name}
        </h3>
        <p className="text-krunch-gray text-xs font-body leading-relaxed mb-3 flex-1 line-clamp-2">
          {item.description}
        </p>

        {/* Price sizes (pizza) */}
        {item.sizes ? (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.sizes).slice(0, 3).map(([size, price]) => (
                <span key={size} className="text-[10px] bg-krunch-border text-krunch-light px-2 py-0.5 rounded font-body">
                  {size}: <span className="text-krunch-red font-semibold">Rs.{price}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-krunch-border">
          <div>
            <span className="text-[10px] text-krunch-gray font-body">Starting at</span>
            <div className="text-krunch-red font-heading font-bold text-xl leading-none">
              Rs. {item.price.toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-semibold text-xs px-3 py-2 rounded-lg transition-all duration-200 group-hover:shadow-red-glow"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FoodCard;
