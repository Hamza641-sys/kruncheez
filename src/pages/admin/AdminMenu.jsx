import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { menuCategories } from '../../data/menuData';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const emptyItem = { name: '', price: '', category: 'burgers', description: '', img: '', badge: '', available: true };

const AdminMenu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    const snap = await getDocs(collection(db, 'menu'));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(i => {
    const matchCat = catFilter === 'all' || i.category === catFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd = () => { setForm(emptyItem); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditItem(item); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required', toastStyle); return; }
    setSaving(true);
    try {
      const data = { ...form, price: Number(form.price), updatedAt: serverTimestamp() };
      if (editItem) {
        await updateDoc(doc(db, 'menu', editItem.id), data);
        toast.success('Item updated!', toastStyle);
      } else {
        await addDoc(collection(db, 'menu'), { ...data, createdAt: serverTimestamp() });
        toast.success('Item added!', toastStyle);
      }
      await fetchItems();
      setShowForm(false);
    } catch { toast.error('Failed to save', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(db, 'menu', id));
    await fetchItems();
    toast.success('Item deleted', toastStyle);
  };

  const toggleAvailable = async (item) => {
    await updateDoc(doc(db, 'menu', item.id), { available: !item.available });
    await fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Menu Management</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{items.length} items in database</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search menu items..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-krunch-card border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none cursor-pointer">
          <option value="all">All Categories</option>
          {menuCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card-dark overflow-hidden group ${!item.available ? 'opacity-50' : ''}`}
            >
              <div className="h-32 bg-krunch-black overflow-hidden">
                {item.img ? (
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {menuCategories.find(c => c.id === item.category)?.icon || '🍴'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-body font-bold text-white text-sm truncate">{item.name}</p>
                <p className="text-krunch-red font-heading font-black text-lg">Rs.{Number(item.price).toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button onClick={() => toggleAvailable(item)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${item.available ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {item.available ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                    {item.available ? 'Live' : 'Off'}
                  </button>
                  <button onClick={() => openEdit(item)}
                    className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all ml-auto">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 hover:border-red-400/50 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/70 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl z-50 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">{editItem ? 'Edit Item' : 'Add New Item'}</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { key: 'name', label: 'Item Name *', placeholder: 'e.g. Zinger Burger' },
                  { key: 'price', label: 'Price (Rs.) *', placeholder: 'e.g. 390', type: 'number' },
                  { key: 'description', label: 'Description', placeholder: 'Short description...' },
                  { key: 'img', label: 'Image URL', placeholder: 'https://...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                    <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      {menuCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Badge</label>
                    <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      {['', 'POPULAR', "CHEF'S PICK", 'NEW', 'SPICY', 'SPECIAL', 'SIGNATURE', 'TOP TRENDING'].map(b => (
                        <option key={b} value={b}>{b || 'None'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-krunch-gray font-body text-sm">Available for ordering</label>
                  <button type="button" onClick={() => setForm({ ...form, available: !form.available })}
                    className={`w-12 h-6 rounded-full transition-all ${form.available ? 'bg-green-500' : 'bg-krunch-border'} relative`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.available ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <><Check size={16} /> {editItem ? 'Update Item' : 'Add Item'}</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMenu;
