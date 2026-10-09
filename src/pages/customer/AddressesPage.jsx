import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Star, Edit2, X, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const AddressesPage = () => {
  const { user, userData, refreshUserData } = useAuth();
  const addresses = userData?.addresses || [];
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ label: 'Home', area: '', street: '', house: '' });
  const [loading, setLoading] = useState(false);

  const labels = ['Home', 'Work', 'Other'];

  const saveAddress = async () => {
    if (!form.area || !form.street || !form.house) {
      toast.error('Please fill all fields', toastStyle); return;
    }
    setLoading(true);
    try {
      const newAddr = { ...form, id: Date.now().toString() };
      let updated;
      if (editIndex !== null) {
        updated = addresses.map((a, i) => i === editIndex ? newAddr : a);
      } else {
        updated = [...addresses, newAddr];
      }
      await updateDoc(doc(db, 'users', user.uid), { addresses: updated });
      await refreshUserData();
      toast.success(editIndex !== null ? 'Address updated!' : 'Address added!', toastStyle);
      setShowForm(false);
      setEditIndex(null);
      setForm({ label: 'Home', area: '', street: '', house: '' });
    } catch { toast.error('Failed to save address', toastStyle); }
    finally { setLoading(false); }
  };

  const deleteAddress = async (index) => {
    const updated = addresses.filter((_, i) => i !== index);
    await updateDoc(doc(db, 'users', user.uid), { addresses: updated });
    await refreshUserData();
    toast.success('Address removed', toastStyle);
  };

  const setDefault = async (index) => {
    const reordered = [addresses[index], ...addresses.filter((_, i) => i !== index)];
    await updateDoc(doc(db, 'users', user.uid), { addresses: reordered });
    await refreshUserData();
    toast.success('Default address updated!', toastStyle);
  };

  const startEdit = (index) => {
    setForm(addresses[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-krunch-red font-body text-sm uppercase tracking-widest mb-1 block">My Account</span>
            <h1 className="section-title text-white text-3xl">SAVED <span className="text-krunch-red">ADDRESSES</span></h1>
          </div>
          <button onClick={() => { setShowForm(true); setEditIndex(null); setForm({ label: 'Home', area: '', street: '', house: '' }); }}
            className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Add New
          </button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card-dark p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-white uppercase">{editIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white transition-colors"><X size={18} /></button>
              </div>

              {/* Label */}
              <div className="mb-4">
                <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2 block">Label</label>
                <div className="flex gap-2">
                  {labels.map(l => (
                    <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
                      className={`px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${form.label === l ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white'}`}>
                      {l === 'Home' ? '🏠' : l === 'Work' ? '💼' : '📍'} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {[
                { key: 'area', label: 'Area / Sector', placeholder: 'e.g. Bahria Town, Rawalpindi' },
                { key: 'street', label: 'Street / Road', placeholder: 'e.g. Street 5, Block B' },
                { key: 'house', label: 'House / Flat No.', placeholder: 'e.g. House 42' },
              ].map(f => (
                <div key={f.key} className="mb-4">
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                  <input type="text" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
              ))}

              <div className="flex gap-3">
                <button onClick={saveAddress} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-70">
                  {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <><Check size={16} /> Save Address</>}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline text-sm px-5">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📍</div>
            <p className="font-heading font-bold text-xl text-white uppercase mb-2">No addresses saved</p>
            <p className="text-krunch-gray font-body text-sm mb-6">Add your delivery address for faster checkout</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Add Address</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((addr, i) => (
              <motion.div key={addr.id || i}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card-dark p-5 ${i === 0 ? 'border-krunch-red/40' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${i === 0 ? 'bg-krunch-red/10' : 'bg-krunch-black'}`}>
                      {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-body font-bold text-white text-sm">{addr.label}</p>
                        {i === 0 && <span className="text-[10px] bg-krunch-red text-white px-2 py-0.5 rounded font-bold uppercase">Default</span>}
                      </div>
                      <p className="text-krunch-gray font-body text-sm">{addr.house}, {addr.street}</p>
                      <p className="text-krunch-gray font-body text-xs">{addr.area}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {i !== 0 && (
                      <button onClick={() => setDefault(i)} title="Set as default"
                        className="w-8 h-8 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-amber-400 hover:border-amber-400/50 transition-all">
                        <Star size={14} />
                      </button>
                    )}
                    <button onClick={() => startEdit(i)}
                      className="w-8 h-8 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteAddress(i)}
                      className="w-8 h-8 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 hover:border-red-400/50 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressesPage;
