// ═══════════════════════════════════════════════════════════════
//   usePrinter Hook — KrunchEez Restaurant
//   Manages QZ Tray connection, printer config, print jobs
//   Config saved in localStorage (per device)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  connectQZ, disconnectQZ, isQZConnected,
  getPrinters, printBothQZ,
  printCounterReceipt, printKitchenSlip,
} from '../firebase/qzService';

const STORAGE_KEY = 'kruncheez_printer_config';

const defaultConfig = {
  autoPrint:       false,
  counterPrinter:  '',
  kitchenPrinter:  '',
};

const loadConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  } catch { return defaultConfig; }
};

const saveConfig = (config) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
};

// ── Print job dedup — prevent double prints ──────────────────────
const printedJobs = new Set();

const usePrinter = () => {
  const [qzStatus, setQzStatus]     = useState('disconnected'); // disconnected | connecting | connected | error
  const [printers, setPrinters]     = useState([]);
  const [config, setConfig]         = useState(loadConfig);
  const [printStatus, setPrintStatus] = useState({ counter: null, kitchen: null }); // null | printing | success | error
  const [printError, setPrintError]   = useState({ counter: null, kitchen: null });
  const reconnectTimer = useRef(null);
  const [printerError, setPrinterError] = useState('');

  // ── Connect to QZ Tray ────────────────────────────────────────
  const connect = useCallback(async () => {
    setQzStatus('connecting');
    setPrinterError('');
    try {
      await connectQZ();
      setQzStatus('connected');
      // Load printers immediately after connect
      try {
        const list = await getPrinters();
        console.log('[usePrinter] Printers after connect:', list);
        setPrinters(list);
        if (list.length === 0) {
          setPrinterError('Connected but no printers found. Check Windows printers.');
        }
      } catch (pErr) {
        console.error('[usePrinter] Printer load error:', pErr);
        setPrinterError('Could not load printers: ' + pErr.message);
      }
    } catch (err) {
      setQzStatus('error');
      setPrinterError('QZ Tray not running. Please start QZ Tray.');
      console.warn('[usePrinter] QZ connect error:', err.message);
      reconnectTimer.current = setTimeout(connect, 15000);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    clearTimeout(reconnectTimer.current);
    await disconnectQZ();
    setQzStatus('disconnected');
  }, []);

  // ── Auto-connect on mount if autoPrint enabled ────────────────
  useEffect(() => {
    if (config.autoPrint) connect();
    return () => {
      clearTimeout(reconnectTimer.current);
    };
  }, []);

  // ── Poll connection status every 5s ──────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const active = isQZConnected();
      setQzStatus(prev => {
        if (active && prev !== 'connected') return 'connected';
        if (!active && prev === 'connected') {
          // Reconnect if autoPrint
          if (config.autoPrint) connect();
          return 'disconnected';
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [config.autoPrint]);

  // ── Refresh printer list ─────────────────────────────────────
  const refreshPrinters = useCallback(async () => {
    setPrinterError('');
    try {
      if (!isQZConnected()) {
        await connectQZ();
        setQzStatus('connected');
      }
      const list = await getPrinters();
      console.log('[usePrinter] refreshPrinters result:', list);
      setPrinters([...list]); // force new array ref to trigger re-render
      if (list.length === 0) {
        setPrinterError('No printers found. Make sure printers are installed in Windows.');
      }
      return list;
    } catch (err) {
      console.error('[usePrinter] refreshPrinters error:', err);
      setPrinterError('Refresh failed: ' + err.message);
      setPrinters([]);
      throw err;
    }
  }, []);

  // ── Update config ─────────────────────────────────────────────
  const updateConfig = useCallback((updates) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      saveConfig(next);
      return next;
    });
  }, []);

  // ── Print both (with dedup) ───────────────────────────────────
  const printOrder = useCallback(async (order, jobId = null) => {
    const id = jobId || order.id;

    // Dedup check
    if (printedJobs.has(id)) {
      return { alreadyPrinted: true };
    }

    if (!config.autoPrint) return { skipped: true };
    if (!isQZConnected()) {
      try { await connectQZ(); } catch {
        return { error: 'QZ Tray not connected' };
      }
    }

    setPrintStatus({ counter: 'printing', kitchen: 'printing' });
    setPrintError({ counter: null, kitchen: null });

    const { results, errors } = await printBothQZ(
      config.counterPrinter,
      config.kitchenPrinter,
      order
    );

    setPrintStatus({
      counter: results.counter,
      kitchen: results.kitchen,
    });
    setPrintError({
      counter: errors.counter,
      kitchen: errors.kitchen,
    });

    // Mark as printed only if at least one succeeded
    if (results.counter === 'success' || results.kitchen === 'success') {
      printedJobs.add(id);
    }

    return { results, errors };
  }, [config]);

  // ── Retry single printer ──────────────────────────────────────
  const retryCounter = useCallback(async (order) => {
    if (!config.counterPrinter) return;
    setPrintStatus(p => ({ ...p, counter: 'printing' }));
    setPrintError(p => ({ ...p, counter: null }));
    try {
      await printCounterReceipt(config.counterPrinter, order);
      setPrintStatus(p => ({ ...p, counter: 'success' }));
    } catch (err) {
      setPrintStatus(p => ({ ...p, counter: 'error' }));
      setPrintError(p => ({ ...p, counter: err.message }));
    }
  }, [config.counterPrinter]);

  const retryKitchen = useCallback(async (order) => {
    if (!config.kitchenPrinter) return;
    setPrintStatus(p => ({ ...p, kitchen: 'printing' }));
    setPrintError(p => ({ ...p, kitchen: null }));
    try {
      await printKitchenSlip(config.kitchenPrinter, order);
      setPrintStatus(p => ({ ...p, kitchen: 'success' }));
    } catch (err) {
      setPrintStatus(p => ({ ...p, kitchen: 'error' }));
      setPrintError(p => ({ ...p, kitchen: err.message }));
    }
  }, [config.kitchenPrinter]);

  // ── Test printers ─────────────────────────────────────────────
  const testCounter = useCallback(async () => {
    if (!config.counterPrinter) throw new Error('No counter printer selected');
    const testOrder = {
      id: 'TEST0001',
      createdAt: { toDate: () => new Date() },
      customer: { name: 'Test Customer', phone: '0300-0000000' },
      orderType: 'delivery',
      paymentMethod: 'cash',
      items: [{ name: 'Zinger Burger', price: 390, quantity: 1 }],
      summary: { subtotal: 390, discount: 0, deliveryFee: 100, total: 490 },
    };
    await printCounterReceipt(config.counterPrinter, testOrder);
  }, [config.counterPrinter]);

  const testKitchen = useCallback(async () => {
    if (!config.kitchenPrinter) throw new Error('No kitchen printer selected');
    const testOrder = {
      id: 'TEST0001',
      createdAt: { toDate: () => new Date() },
      customer: { name: 'Test Customer' },
      orderType: 'delivery',
      tableNumber: null,
      items: [
        { name: 'Zinger Burger', quantity: 2 },
        { name: 'Chicken Pizza', quantity: 1 },
      ],
      notes: 'No spicy sauce please',
    };
    await printKitchenSlip(config.kitchenPrinter, testOrder);
  }, [config.kitchenPrinter]);

  return {
    // State
    qzStatus,
    printers,
    printerError,
    config,
    printStatus,
    printError,
    // Actions
    connect,
    disconnect,
    refreshPrinters,
    updateConfig,
    printOrder,
    retryCounter,
    retryKitchen,
    testCounter,
    testKitchen,
  };
};

export default usePrinter;
