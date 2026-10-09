import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle, ChefHat, Truck, XCircle, Eye, X } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../firebase/orderService';
import toast from 'react-hot-toast';

const statusConfig = {
  pending:          { label: 'Pending',        color: 'text-yellow-400', bg: 'bg-yellow-400/10  border-yellow-400/20', icon: <Clock size={12} /> },
  confirmed:        { label: 'Confirmed',       color: 'text-blue-400',   bg: 'bg-blue-400/10    border-blue-400/20',   icon: <CheckCircle size={12} /> },
  preparing:        { label: 'Preparing',       color: 'text-orange-400', bg: 'bg-orange-400/10  border-orange-400/20', icon: <ChefHat size={12} /> },
  out_for_delivery: { label: 'Out for Delivery',color: 'text-purple-400', bg: 'bg-purple-400/10  border-purple-400/20', icon: <Truck size={12} /> },
  delivered:        { label: 'Delivered',       color: 'text-green-400',  bg: 'bg-green-400/10   border-green-400/20',  icon: <CheckCircle size={12} /> },
  rejected:         { label: 'Rejected',        color: 'text-red-400',    bg: 'bg-red-400/10     border-red-400/20',    icon: <XCircle size={12} /> },
};

const nextStatus = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

  useEffect(() => {
    const unsub = getAllOrders(setOrders);
    return () => unsub();
  }, []);

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = !search || o.id.includes(search) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search);
    return matchFilter && matchSearch;
  });

  const handleStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
    toast.success(`Order ${status.replace('_', ' ')}!`, toastStyle);
  };

  const filters = [
    { key: 'all', label: 'All' },
    ...Object.entries(statusConfig).map(([k, v]) => ({ key: k, label: v.label }))
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">Orders Management</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search by order ID, name, phone..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-body font-semibold text-xs transition-all ${
              filter === f.key ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {f.label} {f.key !== 'all' && `(${orders.filter(o => o.status === f.key).length})`}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Order ID','Customer','Items','Total','Type','Payment','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No orders found</td></tr>
              ) : filtered.map((order, i) => {
                const st = statusConfig[order.status] || statusConfig.pending;
                const next = nextStatus[order.status];
                return (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-body font-bold text-white text-sm">#{order.id.slice(0,8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-body text-sm">{order.customer?.name || '—'}</p>
                      <p className="text-krunch-gray font-body text-xs">{order.customer?.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">{order.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-base whitespace-nowrap">Rs.{order.summary?.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-krunch-black border border-krunch-border text-krunch-gray px-2 py-1 rounded capitalize">{order.orderType || 'delivery'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-krunch-gray font-body capitalize">{order.paymentMethod === 'cash' ? 'COD' : 'Card'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 ${st.color} ${st.bg} border px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
                        {st.icon} {st.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(order)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                          <Eye size={12} />
                        </button>
                        {next && (
                          <button onClick={() => handleStatus(order.id, next)}
                            className="px-2.5 py-1 rounded-lg bg-krunch-red hover:bg-krunch-darkred text-white font-body text-[10px] font-bold transition-all whitespace-nowrap">
                            → {statusConfig[next]?.label}
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button onClick={() => handleStatus(order.id, 'rejected')}
                            className="w-7 h-7 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center text-red-400 hover:bg-red-700/30 transition-all">
                            <XCircle size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl z-50 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Order #{selected.id.slice(0,8).toUpperCase()}</h3>
                <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {/* Customer */}
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Customer</p>
                  <p className="text-white font-body font-semibold">{selected.customer?.name}</p>
                  <p className="text-krunch-gray font-body text-sm">{selected.customer?.phone}</p>
                  {selected.customer?.address && <p className="text-krunch-gray font-body text-sm">{selected.customer.address}</p>}
                </div>
                {/* Items */}
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Items</p>
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-krunch-border last:border-0">
                      <span className="text-white font-body text-sm">{item.name} <span className="text-krunch-gray">x{item.quantity}</span></span>
                      <span className="text-krunch-red font-body font-bold text-sm">Rs.{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="bg-krunch-black rounded-xl p-4">
                  <div className="flex justify-between text-sm font-body mb-1"><span className="text-krunch-gray">Subtotal</span><span className="text-white">Rs.{selected.summary?.subtotal?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm font-body mb-2"><span className="text-krunch-gray">Delivery</span><span className="text-white">Rs.{selected.summary?.deliveryFee || 0}</span></div>
                  <div className="flex justify-between font-heading font-black text-lg"><span className="text-white">Total</span><span className="text-krunch-red">Rs.{selected.summary?.total?.toLocaleString()}</span></div>
                </div>
                {/* Status Actions */}
                {nextStatus[selected.status] && (
                  <button onClick={() => { handleStatus(selected.id, nextStatus[selected.status]); setSelected(null); }}
                    className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3 rounded-xl transition-all uppercase tracking-wider">
                    Mark as {statusConfig[nextStatus[selected.status]]?.label}
                  </button>
                )}
                {selected.status === 'pending' && (
                  <button onClick={() => { handleStatus(selected.id, 'rejected'); setSelected(null); }}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-heading font-bold py-3 rounded-xl transition-all uppercase tracking-wider">
                    Reject Order
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
