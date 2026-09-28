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

// Real food images per category — all chicken-based / accurate
const categoryImages = {
  // Crispy chicken zinger burger (NOT beef)
  burgers: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80&auto=format&fit=crop',
  // BBQ grilled chicken
  bbq: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80&auto=format&fit=crop',
  // Chicken wrap / shawarma
  wraps: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80&auto=format&fit=crop',
  // Loaded pizza
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop',
  // Chinese noodles
  chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80&auto=format&fit=crop',
  // Pasta
  pasta: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80&auto=format&fit=crop',
  // Crispy chicken wings / starters
  starters: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80&auto=format&fit=crop',
  // Sandwich
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80&auto=format&fit=crop',
  // Fried chicken pieces
  chicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80&auto=format&fit=crop',
  // Soup bowl
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80&auto=format&fit=crop',
  // BBQ platter
  platter: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80&auto=format&fit=crop',
  // Combo deal
  deals: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80&auto=format&fit=crop',
};

// Fallback emoji if image fails
const categoryEmoji = {
  burgers: '🍗', bbq: '🔥', wraps: '🌯', pizza: '🍕',
  chinese: '🍜', pasta: '🍝', starters: '🍗', sandwich: '🥪',
  chicken: '🍗', soup: '🍲', platter: '🥘', deals: '🏷️',
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
  const img = categoryImages[item.category];
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

      {/* Image area — real food photo */}
      <div className={`relative overflow-hidden bg-krunch-black ${compact ? 'h-32' : 'h-44'}`}>
        {img ? (
          <img
            src={img}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Emoji fallback (hidden by default, shown if img fails) */}
        <div
          className="absolute inset-0 items-center justify-center text-5xl select-none bg-gradient-to-br from-krunch-dark to-krunch-black"
          style={{ display: img ? 'none' : 'flex' }}
        >
          {emoji}
        </div>
        {/* Overlay gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-krunch-card to-transparent" />
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
