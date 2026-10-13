import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit2, Trash2, Search, X, Clock, CheckCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };
const roles = ['Manager', 'Cashier', 'Chef', 'Kitchen Staff', 'Waiter', 'Delivery Rider', 'Cleaner', 'Guard', 'Other'];
const emptyStaff = { name: '', role: 'Cashier', phone: '', salary: '', joiningDate: '', address: '', notes: '', active: true };

const AdminStaff = () => {
  const [staff, setStaff]         = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tab, setTab]             = useState('staff');
  const [search, setSearch]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm]           = useState(emptyStaff);
  const [saving, setSaving]       = useState(false);
  const [selected, setSelected]   = useState(null);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0,7));

  const fetchAll = async () => {
    const [sSnap, aSnap] = await Promise.all([
      getDocs(collection(db, 'staff')),
      getDocs(collection(db, 'attendance')),
    ]);
    setStaff(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    // Sort attendance by date desc in JS
    const attData = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    attData.sort((a, b) => {
      const da = a.createdAt?.toDate?.() || new Date(a.date || 0);
      const db2 = b.createdAt?.toDate?.() || new Date(b.date || 0);
      return db2 - da;
    });
    setAttendance(attData);
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = staff.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.role?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name || !form.role) { toast.error('Name and role required', toastStyle); return; }
    setSaving(true);
    try {
      const data = { ...form, salary: Number(form.salary)||0, updatedAt: serverTimestamp() };
      if (editStaff) {
        await updateDoc(doc(db, 'staff', editStaff.id), data);
        toast.success('Staff updated!', toastStyle);
      } else {
        await addDoc(collection(db, 'staff'), { ...data, createdAt: serverTimestamp() });
        toast.success('Staff added!', toastStyle);
      }
      await fetchAll(); setShowForm(false); setEditStaff(null); setForm(emptyStaff);
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const markAttendance = async (staffId, staffName, status) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendance.find(a => a.staffId === staffId && a.date === today);
    if (existing) {
      await updateDoc(doc(db, 'attendance', existing.id), { status, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'attendance'), {
        staffId, staffName, date: today, status,
        time: new Date().toLocaleTimeString('en-PK'),
        createdAt: serverTimestamp(),
      });
    }
    await fetchAll();
    toast.success(`${staffName} marked ${status}!`, toastStyle);
  };

  const paySalary = async (staffMember) => {
    await addDoc(collection(db, 'expenses'), {
      category: 'Salaries',
      description: `Salary — ${staffMember.name} (${staffMember.role}) — ${salaryMonth}`,
      amount: staffMember.salary,
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      staffId: staffMember.id,
      createdAt: serverTimestamp(),
    });
    toast.success(`Salary paid to ${staffMember.name}!`, toastStyle);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    await deleteDoc(doc(db, 'staff', id));
    await fetchAll();
    toast.success('Removed', toastStyle);
  };

  const getTodayStatus = (staffId) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.staffId === staffId && a.date === today)?.status || null;
  };

  const getMonthlyAttendance = (staffId) => {
    const month = new Date().toISOString().slice(0, 7);
    return attendance.filter(a => a.staffId === staffId && a.date?.startsWith(month));
  };

  const totalSalaryBill = staff.filter(s => s.active).reduce((sum, s) => sum + (s.salary || 0), 0);
  const presentToday    = attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'present').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Staff Management</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{staff.filter(s=>s.active).length} active staff</p>
        </div>
        <button onClick={() => { setForm(emptyStaff); setEditStaff(null); setShowForm(true); }}
          className="flex items-center gap-2 btn-primary text-sm"><Plus size={16} /> Add Staff</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Staff',    value: staff.length,                                   color: 'text-white',        bg: 'bg-krunch-red/10' },
          { label: 'Present Today',  value: presentToday,                                   color: 'text-green-400',    bg: 'bg-green-400/10' },
          { label: 'Monthly Salary', value: `Rs.${totalSalaryBill.toLocaleString()}`,       color: 'text-amber-400',    bg: 'bg-amber-400/10' },
          { label: 'Active',         value: staff.filter(s=>s.active).length,               color: 'text-blue-400',     bg: 'bg-blue-400/10' },
        ].map((s,i) => (
          <div key={i} className="card-dark p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
              {i===0 ? '👥' : i===1 ? '✅' : i===2 ? '💰' : '🟢'}
            </div>
            <p className={`font-heading font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{k:'staff',l:'Staff List'},{k:'attendance',l:'Attendance'},{k:'salary',l:'Salary'}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${tab===t.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Staff List Tab */}
      {tab === 'staff' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => {
            const todayStatus = getTodayStatus(s.id);
            const monthAtt    = getMonthlyAttendance(s.id);
            const presentDays = monthAtt.filter(a => a.status === 'present').length;
            return (
              <motion.div key={s.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className={`card-dark p-5 ${!s.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-xl flex-shrink-0">
                    {s.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setForm({...emptyStaff,...s}); setEditStaff(s); setShowForm(true); }}
                      className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h3 className="font-heading font-bold text-white text-lg">{s.name}</h3>
                <p className="text-krunch-red font-body text-xs font-bold uppercase tracking-wider mb-2">{s.role}</p>
                {s.phone && <p className="text-krunch-gray font-body text-xs mb-1">📞 {s.phone}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-krunch-border">
                  <div>
                    <p className="text-krunch-gray font-body text-[10px] uppercase">Monthly Salary</p>
                    <p className="text-amber-400 font-heading font-black text-base">Rs.{(s.salary||0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-krunch-gray font-body text-[10px] uppercase">This Month</p>
                    <p className="text-white font-heading font-black text-base">{presentDays} days</p>
                  </div>
                </div>
                {/* Attendance quick buttons */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => markAttendance(s.id, s.name, 'present')}
                    className={`flex-1 py-1.5 rounded-lg font-body font-bold text-xs transition-all ${todayStatus==='present' ? 'bg-green-600 text-white' : 'bg-green-900/20 text-green-400 border border-green-700/30 hover:bg-green-600 hover:text-white'}`}>
                    ✅ Present
                  </button>
                  <button onClick={() => markAttendance(s.id, s.name, 'absent')}
                    className={`flex-1 py-1.5 rounded-lg font-body font-bold text-xs transition-all ${todayStatus==='absent' ? 'bg-red-600 text-white' : 'bg-red-900/20 text-red-400 border border-red-700/30 hover:bg-red-600 hover:text-white'}`}>
                    ❌ Absent
                  </button>
                  <button onClick={() => markAttendance(s.id, s.name, 'leave')}
                    className={`flex-1 py-1.5 rounded-lg font-body font-bold text-xs transition-all ${todayStatus==='leave' ? 'bg-amber-600 text-white' : 'bg-amber-900/20 text-amber-400 border border-amber-700/30 hover:bg-amber-600 hover:text-white'}`}>
                    🏖️ Leave
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-krunch-border">
                  {['Date','Staff Name','Role','Status','Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No attendance records</td></tr>
                ) : attendance.slice(0,50).map((a) => (
                  <tr key={a.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">{a.date}</td>
                    <td className="px-4 py-3 text-white font-body font-semibold text-sm">{a.staffName}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs">
                      {staff.find(s => s.id === a.staffId)?.role || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        a.status === 'present' ? 'bg-green-500/20 text-green-400' :
                        a.status === 'absent'  ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs">{a.time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Tab */}
      {tab === 'salary' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-krunch-gray font-body text-sm">Month:</label>
            <input type="month" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)}
              className="bg-krunch-card border border-krunch-border rounded-xl px-4 py-2 text-white font-body text-sm focus:outline-none focus:border-krunch-red" />
          </div>
          <div className="card-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-krunch-border">
                    {['Staff','Role','Present Days','Salary','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.filter(s=>s.active).map((s) => {
                    const monthAtt    = attendance.filter(a => a.staffId === s.id && a.date?.startsWith(salaryMonth));
                    const presentDays = monthAtt.filter(a => a.status === 'present').length;
                    return (
                      <tr key={s.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-sm">{s.name?.[0]?.toUpperCase()}</div>
                            <span className="text-white font-body font-semibold text-sm">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-krunch-gray font-body text-sm">{s.role}</td>
                        <td className="px-4 py-3 text-white font-body font-bold text-sm">{presentDays} days</td>
                        <td className="px-4 py-3 text-amber-400 font-heading font-black text-base">Rs.{(s.salary||0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => paySalary(s)}
                            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-body font-bold text-xs px-3 py-1.5 rounded-xl transition-all">
                            <DollarSign size={11} /> Pay Salary
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-krunch-card">
                    <td colSpan={3} className="px-4 py-3 text-right font-heading font-bold text-white uppercase">Total</td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-lg">Rs.{totalSalaryBill.toLocaleString()}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">{editStaff ? 'Edit Staff' : 'Add Staff'}</h3>
                <button onClick={() => setShowForm(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Muhammad Ahmed"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Role *</label>
                    <select value={form.role} onChange={e => setForm({...form,role:e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      {roles.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Monthly Salary (Rs.)</label>
                    <input type="number" value={form.salary} onChange={e => setForm({...form,salary:e.target.value})} placeholder="25000"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="03XX-XXXXXXX"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Joining Date</label>
                    <input type="date" value={form.joiningDate} onChange={e => setForm({...form,joiningDate:e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Address</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="Home address"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <label className="text-krunch-gray font-body text-sm">Active Employee</label>
                    <button type="button" onClick={() => setForm({...form,active:!form.active})}
                      className={`w-12 h-6 rounded-full transition-all relative ${form.active ? 'bg-green-500' : 'bg-krunch-border'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.active ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : `${editStaff?'Update':'Add'} Staff`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStaff;
