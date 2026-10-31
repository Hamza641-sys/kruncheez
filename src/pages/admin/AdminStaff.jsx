import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Plus, Edit2, Trash2, Search, X,
  DollarSign, AlertTriangle, FileText,
  User, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import StaffIDCard from '../../components/admin/StaffIDCard';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const roles = ['Manager', 'Cashier', 'Chef', 'Kitchen Staff', 'Waiter', 'Delivery Rider', 'Cleaner', 'Guard', 'Other'];

// ── EMPTY FORMS ──────────────────────────────────────────────────────────────
const emptyStaff = { name: '', role: 'Cashier', phone: '', salary: '', joiningDate: '', address: '', photo: '', empId: '', cnic: '', emergencyContact: '', bloodGroup: '', active: true };
const emptySalary  = { staffId: '', staffName: '', month: new Date().toISOString().slice(0,7), totalSalary: '', paid: '', deduction: 0, fine: 0, fineReason: '', bonus: 0, bonusReason: '', notes: '' };
const emptyReport  = { staffId: '', staffName: '', type: 'misconduct', description: '', date: new Date().toISOString().split('T')[0], action: '', severity: 'minor' };

const AdminStaff = () => {
  const [staff, setStaff]       = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [reports, setReports]   = useState([]);
  const [tab, setTab]           = useState('staff');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);

  // Modals
  const [showStaffForm,  setShowStaffForm]  = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showIDCard,     setShowIDCard]     = useState(false);
  const [idCardStaff,    setIdCardStaff]    = useState(null);
  const [editStaff,      setEditStaff]      = useState(null);
  const [saving,         setSaving]         = useState(false);

  const [staffForm,  setStaffForm]  = useState(emptyStaff);
  const [salaryForm, setSalaryForm] = useState(emptySalary);
  const [reportForm, setReportForm] = useState(emptyReport);

  // ── Fetch all data ──────────────────────────────────────────────────────
  const fetchAll = async () => {
    const [sSnap, salSnap, rSnap] = await Promise.all([
      getDocs(collection(db, 'staff')),
      getDocs(collection(db, 'salaryRecords')),
      getDocs(collection(db, 'staffReports')),
    ]);
    setStaff(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const salData = salSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    salData.sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    setSalaries(salData);
    const rData = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    rData.sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    setReports(rData);
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = staff.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.role?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Add / Edit Staff ────────────────────────────────────────────────────
  const handleStaffSave = async () => {
    if (!staffForm.name) { toast.error('Name required', toastStyle); return; }
    setSaving(true);
    try {
      const data = { ...staffForm, salary: Number(staffForm.salary)||0, updatedAt: serverTimestamp() };
      if (editStaff) {
        await updateDoc(doc(db, 'staff', editStaff.id), data);
        toast.success('Staff updated!', toastStyle);
      } else {
        await addDoc(collection(db, 'staff'), { ...data, createdAt: serverTimestamp() });
        toast.success('Staff added!', toastStyle);
      }
      await fetchAll(); setShowStaffForm(false); setEditStaff(null); setStaffForm(emptyStaff);
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff?')) return;
    await deleteDoc(doc(db, 'staff', id));
    await fetchAll();
    toast.success('Removed', toastStyle);
  };

  // ── Record Salary ───────────────────────────────────────────────────────
  const handleSalary = async () => {
    if (!salaryForm.staffId || !salaryForm.paid) {
      toast.error('Staff member and paid amount are required', toastStyle); return;
    }
    setSaving(true);
    try {
      const total     = Number(salaryForm.totalSalary) || (staff.find(s=>s.id===salaryForm.staffId)?.salary || 0);
      const paid      = Number(salaryForm.paid);
      const fine      = Number(salaryForm.fine)      || 0;
      const bonus     = Number(salaryForm.bonus)     || 0;
      const deduction = Number(salaryForm.deduction) || 0;
      const netSalary = total + bonus - fine - deduction;
      const remaining = netSalary - paid;

      // Save salary record
      await addDoc(collection(db, 'salaryRecords'), {
        staffId:      salaryForm.staffId,
        staffName:    salaryForm.staffName,
        month:        salaryForm.month,
        totalSalary:  total,
        paid,
        fine,
        fineReason:   salaryForm.fineReason,
        bonus,
        bonusReason:  salaryForm.bonusReason,
        deduction,
        netSalary,
        remaining,
        notes:        salaryForm.notes,
        createdAt:    serverTimestamp(),
      });

      // NOTE: Salary is tracked in salaryRecords - NOT in expenses
      // Reports will load salaryRecords separately

      toast.success('Salary recorded!', toastStyle);
      setShowSalaryForm(false); setSalaryForm(emptySalary);
      await fetchAll();
    } catch(e) { console.error(e); toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  // ── Record Report (misconduct/fine/warning) ─────────────────────────────
  const handleReport = async () => {
    if (!reportForm.staffId || !reportForm.description) {
      toast.error('Staff member and description are required', toastStyle); return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'staffReports'), {
        ...reportForm, createdAt: serverTimestamp()
      });
      toast.success('Report saved!', toastStyle);
      setShowReportForm(false); setReportForm(emptyReport);
      await fetchAll();
    } catch { toast.error('Failed', toastStyle); }
    finally { setSaving(false); }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const openSalaryFor = (s) => {
    setSalaryForm({
      ...emptySalary,
      staffId:     s.id,
      staffName:   s.name,
      totalSalary: s.salary || '',
      month:       new Date().toISOString().slice(0,7),
    });
    setShowSalaryForm(true);
  };

  const openReportFor = (s) => {
    setReportForm({ ...emptyReport, staffId: s.id, staffName: s.name });
    setShowReportForm(true);
  };

  const getStaffSalaries = (staffId) => salaries.filter(s => s.staffId === staffId);
  const getStaffReports  = (staffId) => reports.filter(r => r.staffId === staffId);

  const totalMonthSalary = staff.filter(s=>s.active).reduce((sum,s) => sum+(s.salary||0), 0);
  const totalPaidThisMonth = salaries
    .filter(s => s.month === new Date().toISOString().slice(0,7))
    .reduce((sum,s) => sum + (s.paid||0), 0);

  const severityColor = { minor: 'text-amber-400 bg-amber-400/10 border-amber-400/20', major: 'text-orange-400 bg-orange-400/10 border-orange-400/20', critical: 'text-red-400 bg-red-400/10 border-red-400/20' };
  const typeIcon = { misconduct: '⚠️', fine: '💸', warning: '📋', absent: '❌', late: '⏰', other: '📝' };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Staff Management</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{staff.filter(s=>s.active).length} active staff</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReportForm(true)}
            className="flex items-center gap-2 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <AlertTriangle size={15} /> Report
          </button>
          <button onClick={() => setShowSalaryForm(true)}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <DollarSign size={15} /> Pay Salary
          </button>
          <button onClick={() => {
              const nextNum = staff.length + 1;
              const autoId = `KRZ-${String(nextNum).padStart(3, '0')}`;
              setStaffForm({ ...emptyStaff, empId: autoId });
              setEditStaff(null);
              setShowStaffForm(true);
            }}
            className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Staff',        value: staff.length,             color: 'text-white',       bg: 'bg-krunch-red/10',    icon: '👥' },
          { label: 'Monthly Bill',       value: `Rs.${totalMonthSalary.toLocaleString()}`, color: 'text-amber-400',  bg: 'bg-amber-400/10',   icon: '💰' },
          { label: 'Paid This Month',    value: `Rs.${totalPaidThisMonth.toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-400/10',  icon: '✅' },
          { label: 'Reports/Issues',     value: reports.length,           color: 'text-orange-400',  bg: 'bg-orange-400/10',  icon: '⚠️' },
        ].map((s,i) => (
          <div key={i} className="card-dark p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2 text-lg`}>{s.icon}</div>
            <p className={`font-heading font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        {[
          { k:'staff',    l:`Staff (${staff.length})` },
          { k:'salaries', l:`Salary Records (${salaries.length})` },
          { k:'reports',  l:`Reports/Issues (${reports.length})` },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              tab===t.k ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
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

      {/* ── STAFF TAB ── */}
      {tab === 'staff' && (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">👥</div>
              <p className="font-heading font-bold text-xl text-white uppercase mb-2">No staff yet</p>
              <button onClick={() => setShowStaffForm(true)} className="btn-primary mt-2 text-sm">Add Staff</button>
            </div>
          ) : filtered.map((s, i) => {
            const sSalaries = getStaffSalaries(s.id);
            const sReports  = getStaffReports(s.id);
            const lastSal   = sSalaries[0];
            const isExpanded = expanded === s.id;
            return (
              <motion.div key={s.id} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                className="card-dark overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-krunch-red flex-shrink-0 flex items-center justify-center text-white font-heading font-black text-xl">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-white text-base">{s.name}</h3>
                      <span className="text-[10px] bg-krunch-red/20 text-krunch-red border border-krunch-red/30 px-2 py-0.5 rounded font-bold uppercase">{s.role}</span>
                      {s.empId && <span className="text-[10px] bg-green-900/20 text-green-400 border border-green-700/30 px-2 py-0.5 rounded font-bold">{s.empId}</span>}
                      {sReports.length > 0 && (
                        <span className="text-[10px] bg-orange-400/10 text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded font-bold">
                          ⚠️ {sReports.length} reports
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {s.phone && <span className="text-krunch-gray font-body text-xs">📞 {s.phone}</span>}
                      {s.cnic && <span className="text-krunch-gray font-body text-xs">🪪 {s.cnic}</span>}
                      {s.bloodGroup && <span className="text-red-400 font-body text-xs font-bold">🩸 {s.bloodGroup}</span>}
                      <span className="text-amber-400 font-body text-xs font-semibold">💰 Rs.{(s.salary||0).toLocaleString()}/month</span>
                      {lastSal && (
                        <span className="text-green-400 font-body text-xs">Last paid: Rs.{(lastSal.paid||0).toLocaleString()} ({lastSal.month})</span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => { setIdCardStaff(s); setShowIDCard(true); }}
                      className="flex items-center gap-1 text-[10px] bg-blue-900/20 text-blue-400 border border-blue-700/30 hover:bg-blue-600 hover:text-white font-bold px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap">
                      🪪 ID Card
                    </button>
                    <button onClick={() => openSalaryFor(s)}
                      className="flex items-center gap-1 text-[10px] bg-green-900/20 text-green-400 border border-green-700/30 hover:bg-green-600 hover:text-white font-bold px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap">
                      <DollarSign size={11} /> Salary
                    </button>
                    <button onClick={() => openReportFor(s)}
                      className="flex items-center gap-1 text-[10px] bg-orange-900/20 text-orange-400 border border-orange-700/30 hover:bg-orange-600 hover:text-white font-bold px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap">
                      <AlertTriangle size={11} /> Report
                    </button>
                    <button onClick={() => { setStaffForm({...emptyStaff,...s}); setEditStaff(s); setShowStaffForm(true); }}
                      className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-red-400 transition-all">
                      <Trash2 size={11} />
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : s.id)}
                      className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all">
                      {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                      className="border-t border-krunch-border overflow-hidden">
                      <div className="p-4 grid sm:grid-cols-2 gap-4">
                        {/* Staff extra info */}
                        {(s.address || s.cnic || s.emergencyContact || s.bloodGroup) && (
                          <div className="sm:col-span-2 bg-krunch-black border border-krunch-border rounded-xl p-3 mb-1">
                            <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-2">Personal Info</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs font-body">
                              {s.address && <div><span className="text-krunch-gray">📍 Address: </span><span className="text-white">{s.address}</span></div>}
                              {s.cnic && <div><span className="text-krunch-gray">🪪 CNIC: </span><span className="text-white">{s.cnic}</span></div>}
                              {s.bloodGroup && <div><span className="text-krunch-gray">🩸 Blood: </span><span className="text-red-400 font-bold">{s.bloodGroup}</span></div>}
                              {s.emergencyContact && <div><span className="text-krunch-gray">🚨 Emergency: </span><span className="text-white">{s.emergencyContact}</span></div>}
                              {s.joiningDate && <div><span className="text-krunch-gray">📅 Joined: </span><span className="text-white">{s.joiningDate}</span></div>}
                            </div>
                          </div>
                        )}
                        {/* Salary history */}
                        <div>
                          <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-3">Salary History</h4>
                          {sSalaries.length === 0 ? (
                            <p className="text-krunch-gray font-body text-xs">No records found</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {sSalaries.slice(0,5).map(sal => (
                                <div key={sal.id} className="bg-krunch-black border border-krunch-border rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-white font-body font-semibold text-xs">{sal.month}</span>
                                    <span className="text-green-400 font-body font-bold text-xs">Paid: Rs.{(sal.paid||0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-[10px]">
                                    <span className="text-krunch-gray">Total: Rs.{(sal.totalSalary||0).toLocaleString()}</span>
                                    {sal.fine > 0 && <span className="text-red-400">Fine: -Rs.{sal.fine.toLocaleString()} {sal.fineReason ? `(${sal.fineReason})` : ''}</span>}
                                    {sal.bonus > 0 && <span className="text-amber-400">Bonus: +Rs.{sal.bonus.toLocaleString()} {sal.bonusReason ? `(${sal.bonusReason})` : ''}</span>}
                                    {sal.remaining > 0 && <span className="text-orange-400">Remaining: Rs.{sal.remaining.toLocaleString()}</span>}
                                    {sal.remaining < 0 && <span className="text-blue-400">Overpaid: Rs.{Math.abs(sal.remaining).toLocaleString()}</span>}
                                  </div>
                                  {sal.notes && <p className="text-krunch-gray text-[10px] mt-1">📝 {sal.notes}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Reports history */}
                        <div>
                          <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-3">Reports / Issues</h4>
                          {sReports.length === 0 ? (
                            <p className="text-krunch-gray font-body text-xs">No reports - all good! ✅</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {sReports.slice(0,5).map(r => (
                                <div key={r.id} className="bg-krunch-black border border-krunch-border rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <span>{typeIcon[r.type] || '📝'}</span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${severityColor[r.severity] || severityColor.minor}`}>
                                        {r.severity}
                                      </span>
                                    </div>
                                    <span className="text-krunch-gray font-body text-[10px]">{r.date}</span>
                                  </div>
                                  <p className="text-white font-body text-xs">{r.description}</p>
                                  {r.action && <p className="text-krunch-gray text-[10px] mt-1">Action: {r.action}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── SALARY RECORDS TAB ── */}
      {tab === 'salaries' && (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-krunch-border">
                  {['Month','Staff','Total Salary','Fine','Bonus','Net','Paid','Remaining','Notes'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salaries.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No salary records found</td></tr>
                ) : salaries.map(s => (
                  <tr key={s.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">{s.month}</td>
                    <td className="px-4 py-3 text-white font-body font-semibold text-sm">{s.staffName}</td>
                    <td className="px-4 py-3 text-white font-body text-sm">Rs.{(s.totalSalary||0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {s.fine > 0 ? (
                        <div>
                          <span className="text-red-400 font-body font-bold text-xs">-Rs.{s.fine.toLocaleString()}</span>
                          {s.fineReason && <p className="text-krunch-gray text-[10px]">{s.fineReason}</p>}
                        </div>
                      ) : <span className="text-krunch-gray text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {s.bonus > 0 ? (
                        <div>
                          <span className="text-amber-400 font-body font-bold text-xs">+Rs.{s.bonus.toLocaleString()}</span>
                          {s.bonusReason && <p className="text-krunch-gray text-[10px]">{s.bonusReason}</p>}
                        </div>
                      ) : <span className="text-krunch-gray text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-base">Rs.{(s.netSalary||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-400 font-body font-bold text-sm">Rs.{(s.paid||0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {(s.remaining||0) > 0 ? (
                        <span className="text-orange-400 font-body font-bold text-xs">Rs.{s.remaining.toLocaleString()} remaining</span>
                      ) : (s.remaining||0) < 0 ? (
                        <span className="text-blue-400 font-body text-xs">Overpaid</span>
                      ) : (
                        <span className="text-green-400 font-body text-xs">✅ Cleared</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs">{s.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {tab === 'reports' && (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-krunch-border">
                  {['Date','Staff','Type','Severity','Description','Action Taken'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No reports found - all good! ✅</td></tr>
                ) : reports.map(r => (
                  <tr key={r.id} className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 text-white font-body font-semibold text-sm">{r.staffName}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-body text-xs capitalize">{typeIcon[r.type]} {r.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${severityColor[r.severity] || severityColor.minor}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm max-w-xs">{r.description}</td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-xs">{r.action || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════ ADD STAFF MODAL ══════ */}
      <AnimatePresence>
        {showStaffForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowStaffForm(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9,y:20 }} animate={{ scale:1,y:0 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">{editStaff ? 'Edit Staff' : 'Add Staff'}</h3>
                <button onClick={() => setShowStaffForm(false)} className="text-krunch-gray hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">

                  {/* Photo - top pe taake pehle dikhay */}
                  <div className="col-span-2">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">
                      Staff Photo URL <span className="text-krunch-red text-[10px] normal-case">(ID Card pe lagegi)</span>
                    </label>
                    <input type="text" value={staffForm.photo} onChange={e => setStaffForm({...staffForm,photo:e.target.value})}
                      placeholder="https://i.ibb.co/... - ImgBB pe photo upload karo aur URL paste karo"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                    {staffForm.photo ? (
                      <div className="mt-3 flex items-center gap-4 bg-krunch-black border border-green-700/30 rounded-xl p-3">
                        <img src={staffForm.photo} alt="preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-krunch-red flex-shrink-0"
                          onError={e => { e.target.style.display='none'; }}
                        />
                        <div>
                          <p className="text-green-400 font-body text-xs font-semibold">✅ Photo ready for ID Card</p>
                          <p className="text-krunch-gray font-body text-[10px] mt-0.5">This photo will appear on the printed ID card</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 bg-krunch-black border border-krunch-border/50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray text-xl flex-shrink-0">👤</div>
                        <div>
                          <p className="text-krunch-gray font-body text-xs">No photo added</p>
                          <p className="text-krunch-gray/60 font-body text-[10px] mt-0.5">
                            Upload on <span className="text-blue-400">imgbb.com</span> → copy URL → paste above
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <input type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm,name:e.target.value})} placeholder="Muhammad Ali"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Role *</label>
                    <select value={staffForm.role} onChange={e => setStaffForm({...staffForm,role:e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      {roles.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">
                      Employee ID <span className="text-green-400 text-[10px] normal-case">(auto-generated)</span>
                    </label>
                    <div className="relative">
                      <input type="text" value={staffForm.empId} onChange={e => setStaffForm({...staffForm,empId:e.target.value})} placeholder="KRZ-001"
                        className="w-full bg-krunch-black border border-green-700/30 rounded-xl px-4 py-3 text-green-400 font-body font-bold text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-krunch-gray">editable</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Monthly Salary (Rs.)</label>
                    <input type="number" value={staffForm.salary} onChange={e => setStaffForm({...staffForm,salary:e.target.value})} placeholder="25000"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone</label>
                    <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({...staffForm,phone:e.target.value})} placeholder="03XX-XXXXXXX"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Joining Date</label>
                    <input type="date" value={staffForm.joiningDate} onChange={e => setStaffForm({...staffForm,joiningDate:e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                  {/* Address */}
                  <div className="col-span-2">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Home Address</label>
                    <input type="text" value={staffForm.address} onChange={e => setStaffForm({...staffForm,address:e.target.value})} placeholder="e.g. House 12, Street 5, Peshawar"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>

                  {/* CNIC */}
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">CNIC Number</label>
                    <input type="text" value={staffForm.cnic} onChange={e => setStaffForm({...staffForm,cnic:e.target.value})} placeholder="35202-XXXXXXX-X"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Blood Group</label>
                    <select value={staffForm.bloodGroup} onChange={e => setStaffForm({...staffForm,bloodGroup:e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                      <option value="">Select Blood Group</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  {/* Emergency Contact */}
                  <div className="col-span-2">
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Emergency Contact (Name & Phone)</label>
                    <input type="text" value={staffForm.emergencyContact} onChange={e => setStaffForm({...staffForm,emergencyContact:e.target.value})} placeholder="e.g. Father - 03XX-XXXXXXX"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <label className="text-krunch-gray font-body text-sm">Active Employee</label>
                    <button type="button" onClick={() => setStaffForm({...staffForm,active:!staffForm.active})}
                      className={`w-12 h-6 rounded-full transition-all relative ${staffForm.active?'bg-green-500':'bg-krunch-border'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${staffForm.active?'left-6':'left-0.5'}`}/>
                    </button>
                  </div>
                </div>
                <button onClick={handleStaffSave} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : `${editStaff?'Update':'Add'} Staff`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ SALARY MODAL ══════ */}
      <AnimatePresence>
        {showSalaryForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowSalaryForm(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9,y:20 }} animate={{ scale:1,y:0 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">💰 Salary Payment Record</h3>
                <button onClick={() => setShowSalaryForm(false)} className="text-krunch-gray hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {/* Staff select */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Staff Member *</label>
                  <select value={salaryForm.staffId}
                    onChange={e => {
                      const s = staff.find(x => x.id===e.target.value);
                      setSalaryForm({...salaryForm, staffId:e.target.value, staffName:s?.name||'', totalSalary:s?.salary||''});
                    }}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                    <option value="">Select staff member</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role} (Rs.{(s.salary||0).toLocaleString()})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Month</label>
                    <input type="month" value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm,month:e.target.value})}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Total Salary (Rs.)</label>
                    <input type="number" value={salaryForm.totalSalary} onChange={e => setSalaryForm({...salaryForm,totalSalary:e.target.value})} placeholder="e.g. 25000"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                  </div>
                </div>

                {/* Fine */}
                <div className="bg-red-900/10 border border-red-700/20 rounded-xl p-4">
                  <p className="text-red-400 font-body font-bold text-xs uppercase tracking-wider mb-3">💸 Fine / Deduction</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-krunch-gray font-body text-xs mb-1 block">Fine Amount (Rs.)</label>
                      <input type="number" value={salaryForm.fine} onChange={e => setSalaryForm({...salaryForm,fine:e.target.value})} placeholder="0"
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm focus:outline-none focus:border-red-500 transition-colors"/>
                    </div>
                    <div>
                      <label className="text-krunch-gray font-body text-xs mb-1 block">Fine Reason</label>
                      <input type="text" value={salaryForm.fineReason} onChange={e => setSalaryForm({...salaryForm,fineReason:e.target.value})} placeholder="e.g. Late arrival, misconduct"
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-red-500 transition-colors"/>
                    </div>
                  </div>
                </div>

                {/* Bonus */}
                <div className="bg-amber-900/10 border border-amber-700/20 rounded-xl p-4">
                  <p className="text-amber-400 font-body font-bold text-xs uppercase tracking-wider mb-3">🎁 Bonus</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-krunch-gray font-body text-xs mb-1 block">Bonus Amount (Rs.)</label>
                      <input type="number" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm,bonus:e.target.value})} placeholder="0"
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm focus:outline-none focus:border-amber-500 transition-colors"/>
                    </div>
                    <div>
                      <label className="text-krunch-gray font-body text-xs mb-1 block">Bonus Reason</label>
                      <input type="text" value={salaryForm.bonusReason} onChange={e => setSalaryForm({...salaryForm,bonusReason:e.target.value})} placeholder="e.g. Eid bonus, performance award"
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-amber-500 transition-colors"/>
                    </div>
                  </div>
                </div>

                {/* Paid */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Amount Paid (Rs.) *</label>
                  <input type="number" value={salaryForm.paid} onChange={e => setSalaryForm({...salaryForm,paid:e.target.value})} placeholder="Actual amount diya"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                </div>

                {/* Live calculation */}
                {salaryForm.totalSalary && (
                  <div className="bg-krunch-black border border-krunch-border rounded-xl p-4">
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Calculation</p>
                    <div className="flex flex-col gap-1 text-sm font-body">
                      <div className="flex justify-between"><span className="text-krunch-gray">Total Salary</span><span className="text-white">Rs.{Number(salaryForm.totalSalary||0).toLocaleString()}</span></div>
                      {Number(salaryForm.fine)>0 && <div className="flex justify-between"><span className="text-red-400">Fine</span><span className="text-red-400">-Rs.{Number(salaryForm.fine).toLocaleString()}</span></div>}
                      {Number(salaryForm.bonus)>0 && <div className="flex justify-between"><span className="text-amber-400">Bonus</span><span className="text-amber-400">+Rs.{Number(salaryForm.bonus).toLocaleString()}</span></div>}
                      <div className="flex justify-between border-t border-krunch-border pt-1 mt-1">
                        <span className="text-white font-bold">Net Salary</span>
                        <span className="text-krunch-red font-bold">Rs.{(Number(salaryForm.totalSalary||0) + Number(salaryForm.bonus||0) - Number(salaryForm.fine||0)).toLocaleString()}</span>
                      </div>
                      {salaryForm.paid && <div className="flex justify-between">
                        <span className="text-krunch-gray">Paid</span>
                        <span className="text-green-400">Rs.{Number(salaryForm.paid).toLocaleString()}</span>
                      </div>}
                      {salaryForm.paid && (() => {
                        const net = Number(salaryForm.totalSalary||0) + Number(salaryForm.bonus||0) - Number(salaryForm.fine||0);
                        const rem = net - Number(salaryForm.paid||0);
                        return rem !== 0 ? (
                          <div className="flex justify-between">
                            <span className={rem>0?'text-orange-400':'text-blue-400'}>{rem>0?'Remaining':'Overpaid'}</span>
                            <span className={rem>0?'text-orange-400':'text-blue-400'}>Rs.{Math.abs(rem).toLocaleString()}</span>
                          </div>
                        ) : <div className="text-green-400 text-center text-xs">✅ Salary fully cleared!</div>;
                      })()}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                  <input type="text" value={salaryForm.notes} onChange={e => setSalaryForm({...salaryForm,notes:e.target.value})} placeholder="Additional notes..."
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                </div>

                <button onClick={handleSalary} disabled={saving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black py-4 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : '✅ Save Salary Record'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ REPORT MODAL ══════ */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowReportForm(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9,y:20 }} animate={{ scale:1,y:0 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">⚠️ Staff Report / Issue</h3>
                <button onClick={() => setShowReportForm(false)} className="text-krunch-gray hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {/* Staff */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Staff Member *</label>
                  <select value={reportForm.staffId}
                    onChange={e => {
                      const s = staff.find(x => x.id===e.target.value);
                      setReportForm({...reportForm, staffId:e.target.value, staffName:s?.name||''});
                    }}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none">
                    <option value="">Select staff member</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role}</option>)}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2 block">Report Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k:'misconduct', l:'⚠️ Misconduct' },
                      { k:'fine',       l:'💸 Fine' },
                      { k:'warning',    l:'📋 Warning' },
                      { k:'absent',     l:'❌ Absent' },
                      { k:'late',       l:'⏰ Late' },
                      { k:'other',      l:'📝 Other' },
                    ].map(t => (
                      <button key={t.k} type="button" onClick={() => setReportForm({...reportForm,type:t.k})}
                        className={`py-2 rounded-xl font-body text-xs transition-all ${reportForm.type===t.k?'bg-orange-600 text-white':'bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white'}`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2 block">Severity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k:'minor',    l:'Minor' },
                      { k:'major',    l:'Major' },
                      { k:'critical', l:'Critical' },
                    ].map(s => (
                      <button key={s.k} type="button" onClick={() => setReportForm({...reportForm,severity:s.k})}
                        className={`py-2 rounded-xl font-body font-bold text-xs transition-all capitalize ${
                          reportForm.severity===s.k ? (severityColor[s.k]||'bg-amber-600 text-white') : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white'
                        }`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Date</label>
                  <input type="date" value={reportForm.date} onChange={e => setReportForm({...reportForm,date:e.target.value})}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors"/>
                </div>

                {/* Description */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Description * (what happened)</label>
                  <textarea value={reportForm.description} onChange={e => setReportForm({...reportForm,description:e.target.value})}
                    rows={3} placeholder="Describe the incident in detail..."
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors resize-none"/>
                </div>

                {/* Action taken */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Action Taken (optional)</label>
                  <input type="text" value={reportForm.action} onChange={e => setReportForm({...reportForm,action:e.target.value})}
                    placeholder="e.g. Warning issued, fine deducted, suspended"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"/>
                </div>

                <button onClick={handleReport} disabled={saving}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-heading font-black py-4 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {saving ? 'Saving...' : '📋 Save Report'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ ID CARD MODAL ══════ */}
      {showIDCard && idCardStaff && (
        <StaffIDCard
          staff={idCardStaff}
          onClose={() => { setShowIDCard(false); setIdCardStaff(null); }}
        />
      )}
    </div>
  );
};

export default AdminStaff;
