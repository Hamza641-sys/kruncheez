import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Users, Star } from 'lucide-react';
import { getAllOrders } from '../../firebase/orderService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminAnalytics = () => {
  const [orders, setOrders]       = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const unsub = getAllOrders(setOrders);
    getDocs(collection(db, 'users')).then(snap =>
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const delivered = orders.filter(o => o.status === 'delivered');
  const totalRevenue = delivered.reduce((s, o) => s + (o.summary?.total || 0), 0);

  // Last 7 days revenue
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-PK', { weekday: 'short' });
    const dayOrders = delivered.filter(o => {
      const od = o.createdAt?.toDate?.();
      return od && od.toDateString() === d.toDateString();
    });
    const revenue = dayOrders.reduce((s, o) => s + (o.summary?.total || 0), 0);
    return { label, revenue, orders: dayOrders.length };
  });

  const maxRev = Math.max(...last7.map(d => d.revenue), 1);

  // Top items
  const itemCounts = {};
  orders.forEach(o => o.items?.forEach(i => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
  }));
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Status breakdown
  const statusBreak = ['pending','confirmed','preparing','out_for_delivery','delivered','rejected'].map(s => ({
    status: s, count: orders.filter(o => o.status === s).length
  }));

  const statCards = [
    { label: 'Total Revenue',  value: `Rs.${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={20} className="text-green-400" />,  color: 'bg-green-400/10' },
    { label: 'Total Orders',   value: orders.length,                          icon: <ShoppingBag size={20} className="text-blue-400" />,   color: 'bg-blue-400/10' },
    { label: 'Delivered',      value: delivered.length,                       icon: <Star size={20} className="text-amber-400" />,         color: 'bg-amber-400/10' },
    { label: 'Customers',      value: customers.length,                       icon: <Users size={20} className="text-purple-400" />,       color: 'bg-purple-400/10' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">Analytics</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">Business performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-dark p-5">
            <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-heading font-black text-2xl text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart — Last 7 Days */}
        <div className="card-dark p-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-5">
            Revenue — Last 7 Days
          </h3>
          <div className="flex items-end gap-2 h-40">
            {last7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-krunch-gray font-body text-[9px]">
                  {d.revenue > 0 ? `Rs.${(d.revenue/1000).toFixed(1)}k` : ''}
                </p>
                <div className="w-full rounded-t-lg transition-all duration-500 bg-krunch-red/20 relative overflow-hidden"
                  style={{ height: `${Math.max((d.revenue / maxRev) * 100, 4)}%` }}>
                  <div className="absolute inset-0 bg-krunch-red rounded-t-lg opacity-80" />
                </div>
                <p className="text-krunch-gray font-body text-[9px]">{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card-dark p-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-5">
            Top Selling Items
          </h3>
          {topItems.length === 0 ? (
            <div className="text-center py-8 text-krunch-gray font-body text-sm">No data yet</div>
          ) : (
            <div className="flex flex-col gap-3">
              {topItems.map(([name, count], i) => {
                const pct = Math.round((count / (topItems[0]?.[1] || 1)) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-body text-sm truncate">{name}</span>
                      <span className="text-krunch-red font-heading font-bold text-sm ml-2 flex-shrink-0">
                        {count} sold
                      </span>
                    </div>
                    <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full bg-krunch-red rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="card-dark p-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-5">
            Order Status Breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {statusBreak.map((s, i) => {
              const pct = orders.length ? Math.round((s.count / orders.length) * 100) : 0;
              const colors = {
                pending: 'bg-yellow-400', confirmed: 'bg-blue-400',
                preparing: 'bg-orange-400', out_for_delivery: 'bg-purple-400',
                delivered: 'bg-green-400', rejected: 'bg-red-400',
              };
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-krunch-gray font-body text-xs capitalize">{s.status.replace('_',' ')}</span>
                    <span className="text-white font-body font-bold text-xs">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-krunch-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className={`h-full ${colors[s.status]} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card-dark p-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-5">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Avg Order Value', value: delivered.length ? `Rs.${Math.round(totalRevenue/delivered.length).toLocaleString()}` : 'N/A' },
              { label: 'Delivery Rate',   value: orders.length ? `${Math.round((delivered.length/orders.length)*100)}%` : 'N/A' },
              { label: 'Today Orders',    value: orders.filter(o => o.createdAt?.toDate?.()?.toDateString() === new Date().toDateString()).length },
              { label: 'Today Revenue',   value: `Rs.${delivered.filter(o => o.createdAt?.toDate?.()?.toDateString() === new Date().toDateString()).reduce((s,o) => s+(o.summary?.total||0),0).toLocaleString()}` },
            ].map((s, i) => (
              <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-4 text-center">
                <p className="font-heading font-black text-xl text-krunch-red">{s.value}</p>
                <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
