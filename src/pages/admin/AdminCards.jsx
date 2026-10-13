import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, X, Plus, ToggleLeft, ToggleRight,
  TrendingUp, Users, Gift, Star, Printer
} from 'lucide-react';
import { getAllCards, toggleCard, manualAddVisit } from '../../firebase/cardService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const toastStyle = { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #E31E24' } };

const tierColors = {
  Bronze: 'text-amber-700 bg-amber-900/20 border-amber-700/30',
  Silver: 'text-gray-300  bg-gray-700/20  border-gray-500/30',
  Gold:   'text-amber-400 bg-amber-500/20 border-amber-500/30',
};

const tierEmoji = { Bronze: 'ðŸ¥‰', Silver: 'ðŸ¥ˆ', Gold: 'ðŸ¥‡' };

const AdminCards = () => {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ name: '', phone: '', cardId: '' });
  const [issuing, setIssuing]     = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    const data = await getAllCards();
    setCards(data);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const filtered = cards.filter(c =>
    !search ||
    c.cardId?.toLowerCase().includes(search.toLowerCase()) ||
    c.userName?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleToggle = async (card) => {
    await toggleCard(card.id, !card.active);
    toast.success(`Card ${card.active ? 'deactivated' : 'activated'}!`, toastStyle);
    await fetchCards();
  };

  const handleAddVisit = async (card) => {
    await manualAddVisit(card.id);
    toast.success('Visit added!', toastStyle);
    await fetchCards();
    if (selected?.id === card.id) {
      setSelected(prev => ({ ...prev, visits: (prev.visits || 0) + 1, totalVisits: (prev.totalVisits || 0) + 1 }));
    }
  };

  // ── PRINT SINGLE CARD ─────────────────────────────────────────────────────
  const printCard = async (card) => {
    const visits = card.visits || 0;
    const isEligible = visits >= 10;
    const ms = (f) => '<div style="width:52px;height:52px;border-radius:50%;background:' + (f?'#E31E24':'transparent') + ';border:2px solid ' + (f?'#E31E24':'rgba(255,255,255,0.22)') + ';display:flex;align-items:center;justify-content:center;box-shadow:' + (f?'0 0 10px rgba(245,166,35,0.5)':'none') + ';flex-shrink:0;"><svg viewBox="0 0 24 24" width="26" height="26" fill="' + (f?'#1a1100':'none') + '" stroke="' + (f?'none':'rgba(255,255,255,0.28)') + '" stroke-width="1.3" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C9.5 3 7.5 4.8 7.5 7c0 .4.1.8.2 1.1C6.1 8.5 5 9.7 5 11.2c0 1.7 1.4 3 3 3h8c1.6 0 3-1.3 3-3 0-1.5-1.1-2.7-2.7-3.1.1-.3.2-.7.2-1.1C16.5 4.8 14.5 3 12 3z"/><rect x="8" y="14" width="8" height="6" rx="1"/><line x1="10" y1="16.5" x2="14" y2="16.5" stroke="' + (f?'#E31E24':'rgba(255,255,255,0.18)') + '" stroke-width="1"/><line x1="10" y1="18.5" x2="14" y2="18.5" stroke="' + (f?'#E31E24':'rgba(255,255,255,0.18)') + '" stroke-width="1"/></svg></div>';
    const r1 = Array.from({length:5},(_,i)=>ms(i<visits)).join('');
    const r2 = Array.from({length:5},(_,i)=>ms((i+5)<visits)).join('');

    // Pizza image - single slice
    const pizzaUrl = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=90&auto=format&fit=crop';
    const logoUrl  = 'https://i.ibb.co/ccRqvF5J/image.png';

    // Generate QR code for follow page
    const followUrl = 'https://kruncheez-pos.web.app/follow';
    let qrDataUrl = '';
    try {
      const QRCode = (await import('qrcode')).default;
      qrDataUrl = await QRCode.toDataURL(followUrl, {
        width: 100, margin: 1,
        color: { dark: '#000000', light: '#E31E24' },
        errorCorrectionLevel: 'H',
      });
    } catch { qrDataUrl = ''; }
    const css = '*{margin:0;padding:0;box-sizing:border-box;}@page{size:A4 portrait;margin:8mm;}body{background:#cdc5ba;font-family:Inter,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;gap:18px;}.lbl{font-size:10px;font-weight:700;color:#666;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;align-self:flex-start;width:100%;max-width:640px;}.card{width:100%;max-width:640px;border-radius:20px;overflow:hidden;position:relative;background:#111;box-shadow:0 20px 60px rgba(0,0,0,0.5);}.dots{position:absolute;inset:0;z-index:1;background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);background-size:20px 20px;}.front{height:340px;}.f-pizza{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:2;border-radius:20px;opacity:0.22;}.f-logo{width:120px;height:55px;object-fit:contain;filter:brightness(100) invert(1);opacity:0.9;margin-bottom:2px;}.yc1{position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:#E31E24;border-radius:50%;z-index:3;}.yc2{position:absolute;bottom:-60px;left:-60px;width:170px;height:170px;background:#E31E24;border-radius:50%;z-index:3;opacity:0.5;}.badge{position:absolute;top:18px;right:18px;width:112px;height:112px;background:#E31E24;border-radius:50%;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.5);box-shadow:0 6px 20px rgba(245,166,35,0.5);}.b-get{font-size:10px;font-weight:900;color:white;letter-spacing:2px;line-height:1;}.b-pct{font-family:Oswald,Arial;font-size:36px;font-weight:900;color:white;line-height:1;}.b-off{font-family:Oswald,Arial;font-size:14px;font-weight:900;color:white;}.b-sub{font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center;line-height:1.4;margin-top:3px;}.f-cnt{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:10px;}.f-the{font-family:Oswald,Arial;font-size:13px;font-weight:700;color:white;letter-spacing:5px;text-transform:uppercase;}.f-brand{font-family:Oswald,Arial;font-size:46px;font-weight:900;color:#E31E24;line-height:1;letter-spacing:3px;text-transform:uppercase;text-shadow:0 3px 12px rgba(0,0,0,0.6),0 0 20px rgba(227,30,36,0.4);}.f-tag{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:4px;}.f-lc{font-family:Oswald,Arial;font-size:30px;font-weight:900;color:white;letter-spacing:7px;margin-top:8px;}.f-eat{display:flex;align-items:center;gap:12px;margin-top:7px;}.f-eat span{font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:3px;}.f-dot{width:5px;height:5px;background:#E31E24;border-radius:50%;}.f-strip{position:absolute;bottom:0;left:0;right:0;z-index:6;padding:12px 24px;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%);display:flex;justify-content:space-between;align-items:flex-end;}.f-name{font-family:Oswald,Arial;font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:3px;text-transform:uppercase;}.f-id{font-family:Oswald,Arial;font-size:11px;color:rgba(245,166,35,0.6);letter-spacing:3px;}.back{height:340px;}.yc3{position:absolute;top:-30px;right:-30px;width:140px;height:140px;background:#E31E24;border-radius:50%;z-index:2;opacity:0.85;}.yc4{position:absolute;bottom:-35px;left:-35px;width:120px;height:120px;background:#E31E24;border-radius:50%;z-index:2;opacity:0.6;}.b-inner{position:relative;z-index:4;display:flex;height:100%;padding:18px 20px 55px;gap:20px;}.b-left{flex:1;display:flex;flex-direction:column;}.bl-the{font-family:Oswald,Arial;font-size:10px;font-weight:700;color:white;letter-spacing:4px;text-transform:uppercase;}.bl-brand{font-family:Oswald,Arial;font-size:26px;font-weight:900;color:#E31E24;line-height:1.1;letter-spacing:2px;text-transform:uppercase;text-shadow:0 0 15px rgba(227,30,36,0.4);}.bl-tag{font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin-bottom:14px;}.sw{display:flex;flex-direction:column;gap:8px;}.sr{display:flex;gap:7px;}.ty{margin-top:auto;padding-top:10px;}.ty1{font-size:10px;color:rgba(255,255,255,0.3);font-style:italic;}.ty2{font-family:Oswald,Arial;font-size:18px;font-weight:900;color:#E31E24;line-height:1.3;letter-spacing:1px;}.ty3{font-size:10px;color:rgba(255,255,255,0.25);}.b-right{width:220px;display:flex;flex-direction:column;gap:12px;}.gf{text-align:right;}.gf1,.gf2{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;}.gf3{font-family:"Dancing Script",cursive;font-size:26px;color:white;line-height:1.2;}.gfh{color:#E31E24;}.ob{background:#E31E24;border-radius:6px;padding:10px 14px;clip-path:polygon(0 8%,3% 0,100% 0,97% 92%,100% 100%,0 100%);}.obr{display:flex;align-items:baseline;gap:3px;}.obp{font-family:Oswald,Arial;font-size:38px;font-weight:900;color:white;line-height:1;}.obo{font-family:Oswald,Arial;font-size:18px;font-weight:900;color:white;}.obt{font-size:11px;font-weight:900;color:white;letter-spacing:1px;margin-top:2px;}.obs{font-size:8px;color:rgba(255,255,255,0.8);font-weight:700;margin-top:3px;}.tt{font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:5px;}.tl{list-style:none;}.tl li{font-size:9px;color:rgba(255,255,255,0.28);padding:2px 0;display:flex;gap:5px;}.tl li::before{content:"*";color:#E31E24;}.bs{position:absolute;bottom:0;left:0;right:0;z-index:5;padding:8px 20px;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.6) 70%,transparent 100%);display:flex;justify-content:space-between;align-items:center;}.bs-left{display:flex;flex-direction:column;gap:2px;}.bsn{font-family:Oswald,Arial;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:2px;}.bsi{font-family:Oswald,Arial;font-size:11px;color:rgba(245,166,35,0.45);letter-spacing:2px;}.qr-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;}.qr-box{background:#E31E24;border-radius:5px;padding:3px;box-shadow:0 2px 8px rgba(245,166,35,0.5);}.qr-box img{display:block;width:48px;height:48px;border-radius:2px;}.qr-lbl{font-size:7px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-align:center;}.qr-sub{font-size:6px;color:rgba(255,255,255,0.3);letter-spacing:1px;text-align:center;}@media print{body{background:#cdc5ba;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;gap:14px;}.card{page-break-inside:avoid;}}';
    const nm = (card.userName||'Customer').toUpperCase();
    const win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><title>KrunchEez Loyalty Card</title><link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@700&family=Oswald:wght@700;900&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"/><style>' + css + '</style></head><body>');
    win.document.write('<div class="lbl">Front Side</div><div class="card front"><div class="dots"></div><div class="yc1"></div><div class="yc2"></div><img class="f-pizza" src="' + pizzaUrl + '" onerror="this.style.display=\'none\'"/>><div class="badge"><div class="b-get">GET</div><div class="b-pct">10%</div><div class="b-off">OFF</div><div class="b-sub">ON YOUR NEXT<br/>ORDER</div></div><div class="f-cnt"><div class="f-the">The</div><div class="f-brand">Kruncheez</div><div class="f-tag">Crunch in Every Bite</div><div style="margin:6px 0 2px;opacity:0.9;"><svg viewBox=""0 0 120 60"" width=""80"" height=""40"" xmlns=""http://www.w3.org/2000/svg""><path d=""M60 52 C48 52 42 44 42 38 C42 32 38 28 32 26 C26 24 20 22 18 18 C16 14 20 10 26 12 C30 14 34 18 38 20 C40 20 42 18 44 16 C46 12 50 8 60 8 C70 8 74 12 76 16 C78 18 80 20 82 20 C86 18 90 14 94 12 C100 10 104 14 102 18 C100 22 94 24 88 26 C82 28 78 32 78 38 C78 44 72 52 60 52Z"" fill=""white""/><path d=""M10 8 Q25 20 42 22"" stroke=""white"" stroke-width=""3"" fill=""none"" stroke-linecap=""round""/><path d=""M110 8 Q95 20 78 22"" stroke=""white"" stroke-width=""3"" fill=""none"" stroke-linecap=""round""/><ellipse cx=""60"" cy=""30"" rx=""6"" ry=""8"" fill=""white""/><path d=""M56 20 L60 15 L64 20"" fill=""#E31E24""/><path d=""M54 18 L60 10 L66 18"" fill=""#E31E24"" opacity=""0.8""/></svg></div><div class="f-lc">LOYALTY <span style="color:#E31E24">CARD</span></div><div class="f-eat"><span>EAT</span><div class="f-dot"></div><span>EARN</span><div class="f-dot"></div><span>ENJOY</span></div></div><div class="f-strip"><div class="f-name">' + nm + '</div><div class="f-id">' + card.cardId + '</div></div></div>');
    win.document.write('<div class="lbl">Back Side</div><div class="card back"><div class="dots"></div><div class="yc3"></div><div class="yc4"></div><div class="b-inner"><div class="b-left"><div class="bl-the">The</div><div class="bl-brand">Kruncheez</div><div class="bl-tag">Crunch in Every Bite</div><div class="sw"><div class="sr">' + r1 + '</div><div class="sr">' + r2 + '</div></div><div class="ty"><div class="ty1">Thank You</div><div class="ty2">for being a part of</div><div class="ty3">The Kruncheez Family!</div></div></div><div class="b-right"><div class="gf"><div class="gf1">Good Food</div><div class="gf2">Brings People</div><div class="gf3">Together <span class="gfh">&#9829;</span></div></div><div class="ob"><div class="obr"><div class="obp">10%</div><div class="obo">OFF</div></div><div class="obt">ON YOUR NEXT ORDER</div><div class="obs">' + (isEligible ? '&#10003; DISCOUNT READY!' : (10-visits) + ' more visits') + '</div></div><div><div class="tt">Terms &amp; Conditions:</div><ul class="tl"><li>Valid for dine-in &amp; online orders</li><li>One card per customer</li><li>Not valid with other offers</li><li>Keep this card safe</li></ul></div></div></div><div class="bs"><div class="bs-left"><div class="bsn">' + nm + '</div><div class="bsi">' + card.cardId + (card.phone?' &bull; '+card.phone:'') + '</div></div>' + (qrDataUrl ? '<div class="qr-wrap"><div class="qr-box"><img src="' + qrDataUrl + '" width="52" height="52"/></div><div class="qr-lbl">SCAN &amp; FOLLOW</div></div>' : '') + '</div></div>');
    win.document.write('<scr'+'ipt>(function(){var imgs=document.querySelectorAll("img"),done=0,n=imgs.length;function go(){if(++done>=n)setTimeout(function(){window.print();window.close();},800);}if(!n){setTimeout(function(){window.print();window.close();},1000);return;}imgs.forEach(function(img){if(img.complete&&img.naturalHeight)go();else{img.onload=go;img.onerror=go;}});setTimeout(function(){window.print();window.close();},6000);})();<'+'/script></body></html>');
    win.document.close();
  };



  // â”€â”€ PRINT ALL CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const printAllCards = () => {
    const cardsHTML = cards.map(card => {
      const visits     = card.visits || 0;
      const tier       = card.tier || 'Bronze';
      const tierBadge  = { Bronze: 'ðŸ¥‰', Silver: 'ðŸ¥ˆ', Gold: 'ðŸ¥‡' }[tier] || 'ðŸ¥‰';
      const isEligible = visits >= 10;

      const stampsRow = Array.from({ length: 10 }, (_, i) => `
        <div style="width:46px;height:46px;border-radius:50%;background:${i < visits ? '#E31E24' : 'transparent'};border:2px solid ${i < visits ? '#E31E24' : 'rgba(255,255,255,0.18)'};display:inline-flex;align-items:center;justify-content:center;font-size:20px;">
          ${i < visits ? 'ðŸ‘¨â€ðŸ³' : '<span style="opacity:0.2">ðŸ‘¨â€ðŸ³</span>'}
        </div>
      `).join('');

      return `
        <div style="width:680px;height:380px;background:#0f0f0f;border-radius:20px;position:relative;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.4);page-break-inside:avoid;">
          <div style="position:absolute;top:-30px;right:-30px;width:180px;height:180px;background:#E31E24;border-radius:50%;z-index:1;"></div>
          <div style="position:absolute;bottom:-50px;left:-50px;width:140px;height:140px;background:#E31E24;border-radius:50%;z-index:1;opacity:0.6;"></div>
          <div style="position:absolute;left:8px;bottom:-12px;font-size:95px;z-index:3;filter:drop-shadow(0 10px 20px rgba(0,0,0,0.5));">ðŸ”</div>
          <div style="position:absolute;left:75px;bottom:25px;font-size:58px;z-index:3;">ðŸŸ</div>
          <div style="position:absolute;right:148px;bottom:-5px;font-size:72px;z-index:3;">ðŸ—</div>
          <div style="position:absolute;top:22px;right:22px;width:115px;height:115px;background:#E31E24;border-radius:50%;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(245,166,35,0.5);border:3px solid rgba(255,255,255,0.4);">
            <div style="font-size:11px;font-weight:900;color:#000;letter-spacing:1px;">GET</div>
            <div style="font-family:Arial;font-size:36px;font-weight:900;color:#000;line-height:1;">10%</div>
            <div style="font-size:14px;font-weight:900;color:#000;">OFF</div>
            <div style="font-size:8px;font-weight:700;color:#333;text-align:center;line-height:1.3;margin-top:2px;">ON YOUR NEXT<br/>ORDER</div>
          </div>
          <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:24px;">
            <div style="font-size:16px;font-weight:700;color:white;letter-spacing:3px;">ðŸ‘¨â€ðŸ³ The</div>
            <div style="font-size:48px;color:#E31E24;line-height:1;font-weight:900;font-style:italic;">Kruncheez</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:3px;margin-top:2px;">Crunch in Every Bite</div>
            <div style="font-size:32px;font-weight:900;color:white;letter-spacing:6px;margin-top:6px;">LOYALTY <span style="color:#E31E24;">CARD</span></div>
            <div style="display:flex;align-items:center;gap:12px;margin-top:6px;">
              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:3px;">EAT</span>
              <div style="width:5px;height:5px;background:#E31E24;border-radius:50%;"></div>
              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:3px;">EARN</span>
              <div style="width:5px;height:5px;background:#E31E24;border-radius:50%;"></div>
              <span style="font-size:12px;color:rgba(255,255,255,0.45);letter-spacing:3px;">ENJOY</span>
            </div>
            <div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.3);letter-spacing:3px;">${(card.userName||'Customer').toUpperCase()}</div>
            <div style="font-size:12px;color:rgba(245,166,35,0.5);letter-spacing:4px;">${card.cardId}</div>
          </div>
        </div>
      `;
    }).join('<div style="height:20px;"></div>');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>All Loyalty Cards</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#e8e0d0;display:flex;flex-direction:column;align-items:center;padding:30px;gap:30px;font-family:Arial;}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
      </style></head>
      <body>${cardsHTML}
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // â”€â”€ ISSUE CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleIssue = async () => {
    if (!issueForm.name || !issueForm.cardId) { toast.error('Name and Card ID required', toastStyle); return; }
    const cardId = issueForm.cardId.toUpperCase().startsWith('KC-')
      ? issueForm.cardId.toUpperCase()
      : `KC-${issueForm.cardId.toUpperCase()}`;
    setIssuing(true);
    try {
      await addDoc(collection(db, 'loyaltyCards'), {
        cardId,
        userId: null,
        userName: issueForm.name,
        phone: issueForm.phone,
        visits: 0, points: 0, totalVisits: 0, totalSaved: 0,
        discountPercent: 10, visitsForDiscount: 10,
        active: true, tier: 'Bronze',
        createdAt: serverTimestamp(),
        lastVisit: serverTimestamp(),
        issuedByAdmin: true,
      });
      toast.success(`Card ${cardId} issued!`, toastStyle);
      await fetchCards();
      setShowIssue(false);
      setIssueForm({ name: '', phone: '', cardId: '' });
    } catch { toast.error('Failed to issue card', toastStyle); }
    finally { setIssuing(false); }
  };

  // Stats
  const totalCards  = cards.length;
  const activeCards = cards.filter(c => c.active).length;
  const totalVisits = cards.reduce((s, c) => s + (c.totalVisits || 0), 0);
  const totalSaved  = cards.reduce((s, c) => s + (c.totalSaved  || 0), 0);
  const eligible    = cards.filter(c => (c.visits || 0) >= 10).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Loyalty Cards</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">{totalCards} cards issued</p>
        </div>
        <div className="flex items-center gap-3">
          {cards.length > 0 && (
            <button onClick={printAllCards}
              className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
              <Printer size={15} /> Print All
            </button>
          )}
          <button onClick={() => setShowIssue(true)}
            className="flex items-center gap-2 btn-primary text-sm">
            <Plus size={16} /> Issue Card
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Cards',  value: totalCards,                          icon: <Gift size={18} className="text-krunch-red" />,     bg: 'bg-krunch-red/10' },
          { label: 'Active',       value: activeCards,                         icon: <Star size={18} className="text-green-400" />,      bg: 'bg-green-400/10' },
          { label: 'Eligible Now', value: eligible,                            icon: <TrendingUp size={18} className="text-amber-400" />, bg: 'bg-amber-400/10' },
          { label: 'Total Visits', value: totalVisits,                         icon: <Users size={18} className="text-blue-400" />,      bg: 'bg-blue-400/10' },
          { label: 'Total Saved',  value: `Rs.${totalSaved.toLocaleString()}`, icon: <TrendingUp size={18} className="text-purple-400" />,bg: 'bg-purple-400/10' },
        ].map((s, i) => (
          <div key={i} className="card-dark p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>{s.icon}</div>
            <p className="font-heading font-black text-xl text-white">{s.value}</p>
            <p className="text-krunch-gray font-body text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-krunch-gray" />
        <input type="text" placeholder="Search by card ID, name, phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-krunch-card border border-krunch-border rounded-xl pl-10 pr-4 py-2.5 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
      </div>

      {/* Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-krunch-border">
                {['Card ID','Customer','Tier','Visits','Points','Saved','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-krunch-red border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-krunch-gray font-body text-sm">No cards found</td></tr>
              ) : filtered.map((card, i) => {
                const isElig = (card.visits || 0) >= 10;
                return (
                  <motion.tr key={card.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-krunch-red text-sm tracking-wider">{card.cardId}</span>
                        {isElig && <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold">ELIGIBLE</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-body font-semibold text-sm">{card.userName || 'â€”'}</p>
                      <p className="text-krunch-gray font-body text-xs">{card.phone || 'â€”'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tierColors[card.tier] || tierColors.Bronze}`}>
                        {tierEmoji[card.tier]} {card.tier || 'Bronze'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} className={`w-2 h-4 rounded-sm ${j < (card.visits||0) ? 'bg-krunch-red' : 'bg-krunch-border'}`} />
                          ))}
                        </div>
                        <span className="text-white font-body text-xs font-bold">{card.visits||0}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        <span className="text-amber-400 font-body font-bold text-sm">{card.points||0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-body font-bold text-sm">Rs.{(card.totalSaved||0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(card)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                          card.active
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                        }`}>
                        {card.active ? <><ToggleRight size={12} /> Active</> : <><ToggleLeft size={12} /> Inactive</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(card)}
                          className="w-7 h-7 rounded-lg bg-krunch-black border border-krunch-border flex items-center justify-center text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all">
                          <Eye size={12} />
                        </button>
                        <button onClick={() => handleAddVisit(card)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-krunch-red/10 text-krunch-red border border-krunch-red/20 hover:bg-krunch-red hover:text-white transition-all font-bold whitespace-nowrap">
                          +Visit
                        </button>
                        <button onClick={() => printCard(card)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-krunch-black border border-krunch-border text-krunch-gray hover:text-white hover:border-krunch-red/50 transition-all font-bold whitespace-nowrap flex items-center gap-1">
                          <Printer size={10} /> Print
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Card Modal */}
      <AnimatePresence>
        {showIssue && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowIssue(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Issue Loyalty Card</h3>
                <button onClick={() => setShowIssue(false)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { key: 'name',   label: 'Customer Name *', placeholder: 'Muhammad Ahmed' },
                  { key: 'phone',  label: 'Phone Number',    placeholder: '03XX-XXXXXXX' },
                  { key: 'cardId', label: 'Card Number *',   placeholder: 'e.g. 12345 (KC- auto added)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1.5 block">{f.label}</label>
                    <input type="text" value={issueForm[f.key]}
                      onChange={e => setIssueForm({ ...issueForm, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-krunch-black border border-krunch-border rounded-xl px-4 py-3 text-white font-body text-sm placeholder-krunch-gray/40 focus:outline-none focus:border-krunch-red transition-colors" />
                  </div>
                ))}
                <div className="bg-krunch-black border border-krunch-border rounded-xl p-3">
                  <p className="text-krunch-gray font-body text-xs">
                    Card: <span className="text-white">0/10 visits</span> â€¢ <span className="text-white">Bronze tier</span> â€¢ <span className="text-white">10% after 10 visits</span>
                  </p>
                </div>
                <button onClick={handleIssue} disabled={issuing}
                  className="w-full flex items-center justify-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider disabled:opacity-70">
                  {issuing
                    ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <><Gift size={16} /> Issue Card</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-krunch-dark border border-krunch-border rounded-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border sticky top-0 bg-krunch-dark">
                <h3 className="font-heading font-bold text-white uppercase">Card Details</h3>
                <button onClick={() => setSelected(null)} className="text-krunch-gray hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-6">
                <div className="bg-krunch-red rounded-xl p-4 mb-4 text-center">
                  <p className="font-heading font-black text-white text-2xl tracking-widest">{selected.cardId}</p>
                  <p className="text-red-200 font-body text-sm mt-1">{selected.userName}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Current',  value: `${selected.visits||0}/10` },
                    { label: 'Total',    value: selected.totalVisits||0 },
                    { label: 'Points',   value: selected.points||0 },
                    { label: 'Saved',    value: `Rs.${(selected.totalSaved||0).toLocaleString()}` },
                    { label: 'Tier',     value: `${tierEmoji[selected.tier]} ${selected.tier}` },
                    { label: 'Status',   value: selected.active ? 'âœ… Active' : 'âŒ Off' },
                  ].map((s, i) => (
                    <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                      <p className="font-heading font-black text-krunch-red text-lg">{s.value}</p>
                      <p className="text-krunch-gray font-body text-[10px] uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-2">Visit Progress</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i}
                        className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i < (selected.visits||0) ? 'bg-krunch-red text-white' : 'bg-krunch-black border border-krunch-border text-krunch-gray'
                        }`}>
                        {i < (selected.visits||0) ? 'âœ“' : i+1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleAddVisit(selected)}
                    className="flex-1 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm py-3 rounded-xl transition-all uppercase">
                    + Add Visit
                  </button>
                  <button onClick={() => printCard(selected)}
                    className="flex items-center justify-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-3 rounded-xl transition-all">
                    <Printer size={15} /> Print
                  </button>
                  <button onClick={() => handleToggle(selected)}
                    className={`flex-1 font-heading font-bold text-sm py-3 rounded-xl transition-all uppercase border ${
                      selected.active
                        ? 'bg-red-900/20 border-red-700/30 text-red-400 hover:bg-red-700/30'
                        : 'bg-green-900/20 border-green-700/30 text-green-400 hover:bg-green-700/30'
                    }`}>
                    {selected.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCards;

















