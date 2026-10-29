// ═══════════════════════════════════════════════════════
//   KRUNCHEEZ PRINTER AGENT — CONFIGURATION
//   Edit this file to set your printer names
// ═══════════════════════════════════════════════════════

module.exports = {

  // ── Firebase Config (DO NOT CHANGE) ──────────────────
  firebase: {
    apiKey: "AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y",
    authDomain: "kruncheez-pos.firebaseapp.com",
    projectId: "kruncheez-pos",
    storageBucket: "kruncheez-pos.firebasestorage.app",
    messagingSenderId: "328549789635",
    appId: "1:328549789635:web:5e3470128cecbcc7a5d776",
  },

  // ── Printer Names ─────────────────────────────────────
  // Run: node list-printers.js to see all printer names
  // Then paste exact names below

  counterPrinter: "COUNTER_PRINTER_NAME",   // e.g. "Xprinter XP-80C"
  kitchenPrinter: "KITCHEN_PRINTER_NAME",   // e.g. "Epson TM-T82"

  // ── Paper Settings ────────────────────────────────────
  paperWidth: 80,        // mm (most thermal printers are 80mm)
  charsPerLine: 42,      // characters per line for 80mm paper

  // ── Auto Print Settings ───────────────────────────────
  autoPrintBill: true,       // auto print customer bill
  autoPrintKitchen: true,    // auto print kitchen slip
  printOnStatus: "pending",  // print when order status is this

  // ── Restaurant Info (for bill header) ─────────────────
  restaurant: {
    name: "THE KRUNCHEEZ",
    tagline: "Fast Food | Chinese | BBQ",
    address: "Peshawar, Pakistan",
    phone: "0317-7787648",
    website: "kruncheez-pos.web.app",
    thankYou: "Thank you for dining with us!",
  },
};
