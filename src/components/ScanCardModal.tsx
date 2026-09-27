import { useState, useRef, useEffect } from 'react';
import {
  X, Check, ScanLine, Keyboard, Camera, ImagePlus, RefreshCw, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { addPayoutMethod, type PayoutMethod } from '../lib/payoutMethods';
import { recordScan } from '../lib/audit';
import { upsertCard, type PayoutCard } from '../lib/userRecords';
import { currentAccount } from '../lib/notes';
import { uploadDataUrl, fileToDataUrl, attachmentSrc } from '../lib/uploads';
import {
  readCard, disposeOcr, digitsOnly, formatPan, luhnOk, maskPan, brandFromNumber,
  EMPTY_READING, type CardReading,
} from '../lib/cardOcr';

// Add a payout card. The client either holds the card up to the camera (front,
// then back) or picks photos of it from the device; the number is then READ OFF
// THE FRONT capture, verified with the Luhn checksum, and shown for approval
// before anything is saved.
//
// Nothing is ever invented. If the number cannot be read, the captures are still
// uploaded and saved: the card is stored as "photo on file" with no digits, and
// the admin console can read it and complete the record. The client is never
// shown a number that did not come off their own card.

type Mode = 'scan' | 'manual';
type Step = 'requesting' | 'front' | 'back' | 'reading' | 'review';

export default function ScanCardModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (method: PayoutMethod) => void;
}) {
  const [mode, setMode] = useState<Mode>('scan');
  const [step, setStep] = useState<Step>('requesting');
  const [frontCapture, setFrontCapture] = useState('');
  const [backCapture, setBackCapture] = useState('');
  const [reading, setReading] = useState<CardReading>(EMPTY_READING);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'front' | 'back' | null>(null);
  const [fields, setFields] = useState({ number: '', holder: '', expiry: '' });
  const [manual, setManual] = useState({ number: '', name: '', expiry: '' });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const stepRef = useRef<Step>(step);
  stepRef.current = step;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // Open the device camera as soon as the modal starts, in scan mode.
  useEffect(() => {
    if (mode !== 'scan') return;
    setStep('requesting');
    setError(null);
    let cancelled = false;

    const start = async () => {
      try {
        const nav = navigator as Navigator & {
          mediaDevices?: { getUserMedia: (c: MediaStreamConstraints) => Promise<MediaStream> };
        };
        if (!nav.mediaDevices?.getUserMedia) throw new Error('No camera API');
        const stream = await nav.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
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
        if (cancelled) return;
        setCameraBlocked(true);
        setStep('front');
        setError('The camera is not available on this device. Use a photo of the card, or type the number by hand.');
      }
    };

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [mode]);

  // Release the OCR worker when the scanner closes.
  useEffect(() => () => { void disposeOcr(); }, []);

  const captureFrame = (): string => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return '';
    const width = Math.min(1600, video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * width);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const take = (image: string) => {
    if (!image) return;
    if (stepRef.current === 'front') {
      setFrontCapture(image);
      setStep('back');
      return;
    }
    if (stepRef.current === 'back') {
      setBackCapture(image);
      stopCamera();
      setStep('reading');
    }
  };
  const takeRef = useRef(take);
  takeRef.current = take;

  // Steady-card detection: the client should not have to press anything, but
  // tapping Capture now at any moment also works.
  useEffect(() => {
    if (mode !== 'scan') return;
    if (step !== 'front' && step !== 'back') return;
    let holdFrames = 0;
    let idleFrames = 0;

    const t = window.setInterval(() => {
      const live = stepRef.current;
      if (live !== 'front' && live !== 'back') return;
      const video = videoRef.current;
      const canvas = sampleRef.current;
      if (!video || !canvas || !video.videoWidth) {
        idleFrames += 1;
        if (idleFrames > 16) {
          setCameraBlocked(true);
          setError('The camera is not sending a picture. Use a photo of the card from this device, or type the number by hand.');
        }
        return;
      }
      idleFrames = 0;
      canvas.width = 80;
      canvas.height = 45;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
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
      const present = mean > 55 && light / n > 0.28 && variance < 2600;
      holdFrames = present ? holdFrames + 1 : 0;
      if (holdFrames < 6) return; // ~1.2 s of a steady card
      takeRef.current(captureFrame());
    }, 200);

    return () => window.clearInterval(t);
  }, [mode, step]);

  // Read the card once both sides are in (or once, when the back was skipped).
  useEffect(() => {
    if (mode !== 'scan' || step !== 'reading') return;
    let cancelled = false;
    (async () => {
      setProgress('Reading the card');
      const result = await readCard(frontCapture, backCapture, message => {
        if (!cancelled) setProgress(message);
      });
      if (cancelled) return;
      setReading(result);
      setFields({
        number: formatPan(result.number || result.unverified),
        holder: result.holder,
        expiry: result.expiry,
      });
      setProgress('');
      setStep('review');
    })();
    return () => { cancelled = true; };
  }, [mode, step, frontCapture, backCapture]);

  const pickPhoto = (target: 'front' | 'back') => {
    setGalleryTarget(target);
    setError(null);
    window.setTimeout(() => galleryRef.current?.click(), 0);
  };

  const onPhotoPicked = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const target = galleryTarget ?? (stepRef.current === 'front' ? 'front' : 'back');
      if (target === 'front') {
        setFrontCapture(dataUrl);
        setStep('back');
      } else {
        setBackCapture(dataUrl);
        stopCamera();
        setStep('reading');
      }
    } catch {
      setError('That photo could not be read. Try another one.');
    } finally {
      setGalleryTarget(null);
    }
  };

  const rescan = () => {
    setFrontCapture('');
    setBackCapture('');
    setReading(EMPTY_READING);
    setFields({ number: '', holder: '', expiry: '' });
    setError(null);
    setStep('front');
  };

  // Digits typed or read: 'ok' once they check out, 'invalid' when the checksum
  // rejects them, 'empty' when nothing is there yet.
  const digits = digitsOnly(fields.number);
  const numberState = digits.length === 0
    ? 'empty'
    : digits.length >= 12 && !luhnOk(digits)
    ? 'invalid'
    : 'ok';


  // --- saving -------------------------------------------------------------

  /** Both captures go to the server; a data URL is kept if the API is down. */
  const uploadCaptures = async (): Promise<string[]> => {
    const captures = [frontCapture, backCapture].filter(Boolean);
    const uploaded: string[] = [];
    for (let i = 0; i < captures.length; i += 1) {
      const attachment = await uploadDataUrl(
        captures[i],
        `card-${i === 0 ? 'front' : 'back'}.jpg`,
        { account: currentAccount().account, onProgress: setProgress }
      );
      const src = attachment ? attachmentSrc(attachment) : '';
      if (src) uploaded.push(src);
    }
    setProgress('');
    return uploaded;
  };

  const persist = async (
    digitsValue: string,
    holder: string,
    expiry: string,
    images: string[],
    source: 'scan' | 'manual' | 'image',
    readOk: boolean
  ): Promise<PayoutMethod> => {
    const last4 = digitsValue.slice(-4);
    const brand = brandFromNumber(digitsValue) || 'Card';
    const label = source === 'manual'
      ? 'Card added manually'
      : images.length > 0 && !digitsValue
      ? 'Card photo on file'
      : 'Scanned card';
    const method = addPayoutMethod({
      label,
      last4,
      type: 'card',
      currency: 'USD',
      isDefault: false,
      brand,
      cardholder: holder.trim(),
      expiry: expiry.trim(),
      number: digitsValue ? maskPan(digitsValue) : '',
      images,
      source,
    });
    // The admin console receives the captures with the scan, on any device.
    recordScan({
      label: source === 'manual' ? 'Manual card entry' : 'Card scan',
      last4,
      currency: 'USD',
      image: images[0] ?? '',
      images,
      source,
      read: readOk,
    });
    const { account } = currentAccount();
    if (account && account.includes('@')) {
      const card: PayoutCard = {
        id: method.id,
        label: method.label,
        brand,
        cardholder: method.cardholder ?? '',
        expiry: method.expiry ?? '',
        last4,
        currency: 'USD',
        isDefault: false,
        addedAt: method.addedAt ?? new Date().toISOString(),
        number: method.number,
        images,
        source,
      };
      void upsertCard(account, card);
    }
    return method;
  };

  const saveScanned = async (photosOnly: boolean) => {
    setError(null);
    if (!photosOnly) {
      if (digits.length < 4) {
        setError('Type the last four digits from the card, or save the photos only.');
        return;
      }
      if (digits.length >= 12 && !luhnOk(digits)) {
        setError('That number does not check out against the card. Correct it, or save the photos only.');
        return;
      }
    }
    if (!frontCapture && !backCapture) {
      setError('There is nothing to save yet. Capture the card, or add a photo of it.');
      return;
    }
    setSaving(true);
    const images = await uploadCaptures();
    const method = await persist(
      photosOnly ? '' : digits,
      fields.holder,
      fields.expiry,
      images,
      photosOnly ? 'image' : 'scan',
      Boolean(reading.number)
    );
    setSaving(false);
    onSaved(method);
  };

  const saveManual = async () => {
    const manualDigits = digitsOnly(manual.number);
    if (manualDigits.length < 4) {
      setError('Enter at least the last four digits of the card.');
      return;
    }
    if (manualDigits.length >= 12 && !luhnOk(manualDigits)) {
      setError('That number does not check out. Check it against the card and try again.');
      return;
    }
    setSaving(true);
    const method = await persist(manualDigits, manual.name, manual.expiry, [], 'manual', manualDigits.length >= 12);
    setSaving(false);
    onSaved(method);
  };

  const scanning = mode === 'scan' && (step === 'front' || step === 'back');
  const hasCaptures = Boolean(frontCapture || backCapture);
  const readingHint = reading.status === 'read'
    ? 'Number read off the card and verified against the card checksum.'
    : reading.status === 'partial'
    ? 'Only part of the card was readable. Check each field before saving.'
    : 'The number could not be read from the photo. Type it from the card, or save the photos for our team.';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-[81] flex sm:items-center sm:justify-center">
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-black/10 shadow-2xl max-h-[92vh] overflow-y-auto slide-up">
          <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between z-10">
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
            {/* Hidden picker: photos already on the device are always an option */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={e => {
                void onPhotoPicked(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {mode === 'scan' ? (
              <>
                {/* Front / back progress */}
                <div className="flex items-center gap-2 mb-4">
                  {(['front', 'back'] as const).map(side => {
                    const captured = side === 'front' ? frontCapture : backCapture;
                    const doneSide = Boolean(captured) || step === 'reading' || step === 'review';
                    return (
                      <div key={side} className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {captured ? (
                            <Check size={13} className="text-[#22C55E]" />
                          ) : (
                            <span className={`w-3 h-3 rounded-full ${step === side ? 'bg-[#2F6BFF] animate-pulse' : 'bg-black/10'}`} />
                          )}
                          <span className="text-xs font-medium text-black/60 capitalize">{side} of card</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-black/8">
                          <div
                            className="h-full bg-[#22C55E] rounded-full transition-all"
                            style={{ width: doneSide ? '100%' : step === side ? '45%' : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-sm text-black/45 mb-4">
                  {step === 'front'
                    ? 'Hold the front of the card in the frame until it captures, or tap Capture now.'
                    : step === 'back'
                    ? 'Now the back of the card. It is optional: the number is read off the front.'
                    : step === 'reading'
                    ? 'Reading the number, expiry and name off the card...'
                    : 'Check the details below. Nothing is saved until you confirm.'}
                </p>

                {/* Viewfinder / capture preview */}
                <div className="relative rounded-2xl overflow-hidden bg-[#0F1420] border-2 border-[#2F6BFF]/40 h-52 mb-4">
                  <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                  <canvas ref={sampleRef} className="hidden" />
                  {!hasCaptures && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
                      {cameraBlocked ? (
                        <>
                          <ImagePlus size={22} className="text-white/70" />
                          <p className="text-xs text-white/70 leading-relaxed">
                            No camera picture here. Add photos of the card from this device instead.
                          </p>
                          <button
                            onClick={() => pickPhoto(step === 'front' ? 'front' : 'back')}
                            className="mt-1 px-3 py-1.5 rounded-lg bg-[#2F6BFF] text-xs text-white"
                          >
                            Choose a photo
                          </button>
                        </>
                      ) : (
                        <>
                          <Camera size={20} className="text-white/50" />
                          <p className="text-xs text-white/60">Starting the camera...</p>
                        </>
                      )}
                    </div>
                  )}
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
                  {scanning && <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#2F6BFF] to-transparent scan-line pointer-events-none" />}
                  {hasCaptures && (
                    <div className="absolute right-3 top-3 flex gap-2">
                      {[frontCapture, backCapture].filter(Boolean).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={i === 0 ? 'Front capture' : 'Back capture'}
                          className="w-20 h-12 object-cover rounded-lg border border-white/40"
                        />
                      ))}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-black/40 px-3 py-1 rounded-full">
                      <Camera size={11} />
                      {step === 'front' ? 'Front' : step === 'back' ? 'Back' : step === 'reading' ? 'Reading...' : 'Captured'}
                    </span>
                    {scanning && !cameraBlocked && (
                      <button
                        onClick={() => take(captureFrame())}
                        className="px-3 py-1.5 rounded-full bg-[#2F6BFF] text-xs text-white font-medium"
                      >
                        Capture now
                      </button>
                    )}
                  </div>
                </div>

                {scanning && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => pickPhoto(step === 'front' ? 'front' : 'back')}
                      className="flex-1 flex items-center justify-center gap-2 border border-black/15 py-2.5 rounded-xl text-xs text-black/60 hover:border-black/30 transition-colors"
                    >
                      <ImagePlus size={13} /> Use a photo
                    </button>
                    {step === 'back' && (
                      <button
                        onClick={() => { stopCamera(); setStep('reading'); }}
                        className="flex-1 py-2.5 rounded-xl border border-black/15 text-xs text-black/60 hover:border-black/30 transition-colors"
                      >
                        Skip the back
                      </button>
                    )}
                    {hasCaptures && (
                      <button
                        onClick={rescan}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-black/15 text-xs text-black/60 hover:border-black/30 transition-colors"
                      >
                        <RefreshCw size={13} /> Start over
                      </button>
                    )}
                  </div>
                )}


                {step === 'reading' && (
                  <div className="mb-4 p-4 rounded-xl border border-[#2F6BFF]/25 bg-[#2F6BFF]/5">
                    <div className="flex items-center gap-2 mb-2">
                      <ScanLine size={14} className="text-[#2F6BFF] animate-pulse" />
                      <span className="text-sm text-[#2F6BFF] font-medium">Reading the card</span>
                    </div>
                    <p className="text-xs text-black/45">{progress || 'Preparing the capture...'}</p>
                    <div className="mt-3 h-1 rounded-full bg-black/8 overflow-hidden">
                      <div className="h-full w-1/2 bg-[#2F6BFF] rounded-full animate-pulse" />
                    </div>
                  </div>
                )}

                {step === 'review' && (
                  <div className="mb-4">
                    <div className={`flex items-start gap-2 p-3 rounded-xl border mb-4 ${
                      reading.status === 'read'
                        ? 'border-[#22C55E]/30 bg-[#22C55E]/5'
                        : reading.status === 'partial'
                        ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5'
                        : 'border-[#EF4444]/25 bg-[#EF4444]/5'
                    }`}>
                      {reading.status === 'read'
                        ? <ShieldCheck size={15} className="text-[#22C55E] mt-0.5 shrink-0" />
                        : <AlertTriangle size={15} className="text-[#F59E0B] mt-0.5 shrink-0" />}
                      <p className="text-xs text-black/60 leading-relaxed">{readingHint}</p>
                    </div>

                    {hasCaptures && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[frontCapture, backCapture].filter(Boolean).map((src, i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden border border-black/8">
                            <img src={src} alt={i === 0 ? 'Front of card' : 'Back of card'} className="w-full h-24 object-cover" />
                            <span className="absolute bottom-1 left-1 text-[9px] px-2 py-0.5 rounded-full bg-black/55 text-white font-mono">
                              {i === 0 ? 'FRONT' : 'BACK'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-black/35 mb-1 font-mono">CARD NUMBER</label>
                        <input
                          value={fields.number}
                          onChange={e => setFields(f => ({ ...f, number: formatPan(e.target.value) }))}
                          inputMode="numeric"
                          placeholder="1234 5678 9012 3456"
                          className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]"
                        />
                        <p className={`text-[11px] mt-1.5 leading-relaxed ${
                          numberState === 'invalid'
                            ? 'text-[#EF4444]'
                            : numberState === 'ok'
                            ? 'text-[#22C55E]'
                            : 'text-black/35'
                        }`}>
                          {numberState === 'invalid'
                            ? 'This does not pass the card checksum. Correct it, or save the photos only.'
                            : numberState === 'ok'
                            ? 'Number verified against the card checksum.'
                            : 'Type the digits exactly as printed on the card.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] text-black/35 mb-1 font-mono">CARDHOLDER</label>
                          <input
                            value={fields.holder}
                            onChange={e => setFields(f => ({ ...f, holder: e.target.value }))}
                            placeholder="As printed on the card"
                            className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] text-black/35 mb-1 font-mono">EXPIRY</label>
                          <input
                            value={fields.expiry}
                            onChange={e => setFields(f => ({ ...f, expiry: e.target.value }))}
                            placeholder="MM/YY"
                            className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <button
                        onClick={() => void saveScanned(false)}
                        disabled={saving}
                        className="w-full btn-primary py-3 rounded-xl text-sm disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save card'}
                      </button>
                      <button
                        onClick={() => void saveScanned(true)}
                        disabled={saving}
                        className="w-full py-3 rounded-xl border border-black/15 text-sm text-black/60 hover:border-black/30 transition-colors disabled:opacity-50"
                      >
                        Save the photos only
                      </button>
                      <button
                        onClick={rescan}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-black/40 hover:text-black/70 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} /> Scan again
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-black/45 mb-4">
                  Enter the number exactly as printed on the card. It is verified before it is saved.
                </p>
                <div className="space-y-3 mb-4">
                  <input
                    value={manual.number}
                    onChange={e => setManual(m => ({ ...m, number: formatPan(e.target.value) }))}
                    placeholder="Card number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]"
                  />
                  <input
                    value={manual.name}
                    onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                    placeholder="Cardholder name"
                    autoComplete="cc-name"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]"
                  />
                  <input
                    value={manual.expiry}
                    onChange={e => setManual(m => ({ ...m, expiry: e.target.value }))}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => void saveManual()}
                    disabled={saving}
                    className="w-full btn-primary py-3 rounded-xl text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save card'}
                  </button>
                  <button
                    onClick={() => { setMode('scan'); setError(null); }}
                    className="w-full flex items-center justify-center gap-2 border border-black/15 py-3 rounded-xl text-sm text-black/60 hover:border-black/30 transition-colors"
                  >
                    <ScanLine size={15} /> Scan the card instead
                  </button>
                </div>
              </>
            )}

            {error && (
              <p className="mt-3 text-xs text-[#D97706] leading-relaxed flex items-start gap-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            {saving && progress && <p className="mt-3 text-xs text-black/40 font-mono">{progress}</p>}

            {mode === 'scan' && scanning && (
              <button
                onClick={() => { setMode('manual'); setError(null); }}
                className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-black/40 hover:text-black/70 transition-colors"
              >
                <Keyboard size={13} /> Enter the number by hand instead
              </button>
            )}

            <p className="text-[10px] text-black/25 mt-4 leading-relaxed text-center">
              The number is read off your card on this device and only the last four digits are kept in your
              account. The captures of the card go to our team so they can check it for you.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

