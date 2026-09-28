import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    badge: 'The KrunchEez',
    headline1: 'CRUNCH.',
    headline2: 'BITE.',
    headline3: 'OBSESSION.',
    sub: 'The ultimate destination for burgers, fried chicken, Chinese & BBQ. Fresh ingredients. Bold flavors. Always.',
    cta1: { label: 'Order Now', path: '/menu' },
    cta2: { label: 'View Menu', path: '/menu' },
    tag1: 'Fresh',
    tag2: 'Hot',
    tag3: 'Tasty',
    accentColor: '#E31E24',
    bg: 'from-black via-black/90 to-black/60',
    emoji: '🍔',
  },
  {
    id: 2,
    badge: 'Hot Deals',
    headline1: 'BIGGER.',
    headline2: 'BETTER.',
    headline3: 'DEALS.',
    sub: '10 exclusive combo deals crafted for every craving. Save big, eat bigger.',
    cta1: { label: 'See Deals', path: '/offers' },
    cta2: { label: 'Order Now', path: '/menu' },
    tag1: 'Save',
    tag2: 'Big',
    tag3: 'Combos',
    accentColor: '#E31E24',
    bg: 'from-black via-black/90 to-black/60',
    emoji: '🏷️',
  },
  {
    id: 3,
    badge: 'BBQ Special',
    headline1: 'SMOKY.',
    headline2: 'TENDER.',
    headline3: 'PERFECT.',
    sub: 'Authentic BBQ platters for 1 to 8 people. Angara, tikka, kabab — all on one table.',
    cta1: { label: 'Order BBQ', path: '/menu' },
    cta2: { label: 'View Platters', path: '/menu' },
    tag1: 'Smoky',
    tag2: 'Grilled',
    tag3: 'Fresh',
    accentColor: '#E31E24',
    bg: 'from-black via-black/90 to-black/60',
    emoji: '🔥',
  },
  {
    id: 4,
    badge: 'Pizza Zone',
    headline1: 'LOADED.',
    headline2: 'CHEESY.',
    headline3: 'AMAZING.',
    sub: 'From 5" to XL — classic, stuff & top trending pizzas with extra cheese. Made fresh every time.',
    cta1: { label: 'Order Pizza', path: '/menu' },
    cta2: { label: 'See Sizes', path: '/menu' },
    tag1: 'Cheesy',
    tag2: 'Fresh',
    tag3: 'Loaded',
    accentColor: '#E31E24',
    bg: 'from-black via-black/90 to-black/60',
    emoji: '🍕',
  },
];

// Food image placeholder backgrounds with gradient overlays
const slideBgColors = [
  'radial-gradient(ellipse at 70% 50%, rgba(180,20,20,0.15) 0%, rgba(0,0,0,1) 60%)',
  'radial-gradient(ellipse at 70% 50%, rgba(180,80,20,0.12) 0%, rgba(0,0,0,1) 60%)',
  'radial-gradient(ellipse at 70% 50%, rgba(150,30,30,0.15) 0%, rgba(0,0,0,1) 60%)',
  'radial-gradient(ellipse at 70% 50%, rgba(180,20,60,0.12) 0%, rgba(0,0,0,1) 60%)',
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
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

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: slideBgColors[current], transition: 'background 1s ease' }}
    >
      {/* Background texture grid */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Red glow top-left */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-krunch-red/10 rounded-full blur-3xl pointer-events-none" />
      {/* Red glow bottom-right */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-krunch-red/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 w-full pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

          {/* LEFT: Text Content */}
          <div className="relative z-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`text-${current}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-krunch-red/20 border border-krunch-red/40 rounded-full px-4 py-1.5 mb-5">
                  <span className="text-lg">{slide.emoji}</span>
                  <span className="text-krunch-red font-body font-semibold text-sm uppercase tracking-widest">
                    {slide.badge}
                  </span>
                </div>

                {/* Headline */}
                <div className="font-heading font-black leading-none mb-6">
                  <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white">
                    {slide.headline1}
                  </div>
                  <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white">
                    {slide.headline2}
                  </div>
                  <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-krunch-red text-glow-red">
                    {slide.headline3}
                  </div>
                </div>

                {/* Sub */}
                <p className="text-krunch-gray text-base lg:text-lg leading-relaxed mb-8 max-w-md font-body">
                  {slide.sub}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 mb-10">
                  <Link
                    to={slide.cta1.path}
                    className="btn-primary btn-shine flex items-center gap-2 text-base px-7 py-3.5 shadow-red-glow hover:shadow-red-glow-lg"
                  >
                    {slide.cta1.label}
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to={slide.cta2.path}
                    className="btn-outline flex items-center gap-2 text-base px-7 py-3.5"
                  >
                    {slide.cta2.label}
                  </Link>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-3">
                  {[slide.tag1, slide.tag2, slide.tag3].map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-krunch-light text-sm font-body">
                      <span className="w-1.5 h-1.5 bg-krunch-red rounded-full inline-block" />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Visual / Food Display */}
          <div className="relative flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`visual-${current}`}
                custom={direction}
                variants={{
                  enter: (dir) => ({ x: dir > 0 ? 120 : -120, opacity: 0, scale: 0.9 }),
                  center: { x: 0, opacity: 1, scale: 1 },
                  exit: (dir) => ({ x: dir > 0 ? -120 : 120, opacity: 0, scale: 0.9 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative"
              >
                {/* Main circle glow */}
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px]">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-krunch-red/20 animate-pulse" />
                  <div className="absolute inset-4 rounded-full border border-krunch-red/10" />

                  {/* Center food display */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-krunch-card to-krunch-black border border-krunch-border flex items-center justify-center overflow-hidden">
                    <div className="text-center">
                      <div className="text-9xl sm:text-[10rem] lg:text-[12rem] animate-float select-none">
                        {slide.emoji}
                      </div>
                    </div>
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-krunch-red/5 to-transparent rounded-full" />
                  </div>

                  {/* Floating tag badges */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute top-4 right-0 bg-krunch-red text-white font-heading font-bold text-sm px-4 py-2 rounded-full shadow-red-glow"
                  >
                    FREE DELIVERY
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute bottom-8 left-0 bg-krunch-card border border-krunch-border text-white font-body font-semibold text-xs px-3 py-2 rounded-xl"
                  >
                    ✅ Halal Certified
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                    className="absolute top-1/2 -right-4 bg-krunch-card border border-krunch-red/30 text-krunch-red font-heading font-bold text-sm px-3 py-2 rounded-xl"
                  >
                    11am – 2am
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom: Slider Controls */}
        <div className="flex items-center justify-between mt-6">
          {/* Dots */}
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-8 h-2.5 bg-krunch-red'
                    : 'w-2.5 h-2.5 bg-krunch-border hover:bg-krunch-gray'
                }`}
              />
            ))}
          </div>

          {/* Arrow Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-krunch-border hover:border-krunch-red flex items-center justify-center text-krunch-gray hover:text-white transition-all duration-200"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-krunch-red hover:bg-krunch-darkred flex items-center justify-center text-white transition-all duration-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Slide Counter */}
          <div className="text-krunch-gray font-body text-sm">
            <span className="text-white font-bold">{String(current + 1).padStart(2, '0')}</span>
            <span className="mx-1">/</span>
            <span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-krunch-gray text-xs uppercase tracking-widest font-body">
        <span>Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-8 bg-gradient-to-b from-krunch-red to-transparent"
        />
      </div>
    </section>
  );
};

export default Hero;
