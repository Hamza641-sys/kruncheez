import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, MapPin, Gift, ArrowRight, Clock, CheckCircle, ChefHat, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrders } from '../../firebase/orderService';

const statusConfig = {
  pending:          { label: 'Pending',          color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  icon: <Clock size={14} /> },
  confirmed:        { label: 'Confirmed',         color: 'text-blue-400',    bg: 'bg-blue-400/10',    icon: <CheckCircle size={14} /> },
  preparing:        { label: 'Preparing',         color: 'text-orange-400',  bg: 'bg-orange-400/10',  icon: <ChefHat size={14} /> },
  out_for_delivery: { label: 'Out for Delivery',  color: 'text-purple-400',  bg: 'bg-purple-400/10',  icon: <Truck size={14} /> },
  delivered:        { label: 'Delivered',         color: 'text-green-400',   bg: 'bg-green-400/10',   icon: <CheckCircle size={14} /> },
  rejected:         { label: 'Rejected',          color: 'text-red-400',     bg: 'bg-red-400/10',     icon: <Clock size={14} /> },
};

const DashboardPage = () => {
  const { userData, user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCustomerOrders(user.uid).then(orders => {
      setRecentOrders(orders.slice(0, 3));
      setLoading(false);
    });
  }, [user]);

  const stats = [
    { icon: <ShoppingBag size={20} className="text-krunch-red" />, label: 'Total Orders', value: userData?.totalOrders || 0, link: '/my-orders' },
    { icon: <Gift size={20} className="text-amber-400" />, label: 'Loyalty Points', value: userData?.loyaltyPoints || 0, link: '/loyalty' },
    { icon: <Star size={20} className="text-yellow-400" />, label: 'Total Spent', value: `Rs. ${(userData?.totalSpent || 0).toLocaleString()}`, link: '/my-orders' },
    { icon: <MapPin size={20} className="text-green-400" />, label: 'Saved Addresses', value: userData?.addresses?.length || 0, link: '/addresses' },
  ];

  const quickActions = [
    { icon: '🍔', label: 'Order Food', path: '/menu', color: 'bg-krunch-red' },
    { icon: '📦', label: 'My Orders', path: '/my-orders', color: 'bg-blue-600' },
    { icon: '📍', label: 'Addresses', path: '/addresses', color: 'bg-green-600' },
    { icon: '🎁', label: 'Loyalty', path: '/loyalty', color: 'bg-amber-600' },
    { icon: '⭐', label: 'Reviews', path: '/reviews', color: 'bg-purple-600' },
    { icon: '👤', label: 'Profile', path: '/profile', color: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-krunch-red to-krunch-darkred rounded-2xl p-6 mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-red-200 font-body text-sm uppercase tracking-widest mb-1">Welcome back,</p>
              <h1 className="font-heading font-black text-3xl text-white uppercase">
                {userData?.name || user?.displayName || 'Customer'} 👋
              </h1>
              <p className="text-red-200 font-body text-sm mt-1">
                You have <span className="text-white font-bold">{userData?.loyaltyPoints || 0}</span> loyalty points
              </p>
            </div>
            <Link to="/menu"
              className="flex items-center gap-2 bg-white text-krunch-red font-heading font-black text-sm px-5 py-3 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-wider whitespace-nowrap">
              Order Now <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={s.link} className="card-dark p-4 flex flex-col gap-3 group hover:border-krunch-red/50 transition-all block">
                <div className="w-10 h-10 bg-krunch-black rounded-xl flex items-center justify-center">
                  {s.icon}
                </div>
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
                  <p className="font-heading font-black text-2xl text-white group-hover:text-krunch-red transition-colors">{s.value}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((a, i) => (
                  <Link key={i} to={a.path}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-krunch-black border border-krunch-border hover:border-krunch-red/50 transition-all group">
                    <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                      {a.icon}
                    </div>
                    <span className="text-krunch-gray font-body text-[10px] text-center group-hover:text-white transition-colors">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Loyalty Card */}
            <div className="mt-4 card-dark p-5 bg-gradient-to-br from-amber-900/20 to-krunch-card">
              <div className="flex items-center gap-2 mb-3">
                <Gift size={18} className="text-amber-400" />
                <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">Loyalty Points</h3>
              </div>
              <div className="text-center py-3">
                <div className="font-heading font-black text-5xl text-amber-400">{userData?.loyaltyPoints || 0}</div>
                <p className="text-krunch-gray font-body text-xs mt-1">Points earned</p>
              </div>
              <div className="bg-krunch-black rounded-xl p-3 mt-2">
                <div className="flex justify-between text-xs font-body mb-1.5">
                  <span className="text-krunch-gray">Progress to next reward</span>
                  <span className="text-amber-400 font-semibold">{userData?.loyaltyPoints || 0}/500</span>
                </div>
                <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((userData?.loyaltyPoints || 0) / 500) * 100, 100)}%` }} />
                </div>
                <p className="text-krunch-gray font-body text-[10px] mt-1.5">
                  Earn 1 point per Rs.10 spent
                </p>
              </div>
              <Link to="/loyalty" className="mt-3 block text-center text-amber-400 font-body text-xs hover:text-white transition-colors">
                Redeem Points →
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="card-dark p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">Recent Orders</h3>
                <Link to="/my-orders" className="text-krunch-red font-body text-xs hover:text-white transition-colors flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>

              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-20 bg-krunch-black rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🍽️</div>
                  <p className="font-heading font-bold text-white text-lg uppercase">No orders yet</p>
                  <p className="text-krunch-gray font-body text-sm mt-1 mb-5">Place your first order now!</p>
                  <Link to="/menu" className="btn-primary text-sm">Browse Menu</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentOrders.map((order, i) => {
                    const st = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <motion.div key={order.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-krunch-black border border-krunch-border rounded-xl p-4 flex items-center gap-4 group hover:border-krunch-red/30 transition-all"
                      >
                        <div className="w-12 h-12 bg-krunch-card rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          🍔
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-white text-sm">Order #{order.id.slice(0,8).toUpperCase()}</p>
                          <p className="text-krunch-gray font-body text-xs mt-0.5 truncate">
                            {order.items?.length} items • Rs. {order.summary?.total?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className={`flex items-center gap-1.5 ${st.color} ${st.bg} px-2.5 py-1 rounded-full text-xs font-bold`}>
                            {st.icon} {st.label}
                          </div>
                          <Link to={`/track/${order.id}`}
                            className="text-krunch-red font-body text-[10px] hover:text-white transition-colors">
                            Track Order →
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
