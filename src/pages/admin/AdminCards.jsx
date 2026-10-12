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
  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ name: '', phone: '', cardId: '' });
  const [issuing, setIssuing]   = useState(false);

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

  // Print single loyalty card — Credit Card Style
  const printCard = (card) => {
    const visits      = card.visits || 0;
    const totalVisits = card.totalVisits || 0;
    const points      = card.points || 0;
    const tier        = card.tier || 'Bronze';
    const isEligible  = visits >= 10;

    const tierColors = {
      Bronze: { bg: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)', accent: '#CD7F32', glow: 'rgba(205,127,50,0.4)' },
      Silver: { bg: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)', accent: '#C0C0C0', glow: 'rgba(192,192,192,0.4)' },
      Gold:   { bg: 'linear-gradient(135deg, #1a1200 0%, #3d2e00 50%, #1a1200 100%)', accent: '#FFD700', glow: 'rgba(255,215,0,0.5)' },
    };
    const tc = tierColors[tier] || tierColors.Bronze;

    // Dots — small circles
    const dotsHTML = Array.from({ length: 10 }, (_, i) => `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${i < visits ? '#E31E24' : 'rgba(255,255,255,0.05)'};
        border:1.5px solid ${i < visits ? '#E31E24' : 'rgba(255,255,255,0.15)'};
        display:inline-flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:900;
        color:${i < visits ? '#fff' : 'rgba(255,255,255,0.2)'};
        box-shadow:${i < visits ? '0 0 8px rgba(227,30,36,0.6)' : 'none'};
      ">${i < visits ? '✓' : ''}</div>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KrunchEez Loyalty Card — ${card.cardId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Inter', Arial, sans-serif;
            padding: 20px;
          }

          .page {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }

          /* ═══ FRONT OF CARD ═══ */
          .card-front {
            width: 3.375in;
            height: 2.125in;
            border-radius: 16px;
            background: ${tc.bg};
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${tc.glow};
            border: 1px solid ${tc.accent}33;
          }

          /* Holographic shimmer overlay */
          .card-front::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              135deg,
              transparent 0%,
              rgba(255,255,255,0.03) 40%,
              rgba(255,255,255,0.08) 50%,
              rgba(255,255,255,0.03) 60%,
              transparent 100%
            );
            z-index: 1;
          }

          /* Red diagonal stripe */
          .stripe {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, #E31E24, #ff4444, #E31E24);
            z-index: 2;
          }

          /* Circular bg decoration */
          .circle-deco {
            position: absolute;
            border-radius: 50%;
            z-index: 1;
          }

          .front-content {
            position: relative;
            z-index: 3;
            padding: 14px 18px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          /* Top row */
          .front-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }

          .brand-name {
            font-family: 'Oswald', Arial, sans-serif;
            font-size: 20px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 2px;
            text-shadow: 0 0 20px rgba(227,30,36,0.5);
            line-height: 1;
          }
          .brand-sub {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 7px;
            color: rgba(255,255,255,0.5);
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-top: 3px;
          }

          .tier-pill {
            background: linear-gradient(135deg, ${tc.accent}33, ${tc.accent}11);
            border: 1px solid ${tc.accent}66;
            color: ${tc.accent};
            font-size: 10px;
            font-weight: 900;
            padding: 3px 10px;
            border-radius: 20px;
            letter-spacing: 1px;
            font-family: 'Oswald', Arial, sans-serif;
            text-shadow: 0 0 10px ${tc.glow};
          }

          /* Chip */
          .chip {
            width: 36px; height: 26px;
            background: linear-gradient(135deg, #d4af37, #f5d87c, #b8860b);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          .chip::before {
            content: '';
            position: absolute;
            left: 50%; top: 0; bottom: 0;
            width: 1px;
            background: rgba(0,0,0,0.3);
          }
          .chip::after {
            content: '';
            position: absolute;
            top: 50%; left: 0; right: 0;
            height: 1px;
            background: rgba(0,0,0,0.3);
          }

          /* Card number */
          .card-number {
            font-family: 'Oswald', 'Courier New', monospace;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 4px;
            text-align: center;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          }

          /* Bottom row */
          .front-bottom {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
          }
          .holder-label {
            font-size: 7px;
            color: rgba(255,255,255,0.4);
            letter-spacing: 2px;
            text-transform: uppercase;
            font-family: 'Inter', Arial;
          }
          .holder-name {
            font-family: 'Oswald', Arial, sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 2px;
            margin-top: 2px;
            text-transform: uppercase;
          }
          .loyalty-badge {
            text-align: right;
          }
          .loyalty-text {
            font-size: 7px;
            color: rgba(255,255,255,0.4);
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .loyalty-val {
            font-family: 'Oswald', Arial, sans-serif;
            font-size: 16px;
            font-weight: 900;
            color: ${tc.accent};
            text-shadow: 0 0 10px ${tc.glow};
          }

          /* ═══ BACK OF CARD ═══ */
          .card-back {
            width: 3.375in;
            height: 2.125in;
            border-radius: 16px;
            background: ${tc.bg};
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            border: 1px solid ${tc.accent}33;
          }

          /* Magnetic stripe */
          .mag-stripe {
            height: 0.4in;
            background: linear-gradient(180deg, #111 0%, #222 50%, #111 100%);
            margin-top: 0.2in;
          }

          .back-content {
            position: relative;
            z-index: 3;
            padding: 12px 18px;
          }

          /* Visit tracker */
          .visit-section {
            margin-top: 8px;
          }
          .visit-label {
            font-size: 7px;
            color: rgba(255,255,255,0.4);
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 8px;
            font-family: 'Inter', Arial;
          }
          .dots-row {
            display: flex;
            gap: 4px;
            flex-wrap: nowrap;
          }

          /* Progress */
          .progress-wrap { margin-top: 8px; }
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .progress-text { font-size: 8px; color: rgba(255,255,255,0.4); font-family:'Inter',Arial; }
          .progress-val  { font-size: 8px; color: #E31E24; font-weight: 700; font-family:'Inter',Arial; }
          .progress-bg   { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #E31E24, #ff4444); border-radius: 2px; width: ${Math.min((visits/10)*100,100)}%; }

          /* Stats */
          .stats-row { display: flex; gap: 6px; margin-top: 8px; }
          .stat {
            flex: 1; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px; padding: 5px; text-align: center;
          }
          .stat-val { font-family:'Oswald',Arial; font-size:15px; font-weight:900; }
          .stat-val.red { color:#E31E24; }
          .stat-val.gold { color:${tc.accent}; }
          .stat-val.green { color:#10B981; }
          .stat-label { font-size:6px; color:rgba(255,255,255,0.3); letter-spacing:1px; text-transform:uppercase; margin-top:1px; font-family:'Inter',Arial; }

          /* Eligible banner */
          .eligible-banner {
            margin-top: 8px;
            background: rgba(16,185,129,0.1);
            border: 1px solid rgba(16,185,129,0.3);
            border-radius: 8px; padding: 5px 10px;
            text-align: center;
          }
          .eligible-text { color:#10B981; font-size:10px; font-weight:900; font-family:'Oswald',Arial; letter-spacing:1px; }

          .back-footer {
            position: absolute;
            bottom: 10px; left: 18px; right: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .back-footer-text { font-size:7px; color:rgba(255,255,255,0.2); letter-spacing:1px; font-family:'Inter',Arial; }

          @media print {
            body {
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">

          <!-- ═══ FRONT ═══ -->
          <div class="card-front">
            <div class="stripe"></div>

            <!-- Decorative circles -->
            <div class="circle-deco" style="width:200px;height:200px;background:rgba(227,30,36,0.05);top:-80px;right:-60px;"></div>
            <div class="circle-deco" style="width:120px;height:120px;background:${tc.accent}08;bottom:-40px;left:-30px;"></div>

            <div class="front-content">
              <!-- Top: Brand + Tier -->
              <div class="front-top">
                <div>
                  <div class="brand-name">🐂 KRUNCHEEZ</div>
                  <div class="brand-sub">Fast Food • Chinese • BBQ</div>
                </div>
                <div class="tier-pill">${tier === 'Bronze' ? '🥉' : tier === 'Silver' ? '🥈' : '🥇'} ${tier}</div>
              </div>

              <!-- Chip + Card Number -->
              <div style="display:flex;align-items:center;gap:16px;">
                <div class="chip"></div>
                <div class="card-number">${card.cardId.replace('KC-', 'KC ').replace(/(.{4})/g,'$1 ').trim()}</div>
              </div>

              <!-- Bottom: Name + Points -->
              <div class="front-bottom">
                <div>
                  <div class="holder-label">Card Holder</div>
                  <div class="holder-name">${(card.userName || 'Customer').substring(0, 18)}</div>
                </div>
                <div class="loyalty-badge">
                  <div class="loyalty-text">Points</div>
                  <div class="loyalty-val">${points}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ BACK ═══ -->
          <div class="card-back">
            <!-- Magnetic stripe -->
            <div class="mag-stripe"></div>

            <div class="back-content">
              <!-- Visit Tracker -->
              <div class="visit-section">
                <div class="visit-label">Visit Tracker — 10 visits = 10% discount</div>
                <div class="dots-row">${dotsHTML}</div>
                <div class="progress-wrap">
                  <div class="progress-label">
                    <span class="progress-text">Progress</span>
                    <span class="progress-val">${visits}/10 visits</span>
                  </div>
                  <div class="progress-bg"><div class="progress-fill"></div></div>
                </div>
              </div>

              <!-- Stats -->
              <div class="stats-row">
                <div class="stat">
                  <div class="stat-val red">${visits}/10</div>
                  <div class="stat-label">Current</div>
                </div>
                <div class="stat">
                  <div class="stat-val gold">${totalVisits}</div>
                  <div class="stat-label">Total</div>
                </div>
                <div class="stat">
                  <div class="stat-val green">Rs.${(card.totalSaved||0).toLocaleString()}</div>
                  <div class="stat-label">Saved</div>
                </div>
              </div>

              ${isEligible ? `
                <div class="eligible-banner">
                  <div class="eligible-text">🎉 10% DISCOUNT READY!</div>
                </div>
              ` : ''}
            </div>

            <div class="back-footer">
              <div class="back-footer-text">kruncheez-pos.web.app</div>
              <div class="back-footer-text">✅ HALAL CERTIFIED • ${card.phone || ''}</div>
            </div>
          </div>

        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // Print ALL cards
  const printAllCards = () => {
    const cardsHTML = cards.map(card => {
      const visits = card.visits || 0;
      const tier = card.tier || 'Bronze';
      const tierEmojis = { Bronze: '🥉', Silver: '🥈', Gold: '🥇' };
      const isEligible = visits >= 10;

      const dotsHTML = Array.from({ length: 10 }, (_, i) => `
        <div style="width:38px;height:38px;border-radius:50%;background:${i < visits ? '#E31E24' : '#1A1A1A'};border:2px solid ${i < visits ? '#E31E24' : '#333'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:${i < visits ? '#fff' : '#555'}">${i < visits ? '✓' : i + 1}</div>
      `).join('');

      return `
        <div class="card">
          <div class="header">
            <div><div class="brand">🐂 THE KRUNCHEEZ</div><div class="tagline">FAST FOOD • CHINESE • BBQ</div></div>
            <div class="tier-badge">${tierEmojis[tier]} ${tier}</div>
          </div>
          <div class="body">
            <div><div class="card-id-label">Card Number</div><div class="card-id">${card.cardId}</div></div>
            <div><div class="customer-name">${card.userName || 'Customer'}</div><div class="customer-phone">${card.phone || ''}</div></div>
            <div class="divider"></div>
            <div>
              <div class="section-label">10 visits = 10% discount</div>
              <div class="dots">${dotsHTML}</div>
              <div class="progress-bg"><div class="progress-fill" style="width:${Math.min((visits/10)*100,100)}%"></div></div>
            </div>
            <div class="divider"></div>
            <div class="stats">
              <div class="stat-box"><div class="stat-val">${visits}/10</div><div class="stat-label">Current</div></div>
              <div class="stat-box"><div class="stat-val">${card.totalVisits||0}</div><div class="stat-label">Total</div></div>
              <div class="stat-box"><div class="stat-val amber">${card.points||0}</div><div class="stat-label">Points</div></div>
            </div>
            ${isEligible
              ? `<div class="eligible"><div class="eligible-text">🎉 10% DISCOUNT READY!</div></div>`
              : `<div class="pending"><div class="pending-text"><span>${10-visits}</span> more visit(s) for <span>10% discount</span></div></div>`
            }
          </div>
          <div class="footer">
            <div class="footer-text">kruncheez-pos.web.app</div>
            <div class="footer-text">✅ HALAL CERTIFIED</div>
          </div>
        </div>
      `;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>All Loyalty Cards - KrunchEez</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:Arial,sans-serif;background:#fff;}
        .grid{display:flex;flex-wrap:wrap;gap:0.2in;padding:0.25in;justify-content:center;}
        .card{width:3.5in;height:5.5in;background:#0A0A0A;border:3px solid #E31E24;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;page-break-inside:avoid;}
        .header{background:#E31E24;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;}
        .brand{color:white;font-size:17px;font-weight:900;letter-spacing:1px;}
        .tagline{color:rgba(255,255,255,0.8);font-size:8px;letter-spacing:2px;margin-top:2px;}
        .tier-badge{background:rgba(255,255,255,0.2);color:white;font-size:11px;font-weight:900;padding:4px 10px;border-radius:20px;}
        .body{padding:14px;flex:1;display:flex;flex-direction:column;gap:10px;}
        .card-id-label{color:#666;font-size:9px;letter-spacing:3px;text-transform:uppercase;}
        .card-id{color:#E31E24;font-size:20px;font-weight:900;letter-spacing:3px;margin-top:2px;}
        .customer-name{color:white;font-size:18px;font-weight:900;}
        .customer-phone{color:#888;font-size:11px;margin-top:2px;}
        .divider{height:1px;background:#222;}
        .section-label{color:#888;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
        .dots{display:flex;gap:4px;flex-wrap:wrap;}
        .progress-bg{height:5px;background:#1A1A1A;border-radius:3px;overflow:hidden;margin-top:6px;}
        .progress-fill{height:100%;background:#E31E24;border-radius:3px;}
        .stats{display:flex;gap:6px;}
        .stat-box{flex:1;background:#111;border:1px solid #222;border-radius:8px;padding:6px;text-align:center;}
        .stat-val{color:#E31E24;font-size:16px;font-weight:900;}
        .stat-val.amber{color:#F59E0B;}
        .stat-label{color:#666;font-size:7px;letter-spacing:1px;text-transform:uppercase;margin-top:1px;}
        .eligible{background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:6px;text-align:center;}
        .eligible-text{color:#10B981;font-size:11px;font-weight:900;}
        .pending{background:#111;border:1px solid #222;border-radius:8px;padding:6px;text-align:center;}
        .pending-text{color:#888;font-size:9px;}
        .pending-text span{color:#E31E24;font-weight:900;}
        .footer{background:#111;border-top:1px solid #222;padding:6px 14px;display:flex;justify-content:space-between;}
        .footer-text{color:#444;font-size:7px;letter-spacing:1px;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
      </style></head>
      <body><div class="grid">${cardsHTML}</div>
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    win.document.close();
  };

  // Manual issue card
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
        visits: 0,
        points: 0,
        totalVisits: 0,
        totalSaved: 0,
        discountPercent: 10,
        visitsForDiscount: 10,
        active: true,
        tier: 'Bronze',
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
  const totalCards    = cards.length;
  const activeCards   = cards.filter(c => c.active).length;
  const totalVisits   = cards.reduce((s, c) => s + (c.totalVisits || 0), 0);
  const totalSaved    = cards.reduce((s, c) => s + (c.totalSaved || 0), 0);
  const eligible      = cards.filter(c => (c.visits || 0) >= 10).length;

  return (
    <div>
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
          { label: 'Total Cards',  value: totalCards,                           icon: <Gift size={18} className="text-krunch-red" />,    bg: 'bg-krunch-red/10' },
          { label: 'Active',       value: activeCards,                          icon: <Star size={18} className="text-green-400" />,     bg: 'bg-green-400/10' },
          { label: 'Eligible Now', value: eligible,                             icon: <TrendingUp size={18} className="text-amber-400" />, bg: 'bg-amber-400/10' },
          { label: 'Total Visits', value: totalVisits,                          icon: <Users size={18} className="text-blue-400" />,     bg: 'bg-blue-400/10' },
          { label: 'Total Saved',  value: `Rs.${totalSaved.toLocaleString()}`,  icon: <TrendingUp size={18} className="text-purple-400" />, bg: 'bg-purple-400/10' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="font-heading font-black text-xl text-white">{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search by card ID, name, phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Cards Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Card ID', 'Customer', 'Tier', 'Visits', 'Points', 'Saved', 'Status', 'Actions'].map(h => (
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
                const eligible = (card.visits || 0) >= 10;
                return (
                  <motion.tr key={card.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-krunch-red text-sm tracking-wider">{card.cardId}</span>
                        {eligible && <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold">ELIGIBLE</span>}
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
                            <div key={j} className={`w-2 h-4 rounded-sm ${j < (card.visits || 0) ? 'bg-krunch-red' : 'bg-krunch-border'}`} />
                          ))}
                        </div>
                        <span className="text-white font-body text-xs font-bold">{card.visits || 0}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        <span className="text-amber-400 font-body font-bold text-sm">{card.points || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-body font-bold text-sm">Rs.{(card.totalSaved || 0).toLocaleString()}</td>
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
          <>
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
                className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl z-50 overflow-y-auto max-h-[90vh]"
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
                    Card will be issued with: <span className="text-white">0/10 visits</span>, <span className="text-white">Bronze tier</span>, <span className="text-white">10% discount after 10 visits</span>
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
          </>
        )}
      </AnimatePresence>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
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
                className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl z-50 overflow-y-auto max-h-[90vh]"
              >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Card Details</h3>
                <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6">
                {/* Card header */}
                <div className="bg-krunch-red rounded-xl p-4 mb-4 text-center">
                  <p className="font-heading font-black text-white text-2xl tracking-widest">{selected.cardId}</p>
                  <p className="text-red-200 font-body text-sm mt-1">{selected.userName}</p>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Current Visits', value: `${selected.visits || 0}/10` },
                    { label: 'Total Visits',   value: selected.totalVisits || 0 },
                    { label: 'Points',         value: selected.points || 0 },
                    { label: 'Total Saved',    value: `Rs.${(selected.totalSaved||0).toLocaleString()}` },
                    { label: 'Tier',           value: `${tierEmoji[selected.tier]} ${selected.tier}` },
                    { label: 'Status',         value: selected.active ? '✅ Active' : '❌ Inactive' },
                  ].map((s, i) => (
                    <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                      <p className="font-heading font-black text-krunch-red text-lg">{s.value}</p>
                      <p className="text-krunch-gray font-body text-[10px] uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Visit dots */}
                <div className="mb-4">
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Visit Progress</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i}
                        className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i < (selected.visits || 0) ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray'
                        }`}>
                        {i < (selected.visits || 0) ? '✓' : i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleAddVisit(selected)}
                    className="flex-1 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3 rounded-xl transition-all uppercase">
                    + Add Visit
                  </button>
                  <button onClick={() => { printCard(selected); }}
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCards;
