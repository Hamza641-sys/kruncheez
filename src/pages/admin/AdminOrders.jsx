import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle, ChefHat, Truck, XCircle, Eye, X, QrCode, Printer, UtensilsCrossed, Pencil, Plus, Minus, Trash2 } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../firebase/orderService';
import { updateDoc, doc, getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { sendWhatsAppStatusUpdate, sendWhatsAppEditAlert } from '../../firebase/whatsappService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { printBill, printKitchen } from '../../utils/printUtils';


const statusConfig = {
  pending:          { label: 'Pending',        color: 'text-yellow-400', bg: 'bg-yellow-400/10  border-yellow-400/20', icon: <Clock size={12} /> },
  confirmed:        { label: 'Confirmed',       color: 'text-blue-400',   bg: 'bg-blue-400/10    border-blue-400/20',   icon: <CheckCircle size={12} /> },
  preparing:        { label: 'Preparing',       color: 'text-orange-400', bg: 'bg-orange-400/10  border-orange-400/20', icon: <ChefHat size={12} /> },
  out_for_delivery: { label: 'Out for Delivery',color: 'text-purple-400', bg: 'bg-purple-400/10  border-purple-400/20', icon: <Truck size={12} /> },
  delivered:        { label: 'Delivered',       color: 'text-green-400',  bg: 'bg-green-400/10   border-green-400/20',  icon: <CheckCircle size={12} /> },
  rejected:         { label: 'Rejected',        color: 'text-red-400',    bg: 'bg-red-400/10     border-red-400/20',    icon: <XCircle size={12} /> },
};

const nextStatus = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

// â”€â”€ Customer Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getCustomerBadge = (phone, allOrders) => {
  if (!phone) return { label: 'New', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
  const count = allOrders.filter(o =>
    o.customer?.phone === phone && o.status !== 'rejected'
  ).length;
  if (count >= 10) return { label: 'VIP',     color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', count };
  if (count >= 2)  return { label: 'â­ Regular', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', count };
  return               { label: 'New',     color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', count: 1 };
};

const CustomerBadge = ({ phone, allOrders }) => {
  const badge = getCustomerBadge(phone, allOrders);
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${badge.color}`}>
      {badge.label} {badge.count > 1 ? `(${badge.count} orders)` : ''}
    </span>
  );
};

// ── Customer Type Badge (Guest vs Registered) ──────────────────────────────
const CustomerTypeBadge = ({ userId }) => {
  if (!userId) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap text-orange-400 bg-orange-400/10 border-orange-400/20">
      👤 Guest
    </span>
  );
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap text-green-400 bg-green-400/10 border-green-400/20">
      ✅ Member
    </span>
  );
};

// Order type badge
const OrderTypeBadge = ({ orderType, tableNumber, source }) => {
  if (source === 'pos') return (
    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase">POS Counter</span>
  );
  if (orderType === 'dine-in' || tableNumber) return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
      <QrCode size={9} /> {tableNumber ? `Table ${tableNumber}` : 'Dine-In'}
    </span>
  );
  if (orderType === 'pickup') return (
    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase">Pickup</span>
  );
  return (
    <span className="text-[10px] bg-krunch-black border border-krunch-border text-krunch-gray px-2 py-0.5 rounded font-bold uppercase">Delivery</span>
  );
};

const AdminOrders = () => {
  const { userData } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  // Payment confirm modal
  const [payConfirm, setPayConfirm] = useState(null);
  // Edit order modal
  const [editOrder, setEditOrder]   = useState(null);
  const [editItems, setEditItems]   = useState([]);
  const [editSearch, setEditSearch] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  // Firestore menu items (live)
  const [liveMenu, setLiveMenu]     = useState([]);
  const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };


  useEffect(() => {
    const unsub = getAllOrders(setOrders);
    return () => unsub();
  }, []);

  // Load live menu from Firestore once
  useEffect(() => {
    getDocs(collection(db, 'menu')).then(snap => {
      setLiveMenu(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.available !== false));
    });
  }, []);

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchType   = typeFilter === 'all' ||
      (typeFilter === 'dine-in'  && (o.orderType === 'dine-in' || o.tableNumber)) ||
      (typeFilter === 'delivery' && o.orderType === 'delivery') ||
      (typeFilter === 'pickup'   && o.orderType === 'pickup') ||
      (typeFilter === 'guest'    && !o.userId) ||
      (typeFilter === 'member'   && !!o.userId);
    const matchSearch = !search || o.id.includes(search) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search) ||
      (o.tableNumber && String(o.tableNumber).includes(search));
    return matchFilter && matchSearch && matchType;
  });

  const handleStatus = async (orderId, status, order) => {
    // If marking as delivered - show payment confirm popup first
    if (status === 'delivered') {
      setPayConfirm({ orderId, order });
      setSelected(null);
      return;
    }
    await updateOrderStatus(orderId, status);
    if (order?.customer?.phone) {
      try { sendWhatsAppStatusUpdate(order.customer.phone, orderId, status); } catch {}
    }
    toast.success(`Order marked: ${status.replace(/_/g, ' ')}!`, toastStyle);
  };
  // Confirm delivery with payment method
  const handleDeliveryConfirm = async (paymentMethod) => {
    if (!payConfirm) return;
    const { orderId, order } = payConfirm;
    await updateOrderStatus(orderId, 'delivered', { paymentMethod });
    if (order?.customer?.phone) {
      try { sendWhatsAppStatusUpdate(order.customer.phone, orderId, 'delivered'); } catch {}
    }
    toast.success(`Order delivered! Payment: ${paymentMethod === 'cash' ? 'Cash' : 'Easypaisa'}`, toastStyle);
    setPayConfirm(null);
  };

  // ── Open Edit Modal ──
  const openEdit = (order) => {
    setEditItems(order.items.map(i => ({ ...i, quantity: i.quantity || i.qty || 1 })));
    setEditOrder(order);
    setEditSearch('');
    setSelected(null);
  };

  // ── Edit: change qty ──
  const editQty = (idx, delta) => {
    setEditItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const newQty = (it.quantity || 1) + delta;
      return newQty < 1 ? null : { ...it, quantity: newQty };
    }).filter(Boolean));
  };

  // ── Edit: remove item ──
  const editRemove = (idx) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Edit: add item from menu ──
  const editAddItem = (menuItem) => {
    setEditItems(prev => {
      const existing = prev.findIndex(it => it.id === menuItem.id);
      if (existing >= 0) {
        return prev.map((it, i) => i === existing ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1, category: menuItem.category, subtotal: menuItem.price }];
    });
  };

  // ── Edit: compute totals ──
  const editSubtotal = editItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const editDelivery = editOrder?.summary?.deliveryFee || 0;
  const editTotal    = editSubtotal + editDelivery;

  // ── Edit: save to Firestore ──
  const handleEditSave = async () => {
    if (editItems.length === 0) { toast.error('Order must have at least 1 item', toastStyle); return; }
    setEditSaving(true);
    try {
      const oldItems = editOrder.items;
      const updatedItems = editItems.map(it => ({ ...it, subtotal: it.price * it.quantity }));
      const editorName = userData?.name || userData?.email || 'Manager';

      // 1. Update order in Firestore
      await updateDoc(doc(db, 'orders', editOrder.id), {
        items: updatedItems,
        'summary.subtotal': editSubtotal,
        'summary.total': editTotal,
        lastEditedBy: editorName,
        lastEditedAt: serverTimestamp(),
      });

      // 2. Save edit log to orderEdits collection
      await addDoc(collection(db, 'orderEdits'), {
        orderId:    editOrder.id,
        orderShortId: editOrder.id.slice(0,8).toUpperCase(),
        customer:   editOrder.customer?.name || '—',
        editedBy:   editorName,
        editedAt:   serverTimestamp(),
        oldItems,
        newItems:   updatedItems,
        oldTotal:   editOrder.summary?.total || 0,
        newTotal:   editTotal,
      });

      // 3. WhatsApp alert to owner
      try { sendWhatsAppEditAlert(editorName, editOrder, oldItems, updatedItems); } catch {}

      toast.success('Order updated! Owner notified ✅', toastStyle);
      setEditOrder(null);
    } catch (e) {
      toast.error('Failed to save: ' + e.message, toastStyle);
    }
    setEditSaving(false);
  };

  // Table orders quick view — only valid tables 1-7
  const VALID_TABLES = [1, 2, 3, 4, 5, 6, 7];
  const dineInOrders = orders.filter(o =>
    (o.orderType === 'dine-in' || o.tableNumber) &&
    VALID_TABLES.includes(Number(o.tableNumber))
  );

  const filters = [
    { key: 'all', label: 'All' },
    ...Object.entries(statusConfig).map(([k, v]) => ({ key: k, label: v.label }))
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">Orders Management</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Dine-In Quick View */}
      {dineInOrders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length > 0 && (
        <div className="card-dark p-4 mb-5 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode size={16} className="text-amber-400" />
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">
              Active Dine-In Tables ({dineInOrders.filter(o => o.status !== 'delivered' && o.status !== 'rejected').length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {dineInOrders
              .filter(o => o.status !== 'delivered' && o.status !== 'rejected')
              .map(o => {
                const st = statusConfig[o.status] || statusConfig.pending;
                return (
                  <button key={o.id} onClick={() => setSelected(o)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${st.bg} transition-all hover:scale-105`}>
                    <span className={`font-heading font-black text-sm ${st.color}`}>
                      TABLE {o.tableNumber || '?'}
                    </span>
                    <span className={`text-[10px] font-bold ${st.color}`}>{st.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
          <input type="text" placeholder="Search by order ID, name, phone, table..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
        </div>
        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { key: 'all',      label: 'All Types' },
            { key: 'dine-in',  label: '🍽️ Dine-In' },
            { key: 'delivery', label: '🚗 Delivery' },
            { key: 'pickup',   label: '🏃 Pickup' },
            { key: 'guest',    label: '👤 Guest' },
            { key: 'member',   label: '✅ Member' },
          ].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl font-body font-semibold text-xs transition-all border ${
                typeFilter === t.key
                  ? t.key === 'guest'  ? 'bg-orange-600 border-orange-600 text-white'
                  : t.key === 'member' ? 'bg-green-700 border-green-700 text-white'
                  : 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-krunch-card border-krunch-border text-krunch-gray hover:text-white'
              }`}>
              {t.label}
              {(t.key === 'guest' || t.key === 'member') && (
                <span className="ml-1 opacity-70">
                  ({t.key === 'guest' ? orders.filter(o => !o.userId).length : orders.filter(o => !!o.userId).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-body font-semibold text-xs transition-all ${
              filter === f.key ? 'bg-krunch-red text-white' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            {f.label} {f.key !== 'all' && `(${orders.filter(o => o.status === f.key).length})`}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Order ID','Customer','Items','Total','Table/Type','Payment','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No orders found</td></tr>
              ) : filtered.map((order, i) => {
                const st = statusConfig[order.status] || statusConfig.pending;
                const next = nextStatus[order.status];
                return (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-body font-bold text-white text-sm">#{order.id.slice(0,8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-body text-sm">{order.customer?.name || 'â€”'}</p>
                      <p className="text-krunch-gray font-body text-xs">{order.customer?.phone || 'â€”'}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <CustomerTypeBadge userId={order.userId} />
                        <CustomerBadge phone={order.customer?.phone} allOrders={orders} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">{order.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-base whitespace-nowrap">Rs.{order.summary?.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <OrderTypeBadge orderType={order.orderType} tableNumber={order.tableNumber} source={order.source} />
                        {order.loyaltyCard && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">{order.loyaltyCard}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-body font-semibold ${order.paymentMethod === 'easypaisa' ? 'text-green-400' : 'text-krunch-gray'}`}>
                        {order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 ${st.color} ${st.bg} border px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
                        {st.icon} {st.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => setSelected(order)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                          <Eye size={12} />
                        </button>
                        <button onClick={() => openEdit(order)}
                          title="Edit Order"
                          className="w-7 h-7 rounded-lg bg-blue-900/20 border border-blue-700/30 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => printBill(order)}
                          title="Print Counter Bill"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-900/20 border border-green-700/30 text-green-400 hover:bg-green-600 hover:text-white font-body text-[10px] font-bold transition-all whitespace-nowrap">
                          <Printer size={11} /> Counter
                        </button>
                        <button onClick={() => printKitchen(order)}
                          title="Print Kitchen Slip"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-900/20 border border-orange-700/30 text-orange-400 hover:bg-orange-600 hover:text-white font-body text-[10px] font-bold transition-all whitespace-nowrap">
                          <UtensilsCrossed size={11} /> Kitchen
                        </button>
                        {next && (
                          <button onClick={() => handleStatus(order.id, next, order)}
                            className="px-2.5 py-1 rounded-lg bg-krunch-red hover:bg-krunch-darkred text-white font-body text-[10px] font-bold transition-all whitespace-nowrap">
                            â†’ {statusConfig[next]?.label}
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button onClick={() => handleStatus(order.id, 'rejected', order)}
                            className="w-7 h-7 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center text-red-400 hover:bg-red-700/30 transition-all">
                            <XCircle size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl z-50 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Order #{selected.id.slice(0,8).toUpperCase()}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => printBill(selected)}
                    className="flex items-center gap-1.5 bg-green-900/20 border border-green-700/30 hover:bg-green-600 text-green-400 hover:text-white font-body font-bold text-xs px-3 py-1.5 rounded-xl transition-all">
                    <Printer size={13} /> Counter
                  </button>
                  <button onClick={() => printKitchen(selected)}
                    className="flex items-center gap-1.5 bg-orange-900/20 border border-orange-700/30 hover:bg-orange-600 text-orange-400 hover:text-white font-body font-bold text-xs px-3 py-1.5 rounded-xl transition-all">
                    <UtensilsCrossed size={13} /> Kitchen
                  </button>
                  <button onClick={() => openEdit(selected)}
                    className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-700/30 hover:bg-blue-600 text-blue-400 hover:text-white font-body font-bold text-xs px-3 py-1.5 rounded-xl transition-all">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {/* Customer */}
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Customer</p>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-body font-semibold">{selected.customer?.name}</p>
                    <CustomerTypeBadge userId={selected.userId} />
                    <CustomerBadge phone={selected.customer?.phone} allOrders={orders} />
                  </div>
                  <p className="text-krunch-gray font-body text-sm">{selected.customer?.phone}</p>
                  {selected.customer?.address && <p className="text-krunch-gray font-body text-sm">{selected.customer.address}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <OrderTypeBadge orderType={selected.orderType} tableNumber={selected.tableNumber} source={selected.source} />
                    {selected.loyaltyCard && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">{selected.loyaltyCard}</span>
                    )}
                  </div>
                </div>
                {/* Items */}
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Items</p>
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-krunch-border last:border-0">
                      <span className="text-white font-body text-sm">{item.name} <span className="text-krunch-gray">x{item.quantity}</span></span>
                      <span className="text-krunch-red font-body font-bold text-sm">Rs.{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="bg-krunch-black rounded-xl p-4">
                  <div className="flex justify-between text-sm font-body mb-1"><span className="text-krunch-gray">Subtotal</span><span className="text-white">Rs.{selected.summary?.subtotal?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm font-body mb-2"><span className="text-krunch-gray">Delivery</span><span className="text-white">Rs.{selected.summary?.deliveryFee || 0}</span></div>
                  <div className="flex justify-between font-heading font-black text-lg"><span className="text-white">Total</span><span className="text-krunch-red">Rs.{selected.summary?.total?.toLocaleString()}</span></div>
                </div>
                {/* Status Actions */}
                {nextStatus[selected.status] && (
                  <button onClick={() => { handleStatus(selected.id, nextStatus[selected.status], selected); setSelected(null); }}
                    className="w-full bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3 rounded-xl transition-all uppercase tracking-wider">
                    Mark as {statusConfig[nextStatus[selected.status]]?.label}
                  </button>
                )}
                {selected.status === 'pending' && (
                  <button onClick={() => { handleStatus(selected.id, 'rejected', selected); setSelected(null); }}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-heading font-bold py-3 rounded-xl transition-all uppercase tracking-wider">
                    Reject Order
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* â”€â”€ PAYMENT CONFIRM MODAL â”€â”€ */}
      <AnimatePresence>
        {payConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm bg-krunch-dark border border-krunch-border rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-green-900/30 border-b border-green-700/30 px-6 py-4 text-center">
                <div className="text-3xl mb-1">âœ…</div>
                <h3 className="font-heading font-black text-white text-lg uppercase">Order Delivered!</h3>
                <p className="text-green-400 font-body text-sm mt-1">
                  #{payConfirm.orderId.slice(0,8).toUpperCase()} â€” Confirm payment received
                </p>
              </div>

              {/* Order info */}
              <div className="px-6 py-4 border-b border-krunch-border">
                <div className="flex justify-between text-sm font-body mb-1">
                  <span className="text-krunch-gray">Customer</span>
                  <span className="text-white font-semibold">{payConfirm.order?.customer?.name || 'â€”'}</span>
                </div>
                <div className="flex justify-between text-sm font-body mb-1">
                  <span className="text-krunch-gray">Amount</span>
                  <span className="text-krunch-red font-heading font-black text-base">
                    Rs.{payConfirm.order?.pricing?.total?.toLocaleString() || payConfirm.order?.summary?.total?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-krunch-gray">Customer selected</span>
                  <span className={`font-semibold ${payConfirm.order?.paymentMethod === 'easypaisa' ? 'text-green-400' : 'text-krunch-gray'}`}>
                    {payConfirm.order?.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash'}
                  </span>
                </div>
              </div>

              {/* Payment buttons */}
              <div className="p-6">
                <p className="text-krunch-gray font-body text-sm text-center mb-4">
                  Confirm actual payment received:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDeliveryConfirm('cash')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-krunch-border hover:border-krunch-red bg-krunch-black hover:bg-krunch-red/10 transition-all"
                  >
                    <span className="text-3xl"></span>
                    <span className="text-white font-heading font-bold text-sm uppercase">Cash</span>
                    <span className="text-krunch-gray font-body text-xs">Received cash</span>
                  </button>
                  <button
                    onClick={() => handleDeliveryConfirm('easypaisa')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-700/40 hover:border-green-500 bg-krunch-black hover:bg-green-900/20 transition-all"
                  >
                    <span className="text-3xl"></span>
                    <span className="text-white font-heading font-bold text-sm uppercase">Easypaisa</span>
                    <span className="text-krunch-gray font-body text-xs">Transfer received</span>
                  </button>
                </div>
                <button
                  onClick={() => setPayConfirm(null)}
                  className="w-full mt-3 text-krunch-gray hover:text-white font-body text-xs text-center transition-colors py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── EDIT ORDER MODAL ── */}
      <AnimatePresence>
        {editOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-krunch-dark border border-krunch-border rounded-2xl flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
                <div>
                  <h3 className="font-heading font-bold text-white uppercase">Edit Order</h3>
                  <p className="text-krunch-gray font-body text-xs mt-0.5">#{editOrder.id.slice(0,8).toUpperCase()} — {editOrder.customer?.name}</p>
                </div>
                <button onClick={() => setEditOrder(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">

                {/* Current Items */}
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Current Items</p>
                  {editItems.length === 0 && (
                    <p className="text-krunch-gray font-body text-sm text-center py-4">No items — add from menu below</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {editItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-krunch-black border border-krunch-border rounded-xl px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-body text-sm truncate">{item.name}</p>
                          <p className="text-krunch-red font-body text-xs">Rs.{item.price} each</p>
                        </div>
                        {/* Qty controls */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => editQty(idx, -1)}
                            className="w-7 h-7 rounded-lg bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all">
                            <Minus size={12} />
                          </button>
                          <span className="text-white font-body font-bold text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => editQty(idx, +1)}
                            className="w-7 h-7 rounded-lg bg-krunch-card border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white transition-all">
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-white font-body font-bold text-sm w-16 text-right">Rs.{(item.price * item.quantity).toLocaleString()}</p>
                        <button onClick={() => editRemove(idx)}
                          className="w-7 h-7 rounded-lg bg-red-900/20 border border-red-700/30 flex items-center justify-center text-red-400 hover:bg-red-700/40 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add from Menu */}
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Add Item from Menu</p>
                  <input type="text" placeholder="Search menu item..." value={editSearch}
                    onChange={e => setEditSearch(e.target.value)}
                    className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors mb-2" />
                  <div className="max-h-44 overflow-y-auto flex flex-col gap-1 pr-1">
                    {liveMenu
                      .filter(m => !editSearch || m.name.toLowerCase().includes(editSearch.toLowerCase()))
                      .map(m => (
                        <button key={m.id} onClick={() => editAddItem(m)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-krunch-black border border-krunch-border hover:border-krunch-red/50 hover:bg-krunch-red/5 transition-all text-left">
                          <span className="text-white font-body text-sm truncate flex-1">{m.name}</span>
                          <span className="text-krunch-red font-body text-xs ml-2 flex-shrink-0">Rs.{m.price}</span>
                          <Plus size={13} className="text-krunch-gray ml-2 flex-shrink-0" />
                        </button>
                      ))}
                  </div>
                </div>

                {/* Updated Total */}
                <div className="bg-krunch-black border border-krunch-border rounded-xl p-4">
                  <div className="flex justify-between text-sm font-body mb-1">
                    <span className="text-krunch-gray">Subtotal</span>
                    <span className="text-white">Rs.{editSubtotal.toLocaleString()}</span>
                  </div>
                  {editDelivery > 0 && (
                    <div className="flex justify-between text-sm font-body mb-1">
                      <span className="text-krunch-gray">Delivery</span>
                      <span className="text-white">Rs.{editDelivery}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-heading font-black text-lg border-t border-krunch-border pt-2 mt-1">
                    <span className="text-white">New Total</span>
                    <span className="text-krunch-red">Rs.{editTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-krunch-border flex gap-3">
                <button onClick={() => setEditOrder(null)}
                  className="flex-1 bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white font-heading font-bold py-3 rounded-xl transition-all text-sm">
                  Cancel
                </button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="flex-1 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-60">
                  {editSaving ? 'Saving...' : '✅ Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;



