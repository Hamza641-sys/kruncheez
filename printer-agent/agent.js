// ═══════════════════════════════════════════════════════════════
//   KRUNCHEEZ PRINTER AGENT v2.0
//   Auto prints Bill + Kitchen Slip on new orders
//   Run: node agent.js  OR  double-click start.bat
// ═══════════════════════════════════════════════════════════════

const { initializeApp }  = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, serverTimestamp } = require('firebase/firestore');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const config = require('./config');

// ── Init Firebase ─────────────────────────────────────────────
const app  = initializeApp(config.firebase);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Track printed orders (prevent duplicates) ─────────────────
const printedOrders = new Set();

// ── Log helper ────────────────────────────────────────────────
const log = (msg, type = 'info') => {
  const time  = new Date().toLocaleTimeString('en-PK');
  const icons = { info: '✅', warn: '⚠️', error: '❌', print: '🖨️' };
  console.log(`[${time}] ${icons[type] || 'ℹ️'} ${msg}`);
};

// ── ESC/POS helper: fixed-width row ──────────────────────────
const row = (left, right, width = 42) => {
  const space = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(space) + right;
};
const line = (char = '-', width = 42) => char.repeat(width);

// ══════════════════════════════════════════════════════════════
//   PRINT CUSTOMER BILL — Counter Printer
// ══════════════════════════════════════════════════════════════
async function printCounterBill(order) {
  const printer = new ThermalPrinter({
    type:         PrinterTypes.EPSON,
    interface:    `printer:${config.counterPrinter}`,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: true,
    width:        config.charsPerLine,
  });

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

  try {
    // Header
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(config.restaurant.name);
    printer.bold(false);
    printer.setTextNormal();
    printer.println(config.restaurant.tagline);
    printer.println(config.restaurant.address);
    printer.drawLine();
    printer.bold(true);
    printer.println('CUSTOMER RECEIPT');
    printer.bold(false);
    printer.drawLine();

    // Order info
    printer.alignLeft();
    printer.tableCustom([
      { text: 'Order:', align: 'LEFT', width: 0.5 },
      { text: '#' + order.id.slice(0, 8).toUpperCase(), align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Date:', align: 'LEFT', width: 0.5 },
      { text: dateStr, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Time:', align: 'LEFT', width: 0.5 },
      { text: timeStr, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Customer:', align: 'LEFT', width: 0.5 },
      { text: (order.customer?.name || 'Guest').slice(0, 18), align: 'RIGHT', width: 0.5 },
    ]);
    if (order.customer?.phone) {
      printer.tableCustom([
        { text: 'Phone:', align: 'LEFT', width: 0.5 },
        { text: order.customer.phone, align: 'RIGHT', width: 0.5 },
      ]);
    }
    printer.tableCustom([
      { text: 'Type:', align: 'LEFT', width: 0.5 },
      { text: orderType, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Payment:', align: 'LEFT', width: 0.5 },
      { text: order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash', align: 'RIGHT', width: 0.5 },
    ]);
    printer.drawLine();

    // Items header
    printer.bold(true);
    printer.tableCustom([
      { text: 'Item', align: 'LEFT', width: 0.55 },
      { text: 'Qty', align: 'CENTER', width: 0.15 },
      { text: 'Amount', align: 'RIGHT', width: 0.30 },
    ]);
    printer.bold(false);
    printer.drawLine();

    // Items
    (order.items || []).forEach(item => {
      printer.tableCustom([
        { text: item.name.substring(0, 22), align: 'LEFT', width: 0.55 },
        { text: 'x' + item.quantity, align: 'CENTER', width: 0.15 },
        { text: 'Rs.' + (item.price * item.quantity).toLocaleString(), align: 'RIGHT', width: 0.30 },
      ]);
    });

    printer.drawLine();

    // Totals
    printer.tableCustom([
      { text: 'Subtotal', align: 'LEFT', width: 0.6 },
      { text: 'Rs.' + subtotal.toLocaleString(), align: 'RIGHT', width: 0.4 },
    ]);
    if (discount > 0) {
      printer.tableCustom([
        { text: 'Discount', align: 'LEFT', width: 0.6 },
        { text: '- Rs.' + discount.toLocaleString(), align: 'RIGHT', width: 0.4 },
      ]);
    }
    if (delivery > 0) {
      printer.tableCustom([
        { text: 'Delivery', align: 'LEFT', width: 0.6 },
        { text: 'Rs.' + delivery.toLocaleString(), align: 'RIGHT', width: 0.4 },
      ]);
    }
    printer.drawLine();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.tableCustom([
      { text: 'TOTAL', align: 'LEFT', width: 0.5 },
      { text: 'Rs.' + total.toLocaleString(), align: 'RIGHT', width: 0.5 },
    ]);
    printer.bold(false);
    printer.setTextNormal();
    printer.drawLine();

    // Notes
    if (order.notes) {
      printer.println('Note: ' + order.notes);
      printer.newLine();
    }

    // NTN + Footer
    printer.alignCenter();
    printer.bold(true);
    printer.println('NTN: 1730144554693');
    printer.bold(false);
    printer.println('TAX INVOICE | RTO PESHAWAR');
    printer.drawLine();
    printer.bold(true);
    printer.println('Thank you for dining with us!');
    printer.bold(false);
    printer.println(config.restaurant.website);
    printer.newLine();
    printer.cut();

    await printer.execute();
    log(`Counter bill printed — Order #${order.id.slice(0, 8).toUpperCase()}`, 'print');
    return true;
  } catch (err) {
    log(`Counter bill FAILED: ${err.message}`, 'error');
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
//   PRINT KITCHEN SLIP — Kitchen Printer
// ══════════════════════════════════════════════════════════════
async function printKitchenSlip(order) {
  const printer = new ThermalPrinter({
    type:         PrinterTypes.EPSON,
    interface:    `printer:${config.kitchenPrinter}`,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: true,
    width:        config.charsPerLine,
    lineCharacter: '=',
  });

  const date    = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const orderType = order.tableNumber
    ? `TABLE ${order.tableNumber}`
    : order.orderType === 'pickup' ? 'PICKUP' : 'DELIVERY';
  const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  try {
    printer.alignCenter();
    printer.bold(true);
    printer.println('** KITCHEN ORDER **');
    printer.bold(false);
    printer.drawLine();

    // Order ID — large
    printer.setTextSize(2, 2);
    printer.bold(true);
    printer.println('#' + order.id.slice(0, 8).toUpperCase());
    printer.bold(false);
    printer.setTextNormal();
    printer.println('Time: ' + timeStr);
    printer.drawLine();

    // Order type — large
    printer.setTextSize(1, 2);
    printer.bold(true);
    printer.println(orderType);
    printer.bold(false);
    printer.setTextNormal();

    if (order.customer?.name) {
      printer.println('Customer: ' + order.customer.name);
    }

    printer.drawLine();
    printer.alignLeft();
    printer.bold(true);
    printer.println('ITEMS TO PREPARE:');
    printer.bold(false);
    printer.drawLine();

    // Items — large text
    (order.items || []).forEach(item => {
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.tableCustom([
        { text: item.name.substring(0, 26), align: 'LEFT', width: 0.75 },
        { text: 'x' + item.quantity, align: 'RIGHT', width: 0.25, bold: true },
      ]);
      printer.bold(false);
      printer.setTextNormal();
    });

    printer.drawLine();

    // Special instructions
    if (order.notes) {
      printer.bold(true);
      printer.println('!! SPECIAL INSTRUCTIONS:');
      printer.bold(false);
      printer.println(order.notes);
      printer.drawLine();
    }

    printer.alignCenter();
    printer.println('Total Items: ' + totalQty);
    printer.newLine();
    printer.cut();

    await printer.execute();
    log(`Kitchen slip printed — Order #${order.id.slice(0, 8).toUpperCase()}`, 'print');
    return true;
  } catch (err) {
    log(`Kitchen slip FAILED: ${err.message}`, 'error');
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
//   MAIN — Listen for new orders and print both
// ══════════════════════════════════════════════════════════════
async function startAgent() {
  log('KrunchEez Printer Agent starting...');

  // Login to Firebase
  try {
    await signInWithEmailAndPassword(auth, 'kruncheez.admin@gmail.com', 'KrunchEez@2024!');
    log('Firebase: Logged in');
  } catch (err) {
    log('Firebase login failed: ' + err.message, 'error');
    process.exit(1);
  }

  log(`Counter Printer: "${config.counterPrinter}"`);
  log(`Kitchen Printer: "${config.kitchenPrinter}"`);
  log('Listening for new orders...');
  log('─────────────────────────────────────────');

  // Listen for pending orders in real-time
  const q = query(
    collection(db, 'orders'),
    where('status', '==', config.printOnStatus),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type !== 'added') return;

      const order = { id: change.doc.id, ...change.doc.data() };

      // Skip already printed
      if (printedOrders.has(order.id)) return;
      printedOrders.add(order.id);

      log(`New order: #${order.id.slice(0, 8).toUpperCase()} | ${order.customer?.name || 'Guest'} | Rs.${order.summary?.total?.toLocaleString() || 0}`);

      // Print both simultaneously
      const [counterOk, kitchenOk] = await Promise.all([
        printCounterBill(order),
        printKitchenSlip(order),
      ]);

      if (counterOk && kitchenOk) {
        log(`Both printed successfully for #${order.id.slice(0, 8).toUpperCase()}`);
      } else {
        if (!counterOk) log(`Counter print failed for #${order.id.slice(0, 8).toUpperCase()} — retry manually`, 'warn');
        if (!kitchenOk) log(`Kitchen print failed for #${order.id.slice(0, 8).toUpperCase()} — retry manually`, 'warn');
      }
    });
  }, (err) => {
    log('Firebase listener error: ' + err.message, 'error');
  });
}

// Start!
startAgent();

// Keep alive
process.on('SIGINT', () => {
  log('Printer agent stopped. Goodbye!');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  log('Unhandled error: ' + err.message, 'error');
});
