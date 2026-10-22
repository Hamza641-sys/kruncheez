import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader, Sparkles, X, ChevronDown, TrendingUp, Users, DollarSign, ShoppingBag } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { askGroq, getAdminContext } from '../../firebase/groqService';

const QUICK_PROMPTS = [
  { icon: '📊', text: 'Aaj ki sale report do' },
  { icon: '🍔', text: 'Sabse zyada bikne wala item?' },
  { icon: '💰', text: 'Is month ka profit kitna hai?' },
  { icon: '👥', text: 'Staff salary status batao' },
  { icon: '📦', text: 'Pending orders kitne hain?' },
  { icon: '💡', text: 'Sale badhane ke suggestions do' },
  { icon: '🚚', text: 'Supplier payments status' },
  { icon: '⚠️', text: 'Koi issue ya warning hai?' },
];

const AdminAIAssistant = () => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [bizData, setBizData]   = useState({});
  const messagesEndRef          = useRef(null);
  const inputRef                = useRef(null);

  // Load all business data
  const loadBizData = async () => {
    setDataLoading(true);
    try {
      const [ordersSnap, expSnap, salSnap, staffSnap, suppSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'salaryRecords')),
        getDocs(collection(db, 'staff')),
        getDocs(collection(db, 'supplierPayments')),
      ]);
      setBizData({
        orders:    ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        expenses:  expSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        salaries:  salSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        staff:     staffSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        suppliers: suppSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      });
    } catch { /* use empty data */ }
    setDataLoading(false);
  };

  useEffect(() => {
    loadBizData();
    setMessages([{
      role: 'assistant',
      content: `Salam! 👋 Main aapka **KrunchAdmin AI** hun!\n\nMujhe business ke bare mein kuch bhi poochein:\n• Sale reports\n• Profit analysis\n• Staff status\n• Supplier payments\n• Business suggestions\n\nKya jaanna chahte hain? 📊`,
      time: new Date(),
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Quick stats
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = (bizData.orders || []).filter(o => {
    const d = o.createdAt?.toDate?.()?.toISOString?.() || o.createdAt || '';
    return d.startsWith(today);
  });
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);
  const pendingCount = (bizData.orders || []).filter(o => o.status === 'pending').length;
  const totalRevenue = (bizData.orders || [])
    .filter(o => o.status !== 'rejected')
    .reduce((s, o) => s + (o.pricing?.total || 0), 0);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, time: new Date() }]);
    setLoading(true);

    try {
      const systemPrompt = getAdminContext(bizData);
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const response = await askGroq([...history, { role: 'user', content: userText }], systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ AI se connect nahi ho saka. Internet check karein ya dobara try karein.',
        time: new Date(),
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '';

  // Format markdown-like bold
  const formatContent = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
    );
  };

  return (
    <div className="mb-6">
      {/* ── TOGGLE BUTTON ── */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 ${
          open
            ? 'bg-krunch-red border-krunch-red text-white'
            : 'bg-krunch-card border-krunch-border hover:border-krunch-red/50 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${open ? 'bg-white/20' : 'bg-krunch-red/10 border border-krunch-red/20'}`}>
            <Sparkles size={18} className={open ? 'text-white' : 'text-krunch-red'} />
          </div>
          <div className="text-left">
            <p className="font-heading font-black text-sm uppercase tracking-wide">KrunchAdmin AI</p>
            <p className={`font-body text-xs ${open ? 'text-red-200' : 'text-krunch-gray'}`}>
              {dataLoading ? 'Data load ho raha hai...' : `Business data ready — ${(bizData.orders||[]).length} orders, ${(bizData.staff||[]).length} staff`}
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className={open ? 'text-white' : 'text-krunch-gray'} />
        </motion.div>
      </button>

      {/* ── AI PANEL ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-krunch-card border border-krunch-border rounded-2xl overflow-hidden">

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-4 gap-px bg-krunch-border">
                {[
                  { label: "Aaj Orders", value: todayOrders.length, icon: <ShoppingBag size={13}/>, color: 'text-white' },
                  { label: "Aaj Revenue", value: `Rs.${todayRevenue.toLocaleString()}`, icon: <DollarSign size={13}/>, color: 'text-green-400' },
                  { label: "Pending", value: pendingCount, icon: <TrendingUp size={13}/>, color: 'text-amber-400' },
                  { label: "Total Revenue", value: `Rs.${(totalRevenue/1000).toFixed(0)}K`, icon: <TrendingUp size={13}/>, color: 'text-krunch-red' },
                ].map((s, i) => (
                  <div key={i} className="bg-krunch-dark px-3 py-2.5 text-center">
                    <div className={`flex items-center justify-center gap-1 ${s.color} mb-0.5`}>{s.icon}</div>
                    <p className={`font-heading font-black text-sm ${s.color}`}>{s.value}</p>
                    <p className="text-krunch-gray font-body text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Messages */}
              <div className="h-72 overflow-y-auto p-4 space-y-3 bg-krunch-black" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === 'user' ? 'bg-krunch-red' : 'bg-krunch-card border border-krunch-border'
                    }`}>
                      {msg.role === 'user'
                        ? <span className="text-white text-xs font-bold">A</span>
                        : <Bot size={13} className="text-krunch-red" />}
                    </div>
                    <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl font-body text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-krunch-red text-white rounded-tr-sm'
                          : msg.error
                            ? 'bg-red-900/20 text-red-300 border border-red-800/30 rounded-tl-sm'
                            : 'bg-krunch-card border border-krunch-border text-krunch-gray rounded-tl-sm'
                      }`}>
                        {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
                      </div>
                      <span className="text-krunch-gray/50 text-[10px] px-1">{formatTime(msg.time)}</span>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center">
                      <Bot size={13} className="text-krunch-red" />
                    </div>
                    <div className="bg-krunch-card border border-krunch-border px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-1.5 h-1.5 bg-krunch-red rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2.5 border-t border-krunch-border bg-krunch-dark">
                <p className="text-krunch-gray text-[10px] font-body uppercase tracking-wider mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q.text)}
                      disabled={loading}
                      className="text-[11px] font-body bg-krunch-black border border-krunch-border hover:border-krunch-red/50 hover:text-white text-krunch-gray px-2.5 py-1.5 rounded-full transition-all disabled:opacity-40 whitespace-nowrap">
                      {q.icon} {q.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-krunch-border bg-krunch-dark">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Kuch bhi poochein — sale, profit, staff..."
                    disabled={loading}
                    className="flex-1 bg-krunch-black border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors disabled:opacity-50"
                  />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-krunch-red hover:bg-krunch-darkred disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                    {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAIAssistant;
