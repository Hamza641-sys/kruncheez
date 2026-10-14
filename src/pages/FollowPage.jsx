import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Social links — admin can update from Firebase
const DEFAULT_LINKS = {
  instagram: 'https://www.instagram.com/thekruncheez.peshawer/',
  tiktok:    'https://www.tiktok.com/@thekruncheez',   // update when available
  youtube:   '',
  facebook:  '',
};

const FollowPage = () => {
  const [links, setLinks]     = useState(DEFAULT_LINKS);
  const [scans, setScans]     = useState(0);
  const [clicked, setClicked] = useState(null);

  useEffect(() => {
    // Load social links from Firebase + increment scan count
    const load = async () => {
      try {
        const ref = doc(db, 'settings', 'social');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setLinks({ ...DEFAULT_LINKS, ...data.links });
          setScans(data.scanCount || 0);
          // Atomic increment — no race condition
          await updateDoc(ref, { scanCount: increment(1) });
        } else {
          // Create doc if doesn't exist
          await setDoc(ref, {
            links: DEFAULT_LINKS,
            scanCount: 1,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.log('Using default links');
      }
    };
    load();
  }, []);

  const handleClick = (platform) => {
    setClicked(platform);
    setTimeout(() => setClicked(null), 1000);
  };

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@thekruncheez.peshawer',
      url: links.instagram,
      color: 'from-purple-600 via-pink-500 to-orange-400',
      hoverShadow: '0 8px 30px rgba(236,72,153,0.5)',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      cta: 'Follow on Instagram',
      sub: 'See our latest food pics & videos',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: '@thekruncheez',
      url: links.tiktok,
      color: 'from-gray-900 via-gray-800 to-black',
      hoverShadow: '0 8px 30px rgba(255,255,255,0.2)',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
        </svg>
      ),
      cta: 'Follow on TikTok',
      sub: 'Watch our viral food content',
    },
  ];

  // Filter only platforms with URLs
  const activePlatforms = platforms.filter(p => p.url && p.url.length > 0);

  return (
    <div className="min-h-screen bg-krunch-black flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(227,30,36,0.1)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-krunch-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-krunch-red/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full border-3 border-krunch-red flex items-center justify-center bg-krunch-black mx-auto mb-4 shadow-red-glow"
            style={{ border: '3px solid #E31E24' }}
          >
            <span className="text-krunch-red font-heading font-black text-3xl">K</span>
          </motion.div>
          <h1 className="font-heading font-black text-3xl text-white uppercase tracking-wider">
            THE <span className="text-krunch-red">KRUNCHEEZ</span>
          </h1>
          <p className="text-krunch-gray font-body text-sm mt-1 tracking-widest uppercase">
            Fast Food • Chinese • BBQ
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-12 bg-krunch-red/40" />
            <p className="text-krunch-gray font-body text-xs uppercase tracking-widest">Follow Us</p>
            <div className="h-px w-12 bg-krunch-red/40" />
          </div>
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-4 mb-8">
          {activePlatforms.map((platform, i) => (
            <motion.a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(platform.id)}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-2xl p-px cursor-pointer block"
              style={{
                background: `linear-gradient(135deg, rgba(227,30,36,0.5), rgba(50,50,50,0.5))`,
              }}
            >
              <div className={`relative bg-gradient-to-r ${platform.color} rounded-2xl p-4 flex items-center gap-4`}>
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                  {platform.icon}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-white font-heading font-bold text-lg leading-none">{platform.cta}</p>
                  <p className="text-white/60 font-body text-xs mt-1">{platform.handle}</p>
                  <p className="text-white/40 font-body text-[10px] mt-0.5">{platform.sub}</p>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  {clicked === platform.id ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* Thank you */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="bg-krunch-card border border-krunch-border rounded-2xl p-5">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-white font-heading font-bold text-lg uppercase">
              Stay Connected!
            </p>
            <p className="text-krunch-gray font-body text-sm mt-1 leading-relaxed">
              Follow us for exclusive deals, new menu items & behind-the-scenes content!
            </p>
            <div className="mt-3 pt-3 border-t border-krunch-border">
              <p className="text-krunch-gray font-body text-xs">
                📍 Rawalpindi &nbsp;•&nbsp; 🕐 11am–2am &nbsp;•&nbsp; 🛵 Free Delivery
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-krunch-gray font-body text-[10px] uppercase tracking-widest">
            kruncheez-pos.web.app
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default FollowPage;
