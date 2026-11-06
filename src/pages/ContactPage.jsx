import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRestaurantSettings } from '../hooks/useRestaurantSettings';

const ContactPage = () => {
  const s = useRestaurantSettings();
  const phones = [s.phone1, s.phone2, s.phone3].filter(Boolean);

  const contactInfo = [
    { icon: <Phone size={20} className="text-krunch-red" />, label: 'Phone', values: phones, links: true },
    { icon: <MapPin size={20} className="text-krunch-red" />, label: 'Address', values: [s.address], links: false },
    { icon: <Clock size={20} className="text-krunch-red" />, label: 'Hours', values: ['Monday – Sunday', `${s.openTime || '11:00 AM'} – ${s.closeTime || '2:00 AM'}`], links: false },
    { icon: <Mail size={20} className="text-krunch-red" />, label: 'Social', values: ['@thekruncheez', 'TikTok & YouTube'], links: false },
  ];
  const [form, setForm] = useState({ name: '', phone: '', subject: 'General Inquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, 'contactMessages'), {
        name:      form.name,
        phone:     form.phone,
        subject:   form.subject,
        message:   form.message,
        createdAt: serverTimestamp(),
        read:      false,
      });
      // Open WhatsApp to notify admin
      const msg = `📩 *New Contact Message - THE KRUNCHEEZ*\n\n` +
        `Name: ${form.name}\nPhone: ${form.phone}\nSubject: ${form.subject}\n\nMessage:\n${form.message}`;
      window.open(`https://wa.me/923177787648?text=${encodeURIComponent(msg)}`, '_blank');
      setSubmitted(true);
    } catch {
      setSubmitted(true); // still show success to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">

      {/* Header */}
      <div className="relative bg-krunch-dark border-b border-krunch-border py-14 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(227,30,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(227,30,36,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-krunch-red/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest mb-3 block">
              Get in Touch
            </span>
            <h1 className="section-title text-white mb-3">
              CONTACT <span className="text-krunch-red">US</span>
            </h1>
            <p className="text-krunch-gray font-body text-base max-w-md mx-auto">
              Have a question, feedback, or want to place a big order? We're always ready to help.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10">

          {/* LEFT: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading font-bold text-2xl text-white uppercase mb-6">
              Reach Out To Us
            </h2>

            <div className="flex flex-col gap-5 mb-8">
              {contactInfo.map((info, i) => (
                <div key={i} className="flex items-start gap-4 card-dark p-4 group hover:border-krunch-red/40 transition-all">
                  <div className="w-10 h-10 bg-krunch-red/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-krunch-red/20 transition-colors">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{info.label}</p>
                    {info.values.map((v, j) => (
                      info.links
                        ? <a key={j} href={`tel:${v.replace(/-/g, '')}`} className="block font-body font-semibold text-white hover:text-krunch-red transition-colors text-sm">{v}</a>
                        : <p key={j} className="font-body font-semibold text-white text-sm">{v}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm mb-4 tracking-wider">Follow Us</h3>
              <div className="flex gap-3">
                {[
                  { label: 'Instagram', color: 'hover:bg-pink-600', url: 'https://www.instagram.com/theTHE KRUNCHEEZ',
                    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  },
                  { label: 'Facebook', color: 'hover:bg-blue-600', url: 'https://www.facebook.com/theTHE KRUNCHEEZ',
                    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  },
                  { label: 'TikTok', color: 'hover:bg-neutral-700', url: 'https://www.tiktok.com/@thekruncheez',
                    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>
                  },
                  { label: 'YouTube', color: 'hover:bg-red-700', url: 'https://www.youtube.com/@thekruncheez',
                    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  },
                ].map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-xl bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white ${s.color} hover:border-transparent transition-all duration-200`} title={s.label}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-dark p-6 lg:p-8"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full py-12 text-center"
              >
                <CheckCircle size={60} className="text-green-500 mb-4" />
                <h3 className="font-heading font-bold text-2xl text-white uppercase mb-2">Message Sent!</h3>
                <p className="text-krunch-gray font-body text-sm max-w-xs">
                  Thanks for reaching out! We'll get back to you shortly.
                </p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', subject: 'General Inquiry', message: '' }); }}
                  className="btn-primary mt-6 text-sm">
                  Send Another
                </button>
              </motion.div>
            ) : (
              <>
                <h2 className="font-heading font-bold text-2xl text-white uppercase mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Your Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Muhammad Ahmed"
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="03XX-XXXXXXX"
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Subject</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors appearance-none cursor-pointer"
                    >
                      <option>General Inquiry</option>
                      <option>Bulk / Catering Order</option>
                      <option>Complaint / Feedback</option>
                      <option>Franchise Inquiry</option>
                      <option>Delivery Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Message *</label>
                    <textarea
                      name="message"
                      required
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-shine flex items-center justify-center gap-2 text-base py-4 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;


