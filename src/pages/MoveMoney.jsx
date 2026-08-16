import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { logAuditEntry } from '@/lib/auditLogger';
import {
  ArrowLeftRight, Send, Download, Building2, Globe,
  DollarSign, Landmark, Wallet, X, ArrowRight,
  CheckCircle, AlertCircle, Loader2, FileCheck, ChevronRight,
  QrCode, Camera, Copy, Check as CheckIcon, Image as ImageIcon,
} from 'lucide-react';

// ─── Feature catalogue (only features with backend support are visible) ───────
const SECTIONS = [
  {
    title: 'Transfers',
    items: [
      { id: 'internal', label: 'Internal Transfer', desc: 'Move between your Vantoris accounts', icon: ArrowLeftRight, route: '/accounts', color: 'bg-brass/10 text-brass' },
      { id: 'send', label: 'Send Money', desc: 'Send to another Vantoris member', icon: Send, color: 'bg-blue-500/10 text-blue-600' },
      { id: 'request', label: 'Request Money', desc: 'Request payment from a member', icon: Download, color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'qr', label: 'QR Pay', desc: 'Generate or scan a payment QR code', icon: QrCode, color: 'bg-purple-500/10 text-purple-600' },
    ],
  },
  {
    title: 'Wires & ACH',
    items: [
      { id: 'ach', label: 'ACH Transfer', desc: 'Standard bank-to-bank transfer (1–3 days)', icon: Building2, color: 'bg-brass/10 text-brass' },
      { id: 'domestic', label: 'Domestic Wire', desc: 'Same-day wire within the United States', icon: Landmark, color: 'bg-blue-500/10 text-blue-600' },
      { id: 'international', label: 'International Wire', desc: 'SWIFT wire to any country', icon: Globe, color: 'bg-indigo-500/10 text-indigo-600' },
    ],
  },
  {
    title: 'Deposits',
    items: [
      { id: 'deposit-check', label: 'Deposit Check', desc: 'Scan & submit a check via camera', icon: FileCheck, color: 'bg-brass/10 text-brass' },
      { id: 'add-money', label: 'Add Money', desc: 'Fund your account', icon: DollarSign, route: '/accounts', color: 'bg-emerald-500/10 text-emerald-600' },
      { id: 'withdraw', label: 'Withdraw Funds', desc: 'Withdraw from your account', icon: Wallet, route: '/accounts', color: 'bg-crimson/10 text-crimson' },
    ],
  },
];

export default function MoveMoney() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const activeTab = searchParams.get('tab');

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const accts = await base44.entities.Account.filter({ user_id: me.id }, '-created_date');
        setAccounts(accts);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (activeTab) setSelectedFeature(activeTab);
  }, [activeTab]);

  function handleItemClick(item) {
    if (item.route) { navigate(item.route); return; }
    setSelectedFeature(item.id);
    setSearchParams({ tab: item.id });
  }

  function handleClosePanel() {
    setSelectedFeature(null);
    setSearchParams({});
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Move Money</h1>
        <p className="text-gray text-sm mt-0.5">Transfers, wires & deposits</p>
      </div>

      {!loading && accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vantoris-balance-hero p-5 mb-5"
        >
          <p className="text-white/60 text-xs uppercase tracking-wider">Available Balance</p>
          <p className="text-white text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
          <p className="text-white/50 text-xs mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </motion.div>
      )}

      {SECTIONS.map((section, sIdx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sIdx * 0.05 }}
          className="mb-5"
        >
          <h2 className="text-foreground font-semibold text-sm mb-3 px-1">{section.title}</h2>
          <div className="vantoris-glass-premium overflow-hidden">
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = selectedFeature === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors ${idx > 0 ? 'border-t border-border/50' : ''} ${isActive ? 'bg-brass/5' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-foreground font-medium text-sm">{item.label}</p>
                    <p className="text-gray text-xs truncate">{item.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray/40 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {selectedFeature && (
          <FeaturePanel
            featureId={selectedFeature}
            accounts={accounts}
            user={user}
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panel wrapper ─────────────────────────────────────────────────────────────
function FeaturePanel({ featureId, accounts, user, onClose }) {
  const feature = SECTIONS.flatMap(s => s.items).find(i => i.id === featureId);
  if (!feature) return null;
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={e => e.stopPropagation()}
        className="vantoris-glass-premium w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 rounded-t-3xl sm:rounded-3xl safe-bottom"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.color}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-base">{feature.label}</h3>
              <p className="text-gray text-xs">{feature.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-gray" />
          </button>
        </div>

        {featureId === 'send' && <SendMoneyPanel accounts={accounts} user={user} onClose={onClose} />}
        {featureId === 'request' && <RequestMoneyPanel accounts={accounts} user={user} onClose={onClose} />}
         {featureId === 'qr' && <QRPanel user={user} onClose={onClose} />}
        {featureId === 'ach' && <ACHPanel accounts={accounts} user={user} onClose={onClose} />}
        {featureId === 'domestic' && <WirePanel accounts={accounts} user={user} onClose={onClose} type="domestic" />}
        {featureId === 'international' && <WirePanel accounts={accounts} user={user} onClose={onClose} type="international" />}
        {featureId === 'deposit-check' && <DepositCheckPanel accounts={accounts} user={user} onClose={onClose} />}
      </motion.div>
    </motion.div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
function SuccessReceipt({ title, subtitle, details, onClose }) {
  return (
    <div className="text-center py-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
      </motion.div>
      <h4 className="text-foreground font-bold text-lg mb-1">{title}</h4>
      <p className="text-gray text-sm mb-4">{subtitle}</p>
      {details && (
        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 mb-4">
          {details.map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onClose} className="w-full py-3 bg-brass text-white font-semibold rounded-xl hover:bg-brass/90 transition-all">
        Done
      </button>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
    >
      {children}
    </select>
  );
}

function SubmitButton({ loading, disabled, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-brass/90 transition-all flex items-center justify-center gap-2"
    >
      {loading ? <><Loader2 size={16} className="animate-spin" />{loadingLabel || 'Processing...'}</> : label}
    </button>
  );
}

// ─── QR Pay ────────────────────────────────────────────────────────────────────
function QRPanel({ user, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const [mode, setMode] = useState('generate');
  const [form, setForm] = useState({ amount: '', memo: '' });
  const [qrImage, setQrImage] = useState('');
  const [payload, setPayload] = useState('');
  const [requestId, setRequestId] = useState('');
  const [manualPayload, setManualPayload] = useState('');
  const [scanStatus, setScanStatus] = useState('idle');
  const [scanError, setScanError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');

  useEffect(() => () => stopScanner(), []);

  function stopScanner() {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanStatus('idle');
  }

  async function createRequest() {
    setError('');
    const amount = form.amount ? Number(form.amount) : null;
    if (form.amount && (!Number.isFinite(amount) || amount <= 0)) {
      setError('Enter a valid amount or leave it blank for an open request.');
      return;
    }
    setLoading(true);
    try {
      const id = `QR-${Date.now()}`;
      const requestPayload = JSON.stringify({
        version: 1,
        type: 'vantoris-payment-request',
        requestId: id,
        fromUserId: user.id,
        fromName: user.full_name || user.preferred_name || 'VANTORIS member',
        amount,
        currency: 'USD',
        memo: form.memo.trim(),
        createdAt: new Date().toISOString(),
      });
      const image = await QRCode.toDataURL(requestPayload, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0B2239', light: '#FFFFFF' },
      });
      await base44.entities.ServiceRequest.create({
        user_id: user.id,
        service_type: 'QR Payment Request',
        amount,
        status: 'open',
        qr_request_id: id,
        qr_payload: requestPayload,
        details: `QR payment request${amount ? ` for ${formatCurrency(amount)}` : ''}${form.memo.trim() ? `. Memo: ${form.memo.trim()}` : ''}`,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'QR Payment Request Created',
        message: amount
          ? `Your QR request for ${formatCurrency(amount)} is ready to share.`
          : 'Your open QR payment request is ready to share.',
        type: 'info',
      });
      setRequestId(id);
      setPayload(requestPayload);
      setQrImage(image);
      setStep('generated');
    } catch (e) {
      setError(e.message || 'Could not create the QR request.');
    } finally {
      setLoading(false);
    }
  }

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(payload);
      setScanStatus('copied');
      window.setTimeout(() => setScanStatus('idle'), 1800);
    } catch {
      setError('Copy is not available in this browser. Use the download button instead.');
    }
  }

  function downloadQR() {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${requestId || 'vantoris-payment-request'}.png`;
    link.click();
  }

  function parseScannedPayload(raw) {
    setScanError('');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setScanError('That does not look like a VANTORIS payment QR payload.');
      return;
    }
    if (!parsed || parsed.type !== 'vantoris-payment-request' || !parsed.requestId) {
      setScanError('This QR code is not a supported VANTORIS payment request.');
      return;
    }
    setManualPayload(raw);
    setForm({
      amount: parsed.amount != null ? String(parsed.amount) : '',
      memo: parsed.memo || '',
    });
    setPayload(raw);
    setRequestId(parsed.requestId);
    setStep('scanned');
    stopScanner();
  }

  async function startScanner() {
    setScanError('');
    setScanStatus('starting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Camera access is not available here. Paste the QR payload below instead.');
      setScanStatus('idle');
      return;
    }
    if (!('BarcodeDetector' in window)) {
      setScanError('Live QR detection is not supported by this browser. Paste the QR payload below instead.');
      setScanStatus('idle');
      return;
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanStatus('scanning');
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) parseScannedPayload(codes[0].rawValue);
        } catch {
          // Camera frames can fail while the stream is warming up; keep scanning.
        }
      }, 450);
    } catch (e) {
      setScanStatus('idle');
      setScanError(e.name === 'NotAllowedError'
        ? 'Camera permission was denied. Paste the QR payload below instead.'
        : 'Could not start the camera. Paste the QR payload below instead.');
    }
  }

  async function saveScannedRequest() {
    setLoading(true);
    setError('');
    try {
      const parsed = JSON.parse(payload);
      const amount = parsed.amount != null ? Number(parsed.amount) : null;
      await base44.entities.ServiceRequest.create({
        user_id: user.id,
        service_type: 'QR Payment Scan',
        amount,
        status: 'pending',
        qr_request_id: parsed.requestId,
        qr_payload: payload,
        recipient_user_id: parsed.fromUserId || null,
        recipient_name: parsed.fromName || 'VANTORIS member',
        details: `Scanned payment request from ${parsed.fromName || 'VANTORIS member'}${amount ? ` for ${formatCurrency(amount)}` : ''}${parsed.memo ? `. Memo: ${parsed.memo}` : ''}`,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'QR Payment Request Saved',
        message: 'The scanned request is saved and ready for your review in Move Money.',
        type: 'info',
      });
      setStep('done');
    } catch (e) {
      setError(e.message || 'Could not save this scanned request.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <SuccessReceipt
        title="QR Request Saved"
        subtitle="The payment request is stored locally and ready for review."
        details={[
          { label: 'Request ID', value: requestId },
          { label: 'Amount', value: form.amount ? formatCurrency(Number(form.amount)) : 'Open amount' },
          { label: 'Status', value: 'Pending Review' },
        ]}
        onClose={onClose}
      />
    );
  }

  if (step === 'generated') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-foreground font-semibold text-sm">Scan to pay or request</p>
          <p className="text-gray text-xs mt-1">{form.amount ? formatCurrency(Number(form.amount)) : 'Open amount'} · {requestId}</p>
          <div className="bg-white border border-border rounded-2xl p-3 mt-4 inline-flex shadow-sm">
            <img src={qrImage} alt="VANTORIS payment request QR code" className="w-56 h-56" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={copyPayload} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl flex items-center justify-center gap-2">
            {scanStatus === 'copied' ? <CheckIcon size={16} /> : <Copy size={16} />} {scanStatus === 'copied' ? 'Copied' : 'Copy Payload'}
          </button>
          <button onClick={downloadQR} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl">Download QR</button>
        </div>
        <button onClick={() => { setStep('form'); setQrImage(''); }} className="w-full py-2.5 text-gray text-sm">Create another request</button>
      </div>
    );
  }

  if (step === 'scanned') {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 className="text-foreground font-semibold text-sm">Review Scanned Request</h4>
          {[
            { label: 'From', value: (() => { try { return JSON.parse(payload).fromName || 'VANTORIS member'; } catch { return 'VANTORIS member'; } })() },
            { label: 'Amount', value: form.amount ? formatCurrency(Number(form.amount)) : 'Open amount' },
            form.memo && { label: 'Memo', value: form.memo },
            { label: 'Request ID', value: requestId },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
        {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl">Scan another</button>
          <button onClick={saveScannedRequest} disabled={loading} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40">
            {loading ? 'Saving...' : 'Save Request'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        <button onClick={() => { stopScanner(); setMode('generate'); setError(''); }} className={`py-2.5 rounded-lg text-sm font-semibold ${mode === 'generate' ? 'bg-white text-foreground shadow-sm' : 'text-gray'}`}>Generate</button>
        <button onClick={() => { setMode('scan'); setError(''); }} className={`py-2.5 rounded-lg text-sm font-semibold ${mode === 'scan' ? 'bg-white text-foreground shadow-sm' : 'text-gray'}`}>Scan</button>
      </div>

      {mode === 'generate' ? (
        <form onSubmit={e => { e.preventDefault(); createRequest(); }} className="space-y-4">
          <p className="text-gray text-xs leading-relaxed">Create a payment request QR code. Leave the amount blank when the payer should enter it.</p>
          <FieldGroup label="Amount (USD, optional)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
              <StyledInput className="pl-7" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Open amount" />
            </div>
          </FieldGroup>
          <FieldGroup label="Memo (optional)">
            <StyledInput value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="What is this payment for?" maxLength={120} />
          </FieldGroup>
          {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
          <SubmitButton loading={loading} label="Generate QR Code" loadingLabel="Generating..." />
        </form>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-square max-h-72">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {scanStatus !== 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5">
                <QrCode size={34} className="text-white/70 mb-2" />
                <p className="text-white text-sm font-medium">Point your camera at a VANTORIS QR code</p>
                <p className="text-white/60 text-xs mt-1">Camera access stays on this device.</p>
              </div>
            )}
            {scanStatus === 'scanning' && <div className="absolute inset-8 border-2 border-white/80 rounded-2xl pointer-events-none" />}
          </div>
          <button onClick={scanStatus === 'scanning' ? stopScanner : startScanner} className="w-full py-3 bg-brass text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Camera size={17} /> {scanStatus === 'scanning' ? 'Stop Camera' : 'Start Camera'}
          </button>
          <div className="border-t border-border pt-4">
            <FieldGroup label="Paste QR Payload (fallback)">
              <textarea value={manualPayload} onChange={e => setManualPayload(e.target.value)} rows={3} placeholder='{"type":"vantoris-payment-request",...}' className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-foreground text-xs focus:border-brass/50 focus:outline-none resize-none" />
            </FieldGroup>
            <button onClick={() => parseScannedPayload(manualPayload)} disabled={!manualPayload.trim()} className="w-full mt-2 py-2.5 bg-slate-100 text-gray font-semibold rounded-xl disabled:opacity-40">Review Pasted Request</button>
          </div>
          {scanError && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{scanError}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Send Money ────────────────────────────────────────────────────────────────
function SendMoneyPanel({ accounts, user, onClose }) {
  const [step, setStep] = useState('form'); // form → review → done
  const [form, setForm] = useState({ fromAccountId: accounts[0]?.id || '', recipientEmail: '', amount: '', memo: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');

  const fromAccount = accounts.find(a => a.id === form.fromAccountId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amt = parseFloat(form.amount);
    if (!form.recipientEmail || !form.amount || isNaN(amt) || amt <= 0) {
      setError('Please fill in all required fields with valid values.'); return;
    }
    if (!form.recipientEmail.includes('@')) {
      setError('Please enter a valid email address.'); return;
    }
    if (fromAccount && amt > (fromAccount.balance || 0)) {
      setError('Insufficient funds in the selected account.'); return;
    }
    setStep('review');
  }

  async function confirmSend() {
    setLoading(true);
    setError('');
    try {
      const ref = `TXN-${Date.now()}`;
      setReference(ref);
      const amt = parseFloat(form.amount);
      await base44.entities.Transaction.create({
        account_id: form.fromAccountId,
        user_id: user.id,
        type: 'transfer',
        amount: -amt,
        description: `Transfer to ${form.recipientEmail}`,
        reference: ref,
        status: 'pending',
        note: form.memo || undefined,
        recipient_email: form.recipientEmail,
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'Transfer Submitted',
        message: `Your transfer of ${formatCurrency(amt)} to ${form.recipientEmail} has been submitted for processing. Reference: ${ref}`,
        type: 'info',
      });
      await logAuditEntry({
        action: 'TRANSFER_SUBMITTED',
        actor_id: user.id,
        entity_type: 'Transaction',
        amount: amt,
        description: `Member transfer to ${form.recipientEmail}`,
        reference: ref,
      }).catch(() => {});
      setStep('done');
    } catch (e) {
      setError(e.message || 'Transfer failed. Please try again.');
    }
    setLoading(false);
  }

  if (step === 'done') {
    return (
      <SuccessReceipt
        title="Transfer Submitted"
        subtitle="Your transfer is pending processing."
        details={[
          { label: 'Reference', value: reference },
          { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
          { label: 'Recipient', value: form.recipientEmail },
          { label: 'From Account', value: fromAccount?.account_name || '—' },
          { label: 'Status', value: 'Pending' },
        ]}
        onClose={onClose}
      />
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 className="text-foreground font-semibold text-sm">Review Transfer</h4>
          {[
            { label: 'From', value: fromAccount?.account_name || '—' },
            { label: 'To', value: form.recipientEmail },
            { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
            form.memo && { label: 'Memo', value: form.memo },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>
        {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl hover:bg-slate-200 transition-all">
            Edit
          </button>
          <button onClick={confirmSend} disabled={loading} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-brass/90 transition-all flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Sending...</> : 'Confirm & Send'}
          </button>
        </div>
        <p className="text-gray text-[10px] text-center">Transfers to external members are subject to review and may take 1–2 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup label="From Account">
        <StyledSelect value={form.fromAccountId} onChange={e => setForm(f => ({ ...f, fromAccountId: e.target.value }))}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} · {formatCurrency(a.balance || 0)}</option>)}
        </StyledSelect>
      </FieldGroup>
      <FieldGroup label="Recipient Email *">
        <StyledInput type="email" value={form.recipientEmail} onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))} placeholder="member@example.com" required />
      </FieldGroup>
      <FieldGroup label="Amount (USD) *">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <StyledInput type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="pl-7" required />
        </div>
      </FieldGroup>
      <FieldGroup label="Memo (optional)">
        <StyledInput type="text" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="What's this for?" maxLength={120} />
      </FieldGroup>
      {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
      <SubmitButton label="Review Transfer" />
    </form>
  );
}

// ─── Request Money ─────────────────────────────────────────────────────────────
function RequestMoneyPanel({ accounts, user, onClose }) {
  const [form, setForm] = useState({ payerEmail: '', amount: '', message: '' });
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.payerEmail || !form.amount || parseFloat(form.amount) <= 0) {
      setError('Please fill in all required fields.'); return;
    }
    setStep('review');
  }

  async function confirmRequest() {
    setLoading(true);
    try {
      const amt = parseFloat(form.amount);
      await base44.entities.ServiceRequest.create({
        user_id: user.id,
        service_type: 'Money Request',
        details: `Request ${formatCurrency(amt)} from ${form.payerEmail}. ${form.message ? 'Message: ' + form.message : ''}`.trim(),
        status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'Money Request Submitted',
        message: `Your request for ${formatCurrency(amt)} from ${form.payerEmail} has been submitted.`,
        type: 'info',
      });
      setStep('done');
    } catch (e) {
      setError(e.message || 'Failed to submit request. Please try again.');
    }
    setLoading(false);
  }

  if (step === 'done') {
    return (
      <SuccessReceipt
        title="Request Sent"
        subtitle="Your money request has been submitted."
        details={[
          { label: 'From', value: form.payerEmail },
          { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
          { label: 'Status', value: 'Pending Review' },
        ]}
        onClose={onClose}
      />
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 className="text-foreground font-semibold text-sm">Review Request</h4>
          {[
            { label: 'Requesting From', value: form.payerEmail },
            { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
            form.message && { label: 'Message', value: form.message },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>
        {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl">Edit</button>
          <button onClick={confirmRequest} disabled={loading} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Sending...</> : 'Send Request'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup label="Payer Email *">
        <StyledInput type="email" value={form.payerEmail} onChange={e => setForm(f => ({ ...f, payerEmail: e.target.value }))} placeholder="payer@example.com" required />
      </FieldGroup>
      <FieldGroup label="Amount (USD) *">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <StyledInput type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
        </div>
      </FieldGroup>
      <FieldGroup label="Message (optional)">
        <StyledInput type="text" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="What's this for?" maxLength={120} />
      </FieldGroup>
      {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
      <SubmitButton label="Review Request" />
    </form>
  );
}

// ─── ACH Transfer ──────────────────────────────────────────────────────────────
function ACHPanel({ accounts, user, onClose }) {
  const [form, setForm] = useState({
    fromAccountId: accounts[0]?.id || '',
    direction: 'push',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    amount: '',
    memo: '',
  });
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');

  const fromAccount = accounts.find(a => a.id === form.fromAccountId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.bankName || !form.routingNumber || !form.accountNumber || !form.amount) {
      setError('Please fill in all required fields.'); return;
    }
    if (!/^\d{9}$/.test(form.routingNumber)) {
      setError('Routing number must be exactly 9 digits.'); return;
    }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (form.direction === 'push' && fromAccount && amt > (fromAccount.balance || 0)) {
      setError('Insufficient funds.'); return;
    }
    setStep('review');
  }

  async function confirmACH() {
    setLoading(true);
    try {
      const ref = `ACH-${Date.now()}`;
      setReference(ref);
      const amt = parseFloat(form.amount);
      await base44.entities.WithdrawalRequest.create({
        user_id: user.id,
        account_id: form.fromAccountId,
        amount: amt,
        type: 'ach',
        status: 'pending',
        notes: JSON.stringify({
          type: 'ACH',
          direction: form.direction,
          bankName: form.bankName,
          routingNumber: `****${form.routingNumber.slice(-4)}`,
          accountNumber: `****${form.accountNumber.slice(-4)}`,
          memo: form.memo,
          reference: ref,
        }),
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'ACH Transfer Submitted',
        message: `ACH transfer of ${formatCurrency(amt)} has been submitted. Reference: ${ref}. Estimated: 1–3 business days.`,
        type: 'info',
      });
      await logAuditEntry({ action: 'ACH_SUBMITTED', actor_id: user.id, entity_type: 'WithdrawalRequest', amount: amt, reference: ref }).catch(() => {});
      setStep('done');
    } catch (e) {
      setError(e.message || 'ACH submission failed. Please try again.');
    }
    setLoading(false);
  }

  if (step === 'done') {
    return (
      <SuccessReceipt
        title="ACH Transfer Submitted"
        subtitle="Estimated processing: 1–3 business days."
        details={[
          { label: 'Reference', value: reference },
          { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
          { label: 'Bank', value: form.bankName },
          { label: 'Routing', value: `****${form.routingNumber.slice(-4)}` },
          { label: 'Account', value: `****${form.accountNumber.slice(-4)}` },
          { label: 'Status', value: 'Pending' },
        ]}
        onClose={onClose}
      />
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 className="text-foreground font-semibold text-sm">Review ACH Transfer</h4>
          {[
            { label: 'Direction', value: form.direction === 'push' ? 'Send (Push)' : 'Pull from external' },
            { label: 'Bank', value: form.bankName },
            { label: 'Routing', value: `****${form.routingNumber.slice(-4)}` },
            { label: 'Account', value: `****${form.accountNumber.slice(-4)}` },
            { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
            form.memo && { label: 'Memo', value: form.memo },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>
        {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl">Edit</button>
          <button onClick={confirmACH} disabled={loading} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : 'Confirm ACH'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup label="Vantoris Account">
        <StyledSelect value={form.fromAccountId} onChange={e => setForm(f => ({ ...f, fromAccountId: e.target.value }))}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} · {formatCurrency(a.balance || 0)}</option>)}
        </StyledSelect>
      </FieldGroup>
      <FieldGroup label="Direction">
        <StyledSelect value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
          <option value="push">Send funds to external bank (push)</option>
          <option value="pull">Pull funds from external bank</option>
        </StyledSelect>
      </FieldGroup>
      <FieldGroup label="Bank Name *">
        <StyledInput type="text" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g., Chase Bank" required />
      </FieldGroup>
      <FieldGroup label="Routing Number (9 digits) *">
        <StyledInput type="text" value={form.routingNumber} onChange={e => setForm(f => ({ ...f, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))} placeholder="000000000" inputMode="numeric" required />
      </FieldGroup>
      <FieldGroup label="Account Number *">
        <StyledInput type="text" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))} placeholder="Account number" inputMode="numeric" required />
      </FieldGroup>
      <FieldGroup label="Amount (USD) *">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <StyledInput type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
        </div>
      </FieldGroup>
      <FieldGroup label="Memo (optional)">
        <StyledInput type="text" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="Optional note" maxLength={120} />
      </FieldGroup>
      {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
      <p className="text-gray text-[10px] leading-relaxed">ACH transfers typically settle in 1–3 business days and are subject to review.</p>
      <SubmitButton label="Review ACH Transfer" />
    </form>
  );
}

// ─── Wire Transfer (Domestic + International) ──────────────────────────────────
function WirePanel({ accounts, user, onClose, type }) {
  const isIntl = type === 'international';
  const [form, setForm] = useState({
    fromAccountId: accounts[0]?.id || '',
    beneficiaryName: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
    country: '',
    currency: 'USD',
    amount: '',
    purpose: '',
    memo: '',
  });
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');

  const fromAccount = accounts.find(a => a.id === form.fromAccountId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.beneficiaryName || !form.bankName || !form.amount) {
      setError('Please fill in all required fields.'); return;
    }
    if (!isIntl && !form.routingNumber) { setError('Routing number is required for domestic wires.'); return; }
    if (isIntl && !form.swiftCode) { setError('SWIFT/BIC code is required for international wires.'); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (fromAccount && amt > (fromAccount.balance || 0)) { setError('Insufficient funds.'); return; }
    setStep('review');
  }

  async function confirmWire() {
    setLoading(true);
    try {
      const ref = `WIRE-${Date.now()}`;
      setReference(ref);
      const amt = parseFloat(form.amount);
      const wireType = isIntl ? 'international_wire' : 'wire';
      await base44.entities.WithdrawalRequest.create({
        user_id: user.id,
        account_id: form.fromAccountId,
        amount: amt,
        type: wireType,
        status: 'pending',
        notes: JSON.stringify({
          type: isIntl ? 'International Wire (SWIFT)' : 'Domestic Wire',
          beneficiaryName: form.beneficiaryName,
          bankName: form.bankName,
          routingNumber: form.routingNumber ? `****${form.routingNumber.slice(-4)}` : undefined,
          accountNumber: form.accountNumber ? `****${form.accountNumber.slice(-4)}` : undefined,
          swiftCode: form.swiftCode || undefined,
          iban: form.iban || undefined,
          country: form.country || undefined,
          currency: form.currency,
          purpose: form.purpose,
          memo: form.memo,
          reference: ref,
        }),
      });
      if (isIntl) {
        await base44.entities.ServiceRequest.create({
          user_id: user.id,
          service_type: 'International Wire',
          details: `SWIFT wire of ${formatCurrency(amt)} ${form.currency} to ${form.beneficiaryName} at ${form.bankName} (${form.country}). SWIFT: ${form.swiftCode}. Reference: ${ref}`,
          status: 'pending',
        });
      }
      await base44.entities.Notification.create({
        user_id: user.id,
        title: `${isIntl ? 'International' : 'Domestic'} Wire Submitted`,
        message: `Wire transfer of ${formatCurrency(amt)} to ${form.beneficiaryName} submitted. Reference: ${ref}. Processing time: ${isIntl ? '2–5' : '1'} business day(s).`,
        type: 'info',
      });
      await logAuditEntry({ action: 'WIRE_SUBMITTED', actor_id: user.id, entity_type: 'WithdrawalRequest', amount: amt, reference: ref }).catch(() => {});
      setStep('done');
    } catch (e) {
      setError(e.message || 'Wire submission failed. Please try again.');
    }
    setLoading(false);
  }

  if (step === 'done') {
    return (
      <SuccessReceipt
        title="Wire Transfer Submitted"
        subtitle={`Processing: ${isIntl ? '2–5' : '1'} business day(s). Operations will review before execution.`}
        details={[
          { label: 'Reference', value: reference },
          { label: 'Beneficiary', value: form.beneficiaryName },
          { label: 'Bank', value: form.bankName },
          { label: 'Amount', value: `${formatCurrency(parseFloat(form.amount))} ${form.currency}` },
          { label: 'Status', value: 'Pending Review' },
        ]}
        onClose={onClose}
      />
    );
  }

  if (step === 'review') {
    const fields = [
      { label: 'From Account', value: fromAccount?.account_name || '—' },
      { label: 'Beneficiary', value: form.beneficiaryName },
      { label: 'Bank', value: form.bankName },
      !isIntl && form.routingNumber && { label: 'Routing', value: `****${form.routingNumber.slice(-4)}` },
      !isIntl && form.accountNumber && { label: 'Account', value: `****${form.accountNumber.slice(-4)}` },
      isIntl && { label: 'SWIFT/BIC', value: form.swiftCode },
      isIntl && form.iban && { label: 'IBAN', value: form.iban },
      isIntl && { label: 'Country', value: form.country },
      { label: 'Amount', value: `${formatCurrency(parseFloat(form.amount))} ${form.currency}` },
      form.purpose && { label: 'Purpose', value: form.purpose },
    ].filter(Boolean);

    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 className="text-foreground font-semibold text-sm">Review {isIntl ? 'International' : 'Domestic'} Wire</h4>
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium text-right max-w-[55%]">{value}</span>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          Wire transfers are irreversible. Please verify all details before confirming.
        </div>
        {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl">Edit</button>
          <button onClick={confirmWire} disabled={loading} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : 'Confirm Wire'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup label="From Account">
        <StyledSelect value={form.fromAccountId} onChange={e => setForm(f => ({ ...f, fromAccountId: e.target.value }))}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} · {formatCurrency(a.balance || 0)}</option>)}
        </StyledSelect>
      </FieldGroup>
      <FieldGroup label="Beneficiary Name *">
        <StyledInput value={form.beneficiaryName} onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))} placeholder="Full legal name of recipient" required />
      </FieldGroup>
      <FieldGroup label="Bank Name *">
        <StyledInput value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Receiving bank name" required />
      </FieldGroup>
      {!isIntl && (
        <>
          <FieldGroup label="ABA Routing Number (9 digits) *">
            <StyledInput value={form.routingNumber} onChange={e => setForm(f => ({ ...f, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))} placeholder="000000000" inputMode="numeric" />
          </FieldGroup>
          <FieldGroup label="Account Number *">
            <StyledInput value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))} placeholder="Beneficiary account number" inputMode="numeric" />
          </FieldGroup>
        </>
      )}
      {isIntl && (
        <>
          <FieldGroup label="SWIFT / BIC Code *">
            <StyledInput value={form.swiftCode} onChange={e => setForm(f => ({ ...f, swiftCode: e.target.value.toUpperCase() }))} placeholder="e.g., CHASUS33" maxLength={11} />
          </FieldGroup>
          <FieldGroup label="IBAN / Account Number">
            <StyledInput value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="IBAN or local account number" />
          </FieldGroup>
          <FieldGroup label="Destination Country *">
            <StyledInput value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g., United Kingdom" required={isIntl} />
          </FieldGroup>
          <FieldGroup label="Currency">
            <StyledSelect value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['USD','EUR','GBP','CHF','JPY','CAD','AUD','SGD','HKD'].map(c => <option key={c} value={c}>{c}</option>)}
            </StyledSelect>
          </FieldGroup>
          <FieldGroup label="Purpose of Transfer">
            <StyledSelect value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}>
              <option value="">Select purpose</option>
              {['Family Support','Business Payment','Investment','Trade','Education','Medical','Other'].map(p => <option key={p} value={p}>{p}</option>)}
            </StyledSelect>
          </FieldGroup>
        </>
      )}
      <FieldGroup label="Amount (USD) *">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <StyledInput type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
        </div>
      </FieldGroup>
      <FieldGroup label="Reference / Memo">
        <StyledInput value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="Optional memo for beneficiary" maxLength={140} />
      </FieldGroup>
      {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
      <p className="text-gray text-[10px] leading-relaxed">
        {isIntl ? 'International wires are reviewed by operations and typically settle in 2–5 business days. Additional correspondent bank fees may apply.' : 'Domestic wires submitted before 3 PM ET typically settle same-day. A wire fee may apply.'}
      </p>
      <SubmitButton label={`Review ${isIntl ? 'International' : 'Domestic'} Wire`} />
    </form>
  );
}

async function prepareCheckImage(file) {
  if (!file) return null;
  if (typeof document === 'undefined' || !file.type.startsWith('image/')) return file;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = reject;
      image.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.78);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Deposit Check ─────────────────────────────────────────────────────────────
function DepositCheckPanel({ accounts, user, onClose }) {
  const [form, setForm] = useState({ accountId: accounts[0]?.id || '', amount: '', checkNumber: '', payerName: '' });
  const [checkImages, setCheckImages] = useState({ front: null, back: null });
  const [uploadingSide, setUploadingSide] = useState('');
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function captureImage(side, file) {
    if (!file) return;
    setError('');
    setUploadingSide(side);
    try {
      const preparedFile = await prepareCheckImage(file);
      const uploaded = await base44.integrations.Core.UploadFile({ file: preparedFile });
      setCheckImages(images => ({
        ...images,
        [side]: {
          name: file.name,
          url: uploaded.file_url,
          size: preparedFile.size,
        },
      }));
    } catch (e) {
      setError(e.message || `Could not upload the check ${side}.`);
    } finally {
      setUploadingSide('');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid check amount.'); return; }
    if (!form.payerName) { setError('Enter the name on the check.'); return; }
    if (!checkImages.front || !checkImages.back) { setError('Capture or upload both the front and back of the check.'); return; }
    setStep('review');
  }

  async function confirmDeposit() {
    setLoading(true);
    try {
      const amt = parseFloat(form.amount);
      const toAccount = accounts.find(a => a.id === form.accountId);
      await base44.entities.ServiceRequest.create({
        user_id: user.id,
        service_type: 'Check Deposit',
        amount: amt,
        check_number: form.checkNumber || null,
        payer_name: form.payerName,
        account_id: form.accountId,
        check_front_url: checkImages.front.url,
        check_back_url: checkImages.back.url,
        details: `Check deposit request. Amount: ${formatCurrency(amt)}. Payer: ${form.payerName}. Check #: ${form.checkNumber || 'N/A'}. Deposit to: ${toAccount?.account_name || 'Default Account'}. Front and back images attached.`,
        status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: user.id,
        title: 'Check Deposit Submitted',
        message: `Your check deposit request for ${formatCurrency(amt)} has been submitted. Operations will process it within 1–2 business days.`,
        type: 'info',
      });
      setStep('done');
    } catch (e) {
      setError(e.message || 'Submission failed. Please try again.');
    }
    setLoading(false);
  }

  if (step === 'done') {
    return (
      <SuccessReceipt
        title="Deposit Request Submitted"
        subtitle="Operations will process your check deposit within 1–2 business days."
        details={[
          { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
          { label: 'Payer', value: form.payerName },
          form.checkNumber && { label: 'Check #', value: form.checkNumber },
          { label: 'Images', value: 'Front and back attached' },
          { label: 'Status', value: 'Pending Review' },
        ].filter(Boolean)}
        onClose={onClose}
      />
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 className="text-foreground font-semibold text-sm">Review Deposit</h4>
          {[
            { label: 'Amount', value: formatCurrency(parseFloat(form.amount)) },
            { label: 'Payer', value: form.payerName },
            form.checkNumber && { label: 'Check #', value: form.checkNumber },
            { label: 'To Account', value: accounts.find(a => a.id === form.accountId)?.account_name || '—' },
            { label: 'Check Images', value: 'Front and back attached' },
          ].filter(Boolean).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray">{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>
        {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="flex-1 py-3 bg-slate-100 text-gray font-semibold rounded-xl">Edit</button>
          <button onClick={confirmDeposit} disabled={loading} className="flex-1 py-3 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : 'Submit Deposit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup label="Deposit To Account">
        <StyledSelect value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
        </StyledSelect>
      </FieldGroup>
      <FieldGroup label="Check Amount (USD) *">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray text-sm">$</span>
          <StyledInput type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
        </div>
      </FieldGroup>
      <FieldGroup label="Payer Name (name on check) *">
        <StyledInput value={form.payerName} onChange={e => setForm(f => ({ ...f, payerName: e.target.value }))} placeholder="e.g., John Smith" required />
      </FieldGroup>
      <FieldGroup label="Check Number (optional)">
        <StyledInput value={form.checkNumber} onChange={e => setForm(f => ({ ...f, checkNumber: e.target.value }))} placeholder="e.g., 1042" inputMode="numeric" />
      </FieldGroup>
      <div>
        <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Check Images *</label>
        <div className="grid grid-cols-2 gap-3">
          {['front', 'back'].map(side => (
            <label key={side} className="border border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={e => {
                  captureImage(side, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              {checkImages[side] ? (
                <div className="relative">
                  <img src={checkImages[side].url} alt={`Check ${side}`} className="h-20 w-full object-cover rounded-lg" />
                  <div className="flex items-center justify-center gap-1 text-emerald-600 text-[11px] font-semibold mt-2"><CheckIcon size={13} /> Captured</div>
                </div>
              ) : (
                <>
                  <Camera size={20} className="mx-auto text-brass mb-1" />
                  <p className="text-foreground text-xs font-semibold capitalize">{side}</p>
                  <p className="text-gray text-[10px] mt-0.5">{uploadingSide === side ? 'Uploading...' : 'Tap to capture'}</p>
                </>
              )}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-crimson text-xs bg-crimson/5 rounded-lg p-3">{error}</p>}
      <p className="text-gray text-[10px] leading-relaxed">Capture the complete check, including all four corners, in good light. Images are compressed before local storage and deposits are reviewed within 1–2 business days.</p>
      <SubmitButton label="Review Deposit" disabled={Boolean(uploadingSide)} />
    </form>
  );
}
