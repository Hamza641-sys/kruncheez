import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit2, Trash2, Search, X, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const units = ['kg', 'g', 'liter', 'ml', 'pieces', 'dozen', 'pack', 'box'];
const cats  = ['Meat & Poultry', 'Vegetables', 'Dairy', 'Grains & Flour', 'Oils & Spices', 'Beverages', 'Packaging', 'Other'];

const emptyItem = { name: '', category: 'Meat & Poultry', quantity: '', unit: 'kg', minStock: '', costPerUnit: '', supplier: '' };

const AdminInventory = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]       = useState(emptyItem);
  const [saving, setSaving]   = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);
  const [updateQty, setUpdateQty]   = useState('');
  const [updateNote, setUpdateNote] = useState('');

  const fetch = async () => {
    const snap = await getDocs(collection(db, 'inventory'));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const filtered = items.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock  = items.filter(i => Number(i.quantity) <= Number(i.minStock));
  const outStock  = items.filter(i => Number(i.quantity) === 0);

  const handleSave = async () => {
    if (!form.name || !form.quantity) { toast.error('Name and quantity required', toastStyle); return; }
    setSaving(true);
    try {
      const data = { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock)||0, costPerUnit: Number(form.costPerUnit)||0, updatedAt: serverTimestamp() };
      if (editItem) {
        await updateDoc(doc(db, 'inventory', editItem.id), data);
        toast.success('Item updated!', toastStyle);
      } else {
        await addDoc(collection(db, 'inventory'), { ...data, createdAt: serverTimestamp() });
        toast.success('Item added!', toastStyle);
      }
      await fetch(); setShowForm(false); setEditItem(null); setForm(emptyItem);
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handleUpdateQty = async () => {
    if (!updateQty) return;
    const newQty = Number(showUpdate.quantity) + Number(updateQty);
    await updateDoc(doc(db, 'inventory', showUpdate.id), { quantity: newQty, updatedAt: serverTimestamp() });
    // Log stock update
    await addDoc(collection(db, 'stockUpdates'), {
      itemId: showUpdate.id, itemName: showUpdate.name,
      change: Number(updateQty), note: updateNote,
      createdAt: serverTimestamp(),
    });
    toast.success('Stock updated!', toastStyle);
    await fetch(); setShowUpdate(null); setUpdateQty(''); setUpdateNote('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(db, 'inventory', id));
    await fetch();
    toast.success('Deleted', toastStyle);
  };

  const openEdit = (item) => { setForm({ ...emptyItem, ...item }); setEditItem(item); setShowForm(true); };

  const stockStatus = (item) => {
    const qty = Number(item.quantity);
    const min = Number(item.minStock);
    if (qty === 0)    return { label: 'Out of Stock', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
    if (qty <= min)   return { label: 'Low Stock',    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    return              { label: 'In Stock',      color: 'text-green-400 bg-green-400/10 border-green-400/20' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Inventory</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{items.length} items tracked</p>
        </div>
        <button onClick={() => { setForm(emptyItem); setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 btn-primary text-sm"><Plus size={16} /> Add Stock Item</button>
      </div>

      {/* Alert Cards */}
      {(lowStock.length > 0 || outStock.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {outStock.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-body font-bold text-sm">{outStock.length} items OUT OF STOCK</p>
                <p className="text-red-300/60 font-body text-xs">{outStock.map(i => i.name).join(', ')}</p>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-400 font-body font-bold text-sm">{lowStock.length} items LOW STOCK</p>
                <p className="text-amber-300/60 font-body text-xs">{lowStock.map(i => i.name).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Items', value: items.length, color: 'text-white' },
          { label: 'Low Stock',   value: lowStock.length, color: 'text-amber-400' },
          { label: 'Out of Stock',value: outStock.length, color: 'text-red-400' },
        ].map((s,i) => (
          <div key={i} className="card-dark p-4 text-center">
            <p className={`font-heading font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Item','Category','Quantity','Min Stock','Cost/Unit','Supplier','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No items found</td></tr>
              ) : filtered.map((item, i) => {
                const st = stockStatus(item);
                return (
                  <tr key={item.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                    <td className="px-4 py-3 text-white font-body font-semibold text-sm">{item.name}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">{item.category}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-body font-bold text-sm">{item.quantity}</span>
                      <span className="text-krunch-gray font-body text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">{item.minStock} {item.unit}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">Rs.{item.costPerUnit || 0}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">{item.supplier || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setShowUpdate(item); setUpdateQty(''); }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-green-900/20 text-green-400 border border-green-700/30 hover:bg-green-700/30 transition-all font-bold whitespace-nowrap">
                          + Stock
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 hover:border-red-400/50 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">{editItem ? 'Edit Item' : 'Add Stock Item'}</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { key: 'name', label: 'Item Name *', placeholder: 'e.g. Chicken Breast' },
                  { key: 'supplier', label: 'Supplier', placeholder: 'e.g. Al-Noor Traders' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                    <input type="text" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      {cats.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Unit</label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      {units.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Quantity *</label>
                    <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Min Stock Alert</label>
                    <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="0"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Cost per Unit (Rs.)</label>
                    <input type="number" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} placeholder="0"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : `${editItem ? 'Update' : 'Add'} Item`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Stock Modal */}
      <AnimatePresence>
        {showUpdate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowUpdate(null)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-krunch-dark border border-krunch-border rounded-2xl p-6">
              <h3 className="font-heading font-bold text-white uppercase mb-4">Update Stock — {showUpdate.name}</h3>
              <p className="text-krunch-gray font-body text-sm mb-4">Current: <span className="text-white font-bold">{showUpdate.quantity} {showUpdate.unit}</span></p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Add Quantity (+/-)</label>
                  <input type="number" value={updateQty} onChange={e => setUpdateQty(e.target.value)} placeholder="e.g. +10 or -5"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Note (optional)</label>
                  <input type="text" value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="e.g. Received from Al-Noor"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleUpdateQty}
                    className="flex-1 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3 rounded-xl transition-all uppercase">
                    Update
                  </button>
                  <button onClick={() => setShowUpdate(null)} className="btn-outline text-sm px-5">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInventory;
