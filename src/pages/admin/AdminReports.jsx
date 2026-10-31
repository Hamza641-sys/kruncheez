import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Download, Calendar, Package, Users, Star, ArrowUp, ArrowDown, Truck } from 'lucide-react';

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'all',   label: 'All Time' },
];

const getStartDate = (period) => {
  const now = new Date();
  if (period === 'today') { const d = new Date(); d.setHours(0,0,0,0); return d; }
  if (period === 'week')  { const d = new Date(); d.setDate(d.getDate()-7); return d; }
  if (period === 'month') { const d = new Date(); d.setMonth(d.getMonth()-1); return d; }
  if (period === 'year')  { const d = new Date(); d.setFullYear(d.getFullYear()-1); return d; }
  return null;
};

const filterByPeriod = (items, period, dateField = 'createdAt') => {
  const start = getStartDate(period);
  if (!start) return items;
  return items.filter(i => {
    const d = i[dateField]?.toDate?.() || (i[dateField] ? new Date(i[dateField]) : null);
    return d && d >= start;
  });
};

const AdminReports = () => {
  const [period, setPeriod]   = useState('today');
  const [orders, setOrders]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
      const [oSnap, eSnap, spSnap, salSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'expenses')),
          getDocs(collection(db, 'supplierPayments')),
          getDocs(collection(db, 'salaryRecords')),
        ]);
        const oData  = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const eData  = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const spData = spSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const salData= salSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortDesc = (a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
        setOrders(oData.sort(sortDesc));
        setExpenses(eData.sort(sortDesc));
        setPurchases(spData.sort(sortDesc));
        setSalaries(salData.sort(sortDesc));
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  // ── Filter by period ──────────────────────────────────────────────────
  const filteredOrders   = filterByPeriod(orders,    period);
  const filteredExpenses = filterByPeriod(expenses,  period);
  const filteredPurchases= filterByPeriod(purchases, period);

  // ── REVENUE calculations ──────────────────────────────────────────────
  const delivered  = filteredOrders.filter(o => o.status === 'delivered');
  const totalRev   = delivered.reduce((s,o) => s + (o.summary?.total||0), 0);
  const avgOrder   = delivered.length ? Math.round(totalRev/delivered.length) : 0;
  const pending    = filteredOrders.filter(o => o.status === 'pending').length;
  const rejected   = filteredOrders.filter(o => o.status === 'rejected').length;

  // ── Filter salaries by period ─────────────────────────────────────────
  const filteredSalaries = filterByPeriod(salaries, period);

  // ── EXPENSE calculations ──────────────────────────────────────────────
  // Daily expenses ONLY (exclude salary category)
  const dailyExpenses   = filteredExpenses.filter(e => e.category !== 'Supplier Payment' && e.category !== 'salary');
  const dailyExp        = dailyExpenses.reduce((s,e) => s + Number(e.amount||0), 0);
  // Supplier payments (separate collection)
  const supplierExp     = filteredPurchases.reduce((s,p) => s + Number(p.amount||0), 0);
  // Salary from salaryRecords collection
  const salaryExp       = filteredSalaries.reduce((s,r) => s + Number(r.paid||0), 0);
  // Total = daily + supplier + salary
  const totalExp        = dailyExp + supplierExp + salaryExp;

  // ── PROFIT ─────────────────────────────────────────────────────────────
  const profit        = totalRev - totalExp;
  const profitMargin  = totalRev > 0 ? Math.round((profit/totalRev)*100) : 0;
  const isProfit      = profit >= 0;

  // ── Helper: Format date+time ─────────────────────────────────────────
  const fmtDate = (item, field = 'createdAt') => {
    const d = item[field]?.toDate?.() || (item[field] ? new Date(item[field]) : null);
    if (!d) return '-';
    return d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
  };

  const fmtDateTime = (item, field = 'createdAt') => {
    const d = item[field]?.toDate?.() || (item[field] ? new Date(item[field]) : null);
    if (!d) return '-';
    return d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) +
      ' ' + d.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
  };

  // ── Expense by category ───────────────────────────────────────────────
  // By category - use dailyExpenses only (exclude Supplier Payment)
  const expByCat = {};
  dailyExpenses.forEach(e => {
    expByCat[e.category] = (expByCat[e.category]||0) + Number(e.amount||0);
  });
  const expCatData = Object.entries(expByCat).sort((a,b) => b[1]-a[1]);
  const maxExpCat  = Math.max(...expCatData.map(c => c[1]), 1);

  // ── Item popularity ───────────────────────────────────────────────────
  const itemCount = {};
  filteredOrders.forEach(o => o.items?.forEach(i => {
    itemCount[i.name] = (itemCount[i.name]||0) + (i.quantity||1);
  }));
  const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // ── Revenue by category ───────────────────────────────────────────────
  const catRev = {};
  filteredOrders.forEach(o => o.items?.forEach(i => {
    catRev[i.category] = (catRev[i.category]||0) + (i.price * i.quantity);
  }));
  const topCats = Object.entries(catRev).sort((a,b)=>b[1]-a[1]);

  // ── Last 7 days chart ─────────────────────────────────────────────────
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const label = d.toLocaleDateString('en-PK', { weekday:'short', day:'numeric' });
    const dayStr = d.toDateString();
    const dayOrders = orders.filter(o => o.createdAt?.toDate?.()?.toDateString() === dayStr);
    const dayExp    = expenses.filter(e => e.createdAt?.toDate?.()?.toDateString() === dayStr);
    const rev = dayOrders.filter(o=>o.status==='delivered').reduce((s,o)=>s+(o.summary?.total||0),0);
    const exp = dayExp.reduce((s,e)=>s+Number(e.amount||0),0);
    return { label, revenue: rev, expenses: exp, profit: rev-exp, orders: dayOrders.length };
  });
  const maxChart = Math.max(...last7.map(d => Math.max(d.revenue, d.expenses)), 1);

  // ── CSV Export ────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const fmt = (item, field = 'createdAt') => {
      const d = item[field]?.toDate?.() || (item[field] ? new Date(item[field]) : null);
      if (!d) return '-';
      return d.toLocaleDateString('en-PK') + ' ' + d.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
    };

    const rows = [
      ['=== KRUNCHEEZ BUSINESS REPORT ==='],
      ['Period', period, 'Generated', new Date().toLocaleDateString('en-PK')],
      [],
      ['=== REVENUE SUMMARY ==='],
      ['Total Revenue', `Rs.${totalRev}`, 'Delivered Orders', delivered.length],
      ['Avg Order Value', `Rs.${avgOrder}`, 'Pending', pending, 'Rejected', rejected],
      [],
      ['=== EXPENSE SUMMARY ==='],
      ['Total Expenses', `Rs.${totalExp}`],
      ['Supplier Payments', `Rs.${supplierExp}`],
      ['Staff Salaries', `Rs.${salaryExp}`],
      ['Daily Expenses', `Rs.${dailyExp}`],
      [],
      ['=== NET PROFIT ==='],
      ['NET PROFIT', `Rs.${profit}`, 'Margin', `${profitMargin}%`],
      [],
      ['=== ALL ORDERS - COMPLETE DETAILS ==='],
      ['#','Order ID','Date & Time','Customer','Phone','Items','Subtotal','Delivery Fee','Total','Type','Status','Payment'],
      ...filteredOrders.map((o, i) => [
        i+1,
        o.id.slice(0,8).toUpperCase(),
        fmt(o),
        o.customer?.name || '-',
        o.customer?.phone || '-',
        o.items?.map(i => `${i.name} x${i.quantity}`).join(' | ') || '-',
        o.summary?.subtotal || 0,
        o.summary?.deliveryFee || 0,
        o.summary?.total || 0,
        o.tableNumber ? `Dine-In Table ${o.tableNumber}` : o.orderType || 'delivery',
        o.status,
        o.paymentMethod || 'cash',
      ]),
      [],
      ['=== SUPPLIER PAYMENTS - COMPLETE DETAILS ==='],
      ['#','Date','Supplier','Items','Amount','Notes'],
      ...filteredPurchases.map((p, i) => [
        i+1, fmt(p), p.supplierName || '-', p.items || '-', p.amount || 0, p.notes || '-',
      ]),
      [],
      ['=== STAFF SALARY - COMPLETE DETAILS ==='],
      ['#','Date','Staff Name','Month','Total Salary','Fine','Fine Reason','Bonus','Bonus Reason','Paid','Remaining'],
      ...filteredSalaries.map((s, i) => [
        i+1, fmt(s), s.staffName || '-', s.month || '-',
        s.totalSalary || 0, s.fine || 0, s.fineReason || '-',
        s.bonus || 0, s.bonusReason || '-', s.paid || 0, s.remaining || 0,
      ]),
      [],
      ['=== DAILY EXPENSES - COMPLETE DETAILS ==='],
      ['#','Date','Category','Description','Amount','Payment Method'],
      ...filteredExpenses.map((e, i) => [
        i+1,
        fmt(e) || e.date || '-',
        e.category || '-', e.description || '-', e.amount || 0, e.paymentMethod || '-',
      ]),
    ];
    const csv = rows.map(r => Array.isArray(r) ? r.map(c => `"${c}"`).join(',') : r).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kruncheez-full-report-${period}-${new Date().toLocaleDateString('en-PK').replace(/\//g,'-')}.csv`;
    a.click();
  };

  // ── Annual Tax Report (PDF Print) ────────────────────────────────────────
  const printAnnualTaxReport = () => {
    // Use full year data regardless of period filter
    const yearOrders    = orders.filter(o => o.status === 'delivered');
    const yearRev       = yearOrders.reduce((s,o) => s + (o.summary?.total||0), 0);
    const yearSupplier  = purchases.reduce((s,p) => s + Number(p.amount||0), 0);
    const yearSalary    = salaries.reduce((s,r) => s + Number(r.paid||0), 0);
    const yearDaily     = expenses.filter(e => e.category !== 'Supplier Payment' && e.category !== 'salary')
                                  .reduce((s,e) => s + Number(e.amount||0), 0);
    const yearExp       = yearSupplier + yearSalary + yearDaily;
    const yearProfit    = yearRev - yearExp;
    const isP           = yearProfit >= 0;
    const taxYear       = new Date().getFullYear();

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Annual Tax Report ${taxYear} - The KrunchEez</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; }
          .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
          .fbr-logo { font-size: 11px; color: #555; letter-spacing: 2px; margin-bottom: 5px; }
          .title { font-size: 20px; font-weight: bold; letter-spacing: 1px; margin: 8px 0; }
          .subtitle { font-size: 13px; color: #333; }
          .ntn-box { background: #f5f5f5; border: 2px solid #000; padding: 10px 20px; margin: 15px auto; display: inline-block; text-align: center; }
          .ntn-label { font-size: 10px; letter-spacing: 2px; color: #555; }
          .ntn-number { font-size: 18px; font-weight: bold; letter-spacing: 3px; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; color: #555; }
          .section { margin: 20px 0; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background: #f0f0f0; border: 1px solid #ccc; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { border: 1px solid #ccc; padding: 8px 10px; font-size: 12px; }
          .amount { text-align: right; font-weight: bold; }
          .total-row td { background: #f0f0f0; font-weight: bold; font-size: 13px; }
          .profit-row td { background: ${isP ? '#e8f5e9' : '#ffebee'}; font-weight: bold; font-size: 14px; color: ${isP ? '#2e7d32' : '#c62828'}; }
          .footer { margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; }
          .sign-section { display: flex; justify-content: space-between; margin-top: 40px; }
          .sign-box { text-align: center; width: 45%; }
          .sign-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 40px; font-size: 11px; }
          .disclaimer { font-size: 10px; color: #777; margin-top: 15px; text-align: center; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="header">
          <div class="fbr-logo">FEDERAL BOARD OF REVENUE - PAKISTAN</div>
          <div class="title">ANNUAL INCOME STATEMENT</div>
          <div class="subtitle">Tax Year: ${taxYear} | The KrunchEez Restaurant</div>
          <div style="margin-top:12px;">
            <div class="ntn-box">
              <div class="ntn-label">NTN (National Tax Number)</div>
              <div class="ntn-number">1730144554693</div>
            </div>
          </div>
        </div>

        <!-- TAXPAYER INFO -->
        <div class="section">
          <div class="section-title">Taxpayer Information</div>
          <table>
            <tr><td style="width:40%">Name</td><td><strong>Hamid Ali</strong></td></tr>
            <tr><td>Business Name</td><td><strong>The KrunchEez Restaurant</strong></td></tr>
            <tr><td>NTN</td><td><strong>1730144554693</strong></td></tr>
            <tr><td>Tax Office</td><td>RTO Peshawar</td></tr>
            <tr><td>Registration Status</td><td>Income Tax: Active</td></tr>
            <tr><td>Tax Year</td><td>${taxYear}</td></tr>
            <tr><td>Report Generated</td><td>${new Date().toLocaleDateString('en-PK', { day:'2-digit', month:'long', year:'numeric' })}</td></tr>
          </table>
        </div>

        <!-- INCOME -->
        <div class="section">
          <div class="section-title">Income / Revenue</div>
          <table>
            <tr><th>Description</th><th>Orders</th><th class="amount">Amount (Rs.)</th></tr>
            <tr>
              <td>Sales Revenue (Delivered Orders)</td>
              <td>${yearOrders.length} orders</td>
              <td class="amount">${yearRev.toLocaleString()}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>TOTAL INCOME</strong></td>
              <td class="amount">${yearRev.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <!-- EXPENSES -->
        <div class="section">
          <div class="section-title">Expenses / Deductions</div>
          <table>
            <tr><th>Category</th><th>Records</th><th class="amount">Amount (Rs.)</th></tr>
            <tr>
              <td>Supplier Payments (Stock)</td>
              <td>${purchases.length} payments</td>
              <td class="amount">${yearSupplier.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Staff Salaries</td>
              <td>${salaries.length} records</td>
              <td class="amount">${yearSalary.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Daily Operational Expenses</td>
              <td>${expenses.length} entries</td>
              <td class="amount">${yearDaily.toLocaleString()}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>TOTAL EXPENSES</strong></td>
              <td class="amount">${yearExp.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <!-- NET PROFIT -->
        <div class="section">
          <div class="section-title">Net Profit / Loss</div>
          <table>
            <tr><th>Description</th><th class="amount">Amount (Rs.)</th></tr>
            <tr><td>Total Income</td><td class="amount">+ ${yearRev.toLocaleString()}</td></tr>
            <tr><td>Total Expenses</td><td class="amount">- ${yearExp.toLocaleString()}</td></tr>
            <tr class="profit-row">
              <td><strong>${isP ? 'NET PROFIT' : 'NET LOSS'}</strong></td>
              <td class="amount"><strong>${isP ? '+' : '-'} Rs. ${Math.abs(yearProfit).toLocaleString()}</strong></td>
            </tr>
          </table>
        </div>

        <!-- SIGNATURES -->
        <div class="footer">
          <div class="sign-section">
            <div class="sign-box">
              <div class="sign-line">Manager / Authorized Person</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">Owner: Hamid Ali</div>
            </div>
          </div>
          <div class="disclaimer">
            This is a computer-generated income statement prepared for tax filing purposes.<br/>
            NTN: 1730144554693 | RTO Peshawar | The KrunchEez Restaurant
          </div>
        </div>

        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-black text-2xl text-white uppercase">Business Report</h2>
          <p className="text-krunch-gray font-body text-sm mt-1">Revenue + Expenses + Profit - complete financial summary</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={printAnnualTaxReport}
            className="flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-red-glow">
            <Download size={15} /> Annual Tax Report (PDF)
          </button>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 border border-krunch-border hover:border-krunch-red text-krunch-gray hover:text-white font-body font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth:'none' }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all ${
              period===p.key ? 'bg-krunch-red text-white shadow-red-glow' : 'bg-krunch-card border border-krunch-border text-krunch-gray hover:text-white'
            }`}>
            <Calendar size={13} /> {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_,i) => <div key={i} className="h-32 bg-krunch-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ══════════ PROFIT BANNER ══════════ */}
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            className={`rounded-2xl p-6 mb-6 border-2 ${
              isProfit
                ? 'bg-gradient-to-r from-green-900/30 to-krunch-dark border-green-700/50'
                : 'bg-gradient-to-r from-red-900/30 to-krunch-dark border-red-700/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-krunch-gray font-body text-sm uppercase tracking-widest mb-1">
                  {period === 'today' ? "Today's" : period === 'week' ? "This Week's" : period === 'month' ? "This Month's" : "Total"} Net Profit
                </p>
                <div className="flex items-center gap-3">
                  {isProfit ? <ArrowUp size={28} className="text-green-400" /> : <ArrowDown size={28} className="text-red-400" />}
                  <span className={`font-heading font-black text-4xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    Rs. {Math.abs(profit).toLocaleString()}
                  </span>
                  <span className={`text-lg font-heading font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    ({isProfit ? '+' : '-'}{Math.abs(profitMargin)}%)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:text-right">
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase">Revenue</p>
                  <p className="text-green-400 font-heading font-black text-xl">Rs.{totalRev.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase">Total Expenses</p>
                  <p className="text-red-400 font-heading font-black text-xl">Rs.{totalExp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase">Supplier</p>
                  <p className="text-amber-400 font-heading font-black text-lg">Rs.{supplierExp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-krunch-gray font-body text-xs uppercase">Salary</p>
                  <p className="text-blue-400 font-heading font-black text-lg">Rs.{salaryExp.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ══════════ MAIN STATS ══════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
            { icon: <TrendingUp size={20} className="text-green-400"/>,  label: 'Total Revenue (Sale)',  value: `Rs.${totalRev.toLocaleString()}`,   sub: `${delivered.length} orders delivered`,      bg: 'bg-green-400/10' },
              { icon: <TrendingDown size={20} className="text-red-400"/>,  label: 'Total Expenses',        value: `Rs.${totalExp.toLocaleString()}`,   sub: `Supplier + Daily + Salary`,                 bg: 'bg-red-400/10' },
              { icon: <Truck size={20} className="text-amber-400"/>,       label: 'Supplier Payments',     value: `Rs.${supplierExp.toLocaleString()}`,sub: `${filteredPurchases.length} payments`,       bg: 'bg-amber-400/10' },
              { icon: <Users size={20} className="text-blue-400"/>,        label: 'Staff Salary',          value: `Rs.${salaryExp.toLocaleString()}`,  sub: `${filteredSalaries.length} salary records`,  bg: 'bg-blue-400/10' },
            ].map((s,i) => (
              <div key={i} className="card-dark p-5">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                <p className="text-krunch-gray font-body text-xs uppercase tracking-wider mb-1">{s.label}</p>
                <p className="font-heading font-black text-2xl text-white">{s.value}</p>
                <p className="text-krunch-gray font-body text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ══════════ REVENUE vs EXPENSES CHART ══════════ */}
          <div className="card-dark p-5 mb-6">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-2">
              Revenue vs Expenses - Last 7 Days
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500"/><span className="text-krunch-gray font-body text-xs">Revenue</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"/><span className="text-krunch-gray font-body text-xs">Expenses</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"/><span className="text-krunch-gray font-body text-xs">Profit</span></div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {last7.map((d,i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  {/* Revenue bar */}
                  <div className="w-full flex gap-0.5 items-end" style={{ height:'120px' }}>
                    <div className="flex-1 rounded-t bg-green-500/80" style={{ height:`${Math.max((d.revenue/maxChart)*100,2)}%` }} title={`Revenue: Rs.${d.revenue.toLocaleString()}`} />
                    <div className="flex-1 rounded-t bg-red-500/80"   style={{ height:`${Math.max((d.expenses/maxChart)*100,2)}%` }} title={`Expenses: Rs.${d.expenses.toLocaleString()}`} />
                  </div>
                  <p className="text-krunch-gray font-body text-[9px] text-center leading-tight">{d.label}</p>
                  <p className={`font-body text-[9px] font-bold ${d.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {d.profit >= 0 ? '+' : ''}Rs.{(d.profit/1000).toFixed(1)}k
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Expense Breakdown */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">
                Expense Breakdown
              </h3>
              {expCatData.length === 0 ? (
                <p className="text-krunch-gray font-body text-sm text-center py-6">No expense records found</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {expCatData.map(([cat, amt], i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-krunch-gray font-body text-xs">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-body font-bold text-xs">Rs.{amt.toLocaleString()}</span>
                          <span className="text-krunch-gray font-body text-[10px]">({Math.round((amt/totalExp)*100)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                        <div className="h-full bg-krunch-red rounded-full" style={{ width:`${(amt/maxExpCat)*100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-krunch-border flex justify-between">
                    <span className="text-krunch-gray font-body text-sm font-bold">Total</span>
                    <span className="text-red-400 font-heading font-black text-lg">Rs.{totalExp.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Selling Items */}
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">
                Top Selling Items
              </h3>
              {topItems.length === 0 ? (
                <p className="text-krunch-gray font-body text-sm text-center py-6">No orders found</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {topItems.map(([name, count], i) => {
                    const pct = Math.round((count/(topItems[0]?.[1]||1))*100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-krunch-red font-heading font-black text-sm w-4">{i+1}</span>
                            <span className="text-white font-body text-xs truncate max-w-[150px]">{name}</span>
                          </div>
                          <span className="text-krunch-red font-body font-bold text-xs">{count} sold</span>
                        </div>
                        <div className="h-1.5 bg-krunch-border rounded-full overflow-hidden">
                          <div className="h-full bg-krunch-red rounded-full" style={{ width:`${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══════════ PROFIT SUMMARY TABLE ══════════ */}
          <div className="card-dark p-5 mb-6">
            <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">
            Complete Summary - {period === 'today' ? "Today" : period === 'week' ? "This Week" : period === 'month' ? "This Month" : "All Time"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {/* Revenue section */}
                  <tr className="border-b border-krunch-border">
                    <td className="py-3 text-green-400 font-body font-bold text-sm uppercase tracking-wider" colSpan={2}>💰 INCOME (Revenue)</td>
                  </tr>
                  <tr className="border-b border-krunch-border/50">
                    <td className="py-2.5 pl-4 text-krunch-gray font-body text-sm">Sales Revenue ({delivered.length} orders)</td>
                    <td className="py-2.5 text-right text-green-400 font-heading font-black text-base">+ Rs.{totalRev.toLocaleString()}</td>
                  </tr>

                  {/* Expense section */}
                  <tr className="border-b border-krunch-border mt-2">
                    <td className="py-3 text-red-400 font-body font-bold text-sm uppercase tracking-wider" colSpan={2}>💸 EXPENSES</td>
                  </tr>

                  {/* Supplier payments */}
                  <tr className="border-b border-krunch-border/50">
                    <td className="py-2.5 pl-4 text-amber-400 font-body font-semibold text-sm">
                      🚚 Supplier Payments ({filteredPurchases.length} payments)
                    </td>
                    <td className="py-2.5 text-right text-amber-400 font-heading font-black text-base">- Rs.{supplierExp.toLocaleString()}</td>
                  </tr>
                  {filteredPurchases.length > 0 && filteredPurchases.map(p => (
                    <tr key={p.id} className="border-b border-krunch-border/20">
                      <td className="py-1.5 pl-8 text-krunch-gray font-body text-xs">
                        📅 {fmtDate(p)} - {p.supplierName} - {p.items || 'Payment'}
                      </td>
                      <td className="py-1.5 text-right text-krunch-gray font-body text-xs">Rs.{Number(p.amount||0).toLocaleString()}</td>
                    </tr>
                  ))}

                  {/* Staff Salary */}
                  <tr className="border-b border-krunch-border/50">
                    <td className="py-2.5 pl-4 text-blue-400 font-body font-semibold text-sm">
                      👥 Staff Salary ({filteredSalaries.length} records)
                    </td>
                    <td className="py-2.5 text-right text-blue-400 font-heading font-black text-base">- Rs.{salaryExp.toLocaleString()}</td>
                  </tr>
                  {filteredSalaries.length > 0 && filteredSalaries.map(s => (
                    <tr key={s.id} className="border-b border-krunch-border/20">
                      <td className="py-1.5 pl-8 text-krunch-gray font-body text-xs">
                        📅 {fmtDate(s)} - {s.staffName} - {s.month}
                        {s.fine > 0 ? ` | Fine: -Rs.${s.fine}` : ''}
                        {s.bonus > 0 ? ` | Bonus: +Rs.${s.bonus}` : ''}
                        {s.remaining > 0 ? ` | Remaining: Rs.${s.remaining}` : ''}
                      </td>
                      <td className="py-1.5 text-right text-krunch-gray font-body text-xs">Rs.{Number(s.paid||0).toLocaleString()}</td>
                    </tr>
                  ))}

                  {/* Daily expenses by category */}
                  <tr className="border-b border-krunch-border/50">
                    <td className="py-2.5 pl-4 text-purple-400 font-body font-semibold text-sm">
                      📝 Daily Expenses ({dailyExpenses.length} entries)
                    </td>
                    <td className="py-2.5 text-right text-purple-400 font-heading font-black text-base">- Rs.{dailyExp.toLocaleString()}</td>
                  </tr>
                  {expCatData.map(([cat, amt]) => {
                    const catItems = dailyExpenses.filter(e => e.category === cat);
                    return (
                      <React.Fragment key={cat}>
                        <tr className="border-b border-krunch-border/20">
                          <td className="py-1.5 pl-8 text-krunch-gray font-body text-xs font-semibold">{cat} ({catItems.length} entries)</td>
                          <td className="py-1.5 text-right text-krunch-gray font-body text-xs">Rs.{amt.toLocaleString()}</td>
                        </tr>
                        {catItems.map(e => (
                          <tr key={e.id} className="border-b border-krunch-border/10">
                            <td className="py-1 pl-12 text-krunch-gray/60 font-body text-[11px]">
                              📅 {fmtDate(e)} - {e.description || '-'}
                            </td>
                            <td className="py-1 text-right text-krunch-gray/60 font-body text-[11px]">Rs.{Number(e.amount||0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {expCatData.length === 0 && (
                    <tr className="border-b border-krunch-border/30">
                      <td className="py-2 pl-8 text-krunch-gray font-body text-xs italic" colSpan={2}>No daily expenses recorded</td>
                    </tr>
                  )}

                  {/* Total kharcha */}
                  <tr className="border-b border-krunch-border">
                    <td className="py-3 pl-4 text-white font-body font-bold text-sm">Total Expenses</td>
                    <td className="py-3 text-right text-red-400 font-heading font-black text-lg">- Rs.{totalExp.toLocaleString()}</td>
                  </tr>

                  {/* Profit */}
                  <tr className={`${isProfit ? 'bg-green-900/20' : 'bg-red-900/20'} rounded-xl`}>
                    <td className="py-4 pl-4">
                      <p className={`font-heading font-black text-lg uppercase ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '📈 NET PROFIT' : '📉 NET LOSS'}
                      </p>
                      <p className="text-krunch-gray font-body text-xs mt-0.5">
                        Profit Margin: {profitMargin}%
                      </p>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`font-heading font-black text-2xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : '-'} Rs.{Math.abs(profit).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue by Category */}
          {topCats.length > 0 && (
            <div className="card-dark p-5 mb-6">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Revenue by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {topCats.slice(0,8).map(([cat,rev],i) => (
                  <div key={i} className="bg-krunch-black border border-krunch-border rounded-xl p-3 text-center">
                    <p className="text-krunch-red font-heading font-black text-lg">Rs.{(rev/1000).toFixed(1)}k</p>
                    <p className="text-krunch-gray font-body text-xs uppercase tracking-wider capitalize mt-0.5">{cat}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Status + Payment Breakdown */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Order Status</h3>
              {[
                { label:'Delivered',  value: delivered.length,                                                                        color:'text-green-400', dot:'bg-green-400' },
                { label:'Pending',    value: filteredOrders.filter(o=>o.status==='pending').length,                                    color:'text-yellow-400',dot:'bg-yellow-400' },
                { label:'Rejected',   value: rejected,                                                                                 color:'text-red-400',   dot:'bg-red-400' },
                { label:'Processing', value: filteredOrders.filter(o=>['confirmed','preparing','out_for_delivery'].includes(o.status)).length, color:'text-blue-400', dot:'bg-blue-400' },
              ].map((s,i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-krunch-border last:border-0">
                  <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${s.dot}`}/><span className="text-krunch-gray font-body text-sm">{s.label}</span></div>
                  <span className={`${s.color} font-body font-bold text-sm`}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Payment Methods</h3>
              {[
                { label:'💵 Cash',      value: filteredOrders.filter(o=>o.paymentMethod==='cash').length },
                { label:'📱 Easypaisa', value: filteredOrders.filter(o=>o.paymentMethod==='easypaisa').length },
              ].map((s,i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-krunch-gray font-body text-sm">{s.label}</span>
                    <span className="text-white font-body font-bold text-sm">{s.value}</span>
                  </div>
                  <div className="h-2 bg-krunch-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i===0?'bg-amber-400':'bg-blue-400'}`}
                      style={{ width:`${filteredOrders.length?(s.value/filteredOrders.length)*100:0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="card-dark p-5">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider mb-4">Order Types</h3>
              {[
                { label:'Dine-In',  value: filteredOrders.filter(o=>o.orderType==='dine-in'||o.tableNumber).length,  icon:'🪑' },
                { label:'Delivery', value: filteredOrders.filter(o=>o.orderType==='delivery').length,                icon:'🛵' },
                { label:'Pickup',   value: filteredOrders.filter(o=>o.orderType==='pickup').length,                  icon:'🏃' },
              ].map((s,i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-krunch-border last:border-0">
                  <div className="flex items-center gap-2"><span>{s.icon}</span><span className="text-krunch-gray font-body text-sm">{s.label}</span></div>
                  <span className="text-white font-body font-bold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders - All with full details */}
          <div className="card-dark overflow-hidden mt-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-krunch-border">
              <h3 className="font-heading font-bold text-white uppercase text-sm tracking-wider">All Orders - Complete Details</h3>
              <span className="text-krunch-gray font-body text-xs">{filteredOrders.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-krunch-border">
                    {['#','Order ID','Date & Time','Customer','Phone','Items','Subtotal','Delivery','Total','Type','Status','Payment'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-krunch-gray font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={12} className="px-4 py-8 text-center text-krunch-gray font-body text-sm">No orders found</td></tr>
                  ) : filteredOrders.map((o, idx) => (
                    <React.Fragment key={o.id}>
                      <tr className="border-b border-krunch-border hover:bg-krunch-card/50 transition-colors">
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-krunch-red font-body font-bold text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">
                          {fmtDateTime(o)}
                        </td>
                        <td className="px-4 py-2.5 text-white font-body text-xs whitespace-nowrap">{o.customer?.name || '-'}</td>
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">{o.customer?.phone || '-'}</td>
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs max-w-xs">
                          {o.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">Rs.{(o.summary?.subtotal||0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">Rs.{(o.summary?.deliveryFee||0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-krunch-red font-heading font-black text-sm whitespace-nowrap">Rs.{(o.summary?.total||0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-krunch-gray font-body text-xs whitespace-nowrap">
                          {o.tableNumber ? `🪑 Table ${o.tableNumber}` : o.orderType === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            o.status==='delivered'?'bg-green-500/20 text-green-400':
                            o.status==='rejected' ?'bg-red-500/20 text-red-400':
                            o.status==='pending'  ?'bg-yellow-500/20 text-yellow-400':
                            'bg-blue-500/20 text-blue-400'
                          }`}>{o.status}</span>
                        </td>
                        <td className="px-4 py-2.5 font-body text-xs whitespace-nowrap">
                          {o.paymentMethod === 'easypaisa'
                            ? <span className="text-green-400">📱 Easypaisa</span>
                            : <span className="text-krunch-gray">💵 Cash</span>}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
