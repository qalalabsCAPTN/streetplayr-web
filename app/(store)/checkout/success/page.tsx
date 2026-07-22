import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center font-mono text-xs uppercase tracking-[0.3em] text-white/40">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
