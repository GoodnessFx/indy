import { useState } from 'react';
import { FileText, Download, X, Play } from 'lucide-react';
import { attachmentSrc, formatBytes, type Attachment } from '../lib/uploads';

// One attachment inside a chat bubble: pictures and video preview inline, a
// tap opens the full picture, and anything else is a download chip. Used by the
// client widget and the admin inbox so both sides render files identically.

export default function AttachmentView({ attachment }: { attachment: Attachment }) {
  const [open, setOpen] = useState(false);
  const src = attachmentSrc(attachment);
  const label = `${attachment.name} · ${formatBytes(attachment.size)}`;

  if (!src) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-black/8 px-3 py-2 text-xs text-black/50">
        <FileText size={14} /> {attachment.name} (unavailable)
      </div>
    );
  }

  if (attachment.kind === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block overflow-hidden rounded-xl border border-black/10 bg-black/5"
          aria-label={`Open ${attachment.name}`}
        >
          <img src={src} alt={attachment.name} className="max-h-44 w-full object-cover" loading="lazy" />
        </button>
        {open && (
          <div
            className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-label={attachment.name}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close picture"
            >
              <X size={22} />
            </button>
            <img src={src} alt={attachment.name} className="max-h-full max-w-full rounded-xl object-contain" />
            <a
              href={src}
              download={attachment.name}
              className="absolute bottom-5 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs text-white hover:bg-white/25"
              onClick={e => e.stopPropagation()}
            >
              <Download size={13} /> Download
            </a>
          </div>
        )}
      </>
    );
  }

  if (attachment.kind === 'video') {
    return (
      <div className="overflow-hidden rounded-xl border border-black/10 bg-black">
        <video src={src} controls playsInline preload="metadata" className="max-h-64 w-full" />
        <p className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-white/60">
          <Play size={10} /> {label}
        </p>
      </div>
    );
  }

  if (attachment.kind === 'audio') {
    return (
      <div className="rounded-xl border border-black/10 bg-black/3 p-2">
        <audio src={src} controls className="w-full" />
        <p className="mt-1 text-[10px] text-black/40">{label}</p>
      </div>
    );
  }

  return (
    <a
      href={src}
      download={attachment.name}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-black/3 px-3 py-2.5 hover:bg-black/5 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-[#2F6BFF]/12 flex items-center justify-center shrink-0">
        <FileText size={15} className="text-[#2F6BFF]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-black/75">{attachment.name}</span>
        <span className="block text-[10px] text-black/35">{formatBytes(attachment.size)}</span>
      </span>
      <Download size={14} className="ml-auto text-black/35 shrink-0" />
    </a>
  );
}
