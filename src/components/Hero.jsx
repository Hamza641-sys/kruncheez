import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

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
    // Full screen background food image — crispy chicken zinger burger
    bgImg: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=1920&q=90&auto=format&fit=crop',
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
    // Hot deals — combo food spread (fries, drinks, chicken)
    bgImg: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1920&q=90&auto=format&fit=crop',
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
    bgImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=90&auto=format&fit=crop',
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
    bgImg: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=90&auto=format&fit=crop',
  },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

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

      {/* ══════════════════════════════════════════
          FULL SCREEN BACKGROUND FOOD IMAGE
          Changes with every slide
      ══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 z-0"
        >
          {/* The food image — full screen */}
          <img
            src={slide.bgImg}
            alt=""
            className="w-full h-full object-cover object-center"
            loading="eager"
          />

          {/* Dark overlay — left heavy so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/70 to-black/40" />

          {/* Extra dark top & bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

          {/* Subtle red tint overlay */}
          <div className="absolute inset-0 bg-krunch-red/5" />
        </motion.div>
      </AnimatePresence>

      {/* Red glow — top left corner */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-krunch-red/10 rounded-full blur-[120px] pointer-events-none z-[1]" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ══════════════════════════════════════════
          MAIN CONTENT — left aligned text
      ══════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 min-h-screen flex flex-col justify-center pt-28 pb-24">
        <div className="max-w-2xl">
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
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-5"
              >
                <div className="w-7 h-7 rounded-full border border-krunch-red flex items-center justify-center bg-black/50 flex-shrink-0">
                  <span className="text-krunch-red text-[10px] font-black font-heading">K</span>
                </div>
                <span className="text-krunch-red font-heading font-bold text-sm uppercase tracking-[0.25em]">
                  {slide.badge}
                </span>
              </motion.div>

              {/* Main Headline */}
              <div className="font-heading font-black leading-[0.88] mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-6xl sm:text-7xl lg:text-8xl xl:text-[6rem] text-white"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
                >
                  {slide.headline1}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="text-6xl sm:text-7xl lg:text-8xl xl:text-[6rem] text-white"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
                >
                  {slide.headline2}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-6xl sm:text-7xl lg:text-8xl xl:text-[6rem] text-krunch-red"
                  style={{ textShadow: '0 0 50px rgba(227,30,36,0.7), 0 4px 30px rgba(0,0,0,0.8)' }}
                >
                  {slide.headline3}
                </motion.div>
              </div>

              {/* Sub description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
                className="text-gray-300 font-body text-sm lg:text-base leading-relaxed mb-8 max-w-md"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
              >
                {slide.sub}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                <Link
                  to="/menu"
                  className="group flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm uppercase tracking-widest px-7 py-3.5 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(227,30,36,0.55)] hover:shadow-[0_0_50px_rgba(227,30,36,0.75)]"
                >
                  ORDER NOW
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/menu"
                  className="flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-heading font-bold text-sm uppercase tracking-widest px-7 py-3.5 rounded-full transition-all duration-300 backdrop-blur-sm bg-white/5 hover:bg-white/10"
                >
                  VIEW MENU
                </Link>
              </motion.div>

              {/* Tag pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.52 }}
                className="flex items-center gap-5"
              >
                {[slide.tag1, slide.tag2, slide.tag3].map((tag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-krunch-red shadow-[0_0_6px_rgba(227,30,36,0.8)]" />
                    <span className="text-gray-300 font-body text-sm font-medium"
                      style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                    >
                      {tag}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════
            BOTTOM: Slider Controls
        ══════════════════════════════════════════ */}
        <div className="flex items-center justify-between mt-14">

          {/* Slide dots */}
          <div className="flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-8 h-2.5 bg-krunch-red shadow-[0_0_10px_rgba(227,30,36,0.9)]'
                    : 'w-2.5 h-2.5 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/20 hover:border-krunch-red flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm bg-black/30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-krunch-red hover:bg-krunch-darkred flex items-center justify-center text-white transition-all duration-200 shadow-[0_0_15px_rgba(227,30,36,0.6)]"
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

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute bottom-6 right-8 z-20 flex flex-col items-center gap-1"
      >
        <div className="w-px h-10 bg-gradient-to-b from-krunch-red/60 to-transparent" />
        <span className="text-white/30 font-body text-[10px] uppercase tracking-[0.3em]">Scroll Down</span>
      </motion.div>
    </section>
  );
};

export default Hero;
