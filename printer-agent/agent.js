// ═══════════════════════════════════════════════════════
//   KRUNCHEEZ PRINTER AGENT v1.0
//   Listens for new orders → auto prints Bill + Kitchen slip
//   Run: node agent.js
// ═══════════════════════════════════════════════════════

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot, query, where, orderBy, limit } = require('firebase/firestore');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const config = require('./config');

// ── Init Firebase ─────────────────────────────────────
const app = initializeApp(config.firebase);
const db = getFirestore(app);

// ── Track printed orders (avoid duplicate prints) ─────
const printedOrders = new Set();

// ── Log helper ────────────────────────────────────────
const log = (msg) => {
  const time = new Date().toLocaleTimeString('en-PK');
  console.log(`[${time}] ${msg}`);
};

// ══════════════════════════════════════════════════════
//   PRINT CUSTOMER BILL
// ══════════════════════════════════════════════════════
async function printBill(order) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `printer:${config.counterPrinter}`,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    width: config.charsPerLine,
  });

  const date = order.createdAt?.toDate?.() || new Date();
  const dateStr = date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  try {
    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(config.restaurant.name);
    printer.bold(false);
    printer.setTextNormal();
    printer.println(config.restaurant.tagline);
    printer.println(config.restaurant.address);
    printer.println(config.restaurant.phone);
    printer.drawLine();

    // Receipt title
    printer.alignCenter();
    printer.bold(true);
    printer.println('CUSTOMER RECEIPT');
    printer.bold(false);
    printer.drawLine();

    // Order info
    printer.alignLeft();
    printer.tableCustom([
      { text: 'Order ID:', align: 'LEFT', width: 0.5 },
      { text: `#${order.id.slice(0, 8).toUpperCase()}`, align: 'RIGHT', width: 0.5 },
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
      { text: order.customer?.name || '-', align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Phone:', align: 'LEFT', width: 0.5 },
      { text: order.customer?.phone || '-', align: 'RIGHT', width: 0.5 },
    ]);

    const orderType = order.tableNumber
      ? `Dine-In (Table ${order.tableNumber})`
      : order.orderType === 'pickup' ? 'Self Pickup' : 'Home Delivery';
    printer.tableCustom([
      { text: 'Type:', align: 'LEFT', width: 0.5 },
      { text: orderType, align: 'RIGHT', width: 0.5 },
    ]);
    printer.tableCustom([
      { text: 'Payment:', align: 'LEFT', width: 0.5 },
      { text: order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card', align: 'RIGHT', width: 0.5 },
    ]);

    printer.drawLine();

    // Items header
    printer.tableCustom([
      { text: 'Item', align: 'LEFT', width: 0.5 },
      { text: 'Qty', align: 'CENTER', width: 0.15 },
      { text: 'Amount', align: 'RIGHT', width: 0.35 },
    ]);
    printer.drawLine();

    // Items
    (order.items || []).forEach(item => {
      printer.tableCustom([
        { text: item.name.substring(0, 20), align: 'LEFT', width: 0.5 },
        { text: `x${item.quantity}`, align: 'CENTER', width: 0.15 },
        { text: `Rs.${(item.price * item.quantity).toLocaleString()}`, align: 'RIGHT', width: 0.35 },
      ]);
    });

    printer.drawLine();

    // Totals
    const subtotal = order.summary?.subtotal || 0;
    const discount = (order.summary?.discount || 0) + (order.summary?.cardDiscount || 0);
    const delivery = order.summary?.deliveryFee || 0;
    const total = order.summary?.total || 0;

    printer.tableCustom([
      { text: 'Subtotal', align: 'LEFT', width: 0.5 },
      { text: `Rs.${subtotal.toLocaleString()}`, align: 'RIGHT', width: 0.5 },
    ]);
    if (discount > 0) {
      printer.tableCustom([
        { text: 'Discount', align: 'LEFT', width: 0.5 },
        { text: `- Rs.${discount.toLocaleString()}`, align: 'RIGHT', width: 0.5 },
      ]);
    }
    if (delivery > 0) {
      printer.tableCustom([
        { text: 'Delivery', align: 'LEFT', width: 0.5 },
        { text: `Rs.${delivery.toLocaleString()}`, align: 'RIGHT', width: 0.5 },
      ]);
    }

    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.tableCustom([
      { text: 'TOTAL', align: 'LEFT', width: 0.5 },
      { text: `Rs.${total.toLocaleString()}`, align: 'RIGHT', width: 0.5 },
    ]);
    printer.bold(false);
    printer.setTextNormal();

    // Notes
    if (order.notes) {
      printer.drawLine();
      printer.println(`Note: ${order.notes}`);
    }

    printer.drawLine();

    // Footer
    printer.alignCenter();
    printer.bold(true);
    printer.println(config.restaurant.thankYou);
    printer.bold(false);
    printer.println('Visit again soon!');
    printer.println(config.restaurant.website);

    printer.cut();
    await printer.execute();
    log(`✅ Bill printed for order #${order.id.slice(0, 8).toUpperCase()} on counter printer`);
  } catch (err) {
    log(`❌ Bill print failed: ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════
//   PRINT KITCHEN SLIP
// ══════════════════════════════════════════════════════
async function printKitchen(order) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `printer:${config.kitchenPrinter}`,
    characterSet: CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    lineCharacter: '=',
    width: config.charsPerLine,
  });

  const date = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  try {
    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.println('** KITCHEN ORDER **');
    printer.drawLine();

    // Order ID — BIG
    printer.setTextSize(2, 2);
    printer.println(`#${order.id.slice(0, 8).toUpperCase()}`);
    printer.setTextNormal();
    printer.println(`Time: ${timeStr}`);
    printer.drawLine();

    // Order type
    const orderType = order.tableNumber
      ? `TABLE ${order.tableNumber}`
      : order.orderType === 'pickup' ? 'SELF PICKUP' : 'DELIVERY';
    printer.setTextSize(1, 2);
    printer.println(orderType);
    printer.setTextNormal();

    if (order.customer?.name) printer.println(`Customer: ${order.customer.name}`);

    printer.drawLine();
    printer.alignLeft();
    printer.bold(true);
    printer.println('ITEMS TO PREPARE:');
    printer.bold(false);
    printer.drawLine();

    // Items — large text
    (order.items || []).forEach(item => {
      printer.setTextSize(1, 1);
      printer.tableCustom([
        { text: item.name.substring(0, 24), align: 'LEFT', width: 0.7 },
        { text: `x${item.quantity}`, align: 'RIGHT', width: 0.3, bold: true },
      ]);
    });

    printer.setTextNormal();
    printer.drawLine();

    // Special instructions
    if (order.notes) {
      printer.bold(true);
      printer.println('!! SPECIAL INSTRUCTIONS:');
      printer.bold(false);
      printer.println(order.notes);
      printer.drawLine();
    }

    // Total items
    const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    printer.alignCenter();
    printer.println(`Total Items: ${totalQty}`);

    printer.cut();
    await printer.execute();
    log(`✅ Kitchen slip printed for order #${order.id.slice(0, 8).toUpperCase()} on kitchen printer`);
  } catch (err) {
    log(`❌ Kitchen print failed: ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════
//   MAIN — LISTEN FOR NEW ORDERS
// ══════════════════════════════════════════════════════
async function startAgent() {
  log('🚀 KrunchEez Printer Agent started!');
  log(`📠 Counter Printer: ${config.counterPrinter}`);
  log(`🍳 Kitchen Printer: ${config.kitchenPrinter}`);
  log('👂 Listening for new orders...');
  log('─────────────────────────────────────');

  // Listen to pending orders in real-time
  const q = query(
    collection(db, 'orders'),
    where('status', '==', config.printOnStatus),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const order = { id: change.doc.id, ...change.doc.data() };

        // Skip if already printed
        if (printedOrders.has(order.id)) return;
        printedOrders.add(order.id);

        log(`🔔 New order received: #${order.id.slice(0, 8).toUpperCase()}`);
        log(`   Customer: ${order.customer?.name || 'Guest'}`);
        log(`   Items: ${(order.items || []).length} items`);
        log(`   Total: Rs.${order.summary?.total?.toLocaleString() || 0}`);

        // Print both
        if (config.autoPrintBill)    await printBill(order);
        if (config.autoPrintKitchen) await printKitchen(order);
      }
    });
  }, (err) => {
    log(`❌ Firebase error: ${err.message}`);
  });
}

// Start!
startAgent().catch(err => {
  log(`❌ Agent failed to start: ${err.message}`);
  process.exit(1);
});

// Keep alive
process.on('SIGINT', () => {
  log('👋 Printer agent stopped.');
  process.exit(0);
});
