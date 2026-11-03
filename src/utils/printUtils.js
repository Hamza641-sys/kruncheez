// ── Shared Print Utilities ─────────────────────────────────────
// Used by AdminOrders AND AdminPOS — same bill/kitchen design

export const printBill = (order) => {
  const date    = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:5px 0;font-size:13px;font-weight:bold;">${item.name}</td>
      <td style="padding:5px 0;font-size:13px;font-weight:bold;text-align:center;">x${item.quantity || item.qty}</td>
      <td style="padding:5px 0;font-size:13px;font-weight:bold;text-align:right;">Rs.${(item.price * (item.quantity || item.qty)).toLocaleString()}</td>
    </tr>
  `).join('');

  const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);

  const win = window.open('', '_blank', 'width=380,height=600');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - #${(order.id || 'POS').slice(0,8).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; font-size: 14px; font-weight: bold; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 2px dashed #000; margin: 8px 0; }
        .logo { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
        .tagline { font-size: 12px; font-weight: bold; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 13px; font-weight: bold; border-bottom: 2px dashed #000; padding-bottom: 4px; }
        td { font-size: 13px; font-weight: bold; }
        .total-row td { font-weight: bold; font-size: 16px; padding-top: 6px; }
        .footer { font-size: 12px; font-weight: bold; margin-top: 4px; }
        @page { size: 80mm auto; margin: 2mm; }
        @media print { html, body { margin: 0 !important; padding: 0 !important; width: 80mm !important; } }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="logo">THE KRUNCHEEZ</div>
        <div class="tagline">Fast Food - Chinese - BBQ</div>
        <div class="tagline">Peshawar, Pakistan</div>
      </div>
      <div class="line"></div>
      <div class="center bold" style="font-size:13px;">CUSTOMER RECEIPT</div>
      <div class="line"></div>
      <table>
        <tr><td style="font-size:12px;">Order ID</td><td style="text-align:right;font-size:12px;">#${(order.id || 'POS').slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="font-size:12px;">Date</td><td style="text-align:right;font-size:12px;">${dateStr}</td></tr>
        <tr><td style="font-size:12px;">Time</td><td style="text-align:right;font-size:12px;">${timeStr}</td></tr>
        <tr><td style="font-size:12px;">Customer</td><td style="text-align:right;font-size:12px;">${order.customer?.name || 'Walk-in'}</td></tr>
        ${order.customer?.phone ? `<tr><td style="font-size:12px;">Phone</td><td style="text-align:right;font-size:12px;">${order.customer.phone}</td></tr>` : ''}
        <tr><td style="font-size:12px;">Type</td><td style="text-align:right;font-size:12px;">${order.tableNumber ? `Dine-In (Table ${order.tableNumber})` : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery'}</td></tr>
        <tr><td style="font-size:12px;">Payment</td><td style="text-align:right;font-size:12px;">${order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash'}</td></tr>
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
        <tr><td style="font-size:13px;">Subtotal</td><td style="text-align:right;font-size:13px;">Rs.${(order.summary?.subtotal || 0).toLocaleString()}</td></tr>
        ${discount > 0 ? `<tr><td style="font-size:13px;">Discount</td><td style="text-align:right;font-size:13px;">- Rs.${discount.toLocaleString()}</td></tr>` : ''}
        ${(order.summary?.deliveryFee || 0) > 0 ? `<tr><td style="font-size:13px;">Delivery</td><td style="text-align:right;font-size:13px;">Rs.${order.summary.deliveryFee.toLocaleString()}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right;">Rs.${(order.summary?.total || 0).toLocaleString()}</td></tr>
      </table>
      <div class="line"></div>
      ${order.notes ? `<div style="font-size:12px;font-weight:bold;margin-bottom:6px;">Note: ${order.notes}</div>` : ''}
      <div class="center" style="font-size:12px;font-weight:bold;">NTN: 1730144554693</div>
      <div class="center" style="font-size:11px;">TAX INVOICE | RTO PESHAWAR</div>
      <div class="line"></div>
      <div class="center footer">
        <div class="bold">Thank you for dining with us!</div>
        <div>kruncheez-pos.web.app</div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

export const printKitchen = (order) => {
  const date    = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:6px 0;font-size:16px;font-weight:bold;">${item.name}</td>
      <td style="padding:6px 0;font-size:18px;font-weight:bold;text-align:right;">x${item.quantity || item.qty}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank', 'width=380,height=500');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen - #${(order.id || 'POS').slice(0,8).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 2px dashed #000; margin: 8px 0; }
        .order-id { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; }
        @page { size: 80mm auto; margin: 2mm; }
        @media print { html, body { margin: 0 !important; padding: 0 !important; width: 80mm !important; } }
      </style>
    </head>
    <body>
      <div class="center">
        <div style="font-size:14px;font-weight:bold;">** KITCHEN ORDER SLIP **</div>
      </div>
      <div class="line"></div>
      <div class="center">
        <div class="order-id">#${(order.id || 'POS').slice(0,8).toUpperCase()}</div>
        <div style="font-size:13px;margin-top:4px;">Time: ${timeStr}</div>
      </div>
      <div class="line"></div>
      <table>
        <tr>
          <td style="font-size:13px;font-weight:bold;">ORDER TYPE</td>
          <td style="text-align:right;font-size:15px;font-weight:bold;">${order.tableNumber ? `TABLE ${order.tableNumber}` : order.orderType === 'pickup' ? 'PICKUP' : 'DELIVERY'}</td>
        </tr>
        ${order.customer?.name ? `<tr><td style="font-size:12px;">Customer</td><td style="text-align:right;font-size:12px;">${order.customer.name}</td></tr>` : ''}
      </table>
      <div class="line"></div>
      <div style="font-size:14px;font-weight:bold;margin-bottom:6px;">ITEMS TO PREPARE:</div>
      <table>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="line"></div>
      ${order.notes ? `<div style="font-size:13px;font-weight:bold;">!! SPECIAL INSTRUCTIONS:</div><div style="font-size:13px;margin-top:4px;padding:6px;border:2px solid #000;">${order.notes}</div><div class="line"></div>` : ''}
      <div class="center" style="font-size:12px;">
        Total Items: ${(order.items || []).reduce((s, i) => s + (i.quantity || i.qty || 1), 0)}
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

export const printBoth = (order) => {
  printBill(order);
  setTimeout(() => printKitchen(order), 1000);
};
