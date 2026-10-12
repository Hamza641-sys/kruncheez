import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, X, Plus, ToggleLeft, ToggleRight,
  TrendingUp, Users, Gift, Star, Printer
} from 'lucide-react';
import { getAllCards, toggleCard, manualAddVisit } from '../../firebase/cardService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const tierColors = {
  Bronze: 'text-amber-700 bg-amber-900/20 border-amber-700/30',
  Silver: 'text-gray-300  bg-gray-700/20  border-gray-500/30',
  Gold:   'text-amber-400 bg-amber-500/20 border-amber-500/30',
};

const tierEmoji = { Bronze: '🥉', Silver: '🥈', Gold: '🥇' };

const AdminCards = () => {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ name: '', phone: '', cardId: '' });
  const [issuing, setIssuing]     = useState(false);

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

  const handleAddVisit = async (card) => {
    await manualAddVisit(card.id);
    toast.success('Visit added!', toastStyle);
    await fetchCards();
    if (selected?.id === card.id) {
      setSelected(prev => ({ ...prev, visits: (prev.visits || 0) + 1, totalVisits: (prev.totalVisits || 0) + 1 }));
    }
  };

  // ── PRINT SINGLE CARD — Exact KrunchEez Brand Design ──────────────────────
  const printCard = (card) => {
    const visits     = card.visits || 0;
    const totalVisits= card.totalVisits || 0;
    const points     = card.points || 0;
    const tier       = card.tier || 'Bronze';
    const isEligible = visits >= 10;

    const win = window.open('', '_blank');
    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>KrunchEez Loyalty Card — ${card.cardId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Oswald:wght@700;900&family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #e8e0d0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh;
      font-family: 'Inter', Arial, sans-serif;
      padding: 30px 20px; gap: 30px;
    }
    .side-label {
      font-family: 'Inter', Arial; font-size: 13px; color: #666;
      letter-spacing: 1px; text-transform: uppercase;
      margin-bottom: 8px; align-self: flex-start;
    }
    .card-wrap { display: flex; flex-direction: column; align-items: flex-start; width: 100%; max-width: 680px; }

    /* ═══ FRONT ═══ */
    .card-front {
      width: 680px; height: 380px; background: #0f0f0f;
      border-radius: 20px; position: relative; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4);
    }
    .doodle-bg {
      position: absolute; inset: 0; opacity: 0.05;
      background-image: radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px);
      background-size: 22px 22px;
    }
    .yc-tr {
      position: absolute; top: -30px; right: -30px;
      width: 180px; height: 180px; background: #F5A623;
      border-radius: 50%; z-index: 1;
    }
    .yc-bl {
      position: absolute; bottom: -50px; left: -50px;
      width: 140px; height: 140px; background: #F5A623;
      border-radius: 50%; z-index: 1; opacity: 0.6;
    }
    .disc-circle {
      position: absolute; top: 22px; right: 22px;
      width: 115px; height: 115px; background: #F5A623;
      border-radius: 50%; z-index: 5;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(245,166,35,0.5);
      border: 3px solid rgba(255,255,255,0.4);
    }
    .dc-get { font-size: 11px; font-weight: 900; color: #000; letter-spacing: 1px; line-height: 1; }
    .dc-pct { font-family:'Oswald',Arial; font-size: 36px; font-weight: 900; color: #000; line-height: 1; }
    .dc-off { font-size: 14px; font-weight: 900; color: #000; line-height: 1; }
    .dc-sub { font-size: 8px; font-weight: 700; color: #333; text-align: center; line-height: 1.3; margin-top: 2px; }

    /* Food emojis */
    .food-l { position: absolute; left: 0; bottom: 0; z-index: 3; display: flex; align-items: flex-end; }
    .food-l .burger { font-size: 100px; line-height:1; margin-left: 8px; margin-bottom: -12px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); }
    .food-l .fries  { font-size: 60px;  margin-left: -5px; margin-bottom: 28px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.4)); }
    .food-r { position: absolute; right: 145px; bottom: -5px; font-size: 75px; z-index: 3; filter: drop-shadow(0 8px 15px rgba(0,0,0,0.5)); }

    /* Front content */
    .front-cnt {
      position: absolute; inset: 0; z-index: 4;
      display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start;
      padding-top: 24px;
    }
    .f-the { font-family:'Inter',Arial; font-size:16px; font-weight:700; color:white; letter-spacing:3px; display:flex; align-items:center; gap:6px; }
    .f-main { font-family:'Pacifico',cursive; font-size:50px; color:#F5A623; line-height:1; text-shadow:0 3px 12px rgba(0,0,0,0.5); }
    .f-tag { font-size:12px; color:rgba(255,255,255,0.55); letter-spacing:3px; margin-top:3px; }
    .f-loyalty { font-family:'Oswald',Arial; font-size:34px; font-weight:900; color:white; letter-spacing:6px; margin-top:6px; }
    .f-loyalty span { color:#F5A623; }
    .f-eat { display:flex; align-items:center; gap:12px; margin-top:6px; }
    .f-eat span { font-size:12px; color:rgba(255,255,255,0.45); letter-spacing:3px; font-weight:600; }
    .f-dot { width:5px; height:5px; background:#F5A623; border-radius:50%; }
    .f-name { margin-top:10px; font-family:'Oswald',Arial; font-size:15px; color:rgba(255,255,255,0.35); letter-spacing:3px; }
    .f-id { font-family:'Oswald',Arial; font-size:13px; color:rgba(245,166,35,0.55); letter-spacing:4px; margin-top:3px; }

    /* ═══ BACK ═══ */
    .card-back {
      width: 680px; height: 380px; background: #0f0f0f;
      border-radius: 20px; position: relative; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4);
    }
    .bc-tr { position:absolute; top:-25px; right:-25px; width:120px; height:120px; background:#F5A623; border-radius:50%; z-index:1; opacity:0.8; }
    .bc-bl { position:absolute; bottom:-30px; left:-30px; width:100px; height:100px; background:#F5A623; border-radius:50%; z-index:1; opacity:0.6; }

    .back-inner { position:relative; z-index:4; display:flex; height:100%; padding:22px; gap:24px; }

    /* Left */
    .b-left { flex:1; display:flex; flex-direction:column; }
    .bl-the  { font-size:12px; font-weight:700; color:white; letter-spacing:3px; display:flex; align-items:center; gap:5px; }
    .bl-main { font-family:'Pacifico',cursive; font-size:30px; color:#F5A623; line-height:1.1; }
    .bl-tag  { font-size:9px; color:rgba(255,255,255,0.35); letter-spacing:2px; margin-bottom:14px; }
    .stamps  { display:flex; flex-wrap:wrap; gap:8px; max-width:310px; }
    .stamp {
      width:52px; height:52px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; font-size:22px;
    }
    .stamp.on  { background:#F5A623; border:2px solid #F5A623; box-shadow:0 0 12px rgba(245,166,35,0.5); }
    .stamp.off { background:transparent; border:2px solid rgba(255,255,255,0.18); }
    .stamp.off span { opacity:0.2; }
    .ty { margin-top:auto; padding-top:12px; }
    .ty-s { font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:1px; }
    .ty-m { font-family:'Pacifico',cursive; font-size:20px; color:#F5A623; line-height:1.2; }
    .ty-b { font-size:11px; color:rgba(255,255,255,0.3); margin-top:2px; }

    /* Right */
    .b-right { width:230px; display:flex; flex-direction:column; gap:12px; }
    .gf { text-align:right; line-height:1.3; }
    .gf1,.gf2 { font-size:12px; color:rgba(255,255,255,0.45); }
    .gf3 { font-family:'Pacifico',cursive; font-size:20px; color:white; }
    .gfh { color:#F5A623; }
    .off-box {
      background:#F5A623; border-radius:10px; padding:10px 14px;
      position:relative; overflow:hidden;
    }
    .off-box::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%); }
    .ob-pct { font-family:'Oswald',Arial; font-size:36px; font-weight:900; color:#000; line-height:1; position:relative; z-index:1; }
    .ob-txt { font-size:12px; font-weight:900; color:#000; letter-spacing:1px; position:relative; z-index:1; }
    .ob-sub { font-size:9px; color:rgba(0,0,0,0.6); font-weight:700; position:relative; z-index:1; }
    .terms-t { font-size:10px; font-weight:700; color:rgba(255,255,255,0.45); letter-spacing:1px; margin-bottom:4px; }
    .terms-l { list-style:none; }
    .terms-l li { font-size:9px; color:rgba(255,255,255,0.3); padding:1.5px 0; display:flex; align-items:flex-start; gap:4px; }
    .terms-l li::before { content:'•'; color:#F5A623; flex-shrink:0; }

    /* Customer strip */
    .cs { position:absolute; bottom:14px; left:22px; right:22px; display:flex; justify-content:space-between; align-items:center; z-index:5; }
    .cs-n { font-family:'Oswald',Arial; font-size:13px; color:rgba(255,255,255,0.35); letter-spacing:2px; }
    .cs-i { font-family:'Oswald',Arial; font-size:13px; color:rgba(245,166,35,0.5); letter-spacing:2px; }

    @media print {
      body { background:#e8e0d0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>

  <!-- FRONT -->
  <div class="card-wrap">
    <div class="side-label">Front Side</div>
    <div class="card-front">
      <div class="doodle-bg"></div>
      <div class="yc-tr"></div>
      <div class="yc-bl"></div>
      <div class="food-l">
        <div class="burger">🍔</div>
        <div class="fries">🍟</div>
      </div>
      <div class="food-r">🍗</div>
      <div class="disc-circle">
        <div class="dc-get">GET</div>
        <div class="dc-pct">10%</div>
        <div class="dc-off">OFF</div>
        <div class="dc-sub">ON YOUR NEXT<br/>ORDER</div>
      </div>
      <div class="front-cnt">
        <div class="f-the"><span>👨‍🍳</span> The</div>
        <div class="f-main">Kruncheez</div>
        <div class="f-tag">Crunch in Every Bite</div>
        <div class="f-loyalty">LOYALTY <span>CARD</span></div>
        <div class="f-eat">
          <span>EAT</span><div class="f-dot"></div>
          <span>EARN</span><div class="f-dot"></div>
          <span>ENJOY</span>
        </div>
        <div class="f-name">${(card.userName || 'Customer').toUpperCase()}</div>
        <div class="f-id">${card.cardId}</div>
      </div>
    </div>
  </div>

  <!-- BACK -->
  <div class="card-wrap">
    <div class="side-label">Back Side</div>
    <div class="card-back">
      <div class="doodle-bg"></div>
      <div class="bc-tr"></div>
      <div class="bc-bl"></div>
      <div class="back-inner">
        <div class="b-left">
          <div class="bl-the"><span>👨‍🍳</span> The</div>
          <div class="bl-main">Kruncheez</div>
          <div class="bl-tag">Crunch in Every Bite</div>
          <div class="stamps">
            ${Array.from({ length: 10 }, (_, i) => `
              <div class="stamp ${i < visits ? 'on' : 'off'}">
                ${i < visits ? '👨‍🍳' : '<span>👨‍🍳</span>'}
              </div>
            `).join('')}
          </div>
          <div class="ty">
            <div class="ty-s">Thank You</div>
            <div class="ty-m">for being a part of</div>
            <div class="ty-b">The Kruncheez Family!</div>
          </div>
        </div>
        <div class="b-right">
          <div class="gf">
            <div class="gf1">Good Food</div>
            <div class="gf2">Brings People</div>
            <div class="gf3">Together <span class="gfh">♥</span></div>
          </div>
          <div class="off-box">
            <div class="ob-pct">10% OFF</div>
            <div class="ob-txt">ON YOUR NEXT ORDER</div>
            ${isEligible
              ? '<div class="ob-sub">✅ DISCOUNT READY!</div>'
              : `<div class="ob-sub">${10 - visits} more visit(s) needed</div>`}
          </div>
          <div>
            <div class="terms-t">Terms &amp; Conditions:</div>
            <ul class="terms-l">
              <li>Valid for dine-in &amp; online orders</li>
              <li>One card per customer</li>
              <li>Not valid with other offers</li>
              <li>Keep this card safe</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="cs">
        <div class="cs-n">${(card.userName || 'Customer').toUpperCase()}</div>
        <div class="cs-i">${card.cardId} • ${card.phone || ''}</div>
      </div>
    </div>
  </div>

  <script>window.onload = () => { window.print(); window.close(); }</script>
</body>
</html>
    `);
    win.document.close();
  };

  // ── PRINT ALL CARDS ────────────────────────────────────────────────────────
  const printAllCards = () => {
    const cardsHTML = cards.map(card => {
      const visits     = card.visits || 0;
      const tier       = card.tier || 'Bronze';
      const tierBadge  = { Bronze: '🥉', Silver: '🥈', Gold: '🥇' }[tier] || '🥉';
      const isEligible = visits >= 10;

      const stampsRow = Array.from({ length: 10 }, (_, i) => `
        <div style="width:46px;height:46px;border-radius:50%;background:${i < visits ? '#F5A623' : 'transparent'};border:2px solid ${i < visits ? '#F5A623' : 'rgba(255,255,255,0.18)'};display:inline-flex;align-items:center;justify-content:center;font-size:20px;">
          ${i < visits ? '👨‍🍳' : '<span style="opacity:0.2">👨‍🍳</span>'}
        </div>
      `).join('');

      return `
        <div style="width:680px;height:380px;background:#0f0f0f;border-radius:20px;position:relative;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.4);page-break-inside:avoid;">
          <div style="position:absolute;top:-30px;right:-30px;width:180px;height:180px;background:#F5A623;border-radius:50%;z-index:1;"></div>
          <div style="position:absolute;bottom:-50px;left:-50px;width:140px;height:140px;background:#F5A623;border-radius:50%;z-index:1;opacity:0.6;"></div>
          <!-- Food -->
          <div style="position:absolute;left:8px;bottom:-12px;font-size:95px;z-index:3;filter:drop-shadow(0 10px 20px rgba(0,0,0,0.5));">🍔</div>
          <div style="position:absolute;left:75px;bottom:25px;font-size:58px;z-index:3;">🍟</div>
          <div style="position:absolute;right:148px;bottom:-5px;font-size:72px;z-index:3;">🍗</div>
          <!-- Discount -->
          <div style="position:absolute;top:22px;right:22px;width:115px;height:115px;background:#F5A623;border-radius:50%;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(245,166,35,0.5);border:3px solid rgba(255,255,255,0.4);">
            <div style="font-size:11px;font-weight:900;color:#000;letter-spacing:1px;">GET</div>
            <div style="font-family:Arial;font-size:36px;font-weight:900;color:#000;line-height:1;">10%</div>
            <div style="font-size:14px;font-weight:900;color:#000;">OFF</div>
            <div style="font-size:8px;font-weight:700;color:#333;text-align:center;line-height:1.3;margin-top:2px;">ON YOUR NEXT<br/>ORDER</div>
          </div>
          <!-- Content -->
          <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:24px;">
            <div style="font-size:16px;font-weight:700;color:white;letter-spacing:3px;">👨‍🍳 The</div>
            <div style="font-size:48px;color:#F5A623;line-height:1;font-weight:900;font-style:italic;">Kruncheez</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:2px;">Crunch in Every Bite</div>
            <div style="font-size:32px;font-weight:900;color:white;letter-spacing:6px;margin-top:6px;">LOYALTY <span style="color:#F5A623;">CARD</span></div>
            <div style="display:flex;align-items:center;gap:12px;margin-top:6px;">
              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:3px;">EAT</span>
              <div style="width:5px;height:5px;background:#F5A623;border-radius:50%;"></div>
              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:3px;">EARN</span>
              <div style="width:5px;height:5px;background:#F5A623;border-radius:50%;"></div>
              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:3px;">ENJOY</span>
            </div>
            <div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.3);letter-spacing:3px;">${(card.userName||'Customer').toUpperCase()}</div>
            <div style="font-size:12px;color:rgba(245,166,35,0.5);letter-spacing:4px;">${card.cardId}</div>
          </div>
        </div>
      `;
    }).join('<div style="height:20px;"></div>');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>All Loyalty Cards</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#e8e0d0;display:flex;flex-direction:column;align-items:center;padding:30px;gap:30px;font-family:Arial;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
      </style></head>
      <body>${cardsHTML}
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // ── ISSUE CARD ─────────────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (!issueForm.name || !issueForm.cardId) { toast.error('Name and Card ID required', toastStyle); return; }
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
        lastVisit: serverTimestamp(),
        issuedByAdmin: true,
      });
      toast.success(`Card ${cardId} issued!`, toastStyle);
      await fetchCards();
      setShowIssue(false);
      setIssueForm({ name: '', phone: '', cardId: '' });
    } catch { toast.error('Failed to issue card', toastStyle); }
    finally { setIssuing(false); }
  };

  // Stats
  const totalCards  = cards.length;
  const activeCards = cards.filter(c => c.active).length;
  const totalVisits = cards.reduce((s, c) => s + (c.totalVisits || 0), 0);
  const totalSaved  = cards.reduce((s, c) => s + (c.totalSaved  || 0), 0);
  const eligible    = cards.filter(c => (c.visits || 0) >= 10).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Loyalty Cards</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{totalCards} cards issued</p>
        </div>
        <div className="flex items-center gap-3">
          {cards.length > 0 && (
            <button onClick={printAllCards}
              className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
              <Printer size={15} /> Print All
            </button>
          )}
          <button onClick={() => setShowIssue(true)}
            className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Issue Card
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Cards',  value: totalCards,                          icon: <Gift size={18} className="text-krunch-red" />,     bg: 'bg-krunch-red/10' },
          { label: 'Active',       value: activeCards,                         icon: <Star size={18} className="text-green-400" />,      bg: 'bg-green-400/10' },
          { label: 'Eligible Now', value: eligible,                            icon: <TrendingUp size={18} className="text-amber-400" />, bg: 'bg-amber-400/10' },
          { label: 'Total Visits', value: totalVisits,                         icon: <Users size={18} className="text-blue-400" />,      bg: 'bg-blue-400/10' },
          { label: 'Total Saved',  value: `Rs.${totalSaved.toLocaleString()}`, icon: <TrendingUp size={18} className="text-purple-400" />,bg: 'bg-purple-400/10' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="font-heading font-black text-xl text-white">{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
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
                {['Card ID','Customer','Tier','Visits','Points','Saved','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No cards found</td></tr>
              ) : filtered.map((card, i) => {
                const isElig = (card.visits || 0) >= 10;
                return (
                  <motion.tr key={card.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-krunch-red text-sm tracking-wider">{card.cardId}</span>
                        {isElig && <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold">ELIGIBLE</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-body font-semibold text-sm">{card.userName || '—'}</p>
                      <p className="text-krunch-gray font-body text-xs">{card.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tierColors[card.tier] || tierColors.Bronze}`}>
                        {tierEmoji[card.tier]} {card.tier || 'Bronze'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} className={`w-2 h-4 rounded-sm ${j < (card.visits||0) ? 'bg-krunch-red' : 'bg-krunch-border'}`} />
                          ))}
                        </div>
                        <span className="text-white font-body text-xs font-bold">{card.visits||0}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        <span className="text-amber-400 font-body font-bold text-sm">{card.points||0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-body font-bold text-sm">Rs.{(card.totalSaved||0).toLocaleString()}</td>
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
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(card)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                          <Eye size={12} />
                        </button>
                        <button onClick={() => handleAddVisit(card)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-krunch-red/10 text-krunch-red border border-krunch-red/20 hover:bg-krunch-red hover:text-white transition-all font-bold whitespace-nowrap">
                          +Visit
                        </button>
                        <button onClick={() => printCard(card)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all font-bold whitespace-nowrap flex items-center gap-1">
                          <Printer size={10} /> Print
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Issue Loyalty Card</h3>
                <button onClick={() => setShowIssue(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { key: 'name',   label: 'Customer Name *', placeholder: 'Muhammad Ahmed' },
                  { key: 'phone',  label: 'Phone Number',    placeholder: '03XX-XXXXXXX' },
                  { key: 'cardId', label: 'Card Number *',   placeholder: 'e.g. 12345 (KC- auto added)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                    <input type="text" value={issueForm[f.key]}
                      onChange={e => setIssueForm({ ...issueForm, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <div className="bg-krunch-black border border-krunch-border rounded-xl p-3">
                  <p className="text-krunch-gray font-body text-xs">
                    Card: <span className="text-white">0/10 visits</span> • <span className="text-white">Bronze tier</span> • <span className="text-white">10% after 10 visits</span>
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

      {/* Card Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Card Details</h3>
                <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6">
                <div className="bg-krunch-red rounded-xl p-4 mb-4 text-center">
                  <p className="font-heading font-black text-white text-2xl tracking-widest">{selected.cardId}</p>
                  <p className="text-red-200 font-body text-sm mt-1">{selected.userName}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Current',  value: `${selected.visits||0}/10` },
                    { label: 'Total',    value: selected.totalVisits||0 },
                    { label: 'Points',   value: selected.points||0 },
                    { label: 'Saved',    value: `Rs.${(selected.totalSaved||0).toLocaleString()}` },
                    { label: 'Tier',     value: `${tierEmoji[selected.tier]} ${selected.tier}` },
                    { label: 'Status',   value: selected.active ? '✅ Active' : '❌ Off' },
                  ].map((s, i) => (
                    <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                      <p className="font-heading font-black text-krunch-red text-lg">{s.value}</p>
                      <p className="text-krunch-gray font-body text-[10px] uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Visit Progress</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i}
                        className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i < (selected.visits||0) ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray'
                        }`}>
                        {i < (selected.visits||0) ? '✓' : i+1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleAddVisit(selected)}
                    className="flex-1 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3 rounded-xl transition-all uppercase">
                    + Add Visit
                  </button>
                  <button onClick={() => printCard(selected)}
                    className="flex items-center justify-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-3 rounded-xl transition-all">
                    <Printer size={15} /> Print
                  </button>
                  <button onClick={() => handleToggle(selected)}
                    className={`flex-1 font-heading font-bold text-sm py-3 rounded-xl transition-all uppercase border ${
                      selected.active
                        ? 'bg-red-900/20 border-red-700/30 text-red-400 hover:bg-red-700/30'
                        : 'bg-green-900/20 border-green-700/30 text-green-400 hover:bg-green-700/30'
                    }`}>
                    {selected.active ? 'Deactivate' : 'Activate'}
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
