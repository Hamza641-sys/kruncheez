import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Copy, Tag, X, Check } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };
const emptyForm = { code: '', type: 'percent', discount: '', minOrder: '', maxUses: '', expiryDate: '', description: '' };

const AdminPromos = () => {
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const snap = await getDocs(collection(db, 'promoCodes'));
    setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (!form.code || !form.discount) { toast.error('Code and discount required', toastStyle); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'promoCodes'), {
        ...form,
        code: form.code.toUpperCase(),
        discount: Number(form.discount),
        minOrder: Number(form.minOrder) || 0,
        maxUses: Number(form.maxUses) || 999,
        usedCount: 0,
        active: true,
        createdAt: serverTimestamp(),
      });
      toast.success('Promo code created!', toastStyle);
      await fetch();
      setShowForm(false);
      setForm(emptyForm);
    } catch { toast.error('Failed to create', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    await deleteDoc(doc(db, 'promoCodes', id));
    await fetch();
    toast.success('Promo deleted', toastStyle);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`, toastStyle);
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Promo Codes</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{promos.length} active codes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 btn-primary text-sm">
          <Plus size={16} /> Create Code
        </button>
      </div>

      {/* Promos Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <div className="text-6xl mb-3">🏷️</div>
            <p className="font-heading font-bold text-xl text-white uppercase mb-2">No Promo Codes</p>
            <p className="text-krunch-gray font-body text-sm mb-5">Create your first promo code!</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Create Code</button>
          </div>
        ) : promos.map((promo, i) => {
          const expired = isExpired(promo.expiryDate);
          return (
            <motion.div key={promo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`card-dark p-5 relative overflow-hidden ${expired ? 'opacity-60' : ''}`}
            >
              {/* Dashed border effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-krunch-red to-krunch-darkred" />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-krunch-red" />
                  <span className="font-heading font-black text-xl text-white tracking-widest">{promo.code}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => copyCode(promo.code)}
                    className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => handleDelete(promo.id)}
                    className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="bg-krunch-red text-white font-heading font-black text-2xl px-3 py-1 rounded-xl">
                  {promo.type === 'percent' ? `${promo.discount}%` : `Rs.${promo.discount}`} OFF
                </span>
                {expired && <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 px-2 py-1 rounded font-bold uppercase">Expired</span>}
                {!expired && promo.active && <span className="text-xs bg-green-900/30 text-green-400 border border-green-700/30 px-2 py-1 rounded font-bold uppercase">Active</span>}
              </div>

              {promo.description && <p className="text-krunch-gray font-body text-xs mb-3">{promo.description}</p>}

              <div className="grid grid-cols-2 gap-2 text-xs font-body">
                {promo.minOrder > 0 && (
                  <div className="bg-krunch-black rounded-lg p-2">
                    <p className="text-krunch-gray text-[10px] uppercase">Min Order</p>
                    <p className="text-white font-semibold">Rs.{promo.minOrder}</p>
                  </div>
                )}
                <div className="bg-krunch-black rounded-lg p-2">
                  <p className="text-krunch-gray text-[10px] uppercase">Used</p>
                  <p className="text-white font-semibold">{promo.usedCount || 0}/{promo.maxUses}</p>
                </div>
                {promo.expiryDate && (
                  <div className="bg-krunch-black rounded-lg p-2 col-span-2">
                    <p className="text-krunch-gray text-[10px] uppercase">Expires</p>
                    <p className={`font-semibold ${expired ? 'text-red-400' : 'text-white'}`}>
                      {new Date(promo.expiryDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/70 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-krunch-dark border border-krunch-border rounded-2xl z-50 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Create Promo Code</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Promo Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE20"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-heading font-black text-lg tracking-widest placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Discount Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Amount (Rs.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">
                      Discount {form.type === 'percent' ? '(%)' : '(Rs.)'} *
                    </label>
                    <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                      placeholder={form.type === 'percent' ? '20' : '100'}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Min Order (Rs.)</label>
                    <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                      placeholder="0"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Max Uses</label>
                    <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })}
                      placeholder="100"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. 20% off on all orders above Rs.500"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <><Check size={16} /> Create Promo Code</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPromos;
