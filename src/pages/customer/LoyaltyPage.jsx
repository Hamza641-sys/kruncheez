import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gift, Star, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const rewards = [
  { points: 100,  reward: 'Free Regular Drink',        icon: '🥤', color: 'from-blue-900/30 to-krunch-card' },
  { points: 250,  reward: 'Free Regular Fries',         icon: '🍟', color: 'from-amber-900/30 to-krunch-card' },
  { points: 500,  reward: 'Rs. 100 Discount',           icon: '💰', color: 'from-green-900/30 to-krunch-card' },
  { points: 750,  reward: 'Free Zinger Burger',         icon: '🍔', color: 'from-krunch-red/20 to-krunch-card' },
  { points: 1000, reward: 'Free Small Pizza',           icon: '🍕', color: 'from-purple-900/30 to-krunch-card' },
  { points: 1500, reward: 'Rs. 300 Discount',           icon: '🎁', color: 'from-amber-900/30 to-krunch-card' },
  { points: 2000, reward: 'Free Deal 1 Combo',          icon: '🌟', color: 'from-krunch-red/20 to-krunch-card' },
  { points: 5000, reward: 'Free Platter (1 Person)',    icon: '👑', color: 'from-yellow-900/30 to-krunch-card' },
];

const howItWorks = [
  { step: '01', title: 'Order Food', desc: 'Place any order on our website', icon: '🍔' },
  { step: '02', title: 'Earn Points', desc: 'Get 1 point for every Rs.10 spent', icon: '⭐' },
  { step: '03', title: 'Redeem', desc: 'Use points for free items & discounts', icon: '🎁' },
];

const LoyaltyPage = () => {
  const { userData } = useAuth();
  const points = userData?.loyaltyPoints || 0;
  const nextReward = rewards.find(r => r.points > points);
  const progressPct = nextReward ? Math.min((points / nextReward.points) * 100, 100) : 100;

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        {/* Hero Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-8 mb-8 overflow-hidden text-center"
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <Gift size={32} className="text-white mx-auto mb-3" />
            <p className="text-amber-200 font-body text-sm uppercase tracking-widest mb-2">Your Loyalty Points</p>
            <div className="font-heading font-black text-7xl text-white mb-1">{points.toLocaleString()}</div>
            <p className="text-amber-200 font-body text-sm">points earned</p>

            {nextReward && (
              <div className="mt-6 bg-black/20 rounded-xl p-4">
                <div className="flex justify-between text-sm font-body mb-2">
                  <span className="text-amber-200">Progress to: <span className="text-white font-semibold">{nextReward.reward}</span></span>
                  <span className="text-white font-bold">{points}/{nextReward.points}</span>
                </div>
                <div className="h-3 bg-amber-900/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <p className="text-amber-200 font-body text-xs mt-2">
                  {nextReward.points - points} more points needed
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* How it Works */}
        <div className="mb-10">
          <h2 className="section-title text-white text-2xl mb-6">HOW IT <span className="text-krunch-red">WORKS</span></h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {howItWorks.map((h, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-dark p-5 text-center"
              >
                <div className="text-4xl mb-3">{h.icon}</div>
                <div className="text-krunch-red font-heading font-black text-3xl mb-1">{h.step}</div>
                <h3 className="font-heading font-bold text-white uppercase text-sm mb-1">{h.title}</h3>
                <p className="text-krunch-gray font-body text-xs">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rewards List */}
        <div>
          <h2 className="section-title text-white text-2xl mb-6">AVAILABLE <span className="text-krunch-red">REWARDS</span></h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {rewards.map((r, i) => {
              const unlocked = points >= r.points;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`bg-gradient-to-br ${r.color} card-dark p-5 flex items-center gap-4 ${unlocked ? 'border-amber-500/40' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${unlocked ? 'bg-amber-500/20' : 'bg-krunch-black'}`}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-white text-base uppercase">{r.reward}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star size={12} className="text-amber-400" />
                      <span className="text-amber-400 font-body font-bold text-sm">{r.points} points</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {unlocked ? (
                      <button className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-body font-bold text-xs px-3 py-2 rounded-xl transition-all">
                        <Zap size={12} /> Redeem
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-krunch-gray font-body text-[10px]">Need</p>
                        <p className="text-white font-heading font-bold text-sm">{r.points - points}</p>
                        <p className="text-krunch-gray font-body text-[10px]">more</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-krunch-gray font-body text-sm mb-4">Start earning points with your next order!</p>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
            Order Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPage;
