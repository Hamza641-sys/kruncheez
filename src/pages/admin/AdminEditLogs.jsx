import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ClipboardList, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const AdminEditLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'orderEdits'), orderBy('editedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this log?')) return;
    await deleteDoc(doc(db, 'orderEdits', id));
    toast.success('Log deleted', toastStyle);
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const diffAmount = (log) => {
    const diff = (log.newTotal || 0) - (log.oldTotal || 0);
    if (diff === 0) return null;
    return diff > 0
      ? <span className="text-red-400 font-bold text-xs">+Rs.{diff.toLocaleString()}</span>
      : <span className="text-green-400 font-bold text-xs">-Rs.{Math.abs(diff).toLocaleString()}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase flex items-center gap-2">
            <ClipboardList size={22} className="text-krunch-red" /> Order Edit Logs
          </h2>
          <p className="text-krunch-gray font-body text-sm mt-1">
            Every order edit is recorded here — {logs.length} total edits
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-dark p-4 text-center">
          <p className="font-heading font-black text-2xl text-white">{logs.length}</p>
          <p className="text-krunch-gray font-body text-xs mt-1">Total Edits</p>
        </div>
        <div className="card-dark p-4 text-center">
          <p className="font-heading font-black text-2xl text-white">
            {[...new Set(logs.map(l => l.editedBy))].length}
          </p>
          <p className="text-krunch-gray font-body text-xs mt-1">Editors</p>
        </div>
        <div className="card-dark p-4 text-center">
          <p className="font-heading font-black text-2xl text-white">
            {logs.filter(l => {
              const d = l.editedAt?.toDate?.();
              return d && new Date() - d < 86400000;
            }).length}
          </p>
          <p className="text-krunch-gray font-body text-xs mt-1">Today</p>
        </div>
      </div>

      {/* Logs list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <ClipboardList size={40} className="text-krunch-gray/30 mx-auto mb-3" />
          <p className="text-krunch-gray font-body text-sm">No edits recorded yet</p>
          <p className="text-krunch-gray/50 font-body text-xs mt-1">When a manager edits an order, it will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log, i) => (
            <motion.div key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-dark overflow-hidden">

              {/* Main row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-white text-sm">
                      #{log.orderShortId || log.orderId?.slice(0,8).toUpperCase()}
                    </span>
                    <span className="text-krunch-gray font-body text-xs">—</span>
                    <span className="text-krunch-gray font-body text-sm">{log.customer}</span>
                    {diffAmount(log) && (
                      <span className="ml-1">{diffAmount(log)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                      ✏️ {log.editedBy}
                    </span>
                    <span className="text-krunch-gray font-body text-xs">{formatTime(log.editedAt)}</span>
                  </div>
                </div>

                {/* Total change */}
                <div className="text-right flex-shrink-0">
                  <p className="text-krunch-gray font-body text-xs">Before</p>
                  <p className="text-white font-body font-semibold text-sm">Rs.{(log.oldTotal||0).toLocaleString()}</p>
                  <p className="text-krunch-gray font-body text-xs mt-1">After</p>
                  <p className="text-krunch-red font-heading font-black text-sm">Rs.{(log.newTotal||0).toLocaleString()}</p>
                </div>

                {/* Expand + Delete */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all">
                    {expanded === log.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button onClick={() => handleDelete(log.id)}
                    className="w-7 h-7 rounded-lg bg-red-900/20 border border-red-700/30 flex items-center justify-center text-red-400 hover:bg-red-700/30 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === log.id && (
                <div className="border-t border-krunch-border px-5 py-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Before Edit</p>
                    {(log.oldItems || []).map((it, j) => (
                      <div key={j} className="flex justify-between py-1 border-b border-krunch-border/50 last:border-0">
                        <span className="text-krunch-gray font-body text-xs">{it.name} x{it.quantity||1}</span>
                        <span className="text-krunch-gray font-body text-xs">Rs.{(it.price*(it.quantity||1)).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2">
                      <span className="text-krunch-gray font-body text-xs font-bold">Total</span>
                      <span className="text-white font-body text-xs font-bold">Rs.{(log.oldTotal||0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">After Edit</p>
                    {(log.newItems || []).map((it, j) => (
                      <div key={j} className="flex justify-between py-1 border-b border-krunch-border/50 last:border-0">
                        <span className="text-white font-body text-xs">{it.name} x{it.quantity||1}</span>
                        <span className="text-krunch-red font-body text-xs">Rs.{(it.price*(it.quantity||1)).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2">
                      <span className="text-krunch-gray font-body text-xs font-bold">Total</span>
                      <span className="text-krunch-red font-body text-xs font-bold">Rs.{(log.newTotal||0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEditLogs;
