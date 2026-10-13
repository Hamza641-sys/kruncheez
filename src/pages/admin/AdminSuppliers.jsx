import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Trash2, X, Phone, Search, DollarSign, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const AdminSuppliers = () => {
  const [suppliers, setSuppliers]   = useState([]);
  const [payments, setPayments]     = useState([]);
  const [tab, setTab]               = useState('suppliers');
  const [search, setSearch]         = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [showPay, setShowPay]       = useState(false);
  const [selectedSup, setSelectedSup] = useState(null);
  const [saving, setSaving]         = useState(false);

  const [supForm, setSupForm] = useState({ name: '', phone: '', items: '', address: '' });
  const [payForm, setPayForm] = useState({
    supplierId: '', supplierName: '',
    items: '', amount: '', paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0], notes: ''
  });

  const fetchAll = async () => {
    const [sSnap, pSnap] = await Promise.all([
      getDocs(collection(db, 'suppliers')),
      getDocs(collection(db, 'supplierPayments')),
    ]);
    setSuppliers(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const pData = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    pData.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    setPayments(pData);
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = suppliers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Save new supplier
  const handleAddSupplier = async () => {
    if (!supForm.name) { toast.error('Supplier name required', toastStyle); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'suppliers'), {
        ...supForm, totalPaid: 0, createdAt: serverTimestamp()
      });
      toast.success('Supplier added!', toastStyle);
      setShowAdd(false); setSupForm({ name: '', phone: '', items: '', address: '' });
      await fetchAll();
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  // Record payment
  const handlePayment = async () => {
    if (!payForm.supplierId || !payForm.amount) {
      toast.error('Supplier aur amount required', toastStyle); return;
    }
    setSaving(true);
    try {
      const amt = Number(payForm.amount);

      // Save payment record
      await addDoc(collection(db, 'supplierPayments'), {
        ...payForm, amount: amt, createdAt: serverTimestamp()
      });

      // Update supplier total
      await updateDoc(doc(db, 'suppliers', payForm.supplierId), {
        totalPaid: increment(amt)
      });

      // Also save in expenses for profit report
      await addDoc(collection(db, 'expenses'), {
        category: 'Supplier Payment',
        description: `${payForm.supplierName} — ${payForm.items || 'Payment'}`,
        amount: amt,
        paymentMethod: payForm.paymentMethod,
        date: payForm.date,
        supplierId: payForm.supplierId,
        supplierName: payForm.supplierName,
        createdAt: serverTimestamp(),
      });

      toast.success('Payment recorded!', toastStyle);
      setShowPay(false);
      setPayForm({
        supplierId: '', supplierName: '',
        items: '', amount: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      await fetchAll();
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    await deleteDoc(doc(db, 'suppliers', id));
    await fetchAll();
    toast.success('Deleted', toastStyle);
  };

  const openPayForSupplier = (sup) => {
    setPayForm(prev => ({
      ...prev,
      supplierId: sup.id,
      supplierName: sup.name,
      date: new Date().toISOString().split('T')[0],
    }));
    setShowPay(true);
  };

  const totalPaid = suppliers.reduce((s, sup) => s + (sup.totalPaid || 0), 0);
  const supPayments = (supId) => payments.filter(p => p.supplierId === supId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Suppliers</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">
            {suppliers.length} suppliers • Total paid: Rs.{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPay(true)}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <DollarSign size={15} /> Record Payment
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { k: 'suppliers', l: 'Suppliers' },
          { k: 'payments',  l: `Payment History (${payments.length})` },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              tab === t.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
            <input type="text" placeholder="Search supplier..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📦</div>
              <p className="font-heading font-bold text-xl text-white uppercase mb-2">No suppliers yet</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-2 text-sm">Add Supplier</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((sup, i) => {
                const supPays = supPayments(sup.id);
                const lastPay = supPays[0];
                return (
                  <motion.div key={sup.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-dark p-5 hover:border-krunch-red/40 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 bg-krunch-red/10 rounded-xl flex items-center justify-center text-xl">📦</div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleDelete(sup.id)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-white text-lg">{sup.name}</h3>
                    {sup.items   && <p className="text-krunch-gray font-body text-xs mt-0.5">{sup.items}</p>}
                    {sup.phone   && <p className="text-krunch-gray font-body text-xs flex items-center gap-1 mt-1"><Phone size={11} className="text-krunch-red" />{sup.phone}</p>}
                    {sup.address && <p className="text-krunch-gray font-body text-xs mt-0.5">📍 {sup.address}</p>}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-krunch-border">
                      <div>
                        <p className="text-krunch-gray font-body text-[10px] uppercase">Total Paid</p>
                        <p className="text-krunch-red font-heading font-black text-lg">Rs.{(sup.totalPaid||0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-krunch-gray font-body text-[10px] uppercase">Payments</p>
                        <p className="text-white font-heading font-black text-lg">{supPays.length}</p>
                      </div>
                    </div>

                    {lastPay && (
                      <p className="text-krunch-gray font-body text-[10px] mt-1">
                        Last: Rs.{lastPay.amount?.toLocaleString()} on {lastPay.date}
                      </p>
                    )}

                    <button onClick={() => openPayForSupplier(sup)}
                      className="mt-3 w-full bg-krunch-red/10 hover:bg-krunch-red hover:text-white text-krunch-red font-body font-bold text-xs py-2.5 rounded-xl transition-all">
                      + Record Payment
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── PAYMENT HISTORY TAB ── */}
      {tab === 'payments' && (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-krunch-border">
                  {['Date','Supplier','Items','Amount','Payment','Notes'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">Koi payment record nahi</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">{p.date || '—'}</td>
                    <td className="px-4 py-3 text-white font-body font-semibold text-sm">{p.supplierName}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs max-w-xs truncate">{p.items || '—'}</td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-base whitespace-nowrap">
                      Rs.{Number(p.amount||0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs capitalize">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD SUPPLIER MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">Add Supplier</h3>
                <button onClick={() => setShowAdd(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { k: 'name',    l: 'Supplier Name *', p: 'e.g. Hamza Chicken wala' },
                  { k: 'phone',   l: 'Phone',            p: '03XX-XXXXXXX' },
                  { k: 'items',   l: 'Kya supply karta hai', p: 'e.g. Chicken, Beef, Dough' },
                  { k: 'address', l: 'Address',           p: 'Area, City' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.l}</label>
                    <input type="text" value={supForm[f.k]}
                      onChange={e => setSupForm({ ...supForm, [f.k]: e.target.value })}
                      placeholder={f.p}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <button onClick={handleAddSupplier} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : 'Add Supplier'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RECORD PAYMENT MODAL ── */}
      <AnimatePresence>
        {showPay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPay(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">Record Supplier Payment</h3>
                <button onClick={() => setShowPay(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {/* Supplier select */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Supplier *</label>
                  <select value={payForm.supplierId}
                    onChange={e => {
                      const sup = suppliers.find(s => s.id === e.target.value);
                      setPayForm({ ...payForm, supplierId: e.target.value, supplierName: sup?.name || '' });
                    }}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Items */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Items (kya liya)</label>
                  <input type="text" value={payForm.items}
                    onChange={e => setPayForm({ ...payForm, items: e.target.value })}
                    placeholder="e.g. 20kg Chicken, 5kg Beef"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Amount (Rs.) *</label>
                  <input type="number" value={payForm.amount}
                    onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>

                {/* Date */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Date</label>
                  <input type="date" value={payForm.date}
                    onChange={e => setPayForm({ ...payForm, date: e.target.value })}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>

                {/* Payment method */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'bank', 'credit'].map(m => (
                      <button key={m} type="button"
                        onClick={() => setPayForm({ ...payForm, paymentMethod: m })}
                        className={`py-2.5 rounded-xl font-body font-bold text-sm transition-all capitalize ${
                          payForm.paymentMethod === m ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white'
                        }`}>
                        {m === 'cash' ? '💵 Cash' : m === 'bank' ? '🏦 Bank' : '📋 Credit'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                  <input type="text" value={payForm.notes}
                    onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                    placeholder="koi note..."
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>

                <button onClick={handlePayment} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : '✅ Record Payment'}
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
