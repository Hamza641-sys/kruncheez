// ═══════════════════════════════════════════════════════════════
//   QZ TRAY SERVICE — KrunchEez Restaurant
//   Handles connection, printer detection, and ESC/POS printing
//   QZ Tray must be installed on the PC: https://qz.io/download
// ═══════════════════════════════════════════════════════════════

const QZ_CDN = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';

// ── Load QZ script dynamically ──────────────────────────────────
export const loadQZ = () => new Promise((resolve, reject) => {
  if (window.qz) { resolve(window.qz); return; }
  const script = document.createElement('script');
  script.src = QZ_CDN;
  script.onload = () => {
    if (window.qz) resolve(window.qz);
    else reject(new Error('QZ Tray script loaded but qz object not found'));
  };
  script.onerror = () => reject(new Error('Failed to load QZ Tray library from CDN'));
  document.head.appendChild(script);
});

// ── Connect to QZ Tray ──────────────────────────────────────────
export const connectQZ = async () => {
  const qz = await loadQZ();
  if (!qz) throw new Error('QZ Tray library not available');

  // Security setup — allow unsigned for local trusted connection
  qz.security.setCertificatePromise((_resolve, _reject) => {
    _resolve('-----BEGIN CERTIFICATE REQUEST-----\nMIIByjCCATMCAQAwgYkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlh\nMRYwFAYDVQQHEw1TYW50YUJhcmJhcmExEzARBgNVBAoTClFaIEluZHVzdHJpZXMx\nFDASBgNVBAsTEFFaIEluZHVzdHJpZXMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDQAW\nggEGAoIBAQC7bReN\n-----END CERTIFICATE REQUEST-----');
  });

  qz.security.setSignatureAlgorithm('SHA512');
  qz.security.setSignaturePromise((_resolve, _reject) => {
    _resolve('');
  });

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({
      retries: 5,
      delay: 0.5,
      host: ['localhost', '127.0.0.1'],
      port: { secure: [8181], insecure: [8182] },
      usingSecure: true,
    });
  }

  return { success: true, qz };
};

// ── Disconnect ──────────────────────────────────────────────────
export const disconnectQZ = async () => {
  try {
    if (window.qz?.websocket?.isActive()) {
      await window.qz.websocket.disconnect();
    }
  } catch {}
};

// ── Check if connected ──────────────────────────────────────────
export const isQZConnected = () => {
  try { return window.qz?.websocket?.isActive() || false; }
  catch { return false; }
};

// ── Get all available printers — with full diagnostics ──────────
export const getPrinters = async () => {
  console.log('[QZ] getPrinters called, connected:', isQZConnected());

  if (!isQZConnected()) {
    console.log('[QZ] Not connected, connecting first...');
    await connectQZ();
  }

  try {
    // qz.printers.find() with no args returns ALL printers
    const raw = await window.qz.printers.find();
    console.log('[QZ] Raw printer response:', raw, typeof raw);

    let list = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === 'string' && raw.trim()) {
      // Single printer returned as string
      list = [raw];
    } else if (raw && typeof raw === 'object') {
      list = Object.values(raw);
    }

    // Filter out empty/null values and trim
    list = list.map(p => (p || '').trim()).filter(p => p.length > 0);
    console.log('[QZ] Processed printer list:', list);
    return list;
  } catch (err) {
    console.error('[QZ] getPrinters error:', err);
    throw new Error('Failed to get printers: ' + err.message);
  }
};

// ── ESC/POS helpers ─────────────────────────────────────────────
const ESC = '\x1B';
const GS  = '\x1D';
const INIT         = ESC + '@';
const BOLD_ON      = ESC + 'E\x01';
const BOLD_OFF     = ESC + 'E\x00';
const ALIGN_LEFT   = ESC + 'a\x00';
const ALIGN_CENTER = ESC + 'a\x01';
const SIZE_NORMAL  = GS  + '!\x00';
const SIZE_LARGE   = GS  + '!\x11';
const SIZE_MEDIUM  = GS  + '!\x01';
const CUT          = GS  + 'V\x41\x03';
const FEED         = ESC + 'd\x04';
const LF           = '\n';

const row = (left, right, width = 42) => {
  const space = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, space)) + right;
};

const line = (char = '-', width = 42) => char.repeat(width);

// ── Build COUNTER RECEIPT ───────────────────────────────────────
export const buildCounterReceipt = (order) => {
  const date    = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const subtotal = order.summary?.subtotal || 0;
  const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);
  const delivery = order.summary?.deliveryFee || 0;
  const total    = order.summary?.total || 0;
  const orderType = order.tableNumber
    ? `Dine-In Table ${order.tableNumber}`
    : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery';

  const r = [];
  r.push(INIT);
  r.push(ALIGN_CENTER);
  r.push(SIZE_LARGE + BOLD_ON + 'THE KRUNCHEEZ' + BOLD_OFF + SIZE_NORMAL + LF);
  r.push('Fast Food | Chinese | BBQ' + LF);
  r.push('Peshawar, Pakistan' + LF);
  r.push(line('=') + LF);
  r.push(BOLD_ON + 'CUSTOMER RECEIPT' + BOLD_OFF + LF);
  r.push(line('-') + LF);
  r.push(ALIGN_LEFT);
  r.push(row('Order:', '#' + order.id.slice(0, 8).toUpperCase()) + LF);
  r.push(row('Date:', dateStr) + LF);
  r.push(row('Time:', timeStr) + LF);
  r.push(row('Customer:', (order.customer?.name || 'Guest').slice(0, 20)) + LF);
  if (order.customer?.phone) r.push(row('Phone:', order.customer.phone) + LF);
  r.push(row('Type:', orderType) + LF);
  r.push(row('Payment:', order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash') + LF);
  r.push(line('-') + LF);
  r.push(BOLD_ON + row('Item', 'Qty   Amt') + BOLD_OFF + LF);
  r.push(line('-') + LF);

  (order.items || []).forEach(item => {
    const name = item.name.slice(0, 24);
    const amt  = 'Rs.' + (item.price * item.quantity).toLocaleString();
    r.push(name + LF);
    r.push(row('  x' + item.quantity, amt) + LF);
  });

  r.push(line('-') + LF);
  r.push(row('Subtotal:', 'Rs.' + subtotal.toLocaleString()) + LF);
  if (discount > 0) r.push(row('Discount:', '-Rs.' + discount.toLocaleString()) + LF);
  if (delivery > 0) r.push(row('Delivery:', 'Rs.' + delivery.toLocaleString()) + LF);
  r.push(line('=') + LF);
  r.push(BOLD_ON + SIZE_MEDIUM + row('TOTAL:', 'Rs.' + total.toLocaleString()) + SIZE_NORMAL + BOLD_OFF + LF);
  r.push(line('=') + LF);
  if (order.notes) r.push('Note: ' + order.notes + LF + LF);
  r.push(ALIGN_CENTER);
  r.push(BOLD_ON + 'NTN: 1730144554693' + BOLD_OFF + LF);
  r.push('TAX INVOICE | RTO PESHAWAR' + LF);
  r.push(line('-') + LF);
  r.push('Thank you for dining with us!' + LF);
  r.push('kruncheez-pos.web.app' + LF);
  r.push(FEED + CUT);
  return r;
};

// ── Build KITCHEN SLIP ──────────────────────────────────────────
export const buildKitchenSlip = (order) => {
  const date    = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const orderType = order.tableNumber
    ? 'TABLE ' + order.tableNumber
    : order.orderType === 'pickup' ? 'PICKUP' : 'DELIVERY';
  const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  const r = [];
  r.push(INIT);
  r.push(ALIGN_CENTER);
  r.push(BOLD_ON + '** KITCHEN ORDER **' + BOLD_OFF + LF);
  r.push(line('=') + LF);
  r.push(SIZE_LARGE + BOLD_ON + '#' + order.id.slice(0, 8).toUpperCase() + BOLD_OFF + SIZE_NORMAL + LF);
  r.push('Time: ' + timeStr + LF);
  r.push(line('-') + LF);
  r.push(SIZE_MEDIUM + BOLD_ON + orderType + BOLD_OFF + SIZE_NORMAL + LF);
  if (order.customer?.name) r.push('Customer: ' + order.customer.name + LF);
  r.push(line('-') + LF);
  r.push(ALIGN_LEFT + BOLD_ON + 'ITEMS TO PREPARE:' + BOLD_OFF + LF);
  r.push(line('-') + LF);

  (order.items || []).forEach(item => {
    r.push(SIZE_MEDIUM + BOLD_ON);
    r.push(row(item.name.slice(0, 28), 'x' + item.quantity) + LF);
    r.push(SIZE_NORMAL + BOLD_OFF);
  });

  r.push(line('=') + LF);
  if (order.notes) {
    r.push(BOLD_ON + '!! SPECIAL INSTRUCTIONS:' + BOLD_OFF + LF);
    r.push(order.notes + LF);
    r.push(line('-') + LF);
  }
  r.push(ALIGN_CENTER + 'Total Items: ' + totalQty + LF);
  r.push(FEED + CUT);
  return r;
};

// ── Print to specific printer ───────────────────────────────────
export const printToQZ = async (printerName, dataArray) => {
  if (!printerName) throw new Error('No printer name specified');
  if (!isQZConnected()) await connectQZ();

  const config = window.qz.configs.create(printerName, {
    encoding: 'ISO_8859_1',
    copies: 1,
    colorType: 'blackwhite',
  });

  const printData = dataArray.map(chunk => ({
    type: 'raw',
    format: 'command',
    data: chunk,
  }));

  await window.qz.print(config, printData);
};

// ── Print counter receipt ───────────────────────────────────────
export const printCounterReceipt = async (printerName, order) => {
  await printToQZ(printerName, buildCounterReceipt(order));
};

// ── Print kitchen slip ──────────────────────────────────────────
export const printKitchenSlip = async (printerName, order) => {
  await printToQZ(printerName, buildKitchenSlip(order));
};

// ── Print both ──────────────────────────────────────────────────
export const printBothQZ = async (counterPrinter, kitchenPrinter, order) => {
  const results = { counter: null, kitchen: null };
  const errors  = { counter: null, kitchen: null };

  if (counterPrinter) {
    try {
      await printCounterReceipt(counterPrinter, order);
      results.counter = 'success';
    } catch (err) {
      results.counter = 'error';
      errors.counter  = err.message;
    }
  }

  if (kitchenPrinter) {
    try {
      await printKitchenSlip(kitchenPrinter, order);
      results.kitchen = 'success';
    } catch (err) {
      results.kitchen = 'error';
      errors.kitchen  = err.message;
    }
  }

  return { results, errors };
};
