import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';

const StaffIDCard = ({ staff, onClose }) => {
  const cardRef = useRef(null);

  const handlePrint = () => {
    const printContent = cardRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff ID Card - ${staff.name}</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            font-family: 'Inter', sans-serif;
          }
          .print-wrapper {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
            justify-content: center;
          }
          .card {
            width: 3.375in;
            height: 2.125in;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          }
          /* FRONT */
          .front {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
            display: flex;
            flex-direction: column;
          }
          .front-header {
            background: #E31E24;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .front-header .logo-circle {
            width: 28px; height: 28px;
            border-radius: 50%;
            background: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 12px; color: #E31E24;
            flex-shrink: 0;
          }
          .front-header .brand {
            font-weight: 900; font-size: 13px; color: white;
            letter-spacing: 1px; text-transform: uppercase;
          }
          .front-header .tagline {
            font-size: 7px; color: rgba(255,255,255,0.7);
            text-transform: uppercase; letter-spacing: 1px;
          }
          .front-header .id-badge {
            margin-left: auto;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 8px; color: white; font-weight: 700;
          }
          .front-body {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 10px 12px;
            gap: 12px;
          }
          .photo-wrap {
            width: 64px; height: 64px;
            border-radius: 50%;
            border: 2.5px solid #E31E24;
            overflow: hidden;
            flex-shrink: 0;
            background: #333;
            display: flex; align-items: center; justify-content: center;
          }
          .photo-wrap img { width: 100%; height: 100%; object-fit: cover; }
          .photo-initial {
            font-size: 24px; font-weight: 900; color: #E31E24;
          }
          .staff-info { flex: 1; }
          .staff-name {
            font-size: 15px; font-weight: 900; color: white;
            text-transform: uppercase; letter-spacing: 0.5px;
            line-height: 1.2;
          }
          .staff-role {
            font-size: 9px; color: #E31E24; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px;
            margin-top: 2px;
          }
          .staff-details {
            margin-top: 6px;
            display: flex; flex-direction: column; gap: 2px;
          }
          .detail-row {
            display: flex; align-items: center; gap: 4px;
          }
          .detail-label {
            font-size: 7px; color: #888; text-transform: uppercase;
            letter-spacing: 0.5px; width: 36px;
          }
          .detail-val {
            font-size: 8px; color: #ccc; font-weight: 600;
          }
          .front-footer {
            background: rgba(227,30,36,0.15);
            border-top: 1px solid rgba(227,30,36,0.3);
            padding: 5px 12px;
            display: flex; align-items: center; justify-content: space-between;
          }
          .front-footer .website {
            font-size: 7px; color: #888; letter-spacing: 0.5px;
          }
          .front-footer .emp-id {
            font-size: 8px; color: #E31E24; font-weight: 700; letter-spacing: 1px;
          }
          .red-bar {
            position: absolute; left: 0; top: 0; bottom: 0;
            width: 4px; background: #E31E24;
          }
          /* BACK */
          .back {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            display: flex; flex-direction: column;
          }
          .back-header {
            background: #E31E24;
            padding: 6px 12px;
            text-align: center;
          }
          .back-header p {
            font-size: 8px; color: white; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1.5px;
          }
          .back-body {
            flex: 1; padding: 10px 14px;
            display: flex; gap: 14px;
          }
          .back-left { flex: 1; }
          .back-right {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 4px;
          }
          .info-block { margin-bottom: 6px; }
          .info-title {
            font-size: 7px; color: #E31E24; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: 2px;
          }
          .info-val {
            font-size: 9px; color: white; font-weight: 600;
          }
          .rules-title {
            font-size: 7px; color: #888; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .rule-item {
            font-size: 7px; color: #777;
            display: flex; align-items: flex-start; gap: 3px;
            margin-bottom: 2px; line-height: 1.3;
          }
          .rule-dot { color: #E31E24; font-weight: 900; }
          .qr-placeholder {
            width: 56px; height: 56px;
            background: white; border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            font-size: 7px; color: #333; text-align: center;
            padding: 4px; line-height: 1.3; font-weight: 600;
          }
          .back-footer {
            background: rgba(227,30,36,0.1);
            border-top: 1px solid rgba(227,30,36,0.2);
            padding: 4px 12px;
            display: flex; align-items: center; justify-content: space-between;
          }
          .back-footer p {
            font-size: 7px; color: #666;
          }
          .back-footer .lost {
            font-size: 7px; color: #E31E24; font-weight: 600;
          }
          .label {
            font-size: 6px; color: #666; text-align: center;
          }
          @media print {
            body { background: white; padding: 10px; }
            .print-wrapper { gap: 16px; }
            .card { box-shadow: none; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  if (!staff) return null;

  const empId = staff.empId || `KRZ-${String(staff.id || '001').slice(-3).toUpperCase()}`;
  const joinDate = staff.joiningDate || 'N/A';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl bg-krunch-dark border border-krunch-border rounded-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-krunch-border">
            <div>
              <h3 className="font-heading font-black text-white uppercase">Staff ID Card</h3>
              <p className="text-krunch-gray font-body text-xs mt-0.5">{staff.name} - {staff.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-krunch-red hover:bg-krunch-darkred text-white font-heading font-bold text-sm px-4 py-2 rounded-xl transition-all"
              >
                <Printer size={15} /> Print Card
              </button>
              <button onClick={onClose} className="text-krunch-gray hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Card Preview */}
          <div className="p-6 bg-gray-900">
            <p className="text-krunch-gray font-body text-xs text-center mb-4 uppercase tracking-widest">Preview - Front & Back</p>

            <div ref={cardRef}>
              <div className="print-wrapper" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>

                {/* ── FRONT CARD ── */}
                <div>
                  <div className="card front" style={{
                    width: '324px', height: '204px',
                    borderRadius: '12px', overflow: 'hidden',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    {/* Red left bar */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#E31E24' }} />

                    {/* Header */}
                    <div style={{ background: '#E31E24', padding: '8px 12px 8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', color: '#E31E24', flexShrink: 0 }}>K</div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '13px', color: 'white', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.1 }}>THE KRUNCHEEZ</div>
                        <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>Fast Food • Chinese • BBQ</div>
                      </div>
                      <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '8px', color: 'white', fontWeight: 700, letterSpacing: '1px' }}>
                        STAFF ID
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px 14px 10px 18px', gap: '14px' }}>
                      {/* Photo */}
                      <div style={{ width: '68px', height: '68px', borderRadius: '50%', border: '2.5px solid #E31E24', overflow: 'hidden', flexShrink: 0, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '26px', fontWeight: 900, color: '#E31E24' }}>{staff.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>
                          {staff.name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '3px' }}>
                          {staff.role}
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {staff.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '7px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', width: '36px' }}>Phone</span>
                              <span style={{ fontSize: '8px', color: '#ccc', fontWeight: 600 }}>{staff.phone}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '7px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', width: '36px' }}>Joined</span>
                            <span style={{ fontSize: '8px', color: '#ccc', fontWeight: 600 }}>{joinDate}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '7px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', width: '36px' }}>EMP ID</span>
                            <span style={{ fontSize: '8px', color: '#E31E24', fontWeight: 700 }}>{empId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ background: 'rgba(227,30,36,0.12)', borderTop: '1px solid rgba(227,30,36,0.25)', padding: '5px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '7px', color: '#555', letterSpacing: '0.5px' }}>kruncheez-pos.web.app</span>
                      <span style={{ fontSize: '8px', color: '#E31E24', fontWeight: 700, letterSpacing: '2px' }}>{empId}</span>
                    </div>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '6px', fontWeight: 600 }}>FRONT</p>
                </div>

                {/* ── BACK CARD ── */}
                <div>
                  <div className="card back" style={{
                    width: '324px', height: '204px',
                    borderRadius: '12px', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    {/* Back Header */}
                    <div style={{ background: '#E31E24', padding: '6px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '8px', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
                        THE KRUNCHEEZ - EMPLOYEE CARD
                      </p>
                    </div>

                    {/* Back Body */}
                    <div style={{ flex: 1, padding: '10px 14px', display: 'flex', gap: '14px' }}>
                      {/* Left: Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '5px' }}>
                          <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Employee</div>
                          <div style={{ fontSize: '10px', color: 'white', fontWeight: 700 }}>{staff.name}</div>
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Designation</div>
                          <div style={{ fontSize: '9px', color: '#ccc', fontWeight: 600 }}>{staff.role}</div>
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Employee ID</div>
                          <div style={{ fontSize: '10px', color: 'white', fontWeight: 700, letterSpacing: '1px' }}>{empId}</div>
                        </div>
                        {staff.cnic && (
                          <div style={{ marginBottom: '5px' }}>
                            <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>CNIC</div>
                            <div style={{ fontSize: '8px', color: '#ccc', fontWeight: 600 }}>{staff.cnic}</div>
                          </div>
                        )}
                        {staff.bloodGroup && (
                          <div style={{ marginBottom: '5px' }}>
                            <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Blood Group</div>
                            <div style={{ fontSize: '10px', color: '#ff6b6b', fontWeight: 900 }}>{staff.bloodGroup}</div>
                          </div>
                        )}
                        {staff.emergencyContact && (
                          <div style={{ marginBottom: '5px' }}>
                            <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Emergency</div>
                            <div style={{ fontSize: '7px', color: '#ccc', fontWeight: 600 }}>{staff.emergencyContact}</div>
                          </div>
                        )}
                      </div>

                      {/* Right: QR / Logo */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <div style={{
                          width: '64px', height: '64px',
                          background: 'white', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'column', padding: '6px',
                        }}>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#E31E24', lineHeight: 1 }}>K</div>
                          <div style={{ fontSize: '6px', color: '#333', fontWeight: 700, textAlign: 'center', marginTop: '2px', letterSpacing: '0.5px' }}>KRUNCHEEZ</div>
                        </div>
                        <div style={{ fontSize: '7px', color: '#555', fontWeight: 600, textAlign: 'center', letterSpacing: '0.5px' }}>OFFICIAL</div>
                        <div style={{ width: '64px', height: '2px', background: '#E31E24', borderRadius: '1px' }} />
                        <div style={{ fontSize: '7px', color: '#E31E24', fontWeight: 700, textAlign: 'center', letterSpacing: '1px' }}>{empId}</div>
                      </div>
                    </div>

                    {/* Back Footer */}
                    <div style={{ background: 'rgba(227,30,36,0.08)', borderTop: '1px solid rgba(227,30,36,0.2)', padding: '4px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '7px', color: '#555' }}>Peshawar, Pakistan</span>
                      <span style={{ fontSize: '7px', color: '#E31E24', fontWeight: 600 }}>If found, return to restaurant</span>
                    </div>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '6px', fontWeight: 600 }}>BACK</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-5 bg-krunch-card border border-krunch-border rounded-xl p-4">
              <h4 className="text-white font-body font-semibold text-sm mb-2 flex items-center gap-2">
                <Printer size={14} className="text-krunch-red" /> Print Instructions
              </h4>
              <ul className="space-y-1.5 text-krunch-gray text-xs font-body">
                <li className="flex items-start gap-2"><span className="text-krunch-red">•</span> "Print Card" button click karo</li>
                <li className="flex items-start gap-2"><span className="text-krunch-red">•</span> Paper size: <strong className="text-white">CR80 (Credit Card Size)</strong> ya A4 pe print karo phir cut karo</li>
                <li className="flex items-start gap-2"><span className="text-krunch-red">•</span> Best result: Glossy photo paper use karo</li>
                <li className="flex items-start gap-2"><span className="text-krunch-red">•</span> Photo add karne ke liye: Staff edit karo → Photo URL add karo</li>
                <li className="flex items-start gap-2"><span className="text-krunch-red">•</span> Print karne ke baad laminate karo - zyada durable hoga</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StaffIDCard;
