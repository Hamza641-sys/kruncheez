// ═══════════════════════════════════════════════════════════════
//   QZ TRAY SERVICE — KrunchEez Restaurant
//   Handles connection, printer detection, and ESC/POS printing
//   QZ Tray must be installed on the PC: https://qz.io/download
// ═══════════════════════════════════════════════════════════════

// Load QZ Tray from CDN dynamically
const QZ_CDN = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';

let qzLoaded = false;
let qzConnected = false;

// ── Load QZ script dynamically ──────────────────────────────────
export const loadQZ = () => new Promise((resolve, reject) => {
  if (window.qz) { qzLoaded = true; resolve(window.qz); return; }
  const script = document.createElement('script');
  script.src = QZ_CDN;
  script.onload = () => { qzLoaded = true; resolve(window.qz); };
  script.onerror = () => reject(new Error('Failed to load QZ Tray library'));
  document.head.appendChild(script);
});

// ── Connect to QZ Tray ──────────────────────────────────────────
export const connectQZ = async () => {
  try {
    const qz = await loadQZ();
    if (!qz) throw new Error('QZ Tray not available');

    // Security: use unsigned (for local/trusted setup)
    qz.security.setCertificatePromise(() => Promise.resolve('-----BEGIN CERTIFICATE REQUEST-----\n-----END CERTIFICATE REQUEST-----'));
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise(() => Promise.resolve('unsigned'));

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({ retries: 3, delay: 1 });
    }
    qzConnected = true;
    return { success: true, qz };
  } catch (err) {
    qzConnected = false;
    throw new Error(err.message || 'Cannot connect to QZ Tray');
  }
};

// ── Disconnect ──────────────────────────────────────────────────
export const disconnectQZ = async () => {
  try {
    if (window.qz?.websocket?.isActive()) {
      await window.qz.websocket.disconnect();
    }
    qzConnected = false;
  } catch {}
};

// ── Check if connected ──────────────────────────────────────────
export const isQZConnected = () => {
  return window.qz?.websocket?.isActive() || false;
};

// ── Get all available printers ──────────────────────────────────
export const getPrinters = async () => {
  try {
    if (!isQZConnected()) await connectQZ();
    const printers = await window.qz.printers.find();
    return Array.isArray(printers) ? printers : [printers];
  } catch (err) {
    throw new Error('Could not get printers: ' + err.message);
  }
};

// ── ESC/POS helpers ─────────────────────────────────────────────
const ESC = '\x1B';
const GS  = '\x1D';
const INIT        = ESC + '@';           // Initialize printer
const BOLD_ON     = ESC + 'E\x01';       // Bold on
const BOLD_OFF    = ESC + 'E\x00';       // Bold off
const ALIGN_LEFT  = ESC + 'a\x00';       // Align left
const ALIGN_CENTER= ESC + 'a\x01';       // Align center
const ALIGN_RIGHT = ESC + 'a\x02';       // Align right
const SIZE_NORMAL = GS  + '!\x00';       // Normal size
const SIZE_LARGE  = GS  + '!\x11';       // Double width+height
const SIZE_MEDIUM = GS  + '!\x01';       // Double height
const CUT         = GS  + 'V\x41\x03';   // Partial cut
const FEED        = ESC + 'd\x04';       // Feed 4 lines
const LF          = '\n';

const center = (text, width = 42) => {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
};

const line = (char = '-', width = 42) => char.repeat(width);

const row = (left, right, width = 42) => {
  const space = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, space)) + right;
};

// ── Build COUNTER RECEIPT (ESC/POS) ────────────────────────────
export const buildCounterReceipt = (order) => {
  const date = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const subtotal = order.summary?.subtotal || 0;
  const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);
  const delivery = order.summary?.deliveryFee || 0;
  const total    = order.summary?.total || 0;
  const orderType = order.tableNumber
    ? `Dine-In Table ${order.tableNumber}`
    : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery';

  let receipt = [];
  receipt.push(INIT);
  receipt.push(ALIGN_CENTER);
  receipt.push(SIZE_LARGE);
  receipt.push(BOLD_ON + 'THE KRUNCHEEZ' + BOLD_OFF + LF);
  receipt.push(SIZE_NORMAL);
  receipt.push('Fast Food | Chinese | BBQ' + LF);
  receipt.push('Peshawar, Pakistan' + LF);
  receipt.push(line('=') + LF);
  receipt.push(BOLD_ON + 'CUSTOMER RECEIPT' + BOLD_OFF + LF);
  receipt.push(line('-') + LF);
  receipt.push(ALIGN_LEFT);
  receipt.push(row('Order:', '#' + order.id.slice(0, 8).toUpperCase()) + LF);
  receipt.push(row('Date:', dateStr) + LF);
  receipt.push(row('Time:', timeStr) + LF);
  receipt.push(row('Customer:', (order.customer?.name || 'Guest').slice(0, 20)) + LF);
  receipt.push(row('Phone:', order.customer?.phone || '-') + LF);
  receipt.push(row('Type:', orderType) + LF);
  receipt.push(row('Payment:', order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash') + LF);
  receipt.push(line('-') + LF);
  receipt.push(BOLD_ON);
  receipt.push(row('Item', 'Qty   Amt') + LF);
  receipt.push(BOLD_OFF);
  receipt.push(line('-') + LF);

  (order.items || []).forEach(item => {
    const name = item.name.slice(0, 24);
    const amt  = 'Rs.' + (item.price * item.quantity).toLocaleString();
    const qty  = 'x' + item.quantity;
    receipt.push(name + LF);
    receipt.push(row('  ' + qty, amt) + LF);
  });

  receipt.push(line('-') + LF);
  receipt.push(row('Subtotal:', 'Rs.' + subtotal.toLocaleString()) + LF);
  if (discount > 0) receipt.push(row('Discount:', '- Rs.' + discount.toLocaleString()) + LF);
  if (delivery > 0) receipt.push(row('Delivery:', 'Rs.' + delivery.toLocaleString()) + LF);
  receipt.push(line('=') + LF);
  receipt.push(BOLD_ON + SIZE_MEDIUM);
  receipt.push(row('TOTAL:', 'Rs.' + total.toLocaleString()) + LF);
  receipt.push(SIZE_NORMAL + BOLD_OFF);
  receipt.push(line('=') + LF);
  if (order.notes) receipt.push('Note: ' + order.notes + LF + LF);
  receipt.push(ALIGN_CENTER);
  receipt.push(BOLD_ON + 'NTN: 1730144554693' + BOLD_OFF + LF);
  receipt.push('TAX INVOICE | RTO PESHAWAR' + LF);
  receipt.push(line('-') + LF);
  receipt.push('Thank you for dining with us!' + LF);
  receipt.push('kruncheez-pos.web.app' + LF);
  receipt.push(FEED);
  receipt.push(CUT);

  return receipt;
};

// ── Build KITCHEN SLIP (ESC/POS) ────────────────────────────────
export const buildKitchenSlip = (order) => {
  const date = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const orderType = order.tableNumber
    ? `TABLE ${order.tableNumber}`
    : order.orderType === 'pickup' ? 'PICKUP' : 'DELIVERY';
  const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  let slip = [];
  slip.push(INIT);
  slip.push(ALIGN_CENTER);
  slip.push(BOLD_ON + '** KITCHEN ORDER **' + BOLD_OFF + LF);
  slip.push(line('=') + LF);
  slip.push(SIZE_LARGE);
  slip.push(BOLD_ON + '#' + order.id.slice(0, 8).toUpperCase() + BOLD_OFF + LF);
  slip.push(SIZE_NORMAL);
  slip.push('Time: ' + timeStr + LF);
  slip.push(line('-') + LF);
  slip.push(SIZE_MEDIUM + BOLD_ON);
  slip.push(orderType + BOLD_OFF + SIZE_NORMAL + LF);
  if (order.customer?.name) slip.push('Customer: ' + order.customer.name + LF);
  slip.push(line('-') + LF);
  slip.push(ALIGN_LEFT);
  slip.push(BOLD_ON + 'ITEMS TO PREPARE:' + BOLD_OFF + LF);
  slip.push(line('-') + LF);

  (order.items || []).forEach(item => {
    slip.push(SIZE_MEDIUM + BOLD_ON);
    slip.push(row(item.name.slice(0, 28), 'x' + item.quantity) + LF);
    slip.push(SIZE_NORMAL + BOLD_OFF);
  });

  slip.push(line('=') + LF);
  if (order.notes) {
    slip.push(BOLD_ON + '!! SPECIAL INSTRUCTIONS:' + BOLD_OFF + LF);
    slip.push(order.notes + LF);
    slip.push(line('-') + LF);
  }
  slip.push(ALIGN_CENTER);
  slip.push('Total Items: ' + totalQty + LF);
  slip.push(FEED);
  slip.push(CUT);

  return slip;
};

// ── Print to a specific printer ─────────────────────────────────
export const printToQZ = async (printerName, data) => {
  if (!printerName) throw new Error('No printer selected');
  if (!isQZConnected()) await connectQZ();

  const config = window.qz.configs.create(printerName, {
    encoding: 'ISO_8859_1',
    copies: 1,
  });

  const printData = data.map(chunk => ({
    type: 'raw',
    format: 'command',
    data: chunk,
  }));

  await window.qz.print(config, printData);
};

// ── Print Counter Receipt ───────────────────────────────────────
export const printCounterReceipt = async (printerName, order) => {
  const data = buildCounterReceipt(order);
  await printToQZ(printerName, data);
};

// ── Print Kitchen Slip ──────────────────────────────────────────
export const printKitchenSlip = async (printerName, order) => {
  const data = buildKitchenSlip(order);
  await printToQZ(printerName, data);
};

// ── Print Both ──────────────────────────────────────────────────
export const printBothQZ = async (counterPrinter, kitchenPrinter, order) => {
  const results = { counter: null, kitchen: null };
  const errors  = { counter: null, kitchen: null };

  // Print counter receipt
  if (counterPrinter) {
    try {
      await printCounterReceipt(counterPrinter, order);
      results.counter = 'success';
    } catch (err) {
      errors.counter = err.message;
      results.counter = 'error';
    }
  }

  // Print kitchen slip
  if (kitchenPrinter) {
    try {
      await printKitchenSlip(kitchenPrinter, order);
      results.kitchen = 'success';
    } catch (err) {
      errors.kitchen = err.message;
      results.kitchen = 'error';
    }
  }

  return { results, errors };
};
