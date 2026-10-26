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

  const openAdd  = () => { setForm(emptyItem); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => { setForm({ ...emptyItem, ...item }); setEditItem(item); setShowForm(true); };

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

  const toggleCustomDeal = async (item) => {
    await updateDoc(doc(db, 'menu', item.id), { customDeal: !item.customDeal });
    await fetchItems();
    toast.success(`${item.name} ${!item.customDeal ? 'added to' : 'removed from'} Custom Deal`, toastStyle);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Menu Management</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{items.length} items in database</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: Category Sidebar ── */}
        <aside className="lg:w-52 flex-shrink-0">
          <div className="sticky top-4">
            <h3 className="font-heading font-bold text-white text-xs uppercase tracking-widest mb-3 px-1">Categories</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0" style={{ scrollbarWidth: 'none' }}>
              {/* All button */}
              <button
                onClick={() => setCatFilter('all')}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-body font-semibold text-sm transition-all text-left ${
                  catFilter === 'all'
                    ? 'bg-krunch-red text-white shadow-red-glow'
                    : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:border-krunch-red hover:text-white'
                }`}>
                <span className="text-lg">🍴</span>
                <span className="whitespace-nowrap flex-1">All Items</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${catFilter === 'all' ? 'bg-white/20' : 'bg-krunch-black'}`}>
                  {items.length}
                </span>
              </button>

              {menuCategories.map((cat) => {
                const count = items.filter(i => i.category === cat.id).length;
                return (
                  <button key={cat.id}
                    onClick={() => setCatFilter(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-body font-semibold text-sm transition-all text-left ${
                      catFilter === cat.id
                        ? 'bg-krunch-red text-white shadow-red-glow'
                        : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:border-krunch-red hover:text-white'
                    }`}>
                    <span className="text-lg">{cat.icon}</span>
                    <span className="whitespace-nowrap flex-1">{cat.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${catFilter === cat.id ? 'bg-white/20' : 'bg-krunch-black'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── RIGHT: Items Area ── */}
        <div className="flex-1">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
            <input type="text" placeholder="Search menu items..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
          </div>

          {/* Category title */}
          {catFilter !== 'all' && !search && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{menuCategories.find(c => c.id === catFilter)?.icon}</span>
              <div>
                <h3 className="font-heading font-bold text-xl text-white uppercase">
                  {menuCategories.find(c => c.id === catFilter)?.name}
                </h3>
                <p className="text-krunch-gray font-body text-xs">
                  {filtered.length} items
                </p>
              </div>
            </div>
          )}

          {/* Items Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-krunch-card rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-heading font-bold text-xl text-white uppercase">No items found</p>
              <button onClick={openAdd} className="btn-primary mt-4 text-sm">+ Add Item</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`card-dark overflow-hidden group ${!item.available ? 'opacity-50' : ''}`}
                >
                  <div className="h-32 bg-krunch-black overflow-hidden relative">
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {menuCategories.find(c => c.id === item.category)?.icon || '🍴'}
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {item.category}
                    </div>
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
                    {/* Custom Deal Toggle */}
                    <button
                      onClick={() => toggleCustomDeal(item)}
                      className={`w-full mt-2 flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all border ${
                        item.customDeal
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-krunch-black border-krunch-border text-krunch-gray hover:border-amber-500/40 hover:text-amber-400'
                      }`}>
                      ✨ {item.customDeal ? 'In Custom Deal ✓' : 'Add to Custom Deal'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl z-50 flex flex-col max-h-[90vh] overflow-y-auto"
              >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">{editItem ? 'Edit Item' : 'Add New Item'}</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { key: 'name',        label: 'Item Name *',   placeholder: 'e.g. Zinger Burger' },
                  { key: 'price',       label: 'Price (Rs.) *', placeholder: 'e.g. 390', type: 'number' },
                  { key: 'description', label: 'Description',   placeholder: 'Short description...' },
                  { key: 'img',         label: 'Image URL',     placeholder: 'https://i.ibb.co/... or any image URL' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                    <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}

                {/* Image Preview */}
                {form.img && (
                  <div className="rounded-xl overflow-hidden border border-krunch-border">
                    <img
                      src={form.img}
                      alt="preview"
                      className="w-full h-40 object-cover"
                      onError={e => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                )}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMenu;
