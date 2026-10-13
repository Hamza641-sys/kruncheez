import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Trash2, Search, X, Download, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const expenseCats = [
  'Stock Purchase', 'Salaries', 'Rent', 'Utilities', 'Gas', 'Electricity',
  'Water', 'Maintenance', 'Equipment', 'Packaging', 'Marketing', 'Transport',
  'Miscellaneous', 'Other'
];

const emptyExpense = { category: 'Stock Purchase', description: '', amount: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0], notes: '' };

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyExpense);
  const [saving, setSaving]     = useState(false);
  const [period, setPeriod]     = useState('month');

  const fetch = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'expenses'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.date || 0);
      const db2 = b.createdAt?.toDate?.() || new Date(b.date || 0);
      return db2 - da;
    });
    setExpenses(data);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  // Period filter
  const getStart = () => {
    const d = new Date();
    if (period === 'today') return new Date(d.setHours(0,0,0,0));
    if (period === 'week')  { const x = new Date(); x.setDate(x.getDate()-7); return x; }
    if (period === 'month') { const x = new Date(); x.setMonth(x.getMonth()-1); return x; }
    return null;
  };

  const periodExpenses = expenses.filter(e => {
    const start = getStart();
    if (!start) return true;
    const d = e.createdAt?.toDate?.() || new Date(e.date);
    return d >= start;
  });

  const filtered = periodExpenses.filter(e => {
    const matchSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalExp = filtered.reduce((s, e) => s + Number(e.amount||0), 0);

  // By category
  const byCat = {};
  filtered.forEach(e => { byCat[e.category] = (byCat[e.category]||0) + Number(e.amount||0); });
  const catData = Object.entries(byCat).sort((a,b) => b[1]-a[1]);
  const maxCat  = Math.max(...catData.map(c => c[1]), 1);

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error('Description and amount required', toastStyle); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'expenses'), { ...form, amount: Number(form.amount), createdAt: serverTimestamp() });
      toast.success('Expense added!', toastStyle);
      await fetch(); setShowForm(false); setForm(emptyExpense);
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await deleteDoc(doc(db, 'expenses', id));
    await fetch();
    toast.success('Deleted', toastStyle);
  };

  const downloadCSV = () => {
    const rows = [
      ['Date', 'Category', 'Description', 'Amount', 'Payment', 'Notes'],
      ...filtered.map(e => [
        e.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || e.date || '',
        e.category, e.description, e.amount, e.paymentMethod, e.notes||''
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `expenses-${period}-${new Date().toLocaleDateString('en-PK').replace(/\//g,'-')}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Expense Tracker</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{expenses.length} expenses recorded</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <Download size={15} /> Export
          </button>
          <button onClick={() => { setForm(emptyExpense); setShowForm(true); }}
            className="flex items-center gap-2 btn-primary text-sm"><Plus size={16} /> Add Expense</button>
        </div>
      </div>

      {/* Period + Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[{k:'today',l:'Today'},{k:'week',l:'Week'},{k:'month',l:'Month'},{k:'all',l:'All Time'}].map(p => (
          <button key={p.k} onClick={() => setPeriod(p.k)}
            className={`px-3 py-1.5 rounded-xl font-body font-semibold text-xs transition-all ${period===p.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'}`}>
            {p.l}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-dark p-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-1">
            <TrendingDown size={20} className="text-red-400" />
            <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Total Expenses</span>
          </div>
          <p className="font-heading font-black text-3xl text-white">Rs.{totalExp.toLocaleString()}</p>
          <p className="text-krunch-gray font-body text-xs mt-1">{filtered.length} entries</p>
        </div>
        {catData.slice(0,2).map(([cat, amt], i) => (
          <div key={i} className="card-dark p-4">
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{cat}</p>
            <p className="font-heading font-black text-xl text-krunch-red">Rs.{amt.toLocaleString()}</p>
            <p className="text-krunch-gray font-body text-xs mt-1">{Math.round((amt/totalExp)*100)}% of total</p>
          </div>
        ))}
      </div>

      {/* Category Chart */}
      {catData.length > 0 && (
        <div className="card-dark p-5 mb-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Expenses by Category</h3>
          <div className="flex flex-col gap-2.5">
            {catData.map(([cat, amt], i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-krunch-gray font-body text-xs">{cat}</span>
                  <span className="text-white font-body font-bold text-xs">Rs.{amt.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                  <div className="h-full bg-krunch-red rounded-full transition-all duration-500" style={{ width: `${(amt/maxCat)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-krunch-card border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none cursor-pointer">
          <option value="all">All Categories</option>
          {expenseCats.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Date','Category','Description','Amount','Payment','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No expenses found</td></tr>
              ) : filtered.map((exp) => (
                <tr key={exp.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                  <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">
                    {exp.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || exp.date || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-krunch-black border border-krunch-border text-krunch-gray px-2 py-0.5 rounded font-body">{exp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-body text-sm">{exp.description}</td>
                  <td className="px-4 py-3 text-krunch-red font-heading font-black text-base whitespace-nowrap">Rs.{Number(exp.amount||0).toLocaleString()}</td>
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

      {/* Add Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">Add Expense</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                    {expenseCats.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {[
                  {k:'description', l:'Description *', p:'e.g. Monthly gas bill'},
                  {k:'amount',      l:'Amount (Rs.) *', p:'e.g. 5000', type:'number'},
                  {k:'date',        l:'Date', p:'', type:'date'},
                  {k:'notes',       l:'Notes', p:'Optional notes...'},
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.l}</label>
                    <input type={f.type||'text'} value={form[f.k]} onChange={e => setForm({...form,[f.k]:e.target.value})} placeholder={f.p}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : 'Add Expense'}
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
