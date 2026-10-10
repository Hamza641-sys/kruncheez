import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Gift, Star, ArrowRight, Zap, TrendingUp,
  Download, Share2, CheckCircle, Clock, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCardByUserId, issueCard } from '../../firebase/cardService';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const VISITS_FOR_DISCOUNT = 10;

const tierConfig = {
  Bronze: { color: 'text-amber-700',  bg: 'from-amber-900/40 to-krunch-card', border: 'border-amber-700/40', badge: '🥉', next: 'Silver', nextAt: 20 },
  Silver: { color: 'text-gray-300',   bg: 'from-gray-700/30 to-krunch-card',  border: 'border-gray-500/40',  badge: '🥈', next: 'Gold',   nextAt: 50 },
  Gold:   { color: 'text-amber-400',  bg: 'from-yellow-900/40 to-krunch-card',border: 'border-amber-500/40', badge: '🥇', next: null,     nextAt: null },
};

const MyCardPage = () => {
  const { user, userData } = useAuth();
  const [card, setCard]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [issuing, setIssuing]   = useState(false);
  const [qrDataURL, setQrDataURL] = useState('');
  const cardRef = useRef(null);

  const fetchCard = async () => {
    if (!user) return;
    const c = await getCardByUserId(user.uid);
    setCard(c);
    if (c) {
      // Generate QR for card ID
      const url = await QRCode.toDataURL(c.cardId, {
        width: 180, margin: 1,
        color: { dark: '#000', light: '#fff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataURL(url);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCard(); }, [user]);

  const handleIssue = async () => {
    setIssuing(true);
    try {
      await issueCard(user.uid, userData?.name || user.displayName || 'Customer', userData?.phone || '');
      await fetchCard();
      toast.success('🎉 Loyalty card issued!', toastStyle);
    } catch { toast.error('Failed to issue card', toastStyle); }
    finally { setIssuing(false); }
  };

  const downloadCard = () => {
    if (!card) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0A0A0A';
    ctx.roundRect(0, 0, 800, 480, 24);
    ctx.fill();

    // Red top bar
    ctx.fillStyle = '#E31E24';
    ctx.roundRect(0, 0, 800, 80, [24, 24, 0, 0]);
    ctx.fill();

    // Brand name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('THE KRUNCHEEZ', 30, 52);
    ctx.font = '13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('LOYALTY CARD — FAST FOOD • CHINESE • BBQ', 30, 72);

    // Card number
    ctx.fillStyle = '#E31E24';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(card.cardId, 30, 130);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(card.userName || 'Customer', 30, 175);

    // Tier badge
    const tier = tierConfig[card.tier] || tierConfig.Bronze;
    ctx.fillStyle = '#1A1A1A';
    ctx.roundRect(30, 195, 120, 35, 8);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${tier.badge} ${card.tier}`, 45, 218);

    // Visit dots
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('VISITS TO 10% DISCOUNT', 30, 275);
    for (let i = 0; i < VISITS_FOR_DISCOUNT; i++) {
      const x = 30 + i * 52;
      const y = 300;
      ctx.beginPath();
      ctx.arc(x + 20, y, 18, 0, Math.PI * 2);
      ctx.fillStyle = i < (card.visits || 0) ? '#E31E24' : '#2A2A2A';
      ctx.fill();
      ctx.fillStyle = i < (card.visits || 0) ? '#fff' : '#555';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, x + 20, y + 5);
      ctx.textAlign = 'left';
    }

    // Points
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(card.points || 0, 30, 420);
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('POINTS', 30, 445);

    // Total visits
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(card.totalVisits || 0, 200, 420);
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('TOTAL VISITS', 200, 445);

    // Total saved
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Rs.${(card.totalSaved || 0).toLocaleString()}`, 400, 420);
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('TOTAL SAVED', 400, 445);

    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kruncheez-card-${card.cardId}.png`;
      a.click();
    });
    toast.success('Card downloaded!', toastStyle);
  };

  const shareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My KrunchEez Loyalty Card',
        text: `My KrunchEez Loyalty Card: ${card?.cardId} — ${card?.visits}/${VISITS_FOR_DISCOUNT} visits to 10% discount!`,
        url: 'https://kruncheez-pos.web.app',
      });
    } else {
      navigator.clipboard.writeText(`KrunchEez Loyalty Card: ${card?.cardId}`);
      toast.success('Card ID copied!', toastStyle);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-krunch-black flex items-center justify-center pt-20">
      <div className="w-12 h-12 border-2 border-krunch-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // No card yet
  if (!card) return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-krunch-red font-body text-sm uppercase tracking-widest mb-1 block">Loyalty Program</span>
          <h1 className="section-title text-white text-3xl">MY <span className="text-krunch-red">CARD</span></h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-dark p-8 text-center"
        >
          <div className="text-7xl mb-5">🃏</div>
          <h2 className="font-heading font-black text-2xl text-white uppercase mb-3">No Card Yet</h2>
          <p className="text-krunch-gray font-body text-sm mb-2">Get your free KrunchEez Loyalty Card and start earning rewards!</p>
          <div className="bg-krunch-black border border-krunch-border rounded-xl p-4 mb-6 text-left">
            {[
              '🎁 Get 1 card for free — instantly',
              '🏠 Earn visits with every dine-in order',
              '💰 10 visits = 10% discount on your bill',
              '⭐ Earn points with every order',
              '🥇 Unlock Bronze → Silver → Gold tiers',
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-krunch-border last:border-0">
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>
          <button onClick={handleIssue} disabled={issuing}
            className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black text-lg py-4 rounded-xl transition-all shadow-red-glow uppercase tracking-wider disabled:opacity-70">
            {issuing
              ? <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <><Gift size={20} /> Get My Free Card</>}
          </button>
        </motion.div>
      </div>
    </div>
  );

  const tier = tierConfig[card.tier] || tierConfig.Bronze;
  const visitPct = Math.min(((card.visits || 0) / VISITS_FOR_DISCOUNT) * 100, 100);
  const isEligible = (card.visits || 0) >= VISITS_FOR_DISCOUNT;

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        <div className="text-center mb-8">
          <span className="text-krunch-red font-body text-sm uppercase tracking-widest mb-1 block">Loyalty Program</span>
          <h1 className="section-title text-white text-3xl">MY <span className="text-krunch-red">CARD</span></h1>
        </div>

        {/* ── THE DIGITAL CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          ref={cardRef}
          className={`relative bg-gradient-to-br ${tier.bg} border-2 ${tier.border} rounded-3xl overflow-hidden mb-6 shadow-2xl`}
        >
          {/* Red header */}
          <div className="bg-krunch-red px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-heading font-black text-white text-xl tracking-widest">🐂 THE KRUNCHEEZ</p>
              <p className="text-red-200 text-[10px] tracking-widest uppercase">Loyalty Card — Fast Food • Chinese • BBQ</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <p className="text-white font-heading font-black text-sm">{tier.badge} {card.tier}</p>
            </div>
          </div>

          <div className="p-6">
            {/* Card ID + QR */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-krunch-gray font-body text-[10px] uppercase tracking-widest mb-1">Card Number</p>
                <p className="font-heading font-black text-2xl text-krunch-red tracking-widest">{card.cardId}</p>
                <p className="font-heading font-black text-xl text-white mt-2">{card.userName}</p>
                <p className="text-krunch-gray font-body text-xs">{card.phone}</p>
              </div>
              {qrDataURL && (
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <img src={qrDataURL} alt="Card QR" className="w-20 h-20" />
                  <p className="text-gray-500 text-[8px] text-center mt-1 font-body">Scan at checkout</p>
                </div>
              )}
            </div>

            {/* Visit Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">Visits to 10% Discount</p>
                <p className="font-heading font-black text-white text-sm">{card.visits}/{VISITS_FOR_DISCOUNT}</p>
              </div>
              {/* Dots */}
              <div className="flex gap-1.5 mb-2">
                {Array.from({ length: VISITS_FOR_DISCOUNT }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      i < (card.visits || 0)
                        ? 'bg-krunch-red text-white shadow-red-glow'
                        : 'bg-krunch-black border border-krunch-border text-krunch-gray'
                    }`}
                  >
                    {i < (card.visits || 0) ? '✓' : i + 1}
                  </motion.div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-krunch-black rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${visitPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-krunch-red rounded-full"
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Points',       value: card.points || 0,    color: 'text-amber-400', icon: '⭐' },
                { label: 'Total Visits', value: card.totalVisits || 0, color: 'text-white',   icon: '🏠' },
                { label: 'Total Saved',  value: `Rs.${(card.totalSaved || 0).toLocaleString()}`, color: 'text-green-400', icon: '💰' },
              ].map((s, i) => (
                <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className={`font-heading font-black text-lg ${s.color}`}>{s.value}</div>
                  <div className="text-krunch-gray font-body text-[9px] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Status */}
            {isEligible ? (
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-green-900/30 border border-green-700/40 rounded-xl p-4 text-center"
              >
                <p className="font-heading font-black text-green-400 text-lg uppercase">🎉 10% DISCOUNT READY!</p>
                <p className="text-green-300 font-body text-xs mt-1">Show this card at checkout to get your discount</p>
              </motion.div>
            ) : (
              <div className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                <p className="text-white font-body text-sm">
                  <span className="text-krunch-red font-bold">{VISITS_FOR_DISCOUNT - (card.visits || 0)}</span> more visit(s) for <span className="text-krunch-red font-bold">10% discount</span>
                </p>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="bg-krunch-black px-6 py-3 flex items-center justify-between border-t border-krunch-border">
            <p className="text-krunch-gray font-body text-[9px] uppercase tracking-widest">kruncheez-pos.web.app</p>
            <p className="text-krunch-gray font-body text-[9px] uppercase tracking-widest">✅ Halal Certified</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={downloadCard}
            className="flex items-center justify-center gap-2 bg-krunch-card border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm py-3 rounded-xl transition-all">
            <Download size={16} /> Download Card
          </button>
          <button onClick={shareCard}
            className="flex items-center justify-center gap-2 bg-krunch-card border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm py-3 rounded-xl transition-all">
            <Share2 size={16} /> Share Card
          </button>
        </div>

        {/* Tier Progress */}
        {tier.next && (
          <div className="card-dark p-5 mb-6">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Tier Progress</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl">{tier.badge}</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-white font-body font-semibold text-sm">{card.tier}</span>
                  <span className="text-krunch-gray font-body text-xs">{card.totalVisits}/{tier.nextAt} visits to {tier.next}</span>
                </div>
                <div className="h-2 bg-krunch-black rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(((card.totalVisits || 0) / tier.nextAt) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="text-3xl">{tierConfig[tier.next]?.badge}</div>
            </div>
            <p className="text-krunch-gray font-body text-xs text-center">
              {tier.nextAt - (card.totalVisits || 0)} more total visits to reach <span className="text-amber-400 font-semibold">{tier.next}</span> tier
            </p>
          </div>
        )}

        {/* How to Use */}
        <div className="card-dark p-5 mb-6">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">How to Use</h3>
          <div className="flex flex-col gap-3">
            {[
              { step: '01', text: 'Dine in or order online at KrunchEez', icon: '🍔' },
              { step: '02', text: 'Enter your card number at checkout (KC-XXXXX)', icon: '🃏' },
              { step: '03', text: 'Earn 1 visit + points with every order', icon: '⭐' },
              { step: '04', text: 'Complete 10 visits to unlock 10% discount', icon: '🎁' },
              { step: '05', text: 'Discount auto-applied on your 10th visit!', icon: '✅' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-krunch-red/10 border border-krunch-red/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-krunch-red font-heading font-black text-xs">{s.step}</span>
                </div>
                <span className="text-lg">{s.icon}</span>
                <p className="text-krunch-gray font-body text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link to="/menu"
          className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black text-base py-4 rounded-xl transition-all shadow-red-glow uppercase tracking-wider">
          <ShoppingBag size={18} /> Order Now & Earn Visit
        </Link>
      </div>
    </div>
  );
};

export default MyCardPage;
