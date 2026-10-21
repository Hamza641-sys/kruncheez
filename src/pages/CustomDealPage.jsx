import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, Zap, Tag, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { menuCategories } from '../data/menuData';
import toast from 'react-hot-toast';

const CustomDealPage = () => {
  const { addToCart } = useCart();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [dealItems, setDealItems] = useState([]);
  const [added, setAdded] = useState(false);

  const DISCOUNT = 0.10;
  const MIN_ITEMS = 2;

  // Load only customDeal items from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'menu'), where('customDeal', '==', true), where('available', '==', true)));
        setAllItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { setAllItems([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Unique categories from loaded items
  const activeCats = ['all', ...new Set(allItems.map(i => i.category))];
  const filteredItems = selectedCat === 'all' ? allItems : allItems.filter(i => i.category === selectedCat);

  const subtotal = dealItems.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = dealItems.length >= MIN_ITEMS ? Math.round(subtotal * DISCOUNT) : 0;
  const total = subtotal - discount;
  const totalQty = dealItems.reduce((s, i) => s + i.qty, 0);

  const addItem = (item) => {
    setDealItems(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeOne = (id) => {
    setDealItems(prev => {
      const ex = prev.find(i => i.id === id);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const removeItem = (id) => setDealItems(prev => prev.filter(i => i.id !== id));

  const addDealToCart = () => {
    if (dealItems.length < MIN_ITEMS) {
      toast.error('Add at least 2 items to unlock 10% discount!', {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' },
      });
      return;
    }
    const dealItem = {
      id: `custom-deal-${Date.now()}`,
      name: `My Custom Deal (${totalQty} items)`,
      price: total,
      quantity: 1,
      category: 'deals',
      description: dealItems.map(i => `${i.name} x${i.qty}`).join(', '),
      isCustomDeal: true,
      originalPrice: subtotal,
      dealDiscount: discount,
    };
    addToCart(dealItem);
    setAdded(true);
    toast.success(`Custom Deal added! You saved Rs. ${discount} 🎉`, {
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' },
      duration: 3000,
    });
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">

      {/* ── PAGE HEADER ── */}
      <div className="relative bg-krunch-dark border-b border-krunch-border py-14 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(227,30,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(227,30,36,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-krunch-red/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-krunch-red/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-krunch-red/20 border border-krunch-red/40 rounded-full px-5 py-2 mb-5">
              <Sparkles size={16} className="text-krunch-red" />
              <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest">
                Build Your Own Deal
              </span>
            </div>
            <h1 className="section-title text-white mb-3">
              MY CUSTOM <span className="text-krunch-red">DEAL</span>
            </h1>
            <p className="text-krunch-gray font-body text-base max-w-xl mx-auto">
              Choose any items you want — add 2 or more and get <span className="text-krunch-red font-bold">10% OFF</span> automatically!
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="bg-krunch-red py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { step: '1', label: 'Choose Items', desc: 'Pick anything from menu' },
              { step: '2', label: 'Add 2+ Items', desc: '10% discount unlocks' },
              { step: '3', label: 'Order & Save', desc: 'Discount auto applied' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-white text-krunch-red font-heading font-black text-sm flex items-center justify-center mb-1">
                  {s.step}
                </div>
                <div className="font-heading font-bold text-white text-sm">{s.label}</div>
                <div className="font-body text-xs text-red-200 hidden sm:block">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: MENU SELECTOR ── */}
          <div className="lg:col-span-2">

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6">
              {activeCats.map(catId => {
                const cat = menuCategories.find(c => c.id === catId);
                const label = catId === 'all' ? 'All Items' : (cat?.name || catId);
                const icon = catId === 'all' ? '🍴' : (cat?.icon || '');
                return (
                  <button
                    key={catId}
                    onClick={() => setSelectedCat(catId)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-body font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                      selectedCat === catId
                        ? 'bg-krunch-red text-white shadow-red-glow'
                        : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white hover:border-krunch-red'
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-56 bg-krunch-card rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 && !loading ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="font-heading font-bold text-xl text-white uppercase">No items available</p>
                <p className="text-krunch-gray font-body text-sm mt-2">
                  Admin ne abhi koi item Custom Deal mein add nahi kiya.<br />
                  Admin Panel → Menu → Item pe "Add to Custom Deal" click karo.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="wait">
                {filteredItems.map((item, idx) => {
                  const inDeal = dealItems.find(i => i.id === item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      className={`card-dark rounded-2xl overflow-hidden group transition-all duration-200 ${
                        inDeal ? 'border border-krunch-red/60 shadow-red-glow' : 'border border-krunch-border hover:border-krunch-red/40'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'; }}
                        />
                        {item.badge && (
                          <span className="absolute top-2 left-2 bg-krunch-red text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {item.badge}
                          </span>
                        )}
                        {inDeal && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-heading font-bold text-white text-sm leading-tight mb-1">{item.name}</h3>
                        <p className="text-krunch-gray text-xs font-body mb-3 line-clamp-1">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-krunch-red font-heading font-black text-lg">Rs. {Number(item.price).toLocaleString()}</span>
                          {inDeal ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => removeOne(item.id)}
                                className="w-7 h-7 rounded-full bg-krunch-border hover:bg-krunch-red text-white flex items-center justify-center transition-colors">
                                <Minus size={12} />
                              </button>
                              <span className="text-white font-bold text-sm w-5 text-center">{inDeal.qty}</span>
                              <button onClick={() => addItem(item)}
                                className="w-7 h-7 rounded-full bg-krunch-red hover:bg-krunch-darkred text-white flex items-center justify-center transition-colors">
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addItem(item)}
                              className="flex items-center gap-1.5 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-xs px-3 py-2 rounded-xl transition-all duration-200">
                              <Plus size={13} />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            )}
          </div>

          {/* ── RIGHT: DEAL SUMMARY ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">

              {/* Deal Builder Card */}
              <div className="card-dark rounded-2xl border border-krunch-border overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-krunch-red to-red-700 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-white" />
                    <h2 className="font-heading font-black text-white text-lg uppercase">My Deal</h2>
                  </div>
                  {dealItems.length >= MIN_ITEMS ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle size={13} className="text-green-300" />
                      <span className="text-green-300 text-xs font-body font-semibold">10% Discount Unlocked! 🎉</span>
                    </div>
                  ) : (
                    <p className="text-red-200 text-xs font-body mt-1">
                      Add {MIN_ITEMS - dealItems.length > 0 ? MIN_ITEMS - dealItems.length : 0} more item{dealItems.length === 1 ? '' : 's'} to unlock 10% off
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-krunch-border">
                  <motion.div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min((dealItems.length / MIN_ITEMS) * 100, 100)}%` }}
                  />
                </div>

                {/* Items List */}
                <div className="p-4">
                  {dealItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🛒</div>
                      <p className="text-krunch-gray font-body text-sm">No items yet</p>
                      <p className="text-krunch-gray/60 font-body text-xs mt-1">Pick items from the left</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      <AnimatePresence>
                        {dealItems.map(item => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-center gap-3 bg-krunch-black rounded-xl p-2.5"
                          >
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-body text-xs font-semibold truncate">{item.name}</p>
                              <p className="text-krunch-gray text-xs">Rs. {(item.price * item.qty).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => removeOne(item.id)}
                                className="w-6 h-6 rounded-full bg-krunch-border hover:bg-krunch-red text-white flex items-center justify-center transition-colors">
                                <Minus size={10} />
                              </button>
                              <span className="text-white font-bold text-xs w-4 text-center">{item.qty}</span>
                              <button onClick={() => addItem(item)}
                                className="w-6 h-6 rounded-full bg-krunch-red hover:bg-krunch-darkred text-white flex items-center justify-center transition-colors">
                                <Plus size={10} />
                              </button>
                              <button onClick={() => removeItem(item.id)}
                                className="w-6 h-6 rounded-full bg-red-900/30 hover:bg-red-900/60 text-red-400 flex items-center justify-center transition-colors ml-1">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Divider */}
                  {dealItems.length > 0 && (
                    <>
                      <div className="h-px bg-krunch-border my-4" />

                      {/* Price Breakdown */}
                      <div className="space-y-2 text-sm font-body">
                        <div className="flex justify-between text-krunch-gray">
                          <span>Subtotal ({totalQty} items)</span>
                          <span>Rs. {subtotal.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-between text-green-400 font-semibold"
                          >
                            <span className="flex items-center gap-1">
                              <Zap size={13} />
                              10% Deal Discount
                            </span>
                            <span>− Rs. {discount.toLocaleString()}</span>
                          </motion.div>
                        )}
                        <div className="flex justify-between text-white font-black text-lg pt-1 border-t border-krunch-border">
                          <span>Total</span>
                          <span className="text-krunch-red">Rs. {total.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                          <p className="text-green-400 text-xs text-center font-semibold">
                            🎉 You're saving Rs. {discount.toLocaleString()}!
                          </p>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <motion.button
                        onClick={addDealToCart}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full mt-4 flex items-center justify-center gap-2 font-heading font-bold text-sm py-3.5 rounded-xl transition-all duration-200 uppercase tracking-wider ${
                          dealItems.length >= MIN_ITEMS
                            ? 'bg-krunch-red hover:bg-krunch-darkred text-white shadow-red-glow'
                            : 'bg-krunch-card text-krunch-gray cursor-not-allowed border border-krunch-border'
                        }`}
                      >
                        {added ? (
                          <>
                            <CheckCircle size={16} />
                            Added to Cart!
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Add Deal to Cart
                            {discount > 0 && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">−10%</span>}
                          </>
                        )}
                      </motion.button>

                      {/* Clear All */}
                      <button
                        onClick={() => setDealItems([])}
                        className="w-full mt-2 text-krunch-gray hover:text-red-400 font-body text-xs text-center transition-colors py-1"
                      >
                        Clear all items
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 bg-krunch-card border border-krunch-border rounded-2xl p-4">
                <h3 className="text-white font-body font-semibold text-sm mb-2 flex items-center gap-2">
                  <Zap size={14} className="text-krunch-red" />
                  Deal Rules
                </h3>
                <ul className="space-y-1.5 text-krunch-gray text-xs font-body">
                  <li className="flex items-start gap-2">
                    <span className="text-krunch-red mt-0.5">•</span>
                    Add minimum 2 items to get 10% off
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-krunch-red mt-0.5">•</span>
                    Any items from any category
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-krunch-red mt-0.5">•</span>
                    Discount auto-applies — no code needed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-krunch-red mt-0.5">•</span>
                    Can add multiple quantities of same item
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDealPage;
