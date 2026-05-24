"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Phase = "idle" | "uploading" | "generating" | "result" | "error";

interface AITryOnProps {
  productImageUrl: string;
  productTitle: string;
  onAddToCart?: () => void;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

/** Animated shimmer placeholder */
function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/[0.04] ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(221,183,255,0.07),transparent)",
          animationTimingFunction: "linear",
        }}
      />
    </div>
  );
}

/** The drag-to-compare Before / After slider */
function CompareSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.5); // 0 = full before, 1 = full after
  const dragging = useRef(false);

  const updateRatio = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clamped = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setRatio(clamped);
  }, []);

  /* Mouse */
  const onMouseDown = () => { dragging.current = true; };
  const onMouseMove = (e: React.MouseEvent) => { if (dragging.current) updateRatio(e.clientX); };
  const onMouseUp = () => { dragging.current = false; };

  /* Touch */
  const onTouchMove = (e: React.TouchEvent) => {
    updateRatio(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden w-full aspect-[3/4] cursor-col-resize"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
    >
      {/* BEFORE — user original */}
      <Image
        src={before}
        alt="You — before"
        fill
        className="object-cover"
        sizes="(min-width:1024px) 30vw, 100vw"
        draggable={false}
      />

      {/* AFTER — AI result, clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${Math.round((1 - ratio) * 100)}% 0 0)` }}
      >
        <Image
          src={after}
          alt="You — wearing item"
          fill
          className="object-cover"
          sizes="(min-width:1024px) 30vw, 100vw"
          draggable={false}
        />
        {/* "AI GENERATED" badge */}
        <span className="absolute top-3 right-3 font-mono text-[7px] uppercase tracking-[0.25em] text-[#ddb7ff]/80 bg-black/60 backdrop-blur-sm px-2 py-1 border border-[#ddb7ff]/20">
          AI Generated
        </span>
      </div>

      {/* Divider handle */}
      <div
        className="absolute inset-y-0 w-px bg-white/60 shadow-[0_0_8px_rgba(221,183,255,0.6)] pointer-events-none"
        style={{ left: `${ratio * 100}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/30 flex items-center justify-center pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8 6l-6 6 6 6" />
            <path d="M16 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-3 left-3 font-mono text-[8px] uppercase tracking-[0.2em] text-white/50 pointer-events-none">Before</span>
      <span className="absolute bottom-3 right-3 font-mono text-[8px] uppercase tracking-[0.2em] text-[#ddb7ff]/70 pointer-events-none">After</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function AITryOn({
  productImageUrl,
  productTitle,
  onAddToCart,
}: AITryOnProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── File selection ── */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg("Photo must be under 8 MB.");
        setPhase("error");
        return;
      }

      setUserPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserPhotoPreview(ev.target?.result as string);
        setPhase("idle"); // show preview in idle state, ready for generate
      };
      reader.readAsDataURL(file);
    },
    []
  );

  /* ── Drag & drop ── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const mockEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(mockEvent);
    }
  }, [handleFileChange]);

  /* ── Start timer ── */
  const startTimer = useCallback(() => {
    setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 500);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* ── Main generate flow ── */
  const handleGenerate = useCallback(async () => {
    if (!userPhotoFile) return;

    try {
      // 1. Upload user photo
      setPhase("uploading");
      const form = new FormData();
      form.append("file", userPhotoFile);

      const uploadRes = await fetch("/api/ai-tryon/upload", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setUploadedUrl(uploadData.url);

      // 2. Call AI model
      setPhase("generating");
      startTimer();

      const tryonRes = await fetch("/api/ai-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userImageUrl: uploadData.url,
          garmentImageUrl: productImageUrl,
        }),
      });
      const tryonData = await tryonRes.json();
      stopTimer();

      if (!tryonRes.ok || !tryonData.output) {
        throw new Error(tryonData.error || "AI generation failed");
      }

      setResultUrl(tryonData.output);
      setPhase("result");
    } catch (err: unknown) {
      stopTimer();
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setPhase("error");
    }
  }, [userPhotoFile, productImageUrl, startTimer, stopTimer]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setPhase("idle");
    setUserPhotoPreview(null);
    setUserPhotoFile(null);
    setUploadedUrl(null);
    setResultUrl(null);
    setErrorMsg("");
    setElapsed(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div className="border border-white/[0.06] bg-[#16111b] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {/* Spark icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ddb7ff" className="opacity-80">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#ddb7ff]/80 font-medium">
            AI Try-On
          </span>
          <span className="px-1.5 py-0.5 border border-[#ddb7ff]/20 font-mono text-[6px] uppercase tracking-[0.2em] text-[#ddb7ff]/40">
            Beta
          </span>
        </div>
        {phase !== "idle" && phase !== "error" && (
          <button
            onClick={handleReset}
            className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5">

        {/* ── IDLE: no photo yet ── */}
        {phase === "idle" && !userPhotoPreview && (
          <div className="space-y-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 leading-relaxed">
              Upload a full-body photo — see yourself wearing {productTitle}
            </p>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border border-dashed border-white/[0.12] hover:border-[#ddb7ff]/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-10 group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 flex items-center justify-center border border-white/[0.10] group-hover:border-[#ddb7ff]/30 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-[#ddb7ff]/60 transition-colors">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 group-hover:text-white/70 transition-colors">
                  Drop photo here
                </p>
                <p className="font-mono text-[8px] text-white/25 mt-1">
                  or tap to browse · JPG PNG WEBP · max 8MB
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
              id="tryon-file-input"
              aria-label="Upload your photo for try-on"
            />
          </div>
        )}

        {/* ── IDLE: photo selected, ready to generate ── */}
        {phase === "idle" && userPhotoPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* User photo */}
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">You</p>
                <div className="relative aspect-[3/4] overflow-hidden border border-white/[0.08]">
                  <Image src={userPhotoPreview} alt="Your photo" fill className="object-cover" sizes="50vw" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm border border-white/[0.12] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.15em] text-white/60 hover:text-white transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Garment */}
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">Garment</p>
                <div className="relative aspect-[3/4] overflow-hidden border border-white/[0.08] bg-[#050505]">
                  <Image src={productImageUrl} alt={productTitle} fill className="object-cover" sizes="50vw" />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-4 font-mono text-[10px] uppercase tracking-[0.25em] font-semibold bg-[#ddb7ff]/10 border border-[#ddb7ff]/25 text-[#ddb7ff] hover:bg-[#ddb7ff]/20 hover:border-[#ddb7ff]/50 transition-all flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#ddb7ff" className="opacity-80 flex-shrink-0">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              Generate Try-On
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
              id="tryon-file-input-preview"
              aria-label="Change your photo"
            />
          </div>
        )}

        {/* ── UPLOADING ── */}
        {phase === "uploading" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">Uploading…</p>
                <Shimmer className="aspect-[3/4]" />
              </div>
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">Garment</p>
                <div className="relative aspect-[3/4] overflow-hidden border border-white/[0.08] bg-[#050505]">
                  <Image src={productImageUrl} alt={productTitle} fill className="object-cover" sizes="50vw" />
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-white/[0.04] overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#ddb7ff]/40 to-transparent animate-[slide_1s_linear_infinite]" />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35 text-center">
              Uploading your photo…
            </p>
          </div>
        )}

        {/* ── GENERATING ── */}
        {phase === "generating" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">You</p>
                <div className="relative aspect-[3/4] overflow-hidden border border-white/[0.08]">
                  {userPhotoPreview && (
                    <Image src={userPhotoPreview} alt="Your photo" fill className="object-cover opacity-40" sizes="50vw" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16111b]/80 to-transparent" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#ddb7ff]/50">Fitting…</p>
                <Shimmer className="aspect-[3/4]" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-[2px] bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ddb7ff]/60 to-[#ddb7ff]/20 animate-[slide_2s_ease-in-out_infinite]"
                style={{ width: "40%" }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                Fitting your look…
              </p>
              <p className="font-mono text-[9px] text-white/25">
                {formatTime(elapsed)}
              </p>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && resultUrl && userPhotoPreview && (
          <div className="space-y-4">
            <CompareSlider before={userPhotoPreview} after={resultUrl} />

            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30 text-center">
              ← Drag to compare →
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3 font-mono text-[9px] uppercase tracking-[0.2em] border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 transition-all"
              >
                Try Again
              </button>
              {onAddToCart && (
                <button
                  onClick={onAddToCart}
                  className="flex-1 py-3 font-mono text-[9px] uppercase tracking-[0.22em] font-semibold bg-white text-[#16111b] hover:bg-[#ddb7ff] transition-colors"
                >
                  Add to Cart
                </button>
              )}
            </div>

            <p className="font-mono text-[7px] text-white/20 text-center leading-relaxed">
              AI-generated preview. Actual fit may vary.
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-red-500/20 bg-red-500/5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="font-mono text-[9px] text-red-400/80 leading-relaxed">
                {errorMsg || "Something went wrong. Please try again."}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] border border-white/[0.12] text-white/60 hover:text-white hover:border-white/30 transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
