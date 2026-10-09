import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const aspects = [
  { key: 'food', label: 'Food Quality' },
  { key: 'delivery', label: 'Delivery Speed' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'value', label: 'Value for Money' },
];

const StarRating = ({ value, onChange, size = 28 }) => (
  <div className="flex gap-1.5">
    {[1,2,3,4,5].map(star => (
      <button key={star} type="button" onClick={() => onChange(star)}
        className="transition-transform hover:scale-110 active:scale-95">
        <Star size={size} className={`transition-colors ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-krunch-border'}`} />
      </button>
    ))}
  </div>
);

const ReviewPage = () => {
  const { orderId } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratings, setRatings] = useState({ food: 0, delivery: 0, packaging: 0, value: 0 });
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

  const quickTags = ['Delicious!', 'Fast Delivery', 'Great Value', 'Hot & Fresh', 'Perfect Packaging', 'Will Order Again', 'Crispy Chicken', 'Best Pizza'];

  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please give an overall rating', toastStyle); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        orderId,
        userId: user.uid,
        userName: userData?.name || user.displayName || 'Customer',
        overallRating: rating,
        ratings,
        comment,
        tags,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      toast.success('Review submitted! Thanks 🎉', toastStyle);
    } catch { toast.error('Failed to submit review', toastStyle); }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="min-h-screen bg-krunch-black flex items-center justify-center pt-20 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full card-dark p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-400" />
        </motion.div>
        <h2 className="font-heading font-black text-2xl text-white uppercase mb-2">Thank You!</h2>
        <p className="text-krunch-gray font-body text-sm mb-6">Your review helps us serve you better 🔥</p>
        <div className="flex gap-3">
          <Link to="/my-orders" className="flex-1 btn-outline text-sm py-3 text-center">My Orders</Link>
          <Link to="/menu" className="flex-1 btn-primary text-sm py-3 text-center">Order Again</Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4">
        <Link to="/my-orders" className="flex items-center gap-2 text-krunch-gray hover:text-white transition-colors font-body text-sm mb-6">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="card-dark p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⭐</div>
            <h1 className="font-heading font-black text-2xl text-white uppercase mb-1">Rate Your Order</h1>
            <p className="text-krunch-gray font-body text-sm">Order #{orderId?.slice(0,8).toUpperCase()}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-3">Overall Experience *</p>
              <div className="flex justify-center">
                <StarRating value={rating} onChange={setRating} size={36} />
              </div>
              <p className="text-krunch-gray font-body text-xs mt-2">
                {rating === 0 ? 'Tap to rate' : ['', 'Poor 😞', 'Fair 😐', 'Good 😊', 'Great 😄', 'Amazing! 🤩'][rating]}
              </p>
            </div>

            {/* Aspect Ratings */}
            <div className="grid grid-cols-2 gap-3">
              {aspects.map(a => (
                <div key={a.key} className="bg-krunch-black border border-krunch-border rounded-xl p-3">
                  <p className="text-krunch-gray font-body text-xs mb-2">{a.label}</p>
                  <StarRating value={ratings[a.key]} onChange={v => setRatings({ ...ratings, [a.key]: v })} size={18} />
                </div>
              ))}
            </div>

            {/* Quick Tags */}
            <div>
              <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-3">Quick Tags</p>
              <div className="flex flex-wrap gap-2">
                {quickTags.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                      tags.includes(tag) ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:border-krunch-red/50 hover:text-white'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Your Comment</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                rows={4} placeholder="Tell us about your experience..."
                className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors resize-none" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-4 rounded-xl transition-all uppercase tracking-wider shadow-red-glow disabled:opacity-70">
              {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <><Send size={16} /> Submit Review</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
