import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Trash2, Search, X, Download, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

// Daily expense categories
const categories = [
  { id: 'milk',       label: '🥛 Milk / Dairy',          placeholder: 'e.g. 5 liter doodh' },
  { id: 'bread',      label: '🍞 Roti / Bread',           placeholder: 'e.g. 50 rotiyan' },
  { id: 'vegetables', label: '🥬 Sabziyan',               placeholder: 'e.g. tamatar, pyaz' },
  { id: 'masala',     label: '🌶️ Masala / Spices',        placeholder: 'e.g. garam masala, namak' },
  { id: 'oil',        label: '🛢️ Oil / Ghee',             placeholder: 'e.g. 5kg cooking oil' },
  { id: 'gas',        label: '🔥 Gas',                    placeholder: 'e.g. gas cylinder' },
  { id: 'electricity',label: '💡 Electricity / Bijli',   placeholder: 'e.g. bijli ka bill' },
  { id: 'packaging',  label: '📦 Packaging',              placeholder: 'e.g. boxes, bags' },
  { id: 'salary',     label: '👨‍💼 Staff Salary',           placeholder: 'e.g. Ali ka salary' },
  { id: 'rent',       label: '🏠 Rent / Kiraya',          placeholder: 'e.g. monthly kiraya' },
  { id: 'transport',  label: '🚗 Transport',              placeholder: 'e.g. delivery cost' },
  { id: 'repair',     label: '🔧 Repair / Maintenance',  placeholder: 'e.g. AC repair' },
  { id: 'other',      label: '📝 Other Kharcha',          placeholder: 'koi bhi kharcha' },
];

const periods = [
  { k: 'today', l: 'Aaj' },
  { k: 'week',  l: 'Is Hafte' },
  { k: 'month', l: 'Is Mahine' },
  { k: 'all',   l: 'Sab' },
];

const AdminExpenses = () => {
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [period, setPeriod]       = useState('today');
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    category: 'other',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'expenses'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(a.date || 0);
        const db2 = b.createdAt?.toDate?.() || new Date(b.date || 0);
        return db2 - da;
      });
      setExpenses(data);
    } catch { setExpenses([]); }
    setLoading(false);
  };
  useEffect(() => { fetchExpenses(); }, []);

  // Period filter
  const getStart = (p) => {
    const now = new Date();
    if (p === 'today') { const d = new Date(); d.setHours(0,0,0,0); return d; }
    if (p === 'week')  { const d = new Date(); d.setDate(d.getDate()-7); return d; }
    if (p === 'month') { const d = new Date(); d.setMonth(d.getMonth()-1); return d; }
    return null;
  };

  const periodExp = expenses.filter(e => {
    const start = getStart(period);
    if (!start) return true;
    const d = e.createdAt?.toDate?.() || new Date(e.date || 0);
    return d >= start;
  });

  const filtered = periodExp.filter(e => {
    const matchCat    = catFilter === 'all' || e.category === catFilter;
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Exclude supplier payments from manual expenses (those are in supplier section)
  const manualExpenses = filtered.filter(e => e.category !== 'Supplier Payment');
  const totalExp = manualExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // By category
  const byCat = {};
  manualExpenses.forEach(e => {
    const label = categories.find(c => c.id === e.category)?.label || e.category;
    byCat[label] = (byCat[label] || 0) + Number(e.amount || 0);
  });
  const catData = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast.error('Description aur amount required!', toastStyle); return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        ...form,
        amount: Number(form.amount),
        createdAt: serverTimestamp(),
      });
      toast.success('Kharcha add ho gaya! ✅', toastStyle);
      setShowForm(false);
      setForm({
        category: 'other', description: '', amount: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      await fetchExpenses();
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await deleteDoc(doc(db, 'expenses', id));
    await fetchExpenses();
    toast.success('Deleted', toastStyle);
  };

  const downloadCSV = () => {
    const rows = [
      ['Date', 'Category', 'Description', 'Amount', 'Payment', 'Notes'],
      ...filtered.map(e => [
        e.date || e.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || '',
        categories.find(c => c.id === e.category)?.label || e.category,
        e.description, e.amount, e.paymentMethod, e.notes || '',
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `expenses-${period}.csv`;
    a.click();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Daily Expenses</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">
            Milk, roti, sabzi, masala — sab kharcha yahan
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Add Kharcha
          </button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-4">
        {periods.map(p => (
          <button key={p.k} onClick={() => setPeriod(p.k)}
            className={`px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              period === p.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {p.l}
          </button>
        ))}
      </div>

      {/* Total + Breakdown */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Total card */}
        <div className="card-dark p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-400" />
            <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">
              {period === 'today' ? 'Aaj Ka' : period === 'week' ? 'Is Hafte Ka' : period === 'month' ? 'Is Mahine Ka' : 'Total'} Kharcha
            </span>
          </div>
          <p className="font-heading font-black text-3xl text-red-400">Rs.{totalExp.toLocaleString()}</p>
          <p className="text-krunch-gray font-body text-xs mt-1">{manualExpenses.length} entries</p>
        </div>

        {/* Category breakdown */}
        <div className="card-dark p-5 lg:col-span-2">
          <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-3">Category-wise Kharcha</h3>
          {catData.length === 0 ? (
            <p className="text-krunch-gray font-body text-sm">Koi kharcha nahi is period mein</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {catData.slice(0, 6).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between bg-krunch-black border border-krunch-border rounded-xl px-3 py-2">
                  <span className="text-krunch-gray font-body text-xs truncate">{cat}</span>
                  <span className="text-red-400 font-body font-bold text-xs ml-2 flex-shrink-0">Rs.{amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search kharcha..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-krunch-card border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none cursor-pointer">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Date', 'Category', 'Description', 'Amount', 'Payment', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : manualExpenses.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">
                  Koi kharcha nahi — "Add Kharcha" karo
                </td></tr>
              ) : manualExpenses.map(exp => (
                <tr key={exp.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                  <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">
                    {exp.date || exp.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-krunch-black border border-krunch-border text-krunch-gray px-2 py-0.5 rounded font-body">
                      {categories.find(c => c.id === exp.category)?.label || exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-body text-sm">{exp.description}</td>
                  <td className="px-4 py-3 text-red-400 font-heading font-black text-base whitespace-nowrap">
                    Rs.{Number(exp.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-krunch-gray font-body text-xs capitalize">{exp.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(exp.id)}
                      className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 hover:border-red-400/50 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD EXPENSE MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">Add Kharcha</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">

                {/* Category select — with icons */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2 block">Kharcha Category</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {categories.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={`text-left px-3 py-2.5 rounded-xl font-body text-xs transition-all ${
                          form.category === cat.id
                            ? 'bg-krunch-red text-white'
                            : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:border-krunch-red/50 hover:text-white'
                        }`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Description *</label>
                  <input type="text" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder={categories.find(c => c.id === form.category)?.placeholder || 'Kharcha ki detail...'}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Amount (Rs.) *</label>
                    <input type="number" value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Date</label>
                    <input type="date" value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Payment</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k: 'cash',  l: '💵 Cash' },
                      { k: 'bank',  l: '🏦 Bank' },
                      { k: 'credit',l: '📋 Udhar' },
                    ].map(m => (
                      <button key={m.k} type="button"
                        onClick={() => setForm({ ...form, paymentMethod: m.k })}
                        className={`py-2.5 rounded-xl font-body font-bold text-sm transition-all ${
                          form.paymentMethod === m.k ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white'
                        }`}>
                        {m.l}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black py-4 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70 text-base">
                  {saving ? 'Saving...' : '✅ Kharcha Add Karo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExpenses;
