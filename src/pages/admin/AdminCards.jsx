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

  // ── PRINT CARD ──────────────────────────────────────────────────────────────
  const printCard = async (card) => {
    const pizzaUrl = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=90&auto=format&fit=crop';
    const followUrl = 'https://kruncheez-pos.web.app/follow';
    let qrDataUrl = '';
    try {
      const QRCode = (await import('qrcode')).default;
      qrDataUrl = await QRCode.toDataURL(followUrl, {
        width: 100, margin: 1,
        color: { dark: '#000000', light: '#E31E24' },
        errorCorrectionLevel: 'H',
      });
    } catch { qrDataUrl = ''; }

    const nm = (card.userName || 'Customer').toUpperCase();
    const css = `*{margin:0;padding:0;box-sizing:border-box;}@page{size:A4 portrait;margin:8mm;}body{background:#cdc5ba;font-family:Inter,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;gap:18px;}.lbl{font-size:10px;font-weight:700;color:#666;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;align-self:flex-start;width:100%;max-width:640px;}.card{width:100%;max-width:640px;border-radius:20px;overflow:hidden;position:relative;background:#111;box-shadow:0 20px 60px rgba(0,0,0,0.5);}.dots{position:absolute;inset:0;z-index:1;background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);background-size:20px 20px;}.front{height:340px;}.f-pizza{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:2;border-radius:20px;opacity:0.22;}.yc1{position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:#E31E24;border-radius:50%;z-index:3;}.yc2{position:absolute;bottom:-60px;left:-60px;width:170px;height:170px;background:#E31E24;border-radius:50%;z-index:3;opacity:0.5;}.badge{position:absolute;top:18px;right:18px;width:112px;height:112px;background:#E31E24;border-radius:50%;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.5);box-shadow:0 6px 20px rgba(245,166,35,0.5);}.b-get{font-size:10px;font-weight:900;color:white;letter-spacing:2px;line-height:1;}.b-pct{font-family:Arial;font-size:36px;font-weight:900;color:white;line-height:1;}.b-off{font-family:Arial;font-size:14px;font-weight:900;color:white;}.b-sub{font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center;line-height:1.4;margin-top:3px;}.f-cnt{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:10px;}.f-brand{font-family:Arial;font-size:46px;font-weight:900;color:#E31E24;line-height:1;letter-spacing:3px;text-transform:uppercase;text-shadow:0 3px 12px rgba(0,0,0,0.6);}.f-tag{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:4px;}.f-lc{font-family:Arial;font-size:30px;font-weight:900;color:white;letter-spacing:7px;margin-top:8px;}.f-eat{display:flex;align-items:center;gap:12px;margin-top:7px;}.f-eat span{font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:3px;}.f-dot{width:5px;height:5px;background:#E31E24;border-radius:50%;}.f-strip{position:absolute;bottom:0;left:0;right:0;z-index:6;padding:12px 24px;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%);display:flex;justify-content:space-between;align-items:flex-end;}.f-name{font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:3px;text-transform:uppercase;}.f-id{font-size:11px;color:rgba(245,166,35,0.6);letter-spacing:3px;}.back{height:340px;}.yc3{position:absolute;top:-30px;right:-30px;width:140px;height:140px;background:#E31E24;border-radius:50%;z-index:2;opacity:0.85;}.yc4{position:absolute;bottom:-35px;left:-35px;width:120px;height:120px;background:#E31E24;border-radius:50%;z-index:2;opacity:0.6;}.b-inner{position:relative;z-index:4;display:flex;height:100%;padding:18px 20px 55px;gap:20px;}.b-left{flex:1;display:flex;flex-direction:column;}.bl-brand{font-family:Arial;font-size:26px;font-weight:900;color:#E31E24;line-height:1.1;letter-spacing:2px;text-transform:uppercase;}.bl-tag{font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin-bottom:14px;}.ty{margin-top:auto;padding-top:10px;}.ty1{font-size:10px;color:rgba(255,255,255,0.3);font-style:italic;}.ty2{font-family:Arial;font-size:18px;font-weight:900;color:#E31E24;line-height:1.3;letter-spacing:1px;}.ty3{font-size:10px;color:rgba(255,255,255,0.25);}.b-right{width:220px;display:flex;flex-direction:column;gap:12px;}.ob{background:#E31E24;border-radius:6px;padding:10px 14px;}.obr{display:flex;align-items:baseline;gap:3px;}.obp{font-size:38px;font-weight:900;color:white;line-height:1;}.obo{font-size:18px;font-weight:900;color:white;}.obt{font-size:11px;font-weight:900;color:white;letter-spacing:1px;margin-top:2px;}.obs{font-size:8px;color:rgba(255,255,255,0.8);font-weight:700;margin-top:3px;}.tt{font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:5px;}.tl{list-style:none;}.tl li{font-size:9px;color:rgba(255,255,255,0.28);padding:2px 0;display:flex;gap:5px;}.tl li::before{content:"*";color:#E31E24;}.bs{position:absolute;bottom:0;left:0;right:0;z-index:5;padding:8px 20px;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.6) 70%,transparent 100%);display:flex;justify-content:space-between;align-items:center;}.bsn{font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:2px;}.bsi{font-size:11px;color:rgba(245,166,35,0.45);letter-spacing:2px;}.qr-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;}.qr-box{background:#E31E24;border-radius:5px;padding:3px;}.qr-box img{display:block;width:48px;height:48px;border-radius:2px;}.qr-lbl{font-size:7px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-align:center;}@media print{body{background:#cdc5ba;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;gap:14px;}.card{page-break-inside:avoid;}}`;

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>KrunchEez Loyalty Card</title><style>${css}</style></head><body>`);
    win.document.write(`<div class="lbl">Front Side</div><div class="card front"><div class="dots"></div><div class="yc1"></div><div class="yc2"></div><img class="f-pizza" src="${pizzaUrl}" onerror="this.style.display='none'"/><div class="badge"><div class="b-get">GET</div><div class="b-pct">10%</div><div class="b-off">OFF</div><div class="b-sub">ON CUSTOM<br/>DEAL</div></div><div class="f-cnt"><div class="f-brand">KRUNCHEEZ</div><div class="f-tag">Crunch in Every Bite</div><div class="f-lc">LOYALTY <span style="color:#E31E24">CARD</span></div><div class="f-eat"><span>EAT</span><div class="f-dot"></div><span>EARN</span><div class="f-dot"></div><span>ENJOY</span></div></div><div class="f-strip"><div class="f-name">${nm}</div><div class="f-id">${card.cardId}</div></div></div>`);
    win.document.write(`<div class="lbl">Back Side</div><div class="card back"><div class="dots"></div><div class="yc3"></div><div class="yc4"></div><div class="b-inner"><div class="b-left"><div class="bl-brand">KRUNCHEEZ</div><div class="bl-tag">Crunch in Every Bite</div><div class="ty"><div class="ty1">Thank You</div><div class="ty2">for being a part of</div><div class="ty3">The Kruncheez Family!</div></div></div><div class="b-right"><div class="ob"><div class="obr"><div class="obp">10%</div><div class="obo">OFF</div></div><div class="obt">ON CUSTOM DEAL</div><div class="obs">Show this card at checkout</div></div><div><div class="tt">Terms & Conditions:</div><ul class="tl"><li>Valid on Custom Deal orders only</li><li>One card per customer</li><li>Not valid with other offers</li><li>Keep this card safe</li></ul></div></div></div><div class="bs"><div><div class="bsn">${nm}</div><div class="bsi">${card.cardId}${card.phone ? ' - ' + card.phone : ''}</div></div>${qrDataUrl ? `<div class="qr-wrap"><div class="qr-box"><img src="${qrDataUrl}" width="48" height="48"/></div><div class="qr-lbl">SCAN & FOLLOW</div></div>` : ''}</div></div>`);
    win.document.write('<script>(function(){var imgs=document.querySelectorAll("img"),done=0,n=imgs.length;function go(){if(++done>=n)setTimeout(function(){window.print();window.close();},800);}if(!n){setTimeout(function(){window.print();window.close();},1000);return;}imgs.forEach(function(img){if(img.complete&&img.naturalHeight)go();else{img.onload=go;img.onerror=go;}});setTimeout(function(){window.print();window.close();},6000);})();<\/script></body></html>');
    win.document.close();
  };

  // ── ISSUE CARD ──────────────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (!issueForm.name || !issueForm.cardId) { toast.error('Customer name is required', toastStyle); return; }
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
          <p className="text-krunch-gray font-body text-sm mt-1">{totalCards} cards issued — 10% off on Custom Deal</p>
        </div>
        <button onClick={openIssue} className="flex items-center gap-2 btn-primary text-sm">
          <Plus size={16} /> Issue Card
        </button>
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
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Customer Name *</label>
                  <input type="text" value={issueForm.name}
                    onChange={e => setIssueForm({ ...issueForm, name: e.target.value })}
                    placeholder="Muhammad Ahmed"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <input type="text" value={issueForm.phone}
                    onChange={e => setIssueForm({ ...issueForm, phone: e.target.value })}
                    placeholder="03XX-XXXXXXX"
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
