import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit2, Trash2, Search, X, Phone, MapPin, Package, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };
const emptySupplier = { name: '', contact: '', phone: '', address: '', items: '', notes: '' };
const emptyPurchase = { supplierId: '', supplierName: '', items: '', amount: '', paymentMethod: 'cash', paid: true, notes: '' };

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [tab, setTab]             = useState('suppliers');
  const [search, setSearch]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm]           = useState(emptySupplier);
  const [pForm, setPForm]         = useState(emptyPurchase);
  const [saving, setSaving]       = useState(false);
  const [selected, setSelected]   = useState(null);

  const fetchAll = async () => {
    const [supSnap, purSnap] = await Promise.all([
      getDocs(collection(db, 'suppliers')),
      getDocs(query(collection(db, 'stockPurchases'), orderBy('createdAt', 'desc'))),
    ]);
    setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setPurchases(purSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = suppliers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name) { toast.error('Supplier name required', toastStyle); return; }
    setSaving(true);
    try {
      if (editSupplier) {
        await updateDoc(doc(db, 'suppliers', editSupplier.id), { ...form, updatedAt: serverTimestamp() });
        toast.success('Supplier updated!', toastStyle);
      } else {
        await addDoc(collection(db, 'suppliers'), { ...form, totalPurchases: 0, createdAt: serverTimestamp() });
        toast.success('Supplier added!', toastStyle);
      }
      await fetchAll(); setShowForm(false); setEditSupplier(null); setForm(emptySupplier);
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handlePurchase = async () => {
    if (!pForm.supplierId || !pForm.amount) { toast.error('Supplier and amount required', toastStyle); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'stockPurchases'), {
        ...pForm, amount: Number(pForm.amount),
        createdAt: serverTimestamp(),
      });
      // Update supplier total
      const sup = suppliers.find(s => s.id === pForm.supplierId);
      if (sup) {
        await updateDoc(doc(db, 'suppliers', pForm.supplierId), {
          totalPurchases: (sup.totalPurchases || 0) + Number(pForm.amount),
        });
      }
      // Add to expenses
      await addDoc(collection(db, 'expenses'), {
        category: 'Stock Purchase',
        description: `${pForm.supplierName} — ${pForm.items}`,
        amount: Number(pForm.amount),
        paymentMethod: pForm.paymentMethod,
        paid: pForm.paid,
        supplierId: pForm.supplierId,
        createdAt: serverTimestamp(),
      });
      toast.success('Purchase recorded!', toastStyle);
      await fetchAll(); setShowPurchase(false); setPForm(emptyPurchase);
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    await deleteDoc(doc(db, 'suppliers', id));
    await fetchAll();
    toast.success('Deleted', toastStyle);
  };

  const totalSpend = purchases.reduce((s, p) => s + (p.amount || 0), 0);
  const supPurchases = (supId) => purchases.filter(p => p.supplierId === supId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Suppliers</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{suppliers.length} suppliers • Rs.{totalSpend.toLocaleString()} total purchases</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPurchase(true)}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <Package size={15} /> Record Purchase
          </button>
          <button onClick={() => { setForm(emptySupplier); setEditSupplier(null); setShowForm(true); }}
            className="flex items-center gap-2 btn-primary text-sm"><Plus size={16} /> Add Supplier</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{k:'suppliers',l:'Suppliers'},{k:'purchases',l:'Purchase History'}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${tab===t.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'suppliers' ? (
        <>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
            <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sup, i) => {
              const purCount = supPurchases(sup.id).length;
              return (
                <motion.div key={sup.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.05 }}
                  className="card-dark p-5 hover:border-krunch-red/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-krunch-red/10 rounded-xl flex items-center justify-center text-lg">📦</div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setForm({...emptySupplier,...sup}); setEditSupplier(sup); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(sup.id)}
                        className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-white text-lg uppercase group-hover:text-krunch-red transition-colors mb-1">{sup.name}</h3>
                  {sup.items && <p className="text-krunch-gray font-body text-xs mb-3">{sup.items}</p>}
                  <div className="flex flex-col gap-1.5 mb-3">
                    {sup.phone && <div className="flex items-center gap-2 text-krunch-gray font-body text-xs"><Phone size={11} className="text-krunch-red" />{sup.phone}</div>}
                    {sup.address && <div className="flex items-center gap-2 text-krunch-gray font-body text-xs"><MapPin size={11} className="text-krunch-red" />{sup.address}</div>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-krunch-border">
                    <div>
                      <p className="text-krunch-gray font-body text-[10px] uppercase">Total Purchases</p>
                      <p className="text-krunch-red font-heading font-black text-lg">Rs.{(sup.totalPurchases||0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-krunch-gray font-body text-[10px] uppercase">Orders</p>
                      <p className="text-white font-heading font-black text-lg">{purCount}</p>
                    </div>
                  </div>
                  <button onClick={() => { setPForm({...emptyPurchase, supplierId: sup.id, supplierName: sup.name}); setShowPurchase(true); }}
                    className="mt-3 w-full bg-krunch-red/10 hover:bg-krunch-red hover:text-white text-krunch-red font-body font-bold text-xs py-2 rounded-xl transition-all">
                    + Record Purchase
                  </button>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-krunch-border">
                  {['Date','Supplier','Items','Amount','Payment','Paid'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No purchases recorded</td></tr>
                ) : purchases.map((p, i) => (
                  <tr key={p.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">
                      {p.createdAt?.toDate?.()?.toLocaleDateString('en-PK') || '—'}
                    </td>
                    <td className="px-4 py-3 text-white font-body font-semibold text-sm">{p.supplierName || '—'}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs max-w-xs truncate">{p.items || '—'}</td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-sm">Rs.{(p.amount||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs capitalize">{p.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.paid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {p.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  {k:'name',    l:'Supplier Name *', p:'e.g. Al-Noor Traders'},
                  {k:'phone',   l:'Phone',           p:'03XX-XXXXXXX'},
                  {k:'address', l:'Address',         p:'City, Area'},
                  {k:'items',   l:'Supplies',        p:'Chicken, Beef, etc.'},
                  {k:'notes',   l:'Notes',           p:'Any extra info...'},
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.l}</label>
                    <input type="text" value={form[f.k]} onChange={e => setForm({...form,[f.k]:e.target.value})} placeholder={f.p}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : `${editSupplier?'Update':'Add'} Supplier`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Purchase Modal */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPurchase(false)} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">Record Purchase</h3>
                <button onClick={() => setShowPurchase(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Supplier *</label>
                  <select value={pForm.supplierId} onChange={e => {
                    const s = suppliers.find(s => s.id === e.target.value);
                    setPForm({...pForm, supplierId: e.target.value, supplierName: s?.name || ''});
                  }} className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {[
                  {k:'items',  l:'Items Purchased', p:'e.g. 20kg Chicken, 5kg Cheese'},
                  {k:'amount', l:'Total Amount (Rs.) *', p:'e.g. 15000', type:'number'},
                  {k:'notes',  l:'Notes', p:'Any notes...'},
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.l}</label>
                    <input type={f.type||'text'} value={pForm[f.k]} onChange={e => setPForm({...pForm,[f.k]:e.target.value})} placeholder={f.p}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Payment</label>
                    <select value={pForm.paymentMethod} onChange={e => setPForm({...pForm, paymentMethod: e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="credit">Credit/Due</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5">Status</label>
                    <button type="button" onClick={() => setPForm({...pForm, paid: !pForm.paid})}
                      className={`px-4 py-3 rounded-xl font-body font-bold text-sm transition-all ${pForm.paid ? 'bg-green-600 text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray'}`}>
                      {pForm.paid ? '✅ Paid' : '⏳ Unpaid'}
                    </button>
                  </div>
                </div>
                <button onClick={handlePurchase} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : 'Record Purchase'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSuppliers;
