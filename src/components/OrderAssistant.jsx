import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOrderSuggestions } from '../firebase/groqService';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

const OrderAssistant = ({ cartItems = [] }) => {
  const [suggestions, setSuggestions]   = useState([]);
  const [dismissed, setDismissed]       = useState([]);
  const [menuItems, setMenuItems]       = useState([]);
  const [visible, setVisible]           = useState(true);

  // Load menu items once
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'menu'), where('available', '==', true), limit(100)));
        setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* fallback */ }
    };
    load();
  }, []);

  // Recalculate suggestions when cart changes
  useEffect(() => {
    if (cartItems.length === 0) { setSuggestions([]); return; }
    const all = getOrderSuggestions(cartItems, menuItems);
    const filtered = all.filter(s => !dismissed.includes(s.type));
    setSuggestions(filtered);
    if (filtered.length > 0) setVisible(true);
  }, [cartItems, menuItems, dismissed]);

  const dismiss = (type) => {
    setDismissed(prev => [...prev, type]);
  };

  const activeSuggestions = suggestions.filter(s => !dismissed.includes(s.type));

  if (activeSuggestions.length === 0 || !visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="card-dark border border-amber-500/30 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-400" />
          <span className="text-amber-400 font-heading font-bold text-sm uppercase tracking-wide">
            AI Suggestions
          </span>
        </div>
        <button onClick={() => setVisible(false)}
          className="text-krunch-gray hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-krunch-border">
        <AnimatePresence>
          {activeSuggestions.map((s, i) => (
            <motion.div
              key={s.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, height: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="text-xl flex-shrink-0">{s.icon}</span>
              <p className="flex-1 text-krunch-gray font-body text-sm leading-relaxed">
                {s.message}
                {s.type === 'deal' && (
                  <Link to="/custom-deal" className="text-krunch-red font-semibold ml-1 hover:underline">
                    Custom Deal →
                  </Link>
                )}
                {s.type === 'platter' && (
                  <Link to="/menu" className="text-krunch-red font-semibold ml-1 hover:underline">
                    Menu dekho →
                  </Link>
                )}
              </p>
              <button onClick={() => dismiss(s.type)}
                className="text-krunch-gray/40 hover:text-krunch-gray transition-colors flex-shrink-0">
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OrderAssistant;
