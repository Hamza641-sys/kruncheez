import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { Plus, Printer, Download, Trash2, QrCode, Eye, X, CheckCircle } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };
const BASE_URL = 'https://kruncheez-pos.web.app';

const AdminQR = () => {
  const [tables, setTables]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount]           = useState(1);
  const [preview, setPreview]       = useState(null);
  const [qrDataURLs, setQrDataURLs] = useState({});
  const printRef = useRef(null);

  // Fetch tables
  const fetchTables = async () => {
    const snap = await getDocs(collection(db, 'tables'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.tableNumber - b.tableNumber);
    setTables(data);
    setLoading(false);
    // Generate QR data URLs for all tables
    const urls = {};
    for (const t of data) {
      urls[t.id] = await generateQRDataURL(t.tableNumber);
    }
    setQrDataURLs(urls);
  };

  useEffect(() => { fetchTables(); }, []);

  const generateQRDataURL = async (tableNumber) => {
    const url = `${BASE_URL}/menu?table=${tableNumber}`;
    return await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
  };

  // Generate tables
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const existing = tables.map(t => t.tableNumber);
      const maxTable = existing.length ? Math.max(...existing) : 0;
      for (let i = 1; i <= count; i++) {
        const tableNumber = maxTable + i;
        await addDoc(collection(db, 'tables'), {
          tableNumber,
          status: 'free',
          url: `${BASE_URL}/menu?table=${tableNumber}`,
          createdAt: serverTimestamp(),
        });
      }
      toast.success(`${count} table(s) generated!`, toastStyle);
      await fetchTables();
    } catch { toast.error('Failed to generate', toastStyle); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return;
    await deleteDoc(doc(db, 'tables', id));
    await fetchTables();
    toast.success('Table deleted', toastStyle);
  };

  const toggleStatus = async (table) => {
    const newStatus = table.status === 'free' ? 'occupied' : 'free';
    await updateDoc(doc(db, 'tables', table.id), { status: newStatus });
    await fetchTables();
  };

  // Print single QR card
  const printSingle = (table) => {
    const qrUrl = qrDataURLs[table.id];
    if (!qrUrl) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table ${table.tableNumber} QR - The KrunchEez</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Arial', sans-serif; background: #fff; }
          .card {
            width: 3.5in; height: 5in;
            margin: 0.25in auto;
            border: 3px solid #E31E24;
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #0A0A0A;
            page-break-after: always;
          }
          .header {
            background: #E31E24;
            width: 100%;
            padding: 14px;
            text-align: center;
          }
          .brand { color: white; font-size: 20px; font-weight: 900; letter-spacing: 2px; }
          .tagline { color: rgba(255,255,255,0.8); font-size: 9px; letter-spacing: 3px; margin-top: 2px; }
          .qr-wrap {
            background: white;
            padding: 14px;
            border-radius: 12px;
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(227,30,36,0.3);
          }
          .qr-wrap img { display: block; width: 200px; height: 200px; }
          .table-num {
            color: white;
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 1px;
            text-align: center;
          }
          .table-label { color: #E31E24; font-size: 11px; letter-spacing: 4px; text-align: center; margin-bottom: 4px; }
          .scan-text { color: #888; font-size: 11px; letter-spacing: 2px; text-align: center; margin-top: 10px; }
          .emoji { font-size: 18px; margin-top: 8px; }
          .footer {
            background: #111;
            width: 100%;
            padding: 10px;
            text-align: center;
            margin-top: auto;
            border-top: 1px solid #222;
          }
          .footer-text { color: #555; font-size: 8px; letter-spacing: 2px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="brand">🐂 THE KRUNCHEEZ</div>
            <div class="tagline">FAST FOOD • CHINESE • BBQ</div>
          </div>
          <div class="qr-wrap">
            <img src="${qrUrl}" alt="QR Code" />
          </div>
          <div class="table-label">TABLE NUMBER</div>
          <div class="table-num">${table.tableNumber}</div>
          <div class="scan-text">📱 SCAN TO VIEW MENU & ORDER</div>
          <div class="emoji">🍔 🍕 🔥 🍜</div>
          <div class="footer">
            <div class="footer-text">kruncheez-pos.web.app • HALAL CERTIFIED</div>
          </div>
        </div>
        <script>window.onload=()=>{window.print();window.close();}</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // Print ALL QR cards
  const printAll = () => {
    const cards = tables.map(table => {
      const qrUrl = qrDataURLs[table.id] || '';
      return `
        <div class="card">
          <div class="header">
            <div class="brand">🐂 THE KRUNCHEEZ</div>
            <div class="tagline">FAST FOOD • CHINESE • BBQ</div>
          </div>
          <div class="qr-wrap">
            <img src="${qrUrl}" alt="QR Code" />
          </div>
          <div class="table-label">TABLE NUMBER</div>
          <div class="table-num">${table.tableNumber}</div>
          <div class="scan-text">📱 SCAN TO VIEW MENU & ORDER</div>
          <div class="emoji">🍔 🍕 🔥 🍜</div>
          <div class="footer">
            <div class="footer-text">kruncheez-pos.web.app • HALAL CERTIFIED</div>
          </div>
        </div>
      `;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>All QR Codes - KrunchEez</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .grid { display: flex; flex-wrap: wrap; gap: 0.2in; padding: 0.25in; justify-content: center; }
        .card {
          width: 3.5in; height: 5in;
          border: 3px solid #E31E24; border-radius: 16px;
          overflow: hidden; display: flex; flex-direction: column;
          align-items: center; background: #0A0A0A;
          page-break-inside: avoid;
        }
        .header { background: #E31E24; width: 100%; padding: 14px; text-align: center; }
        .brand { color: white; font-size: 20px; font-weight: 900; letter-spacing: 2px; }
        .tagline { color: rgba(255,255,255,0.8); font-size: 9px; letter-spacing: 3px; margin-top: 2px; }
        .qr-wrap { background: white; padding: 14px; border-radius: 12px; margin: 20px auto; }
        .qr-wrap img { display: block; width: 200px; height: 200px; }
        .table-num { color: white; font-size: 42px; font-weight: 900; text-align: center; }
        .table-label { color: #E31E24; font-size: 11px; letter-spacing: 4px; text-align: center; margin-bottom: 4px; }
        .scan-text { color: #888; font-size: 11px; letter-spacing: 2px; text-align: center; margin-top: 10px; }
        .emoji { font-size: 18px; margin-top: 8px; }
        .footer { background: #111; width: 100%; padding: 10px; text-align: center; margin-top: auto; border-top: 1px solid #222; }
        .footer-text { color: #555; font-size: 8px; letter-spacing: 2px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body><div class="grid">${cards}</div>
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    win.document.close();
  };

  const downloadQR = async (table) => {
    const url = qrDataURLs[table.id];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `kruncheez-table-${table.tableNumber}-qr.png`;
    a.click();
  };

  const free     = tables.filter(t => t.status === 'free').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading font-black text-2xl text-white uppercase">QR Code Manager</h2>
        <p className="text-krunch-gray font-body text-sm mt-1">Generate & print QR codes for each table</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Tables', value: tables.length, color: 'text-white',        bg: 'bg-krunch-card' },
          { label: 'Free',         value: free,          color: 'text-green-400',    bg: 'bg-green-400/10' },
          { label: 'Occupied',     value: occupied,      color: 'text-krunch-red',   bg: 'bg-krunch-red/10' },
        ].map((s, i) => (
          <div key={i} className={`card-dark p-4 text-center ${s.bg}`}>
            <p className={`font-heading font-black text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="card-dark p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-krunch-gray font-body text-sm">Generate</label>
            <input type="number" min={1} max={50} value={count}
              onChange={e => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-20 bg-krunch-black border border-krunch-border rounded-xl px-3 py-2 text-white font-body text-sm text-center focus:outline-none focus:border-krunch-red transition-colors" />
            <label className="text-krunch-gray font-body text-sm">table(s)</label>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-red-glow disabled:opacity-70">
            {generating
              ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <><Plus size={16} /> Generate QR Codes</>}
          </button>
          {tables.length > 0 && (
            <button onClick={printAll}
              className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-5 py-2.5 rounded-xl transition-all ml-auto">
              <Printer size={16} /> Print All
            </button>
          )}
        </div>
      </div>

      {/* QR Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-48 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📱</div>
          <p className="font-heading font-bold text-xl text-white uppercase mb-2">No Tables Yet</p>
          <p className="text-krunch-gray font-body text-sm mb-5">Generate QR codes for your tables</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table, i) => (
            <motion.div key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="card-dark overflow-hidden group"
            >
              {/* Status bar */}
              <div className={`h-1.5 w-full ${table.status === 'occupied' ? 'bg-krunch-red' : 'bg-green-500'}`} />

              {/* QR Image */}
              <div className="p-4 flex flex-col items-center">
                <div className="bg-white p-2 rounded-xl mb-3 shadow-lg">
                  {qrDataURLs[table.id]
                    ? <img src={qrDataURLs[table.id]} alt={`Table ${table.tableNumber}`} className="w-24 h-24" />
                    : <div className="w-24 h-24 bg-gray-100 animate-pulse rounded" />
                  }
                </div>

                <p className="font-heading font-black text-2xl text-white">TABLE {table.tableNumber}</p>
                <button onClick={() => toggleStatus(table)}
                  className={`mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all ${
                    table.status === 'occupied'
                      ? 'bg-krunch-red/20 text-krunch-red border border-krunch-red/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                  {table.status === 'occupied' ? '● Occupied' : '● Free'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex border-t border-krunch-border">
                <button onClick={() => setPreview(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all text-xs font-body border-r border-krunch-border">
                  <Eye size={12} /> Preview
                </button>
                <button onClick={() => printSingle(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all text-xs font-body border-r border-krunch-border">
                  <Printer size={12} /> Print
                </button>
                <button onClick={() => downloadQR(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-krunch-gray hover:text-white hover:bg-krunch-card transition-all text-xs font-body border-r border-krunch-border">
                  <Download size={12} /> Save
                </button>
                <button onClick={() => handleDelete(table.id)}
                  className="flex items-center justify-center py-2.5 px-3 text-krunch-gray hover:text-red-400 hover:bg-red-400/5 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)} className="fixed inset-0 bg-black/80 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-80 bg-krunch-black border-4 border-krunch-red rounded-2xl z-50 overflow-hidden"
            >
              {/* Preview Card */}
              <div className="bg-krunch-red p-4 text-center">
                <p className="font-heading font-black text-white text-xl tracking-widest">🐂 THE KRUNCHEEZ</p>
                <p className="text-red-200 text-[10px] tracking-widest uppercase mt-0.5">Fast Food • Chinese • BBQ</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                  {qrDataURLs[preview.id] && (
                    <img src={qrDataURLs[preview.id]} alt="QR" className="w-52 h-52" />
                  )}
                </div>
                <p className="text-krunch-gray font-body text-xs uppercase tracking-widest mb-1">TABLE NUMBER</p>
                <p className="font-heading font-black text-5xl text-white mb-1">{preview.tableNumber}</p>
                <p className="text-krunch-gray font-body text-xs">📱 Scan to view menu & order</p>
                <p className="text-krunch-gray font-body text-[10px] mt-1">🍔 🍕 🔥 🍜</p>
              </div>
              <div className="bg-krunch-dark p-3 border-t border-krunch-border text-center">
                <p className="text-krunch-gray font-body text-[9px] uppercase tracking-widest">kruncheez-pos.web.app • Halal Certified</p>
              </div>
              <div className="flex gap-3 p-4">
                <button onClick={() => printSingle(preview)}
                  className="flex-1 flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-bold text-sm py-3 rounded-xl transition-all">
                  <Printer size={15} /> Print
                </button>
                <button onClick={() => downloadQR(preview)}
                  className="flex-1 flex items-center justify-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-bold text-sm py-3 rounded-xl transition-all">
                  <Download size={15} /> Save
                </button>
                <button onClick={() => setPreview(null)}
                  className="w-11 h-11 flex items-center justify-center border border-krunch-border hover:border-red-400 text-krunch-gray hover:text-red-400 rounded-xl transition-all">
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminQR;
