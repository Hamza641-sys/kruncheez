// WhatsApp notification via wa.me link (no API key needed)
// Admin gets notified via WhatsApp when new order placed

const ADMIN_PHONE = '923177787648'; // +92 format, no spaces/dashes

export const sendWhatsAppOrderNotification = (order, orderId) => {
  const items = order.items?.map(i => `• ${i.name} x${i.quantity} = Rs.${i.price * i.quantity}`).join('\n') || '';
  const message = `🔔 *NEW ORDER — The KrunchEez*\n\n` +
    `Order ID: #${orderId.slice(0,8).toUpperCase()}\n` +
    `Customer: ${order.customer?.name}\n` +
    `Phone: ${order.customer?.phone}\n` +
    `Address: ${order.customer?.address || 'Pickup'}\n\n` +
    `*Items:*\n${items}\n\n` +
    `*Total: Rs.${order.summary?.total?.toLocaleString()}*\n` +
    `Payment: ${order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card'}\n` +
    `Type: ${order.orderType || 'Delivery'}\n\n` +
    `${order.notes ? `Notes: ${order.notes}` : ''}`;

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${ADMIN_PHONE}?text=${encoded}`;

  // Open WhatsApp in new tab — admin will see the message
  window.open(url, '_blank');
};

export const sendWhatsAppStatusUpdate = (customerPhone, orderId, status) => {
  const statusMessages = {
    confirmed:        '✅ Your order has been *confirmed*!',
    preparing:        '👨‍🍳 Your order is being *prepared*!',
    out_for_delivery: '🛵 Your order is *on the way*!',
    delivered:        '🎉 Your order has been *delivered*! Enjoy your meal!',
    rejected:         '❌ Sorry, your order was *rejected*. Please call us for help.',
  };

  const msg = `🍔 *The KrunchEez Order Update*\n\n` +
    `Order #${orderId.slice(0,8).toUpperCase()}\n` +
    `${statusMessages[status] || 'Order status updated'}\n\n` +
    `Track your order at: kruncheez-pos.web.app/track/${orderId}`;

  const phone = customerPhone?.replace(/[^0-9]/g, '');
  const pkPhone = phone?.startsWith('0') ? '92' + phone.slice(1) : phone;
  const url = `https://wa.me/${pkPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};
