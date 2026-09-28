import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, Instagram, Facebook } from 'lucide-react';

const contactInfo = [
  { icon: <Phone size={20} className="text-krunch-red" />, label: 'Phone', values: ['0317-7787648', '0308-4509090', '0335-6609178'], links: true },
  { icon: <MapPin size={20} className="text-krunch-red" />, label: 'Address', values: ['New Officers Housing Society,', 'Boatclub Road, Rawalpindi'], links: false },
  { icon: <Clock size={20} className="text-krunch-red" />, label: 'Hours', values: ['Monday – Sunday', '11:00 AM – 2:00 AM'], links: false },
  { icon: <Mail size={20} className="text-krunch-red" />, label: 'Social', values: ['@thekruncheez', 'TikTok & YouTube'], links: false },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', phone: '', subject: 'General Inquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
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
                  { icon: <Instagram size={18} />, label: 'Instagram', color: 'hover:bg-pink-600' },
                  { icon: <Facebook size={18} />, label: 'Facebook', color: 'hover:bg-blue-600' },
                  { icon: <span className="text-sm font-bold">TT</span>, label: 'TikTok', color: 'hover:bg-black' },
                  { icon: <span className="text-sm font-bold">YT</span>, label: 'YouTube', color: 'hover:bg-red-700' },
                ].map((s, i) => (
                  <button key={i} className={`w-10 h-10 rounded-xl bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white ${s.color} hover:border-transparent transition-all duration-200`} title={s.label}>
                    {s.icon}
                  </button>
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
