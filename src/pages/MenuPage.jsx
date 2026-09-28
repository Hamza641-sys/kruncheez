import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { menuCategories, menuItems } from '../data/menuData';
import FoodCard from '../components/FoodCard';
import { useCart } from '../context/CartContext';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('burgers');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const { setIsCartOpen, cartCount } = useCart();

  const items = useMemo(() => {
    let base = search.trim()
      ? Object.values(menuItems).flat().filter(i =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.description.toLowerCase().includes(search.toLowerCase())
        )
      : (menuItems[activeCategory] || []);

    if (sortBy === 'price-asc') base = [...base].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') base = [...base].sort((a, b) => b.price - a.price);
    if (sortBy === 'popular') base = [...base].sort((a, b) => (b.badge === 'POPULAR' ? 1 : 0) - (a.badge === 'POPULAR' ? 1 : 0));

    return base;
  }, [activeCategory, search, sortBy]);

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      {/* Page Header */}
      <div className="bg-krunch-dark border-b border-krunch-border py-10">
        <div className="max-w-7xl mx-auto px-4">
          <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">
            Our Menu
          </span>
          <h1 className="section-title text-white mb-2">
            FULL <span className="text-krunch-red">MENU</span>
          </h1>
          <p className="text-krunch-gray font-body text-sm">
            Fresh. Hot. Delicious. Every item made with premium ingredients.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: Category Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-28">
              <h3 className="font-heading font-bold text-white text-sm uppercase tracking-widest mb-3 px-1">Categories</h3>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0" style={{ scrollbarWidth: 'none' }}>
                {menuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                    className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-body font-semibold text-sm transition-all duration-200 text-left ${
                      activeCategory === cat.id && !search
                        ? 'bg-krunch-red text-white shadow-red-glow'
                        : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:border-krunch-red hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="whitespace-nowrap">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT: Items Area */}
          <div className="flex-1">
            {/* Search + Sort bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-10 py-3 text-white font-body text-sm placeholder-krunch-gray focus:outline-none focus:border-krunch-red transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-krunch-gray hover:text-white">
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-krunch-gray flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-krunch-card border border-krunch-border rounded-xl px-4 py-3 text-krunch-gray font-body text-sm focus:outline-none focus:border-krunch-red transition-colors appearance-none cursor-pointer"
                >
                  <option value="popular">Sort: Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Category Title */}
            {!search && (
              <div className="flex items-center gap-3 mb-6 pl-1">
                <span className="text-2xl">{menuCategories.find(c => c.id === activeCategory)?.icon}</span>
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white uppercase">
                    {menuCategories.find(c => c.id === activeCategory)?.name}
                  </h2>
                  <p className="text-krunch-gray font-body text-xs">
                    {menuCategories.find(c => c.id === activeCategory)?.description}
                  </p>
                </div>
              </div>
            )}

            {search && (
              <div className="mb-6 pl-1">
                <p className="text-krunch-gray font-body text-sm">
                  Showing <span className="text-white font-semibold">{items.length}</span> results for "<span className="text-krunch-red">{search}</span>"
                </p>
              </div>
            )}

            {/* Items Grid */}
            {items.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-heading font-bold text-xl text-white">No items found</p>
                <p className="text-krunch-gray font-body text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <motion.div
                key={activeCategory + search + sortBy}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.4) }}
                  >
                    <FoodCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Floating cart button (mobile) */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden bg-krunch-red text-white font-heading font-bold px-5 py-3 rounded-full shadow-red-glow-lg flex items-center gap-2 z-40"
        >
          🛒 Cart ({cartCount})
        </motion.button>
      )}
    </div>
  );
};

export default MenuPage;
