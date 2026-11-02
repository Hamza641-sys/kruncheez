// ═══════════════════════════════════════════════════════════════
//   KRUNCHEEZ PRINTER AGENT v3.0
//   Uses Windows print command — NO extra packages needed!
//   Run: node agent.js  OR  double-click start.bat
// ═══════════════════════════════════════════════════════════════

const { initializeApp }  = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, onSnapshot, query, where, orderBy, limit } = require('firebase/firestore');
const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
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

// ── Print text file to a Windows printer ─────────────────────
function printTextFile(filePath, printerName) {
  return new Promise((resolve) => {
    // notepad /pt <file> <printer> — prints to specific printer
    const cmd = `Start-Process -FilePath "notepad.exe" -ArgumentList "/pt","${filePath}","${printerName}" -WindowStyle Hidden`;
    exec(`powershell -Command "${cmd}"`, { timeout: 15000 }, () => {
      // Wait 2s for print job to spool
      setTimeout(resolve, 2000);
    });
  });
}

// ── Build counter bill text ───────────────────────────────────
function buildCounterBill(order) {
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

  const W = 42;
  const line  = (c = '-') => c.repeat(W);
  const center = (t) => { const p = Math.max(0, Math.floor((W - t.length) / 2)); return ' '.repeat(p) + t; };
  const row   = (l, r) => { const s = Math.max(1, W - l.length - r.length); return l + ' '.repeat(s) + r; };

  let t = '';
  t += line('=') + '\n';
  t += center('THE KRUNCHEEZ') + '\n';
  t += center('Fast Food | Chinese | BBQ') + '\n';
  t += center('Peshawar, Pakistan') + '\n';
  t += line('=') + '\n';
  t += center('CUSTOMER RECEIPT') + '\n';
  t += line('-') + '\n';
  t += row('Order:', '#' + order.id.slice(0, 8).toUpperCase()) + '\n';
  t += row('Date:', dateStr) + '\n';
  t += row('Time:', timeStr) + '\n';
  t += row('Customer:', (order.customer?.name || 'Guest').slice(0, 18)) + '\n';
  if (order.customer?.phone) t += row('Phone:', order.customer.phone) + '\n';
  t += row('Type:', orderType) + '\n';
  t += row('Payment:', order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Cash') + '\n';
  t += line('-') + '\n';
  t += row('Item', 'Qty     Amt') + '\n';
  t += line('-') + '\n';

  (order.items || []).forEach(item => {
    const name = item.name.slice(0, 24);
    const amt  = 'Rs.' + (item.price * item.quantity).toLocaleString();
    t += name + '\n';
    t += row('  x' + item.quantity, amt) + '\n';
  });

  t += line('-') + '\n';
  t += row('Subtotal:', 'Rs.' + subtotal.toLocaleString()) + '\n';
  if (discount > 0) t += row('Discount:', '-Rs.' + discount.toLocaleString()) + '\n';
  if (delivery > 0) t += row('Delivery:', 'Rs.' + delivery.toLocaleString()) + '\n';
  t += line('=') + '\n';
  t += row('TOTAL:', 'Rs.' + total.toLocaleString()) + '\n';
  t += line('=') + '\n';
  if (order.notes) t += 'Note: ' + order.notes + '\n\n';
  t += center('NTN: 1730144554693') + '\n';
  t += center('TAX INVOICE | RTO PESHAWAR') + '\n';
  t += line('-') + '\n';
  t += center('Thank you for dining with us!') + '\n';
  t += center('kruncheez-pos.web.app') + '\n';
  t += '\n\n\n';
  return t;
}

// ── Build kitchen slip text ───────────────────────────────────
function buildKitchenSlip(order) {
  const date    = order.createdAt?.toDate?.() || new Date();
  const timeStr = date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const orderType = order.tableNumber
    ? 'TABLE ' + order.tableNumber
    : order.orderType === 'pickup' ? 'PICKUP' : 'DELIVERY';
  const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  const W = 42;
  const line   = (c = '-') => c.repeat(W);
  const center = (t) => { const p = Math.max(0, Math.floor((W - t.length) / 2)); return ' '.repeat(p) + t; };
  const row    = (l, r) => { const s = Math.max(1, W - l.length - r.length); return l + ' '.repeat(s) + r; };

  let t = '';
  t += line('=') + '\n';
  t += center('** KITCHEN ORDER **') + '\n';
  t += line('=') + '\n';
  t += center('#' + order.id.slice(0, 8).toUpperCase()) + '\n';
  t += center('Time: ' + timeStr) + '\n';
  t += line('-') + '\n';
  t += center('*** ' + orderType + ' ***') + '\n';
  if (order.customer?.name) t += center('Customer: ' + order.customer.name) + '\n';
  t += line('-') + '\n';
  t += 'ITEMS TO PREPARE:\n';
  t += line('-') + '\n';

  (order.items || []).forEach(item => {
    t += row(item.name.slice(0, 30), 'x' + item.quantity) + '\n';
    t += '\n';
  });

  t += line('=') + '\n';
  if (order.notes) {
    t += '!! SPECIAL INSTRUCTIONS:\n';
    t += order.notes + '\n';
    t += line('-') + '\n';
  }
  t += center('Total Items: ' + totalQty) + '\n';
  t += '\n\n\n';
  return t;
}

// ── Print both slips for an order ────────────────────────────
async function printOrder(order) {
  const tmpDir = os.tmpdir();
  const billFile    = path.join(tmpDir, `krz_bill_${order.id}.txt`);
  const kitchenFile = path.join(tmpDir, `krz_kitchen_${order.id}.txt`);

  // Write temp files
  fs.writeFileSync(billFile,    buildCounterBill(order),  'utf8');
  fs.writeFileSync(kitchenFile, buildKitchenSlip(order), 'utf8');

  const results = { counter: false, kitchen: false };

  // Print counter bill
  try {
    await printTextFile(billFile, config.counterPrinter);
    results.counter = true;
    log(`Counter bill printed — #${order.id.slice(0, 8).toUpperCase()}`, 'print');
  } catch (err) {
    log(`Counter bill FAILED: ${err.message}`, 'error');
  }

  // Print kitchen slip
  try {
    await printTextFile(kitchenFile, config.kitchenPrinter);
    results.kitchen = true;
    log(`Kitchen slip printed — #${order.id.slice(0, 8).toUpperCase()}`, 'print');
  } catch (err) {
    log(`Kitchen slip FAILED: ${err.message}`, 'error');
  }

  // Cleanup temp files
  try { fs.unlinkSync(billFile); } catch {}
  try { fs.unlinkSync(kitchenFile); } catch {}

  return results;
}

// ══════════════════════════════════════════════════════════════
//   MAIN — Listen for new orders and auto print
// ══════════════════════════════════════════════════════════════
async function startAgent() {
  console.log('');
  console.log('  ██╗  ██╗██████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗  ██╗███████╗███████╗███████╗');
  console.log('  ██╔ ██╔╝██╔══██╗██║   ██║████╗  ██║██╔════╝██║  ██║██╔════╝██╔════╝╚══███╔╝');
  console.log('  █████╔╝ ██████╔╝██║   ██║██╔██╗ ██║██║     ███████║█████╗  █████╗    ███╔╝ ');
  console.log('  ██╔═██╗ ██╔══██╗██║   ██║██║╚██╗██║██║     ██╔══██║██╔══╝  ██╔══╝   ███╔╝  ');
  console.log('  ██║  ██╗██║  ██║╚██████╔╝██║ ╚████║╚██████╗██║  ██║███████╗███████╗███████╗');
  console.log('  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝');
  console.log('');
  console.log('  PRINTER AGENT v3.0 — Auto Print System');
  console.log('  =========================================');
  console.log('');

  // Login to Firebase
  try {
    await signInWithEmailAndPassword(auth, 'kruncheez.admin@gmail.com', 'KrunchEez@2024!');
    log('Firebase: Connected');
  } catch (err) {
    log('Firebase login failed: ' + err.message, 'error');
    process.exit(1);
  }

  log(`Counter Printer: "${config.counterPrinter}"`);
  log(`Kitchen Printer: "${config.kitchenPrinter}"`);
  log('');
  log('Listening for new orders... (Press Ctrl+C to stop)');
  log('─────────────────────────────────────────────────');

  // Listen for new pending orders
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

      log('');
      log(`NEW ORDER: #${order.id.slice(0, 8).toUpperCase()}`);
      log(`Customer: ${order.customer?.name || 'Guest'} | Rs.${order.summary?.total?.toLocaleString() || 0}`);
      log(`Type: ${order.orderType || 'delivery'}${order.tableNumber ? ' | Table ' + order.tableNumber : ''}`);

      const results = await printOrder(order);

      if (results.counter && results.kitchen) {
        log('Both slips printed successfully!');
      } else {
        log('Some prints failed — check printers', 'warn');
      }
      log('─────────────────────────────────────────────────');
    });
  }, (err) => {
    log('Firebase error: ' + err.message, 'error');
  });
}

// Start!
startAgent();

// Keep process alive
process.on('SIGINT', () => {
  log('');
  log('Printer agent stopped. Goodbye!');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  log('Unhandled error: ' + (err?.message || err), 'error');
});
