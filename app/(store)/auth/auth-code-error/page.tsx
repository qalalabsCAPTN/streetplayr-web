import Link from 'next/link';

export const metadata = {
  title: 'Authentication Error | Street PlayR',
};

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="max-w-md text-center space-y-8">
        <h1 className="font-display text-5xl uppercase tracking-wide text-white md:text-6xl">
          Authentication Error
        </h1>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/40">
          The authentication process could not be completed.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          This may have happened because you closed the window before completion,
          or the session expired. Please try again.
        </p>
        <Link
          href="/login"
          className="group inline-flex items-center gap-4 border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
