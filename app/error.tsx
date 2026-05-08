'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="max-w-md text-center space-y-8">
        <h1 className="font-display text-5xl uppercase tracking-wide text-white md:text-6xl">
          Unexpected Interruption
        </h1>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/40">
          The experience encountered an error.
        </p>
        <button
          onClick={reset}
          className="group inline-flex items-center gap-4 border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black"
        >
          Reload Experience
        </button>
      </div>
    </div>
  );
}
