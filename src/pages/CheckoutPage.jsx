import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle, ShoppingCart, MapPin, Phone,
  User, MessageSquare, ArrowLeft, Truck,
  Store, CreditCard, Tag, X, ArrowRight, QrCode
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../firebase/orderService';
import { validatePromoCode, usePromoCode } from '../firebase/promoService';
import { sendWhatsAppOrderNotification } from '../firebase/whatsappService';
import { getCardByCardId, addVisitAndPoints, applyCardDiscount, getCardByUserId } from '../firebase/cardService';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const categoryEmoji = {
  burgers: '🍔', bbq: '🔥', wraps: '🌯', pizza: '🍕',
  chinese: '🍜', pasta: '🍝', starters: '🍗', sandwich: '🥪',
  chicken: '🍗', soup: '🍲', platter: '🥘', deals: '🏷️',
};

const CheckoutPage = () => {
  const { cartItems, cartSubtotal, deliveryFee, cartTotal, clearCart } = useCart();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');

  const [form, setForm] = useState({
    name: '', phone: '', address: '', area: '',
    notes: '', paymentMethod: 'cash',
    orderType: tableNumber ? 'dine-in' : 'delivery',
  });
  const [promoCode, setPromoCode]           = useState('');
  const [promoResult, setPromoResult]       = useState(null);
  const [promoLoading, setPromoLoading]     = useState(false);
  const [cardNumber, setCardNumber]         = useState('');
  const [cardResult, setCardResult]         = useState(null);
  const [cardLoading, setCardLoading]       = useState(false);
  const [cardDiscount, setCardDiscount]     = useState(0);
  const [loading, setLoading]               = useState(false);
  const [ordered, setOrdered]               = useState(false);
  const [orderId, setOrderId]               = useState('');

  // Pre-fill form from logged-in user data
  useEffect(() => {
    if (userData) {
      setForm(prev => ({
        ...prev,
        name:    userData.name    || prev.name,
        phone:   userData.phone   || prev.phone,
        address: userData.addresses?.[0]
          ? `${userData.addresses[0].house}, ${userData.addresses[0].street}`
          : prev.address,
        area: userData.addresses?.[0]?.area || prev.area,
      }));
    }
  }, [userData]);

  const discount      = promoResult?.discount || 0;
  const finalSubtotal = cartSubtotal - discount - cardDiscount;
  const finalDelivery = form.orderType === 'delivery' ? deliveryFee : 0;
  const finalTotal    = Math.max(finalSubtotal + finalDelivery, 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Apply promo code
  const handlePromo = async () => {
    if (!promoCode.trim()) { toast.error('Enter a promo code', toastStyle); return; }
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoCode, cartSubtotal);
      if (result.valid) {
        setPromoResult(result);
        toast.success(result.message, toastStyle);
      } else {
        setPromoResult(null);
        toast.error(result.message, toastStyle);
      }
    } catch { toast.error('Could not validate code', toastStyle); }
    finally { setPromoLoading(false); }
  };

  const removePromo = () => { setPromoResult(null); setPromoCode(''); };

  // Apply loyalty card
  const handleCard = async () => {
    if (!cardNumber.trim()) { toast.error('Enter your card number', toastStyle); return; }
    setCardLoading(true);
    try {
      const card = await getCardByCardId(cardNumber);
      if (!card) { toast.error('Card not found', toastStyle); setCardLoading(false); return; }
      if (!card.active) { toast.error('This card is inactive', toastStyle); setCardLoading(false); return; }

      const visitsLeft = card.visitsForDiscount - card.visits;
      if (card.visits >= card.visitsForDiscount) {
        const disc = Math.floor((cartSubtotal * card.discountPercent) / 100);
        setCardResult(card);
        setCardDiscount(disc);
        toast.success(`🎉 ${card.discountPercent}% loyalty discount applied! (Rs.${disc} off)`, toastStyle);
      } else {
        setCardResult(card);
        setCardDiscount(0);
        toast(`Card found! ${visitsLeft} more visit(s) for ${card.discountPercent}% discount`, { icon: '🃏', ...toastStyle });
      }
    } catch { toast.error('Could not verify card', toastStyle); }
    finally { setCardLoading(false); }
  };

  const removeCard = () => { setCardResult(null); setCardDiscount(0); setCardNumber(''); };

  // Place order
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) { toast.error('Your cart is empty!', toastStyle); return; }
    setLoading(true);
    try {
      const orderData = {
        userId: user?.uid || null,
        customer: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          area: form.area,
        },
        tableNumber: tableNumber || null,
        items: cartItems.map(i => ({
          id: i.id, name: i.name, price: i.price,
          quantity: i.quantity, subtotal: i.price * i.quantity,
          category: i.category,
        })),
        summary: {
          subtotal:    cartSubtotal,
          discount:    discount,
          cardDiscount: cardDiscount,
          deliveryFee: finalDelivery,
          total:       finalTotal,
        },
        promoCode:     promoResult?.promo?.code || null,
        loyaltyCard:   cardResult?.cardId || null,
        orderType:     form.orderType,
        paymentMethod: form.paymentMethod,
        notes:         form.notes,
        status:        'pending',
      };

      const newOrderId = await placeOrder(orderData);

      // Use promo code (increment usage)
      if (promoResult?.promo?.id) {
        await usePromoCode(promoResult.promo.id);
      }

      // Process loyalty card
      if (cardResult?.id) {
        if (cardDiscount > 0) {
          // Applied 10% — reset visits
          await applyCardDiscount(cardResult.id, cartSubtotal);
        } else {
          // Just add visit + points
          await addVisitAndPoints(cardResult.id, finalTotal);
        }
      } else if (user?.uid) {
        // Auto-add visit to user's card if they have one
        const userCard = await getCardByUserId(user.uid);
        if (userCard?.id) await addVisitAndPoints(userCard.id, finalTotal);
      }

      // WhatsApp notification to admin
      try { sendWhatsAppOrderNotification(orderData, newOrderId); } catch {}

      setOrderId(newOrderId);
      setOrdered(true);
      clearCart();
      toast.success('Order placed! 🎉', toastStyle);
    } catch (err) {
      toast.error('Failed to place order. Try again.', toastStyle);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── ORDER SUCCESS ────────────────────────────────────────────────────────────
  if (ordered) {
    return (
      <div className="min-h-screen bg-krunch-black flex items-center justify-center pt-20 pb-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="max-w-md w-full card-dark p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={42} className="text-green-500" />
          </motion.div>

          <h2 className="font-heading font-black text-3xl text-white uppercase mb-2">Order Placed!</h2>
          <p className="text-krunch-gray font-body text-sm mb-6">
            Thank you, <span className="text-white font-semibold">{form.name}</span>! Your order is confirmed.
          </p>

          <div className="bg-krunch-black border border-krunch-border rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-3">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Order ID</span>
              <span className="font-heading font-bold text-krunch-red text-lg">#{orderId.slice(0,8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Status</span>
              <span className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full uppercase">Pending</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Payment</span>
              <span className="text-white font-body text-sm font-semibold">{form.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card'}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-krunch-border">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Total</span>
              <span className="text-krunch-red font-heading font-black text-xl">Rs. {finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-krunch-red/10 border border-krunch-red/20 rounded-xl p-4 mb-6">
            <p className="text-krunch-light font-body text-sm">
              🛵 Estimated delivery: <span className="text-white font-semibold">30–45 minutes</span>
            </p>
            <p className="text-krunch-gray font-body text-xs mt-1">
              We'll call you on <span className="text-white">{form.phone}</span> to confirm.
            </p>
          </div>

          <div className="flex gap-3">
            {user && (
              <Link to={`/track/${orderId}`} className="flex-1 btn-primary text-sm py-3 text-center flex items-center justify-center gap-2">
                <Truck size={14} /> Track Order
              </Link>
            )}
            <Link to="/" className="flex-1 btn-outline text-sm py-3 text-center">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── EMPTY CART ───────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-krunch-black flex items-center justify-center pt-20 pb-16 px-4">
        <div className="text-center">
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="font-heading font-bold text-2xl text-white uppercase mb-2">Your cart is empty</h2>
          <p className="text-krunch-gray font-body text-sm mb-6">Add some delicious items first!</p>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  // ── CHECKOUT FORM ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">
      <div className="bg-krunch-dark border-b border-krunch-border py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Link to="/menu" className="flex items-center gap-2 text-krunch-gray hover:text-white transition-colors font-body text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="h-5 w-px bg-krunch-border" />
          <div>
            <h1 className="font-heading font-black text-2xl text-white uppercase tracking-wider">Checkout</h1>
            <p className="text-krunch-gray font-body text-xs">{cartItems.reduce((s,i) => s + i.quantity, 0)} items in cart</p>
          </div>
          {tableNumber && (
            <div className="ml-auto flex items-center gap-2 bg-krunch-red/10 border border-krunch-red/30 px-4 py-2 rounded-xl">
              <QrCode size={16} className="text-krunch-red" />
              <span className="text-white font-heading font-bold text-sm">TABLE {tableNumber}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── LEFT: FORM ── */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Order Type */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <Truck size={18} className="text-krunch-red" /> Order Type
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'delivery', label: 'Home Delivery', icon: <Truck size={16} />, desc: 'Delivered to door' },
                    { value: 'pickup',   label: 'Self Pickup',   icon: <Store size={16} />, desc: 'Pick from branch' },
                    { value: 'dine-in',  label: 'Dine In',       icon: <QrCode size={16} />, desc: tableNumber ? `Table ${tableNumber}` : 'At restaurant' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, orderType: opt.value })}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        form.orderType === opt.value
                          ? 'border-krunch-red bg-krunch-red/10 text-white'
                          : 'border-krunch-border bg-krunch-black text-krunch-gray hover:border-krunch-red/50'
                      }`}>
                      <span className={form.orderType === opt.value ? 'text-krunch-red' : ''}>{opt.icon}</span>
                      <div>
                        <div className="font-body font-bold text-sm">{opt.label}</div>
                        <div className="font-body text-xs opacity-70">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Info */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <User size={18} className="text-krunch-red" /> Your Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'name',  label: 'Full Name *',     placeholder: 'Muhammad Ahmed', type: 'text' },
                    { name: 'phone', label: 'Phone Number *',  placeholder: '03XX-XXXXXXX',   type: 'tel' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                      <input type={f.type} name={f.name} required value={form[f.name]}
                        onChange={handleChange} placeholder={f.placeholder}
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              {form.orderType === 'delivery' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="card-dark p-6">
                  <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-krunch-red" /> Delivery Address
                  </h3>

                  {/* Saved addresses quick select */}
                  {userData?.addresses?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Saved Addresses</p>
                      <div className="flex flex-col gap-2">
                        {userData.addresses.map((addr, i) => (
                          <button key={i} type="button"
                            onClick={() => setForm({ ...form, address: `${addr.house}, ${addr.street}`, area: addr.area })}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              form.area === addr.area
                                ? 'border-krunch-red bg-krunch-red/10'
                                : 'border-krunch-border bg-krunch-black hover:border-krunch-red/50'
                            }`}>
                            <span className="text-lg">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}</span>
                            <div>
                              <p className="text-white font-body font-semibold text-xs">{addr.label}</p>
                              <p className="text-krunch-gray font-body text-xs">{addr.house}, {addr.street}, {addr.area}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-krunch-border" />
                        <span className="text-krunch-gray font-body text-xs">OR ENTER MANUALLY</span>
                        <div className="flex-1 h-px bg-krunch-border" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Area / Sector *</label>
                      <select name="area" value={form.area} onChange={handleChange} required
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red appearance-none cursor-pointer">
                        <option value="">Select your area</option>
                        <option>New Officers Housing Society</option>
                        <option>Bahria Town Rawalpindi</option>
                        <option>Chaklala</option>
                        <option>Satellite Town</option>
                        <option>Gulraiz Housing Society</option>
                        <option>Askari</option>
                        <option>Westridge</option>
                        <option>Saddar Rawalpindi</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Full Address *</label>
                      <textarea name="address" required value={form.address} onChange={handleChange}
                        rows={2} placeholder="House #, Street #, Block..."
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors resize-none" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-krunch-red" /> Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
                    { value: 'card', label: 'Card / Online',    icon: '💳', desc: 'Visa, Mastercard, JCB' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, paymentMethod: opt.value })}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        form.paymentMethod === opt.value
                          ? 'border-krunch-red bg-krunch-red/10 text-white'
                          : 'border-krunch-border bg-krunch-black text-krunch-gray hover:border-krunch-red/50'
                      }`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <div className="font-body font-bold text-sm">{opt.label}</div>
                        <div className="font-body text-xs opacity-70">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loyalty Card */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <span className="text-2xl">🃏</span> Loyalty Card
                </h3>
                {cardResult ? (
                  <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    cardDiscount > 0
                      ? 'bg-green-900/20 border-green-700/30'
                      : 'bg-amber-900/20 border-amber-700/30'
                  }`}>
                    <div>
                      <p className={`font-body font-bold text-sm ${cardDiscount > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                        {cardResult.cardId}
                      </p>
                      <p className={`font-body text-xs mt-0.5 ${cardDiscount > 0 ? 'text-green-300' : 'text-amber-300'}`}>
                        {cardDiscount > 0
                          ? `🎉 10% discount applied! Rs.${cardDiscount} off`
                          : `${cardResult.visitsForDiscount - cardResult.visits} more visit(s) for 10% discount`
                        }
                      </p>
                    </div>
                    <button onClick={removeCard} className="text-krunch-gray hover:text-red-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-3">
                      <input type="text" value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.toUpperCase())}
                        placeholder="Enter card no. e.g. KC-12345"
                        className="flex-1 bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-heading font-bold text-sm tracking-widest placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors uppercase" />
                      <button type="button" onClick={handleCard} disabled={cardLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-body font-bold text-sm px-5 rounded-xl transition-all disabled:opacity-70">
                        {cardLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    <p className="text-krunch-gray font-body text-xs mt-2">
                      🃏 10 visits = 10% discount on your order
                    </p>
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <Tag size={18} className="text-krunch-red" /> Promo Code
                </h3>
                {promoResult ? (
                  <div className="flex items-center justify-between bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-green-400 font-body font-bold text-sm">{promoResult.promo?.code}</p>
                      <p className="text-green-300 font-body text-xs">
                        Rs. {promoResult.discount} discount applied!
                      </p>
                    </div>
                    <button onClick={removePromo} className="text-krunch-gray hover:text-red-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input type="text" value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-heading font-bold text-sm tracking-widest placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors uppercase" />
                    <button type="button" onClick={handlePromo} disabled={promoLoading}
                      className="bg-krunch-red hover:bg-krunch-darkred text-white font-body font-bold text-sm px-5 rounded-xl transition-all disabled:opacity-70">
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-krunch-red" /> Special Instructions
                </h3>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  rows={3} placeholder="Any special requests? (e.g. extra spicy, no onions...)"
                  className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors resize-none" />
              </div>
            </div>

            {/* ── RIGHT: ORDER SUMMARY ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="card-dark overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-krunch-border bg-krunch-black">
                    <ShoppingCart size={16} className="text-krunch-red" />
                    <h3 className="font-heading font-bold text-base text-white uppercase tracking-wider">Your Order</h3>
                    <span className="ml-auto text-krunch-gray font-body text-xs">{cartItems.reduce((s,i) => s + i.quantity, 0)} items</span>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-4 max-h-64 overflow-y-auto flex flex-col gap-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-lg flex-shrink-0">
                          {categoryEmoji[item.category] || '🍴'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-white text-xs truncate">{item.name}</p>
                          <p className="text-krunch-gray text-xs">x{item.quantity}</p>
                        </div>
                        <span className="text-krunch-red font-heading font-bold text-sm flex-shrink-0">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="px-5 py-4 border-t border-krunch-border bg-krunch-black">
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex justify-between text-krunch-gray font-body text-sm">
                        <span>Subtotal</span>
                        <span className="text-white">Rs. {cartSubtotal.toLocaleString()}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-green-400">Promo Discount</span>
                          <span className="text-green-400 font-semibold">- Rs. {discount.toLocaleString()}</span>
                        </div>
                      )}
                      {cardDiscount > 0 && (
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-amber-400">Card Discount (10%)</span>
                          <span className="text-amber-400 font-semibold">- Rs. {cardDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-krunch-gray font-body text-sm">
                        <span>Delivery</span>
                        <span className={finalDelivery === 0 ? 'text-green-400 font-semibold' : 'text-white'}>
                          {finalDelivery === 0 ? 'Free' : `Rs. ${finalDelivery}`}
                        </span>
                      </div>
                      <div className="h-px bg-krunch-border my-1" />
                      <div className="flex justify-between font-heading font-black text-lg">
                        <span className="text-white">Total</span>
                        <span className="text-krunch-red">Rs. {finalTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black text-base py-4 rounded-xl transition-all duration-200 shadow-red-glow uppercase tracking-wider disabled:opacity-70">
                      {loading ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <><ArrowRight size={18} /> Place Order</>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="text-krunch-gray font-body text-xs">🔒 Secure Order</span>
                      <span className="text-krunch-border">•</span>
                      <span className="text-krunch-gray font-body text-xs">🛵 Free Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Help */}
                <div className="mt-4 card-dark p-4 text-center">
                  <p className="text-krunch-gray font-body text-xs mb-2">Need help with your order?</p>
                  <a href="tel:03177787648"
                    className="flex items-center justify-center gap-2 text-krunch-red font-body font-semibold text-sm hover:text-white transition-colors">
                    <Phone size={14} /> 0317-7787648
                  </a>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
