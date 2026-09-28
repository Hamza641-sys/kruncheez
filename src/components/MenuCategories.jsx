import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { menuCategories, menuItems } from '../data/menuData';
import FoodCard from './FoodCard';

const MenuCategories = () => {
  const [activeCategory, setActiveCategory] = useState('burgers');
  const scrollRef = useRef(null);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  const items = menuItems[activeCategory] || [];
  const visibleItems = items.slice(0, 5);

  return (
    <section className="py-20 bg-krunch-black relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-krunch-red to-transparent opacity-40" />

      <div className="max-w-7xl mx-auto px-4">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-2 block">
              Our Menu
            </span>
            <h2 className="section-title text-white">
              CHOOSE YOUR <span className="text-krunch-red">CRAVINGS</span>
            </h2>
          </div>
          <Link
            to="/menu"
            className="flex items-center gap-2 text-krunch-red font-body font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors group"
          >
            View Full Menu
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Tabs with scroll arrows */}
        <div className="relative mb-10">
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red transition-all md:hidden"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-none pb-2 px-0 md:flex-wrap"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {menuCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-body font-semibold text-sm transition-all duration-200 border ${
                  activeCategory === cat.id
                    ? 'bg-krunch-red border-krunch-red text-white shadow-red-glow'
                    : 'bg-krunch-card border-krunch-border text-krunch-gray hover:border-krunch-red hover:text-white'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="whitespace-nowrap">{cat.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red transition-all md:hidden"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Active Category Info */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h3 className="font-heading font-bold text-2xl text-white uppercase tracking-wide">
              {menuCategories.find(c => c.id === activeCategory)?.name}
            </h3>
            <p className="text-krunch-gray font-body text-sm mt-1">
              {menuCategories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>

          {/* Food Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
              >
                <FoodCard item={item} compact />
              </motion.div>
            ))}
          </div>

          {/* See More */}
          {items.length > 5 && (
            <div className="mt-6 text-center">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 btn-outline text-sm"
              >
                See All {menuCategories.find(c => c.id === activeCategory)?.name}
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-krunch-border to-transparent" />
    </section>
  );
};

export default MenuCategories;
