import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Search, Phone, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [sortBy, setSortBy]     = useState('totalSpent');
  const [tab, setTab]           = useState('all');
  const [dateFilter, setDateFilter] = useState('shift');
  const todayStr = new Date().toISOString().split('T')[0];
  const [customFrom, setCustomFrom] = useState(todayStr + 'T11:00');
  const [customTo,   setCustomTo]   = useState(todayStr + 'T03:00');

  useEffect(() => {
    getDocs(collection(db, 'orders')).then(snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  // ── Date range helper ─────────────────────────────────────────────────
  const getDateRange = () => {
    if (dateFilter === 'shift') {
      const now = new Date();
      const d = new Date();
      if (now.getHours() < 3) d.setDate(d.getDate() - 1);
      d.setHours(11, 0, 0, 0);
      return { from: d, to: null };
    }
    if (dateFilter === 'today') { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: null }; }
    if (dateFilter === 'week')  { const d = new Date(); d.setDate(d.getDate()-7); return { from: d, to: null }; }
    if (dateFilter === 'custom') {
      const from = customFrom ? new Date(customFrom) : null;
      const to   = customTo   ? new Date(customTo)   : null;
      if (from && to && to < from) to.setDate(to.getDate() + 1);
      return { from, to };
    }
    return { from: null, to: null };
  };

  const inRange = (o) => {
    const { from, to } = getDateRange();
    if (!from) return true;
    const d = o.createdAt?.toDate?.();
    if (!d) return true;
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  };

  // ── Build customer profiles keyed by PHONE ────────────────────────────
  const customerMap = {};
  orders.filter(inRange).forEach(o => {
    const phone = o.customer?.phone?.trim();
    if (!phone) return;
    if (!customerMap[phone]) {
      customerMap[phone] = {
        phone,
        name:          o.customer?.name || '—',
        isGoogle:      !!o.userId,   // has userId = logged in with Google
        userId:        o.userId || null,
        orders:        [],
        totalSpent:    0,
        visits:        0,
        pendingAmt:    0,
        paidAmt:       0,
        cashAmt:       0,
        easypaisaAmt:  0,
        lastOrder:     null,
      };
    }
    const c = customerMap[phone];
    c.orders.push(o);
    // If any order has userId, mark as Google member
    if (o.userId) { c.isGoogle = true; c.userId = o.userId; }
    // Always use latest name
    if (o.customer?.name) c.name = o.customer.name;
    if (o.status === 'delivered') {
      const amt = o.summary?.total || 0;
      c.totalSpent   += amt;
      c.visits       += 1;
      if (o.paymentMethod === 'easypaisa') c.easypaisaAmt += amt;
      else c.cashAmt += amt;
      if (o.paymentStatus === 'paid') c.paidAmt    += amt;
      else                            c.pendingAmt += amt;
    }
    const d = o.createdAt?.toDate?.();
    if (d && (!c.lastOrder || d > c.lastOrder)) c.lastOrder = d;
  });

  const allCustomers = Object.values(customerMap);
  const googleCustomers = allCustomers.filter(c => c.isGoogle);
  const guestCustomers  = allCustomers.filter(c => !c.isGoogle);

  const sourceList = tab === 'member' ? googleCustomers
                   : tab === 'guest'  ? guestCustomers
                   : allCustomers;

  // Filter by PHONE first, then name
  const filtered = sourceList
    .filter(c =>
      !search ||
      c.phone.includes(search) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'totalSpent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'visits')     return b.visits - a.visits;
      if (sortBy === 'lastOrder')  return (b.lastOrder || 0) - (a.lastOrder || 0);
      return 0;
    });

  const totalRev     = allCustomers.reduce((s, c) => s + c.totalSpent, 0);
  const vipCount     = allCustomers.filter(c => c.visits >= 10).length;
  const regularCount = allCustomers.filter(c => c.visits >= 2 && c.visits < 10).length;

  const badge = (c) => {
    if (c.visits >= 10) return { label: '👑 VIP',     color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    if (c.visits >= 2)  return { label: '⭐ Regular', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
    return                     { label: '🆕 New',     color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' };
  };

  const fmtDate = (d) => !d ? '—' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
  const fmtDT   = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleDateString('en-PK', { day:'2-digit', month:'short' }) + ' ' +
           d.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-heading font-black text-2xl text-white uppercase">👥 Customer Database</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">
          Customers identified by phone number — full order history
        </p>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        {[
          { k: 'shift',  l: '🍽️ Today Shift (11am–3am)' },
          { k: 'today',  l: 'Today' },
          { k: 'week',   l: 'This Week' },
          { k: 'all',    l: 'All Time' },
          { k: 'custom', l: '📅 Custom Range' },
        ].map(d => (
          <button key={d.k} onClick={() => setDateFilter(d.k)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              dateFilter === d.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {d.l}
          </button>
        ))}
      </div>

      {/* Custom Range inputs */}
      {dateFilter === 'custom' && (
        <div className="flex gap-3 mb-4 card-dark p-4">
          <div className="flex-1">
            <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">From</label>
            <input type="datetime-local" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
          </div>
          <div className="flex-1">
            <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">To</label>
            <input type="datetime-local" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Customers',    value: allCustomers.length,          icon: '👥', color: 'text-white' },
          { label: 'Total Revenue',      value: `Rs.${totalRev.toLocaleString()}`, icon: '💰', color: 'text-green-400' },
          { label: '✅ Google Members',  value: googleCustomers.length,       icon: '✅', color: 'text-green-400' },
          { label: '👤 Guest Customers', value: guestCustomers.length,        icon: '👤', color: 'text-orange-400' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-5">
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-heading font-black text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs: All / Google Members / Guests */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        {[
          { k: 'all',    l: `All (${allCustomers.length})` },
          { k: 'member', l: `✅ Google Members (${googleCustomers.length})` },
          { k: 'guest',  l: `👤 Guest (${guestCustomers.length})` },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              tab === t.k
                ? t.k === 'member' ? 'bg-green-700 text-white'
                : t.k === 'guest'  ? 'bg-orange-700 text-white'
                : 'bg-krunch-red text-white'
                : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search by phone number or name..."
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

      {/* List */}
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
            const custOrders = [...c.orders].sort((a, b) =>
              (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
            );
            return (
              <motion.div key={c.phone}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card-dark overflow-hidden">

                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-krunch-card/50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : c.phone)}>

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-krunch-red/20 border border-krunch-red/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-krunch-red font-heading font-black text-lg">
                      {c.phone.slice(-2)}
                    </span>
                  </div>

                  {/* Info — phone primary, name secondary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-body font-bold text-sm">{c.phone}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color}`}>{b.label}</span>
                      {c.isGoogle
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-green-400 bg-green-400/10 border-green-400/20">✅ Google</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-orange-400 bg-orange-400/10 border-orange-400/20">👤 Guest</span>
                      }
                    </div>
                    <p className="text-krunch-gray font-body text-xs mt-0.5">{c.name}</p>
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

                {/* Expanded history */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
                      className="overflow-hidden border-t border-krunch-border">
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
                            {custOrders.map(o => {
                              const st = statusConfig[o.status] || statusConfig.pending;
                              return (
                                <tr key={o.id} className="border-b border-krunch-border/50 hover:bg-krunch-card/30 transition-colors">
                                  <td className="px-4 py-2.5 font-body font-bold text-white text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                                  <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">{fmtDT(o.createdAt)}</td>
                                  <td className="px-4 py-2.5 text-krunch-gray font-body text-xs">{o.items?.map(i => `${i.name} x${i.quantity||1}`).join(', ') || '—'}</td>
                                  <td className="px-4 py-2.5 text-krunch-red font-heading font-black text-sm whitespace-nowrap">Rs.{(o.summary?.total||0).toLocaleString()}</td>
                                  <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">{o.paymentMethod==='easypaisa'?'📱 Easypaisa':'💵 Cash'}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.paymentStatus==='paid'?'text-green-400 bg-green-400/10 border-green-400/20':'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                                      {o.paymentStatus==='paid'?'✅ Paid':'⏳ Pending'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color} ${st.bg}`}>{st.label}</span>
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
