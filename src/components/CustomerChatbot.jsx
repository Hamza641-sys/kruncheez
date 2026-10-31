import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader, Minimize2 } from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { askGroq, getRestaurantContext } from '../firebase/groqService';

const QUICK_QUESTIONS = [
  '🍔 What\'s on the menu?',
  '🚚 How long does delivery take?',
  '💰 Show me today\'s deals',
  '📍 Where are you located?',
  '✨ What is the Custom Deal?',
  '🎁 How does the Loyalty Card work?',
];

const CustomerChatbot = () => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [unread, setUnread]     = useState(1);
  const messagesEndRef          = useRef(null);
  const inputRef                = useRef(null);

  // Load menu for context
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'menu'), where('available', '==', true), limit(50)));
        setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* use default context */ }
    };
    loadMenu();

    // Welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! 👋 I\'m KrunchBot - The KrunchEez official AI assistant!\n\nHow can I help you today? Ask me anything about our menu, deals, delivery or anything else! 🍔',
      time: new Date(),
    }]);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: userText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const systemPrompt = getRestaurantContext(menuItems);
      const response = await askGroq([...history, { role: 'user', content: userText }], systemPrompt);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        time: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there seems to be a connection issue. Please try again or call us directly! 📞',
        time: new Date(),
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* ── CHAT WINDOW ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 w-[340px] sm:w-[380px] flex flex-col"
            style={{ height: '520px' }}
          >
            <div className="flex flex-col h-full bg-krunch-dark border border-krunch-border rounded-2xl overflow-hidden shadow-2xl">

              {/* Header */}
              <div className="bg-gradient-to-r from-krunch-red to-red-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-black text-white text-sm uppercase">KrunchBot</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-red-200 text-xs font-body">Online - Always here to help</span>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === 'user' ? 'bg-krunch-red' : 'bg-krunch-card border border-krunch-border'
                    }`}>
                      {msg.role === 'user'
                        ? <User size={13} className="text-white" />
                        : <Bot size={13} className="text-krunch-red" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-3 py-2 rounded-2xl font-body text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-krunch-red text-white rounded-tr-sm'
                          : msg.error
                            ? 'bg-red-900/30 text-red-300 border border-red-800/30 rounded-tl-sm'
                            : 'bg-krunch-card border border-krunch-border text-white rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-krunch-gray text-[10px] px-1">{formatTime(msg.time)}</span>
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center flex-shrink-0">
                      <Bot size={13} className="text-krunch-red" />
                    </div>
                    <div className="bg-krunch-card border border-krunch-border px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-krunch-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-krunch-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-krunch-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2 flex-shrink-0">
                  <p className="text-krunch-gray text-[10px] font-body uppercase tracking-wider mb-2 px-1">Quick questions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => sendMessage(q)}
                        className="text-xs font-body bg-krunch-card border border-krunch-border hover:border-krunch-red/50 hover:text-white text-krunch-gray px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-krunch-border flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask me anything..."
                    disabled={loading}
                    className="flex-1 bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-krunch-red hover:bg-krunch-darkred disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  >
                    {loading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
                <p className="text-krunch-gray text-[10px] text-center mt-1.5 font-body">
                  Powered by KrunchBot AI 🤖
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING BUTTON ── */}
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 bg-krunch-red hover:bg-krunch-darkred text-white rounded-full shadow-red-glow flex items-center justify-center transition-all"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-[10px] font-bold">{unread}</span>
          </motion.div>
        )}
      </motion.button>
    </>
  );
};

export default CustomerChatbot;
