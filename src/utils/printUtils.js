// Shared Print Utilities - Used by AdminOrders AND AdminPOS

const printViaIframe = (html) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;visibility:hidden;';
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      // fallback: open new window
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); setTimeout(() => { win.print(); win.close(); }, 400); }
    }
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 3000);
  }, 600);
};

export const printBill = (order) => {
  const date    = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);

  const itemsHtml = (order.items || []).map(item => {
    const qty = item.quantity || item.qty || 1;
    const amt = (item.price * qty).toLocaleString();
    return '<tr>'
      + '<td style="padding:3px 0;font-size:12px;">' + item.name + '</td>'
      + '<td style="padding:3px 0;font-size:12px;text-align:center;">x' + qty + '</td>'
      + '<td style="padding:3px 0;font-size:12px;text-align:right;">Rs.' + amt + '</td>'
      + '</tr>';
  }).join('');

  const orderType = order.tableNumber
    ? 'Dine-In (Table ' + order.tableNumber + ')'
    : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery';

  const payment = order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash';
  const orderId = '#' + (order.id || 'POS').slice(0,8).toUpperCase();
  const subtotal = (order.summary?.subtotal || 0).toLocaleString();
  const total = (order.summary?.total || 0).toLocaleString();

  let discountRow = '';
  if (discount > 0) discountRow = '<tr><td style="font-size:12px;">Discount</td><td style="text-align:right;font-size:12px;">- Rs.' + discount.toLocaleString() + '</td></tr>';

  let deliveryRow = '';
  if ((order.summary?.deliveryFee || 0) > 0) deliveryRow = '<tr><td style="font-size:12px;">Delivery</td><td style="text-align:right;font-size:12px;">Rs.' + order.summary.deliveryFee.toLocaleString() + '</td></tr>';

  let phoneRow = '';
  if (order.customer?.phone) phoneRow = '<tr><td style="font-size:12px;">Phone</td><td style="text-align:right;font-size:12px;">' + order.customer.phone + '</td></tr>';

  let notesRow = '';
  if (order.notes) notesRow = '<div style="font-size:11px;margin:4px 0;">Note: ' + order.notes + '</div>';

  const html = '<!DOCTYPE html><html><head><title>Bill</title><style>'
    + '* { margin:0; padding:0; box-sizing:border-box; }'
    + 'body { font-family: Courier New, monospace; width:300px; margin:0 auto; padding:8px; font-size:12px; }'
    + '.center { text-align:center; }'
    + '.line { border-top:1px dashed #000; margin:6px 0; }'
    + 'table { width:100%; border-collapse:collapse; }'
    + 'th { font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:3px; }'
    + 'td { font-size:12px; }'
    + '@page { size:80mm auto; margin:2mm; }'
    + '@media print { html,body { margin:0!important; padding:0!important; width:80mm!important; } }'
    + '</style></head><body>'

    // Header
    + '<div class="center"><div style="font-size:20px;font-weight:bold;letter-spacing:2px;">THE KRUNCHEEZ</div>'
    + '<div style="font-size:11px;margin-top:2px;">Fast Food - Chinese - BBQ</div>'
    + '<div style="font-size:11px;">Peshawar, Pakistan</div></div>'
    + '<div class="line"></div>'

    // Order info
    + '<table>'
    + '<tr><td style="font-size:11px;">Order ID</td><td style="text-align:right;font-size:11px;font-weight:bold;">' + orderId + '</td></tr>'
    + '<tr><td style="font-size:11px;">Date</td><td style="text-align:right;font-size:11px;">' + dateStr + ' ' + timeStr + '</td></tr>'
    + '<tr><td style="font-size:11px;">Customer</td><td style="text-align:right;font-size:11px;">' + (order.customer?.name || 'Walk-in') + '</td></tr>'
    + phoneRow
    + '<tr><td style="font-size:11px;">Type</td><td style="text-align:right;font-size:11px;">' + orderType + '</td></tr>'
    + '<tr><td style="font-size:11px;">Payment</td><td style="text-align:right;font-size:11px;">' + payment + '</td></tr>'
    + '</table>'
    + '<div class="line"></div>'

    // Items
    + '<table><thead><tr>'
    + '<th style="text-align:left;">Item</th>'
    + '<th style="text-align:center;">Qty</th>'
    + '<th style="text-align:right;">Amount</th>'
    + '</tr></thead><tbody>' + itemsHtml + '</tbody></table>'
    + '<div class="line"></div>'

    // Totals
    + '<table>'
    + '<tr><td style="font-size:12px;">Subtotal</td><td style="text-align:right;font-size:12px;">Rs.' + subtotal + '</td></tr>'
    + discountRow + deliveryRow
    + '<tr><td style="font-size:14px;font-weight:bold;padding-top:4px;">TOTAL</td><td style="text-align:right;font-size:14px;font-weight:bold;padding-top:4px;">Rs.' + total + '</td></tr>'
    + '</table>'
    + '<div class="line"></div>'

    + notesRow
    + '<div class="center" style="font-size:11px;">NTN: 1730144554693</div>'
    + '<div class="center" style="font-size:10px;">TAX INVOICE | RTO PESHAWAR</div>'
    + '<div class="line"></div>'

    + '<div class="center" style="font-size:12px;">Thank you for dining with us!</div>'
    + '<div style="border-top:1px dashed #000;margin:8px 0;"></div>'
    + '<div style="font-size:8px;color:#777;margin-bottom:1px;">Software Developed by</div>'
    + '<div style="font-size:11px;font-weight:900;letter-spacing:1px;">DKIM TECH</div>'
    + '</body></html>';

  printViaIframe(html);
};

export const printKitchen = (order) => {
  const date    = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const orderId = '#' + (order.id || 'POS').slice(0,8).toUpperCase();
  const totalItems = (order.items || []).reduce((s, i) => s + (i.quantity || i.qty || 1), 0);

  const orderType = order.tableNumber
    ? 'TABLE ' + order.tableNumber
    : order.orderType === 'pickup' ? 'PICKUP' : 'DELIVERY';

  const itemsHtml = (order.items || []).map(item => {
    const qty = item.quantity || item.qty || 1;
    return '<tr><td style="padding:6px 0;font-size:16px;font-weight:bold;">' + item.name + '</td><td style="padding:6px 0;font-size:18px;font-weight:bold;text-align:right;">x' + qty + '</td></tr>';
  }).join('');

  let customerRow = '';
  if (order.customer?.name) customerRow = '<tr><td style="font-size:12px;">Customer</td><td style="text-align:right;font-size:12px;">' + order.customer.name + '</td></tr>';

  let notesSection = '';
  if (order.notes) notesSection = '<div style="font-size:13px;font-weight:bold;">!! SPECIAL INSTRUCTIONS:</div><div style="font-size:13px;margin-top:4px;padding:6px;border:2px solid #000;">' + order.notes + '</div><div class="line"></div>';

  const html = '<!DOCTYPE html><html><head><title>Kitchen</title><style>'
    + '* { margin:0; padding:0; box-sizing:border-box; }'
    + 'body { font-family: Courier New, monospace; width:300px; margin:0 auto; padding:10px; }'
    + '.center { text-align:center; } .bold { font-weight:bold; }'
    + '.line { border-top:2px dashed #000; margin:8px 0; }'
    + '.order-id { font-size:22px; font-weight:bold; letter-spacing:2px; }'
    + 'table { width:100%; border-collapse:collapse; }'
    + '@page { size:80mm auto; margin:2mm; }'
    + '@media print { html,body { margin:0!important; padding:0!important; width:80mm!important; } }'
    + '</style></head><body>'
    + '<div class="center"><div style="font-size:14px;font-weight:bold;">** KITCHEN ORDER SLIP **</div></div>'
    + '<div class="line"></div>'
    + '<div class="center"><div class="order-id">' + orderId + '</div>'
    + '<div style="font-size:13px;margin-top:4px;">Time: ' + timeStr + '</div></div>'
    + '<div class="line"></div>'
    + '<table>'
    + '<tr><td style="font-size:13px;font-weight:bold;">ORDER TYPE</td><td style="text-align:right;font-size:15px;font-weight:bold;">' + orderType + '</td></tr>'
    + customerRow
    + '</table>'
    + '<div class="line"></div>'
    + '<div style="font-size:14px;font-weight:bold;margin-bottom:6px;">ITEMS TO PREPARE:</div>'
    + '<table><tbody>' + itemsHtml + '</tbody></table>'
    + '<div class="line"></div>'
    + notesSection
    + '<div class="center" style="font-size:12px;">Total Items: ' + totalItems + '</div>'
    + '</body></html>';

  printViaIframe(html);
};

export const printBoth = (order) => {
  printBill(order);
  setTimeout(() => printKitchen(order), 1500);
};
