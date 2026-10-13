import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TrendingUp, ShoppingBag, Users, Star, Download, Calendar } from 'lucide-react';

const periods = [
  { key: 'today',   label: 'Today' },
  { key: 'week',    label: 'This Week' },
  { key: 'month',   label: 'This Month' },
  { key: 'year',    label: 'This Year' },
  { key: 'all',     label: 'All Time' },
];

const getStartDate = (period) => {
  const now = new Date();
  if (period === 'today') return new Date(now.setHours(0,0,0,0));
  if (period === 'week')  { const d = new Date(); d.setDate(d.getDate() - 7); return d; }
  if (period === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; }
  if (period === 'year')  { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; }
  return null;
};

const AdminReports = () => {
  const [period, setPeriod]     = useState('today');
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const start = getStartDate(period);
        if (start) {
          data = data.filter(o => o.createdAt?.toDate?.() >= start);
        }
        setOrders(data);
      } catch { setOrders([]); }
      setLoading(false);
    };
    load();
  }, [period]);

  // ── Calculations ──────────────────────────────────────────────────────
  const delivered  = orders.filter(o => o.status === 'delivered');
  const totalRev   = delivered.reduce((s, o) => s + (o.summary?.total || 0), 0);
  const avgOrder   = delivered.length ? Math.round(totalRev / delivered.length) : 0;
  const pending    = orders.filter(o => o.status === 'pending').length;
  const rejected   = orders.filter(o => o.status === 'rejected').length;

  // Item popularity
  const itemCount = {};
  orders.forEach(o => o.items?.forEach(i => {
    itemCount[i.name] = (itemCount[i.name] || 0) + (i.quantity || 1);
  }));
  const topItems = Object.entries(itemCount).sort((a,b) => b[1]-a[1]).slice(0, 10);

  // Category revenue
  const catRev = {};
  orders.forEach(o => o.items?.forEach(i => {
    catRev[i.category] = (catRev[i.category] || 0) + (i.price * i.quantity);
  }));
  const topCats = Object.entries(catRev).sort((a,b) => b[1]-a[1]);

  // Orders by day (last 7)
  const last7 = Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const label = d.toLocaleDateString('en-PK', { weekday: 'short', day:'numeric' });
    const dayOrders = orders.filter(o => {
      const od = o.createdAt?.toDate?.();
      return od && od.toDateString() === d.toDateString();
    });
    const rev = dayOrders.filter(o => o.status === 'delivered').reduce((s,o) => s+(o.summary?.total||0), 0);
    return { label, orders: dayOrders.length, revenue: rev };
  });
  const maxRev = Math.max(...last7.map(d => d.revenue), 1);

  // Payment method breakdown
  const cashOrders = orders.filter(o => o.paymentMethod === 'cash').length;
  const cardOrders = orders.filter(o => o.paymentMethod === 'card').length;

  // Order type breakdown
  const dineIn    = orders.filter(o => o.orderType === 'dine-in' || o.tableNumber).length;
  const delivery  = orders.filter(o => o.orderType === 'delivery').length;
  const pickup    = orders.filter(o => o.orderType === 'pickup').length;

  const downloadCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Type'],
      ...orders.map(o => [
        o.id.slice(0,8).toUpperCase(),
        o.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || '',
        o.customer?.name || '',
        o.items?.map(i => `${i.name}x${i.quantity}`).join(' | ') || '',
        o.summary?.total || 0,
        o.status,
        o.paymentMethod,
        o.orderType || 'delivery',
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kruncheez-report-${period}-${new Date().toLocaleDateString('en-PK').replace(/\//g,'-')}.csv`;
    a.click();
  };

  const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="card-dark p-5">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-heading font-black text-2xl text-white">{value}</p>
      {sub && <p className="text-krunch-gray font-body text-xs mt-1">{sub}</p>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Sales Reports</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{orders.length} orders in selected period</p>
        </div>
        <button onClick={downloadCSV}
          className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              period === p.key ? 'bg-krunch-red text-white shadow-red-glow' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            <Calendar size={13} /> {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<TrendingUp size={20} className="text-green-400"/>} label="Total Revenue" value={`Rs.${totalRev.toLocaleString()}`} sub={`${delivered.length} delivered`} color="bg-green-400/10" />
            <StatCard icon={<ShoppingBag size={20} className="text-blue-400"/>} label="Total Orders" value={orders.length} sub={`${pending} pending`} color="bg-blue-400/10" />
            <StatCard icon={<Star size={20} className="text-amber-400"/>} label="Avg Order Value" value={`Rs.${avgOrder.toLocaleString()}`} sub="per delivered order" color="bg-amber-400/10" />
            <StatCard icon={<Users size={20} className="text-purple-400"/>} label="Rejected" value={rejected} sub={`${orders.length ? Math.round((rejected/orders.length)*100) : 0}% rejection rate`} color="bg-purple-400/10" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-5">Revenue — Last 7 Days</h3>
              <div className="flex items-end gap-2 h-36">
                {last7.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-krunch-gray font-body text-[9px]">
                      {d.revenue > 0 ? `Rs.${(d.revenue/1000).toFixed(1)}k` : ''}
                    </p>
                    <div className="w-full rounded-t-lg bg-krunch-red/20 relative overflow-hidden"
                      style={{ height: `${Math.max((d.revenue/maxRev)*100, 4)}%` }}>
                      <div className="absolute inset-0 bg-krunch-red rounded-t-lg" />
                    </div>
                    <p className="text-krunch-gray font-body text-[9px] text-center leading-tight">{d.label}</p>
                    <p className="text-krunch-gray font-body text-[9px]">{d.orders} orders</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Items */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Top Selling Items</h3>
              {topItems.length === 0 ? (
                <p className="text-krunch-gray font-body text-sm text-center py-8">No data</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {topItems.slice(0,7).map(([name, count], i) => {
                    const pct = Math.round((count / (topItems[0]?.[1]||1))*100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-krunch-red font-heading font-black text-sm w-4">{i+1}</span>
                            <span className="text-white font-body text-xs truncate max-w-[160px]">{name}</span>
                          </div>
                          <span className="text-krunch-red font-body font-bold text-xs">{count} sold</span>
                        </div>
                        <div className="h-1.5 bg-krunch-border rounded-full overflow-hidden">
                          <div className="h-full bg-krunch-red rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Order Status Breakdown */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Order Status</h3>
              {[
                { label: 'Delivered',  value: delivered.length,   color: 'bg-green-400' },
                { label: 'Pending',    value: pending,             color: 'bg-yellow-400' },
                { label: 'Rejected',   value: rejected,            color: 'bg-red-400' },
                { label: 'Processing', value: orders.filter(o => ['confirmed','preparing','out_for_delivery'].includes(o.status)).length, color: 'bg-blue-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-krunch-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-krunch-gray font-body text-sm">{s.label}</span>
                  </div>
                  <span className="text-white font-body font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Payment Methods</h3>
              {[
                { label: 'Cash on Delivery', value: cashOrders, color: 'bg-amber-400' },
                { label: 'Card / Online',    value: cardOrders, color: 'bg-blue-400' },
              ].map((s, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-krunch-gray font-body text-sm">{s.label}</span>
                    <span className="text-white font-body font-bold text-sm">{s.value}</span>
                  </div>
                  <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`}
                      style={{ width: `${orders.length ? (s.value/orders.length)*100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Order Types */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Order Types</h3>
              {[
                { label: 'Dine-In',  value: dineIn,    icon: '🪑', color: 'bg-amber-400' },
                { label: 'Delivery', value: delivery,  icon: '🛵', color: 'bg-krunch-red' },
                { label: 'Pickup',   value: pickup,    icon: '🏃', color: 'bg-blue-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-krunch-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{s.icon}</span>
                    <span className="text-krunch-gray font-body text-sm">{s.label}</span>
                  </div>
                  <span className="text-white font-body font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Revenue */}
          <div className="card-dark p-5 mb-6">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Revenue by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topCats.slice(0,8).map(([cat, rev], i) => (
                <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                  <p className="text-krunch-red font-heading font-black text-lg">Rs.{(rev/1000).toFixed(1)}k</p>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider capitalize mt-0.5">{cat}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="card-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-krunch-border">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-krunch-border">
                    {['Order ID','Date','Customer','Items','Total','Status','Payment'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0,20).map((o, i) => (
                    <tr key={o.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                      <td className="px-4 py-2.5 text-krunch-red font-body font-bold text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                      <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">
                        {o.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-white font-body text-xs">{o.customer?.name || '—'}</td>
                      <td className="px-4 py-2.5 text-krunch-gray font-body text-xs">{o.items?.length || 0} items</td>
                      <td className="px-4 py-2.5 text-krunch-red font-heading font-bold text-sm whitespace-nowrap">Rs.{(o.summary?.total||0).toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          o.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                          o.status === 'rejected'  ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-krunch-gray font-body text-xs capitalize">{o.paymentMethod === 'cash' ? 'COD' : 'Card'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
