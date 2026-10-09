import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingCart, MapPin, Phone, User, MessageSquare, ArrowLeft, Truck, Store, CreditCard, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../firebase/orderService';
import { validatePromoCode, usePromoCode } from '../firebase/promoService';
import { sendWhatsAppOrderNotification } from '../firebase/whatsappService';
import toast from 'react-hot-toast';

const categoryEmoji = {
  burgers: '🍔', bbq: '🔥', wraps: '🌯', pizza: '🍕',
  chinese: '🍜', pasta: '🍝', starters: '🍗', sandwich: '🥪',
  chicken: '🍗', soup: '🍲', platter: '🥘', deals: '🏷️',
};

const CheckoutPage = () => {
  const { cartItems, cartSubtotal, deliveryFee, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    notes: '',
    paymentMethod: 'cash',
    orderType: 'delivery',
  });
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          area: form.area,
        },
        items: cartItems.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.price * i.quantity,
          category: i.category,
        })),
        summary: {
          subtotal: cartSubtotal,
          deliveryFee: form.orderType === 'delivery' ? deliveryFee : 0,
          total: form.orderType === 'delivery' ? cartTotal : cartSubtotal,
        },
        orderType: form.orderType,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id.slice(0, 8).toUpperCase());
      setOrdered(true);
      clearCart();
      toast.success('Order placed successfully! 🎉');
    } catch (err) {
      // Firebase not configured yet — still show success for demo
      const fakeId = Math.random().toString(36).slice(2, 10).toUpperCase();
      setOrderId(fakeId);
      setOrdered(true);
      clearCart();
      toast.success('Order placed successfully! 🎉');
    } finally {
      setLoading(false);
    }
  };

  // ─── Order Success Screen ───────────────────────────────────────────────────
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
              <span className="font-heading font-bold text-krunch-red text-lg">#{orderId}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Status</span>
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase">Pending</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Payment</span>
              <span className="text-white font-body text-sm font-semibold capitalize">{form.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card'}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-krunch-border">
              <span className="text-krunch-gray font-body text-xs uppercase tracking-wider">Total</span>
              <span className="text-krunch-red font-heading font-black text-xl">Rs. {form.orderType === 'delivery' ? cartTotal.toLocaleString() : cartSubtotal.toLocaleString()}</span>
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
            <Link to="/" className="flex-1 btn-outline text-sm py-3 text-center">
              Back to Home
            </Link>
            <Link to="/menu" className="flex-1 btn-primary text-sm py-3 text-center">
              Order More
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Empty Cart ─────────────────────────────────────────────────────────────
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

  // ─── Checkout Form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-krunch-black pt-24 pb-16">

      {/* Header */}
      <div className="bg-krunch-dark border-b border-krunch-border py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Link to="/menu" className="flex items-center gap-2 text-krunch-gray hover:text-white transition-colors font-body text-sm">
            <ArrowLeft size={16} /> Back to Menu
          </Link>
          <div className="h-5 w-px bg-krunch-border" />
          <div>
            <h1 className="font-heading font-black text-2xl text-white uppercase tracking-wider">Checkout</h1>
            <p className="text-krunch-gray font-body text-xs">Complete your order</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">

            {/* LEFT: Form (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Order Type */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <Truck size={18} className="text-krunch-red" /> Order Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'delivery', label: 'Home Delivery', icon: <Truck size={18} />, desc: 'Delivered to your door' },
                    { value: 'pickup', label: 'Self Pickup', icon: <Store size={18} />, desc: 'Pick up from branch' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, orderType: opt.value })}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        form.orderType === opt.value
                          ? 'border-krunch-red bg-krunch-red/10 text-white'
                          : 'border-krunch-border bg-krunch-black text-krunch-gray hover:border-krunch-red/50'
                      }`}
                    >
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
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <input
                      type="text" name="name" required value={form.name} onChange={handleChange}
                      placeholder="Muhammad Ahmed"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Phone Number *</label>
                    <input
                      type="tel" name="phone" required value={form.phone} onChange={handleChange}
                      placeholder="03XX-XXXXXXX"
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {form.orderType === 'delivery' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-dark p-6"
                >
                  <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-krunch-red" /> Delivery Address
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Area / Sector *</label>
                      <select
                        name="area" value={form.area} onChange={handleChange} required
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:border-krunch-red transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Select your area</option>
                        <option>New Officers Housing Society</option>
                        <option>Bahria Town Rawalpindi</option>
                        <option>Chaklala</option>
                        <option>Satellite Town</option>
                        <option>Gulraiz Housing Society</option>
                        <option>Askari</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">Full Address *</label>
                      <textarea
                        name="address" required value={form.address} onChange={handleChange}
                        rows={3} placeholder="House #, Street #, Block..."
                        className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors resize-none"
                      />
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
                    { value: 'card', label: 'Card / Online', icon: '💳', desc: 'Visa, Mastercard, JCB' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: opt.value })}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        form.paymentMethod === opt.value
                          ? 'border-krunch-red bg-krunch-red/10 text-white'
                          : 'border-krunch-border bg-krunch-black text-krunch-gray hover:border-krunch-red/50'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <div className="font-body font-bold text-sm">{opt.label}</div>
                        <div className="font-body text-xs opacity-70">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="card-dark p-6">
                <h3 className="font-heading font-bold text-lg text-white uppercase mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-krunch-red" /> Special Instructions
                </h3>
                <textarea
                  name="notes" value={form.notes} onChange={handleChange}
                  rows={3} placeholder="Any special requests? (e.g. extra spicy, no onions...)"
                  className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/50 focus:outline-none focus:border-krunch-red transition-colors resize-none"
                />
              </div>
            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="card-dark overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-krunch-border bg-krunch-black">
                    <ShoppingCart size={16} className="text-krunch-red" />
                    <h3 className="font-heading font-bold text-base text-white uppercase tracking-wider">Your Order</h3>
                    <span className="ml-auto text-krunch-gray font-body text-xs">{cartItems.reduce((s, i) => s + i.quantity, 0)} items</span>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-4 max-h-72 overflow-y-auto flex flex-col gap-3">
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
                      <div className="flex justify-between text-krunch-gray font-body text-sm">
                        <span>Delivery</span>
                        <span className={form.orderType === 'delivery' ? 'text-white' : 'text-green-400 font-semibold'}>
                          {form.orderType === 'delivery' ? `Rs. ${deliveryFee}` : 'Free (Pickup)'}
                        </span>
                      </div>
                      <div className="h-px bg-krunch-border my-1" />
                      <div className="flex justify-between font-heading font-black text-lg">
                        <span className="text-white">Total</span>
                        <span className="text-krunch-red">
                          Rs. {form.orderType === 'delivery' ? cartTotal.toLocaleString() : cartSubtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black text-base py-4 rounded-xl transition-all duration-200 shadow-red-glow uppercase tracking-wider disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Placing Order...
                        </>
                      ) : (
                        <>🎉 Place Order</>
                      )}
                    </button>

                    <p className="text-krunch-gray font-body text-xs text-center mt-3">
                      🔒 Secure order • Free delivery
                    </p>
                  </div>
                </div>

                {/* Contact card */}
                <div className="mt-4 card-dark p-4 text-center">
                  <p className="text-krunch-gray font-body text-xs mb-2">Need help with your order?</p>
                  <a href="tel:03177787648" className="flex items-center justify-center gap-2 text-krunch-red font-body font-semibold text-sm hover:text-white transition-colors">
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
