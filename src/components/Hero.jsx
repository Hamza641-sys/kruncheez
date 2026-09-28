import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

// Real food images from Unsplash (free, no attribution required for use)
const slides = [
  {
    id: 1,
    badge: 'THE KRUNCHEEZ',
    headline1: 'CRUNCH.',
    headline2: 'BITE.',
    headline3: 'OBSESSION.',
    sub: 'The ultimate destination for burgers, fried chicken, Chinese & BBQ. Fresh ingredients. Bold flavors. Always.',
    tag1: 'Fresh',
    tag2: 'Hot',
    tag3: 'Tasty',
    // Main hero food image - big burger
    mainImg: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=90&auto=format&fit=crop',
    // Side food image - fried chicken
    sideImg: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80&auto=format&fit=crop',
    // Background atmosphere
    bgImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=60&auto=format&fit=crop',
    topRight: 'Fresh\nHot\nTasty',
  },
  {
    id: 2,
    badge: 'HOT DEALS',
    headline1: 'BIGGER.',
    headline2: 'BETTER.',
    headline3: 'DEALS.',
    sub: '10 exclusive combo deals crafted for every craving. Save big, eat bigger. Order now!',
    tag1: 'Save',
    tag2: 'Big',
    tag3: 'Combos',
    mainImg: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=900&q=90&auto=format&fit=crop',
    sideImg: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=80&auto=format&fit=crop',
    bgImg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=60&auto=format&fit=crop',
    topRight: 'Best\nValue\nDeals',
  },
  {
    id: 3,
    badge: 'BBQ SPECIAL',
    headline1: 'SMOKY.',
    headline2: 'TENDER.',
    headline3: 'PERFECT.',
    sub: 'Authentic BBQ platters for 1 to 8 people. Angara, tikka, kabab — all on one table.',
    tag1: 'Smoky',
    tag2: 'Grilled',
    tag3: 'Fresh',
    mainImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=90&auto=format&fit=crop',
    sideImg: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&q=80&auto=format&fit=crop',
    bgImg: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1600&q=60&auto=format&fit=crop',
    topRight: 'Smoky\nGrilled\nFresh',
  },
  {
    id: 4,
    badge: 'PIZZA ZONE',
    headline1: 'LOADED.',
    headline2: 'CHEESY.',
    headline3: 'AMAZING.',
    sub: 'From 5" to XL — classic, stuffed & top trending pizzas with extra cheese. Made fresh every time.',
    tag1: 'Cheesy',
    tag2: 'Fresh',
    tag3: 'Loaded',
    mainImg: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=90&auto=format&fit=crop',
    sideImg: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=500&q=80&auto=format&fit=crop',
    bgImg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=60&auto=format&fit=crop',
    topRight: 'Cheesy\nLoaded\nHot',
  },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imgLoaded, setImgLoaded] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % slides.length);
  };

  const slide = slides[current];

  return (
    <section className="relative min-h-screen overflow-hidden bg-krunch-black">

      {/* ── BACKGROUND: dark restaurant atmosphere image ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 z-0"
        >
          <img
            src={slide.bgImg}
            alt=""
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Heavy dark overlay so text is readable */}
          <div className="absolute inset-0 bg-black/80" />
          {/* Red vignette from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-krunch-black to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── RED GLOW ACCENTS ── */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-krunch-red/10 rounded-full blur-[120px] pointer-events-none z-[1]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-krunch-red/8 rounded-full blur-[100px] pointer-events-none z-[1]" />

      {/* ── GRID TEXTURE ── */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 min-h-screen flex flex-col justify-center pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* ════ LEFT: TEXT ════ */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${current}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              >
                {/* Brand badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mb-5"
                >
                  {/* Mini bull logo */}
                  <div className="w-8 h-8 rounded-full border border-krunch-red flex items-center justify-center bg-black/60">
                    <span className="text-krunch-red text-xs font-black font-heading">K</span>
                  </div>
                  <span className="text-krunch-red font-heading font-bold text-sm uppercase tracking-[0.25em]">
                    {slide.badge}
                  </span>
                </motion.div>

                {/* Main Headline */}
                <div className="font-heading font-black leading-[0.9] mb-5">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] text-white drop-shadow-2xl"
                  >
                    {slide.headline1}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] text-white drop-shadow-2xl"
                  >
                    {slide.headline2}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] text-krunch-red drop-shadow-2xl"
                    style={{ textShadow: '0 0 40px rgba(227,30,36,0.6)' }}
                  >
                    {slide.headline3}
                  </motion.div>
                </div>

                {/* Sub text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.38 }}
                  className="text-gray-300 font-body text-sm lg:text-base leading-relaxed mb-7 max-w-md"
                >
                  {slide.sub}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-wrap gap-4 mb-8"
                >
                  <Link
                    to="/menu"
                    className="group flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm uppercase tracking-widest px-7 py-3.5 rounded-full transition-all duration-300 shadow-[0_0_25px_rgba(227,30,36,0.5)] hover:shadow-[0_0_40px_rgba(227,30,36,0.7)]"
                  >
                    ORDER NOW
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/menu"
                    className="flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-heading font-bold text-sm uppercase tracking-widest px-7 py-3.5 rounded-full transition-all duration-300 backdrop-blur-sm bg-white/5 hover:bg-white/10"
                  >
                    VIEW MENU
                  </Link>
                </motion.div>

                {/* Tag pills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.52 }}
                  className="flex items-center gap-3"
                >
                  {[slide.tag1, slide.tag2, slide.tag3].map((tag, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-krunch-red" />
                      <span className="text-gray-300 font-body text-xs font-medium">{tag}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ════ RIGHT: FOOD IMAGES ════ */}
          <div className="relative hidden lg:flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`food-${current}`}
                initial={{ opacity: 0, scale: 0.85, x: 60 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 40 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="relative w-full max-w-xl"
              >
                {/* ── MAIN FOOD IMAGE — big, center ── */}
                <div className="relative z-20">
                  {/* Glow behind food */}
                  <div className="absolute inset-0 rounded-full bg-krunch-red/20 blur-3xl scale-75 translate-y-8" />
                  <motion.img
                    animate={{ y: [0, -12, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    src={slide.mainImg}
                    alt="Featured food"
                    className="relative z-10 w-full max-w-[480px] mx-auto object-contain drop-shadow-[0_20px_60px_rgba(227,30,36,0.4)]"
                    style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* ── SIDE IMAGE — fried chicken, bottom right ── */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                  className="absolute -bottom-4 -right-4 w-40 h-40 z-30"
                >
                  <div className="absolute inset-0 rounded-full bg-krunch-red/15 blur-2xl" />
                  <img
                    src={slide.sideImg}
                    alt="Side food"
                    className="w-full h-full object-cover rounded-2xl border-2 border-krunch-red/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </motion.div>

                {/* ── TOP RIGHT: Brand + Tags ── */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute top-0 -right-8 z-30 text-right"
                >
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <div className="h-px w-8 bg-krunch-red" />
                    <span className="text-white/60 font-heading text-[10px] uppercase tracking-widest">THE</span>
                    <div className="h-px w-8 bg-krunch-red" />
                  </div>
                  <div className="font-heading font-black text-2xl text-white leading-none">KRUNCHEEZ</div>
                  <div className="text-krunch-gray text-[9px] font-body uppercase tracking-widest mt-0.5">Fast Food • Chinese • BBQ</div>
                  <div className="mt-3 flex flex-col gap-1 items-end">
                    {slide.topRight.split('\n').map((t, i) => (
                      <span key={i} className="font-heading font-bold text-lg text-white/80 leading-tight">{t}</span>
                    ))}
                  </div>
                </motion.div>

                {/* ── FLOATING BADGES ── */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute top-1/3 -left-6 z-30 bg-krunch-red text-white font-heading font-black text-xs px-3 py-2 rounded-xl shadow-[0_4px_20px_rgba(227,30,36,0.5)]"
                >
                  🛵 FREE DELIVERY
                </motion.div>

                <motion.div
                  animate={{ y: [0, 7, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1.5 }}
                  className="absolute bottom-16 -left-2 z-30 bg-black/80 border border-krunch-border backdrop-blur-sm text-white font-body text-xs px-3 py-2 rounded-xl"
                >
                  ✅ Halal Certified
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── BOTTOM CONTROLS ── */}
        <div className="flex items-center justify-between mt-10 lg:mt-6">

          {/* Dots */}
          <div className="flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-8 h-2.5 bg-krunch-red shadow-[0_0_10px_rgba(227,30,36,0.8)]'
                    : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Arrow controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/20 hover:border-krunch-red flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm bg-black/30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-krunch-red hover:bg-krunch-darkred flex items-center justify-center text-white transition-all duration-200 shadow-[0_0_15px_rgba(227,30,36,0.5)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Counter */}
          <div className="text-white/40 font-body text-sm tabular-nums">
            <span className="text-white font-bold">{String(current + 1).padStart(2, '0')}</span>
            <span className="mx-1">/</span>
            <span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* ── SCROLL DOWN INDICATOR ── */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
      >
        <span className="text-white/30 font-body text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-krunch-red/60 to-transparent" />
      </motion.div>
    </section>
  );
};

export default Hero;
