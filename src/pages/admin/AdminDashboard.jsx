import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, Users, Clock, CheckCircle, ChefHat, Truck, XCircle, Wifi } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../firebase/orderService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AdminAIAssistant from '../../components/admin/AdminAIAssistant';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  pending:          { label: 'Pending',         color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: <Clock size={13} /> },
  confirmed:        { label: 'Confirmed',        color: 'text-blue-400',   bg: 'bg-blue-400/10   border-blue-400/20',  icon: <CheckCircle size={13} /> },
  preparing:        { label: 'Preparing',        color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20',icon: <ChefHat size={13} /> },
  out_for_delivery: { label: 'On the Way',       color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20',icon: <Truck size={13} /> },
  delivered:        { label: 'Delivered',        color: 'text-green-400',  bg: 'bg-green-400/10  border-green-400/20', icon: <CheckCircle size={13} /> },
  rejected:         { label: 'Rejected',         color: 'text-red-400',    bg: 'bg-red-400/10    border-red-400/20',   icon: <XCircle size={13} /> },
};

const StatCard = ({ icon, label, value, sub, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="card-dark p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
    </div>
    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{label}</p>
    <p className="font-heading font-black text-3xl text-white">{value}</p>
    {sub && <p className="text-krunch-gray font-body text-xs mt-1">{sub}</p>}
  </motion.div>
);

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const { onlineStaff, userData } = useAuth();

  useEffect(() => {
    const unsub = getAllOrders(setOrders);
    getDocs(collection(db, 'users')).then(snap => setCustomerCount(snap.size));
    return () => unsub();
  }, []);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => o.createdAt?.toDate?.()?.toDateString() === today);
  const todayRevenue = todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.summary?.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.summary?.total || 0), 0);

  const handleStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
  };

  const stats = [
    { icon: <ShoppingBag size={20} className="text-krunch-red" />,   label: "Today's Orders",   value: todayOrders.length,                  sub: `${pendingOrders.length} pending`,        color: 'bg-krunch-red/10',    delay: 0 },
    { icon: <TrendingUp size={20} className="text-green-400" />,     label: "Today's Revenue",  value: `Rs.${todayRevenue.toLocaleString()}`, sub: 'From delivered orders',                  color: 'bg-green-400/10',     delay: 0.08 },
    { icon: <Users size={20} className="text-blue-400" />,           label: 'Total Customers',  value: customerCount,                         sub: 'Registered users',                       color: 'bg-blue-400/10',      delay: 0.16 },
    { icon: <TrendingUp size={20} className="text-amber-400" />,     label: 'Total Revenue',    value: `Rs.${totalRevenue.toLocaleString()}`, sub: 'All time delivered',                     color: 'bg-amber-400/10',     delay: 0.24 },
  ];

  // Order status counts
  const statusCounts = Object.keys(statusConfig).reduce((acc, key) => {
    acc[key] = orders.filter(o => o.status === key).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">Dashboard Overview</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Online Staff Indicator — visible to admin only */}
      {userData?.role === 'admin' && onlineStaff.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-green-900/20 border border-green-700/30 rounded-2xl px-5 py-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={15} className="text-green-400" />
            <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wide">
              Staff Online Now
            </h3>
            <span className="ml-auto bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {onlineStaff.length} online
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {onlineStaff.map(staff => (
              <div key={staff.id} className="flex items-center gap-2 bg-krunch-black border border-green-700/20 rounded-xl px-3 py-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-green-900/50 border border-green-600/30 flex items-center justify-center text-green-400 font-bold text-xs">
                    {staff.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-krunch-black animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-body font-semibold text-xs">{staff.name}</p>
                  <p className="text-green-400 text-[10px] font-body capitalize">{staff.role} • Online</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Assistant */}
      <AdminAIAssistant />

      {/* Status Overview */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className={`card-dark p-3 text-center border ${cfg.bg}`}>
            <div className={`text-2xl font-heading font-black ${cfg.color}`}>{statusCounts[key] || 0}</div>
            <div className={`${cfg.color} font-body text-[10px] mt-0.5 uppercase tracking-wider`}>{cfg.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Orders — needs action */}
        <div className="card-dark">
          <div className="flex items-center justify-between px-5 py-4 border-b border-krunch-border">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Pending Orders ({pendingOrders.length})
            </h3>
          </div>
          <div className="p-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-krunch-gray font-body text-sm">All caught up!</p>
              </div>
            ) : pendingOrders.map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-krunch-black border border-krunch-border rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-body font-bold text-white text-sm">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-krunch-gray font-body text-xs">{order.customer?.name} • {order.customer?.phone}</p>
                  </div>
                  <p className="text-krunch-red font-heading font-black text-lg flex-shrink-0">Rs.{order.summary?.total?.toLocaleString()}</p>
                </div>
                <p className="text-krunch-gray font-body text-xs mb-3 truncate">{order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleStatus(order.id, 'confirmed')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-body font-bold text-xs py-2 rounded-lg transition-all">
                    ✅ Accept
                  </button>
                  <button onClick={() => handleStatus(order.id, 'rejected')}
                    className="flex-1 bg-red-700 hover:bg-red-800 text-white font-body font-bold text-xs py-2 rounded-lg transition-all">
                    ❌ Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card-dark">
          <div className="px-5 py-4 border-b border-krunch-border">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">Recent Orders</h3>
          </div>
          <div className="p-4 flex flex-col gap-2 max-h-96 overflow-y-auto">
            {orders.slice(0, 10).map((order, i) => {
              const st = statusConfig[order.status] || statusConfig.pending;
              return (
                <div key={order.id} className="flex items-center gap-3 py-2 border-b border-krunch-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-white text-xs">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-krunch-gray font-body text-[10px] truncate">{order.customer?.name}</p>
                  </div>
                  <span className="text-krunch-red font-heading font-bold text-sm flex-shrink-0">Rs.{order.summary?.total?.toLocaleString()}</span>
                  <div className={`flex items-center gap-1 ${st.color} ${st.bg} border px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0`}>
                    {st.icon} {st.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
