import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Plus, ToggleLeft, ToggleRight,
  Users, Gift, Printer
} from 'lucide-react';
import { getAllCards, toggleCard } from '../../firebase/cardService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const AdminCards = () => {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ name: '', phone: '', cardId: '' });
  const [issuing, setIssuing]     = useState(false);

  // Auto-generate card ID
  const generateCardId = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `KC-${num}`;
  };

  const openIssue = () => {
    setIssueForm({ name: '', phone: '', cardId: generateCardId() });
    setShowIssue(true);
  };

  const fetchCards = async () => {
    setLoading(true);
    const data = await getAllCards();
    setCards(data);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const filtered = cards.filter(c =>
    !search ||
    c.cardId?.toLowerCase().includes(search.toLowerCase()) ||
    c.userName?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleToggle = async (card) => {
    await toggleCard(card.id, !card.active);
    toast.success(`Card ${card.active ? 'deactivated' : 'activated'}!`, toastStyle);
    await fetchCards();
  };

  // ── PRINT CARD (ID only — no name/phone) ──────────────────────────────────
  const printCard = async (card) => {
    await printCards([card]);
  };

  // ── PRINT MULTIPLE CARDS ────────────────────────────────────────────────────
  const printCards = async (cardList) => {
    const cardsHtml = cardList.map(card => `
      <div class="card">
        <div class="header">
          <div class="brand">THE KRUNCHEEZ</div>
          <div class="tagline">Fast Food • Chinese • BBQ</div>
        </div>
        <div class="body">
          <div class="lc-text">LOYALTY CARD</div>
          <div class="card-id">${card.cardId}</div>
          <div class="offer">10% OFF on Custom Deal</div>
        </div>
        <div class="footer">
          <div class="footer-text">Enter this ID at checkout to get your discount</div>
          <div class="footer-url">kruncheez-pos.web.app</div>
        </div>
      </div>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KrunchEez Loyalty Cards</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { background:#f0f0f0; font-family: Arial, sans-serif; padding: 10px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .card {
            width: 100%;
            aspect-ratio: 1.586;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #333;
            page-break-inside: avoid;
          }
          .header {
            background: #E31E24;
            padding: 6px 10px;
            text-align: center;
          }
          .brand { color: white; font-size: 11px; font-weight: 900; letter-spacing: 2px; }
          .tagline { color: rgba(255,255,255,0.75); font-size: 6px; letter-spacing: 1px; margin-top: 1px; }
          .body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 6px;
            gap: 4px;
          }
          .lc-text { color: rgba(255,255,255,0.5); font-size: 7px; letter-spacing: 3px; text-transform: uppercase; }
          .card-id { color: #E31E24; font-size: 16px; font-weight: 900; letter-spacing: 3px; }
          .offer { color: rgba(255,255,255,0.7); font-size: 7px; letter-spacing: 1px; background: rgba(227,30,36,0.15); border: 1px solid rgba(227,30,36,0.3); border-radius: 3px; padding: 2px 6px; }
          .footer {
            background: rgba(0,0,0,0.4);
            padding: 4px 8px;
            text-align: center;
          }
          .footer-text { color: rgba(255,255,255,0.35); font-size: 6px; }
          .footer-url { color: rgba(227,30,36,0.6); font-size: 6px; margin-top: 1px; }
          @media print {
            body { background: white; padding: 5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .grid { gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="grid">${cardsHtml}</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // ── BULK GENERATE CARDS ──────────────────────────────────────────────────
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleBulkGenerate = async () => {
    if (bulkCount < 1 || bulkCount > 1000) {
      toast.error('Enter between 1 and 1000', toastStyle); return;
    }
    setBulkLoading(true);
    try {
      const batch = [];
      for (let i = 0; i < bulkCount; i++) {
        const cardId = generateCardId();
        batch.push(addDoc(collection(db, 'loyaltyCards'), {
          cardId,
          userId: null, userName: '', phone: '',
          visits: 0, points: 0, totalVisits: 0, totalSaved: 0,
          discountPercent: 10, visitsForDiscount: 10,
          active: true, tier: 'Bronze',
          createdAt: serverTimestamp(),
          issuedByAdmin: true,
        }));
      }
      await Promise.all(batch);
      toast.success(`${bulkCount} cards generated!`, toastStyle);
      await fetchCards();
    } catch { toast.error('Failed', toastStyle); }
    finally { setBulkLoading(false); }
  };

  // ── ISSUE CARD ──────────────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (!issueForm.cardId) { toast.error('Card ID is required', toastStyle); return; }
    const cardId = issueForm.cardId.toUpperCase().startsWith('KC-')
      ? issueForm.cardId.toUpperCase()
      : `KC-${issueForm.cardId.toUpperCase()}`;
    setIssuing(true);
    try {
      await addDoc(collection(db, 'loyaltyCards'), {
        cardId,
        userId: null,
        userName: issueForm.name,
        phone: issueForm.phone,
        visits: 0, points: 0, totalVisits: 0, totalSaved: 0,
        discountPercent: 10, visitsForDiscount: 10,
        active: true, tier: 'Bronze',
        createdAt: serverTimestamp(),
        issuedByAdmin: true,
      });
      toast.success(`Card ${cardId} issued for ${issueForm.name}!`, toastStyle);
      await fetchCards();
      setShowIssue(false);
    } catch { toast.error('Failed to issue card', toastStyle); }
    finally { setIssuing(false); }
  };

  const totalCards  = cards.length;
  const activeCards = cards.filter(c => c.active).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Loyalty Cards</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{totalCards} cards — 10% off on Custom Deal</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk Generate */}
          <div className="flex items-center gap-2 bg-krunch-card border border-krunch-border rounded-xl px-3 py-2">
            <input
              type="number" min={1} max={1000} value={bulkCount}
              onChange={e => setBulkCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              className="w-16 bg-transparent text-white font-body text-sm text-center focus:outline-none"
              placeholder="100"
            />
            <span className="text-krunch-gray text-xs">cards</span>
            <button onClick={handleBulkGenerate} disabled={bulkLoading}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 whitespace-nowrap">
              {bulkLoading ? '...' : '⚡ Generate'}
            </button>
          </div>
          {/* Print All */}
          {cards.length > 0 && (
            <button onClick={() => printCards(cards)}
              className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
              <Printer size={15} /> Print All ({cards.length})
            </button>
          )}
          <button onClick={openIssue} className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Issue Card
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Cards',  value: totalCards,  icon: <Gift size={18} className="text-krunch-red" />,  bg: 'bg-krunch-red/10' },
          { label: 'Active Cards', value: activeCards, icon: <Users size={18} className="text-green-400" />, bg: 'bg-green-400/10' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="font-heading font-black text-xl text-white">{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <p className="text-amber-400 font-body text-sm font-semibold">
          🃏 How it works: Issue card → Print → Give to customer → Customer enters Card ID at checkout with Custom Deal → <span className="text-white">10% discount auto applied!</span>
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search by card ID, name, phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Card ID', 'Customer', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No cards found</td></tr>
              ) : filtered.map((card, i) => (
                <motion.tr key={card.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-heading font-black text-krunch-red text-sm tracking-widest">{card.cardId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-body font-semibold text-sm">{card.userName || '-'}</p>
                    <p className="text-krunch-gray font-body text-xs">{card.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(card)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                        card.active
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                      }`}>
                      {card.active ? <><ToggleRight size={12} /> Active</> : <><ToggleLeft size={12} /> Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => printCard(card)}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-krunch-red hover:bg-krunch-darkred text-white font-bold whitespace-nowrap transition-all">
                      <Printer size={10} /> Print Card
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Card Modal */}
      <AnimatePresence>
        {showIssue && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowIssue(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <h3 className="font-heading font-bold text-white uppercase">Issue Loyalty Card</h3>
                <button onClick={() => setShowIssue(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Customer Name <span className="text-krunch-gray/50 normal-case">(optional)</span></label>
                  <input type="text" value={issueForm.name}
                    onChange={e => setIssueForm({ ...issueForm, name: e.target.value })}
                    placeholder="Leave blank for anonymous card"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone Number <span className="text-krunch-gray/50 normal-case">(optional)</span></label>
                  <input type="text" value={issueForm.phone}
                    onChange={e => setIssueForm({ ...issueForm, phone: e.target.value })}
                    placeholder="Leave blank for anonymous card"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>

                {/* Auto Card ID */}
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">
                    Card ID <span className="text-green-400 text-[10px] normal-case">(auto-generated)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-krunch-black border border-green-700/30 rounded-xl px-4 py-3 text-green-400 font-heading font-black text-lg tracking-widest">
                      {issueForm.cardId}
                    </div>
                    <button type="button"
                      onClick={() => setIssueForm({ ...issueForm, cardId: generateCardId() })}
                      className="px-3 py-2 bg-krunch-card border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white rounded-xl transition-all text-xs font-bold">
                      🔄 New
                    </button>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <p className="text-amber-400 font-body text-xs">
                    🃏 This card gives <strong>10% discount</strong> on Custom Deal orders. Customer enters their Card ID at checkout.
                  </p>
                </div>

                <button onClick={handleIssue} disabled={issuing}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {issuing
                    ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <><Gift size={16} /> Issue Card</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCards;
