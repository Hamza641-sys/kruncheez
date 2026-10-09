import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Phone, Clock, MapPin, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const AdminSettings = () => {
  const { userData } = useAuth();
  const [settings, setSettings] = useState({
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
  });

  const handleSave = () => {
    localStorage.setItem('kruncheez_settings', JSON.stringify(settings));
    toast.success('Settings saved!', toastStyle);
  };

  const Section = ({ icon, title, children }) => (
    <div className="card-dark p-6 mb-5">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-krunch-border">
        <div className="text-krunch-red">{icon}</div>
        <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
    <div>
      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-krunch-border last:border-0">
      <div>
        <p className="text-white font-body font-semibold text-sm">{label}</p>
        {desc && <p className="text-krunch-gray font-body text-xs mt-0.5">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? 'bg-krunch-red' : 'bg-krunch-border'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Settings</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">Manage restaurant configuration</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 btn-primary text-sm">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="max-w-2xl">
        {/* Restaurant Info */}
        <Section icon={<MapPin size={18} />} title="Restaurant Info">
          <div className="flex flex-col gap-4">
            <Field label="Restaurant Name" value={settings.restaurantName}
              onChange={v => setSettings({ ...settings, restaurantName: v })} />
            <Field label="Main Address" value={settings.address}
              onChange={v => setSettings({ ...settings, address: v })} />
          </div>
        </Section>

        {/* Contact */}
        <Section icon={<Phone size={18} />} title="Contact Numbers">
          <div className="grid grid-cols-3 gap-4">
            {['phone1','phone2','phone3'].map((p, i) => (
              <Field key={p} label={`Phone ${i+1}`} value={settings[p]}
                onChange={v => setSettings({ ...settings, [p]: v })} placeholder="03XX-XXXXXXX" />
            ))}
          </div>
        </Section>

        {/* Hours */}
        <Section icon={<Clock size={18} />} title="Opening Hours">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Time" value={settings.openTime} type="time"
              onChange={v => setSettings({ ...settings, openTime: v })} />
            <Field label="Closing Time" value={settings.closeTime} type="time"
              onChange={v => setSettings({ ...settings, closeTime: v })} />
          </div>
        </Section>

        {/* Delivery */}
        <Section icon={<MapPin size={18} />} title="Delivery Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delivery Fee (Rs.)" value={settings.deliveryFee} type="number"
              onChange={v => setSettings({ ...settings, deliveryFee: v })} />
            <Field label="Min Order (Rs.)" value={settings.minOrder} type="number"
              onChange={v => setSettings({ ...settings, minOrder: v })} />
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={<Bell size={18} />} title="Notifications">
          <Toggle label="WhatsApp Notifications" desc="Get new order alerts on WhatsApp"
            value={settings.whatsappNotify} onChange={v => setSettings({ ...settings, whatsappNotify: v })} />
          <Toggle label="Email Notifications" desc="Get order summaries via email"
            value={settings.emailNotify} onChange={v => setSettings({ ...settings, emailNotify: v })} />
        </Section>

        {/* System */}
        <Section icon={<Shield size={18} />} title="System">
          <Toggle label="Accepting Orders" desc="Disable to pause all online orders"
            value={settings.acceptingOrders} onChange={v => setSettings({ ...settings, acceptingOrders: v })} />
          <div className="mt-4 bg-krunch-black border border-krunch-border rounded-xl p-4">
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-white font-body font-semibold">{userData?.name}</p>
            <p className="text-krunch-gray font-body text-xs">{userData?.email}</p>
            <span className="inline-block mt-2 text-[10px] bg-krunch-red/20 text-krunch-red border border-krunch-red/30 px-2 py-0.5 rounded font-bold uppercase">Admin</span>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AdminSettings;
