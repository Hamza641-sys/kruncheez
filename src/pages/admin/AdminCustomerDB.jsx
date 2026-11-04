import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Search, X, Phone, ShoppingBag, TrendingUp, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const statusConfig = {
  pending:          { label: 'Pending',         color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  confirmed:        { label: 'Confirmed',        color: 'text-blue-400',   bg: 'bg-blue-400/10   border-blue-400/20'  },
  preparing:        { label: 'Preparing',        color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20'},
  out_for_delivery: { label: 'Out for Delivery', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20'},
  delivered:        { label: 'Delivered',        color: 'text-green-400',  bg: 'bg-green-400/10  border-green-400/20' },
  rejected:         { label: 'Rejected',         color: 'text-red-400',    bg: 'bg-red-400/10    border-red-400/20'   },
};

const AdminCustomerDB = () => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy]     = useState('totalSpent'); // totalSpent | visits | lastOrder

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'orders'));
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  // Build customer profiles from orders
  const customerMap = {};
  orders.forEach(o => {
    const phone = o.customer?.phone;
    if (!phone) return;
    if (!customerMap[phone]) {
      customerMap[phone] = {
        phone,
        name: o.customer?.name || '—',
        orders: [],
        totalSpent: 0,
        visits: 0,
        pendingAmt: 0,
        paidAmt: 0,
        cashAmt: 0,
        easypaisaAmt: 0,
        lastOrder: null,
      };
    }
    const c = customerMap[phone];
    c.orders.push(o);
    if (o.status === 'delivered') {
      const amt = o.summary?.total || 0;
      c.totalSpent += amt;
      c.visits += 1;
      if (o.paymentMethod === 'easypaisa') c.easypaisaAmt += amt;
      else c.cashAmt += amt;
      if (o.paymentStatus === 'paid') c.paidAmt += amt;
      else c.pendingAmt += amt;
    }
    // update name to latest
    if (o.customer?.name) c.name = o.customer.name;
    // last order date
    const d = o.createdAt?.toDate?.();
    if (d && (!c.lastOrder || d > c.lastOrder)) c.lastOrder = d;
  });

  const customers = Object.values(customerMap);

  // Filter + Sort
  const filtered = customers
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    )
    .sort((a, b) => {
      if (sortBy === 'totalSpent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'visits')     return b.visits - a.visits;
      if (sortBy === 'lastOrder')  return (b.lastOrder||0) - (a.lastOrder||0);
      return 0;
    });

  const totalCustomers  = customers.length;
  const totalRevenue    = customers.reduce((s, c) => s + c.totalSpent, 0);
  const vipCustomers    = customers.filter(c => c.visits >= 10).length;
  const regularCustomers= customers.filter(c => c.visits >= 2 && c.visits < 10).length;

  const badge = (c) => {
    if (c.visits >= 10) return { label: '👑 VIP',      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    if (c.visits >= 2)  return { label: '⭐ Regular',  color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
    return                     { label: '🆕 New',      color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' };
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
  };

  const fmtDateTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleDateString('en-PK', { day:'2-digit', month:'short' }) + ' ' +
           d.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">👥 Customer Database</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">
          All customers with order history, visits & spending
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Customers', value: totalCustomers, icon: '👥', color: 'text-white' },
          { label: 'Total Revenue',   value: `Rs.${totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-green-400' },
          { label: '👑 VIP Customers', value: vipCustomers,  icon: '👑', color: 'text-amber-400' },
          { label: '⭐ Regular',       value: regularCustomers, icon: '⭐', color: 'text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-5">
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-heading font-black text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search by name or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-krunch-card border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none cursor-pointer">
          <option value="totalSpent">Sort: Most Spent</option>
          <option value="visits">Sort: Most Visits</option>
          <option value="lastOrder">Sort: Recent Order</option>
        </select>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-krunch-gray font-body text-sm">No customers found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c, i) => {
            const b = badge(c);
            const isOpen = expanded === c.phone;
            const customerOrders = c.orders.sort((a, b) =>
              (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
            );
            return (
              <motion.div key={c.phone}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card-dark overflow-hidden">

                {/* Customer Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-krunch-card/50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : c.phone)}
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-krunch-red/20 border border-krunch-red/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-krunch-red font-heading font-black text-lg">
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-body font-semibold text-sm">{c.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color}`}>
                        {b.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-krunch-gray" />
                      <p className="text-krunch-gray font-body text-xs">{c.phone}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-krunch-red font-heading font-black text-lg">Rs.{c.totalSpent.toLocaleString()}</p>
                      <p className="text-krunch-gray font-body text-[10px]">Total Spent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-heading font-black text-lg">{c.visits}</p>
                      <p className="text-krunch-gray font-body text-[10px]">Visits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-body text-xs">{fmtDate(c.lastOrder)}</p>
                      <p className="text-krunch-gray font-body text-[10px]">Last Order</p>
                    </div>
                    {c.pendingAmt > 0 && (
                      <div className="text-center">
                        <p className="text-amber-400 font-heading font-black text-base">Rs.{c.pendingAmt.toLocaleString()}</p>
                        <p className="text-krunch-gray font-body text-[10px]">⏳ Pending</p>
                      </div>
                    )}
                  </div>

                  {/* Expand */}
                  <button className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all flex-shrink-0">
                    {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Mobile stats */}
                <div className="sm:hidden flex gap-4 px-5 pb-3">
                  <div><p className="text-krunch-red font-bold text-sm">Rs.{c.totalSpent.toLocaleString()}</p><p className="text-krunch-gray text-[10px]">Spent</p></div>
                  <div><p className="text-white font-bold text-sm">{c.visits}</p><p className="text-krunch-gray text-[10px]">Visits</p></div>
                  <div><p className="text-white text-xs">{fmtDate(c.lastOrder)}</p><p className="text-krunch-gray text-[10px]">Last</p></div>
                  {c.pendingAmt > 0 && <div><p className="text-amber-400 font-bold text-sm">Rs.{c.pendingAmt.toLocaleString()}</p><p className="text-krunch-gray text-[10px]">⏳</p></div>}
                </div>

                {/* Expanded Order History */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-krunch-border"
                    >
                      {/* Payment breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-krunch-black/50">
                        <div className="bg-krunch-card rounded-xl p-3 text-center">
                          <p className="text-krunch-gray font-body text-[10px] uppercase mb-1">Total Orders</p>
                          <p className="text-white font-heading font-black text-xl">{c.orders.length}</p>
                        </div>
                        <div className="bg-krunch-card rounded-xl p-3 text-center">
                          <p className="text-krunch-gray font-body text-[10px] uppercase mb-1">💵 Cash</p>
                          <p className="text-white font-heading font-black text-xl">Rs.{c.cashAmt.toLocaleString()}</p>
                        </div>
                        <div className="bg-krunch-card rounded-xl p-3 text-center">
                          <p className="text-krunch-gray font-body text-[10px] uppercase mb-1">📱 Easypaisa</p>
                          <p className="text-green-400 font-heading font-black text-xl">Rs.{c.easypaisaAmt.toLocaleString()}</p>
                        </div>
                        <div className="bg-krunch-card rounded-xl p-3 text-center">
                          <p className="text-krunch-gray font-body text-[10px] uppercase mb-1">⏳ Pending</p>
                          <p className="text-amber-400 font-heading font-black text-xl">Rs.{c.pendingAmt.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Orders table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-krunch-border bg-krunch-black/30">
                              {['Order ID','Date','Items','Total','Method','Pay Status','Order Status'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-krunch-gray font-body text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {customerOrders.map((o) => {
                              const st = statusConfig[o.status] || statusConfig.pending;
                              return (
                                <tr key={o.id} className="border-b border-krunch-border/50 hover:bg-krunch-card/30 transition-colors">
                                  <td className="px-4 py-2.5 font-body font-bold text-white text-xs">
                                    #{o.id.slice(0,8).toUpperCase()}
                                  </td>
                                  <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">
                                    {fmtDateTime(o.createdAt)}
                                  </td>
                                  <td className="px-4 py-2.5 text-krunch-gray font-body text-xs">
                                    {o.items?.map(i => `${i.name} x${i.quantity||1}`).join(', ') || '—'}
                                  </td>
                                  <td className="px-4 py-2.5 text-krunch-red font-heading font-black text-sm whitespace-nowrap">
                                    Rs.{(o.summary?.total||0).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">
                                    {o.paymentMethod === 'easypaisa' ? '📱 Easypaisa' : '💵 Cash'}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      o.paymentStatus === 'paid'
                                        ? 'text-green-400 bg-green-400/10 border-green-400/20'
                                        : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                                    }`}>
                                      {o.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color} ${st.bg}`}>
                                      {st.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCustomerDB;
