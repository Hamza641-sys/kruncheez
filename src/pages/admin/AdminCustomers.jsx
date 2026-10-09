import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Star, ShoppingBag, TrendingUp, X } from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const makeAdmin = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { role: 'admin' });
    setCustomers(prev => prev.map(c => c.id === uid ? { ...c, role: 'admin' } : c));
    toast.success('User promoted to admin!', toastStyle);
  };

  const removeAdmin = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { role: 'customer' });
    setCustomers(prev => prev.map(c => c.id === uid ? { ...c, role: 'customer' } : c));
    toast.success('Admin rights removed', toastStyle);
  };

  const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.totalOrders || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">Customers</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">{customers.length} registered users</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: <ShoppingBag size={18} className="text-blue-400" />, label: 'Total Customers', value: customers.length, color: 'bg-blue-400/10' },
          { icon: <TrendingUp size={18} className="text-green-400" />, label: 'Total Revenue', value: `Rs.${totalRevenue.toLocaleString()}`, color: 'bg-green-400/10' },
          { icon: <Star size={18} className="text-amber-400" />, label: 'Total Orders', value: totalOrders, color: 'bg-amber-400/10' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
              <p className="font-heading font-black text-xl text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search by name, email, phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Customer', 'Email', 'Phone', 'Orders', 'Spent', 'Points', 'Role', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No customers found</td></tr>
              ) : filtered.map((c, i) => (
                <motion.tr key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-sm flex-shrink-0">
                        {c.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-white font-body font-semibold text-sm">{c.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-krunch-gray font-body text-sm">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-krunch-gray font-body text-sm">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-white font-body font-bold text-sm">{c.totalOrders || 0}</td>
                  <td className="px-4 py-3 text-krunch-red font-heading font-black text-sm">Rs.{(c.totalSpent || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400" />
                      <span className="text-amber-400 font-body font-bold text-sm">{c.loyaltyPoints || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${c.role === 'admin' ? 'bg-krunch-red/20 text-krunch-red border border-krunch-red/30' : 'bg-krunch-black border border-krunch-border text-krunch-gray'}`}>
                      {c.role || 'customer'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(c)}
                        className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                        <Eye size={12} />
                      </button>
                      {c.role !== 'admin' ? (
                        <button onClick={() => makeAdmin(c.id)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600/40 transition-all font-bold whitespace-nowrap">
                          Make Admin
                        </button>
                      ) : (
                        <button onClick={() => removeAdmin(c.id)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-red-900/20 text-red-400 border border-red-700/30 hover:bg-red-700/30 transition-all font-bold whitespace-nowrap">
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} className="fixed inset-0 bg-black/70 z-50" />
          <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-krunch-dark border border-krunch-border rounded-2xl z-50 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
              <h3 className="font-heading font-bold text-white uppercase">Customer Details</h3>
              <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-2xl">
                  {selected.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-heading font-bold text-xl text-white uppercase">{selected.name}</p>
                  <p className="text-krunch-gray font-body text-sm">{selected.email}</p>
                  <p className="text-krunch-gray font-body text-sm">{selected.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Orders', value: selected.totalOrders || 0 },
                  { label: 'Spent', value: `Rs.${(selected.totalSpent || 0).toLocaleString()}` },
                  { label: 'Points', value: selected.loyaltyPoints || 0 },
                ].map((s, i) => (
                  <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                    <p className="font-heading font-black text-xl text-krunch-red">{s.value}</p>
                    <p className="text-krunch-gray font-body text-xs uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
              {selected.addresses?.length > 0 && (
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Saved Addresses</p>
                  {selected.addresses.map((a, i) => (
                    <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 mb-2">
                      <p className="text-white font-body text-sm font-semibold">{a.label}</p>
                      <p className="text-krunch-gray font-body text-xs">{a.house}, {a.street}, {a.area}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCustomers;
