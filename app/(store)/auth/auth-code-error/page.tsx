import Link from 'next/link';

/** Parent root layout reads cookies for auth — keep this route dynamic too. */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Authentication Error | StreetplayR',
};

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#16111b] px-6">
      <div className="max-w-md text-center space-y-8">
        <h1 className="font-display text-5xl uppercase tracking-wide text-[#eadfed] md:text-6xl">
          Authentication Error
        </h1>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/40">
          Session authorization could not be completed.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          The window may have been closed before completion, or the session token expired.
        </p>
        <Link
          href="/login"
          className="rounded-xl group inline-flex items-center gap-4 border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-widest text-[#eadfed] transition-all hover:bg-[#ddb7ff] hover:text-[#16111b]"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
