import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { menuCategories } from '../../data/menuData';
import { Plus, Minus, Trash2, Printer, X, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const AdminPOS = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart]           = useState([]);
  const [activeCategory, setActive] = useState('burgers');
  const [search, setSearch]       = useState('');
  const [tableNo, setTableNo]     = useState('');
  const [customerName, setCustomerName] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [discount, setDiscount]   = useState(0);
  const [orderDone, setOrderDone] = useState(null);
  const [placing, setPlacing]     = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, 'menu'), where('available', '==', true)))
      .then(snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const displayed = search.trim()
    ? menuItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : menuItems.filter(i => i.category === activeCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = Math.round((subtotal * Math.min(discount, 100)) / 100);
  const total = subtotal - discountAmt;

  const placeOrder = async () => {
    if (cart.length === 0) { toast.error('Cart is empty!', toastStyle); return; }
    setPlacing(true);
    try {
      const orderData = {
        customer:      { name: customerName || 'Walk-in Customer', phone: '' },
        tableNumber:   tableNo || null,
        items:         cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.qty, subtotal: i.price * i.qty, category: i.category })),
        summary:       { subtotal, discount: discountAmt, deliveryFee: 0, total },
        orderType:     tableNo ? 'dine-in' : 'pickup',
        paymentMethod: payMethod,
        status:        'confirmed',
        source:        'pos',
        createdAt:     serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'orders'), orderData);
      setOrderDone({ id: ref.id, ...orderData });
      setCart([]); setTableNo(''); setCustomerName(''); setDiscount(0);
      toast.success('Order placed! 🎉', toastStyle);
    } catch { toast.error('Failed to place order', toastStyle); }
    finally { setPlacing(false); }
  };

  const printReceipt = (order) => {
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:monospace;font-size:12px;max-width:300px;margin:auto;padding:20px;}
    .center{text-align:center;}.bold{font-weight:bold;}.line{border-top:1px dashed #000;margin:8px 0;}.big{font-size:16px;font-weight:bold;}</style>
    </head><body>
    <div class="center big">THE KRUNCHEEZ</div>
    <div class="center">Fast Food • Chinese • BBQ</div>
    <div class="center">0317-7787648</div>
    <div class="line"></div>
    <div>Order: #${order.id.slice(0,8).toUpperCase()}</div>
    <div>Date: ${new Date().toLocaleString('en-PK')}</div>
    ${order.tableNumber ? `<div>Table: ${order.tableNumber}</div>` : ''}
    ${order.customer?.name ? `<div>Customer: ${order.customer.name}</div>` : ''}
    <div class="line"></div>
    ${order.items.map(i => `<div style="display:flex;justify-content:space-between"><span>${i.name} x${i.quantity}</span><span>Rs.${(i.price*i.quantity).toLocaleString()}</span></div>`).join('')}
    <div class="line"></div>
    <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>Rs.${order.summary.subtotal.toLocaleString()}</span></div>
    ${order.summary.discount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount</span><span>-Rs.${order.summary.discount.toLocaleString()}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between" class="bold"><span>TOTAL</span><span>Rs.${order.summary.total.toLocaleString()}</span></div>
    <div class="line"></div>
    <div class="center">Payment: ${order.paymentMethod === 'cash' ? 'Cash' : 'Card'}</div>
    <div class="center">Thank you for visiting!</div>
    <div class="center">kruncheez-pos.web.app</div>
    <script>window.onload=()=>{window.print();window.close();}</script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">POS - Point of Sale</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">Walk-in & table orders with instant billing</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Menu */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
            <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
          </div>

          {/* Category Tabs */}
          {!search && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
              {menuCategories.map(cat => (
                <button key={cat.id} onClick={() => setActive(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-body font-semibold text-xs transition-all ${
                    activeCategory === cat.id ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
                  }`}>
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayed.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <motion.button key={item.id} whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(item)}
                  className={`card-dark p-3 text-left group transition-all hover:border-krunch-red/50 relative ${inCart ? 'border-krunch-red/50' : ''}`}>
                  <div className="h-24 rounded-lg overflow-hidden bg-krunch-black mb-2">
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {menuCategories.find(c => c.id === item.category)?.icon || '🍴'}
                      </div>
                    )}
                  </div>
                  <p className="font-body font-bold text-white text-xs truncate">{item.name}</p>
                  <p className="text-krunch-red font-heading font-black text-base">Rs.{item.price.toLocaleString()}</p>
                  {inCart && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-krunch-red rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                      {inCart.qty}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Cart + Order */}
        <div className="flex flex-col gap-4">
          {/* Customer Info */}
          <div className="card-dark p-4">
            <h3 className="font-heading font-bold text-white text-sm uppercase mb-3">Order Info</h3>
            <div className="flex flex-col gap-2">
              <input type="text" placeholder="Customer Name (optional)" value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
              <input type="text" placeholder="Table No. (optional)" value={tableNo}
                onChange={e => setTableNo(e.target.value)}
                className="w-full bg-krunch-black border border-krunch-border rounded-xl px-3 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
            </div>
          </div>

          {/* Cart */}
          <div className="card-dark p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-white text-sm uppercase">Cart ({cart.length})</h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-krunch-gray hover:text-red-400 transition-colors text-xs font-body">Clear all</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-krunch-gray font-body text-sm">
                <div className="text-4xl mb-2">🛒</div>
                Click items to add
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-krunch-black rounded-xl p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-body text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-krunch-red font-body text-xs">Rs.{(item.price * item.qty).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all">
                        <Minus size={10} />
                      </button>
                      <span className="text-white font-bold text-xs w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-krunch-red flex items-center justify-center text-white transition-all">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="card-dark p-4">
            <h3 className="font-heading font-bold text-white text-sm uppercase mb-3">Bill</h3>
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex justify-between text-sm font-body">
                <span className="text-krunch-gray">Subtotal</span>
                <span className="text-white">Rs.{subtotal.toLocaleString()}</span>
              </div>
              {/* Discount */}
              <div className="flex items-center gap-2">
                <span className="text-krunch-gray font-body text-sm flex-1">Discount %</span>
                <input type="number" min="0" max="100" value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-20 bg-krunch-black border border-krunch-border rounded-lg px-2 py-1.5 text-white font-body text-sm text-center focus:outline-none focus:border-krunch-red" />
                <span className="text-green-400 font-body text-sm">-Rs.{discountAmt.toLocaleString()}</span>
              </div>
              <div className="h-px bg-krunch-border" />
              <div className="flex justify-between font-heading font-black text-lg">
                <span className="text-white">TOTAL</span>
                <span className="text-krunch-red">Rs.{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{k:'cash',l:'💵 Cash'},{k:'card',l:'💳 Card'}].map(p => (
                <button key={p.k} onClick={() => setPayMethod(p.k)}
                  className={`py-2 rounded-xl font-body font-bold text-sm transition-all ${payMethod === p.k ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white'}`}>
                  {p.l}
                </button>
              ))}
            </div>

            <button onClick={placeOrder} disabled={placing || cart.length === 0}
              className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-black py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">
              {placing ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : '🧾 Place Order & Print'}
            </button>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      <AnimatePresence>
        {orderDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOrderDone(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
              className="card-dark p-8 max-w-sm w-full text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="font-heading font-black text-2xl text-white uppercase mb-1">Order Placed!</h3>
              <p className="text-krunch-gray font-body text-sm mb-1">#{orderDone.id.slice(0,8).toUpperCase()}</p>
              <p className="text-krunch-red font-heading font-black text-3xl mb-6">Rs.{orderDone.summary.total.toLocaleString()}</p>
              <div className="flex gap-3">
                <button onClick={() => printReceipt(orderDone)}
                  className="flex-1 flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3 rounded-xl transition-all">
                  <Printer size={16} /> Print Receipt
                </button>
                <button onClick={() => setOrderDone(null)}
                  className="flex-1 btn-outline text-sm py-3">New Order</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPOS;
