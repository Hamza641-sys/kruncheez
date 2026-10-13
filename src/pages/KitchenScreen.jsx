import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChefHat, Clock, CheckCircle, Bell, Maximize } from 'lucide-react';

const statusFlow = {
  confirmed: { next: 'preparing',  label: 'Start Cooking', color: 'bg-blue-600',   nextColor: 'bg-orange-500' },
  preparing: { next: 'ready',      label: 'Mark Ready',    color: 'bg-orange-500', nextColor: 'bg-green-600' },
  ready:     { next: 'delivered',  label: 'Served ✓',      color: 'bg-green-600',  nextColor: 'bg-gray-600' },
};

const statusColors = {
  pending:   'border-yellow-500 bg-yellow-500/10',
  confirmed: 'border-blue-500   bg-blue-500/10',
  preparing: 'border-orange-500 bg-orange-500/10',
  ready:     'border-green-500  bg-green-500/10',
};

const useTimer = (createdAt) => {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    const calc = () => {
      const start = createdAt?.toDate?.() || new Date();
      setMins(Math.floor((Date.now() - start) / 60000));
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [createdAt]);
  return mins;
};

const OrderCard = ({ order, onStatusChange }) => {
  const mins   = useTimer(order.createdAt);
  const flow   = statusFlow[order.status];
  const urgent = mins > 20;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-2xl border-2 p-4 flex flex-col gap-3 ${statusColors[order.status] || 'border-krunch-border bg-krunch-card'} ${urgent ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-krunch-black' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-white text-xl">#{order.id.slice(0,6).toUpperCase()}</span>
            {urgent && <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded animate-pulse">URGENT</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {order.tableNumber ? (
              <span className="text-amber-400 font-body font-bold text-sm">🪑 Table {order.tableNumber}</span>
            ) : (
              <span className="text-krunch-gray font-body text-sm capitalize">{order.orderType || 'Delivery'}</span>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 font-body font-bold text-sm px-2.5 py-1 rounded-lg ${urgent ? 'text-red-400 bg-red-400/10' : 'text-krunch-gray bg-krunch-black'}`}>
          <Clock size={13} />
          {mins}m
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1.5 bg-krunch-black rounded-xl p-3">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="font-heading font-black text-krunch-red text-base leading-none mt-0.5">×{item.quantity}</span>
              <span className="font-body font-semibold text-white text-sm leading-tight">{item.name}</span>
            </div>
          </div>
        ))}
        {order.notes && (
          <div className="mt-1 pt-1.5 border-t border-krunch-border">
            <p className="text-amber-400 font-body text-xs">📝 {order.notes}</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {flow && (
        <button
          onClick={() => onStatusChange(order.id, flow.next)}
          className={`w-full ${flow.nextColor} hover:opacity-90 text-white font-heading font-black text-sm py-3 rounded-xl transition-all uppercase tracking-wider`}
        >
          {flow.label}
        </button>
      )}
      {order.status === 'ready' && (
        <div className="text-center py-2">
          <span className="text-green-400 font-heading font-bold text-sm uppercase tracking-wider">✅ Ready to Serve</span>
        </div>
      )}
    </motion.div>
  );
};

const KitchenScreen = () => {
  const [orders, setOrders]         = useState([]);
  const [newOrderAlert, setAlert]   = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const prevCount = useRef(0);
  const audioRef  = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['confirmed', 'preparing', 'ready'])
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by createdAt asc
      data.sort((a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0));
      if (data.length > prevCount.current) {
        setAlert(true);
        setTimeout(() => setAlert(false), 3000);
      }
      prevCount.current = data.length;
      setOrders(data);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const byStatus = (s) => orders.filter(o => o.status === s);

  const columns = [
    { key: 'confirmed', label: 'New Orders',   color: 'text-blue-400',   icon: '🆕', count: byStatus('confirmed').length },
    { key: 'preparing', label: 'Preparing',     color: 'text-orange-400', icon: '🍳', count: byStatus('preparing').length },
    { key: 'ready',     label: 'Ready to Serve',color: 'text-green-400',  icon: '✅', count: byStatus('ready').length },
  ];

  return (
    <div className={`min-h-screen bg-krunch-black ${fullscreen ? '' : 'pt-0'}`}>

      {/* Kitchen Header */}
      <div className="bg-krunch-dark border-b-2 border-krunch-red px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-krunch-red" />
          <div>
            <h1 className="font-heading font-black text-white text-xl uppercase tracking-wider">Kitchen Display</h1>
            <p className="text-krunch-gray font-body text-xs">{orders.length} active orders</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-heading font-black text-2xl text-white">{orders.length}</div>
            <div className="text-krunch-gray font-body text-[10px] uppercase">Active</div>
          </div>
          <button onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red transition-all">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* New Order Alert */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            className="fixed top-0 left-0 right-0 z-50 bg-krunch-red text-white text-center font-heading font-black text-xl py-4 tracking-widest">
            🔔 NEW ORDER RECEIVED!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-4 p-4 h-[calc(100vh-70px)] overflow-hidden">
        {columns.map(col => (
          <div key={col.key} className="flex flex-col gap-3 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {/* Column Header */}
            <div className="flex items-center justify-between sticky top-0 bg-krunch-black py-1 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">{col.icon}</span>
                <span className={`font-heading font-black text-base uppercase ${col.color}`}>{col.label}</span>
              </div>
              <span className={`text-lg font-heading font-black ${col.color}`}>{col.count}</span>
            </div>

            {/* Orders */}
            <AnimatePresence mode="popLayout">
              {byStatus(col.key).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-30">
                  <CheckCircle size={32} className="text-krunch-gray mb-2" />
                  <p className="text-krunch-gray font-body text-sm">No orders</p>
                </div>
              ) : (
                byStatus(col.key).map(order => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenScreen;
