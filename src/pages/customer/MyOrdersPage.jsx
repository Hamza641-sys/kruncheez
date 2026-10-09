import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, ChefHat, Truck, X, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrders } from '../../firebase/orderService';

const statusConfig = {
  pending:          { label: 'Pending',          color: 'text-yellow-400',  bg: 'bg-yellow-400/10  border-yellow-400/20',  icon: <Clock size={13} />, step: 0 },
  confirmed:        { label: 'Confirmed',         color: 'text-blue-400',    bg: 'bg-blue-400/10    border-blue-400/20',    icon: <CheckCircle size={13} />, step: 1 },
  preparing:        { label: 'Preparing',         color: 'text-orange-400',  bg: 'bg-orange-400/10  border-orange-400/20',  icon: <ChefHat size={13} />, step: 2 },
  out_for_delivery: { label: 'Out for Delivery',  color: 'text-purple-400',  bg: 'bg-purple-400/10  border-purple-400/20',  icon: <Truck size={13} />, step: 3 },
  delivered:        { label: 'Delivered',         color: 'text-green-400',   bg: 'bg-green-400/10   border-green-400/20',   icon: <CheckCircle size={13} />, step: 4 },
  rejected:         { label: 'Rejected',          color: 'text-red-400',     bg: 'bg-red-400/10     border-red-400/20',     icon: <X size={13} />, step: -1 },
};

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getCustomerOrders(user.uid);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'out_for_delivery', label: 'On the Way' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-krunch-red font-body text-sm uppercase tracking-widest mb-1 block">My Account</span>
            <h1 className="section-title text-white text-3xl">MY <span className="text-krunch-red">ORDERS</span></h1>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 text-krunch-gray hover:text-white transition-colors font-body text-sm border border-krunch-border hover:border-krunch-red px-3 py-2 rounded-xl">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-body font-semibold text-sm transition-all ${
                filter === f.key ? 'bg-krunch-red text-white shadow-red-glow' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-krunch-card rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="font-heading font-bold text-2xl text-white uppercase mb-2">No orders found</p>
            <p className="text-krunch-gray font-body text-sm mb-6">Start ordering delicious food!</p>
            <Link to="/menu" className="btn-primary">Order Now</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order, i) => {
              const st = statusConfig[order.status] || statusConfig.pending;
              const date = order.createdAt?.toDate?.()?.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Recently';
              return (
                <motion.div key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="card-dark p-5 hover:border-krunch-red/30 transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-heading font-bold text-white text-lg">#{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-krunch-gray font-body text-xs mt-0.5">{date}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 ${st.color} ${st.bg} border px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0`}>
                      {st.icon} {st.label}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {order.items?.slice(0, 4).map((item, j) => (
                      <span key={j} className="text-xs bg-krunch-black border border-krunch-border text-krunch-light px-2.5 py-1 rounded-lg font-body">
                        {item.name} x{item.quantity}
                      </span>
                    ))}
                    {order.items?.length > 4 && (
                      <span className="text-xs bg-krunch-black border border-krunch-border text-krunch-gray px-2.5 py-1 rounded-lg font-body">
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t border-krunch-border">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-krunch-gray font-body text-[10px] uppercase">Total</p>
                        <p className="font-heading font-black text-krunch-red text-xl">Rs. {order.summary?.total?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-krunch-gray font-body text-[10px] uppercase">Payment</p>
                        <p className="text-white font-body text-xs font-semibold capitalize">{order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status !== 'delivered' && order.status !== 'rejected' && (
                        <Link to={`/track/${order.id}`}
                          className="flex items-center gap-1.5 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-bold text-xs px-3 py-2 rounded-xl transition-all">
                          <Truck size={12} /> Track
                        </Link>
                      )}
                      {order.status === 'delivered' && (
                        <Link to={`/review/${order.id}`}
                          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-body font-bold text-xs px-3 py-2 rounded-xl transition-all">
                          ⭐ Review
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
