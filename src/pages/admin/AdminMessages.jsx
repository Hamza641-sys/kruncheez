import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MessageSquare, Phone, Mail, Trash2, CheckCheck, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const timeAgo = (ts) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected]  = useState(null);
  const [filter, setFilter]      = useState('all'); // all | unread | read
  const [loading, setLoading]    = useState(true);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Mark as read
  const markRead = async (msg) => {
    if (msg.read) return;
    try {
      await updateDoc(doc(db, 'contactMessages', msg.id), { read: true });
    } catch {}
  };

  // Mark all read
  const markAllRead = async () => {
    const unread = messages.filter(m => !m.read);
    for (const m of unread) {
      try { await updateDoc(doc(db, 'contactMessages', m.id), { read: true }); } catch {}
    }
    toast.success('All messages marked as read', toastStyle);
  };

  // Delete message
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'contactMessages', id));
      if (selected?.id === id) setSelected(null);
      toast.success('Message deleted', toastStyle);
    } catch {
      toast.error('Failed to delete', toastStyle);
    }
  };

  // WhatsApp reply
  const replyWhatsApp = (msg) => {
    const text = `Assalam o Alaikum ${msg.name}!\n\nThank you for contacting The KrunchEez.\n\nRe: ${msg.subject}\n\nWe have received your message and will get back to you shortly.\n\nTeam THE KRUNCHEEZ\n📞 0317-7787648`;
    window.open(`https://wa.me/92${msg.phone?.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Open message + mark read
  const openMessage = (msg) => {
    setSelected(msg);
    markRead(msg);
  };

  const filtered = messages.filter(m => {
    if (filter === 'unread') return !m.read;
    if (filter === 'read')   return m.read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Contact Messages</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">
            {messages.length} total · {unreadCount > 0 ? <span className="text-krunch-red font-semibold">{unreadCount} unread</span> : 'all read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <CheckCheck size={15} /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { key: 'all',    label: `All (${messages.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read',   label: `Read (${messages.length - unreadCount})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              filter === f.key
                ? 'bg-krunch-red text-white'
                : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-dark p-16 text-center">
          <MessageSquare size={40} className="text-krunch-gray/30 mx-auto mb-3" />
          <p className="text-krunch-gray font-body">No messages yet</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Messages List */}
          <div className="flex flex-col gap-2">
            {filtered.map(msg => (
              <motion.button
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openMessage(msg)}
                className={`w-full text-left card-dark p-4 transition-all hover:border-krunch-red/40 ${
                  selected?.id === msg.id ? 'border-krunch-red/60 bg-krunch-red/5' : ''
                } ${!msg.read ? 'border-l-2 border-l-krunch-red' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-black text-sm flex-shrink-0 ${
                      !msg.read ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray'
                    }`}>
                      {msg.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-body font-semibold text-sm truncate ${!msg.read ? 'text-white' : 'text-krunch-gray'}`}>
                          {msg.name}
                        </p>
                        {!msg.read && (
                          <span className="w-2 h-2 rounded-full bg-krunch-red flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-krunch-gray font-body text-xs truncate">{msg.subject}</p>
                      <p className="text-krunch-gray font-body text-xs truncate mt-0.5">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-krunch-gray font-body text-[10px]">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Message Detail */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="card-dark p-6 sticky top-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-base">
                        {selected.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-body font-semibold">{selected.name}</p>
                        <p className="text-krunch-gray font-body text-xs">{timeAgo(selected.createdAt)}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-krunch-gray font-body text-sm">
                      <Phone size={13} className="text-krunch-red flex-shrink-0" />
                      <span>{selected.phone || '—'}</span>
                    </div>
                    {selected.email && (
                      <div className="flex items-center gap-2 text-krunch-gray font-body text-sm">
                        <Mail size={13} className="text-krunch-red flex-shrink-0" />
                        <span>{selected.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="bg-krunch-black border border-krunch-border rounded-xl px-4 py-2.5 mb-4">
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-white font-body font-semibold text-sm">{selected.subject}</p>
                  </div>

                  {/* Message */}
                  <div className="bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 mb-5">
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Message</p>
                    <p className="text-white font-body text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => replyWhatsApp(selected)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-heading font-bold py-2.5 rounded-xl transition-all text-sm"
                    >
                      <ExternalLink size={14} /> Reply on WhatsApp
                    </button>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-700/30 flex items-center justify-center text-red-400 hover:bg-red-700/30 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-dark p-16 text-center"
                >
                  <MessageSquare size={36} className="text-krunch-gray/30 mx-auto mb-3" />
                  <p className="text-krunch-gray font-body text-sm">Select a message to view</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mobile Detail Modal */}
      <AnimatePresence>
        {selected && (
          <div className="lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-4 bottom-4 top-20 bg-krunch-dark border border-krunch-border rounded-2xl z-50 overflow-y-auto"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-base">
                      {selected.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-body font-semibold">{selected.name}</p>
                      <p className="text-krunch-gray font-body text-xs">{timeAgo(selected.createdAt)}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-krunch-gray font-body text-sm">
                    <Phone size={13} className="text-krunch-red" /> {selected.phone || '—'}
                  </div>
                </div>
                <div className="bg-krunch-black border border-krunch-border rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-white font-body font-semibold text-sm">{selected.subject}</p>
                </div>
                <div className="bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 mb-5">
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Message</p>
                  <p className="text-white font-body text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => replyWhatsApp(selected)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-heading font-bold py-3 rounded-xl transition-all text-sm">
                    <ExternalLink size={14} /> Reply on WhatsApp
                  </button>
                  <button onClick={() => handleDelete(selected.id)}
                    className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-700/30 flex items-center justify-center text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMessages;

