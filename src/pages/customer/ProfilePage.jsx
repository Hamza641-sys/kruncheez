import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Camera, Shield, ArrowRight } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const ProfilePage = () => {
  const { user, userData, refreshUserData } = useAuth();
  const [form, setForm] = useState({
    name:  userData?.name  || user?.displayName || '',
    phone: userData?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update Firebase Auth display name
      await updateProfile(auth.currentUser, { displayName: form.name });
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name:  form.name,
        phone: form.phone,
      });
      await refreshUserData();
      toast.success('Profile updated!', toastStyle);
    } catch { toast.error('Failed to update profile', toastStyle); }
    finally { setLoading(false); }
  };

  const stats = [
    { label: 'Total Orders', value: userData?.totalOrders || 0, icon: '📦', color: 'text-blue-400' },
    { label: 'Total Spent',  value: `Rs.${(userData?.totalSpent || 0).toLocaleString()}`, icon: '💰', color: 'text-green-400' },
    { label: 'Loyalty Pts',  value: userData?.loyaltyPoints || 0, icon: '⭐', color: 'text-amber-400' },
    { label: 'Addresses',    value: userData?.addresses?.length || 0, icon: '📍', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <span className="text-krunch-red font-body text-sm uppercase tracking-widest mb-1 block">My Account</span>
          <h1 className="section-title text-white text-3xl">MY <span className="text-krunch-red">PROFILE</span></h1>
        </div>

        {/* Avatar Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card-dark p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-3xl flex-shrink-0">
                {form.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-krunch-card border border-krunch-border flex items-center justify-center">
                <Camera size={13} className="text-krunch-gray" />
              </div>
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white uppercase">{form.name || 'Customer'}</h2>
              <p className="text-krunch-gray font-body text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                  userData?.role === 'admin'
                    ? 'bg-krunch-red/20 text-krunch-red border border-krunch-red/30'
                    : 'bg-krunch-card border border-krunch-border text-krunch-gray'
                }`}>
                  {userData?.role || 'customer'}
                </span>
                {user?.emailVerified && (
                  <span className="text-xs bg-green-900/20 text-green-400 border border-green-700/30 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                    <Shield size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-dark p-3 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`font-heading font-black text-lg ${s.color}`}>{s.value}</div>
              <div className="text-krunch-gray font-body text-[9px] uppercase tracking-wider mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-dark p-6 mb-5">
          <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-5">Edit Profile</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-4">

            <div>
              <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                <input type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full bg-krunch-black border border-krunch-border rounded-xl pl-10 pr-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                <input type="email" value={user?.email || ''} disabled
                  className="w-full bg-krunch-black/50 border border-krunch-border rounded-xl pl-10 pr-4 py-3 text-krunch-gray font-body text-sm cursor-not-allowed" />
              </div>
              <p className="text-krunch-gray font-body text-xs mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
                <input type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                  className="w-full bg-krunch-black border border-krunch-border rounded-xl pl-10 pr-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3.5 rounded-xl transition-all uppercase tracking-wider shadow-red-glow disabled:opacity-70">
              {loading
                ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <><Save size={16} /> Save Changes</>
              }
            </button>
          </form>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📦', label: 'My Orders',       path: '/my-orders' },
            { icon: '📍', label: 'My Addresses',    path: '/addresses' },
            { icon: '⭐', label: 'Loyalty Points',  path: '/loyalty' },
            { icon: '🏠', label: 'Back to Home',    path: '/' },
          ].map((item, i) => (
            <Link key={i} to={item.path}
              className="card-dark p-4 flex items-center gap-3 group hover:border-krunch-red/50 transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-krunch-gray group-hover:text-white font-body font-semibold text-sm transition-colors flex-1">
                {item.label}
              </span>
              <ArrowRight size={14} className="text-krunch-gray group-hover:text-krunch-red transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
