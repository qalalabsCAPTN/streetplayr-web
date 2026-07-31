"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useTryOnSaveStore } from "@/store/tryonSaveStore";
import {
  imageUrlToDataUrl,
} from "@/lib/tryon-saves/adapter";
import type { TryOnSave } from "@/lib/tryon-saves/types";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Phase = "idle" | "uploading" | "generating" | "result" | "error";
type SavePhase = "idle" | "saving" | "saved" | "error";

interface AITryOnProps {
  productImageUrl: string;
  productTitle: string;
  productSlug?: string;
  productId?: string;
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
      className={`relative overflow-hidden bg-[var(--fg-04)] ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background:
            "linear-gradient(90deg,transparent,color-mix(in srgb, var(--sp-ai-accent) 7%, transparent),transparent)",
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
        <span className="absolute top-3 right-3 font-mono text-[7px] uppercase tracking-[0.25em] text-[var(--sp-ai-accent)]/80 bg-black/60 backdrop-blur-sm px-2 py-1 border border-[var(--sp-ai-accent)]/20">
          AI Generated
        </span>
      </div>

      {/* Divider handle */}
      <div
        className="absolute inset-y-0 w-px bg-white/60 shadow-[0_0_8px_color-mix(in_srgb,var(--sp-ai-accent)_60%,transparent)] pointer-events-none"
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
      <span className="absolute bottom-3 right-3 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--sp-ai-accent)]/70 pointer-events-none">After</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function AITryOn({
  productImageUrl,
  productTitle,
  productSlug,
  productId,
  onAddToCart,
}: AITryOnProps) {
  const isEnabled = process.env.NEXT_PUBLIC_AI_TRYON_ENABLED !== "false";
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addLocal = useTryOnSaveStore((s) => s.addLocal);

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [saveError, setSaveError] = useState("");
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
      // 1. Upload user photo to Supabase (gets a real public URL)
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



      // 2. Also upload the garment image so the AI model has a real public URL
      //    (product images are relative paths like /assets/... — we must make them absolute)
      setPhase("uploading");
      let garmentPublicUrl = productImageUrl;

      if (!productImageUrl.startsWith("http")) {
        // Fetch the local image and re-upload to Supabase so HuggingFace can reach it
        const garmentBlob = await fetch(productImageUrl).then((r) => r.blob());
        const garmentFile = new File(
          [garmentBlob],
          "garment.jpg",
          { type: garmentBlob.type || "image/jpeg" }
        );
        const garmentForm = new FormData();
        garmentForm.append("file", garmentFile);

        const garmentUploadRes = await fetch("/api/ai-tryon/upload", {
          method: "POST",
          body: garmentForm,
        });
        const garmentUploadData = await garmentUploadRes.json();

        if (!garmentUploadRes.ok || !garmentUploadData.url) {
          throw new Error(garmentUploadData.error || "Garment upload failed");
        }
        garmentPublicUrl = garmentUploadData.url;
      }

      // 3. Call AI model with both real public URLs and the product metadata
      setPhase("generating");
      startTimer();

      const tryonRes = await fetch("/api/ai-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userImageUrl: uploadData.url,
          garmentImageUrl: garmentPublicUrl,
          productTitle,
        }),
      });
      const tryonData = await tryonRes.json();
      stopTimer();

      if (!tryonRes.ok) {
        if (tryonRes.status === 401) {
          throw new Error("Authentication required. Please sign in to try on this item.");
        }
        if (tryonRes.status === 429) {
          throw new Error(tryonData.error || "You have reached your daily limit of 3 try-ons.");
        }
        if (tryonRes.status === 503) {
          throw new Error(tryonData.error || "Store try-on quota limit reached for today. Try again tomorrow.");
        }
        throw new Error(tryonData.error || "AI generation failed");
      }

      if (!tryonData.output) {
        throw new Error("AI try-on completed but returned no output image.");
      }

      setResultUrl(tryonData.output);
      setSavePhase("idle");
      setSaveError("");
      setPhase("result");
    } catch (err: unknown) {
      stopTimer();
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setPhase("error");
    }
  }, [userPhotoFile, productImageUrl, productTitle, startTimer, stopTimer]);

  /* ── Save to profile gallery ── */
  const handleSaveToProfile = useCallback(async () => {
    if (!resultUrl || savePhase === "saving" || savePhase === "saved") return;

    if (!isAuthenticated) {
      setSaveError("Sign in to save this look to your profile.");
      setSavePhase("error");
      return;
    }

    setSavePhase("saving");
    setSaveError("");

    try {
      const res = await fetch("/api/ai-tryon/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultUrl,
          productTitle,
          productSlug,
          productId,
          productImageUrl,
        }),
      });
      const data = await res.json();

      if (res.ok && data.item) {
        addLocal(data.item as TryOnSave);
        setSavePhase("saved");
        return;
      }

      // Offline / stub fallback — keep look on this device
      const localUrl = /^https?:\/\//i.test(resultUrl)
        ? resultUrl
        : await imageUrlToDataUrl(resultUrl);
      const localItem: TryOnSave = {
        id: crypto.randomUUID(),
        imageUrl: localUrl,
        productTitle,
        productSlug: productSlug ?? null,
        productId: productId ?? null,
        productImageUrl: productImageUrl ?? null,
        createdAt: new Date().toISOString(),
      };
      addLocal(localItem);
      setSavePhase("saved");
      if (data?.error) {
        setSaveError(""); // still saved locally
      }
    } catch {
      try {
        const localUrl = /^https?:\/\//i.test(resultUrl)
          ? resultUrl
          : await imageUrlToDataUrl(resultUrl);
        addLocal({
          id: crypto.randomUUID(),
          imageUrl: localUrl,
          productTitle,
          productSlug: productSlug ?? null,
          productId: productId ?? null,
          productImageUrl: productImageUrl ?? null,
          createdAt: new Date().toISOString(),
        });
        setSavePhase("saved");
      } catch {
        setSaveError("Could not save. Try again.");
        setSavePhase("error");
      }
    }
  }, [
    resultUrl,
    savePhase,
    isAuthenticated,
    productTitle,
    productSlug,
    productId,
    productImageUrl,
    addLocal,
  ]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setPhase("idle");
    setUserPhotoPreview(null);
    setUserPhotoFile(null);

    setResultUrl(null);
    setErrorMsg("");
    setElapsed(0);
    setSavePhase("idle");
    setSaveError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  if (!isEnabled) return null;

  return (
    <div className="ai-tryon-panel rounded-2xl border border-[var(--sp-ai-accent)]/15 overflow-hidden shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--sp-ai-accent)_25%,transparent)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sp-ai-accent)]/10 bg-[var(--sp-ai-accent)]/[0.03]">
        <div className="flex items-center gap-2.5">
          {/* Spark icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--sp-ai-accent)" className="opacity-80">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--sp-ai-accent)]/80 font-medium">
            AI Try-On
          </span>
          <span className="px-1.5 py-0.5 border border-[var(--sp-ai-accent)]/20 font-mono text-[6px] uppercase tracking-[0.2em] text-[var(--sp-ai-accent)]/40">
            Beta
          </span>
        </div>
        {phase !== "idle" && phase !== "error" && (
          <button
            onClick={handleReset}
            className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-30)] hover:text-[var(--fg-60)] transition-colors"
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
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-45)] leading-relaxed">
              Upload a full-body photo — see yourself wearing {productTitle}
            </p>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-xl border border-dashed border-[var(--sp-ai-accent)]/20 hover:border-[var(--sp-ai-accent)]/45 hover:bg-[var(--sp-ai-accent)]/[0.03] transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-10 group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-[var(--sp-ai-accent)]/15 group-hover:border-[var(--sp-ai-accent)]/40 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--fg-45)] group-hover:text-[var(--sp-ai-accent)]/60 transition-colors">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-50)] group-hover:text-[var(--fg-72)] transition-colors">
                  Drop photo here
                </p>
                <p className="font-mono text-[8px] text-[var(--fg-25)] mt-1">
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
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-35)]">You</p>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--fg-08)]">
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
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-35)]">Garment</p>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--fg-08)] bg-[var(--chip)]">
                  <Image src={productImageUrl} alt={productTitle} fill className="object-cover" sizes="50vw" />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-4 rounded-lg font-mono text-[10px] uppercase tracking-[0.25em] font-semibold bg-[var(--sp-ai-accent)]/10 border border-[var(--sp-ai-accent)]/25 text-[var(--sp-ai-accent)] hover:bg-[var(--sp-ai-accent)]/20 hover:border-[var(--sp-ai-accent)]/50 transition-all flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--sp-ai-accent)" className="opacity-80 flex-shrink-0">
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
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-35)]">Uploading…</p>
                <Shimmer className="aspect-[3/4]" />
              </div>
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-35)]">Garment</p>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--fg-08)] bg-[var(--chip)]">
                  <Image src={productImageUrl} alt={productTitle} fill className="object-cover" sizes="50vw" />
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-[var(--fg-04)] overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[var(--sp-ai-accent)]/40 to-transparent animate-[slide_1s_linear_infinite]" />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-35)] text-center">
              Uploading your photo…
            </p>
          </div>
        )}

        {/* ── GENERATING ── */}
        {phase === "generating" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-35)]">You</p>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[var(--fg-08)]">
                  {userPhotoPreview && (
                    <Image src={userPhotoPreview} alt="Your photo" fill className="object-cover opacity-40" sizes="50vw" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16111b]/80 to-transparent" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--sp-ai-accent)]/50">Fitting…</p>
                <Shimmer className="aspect-[3/4]" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-[2px] bg-[var(--fg-06)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--sp-ai-accent)]/60 to-[var(--sp-ai-accent)]/20 animate-[slide_2s_ease-in-out_infinite]"
                style={{ width: "40%" }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-35)]">
                Fitting your look…
              </p>
              <p className="font-mono text-[9px] text-[var(--fg-25)]">
                {formatTime(elapsed)}
              </p>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && resultUrl && userPhotoPreview && (
          <div className="space-y-4">
            <CompareSlider before={userPhotoPreview} after={resultUrl} />

            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-30)] text-center">
              ← Drag to compare →
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3 font-mono text-[9px] uppercase tracking-[0.2em] border border-[var(--fg-12)] text-[var(--fg-50)] hover:text-[var(--fg-95)] hover:border-[var(--fg-30)] transition-all"
              >
                Try Again
              </button>
              {onAddToCart && (
                <button
                  onClick={onAddToCart}
                  className="flex-1 py-3 font-mono text-[9px] uppercase tracking-[0.22em] font-semibold bg-white text-[#16111b] hover:bg-[var(--sp-ai-accent)] transition-colors"
                >
                  Add to Cart
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveToProfile}
              disabled={savePhase === "saving" || savePhase === "saved"}
              className="w-full py-3.5 rounded-lg font-mono text-[9px] uppercase tracking-[0.22em] font-semibold border border-[var(--sp-ai-accent)]/30 text-[var(--sp-ai-accent)] bg-[var(--sp-ai-accent)]/[0.08] hover:bg-[var(--sp-ai-accent)]/[0.16] disabled:opacity-60 disabled:cursor-default transition-all flex items-center justify-center gap-2"
              aria-live="polite"
            >
              {savePhase === "saving" && "Saving…"}
              {savePhase === "saved" && "Saved to profile"}
              {(savePhase === "idle" || savePhase === "error") && "Save to your profile"}
            </button>

            {savePhase === "saved" && (
              <p className="font-mono text-[8px] text-center text-[var(--fg-40)]">
                View in{" "}
                <Link href="/profile/try-ons" className="text-[var(--sp-ai-accent)]/80 underline-offset-2 hover:underline">
                  Profile → AI Try-Ons
                </Link>
              </p>
            )}
            {savePhase === "error" && saveError && (
              <p className="font-mono text-[8px] text-center text-red-400/80">{saveError}</p>
            )}

            <p className="font-mono text-[7px] text-[var(--fg-20)] text-center leading-relaxed">
              AI Style Preview — actual garment fits and print scales may vary.
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
              className="w-full py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] border border-[var(--fg-12)] text-[var(--fg-60)] hover:text-[var(--fg-95)] hover:border-[var(--fg-30)] transition-all"
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
