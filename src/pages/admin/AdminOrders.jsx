import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, CheckCircle, ChefHat, Truck, XCircle, Eye, X, QrCode, Printer, UtensilsCrossed } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../firebase/orderService';
import { sendWhatsAppStatusUpdate } from '../../firebase/whatsappService';
import toast from 'react-hot-toast';

// â”€â”€ Print Both (Bill + Kitchen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const printBoth = (order) => {
  const date = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const billItemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:5px 0;font-size:13px;">${item.name}</td>
      <td style="padding:5px 0;font-size:13px;text-align:center;">x${item.quantity}</td>
      <td style="padding:5px 0;font-size:13px;text-align:right;">Rs.${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const kitchenItemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:6px 0;font-size:16px;font-weight:bold;">${item.name}</td>
      <td style="padding:6px 0;font-size:18px;font-weight:bold;text-align:right;">x${item.quantity}</td>
    </tr>
  `).join('');

  const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);

  const win = window.open('', '_blank', 'width=420,height=700');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print - #${order.id.slice(0,8).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .thick-line { border-top: 3px solid #000; margin: 8px 0; }
        .page-break { page-break-after: always; }
        .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
        .tagline { font-size: 10px; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
        .total-row td { font-weight: bold; font-size: 14px; padding-top: 6px; }
        .footer { font-size: 10px; margin-top: 4px; }
        @media print {
          body { margin: 0; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>

      <!-- ====== SLIP 1: CUSTOMER BILL ====== -->
      <div class="center">
        <div class="logo">THE KRUNCHEEZ</div>
        <div class="tagline">Fast Food â€¢ Chinese â€¢ BBQ</div>
        <div class="tagline">Peshawar, Pakistan</div>
      </div>
      <div class="line"></div>
      <div class="center bold" style="font-size:11px;">CUSTOMER RECEIPT</div>
      <div class="line"></div>
      <table>
        <tr><td style="font-size:11px;">Order ID</td><td style="text-align:right;font-size:11px;">#${order.id.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="font-size:11px;">Date</td><td style="text-align:right;font-size:11px;">${dateStr}</td></tr>
        <tr><td style="font-size:11px;">Time</td><td style="text-align:right;font-size:11px;">${timeStr}</td></tr>
        <tr><td style="font-size:11px;">Customer</td><td style="text-align:right;font-size:11px;">${order.customer?.name || 'â€”'}</td></tr>
        <tr><td style="font-size:11px;">Phone</td><td style="text-align:right;font-size:11px;">${order.customer?.phone || 'â€”'}</td></tr>
        <tr><td style="font-size:11px;">Type</td><td style="text-align:right;font-size:11px;">${order.tableNumber ? `Dine-In (Table ${order.tableNumber})` : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery'}</td></tr>
        <tr><td style="font-size:11px;">Payment</td><td style="text-align:right;font-size:11px;">${order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash'}</td></tr>
      </table>
      <div class="line"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${billItemsHtml}</tbody>
      </table>
      <div class="line"></div>
      <table>
        <tr><td style="font-size:12px;">Subtotal</td><td style="text-align:right;font-size:12px;">Rs.${(order.summary?.subtotal || 0).toLocaleString()}</td></tr>
        ${discount > 0 ? `<tr><td style="font-size:12px;">Discount</td><td style="text-align:right;font-size:12px;">- Rs.${discount.toLocaleString()}</td></tr>` : ''}
        ${(order.summary?.deliveryFee || 0) > 0 ? `<tr><td style="font-size:12px;">Delivery</td><td style="text-align:right;font-size:12px;">Rs.${order.summary.deliveryFee.toLocaleString()}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right;">Rs.${(order.summary?.total || 0).toLocaleString()}</td></tr>
      </table>
      <div class="line"></div>
      ${order.notes ? `<div style="font-size:11px;margin-bottom:6px;">Note: ${order.notes}</div><div class="line"></div>` : ""}
      <div class="center" style="font-size:11px;font-weight:bold;letter-spacing:1px;margin-bottom:2px;">NTN: 1730144554693</div>
      <div class="center" style="font-size:10px;color:#444;margin-bottom:6px;">TAX INVOICE | RTO PESHAWAR</div>
      <div class="line"></div>
      <div class="center footer">
        <div class="bold">Thank you for dining with us!</div>
        <div>Visit again soon!</div>
        <div>kruncheez-pos.web.app</div>
      </div

      <!-- PAGE BREAK between 2 slips -->
      <div class="page-break"></div>

      <!-- ====== SLIP 2: KITCHEN ORDER ====== -->
      <div class="center">
        <div style="font-size:13px;font-weight:bold;">â­ KITCHEN ORDER SLIP â­</div>
      </div>
      <div class="line"></div>
      <div class="center">
        <div style="font-size:22px;font-weight:bold;letter-spacing:2px;">#${order.id.slice(0,8).toUpperCase()}</div>
        <div style="font-size:13px;margin-top:4px;">Time: ${timeStr}</div>
      </div>
      <div class="line"></div>
      <table>
        <tr>
          <td style="font-size:13px;font-weight:bold;">ORDER TYPE</td>
          <td style="text-align:right;font-size:15px;font-weight:bold;">${order.tableNumber ? `ðŸª‘ TABLE ${order.tableNumber}` : order.orderType === 'pickup' ? 'ðŸƒ PICKUP' : 'ðŸ›µ DELIVERY'}</td>
        </tr>
        ${order.customer?.name ? `<tr><td style="font-size:12px;">Customer</td><td style="text-align:right;font-size:12px;">${order.customer.name}</td></tr>` : ''}
      </table>
      <div class="line"></div>
      <div style="font-size:13px;font-weight:bold;margin-bottom:6px;">ITEMS TO PREPARE:</div>
      <table>
        <tbody>${kitchenItemsHtml}</tbody>
      </table>
      <div class="line"></div>
      ${order.notes ? `
        <div style="font-size:13px;font-weight:bold;">âš ï¸ SPECIAL INSTRUCTIONS:</div>
        <div style="font-size:13px;margin-top:4px;padding:6px;border:2px solid #000;">${order.notes}</div>
        <div class="line"></div>
      ` : ''}
      <div class="center" style="font-size:11px;">
        Total Items: ${(order.items || []).reduce((s, i) => s + i.quantity, 0)}
      </div>

    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
};
const printBill = (order) => {
  const date = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:5px 0;font-size:13px;">${item.name}</td>
      <td style="padding:5px 0;font-size:13px;text-align:center;">x${item.quantity}</td>
      <td style="padding:5px 0;font-size:13px;text-align:right;">Rs.${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);

  const win = window.open('', '_blank', 'width=380,height=600');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - #${order.id.slice(0,8).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
        .tagline { font-size: 10px; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
        .total-row td { font-weight: bold; font-size: 14px; padding-top: 6px; }
        .footer { font-size: 10px; margin-top: 4px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="logo">THE KRUNCHEEZ</div>
        <div class="tagline">Fast Food â€¢ Chinese â€¢ BBQ</div>
        <div class="tagline">Peshawar, Pakistan</div>
      </div>
      <div class="line"></div>
      <div class="center bold" style="font-size:11px;">CUSTOMER RECEIPT</div>
      <div class="line"></div>
      <table>
        <tr><td style="font-size:11px;">Order ID</td><td style="text-align:right;font-size:11px;">#${order.id.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="font-size:11px;">Date</td><td style="text-align:right;font-size:11px;">${dateStr}</td></tr>
        <tr><td style="font-size:11px;">Time</td><td style="text-align:right;font-size:11px;">${timeStr}</td></tr>
        <tr><td style="font-size:11px;">Customer</td><td style="text-align:right;font-size:11px;">${order.customer?.name || 'â€”'}</td></tr>
        <tr><td style="font-size:11px;">Phone</td><td style="text-align:right;font-size:11px;">${order.customer?.phone || 'â€”'}</td></tr>
        <tr><td style="font-size:11px;">Type</td><td style="text-align:right;font-size:11px;">${order.tableNumber ? `Dine-In (Table ${order.tableNumber})` : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery'}</td></tr>
        <tr><td style="font-size:11px;">Payment</td><td style="text-align:right;font-size:11px;">${order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash'}</td></tr>
      </table>
      <div class="line"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="line"></div>
      <table>
        <tr><td style="font-size:12px;">Subtotal</td><td style="text-align:right;font-size:12px;">Rs.${(order.summary?.subtotal || 0).toLocaleString()}</td></tr>
        ${discount > 0 ? `<tr><td style="font-size:12px;">Discount</td><td style="text-align:right;font-size:12px;">- Rs.${discount.toLocaleString()}</td></tr>` : ''}
        ${(order.summary?.deliveryFee || 0) > 0 ? `<tr><td style="font-size:12px;">Delivery</td><td style="text-align:right;font-size:12px;">Rs.${order.summary.deliveryFee.toLocaleString()}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right;">Rs.${(order.summary?.total || 0).toLocaleString()}</td></tr>
      </table>
      <div class="line"></div>
      ${order.notes ? `<div style="font-size:11px;margin-bottom:6px;">Note: ${order.notes}</div>` : ''}
      <div class="center footer">
        <div class="bold">Thank you for dining with us!</div>
        <div>Visit again soon ðŸ”</div>
        <div>kruncheez-pos.web.app</div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

// â”€â”€ Print Kitchen Slip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const printKitchen = (order) => {
  const date = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:6px 0;font-size:16px;font-weight:bold;">${item.name}</td>
      <td style="padding:6px 0;font-size:18px;font-weight:bold;text-align:right;">x${item.quantity}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank', 'width=380,height=500');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen - #${order.id.slice(0,8).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 2px dashed #000; margin: 8px 0; }
        .order-id { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="center">
        <div style="font-size:13px;font-weight:bold;">â­ KITCHEN ORDER SLIP â­</div>
      </div>
      <div class="line"></div>
      <div class="center">
        <div class="order-id">#${order.id.slice(0,8).toUpperCase()}</div>
        <div style="font-size:13px;margin-top:4px;">Time: ${timeStr}</div>
      </div>
      <div class="line"></div>
      <table>
        <tr>
          <td style="font-size:13px;font-weight:bold;">ORDER TYPE</td>
          <td style="text-align:right;font-size:15px;font-weight:bold;">${order.tableNumber ? `ðŸª‘ TABLE ${order.tableNumber}` : order.orderType === 'pickup' ? 'ðŸƒ PICKUP' : 'ðŸ›µ DELIVERY'}</td>
        </tr>
        ${order.customer?.name ? `<tr><td style="font-size:12px;">Customer</td><td style="text-align:right;font-size:12px;">${order.customer.name}</td></tr>` : ''}
      </table>
      <div class="line"></div>
      <div style="font-size:13px;font-weight:bold;margin-bottom:6px;">ITEMS TO PREPARE:</div>
      <table>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="line"></div>
      ${order.notes ? `
        <div style="font-size:13px;font-weight:bold;">âš ï¸ SPECIAL INSTRUCTIONS:</div>
        <div style="font-size:13px;margin-top:4px;padding:6px;border:2px solid #000;">${order.notes}</div>
        <div class="line"></div>
      ` : ''}
      <div class="center" style="font-size:11px;">
        Total Items: ${(order.items || []).reduce((s, i) => s + i.quantity, 0)}
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

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
  if (!phone) return { label: 'ðŸ†• New', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
  const count = allOrders.filter(o =>
    o.customer?.phone === phone && o.status !== 'rejected'
  ).length;
  if (count >= 10) return { label: 'ðŸ‘‘ VIP',     color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', count };
  if (count >= 2)  return { label: 'â­ Regular', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', count };
  return               { label: 'ðŸ†• New',     color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', count: 1 };
};

const CustomerBadge = ({ phone, allOrders }) => {
  const badge = getCustomerBadge(phone, allOrders);
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${badge.color}`}>
      {badge.label} {badge.count > 1 ? `(${badge.count} orders)` : ''}
    </span>
  );
};

// Order type badge
const OrderTypeBadge = ({ orderType, tableNumber }) => {
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
  const [orders, setOrders]       = useState([]);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  // Payment confirm modal
  const [payConfirm, setPayConfirm] = useState(null); // { orderId, order }
  const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

  useEffect(() => {
    const unsub = getAllOrders(setOrders);
    return () => unsub();
  }, []);

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchType   = typeFilter === 'all' ||
      (typeFilter === 'dine-in' && (o.orderType === 'dine-in' || o.tableNumber)) ||
      (typeFilter === 'delivery' && o.orderType === 'delivery') ||
      (typeFilter === 'pickup' && o.orderType === 'pickup');
    const matchSearch = !search || o.id.includes(search) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search) ||
      (o.tableNumber && String(o.tableNumber).includes(search));
    return matchFilter && matchSearch && matchType;
  });

  const handleStatus = async (orderId, status, order) => {
    // If marking as delivered â€” show payment confirm popup first
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
    toast.success(`Order delivered! Payment: ${paymentMethod === 'cash' ? 'ðŸ’µ Cash' : 'ðŸ“± Easypaisa'}`, toastStyle);
    setPayConfirm(null);
  };

  // Table orders quick view
  const dineInOrders = orders.filter(o => o.orderType === 'dine-in' || o.tableNumber);

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
        <div className="flex gap-2">
          {[
            { key: 'all',      label: 'All Types' },
            { key: 'dine-in',  label: 'ðŸª‘ Dine-In' },
            { key: 'delivery', label: 'ðŸ›µ Delivery' },
            { key: 'pickup',   label: 'ðŸƒ Pickup' },
          ].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl font-body font-semibold text-xs transition-all border ${
                typeFilter === t.key
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-krunch-card border-krunch-border text-krunch-gray hover:text-white'
              }`}>
              {t.label}
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
                      <div className="mt-1">
                        <CustomerBadge phone={order.customer?.phone} allOrders={orders} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-krunch-gray font-body text-sm">{order.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-krunch-red font-heading font-black text-base whitespace-nowrap">Rs.{order.summary?.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <OrderTypeBadge orderType={order.orderType} tableNumber={order.tableNumber} />
                        {order.loyaltyCard && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">ðŸƒ {order.loyaltyCard}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-body font-semibold ${order.paymentMethod === 'easypaisa' ? 'text-green-400' : 'text-krunch-gray'}`}>
                        {order.paymentMethod === 'easypaisa' ? 'ðŸ“± Easypaisa' : 'ðŸ’µ Cash'}
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
                        <button onClick={() => printBoth(order)}
                          title="Print Bill + Kitchen Slip"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-900/20 border border-green-700/30 text-green-400 hover:bg-green-600 hover:text-white font-body text-[10px] font-bold transition-all whitespace-nowrap">
                          <Printer size={11} /> Print
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
                  <button onClick={() => printBoth(selected)}
                    className="flex items-center gap-1.5 bg-green-900/20 border border-green-700/30 hover:bg-green-600 text-green-400 hover:text-white font-body font-bold text-xs px-3 py-1.5 rounded-xl transition-all">
                    <Printer size={13} /> Print Bill + Kitchen
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
                    <CustomerBadge phone={selected.customer?.phone} allOrders={orders} />
                  </div>
                  <p className="text-krunch-gray font-body text-sm">{selected.customer?.phone}</p>
                  {selected.customer?.address && <p className="text-krunch-gray font-body text-sm">{selected.customer.address}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <OrderTypeBadge orderType={selected.orderType} tableNumber={selected.tableNumber} />
                    {selected.loyaltyCard && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">ðŸƒ {selected.loyaltyCard}</span>
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
                    {payConfirm.order?.paymentMethod === 'easypaisa' ? 'ðŸ“± Easypaisa' : 'ðŸ’µ Cash'}
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
                    <span className="text-3xl">ðŸ’µ</span>
                    <span className="text-white font-heading font-bold text-sm uppercase">Cash</span>
                    <span className="text-krunch-gray font-body text-xs">Received cash</span>
                  </button>
                  <button
                    onClick={() => handleDeliveryConfirm('easypaisa')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-700/40 hover:border-green-500 bg-krunch-black hover:bg-green-900/20 transition-all"
                  >
                    <span className="text-3xl">ðŸ“±</span>
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
    </div>
  );
};

export default AdminOrders;



