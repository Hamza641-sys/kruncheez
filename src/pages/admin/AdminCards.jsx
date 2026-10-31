import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ToggleLeft, ToggleRight,
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
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Auto-generate card ID
  const generateCardId = () => {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `KC-${num}`;
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

  // ── BULK GENERATE CARDS ────────────────────────────────────────────────────
  const handleBulkGenerate = async () => {
    if (bulkCount < 1 || bulkCount > 1000) {
      toast.error('Enter between 1 and 1000', toastStyle); return;
    }
    setBulkLoading(true);
    try {
      const batch = [];
      for (let i = 0; i < bulkCount; i++) {
        batch.push(addDoc(collection(db, 'loyaltyCards'), {
          cardId: generateCardId(),
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

  // ── PRINT SINGLE CARD ──────────────────────────────────────────────────────
  const printCard = async (card) => {
    await printCards([card]);
  };

  // ── PRINT MULTIPLE CARDS (Original Design - front + back) ─────────────────
  const printCards = async (cardList) => {
    const pizzaUrl = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=90&auto=format&fit=crop';
    const followUrl = 'https://kruncheez-pos.web.app/follow';
    let qrDataUrl = '';
    try {
      const QRCode = (await import('qrcode')).default;
      qrDataUrl = await QRCode.toDataURL(followUrl, {
        width: 200, margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
    } catch { qrDataUrl = ''; }

    const css = [
      '*{margin:0;padding:0;box-sizing:border-box;}',
      '@page{size:A4 portrait;margin:8mm;}',
      'body{background:#cdc5ba;font-family:Inter,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;padding:20px;gap:18px;}',
      '.lbl{font-size:10px;font-weight:700;color:#666;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;align-self:flex-start;width:100%;max-width:640px;}',
      '.card{width:100%;max-width:640px;border-radius:20px;overflow:hidden;position:relative;background:#111;box-shadow:0 20px 60px rgba(0,0,0,0.5);}',
      '.dots{position:absolute;inset:0;z-index:1;background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);background-size:20px 20px;}',
      '.front{height:340px;}',
      '.f-pizza{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:2;border-radius:20px;opacity:0.22;}',
      '.yc1{position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:#E31E24;border-radius:50%;z-index:3;}',
      '.yc2{position:absolute;bottom:-60px;left:-60px;width:170px;height:170px;background:#E31E24;border-radius:50%;z-index:3;opacity:0.5;}',
      '.badge{position:absolute;top:18px;right:18px;width:112px;height:112px;background:#E31E24;border-radius:50%;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.5);box-shadow:0 6px 20px rgba(245,166,35,0.5);}',
      '.b-get{font-size:10px;font-weight:900;color:white;letter-spacing:2px;line-height:1;}',
      '.b-pct{font-size:36px;font-weight:900;color:white;line-height:1;}',
      '.b-off{font-size:14px;font-weight:900;color:white;}',
      '.b-sub{font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center;line-height:1.4;margin-top:3px;}',
      '.f-cnt{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:10px;}',
      '.f-brand{font-size:46px;font-weight:900;color:#E31E24;line-height:1;letter-spacing:3px;text-transform:uppercase;text-shadow:0 3px 12px rgba(0,0,0,0.6);}',
      '.f-tag{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:4px;}',
      '.f-lc{font-size:30px;font-weight:900;color:white;letter-spacing:7px;margin-top:8px;}',
      '.f-eat{display:flex;align-items:center;gap:12px;margin-top:7px;}',
      '.f-eat span{font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:3px;}',
      '.f-dot{width:5px;height:5px;background:#E31E24;border-radius:50%;}',
      '.f-strip{position:absolute;bottom:0;left:0;right:0;z-index:6;padding:12px 24px;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%);display:flex;justify-content:center;align-items:flex-end;}',
      '.f-id{font-size:16px;font-weight:900;color:#E31E24;letter-spacing:5px;}',
      '.back{height:340px;background:linear-gradient(135deg,#1a0505 0%,#2a0a0a 40%,#1a0505 100%);}',
      '.back-grid{position:absolute;inset:0;z-index:1;background-image:linear-gradient(rgba(227,30,36,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(227,30,36,0.08) 1px,transparent 1px);background-size:30px 30px;}',
      '.yc3{position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,#E31E24 0%,rgba(227,30,36,0.3) 70%,transparent 100%);border-radius:50%;z-index:2;}',
      '.yc4{position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;background:radial-gradient(circle,#E31E24 0%,rgba(227,30,36,0.3) 70%,transparent 100%);border-radius:50%;z-index:2;}',
      '.yc5{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(227,30,36,0.05) 0%,transparent 70%);border-radius:50%;z-index:2;}',
      '.b-inner{position:relative;z-index:4;display:flex;height:100%;padding:18px 22px 90px;gap:20px;}',
      '.b-left{flex:1;display:flex;flex-direction:column;}',
      '.bl-brand{font-size:28px;font-weight:900;color:#E31E24;line-height:1.1;letter-spacing:2px;text-transform:uppercase;text-shadow:0 0 20px rgba(227,30,36,0.5);}',
      '.bl-tag{font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;margin-bottom:10px;}',
      '.ty{display:none;}',
      '.b-right{width:210px;display:flex;flex-direction:column;gap:10px;}',
      '.gf{text-align:right;}',
      '.gf1,.gf2{font-size:13px;color:rgba(255,255,255,0.45);line-height:1.5;}',
      '.gf3{font-size:26px;color:white;line-height:1.2;}',
      '.gfh{color:#E31E24;}',
      '.ob{background:linear-gradient(135deg,#E31E24,#c01a1f);border-radius:8px;padding:12px 16px;box-shadow:0 4px 15px rgba(227,30,36,0.4);}',
      '.obr{display:flex;align-items:baseline;gap:3px;}',
      '.obp{font-size:42px;font-weight:900;color:white;line-height:1;}',
      '.obo{font-size:20px;font-weight:900;color:white;}',
      '.obt{font-size:12px;font-weight:900;color:white;letter-spacing:1px;margin-top:2px;}',
      '.obs{font-size:10px;color:rgba(255,255,255,0.85);font-weight:700;margin-top:4px;}',
      '.tt{font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:1px;margin-bottom:5px;}',
      '.tl{list-style:none;}',
      '.tl li{font-size:10px;color:rgba(255,255,255,0.35);padding:3px 0;display:flex;gap:5px;}',
      '.bs{position:absolute;bottom:0;left:0;right:0;z-index:5;padding:12px 22px 14px;background:linear-gradient(to top,rgba(0,0,0,0.98) 0%,rgba(0,0,0,0.85) 70%,transparent 100%);display:flex;justify-content:space-between;align-items:flex-end;gap:12px;}',
      '.bs-left{flex:1;min-width:0;}',
      '.bsi{font-size:14px;color:#E31E24;letter-spacing:4px;font-weight:900;text-shadow:0 0 10px rgba(227,30,36,0.5);display:block;margin-bottom:5px;}',
      '.tt{font-size:9px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:1px;margin-bottom:3px;}',
      '.tl{list-style:none;}',
      '.tl li{font-size:8px;color:rgba(255,255,255,0.4);padding:1.5px 0;display:flex;gap:4px;line-height:1.3;}',
      '.qr-wrap{display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;}',
      '.qr-box{background:white;border-radius:8px;padding:5px;box-shadow:0 4px 15px rgba(0,0,0,0.5);}',
      '.qr-box img{display:block;width:72px;height:72px;border-radius:4px;}',
      '.qr-lbl{font-size:8px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-align:center;}',
      '.qr-lbl{font-size:7px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-align:center;}',
      '.page-pair{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:640px;page-break-after:always;}',
      '@media print{body{background:#cdc5ba;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;gap:14px;}.page-pair{page-break-after:always;}.card{page-break-inside:avoid;}}',
    ].join('');

    const pairs = cardList.map(card => `
      <div class="page-pair">
        <div class="lbl">Front Side - ${card.cardId}</div>
        <div class="card front">
          <div class="dots"></div>
          <div class="yc1"></div>
          <div class="yc2"></div>
          <img class="f-pizza" src="${pizzaUrl}" onerror="this.style.display='none'"/>
          <div class="badge">
            <div class="b-get">GET</div>
            <div class="b-pct">10%</div>
            <div class="b-off">OFF</div>
            <div class="b-sub">ON CUSTOM<br/>DEAL</div>
          </div>
          <div class="f-cnt">
            <div class="f-brand">KRUNCHEEZ</div>
            <div class="f-tag">Crunch in Every Bite</div>
            <div class="f-lc">LOYALTY <span style="color:#E31E24">CARD</span></div>
            <div class="f-eat">
              <span>EAT</span><div class="f-dot"></div>
              <span>EARN</span><div class="f-dot"></div>
              <span>ENJOY</span>
            </div>
          </div>
          <div class="f-strip">
            <div class="f-id">${card.cardId}</div>
          </div>
        </div>

        <div class="lbl">Back Side - ${card.cardId}</div>
        <div class="card back">
          <div class="dots"></div>
          <div class="back-grid"></div>
          <div class="yc3"></div>
          <div class="yc4"></div>
          <div class="yc5"></div>
          <div class="b-inner">
            <div class="b-left">
              <div class="bl-brand">KRUNCHEEZ</div>
              <div class="bl-tag">Crunch in Every Bite</div>
              <div class="ty">
                <div class="ty1">Thank You</div>
                <div class="ty2">for being a part of</div>
                <div class="ty3">The Kruncheez Family!</div>
              </div>
            </div>
            <div class="b-right">
              <div class="gf">
                <div class="gf1">Good Food</div>
                <div class="gf2">Brings People</div>
                <div class="gf3">Together <span class="gfh">&#9829;</span></div>
              </div>
              <div class="ob">
                <div class="obr"><div class="obp">10%</div><div class="obo">OFF</div></div>
                <div class="obt">ON CUSTOM DEAL</div>
                <div class="obs">Enter Card ID at checkout</div>
              </div>
            </div>
          </div>
          <div class="bs">
            <div class="bs-left">
              <span class="bsi">${card.cardId}</span>
              <div class="tt">Terms &amp; Conditions:</div>
              <ul class="tl">
                <li>&#8226; Valid on Custom Deal orders only</li>
                <li>&#8226; One card per customer</li>
                <li>&#8226; Not valid with other offers</li>
                <li>&#8226; Keep this card safe</li>
              </ul>
            </div>
            ${qrDataUrl ? `<div class="qr-wrap"><div class="qr-box"><img src="${qrDataUrl}" width="72" height="72"/></div><div class="qr-lbl">SCAN &amp; FOLLOW</div></div>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>KrunchEez Loyalty Cards</title><style>${css}</style></head><body>${pairs}<script>(function(){var imgs=document.querySelectorAll("img"),done=0,n=imgs.length;function go(){if(++done>=n)setTimeout(function(){window.print();window.close();},800);}if(!n){setTimeout(function(){window.print();window.close();},1000);return;}imgs.forEach(function(img){if(img.complete&&img.naturalHeight)go();else{img.onload=go;img.onerror=go;}});setTimeout(function(){window.print();window.close();},8000);})();<\/script></body></html>`);
    win.document.close();
  };

  const totalCards  = cards.length;
  const activeCards = cards.filter(c => c.active).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Loyalty Cards</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{totalCards} cards - 10% off on Custom Deal</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Generate Cards */}
          <div className="flex items-center gap-2 bg-krunch-card border border-krunch-border rounded-xl px-3 py-2.5">
            <input
              type="number" min={1} max={1000} value={bulkCount}
              onChange={e => setBulkCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              className="w-16 bg-transparent text-white font-body text-sm text-center focus:outline-none"
            />
            <span className="text-krunch-gray text-xs font-body">cards</span>
            <button onClick={handleBulkGenerate} disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 whitespace-nowrap">
              {bulkLoading ? '...' : <><Gift size={13} /> Generate</>}
            </button>
          </div>
          {/* Print All */}
          {cards.length > 0 && (
            <button onClick={() => printCards(cards)}
              className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
              <Printer size={15} /> Print All ({cards.length})
            </button>
          )}
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
        <p className="text-amber-400 font-body text-sm">
          🃏 Generate cards → Print → Give to customers → Customer enters Card ID at checkout with Custom Deal → <span className="text-white font-semibold">10% discount auto applied!</span>
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search by card ID..." value={search}
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
    </div>
  );
};

export default AdminCards;
