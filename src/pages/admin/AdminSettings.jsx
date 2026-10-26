import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Phone, Clock, MapPin, Bell, Shield,
  Lock, Mail, Eye, EyeOff, RefreshCw, CheckCircle, Image
} from 'lucide-react';
import {
  doc, getDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import {
  updatePassword, updateEmail,
  EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const DEFAULT_SETTINGS = {
  restaurantName: 'The KrunchEez',
  phone1: '0317-7787648',
  phone2: '0308-4509090',
  phone3: '0335-6609178',
  openTime: '11:00',
  closeTime: '02:00',
  address: 'New Officers Housing Society, Boatclub Road, Rawalpindi',
  deliveryFee: '100',
  minOrder: '200',
  whatsappNotify: true,
  emailNotify: false,
  acceptingOrders: true,
  heroSlides: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=90&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=1920&q=90&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1920&q=90&auto=format&fit=crop',
  ],
};

const AdminSettings = () => {
  const { userData } = useAuth();
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Change Password state
  const [pwForm, setPwForm]       = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw]       = useState({ current: false, newPw: false, confirm: false });

  // Change Email state
  const [emailForm, setEmailForm]   = useState({ newEmail: '', password: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailPw, setShowEmailPw]   = useState(false);

  // ── Load settings from Firestore on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'appSettings', 'restaurant'));
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
        }
      } catch (e) {
        console.error('Settings load error:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  // ── Save settings to Firestore ──
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'appSettings', 'restaurant'), {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.email || '',
      });
      toast.success('✅ Settings saved to Firestore!', toastStyle);
    } catch (e) {
      toast.error('Save failed: ' + e.message, toastStyle);
    }
    setSaving(false);
  };

  // ── Re-authenticate helper ──
  const reauth = async (currentPassword) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  // ── Change Password ──
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current)        return toast.error('Please enter your current password', toastStyle);
    if (!pwForm.newPw)          return toast.error('Please enter a new password', toastStyle);
    if (pwForm.newPw.length < 6) return toast.error('Password must be at least 6 characters', toastStyle);
    if (pwForm.newPw !== pwForm.confirm) return toast.error('New passwords do not match', toastStyle);

    setPwLoading(true);
    try {
      await reauth(pwForm.current);
      await updatePassword(auth.currentUser, pwForm.newPw);
      toast.success('✅ Password updated successfully!', toastStyle);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        toast.error('Incorrect current password', toastStyle);
      } else {
        toast.error('Error: ' + e.message, toastStyle);
      }
    }
    setPwLoading(false);
  };

  // ── Change Email ──
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail)  return toast.error('Please enter a new email address', toastStyle);
    if (!emailForm.password)  return toast.error('Please confirm with your current password', toastStyle);
    if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) return toast.error('Please enter a valid email format', toastStyle);

    setEmailLoading(true);
    try {
      await reauth(emailForm.password);
      await updateEmail(auth.currentUser, emailForm.newEmail);
      toast.success('✅ Email updated successfully!', toastStyle);
      setEmailForm({ newEmail: '', password: '' });
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        toast.error('Incorrect password', toastStyle);
      } else if (e.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use', toastStyle);
      } else {
        toast.error('Error: ' + e.message, toastStyle);
      }
    }
    setEmailLoading(false);
  };

  // ── UI Helpers ──
  const Section = ({ icon, title, children }) => (
    <div className="card-dark p-6 mb-5">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-krunch-border">
        <div className="text-krunch-red">{icon}</div>
        <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
    <div>
      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );

  const PasswordField = ({ label, value, onChange, show, onToggle, placeholder = '••••••••' }) => (
    <div>
      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 pr-11 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-krunch-gray hover:text-white transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-krunch-border last:border-0">
      <div>
        <p className="text-white font-body font-semibold text-sm">{label}</p>
        {desc && <p className="text-krunch-gray font-body text-xs mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-krunch-red' : 'bg-krunch-border'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {[...Array(5)].map((_, i) => <div key={i} className="h-40 bg-krunch-card rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Settings</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">Restaurant configuration — changes are saved to Firestore</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 btn-primary text-sm disabled:opacity-60"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-2xl">

        {/* ── Restaurant Info ── */}
        <Section icon={<MapPin size={18} />} title="Restaurant Info">
          <div className="flex flex-col gap-4">
            <Field label="Restaurant Name" value={settings.restaurantName}
              onChange={v => setSettings({ ...settings, restaurantName: v })} />
            <Field label="Main Address" value={settings.address}
              onChange={v => setSettings({ ...settings, address: v })} />
          </div>
        </Section>

        {/* ── Contact Numbers ── */}
        <Section icon={<Phone size={18} />} title="Contact Numbers">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['phone1', 'phone2', 'phone3'].map((p, i) => (
              <Field key={p} label={`Phone ${i + 1}`} value={settings[p]}
                onChange={v => setSettings({ ...settings, [p]: v })} placeholder="03XX-XXXXXXX" />
            ))}
          </div>
        </Section>

        {/* ── Opening Hours ── */}
        <Section icon={<Clock size={18} />} title="Opening Hours">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Time" value={settings.openTime} type="time"
              onChange={v => setSettings({ ...settings, openTime: v })} />
            <Field label="Closing Time" value={settings.closeTime} type="time"
              onChange={v => setSettings({ ...settings, closeTime: v })} />
          </div>
        </Section>

        {/* ── Delivery Settings ── */}
        <Section icon={<MapPin size={18} />} title="Delivery Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delivery Fee (Rs.)" value={settings.deliveryFee} type="number"
              onChange={v => setSettings({ ...settings, deliveryFee: v })} />
            <Field label="Min Order (Rs.)" value={settings.minOrder} type="number"
              onChange={v => setSettings({ ...settings, minOrder: v })} />
          </div>
        </Section>

        {/* ── Notifications ── */}
        <Section icon={<Bell size={18} />} title="Notifications">
          <Toggle label="WhatsApp Notifications" desc="Get new order alerts on WhatsApp"
            value={settings.whatsappNotify} onChange={v => setSettings({ ...settings, whatsappNotify: v })} />
          <Toggle label="Email Notifications" desc="Get order summaries via email"
            value={settings.emailNotify} onChange={v => setSettings({ ...settings, emailNotify: v })} />
        </Section>

        {/* ── Hero Slides ── */}
        <Section icon={<Image size={18} />} title="Hero Slideshow Images">
          <p className="text-krunch-gray font-body text-xs mb-4">
            Change the background images of the 4 homepage hero slides. Paste any image URL — website updates instantly after saving.
          </p>
          <div className="flex flex-col gap-5">
            {[
              { index: 0, label: 'Slide 1 — Pizza Zone' },
              { index: 1, label: 'Slide 2 — BBQ Platters' },
              { index: 2, label: 'Slide 3 — Burgers' },
              { index: 3, label: 'Slide 4 — Chinese' },
            ].map(({ index, label }) => (
              <div key={index}>
                <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">
                  {label}
                </label>
                <div className="flex gap-3 items-start">
                  {/* Image preview */}
                  <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-krunch-border bg-krunch-black">
                    {settings.heroSlides?.[index] ? (
                      <img
                        src={settings.heroSlides[index]}
                        alt={label}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={20} className="text-krunch-gray/30" />
                      </div>
                    )}
                  </div>
                  {/* URL input */}
                  <input
                    type="text"
                    value={settings.heroSlides?.[index] || ''}
                    onChange={e => {
                      const updated = [...(settings.heroSlides || ['', '', '', ''])];
                      updated[index] = e.target.value;
                      setSettings({ ...settings, heroSlides: updated });
                    }}
                    placeholder="https://i.ibb.co/... or any image URL"
                    className="flex-1 bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-krunch-gray/50 font-body text-xs mt-3">
            💡 Tip: Click "Save Changes" above to apply. Recommended: landscape images (1920×1080 or wider).
          </p>
        </Section>

        {/* ── System ── */}
        <Section icon={<Shield size={18} />} title="System">
          <Toggle label="Accepting Orders" desc="Disable to pause all online orders"
            value={settings.acceptingOrders} onChange={v => setSettings({ ...settings, acceptingOrders: v })} />

          {/* Admin Info */}
          <div className="mt-4 bg-krunch-black border border-krunch-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-krunch-red flex items-center justify-center text-white font-heading font-black text-base flex-shrink-0">
              {userData?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-body font-semibold text-sm">{userData?.name}</p>
              <p className="text-krunch-gray font-body text-xs truncate">{auth.currentUser?.email}</p>
            </div>
            <span className="ml-auto text-[10px] bg-krunch-red/20 text-krunch-red border border-krunch-red/30 px-2 py-0.5 rounded font-bold uppercase flex-shrink-0">Admin</span>
          </div>
        </Section>

        {/* ── Change Password ── */}
        <Section icon={<Lock size={18} />} title="Change Password">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <PasswordField
              label="Current Password"
              value={pwForm.current}
              onChange={v => setPwForm({ ...pwForm, current: v })}
              show={showPw.current}
              onToggle={() => setShowPw({ ...showPw, current: !showPw.current })}
              placeholder="Enter your current password"
            />
            <PasswordField
              label="New Password"
              value={pwForm.newPw}
              onChange={v => setPwForm({ ...pwForm, newPw: v })}
              show={showPw.newPw}
              onToggle={() => setShowPw({ ...showPw, newPw: !showPw.newPw })}
              placeholder="New password (min 6 characters)"
            />
            <PasswordField
              label="Confirm New Password"
              value={pwForm.confirm}
              onChange={v => setPwForm({ ...pwForm, confirm: v })}
              show={showPw.confirm}
              onToggle={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
              placeholder="Confirm new password"
            />

            {/* Password strength hint */}
            {pwForm.newPw && (
              <div className="flex items-center gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                    i < Math.min(Math.floor(pwForm.newPw.length / 3), 4)
                      ? pwForm.newPw.length >= 10 ? 'bg-green-400' : pwForm.newPw.length >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                      : 'bg-krunch-border'
                  }`} />
                ))}
                <span className="text-xs font-body text-krunch-gray">
                  {pwForm.newPw.length < 6 ? 'Too short' : pwForm.newPw.length < 10 ? 'OK' : 'Strong'}
                </span>
              </div>
            )}

            {pwForm.newPw && pwForm.confirm && (
              <div className={`flex items-center gap-1.5 text-xs font-body ${pwForm.newPw === pwForm.confirm ? 'text-green-400' : 'text-red-400'}`}>
                <CheckCircle size={13} />
                {pwForm.newPw === pwForm.confirm ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-sm disabled:opacity-60"
            >
              {pwLoading ? <RefreshCw size={15} className="animate-spin" /> : <Lock size={15} />}
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Section>

        {/* ── Change Email ── */}
        <Section icon={<Mail size={18} />} title="Change Email">
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-amber-400 font-body text-xs font-semibold">
              Current Email: <span className="text-white">{auth.currentUser?.email}</span>
            </p>
          </div>
          <form onSubmit={handleChangeEmail} className="flex flex-col gap-4">
            <Field
              label="New Email Address"
              value={emailForm.newEmail}
              onChange={v => setEmailForm({ ...emailForm, newEmail: v })}
              type="email"
              placeholder="naya@email.com"
            />
            <PasswordField
              label="Confirm with Current Password"
              value={emailForm.password}
              onChange={v => setEmailForm({ ...emailForm, password: v })}
              show={showEmailPw}
              onToggle={() => setShowEmailPw(!showEmailPw)}
              placeholder="Enter your current password"
            />
            <button
              type="submit"
              disabled={emailLoading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-sm disabled:opacity-60"
            >
              {emailLoading ? <RefreshCw size={15} className="animate-spin" /> : <Mail size={15} />}
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </Section>

      </div>
    </div>
  );
};

export default AdminSettings;
