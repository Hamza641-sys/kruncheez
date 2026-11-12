import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ToggleLeft, ToggleRight, Gift, Download, Eye, X, Trash2, Users } from 'lucide-react';
import {
  getAllCards, toggleCard, deleteCard, deleteAllCards,
  generateCardIds, getNextCardNumber, updateCardCustomer, formatCardId
} from '../../firebase/cardService';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

// ── Single blank card design (no ID on card) ──────────────────────
const PIZZA_URL = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=90&auto=format&fit=crop';

const AdminCards = () => {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [genCount, setGenCount]   = useState(100);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [deleting, setDeleting]   = useState(false);
  const [nextNum, setNextNum]     = useState(1);
  const [editModal, setEditModal] = useState(null); // card being edited
  const [editName, setEditName]   = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [viewDesign, setViewDesign] = useState(false); // show blank card design

  const fetchCards = async () => {
    setLoading(true);
    const data = await getAllCards();
    setCards(data);
    const n = await getNextCardNumber();
    setNextNum(n);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const filtered = cards.filter(c =>
    !search ||
    c.cardId?.toLowerCase().includes(search.toLowerCase()) ||
    c.userName?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // ── Generate IDs ──────────────────────────────────────────────
  const handleGenerate = async () => {
    if (genCount < 1 || genCount > 5000) { toast.error('Enter 1–5000', toastStyle); return; }
    setGenerating(true);
    setGenProgress(0);
    try {
      const start = await getNextCardNumber();
      await generateCardIds(start, genCount, (done) => setGenProgress(done));
      toast.success(`✅ ${genCount} IDs generated! (${formatCardId(start)} – ${formatCardId(start + genCount - 1)})`, toastStyle);
      await fetchCards();
    } catch(e) { toast.error('Failed: ' + e.message, toastStyle); }
    finally { setGenerating(false); setGenProgress(0); }
  };

  // ── Delete all ────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL ${cards.length} cards? Cannot be undone!`)) return;
    setDeleting(true);
    try {
      await deleteAllCards();
      toast.success('All cards deleted!', toastStyle);
      await fetchCards();
    } catch(e) { toast.error('Failed: ' + e.message, toastStyle); }
    finally { setDeleting(false); }
  };

  // ── Toggle active ─────────────────────────────────────────────
  const handleToggle = async (card) => {
    await toggleCard(card.id, !card.active);
    toast.success(`Card ${card.active ? 'deactivated' : 'activated'}!`, toastStyle);
    await fetchCards();
  };

  // ── Delete single ─────────────────────────────────────────────
  const handleDelete = async (card) => {
    if (!confirm(`Delete ${card.cardId}?`)) return;
    await deleteCard(card.id);
    toast.success('Deleted', toastStyle);
    await fetchCards();
  };

  // ── Save customer info ─────────────────────────────────────────
  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      await updateCardCustomer(editModal.id, editName, editPhone);
      toast.success('Customer info saved! ✅', toastStyle);
      setEditModal(null);
      await fetchCards();
    } catch(e) { toast.error('Failed: ' + e.message, toastStyle); }
    finally { setEditSaving(false); }
  };

  // ── Download blank card PNG ────────────────────────────────────
  const downloadBlankCard = async () => {
    toast.loading('Generating card image...', { id: 'dl', ...toastStyle });
    try {
      const html2canvas = (await import('html2canvas')).default;
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL('https://kruncheez-pos.web.app/follow', {
        width: 160, margin: 1, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'H',
      });
      const CARD_W = 720; const CARD_H = 340;
      const container = document.createElement('div');
      container.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;background:#cdc5ba;padding:20px;display:flex;flex-direction:column;gap:16px;font-family:Arial,sans-serif;`;
      container.innerHTML = `
        <div style="font-size:10px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;">FRONT</div>
        <div style="width:${CARD_W}px;height:${CARD_H}px;border-radius:18px;overflow:hidden;position:relative;background:#111;flex-shrink:0;">
          <div style="position:absolute;inset:0;z-index:1;background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);background-size:20px 20px;"></div>
          <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:#E31E24;border-radius:50%;z-index:3;"></div>
          <div style="position:absolute;bottom:-60px;left:-60px;width:170px;height:170px;background:#E31E24;border-radius:50%;z-index:3;opacity:0.5;"></div>
          <img src="${PIZZA_URL}" crossorigin="anonymous" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;opacity:0.22;"/>
          <div style="position:absolute;top:18px;right:18px;width:112px;height:112px;background:#E31E24;border-radius:50%;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.5);">
            <div style="font-size:10px;font-weight:900;color:white;letter-spacing:2px;">GET</div>
            <div style="font-size:36px;font-weight:900;color:white;line-height:1;">10%</div>
            <div style="font-size:14px;font-weight:900;color:white;">OFF</div>
            <div style="font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center;line-height:1.4;margin-top:3px;">ON CUSTOMIZE<br/>DEAL</div>
          </div>
          <div style="position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:46px;font-weight:900;color:#E31E24;letter-spacing:3px;text-shadow:0 3px 12px rgba(0,0,0,0.6);">THE KRUNCHEEZ</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:4px;">In Every Bite</div>
            <div style="font-size:30px;font-weight:900;color:white;letter-spacing:7px;margin-top:8px;">LOYALTY <span style="color:#E31E24;">CARD</span></div>
            <div style="display:flex;align-items:center;gap:12px;margin-top:7px;">
              <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:3px;">FAST FOOD</span>
              <div style="width:5px;height:5px;background:#E31E24;border-radius:50%;"></div>
              <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:3px;">CHINESE</span>
              <div style="width:5px;height:5px;background:#E31E24;border-radius:50%;"></div>
              <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:3px;">BBQ</span>
            </div>
          </div>
        </div>
        <div style="font-size:10px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;">BACK</div>
        <div style="width:${CARD_W}px;height:${CARD_H}px;border-radius:18px;overflow:hidden;position:relative;background:linear-gradient(135deg,#1a0505,#2a0a0a,#1a0505);flex-shrink:0;">
          <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,#E31E24,rgba(227,30,36,0.3),transparent);border-radius:50%;z-index:2;"></div>
          <div style="position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;background:radial-gradient(circle,#E31E24,rgba(227,30,36,0.3),transparent);border-radius:50%;z-index:2;"></div>
          <div style="position:relative;z-index:4;display:flex;height:100%;padding:18px 22px 90px;gap:20px;">
            <div style="flex:1;">
              <div style="font-size:28px;font-weight:900;color:#E31E24;letter-spacing:2px;text-transform:uppercase;">THE KRUNCHEEZ</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;margin-bottom:10px;">In Every Bite</div>
            </div>
            <div style="width:210px;display:flex;flex-direction:column;gap:10px;">
              <div style="text-align:right;">
                <div style="font-size:13px;color:rgba(255,255,255,0.45);">Good Food Brings People</div>
                <div style="font-size:26px;color:white;">Together <span style="color:#E31E24;">♥</span></div>
              </div>
              <div style="background:linear-gradient(135deg,#E31E24,#c01a1f);border-radius:8px;padding:12px 16px;">
                <div style="display:flex;align-items:baseline;gap:3px;">
                  <div style="font-size:42px;font-weight:900;color:white;line-height:1;">10%</div>
                  <div style="font-size:20px;font-weight:900;color:white;">OFF</div>
                </div>
                <div style="font-size:12px;font-weight:900;color:white;letter-spacing:1px;margin-top:2px;">ON CUSTOMIZE DEAL</div>
                <div style="font-size:10px;color:rgba(255,255,255,0.85);font-weight:700;margin-top:4px;">Enter Card ID at checkout</div>
              </div>
            </div>
          </div>
          <div style="position:absolute;bottom:0;left:0;right:0;z-index:5;padding:10px 22px;background:linear-gradient(to top,rgba(0,0,0,0.95),rgba(0,0,0,0.7),transparent);display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:1px;margin-bottom:3px;">Terms &amp; Conditions:</div>
              <ul style="list-style:none;margin:0;padding:0;">
                <li style="font-size:8px;color:rgba(255,255,255,0.4);padding:1.5px 0;">• Valid on Customize Deal orders only</li>
                <li style="font-size:8px;color:rgba(255,255,255,0.4);padding:1.5px 0;">• Not valid with other offers</li>
                <li style="font-size:8px;color:rgba(255,255,255,0.4);padding:1.5px 0;">• Keep this card safe ❤️</li>
              </ul>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;">
              <div style="background:white;border-radius:8px;padding:5px;">
                <img src="${qrDataUrl}" width="72" height="72" style="display:block;border-radius:4px;"/>
              </div>
              <div style="font-size:7px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-align:center;">SCAN &amp; FOLLOW</div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(container);
      await new Promise(resolve => {
        const imgs = container.querySelectorAll('img'); let loaded = 0;
        if (!imgs.length) return resolve();
        imgs.forEach(img => {
          if (img.complete) { loaded++; if (loaded === imgs.length) resolve(); return; }
          img.onload = img.onerror = () => { loaded++; if (loaded === imgs.length) resolve(); };
        });
        setTimeout(resolve, 4000);
      });
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#cdc5ba', logging: false, width: CARD_W + 40, windowWidth: CARD_W + 40 });
      document.body.removeChild(container);
      const link = document.createElement('a');
      link.download = `THE KRUNCHEEZ-loyalty-card-design.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('Card design downloaded!', { id: 'dl', ...toastStyle });
    } catch(err) { toast.error('Failed: ' + err.message, { id: 'dl', ...toastStyle }); }
  };

  // ── Export ID list as CSV ──────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ['Card ID', 'Customer Name', 'Phone', 'Status'],
      ...cards.map(c => [c.cardId, c.userName || '', c.phone || '', c.active !== false ? 'Active' : 'Inactive'])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `THE KRUNCHEEZ-card-ids-${cards.length}.csv`;
    a.click();
    toast.success(`${cards.length} IDs exported!`, toastStyle);
  };

  const activeCount = cards.filter(c => c.active !== false).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Loyalty Cards</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">
            Generate IDs → Print on cards → Give to customers → 10% off on Customize Deal
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewDesign(true)}
            className="flex items-center gap-2 border border-purple-700/40 hover:border-purple-500 text-purple-400 hover:text-white font-body font-semibold text-sm px-4 py-2 rounded-xl transition-all whitespace-nowrap">
            <Eye size={15} /> View Card Design
          </button>
          <button onClick={downloadBlankCard}
            className="flex items-center gap-2 border border-blue-700/40 hover:border-blue-500 text-blue-400 hover:text-white font-body font-semibold text-sm px-4 py-2 rounded-xl transition-all whitespace-nowrap">
            <Download size={15} /> Download Card PNG
          </button>
          {cards.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-2 border border-green-700/40 hover:border-green-500 text-green-400 hover:text-white font-body font-semibold text-sm px-4 py-2 rounded-xl transition-all whitespace-nowrap">
              📥 Export IDs ({cards.length})
            </button>
          )}
          {cards.length > 0 && (
            <button onClick={handleDeleteAll} disabled={deleting}
              className="flex items-center gap-2 border border-red-700/40 hover:border-red-500 text-red-400 hover:text-white font-body font-semibold text-sm px-4 py-2 rounded-xl transition-all whitespace-nowrap disabled:opacity-60">
              {deleting ? '...' : `🗑️ Delete All`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card-dark p-5">
          <div className="w-9 h-9 bg-krunch-red/10 rounded-xl flex items-center justify-center mb-2">
            <Gift size={18} className="text-krunch-red" />
          </div>
          <p className="font-heading font-black text-xl text-white">{cards.length}</p>
          <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">Total IDs</p>
        </div>
        <div className="card-dark p-5">
          <div className="w-9 h-9 bg-green-400/10 rounded-xl flex items-center justify-center mb-2">
            <Users size={18} className="text-green-400" />
          </div>
          <p className="font-heading font-black text-xl text-white">{cards.filter(c => c.userName).length}</p>
          <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">Assigned to Customers</p>
        </div>
      </div>

      {/* Generate IDs */}
      <div className="card-dark p-5 mb-5">
        <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-3">
          🎯 Generate Card IDs
        </h3>
        <p className="text-krunch-gray font-body text-xs mb-3">
          Next ID will start from: <span className="text-white font-bold">{formatCardId(nextNum)}</span>
        </p>
        <div className="flex items-center gap-3">
          <input type="number" min={1} max={5000} value={genCount}
            onChange={e => setGenCount(Math.max(1, Math.min(5000, Number(e.target.value))))}
            className="w-24 bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm text-center focus:outline-none focus:border-krunch-red transition-colors" />
          <span className="text-krunch-gray font-body text-sm">IDs</span>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm px-5 py-3 rounded-xl transition-all disabled:opacity-60">
            {generating ? `Generating... ${genProgress}/${genCount}` : <><Gift size={15} /> Generate IDs</>}
          </button>
        </div>
        {generating && (
          <div className="mt-3 h-2 bg-krunch-border rounded-full overflow-hidden">
            <div className="h-full bg-krunch-red rounded-full transition-all"
              style={{ width: `${genCount > 0 ? (genProgress / genCount) * 100 : 0}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
        <p className="text-amber-400 font-body text-sm font-semibold mb-1">How it works:</p>
        <p className="text-krunch-gray font-body text-xs">
          1. Generate IDs → 2. Download blank card PNG → 3. Give to printer (card design + ID list) → 4. Printer prints IDs on cards → 5. Give cards to customers → 6. Customer enters ID at checkout → 10% OFF on Customize Deal ✅
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search by ID, customer name or phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Card ID', 'Customer Name', 'Phone', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">
                  No IDs yet — generate some above
                </td></tr>
              ) : filtered.map((card, i) => (
                <motion.tr key={card.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-heading font-black text-krunch-red text-sm tracking-widest">{card.cardId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-body text-sm">{card.userName || <span className="text-krunch-gray/50 italic text-xs">Not assigned</span>}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-krunch-gray font-body text-sm">{card.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(card)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                        card.active !== false
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                      }`}>
                      {card.active !== false ? <><ToggleRight size={12}/> Active</> : <><ToggleLeft size={12}/> Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditModal(card); setEditName(card.userName || ''); setEditPhone(card.phone || ''); }}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30 hover:bg-amber-600 text-amber-400 hover:text-white font-bold whitespace-nowrap transition-all">
                        ✏️ Assign
                      </button>
                      <button onClick={() => handleDelete(card)}
                        className="w-7 h-7 rounded-lg bg-red-900/20 border border-red-700/30 flex items-center justify-center text-red-400 hover:bg-red-700/30 transition-all">
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EDIT/ASSIGN MODAL ── */}
      <AnimatePresence>
        {editModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setEditModal(null)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-krunch-dark border border-krunch-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <div>
                  <h3 className="font-heading font-bold text-white uppercase">Assign to Customer</h3>
                  <p className="text-krunch-red font-heading font-bold text-sm mt-0.5">{editModal.cardId}</p>
                </div>
                <button onClick={() => setEditModal(null)} className="text-krunch-gray hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Customer Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <div>
                  <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors" />
                </div>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black py-4 rounded-xl transition-all uppercase tracking-wider disabled:opacity-60">
                  {editSaving ? 'Saving...' : '✅ Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEW CARD DESIGN MODAL ── */}
      <AnimatePresence>
        {viewDesign && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setViewDesign(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-krunch-dark border border-krunch-border rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <div>
                  <h3 className="font-heading font-bold text-white uppercase">Card Design Preview</h3>
                  <p className="text-krunch-gray font-body text-xs mt-0.5">Blank card — no ID (printer will add ID)</p>
                </div>
                <button onClick={() => setViewDesign(false)} className="text-krunch-gray hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-4">
                <iframe
                  title="card-design"
                  className="w-full rounded-xl"
                  style={{ height: 700, border: 0, background: '#cdc5ba' }}
                  srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#cdc5ba;padding:14px;display:flex;flex-direction:column;gap:10px;}.lbl{font-size:10px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;}.card{width:100%;border-radius:16px;overflow:hidden;position:relative;background:#111;}.front{height:260px;}.dots{position:absolute;inset:0;z-index:1;background-image:radial-gradient(rgba(255,255,255,0.06)1.5px,transparent 1.5px);background-size:20px 20px;}.yc1{position:absolute;top:-45px;right:-45px;width:160px;height:160px;background:#E31E24;border-radius:50%;z-index:3;}.yc2{position:absolute;bottom:-45px;left:-45px;width:140px;height:140px;background:#E31E24;border-radius:50%;z-index:3;opacity:0.5;}.badge{position:absolute;top:12px;right:12px;width:90px;height:90px;background:#E31E24;border-radius:50%;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.5);}.badge .g{font-size:8px;font-weight:900;color:white;letter-spacing:2px;}.badge .p{font-size:28px;font-weight:900;color:white;line-height:1;}.badge .o{font-size:12px;font-weight:900;color:white;}.badge .s{font-size:6.5px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center;line-height:1.4;margin-top:2px;}.fpz{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;opacity:0.22;}.fcnt{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;}.fb{font-size:36px;font-weight:900;color:#E31E24;letter-spacing:3px;text-shadow:0 3px 12px rgba(0,0,0,0.6);}.ft{font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:3px;}.fl{font-size:22px;font-weight:900;color:white;letter-spacing:6px;margin-top:5px;}.fe{display:flex;align-items:center;gap:8px;margin-top:5px;}.fe span{font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:2px;}.fd{width:4px;height:4px;background:#E31E24;border-radius:50%;}.back{height:260px;background:linear-gradient(135deg,#1a0505,#2a0a0a,#1a0505);}.y3{position:absolute;top:-35px;right:-35px;width:140px;height:140px;background:radial-gradient(circle,#E31E24,rgba(227,30,36,0.3),transparent);border-radius:50%;z-index:2;}.y4{position:absolute;bottom:-35px;left:-35px;width:120px;height:120px;background:radial-gradient(circle,#E31E24,rgba(227,30,36,0.3),transparent);border-radius:50%;z-index:2;}.bi{position:relative;z-index:4;display:flex;height:100%;padding:14px 18px 72px;gap:14px;}.bl{flex:1;}.blb{font-size:20px;font-weight:900;color:#E31E24;letter-spacing:2px;text-transform:uppercase;}.blt{font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:2px;margin-bottom:6px;}.br{width:170px;display:flex;flex-direction:column;gap:7px;}.gf{text-align:right;}.gf1{font-size:11px;color:rgba(255,255,255,0.45);}.gf3{font-size:19px;color:white;}.ob{background:linear-gradient(135deg,#E31E24,#c01a1f);border-radius:7px;padding:9px 12px;}.obp{font-size:34px;font-weight:900;color:white;line-height:1;}.obo{font-size:16px;font-weight:900;color:white;}.obt{font-size:10px;font-weight:900;color:white;letter-spacing:1px;margin-top:2px;}.obs{font-size:8px;color:rgba(255,255,255,0.85);font-weight:700;margin-top:2px;}.bs{position:absolute;bottom:0;left:0;right:0;z-index:5;padding:8px 16px 10px;background:linear-gradient(to top,rgba(0,0,0,0.98),rgba(0,0,0,0.8),transparent);display:flex;justify-content:space-between;align-items:flex-end;gap:8px;}.bsl{flex:1;min-width:0;}.tt{font-size:7px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:1px;margin-bottom:2px;}.tl{list-style:none;}.tl li{font-size:6.5px;color:rgba(255,255,255,0.4);padding:1px 0;line-height:1.3;}.qrw{display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;}.qrb{background:white;border-radius:5px;padding:3px;}.qrb img{display:block;width:55px;height:55px;border-radius:3px;}.qrl{font-size:5.5px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-align:center;}</style></head><body>
                  <div class="lbl">Front (Blank — Printer adds ID)</div>
                  <div class="card front"><div class="dots"></div><div class="yc1"></div><div class="yc2"></div><img class="fpz" src="${PIZZA_URL}" onerror="this.style.display='none'"/><div class="badge"><div class="g">GET</div><div class="p">10%</div><div class="o">OFF</div><div class="s">ON CUSTOMIZE<br/>DEAL</div></div><div class="fcnt"><div style="line-height:1;text-align:center;"><div style="font-size:36px;font-weight:900;color:white;letter-spacing:3px;text-shadow:0 3px 12px rgba(0,0,0,0.6);">THE</div><div style="font-size:36px;font-weight:900;color:#E31E24;letter-spacing:3px;text-shadow:0 3px 12px rgba(0,0,0,0.6);">KRUNCHEEZ</div></div><div class="ft">In Every Bite</div><div class="fl">LOYALTY <span style="color:#E31E24">CARD</span></div><div class="fe"><span>FAST FOOD</span><div class="fd"></div><span>CHINESE</span><div class="fd"></div><span>BBQ</span></div></div></div>
                  <div class="lbl" style="margin-top:8px">Back</div>
                  <div class="card back"><div class="dots"></div><div class="y3"></div><div class="y4"></div><div class="bi"><div class="bl"><div class="blb" style="line-height:1.1;">THE<br/>KRUNCHEEZ</div><div class="blt">In Every Bite</div></div><div class="br"><div class="gf"><div class="gf1">Good Food Brings People</div><div class="gf3">Together <span style="color:#E31E24">&#9829;</span></div></div><div class="ob"><div style="display:flex;align-items:baseline;gap:2px"><div class="obp">10%</div><div class="obo">OFF</div></div><div class="obt">ON CUSTOMIZE DEAL</div><div class="obs">Enter Card ID at checkout</div></div></div></div><div class="bs"><div class="bsl"><div class="tt">Terms &amp; Conditions:</div><ul class="tl"><li>&#8226; Valid on Customize Deal orders only</li><li>&#8226; Not valid with other offers</li><li>&#8226; Keep this card safe ❤️</li></ul></div><div class="qrw"><div class="qrb"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fkruncheez-pos.web.app%2Ffollow" width="55" height="55"/></div><div class="qrl">SCAN &amp; FOLLOW</div></div></div></div>
                  </body></html>`}
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setViewDesign(false); downloadBlankCard(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-heading font-bold py-3 rounded-xl text-sm transition-all">
                    <Download size={15}/> Download PNG
                  </button>
                  <button onClick={() => setViewDesign(false)}
                    className="flex-1 bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white font-heading font-bold py-3 rounded-xl text-sm transition-all">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCards;








