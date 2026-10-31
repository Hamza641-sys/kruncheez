import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ShoppingBag, CheckCheck, Clock } from 'lucide-react';
import { getAllOrders } from '../../firebase/orderService';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'kruncheez_read_notifications';

const getReadIds = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const markRead = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

const timeAgo = (ts) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const statusColor = {
  pending:          'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  confirmed:        'text-blue-400   bg-blue-400/10   border-blue-400/20',
  preparing:        'text-orange-400 bg-orange-400/10 border-orange-400/20',
  out_for_delivery: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  delivered:        'text-green-400  bg-green-400/10  border-green-400/20',
  rejected:         'text-red-400    bg-red-400/10    border-red-400/20',
};

const statusLabel = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', rejected: 'Rejected',
};

const NotificationPanel = () => {
  const [open, setOpen]       = useState(false);
  const [orders, setOrders]   = useState([]);
  const [readIds, setReadIds] = useState(getReadIds);
  const panelRef              = useRef(null);
  const navigate              = useNavigate();

  // Real-time orders
  useEffect(() => {
    const unsub = getAllOrders((allOrders) => {
      // Show latest 30 orders as notifications, sorted newest first
      const sorted = [...allOrders].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });
      setOrders(sorted.slice(0, 30));
    });
    return () => unsub();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = orders.filter(o => !readIds.includes(o.id)).length;

  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  const handleMarkAllRead = () => {
    const allIds = orders.map(o => o.id);
    markRead(allIds);
    setReadIds(allIds);
  };

  const handleClick = (order) => {
    // Mark this order as read
    const updated = [...new Set([...readIds, order.id])];
    markRead(updated);
    setReadIds(updated);
    setOpen(false);
    navigate('/admin/orders');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-krunch-red border-krunch-red text-white'
            : 'bg-krunch-card border-krunch-border text-krunch-gray hover:text-white hover:border-krunch-red'
        }`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-krunch-red rounded-full text-[9px] text-white font-bold flex items-center justify-center px-1 border-2 border-krunch-dark">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-krunch-dark border border-krunch-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-krunch-border bg-krunch-black">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-krunch-red" />
                <span className="text-white font-heading font-bold text-sm uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-krunch-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-krunch-gray hover:text-green-400 transition-colors text-[10px] font-body flex items-center gap-1"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-krunch-gray hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Pending alert banner */}
            {pendingOrders.length > 0 && (
              <div className="bg-yellow-400/10 border-b border-yellow-400/20 px-4 py-2.5 flex items-center gap-2">
                <Clock size={13} className="text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-400 font-body font-bold text-xs">
                  {pendingOrders.length} order{pendingOrders.length > 1 ? 's' : ''} waiting for confirmation!
                </span>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {orders.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <ShoppingBag size={28} className="text-krunch-gray/30 mx-auto mb-2" />
                  <p className="text-krunch-gray font-body text-sm">No orders yet</p>
                </div>
              ) : (
                orders.map((order) => {
                  const isUnread = !readIds.includes(order.id);
                  const sc = statusColor[order.status] || statusColor.pending;
                  const sl = statusLabel[order.status] || 'Pending';
                  return (
                    <button
                      key={order.id}
                      onClick={() => handleClick(order)}
                      className={`w-full text-left px-4 py-3 border-b border-krunch-border/50 hover:bg-krunch-card transition-all duration-150 flex items-start gap-3 ${
                        isUnread ? 'bg-krunch-red/5' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUnread ? 'bg-krunch-red/20' : 'bg-krunch-card'
                      }`}>
                        <ShoppingBag size={14} className={isUnread ? 'text-krunch-red' : 'text-krunch-gray'} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-xs font-heading font-bold ${isUnread ? 'text-white' : 'text-krunch-gray'}`}>
                            #{order.id.slice(0, 8).toUpperCase()}
                            {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                          </span>
                          <span className="text-[10px] text-krunch-gray font-body flex-shrink-0">
                            {timeAgo(order.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs font-body truncate mb-1 ${isUnread ? 'text-krunch-light' : 'text-krunch-gray'}`}>
                          {order.customer?.name || 'Customer'} - Rs.{order.summary?.total?.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sc}`}>
                            {sl}
                          </span>
                          <span className="text-[10px] text-krunch-gray font-body">
                            {order.items?.length || 0} items
                          </span>
                        </div>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-krunch-red flex-shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-krunch-border bg-krunch-black">
              <button
                onClick={() => { setOpen(false); navigate('/admin/orders'); }}
                className="w-full text-center text-xs font-body font-semibold text-krunch-red hover:text-white transition-colors py-1"
              >
                View All Orders →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
