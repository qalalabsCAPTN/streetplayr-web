"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitContactAction, ContactInput } from "@/app/actions/contact";

const SUBJECTS = [
  "Order Support & Shipments",
  "Design Collaboration & PR",
  "Product Feedback",
  "General Inquiries",
];

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactInput>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    submittedAt: string;
    ticketId: string;
  } | null>(null);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const result = await submitContactAction(formData);

    setIsPending(false);
    if (!result.success) {
      setError(result.error || "Submission failed.");
    } else {
      setSuccessData({
        message: result.message || "Transmission received.",
        submittedAt: new Date().toLocaleTimeString(),
        ticketId: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
    }
  };

  return (
    <div className="w-full bg-[#1b1620]/40 border border-white/[0.06] rounded-xl overflow-hidden relative shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      {/* Interactive border glow */}
      <div className="absolute inset-0 border border-transparent pointer-events-none group-focus-within:border-[#ddb7ff]/20 transition-colors duration-500" />
      
      <div className="p-6 sm:p-8 md:p-10">
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="relative">
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending}
                    className="w-full bg-transparent border-b border-white/[0.10] py-3 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors duration-300 disabled:opacity-40"
                    placeholder="ENTER YOUR NAME"
                  />
                  <span className={`absolute bottom-0 left-0 h-[1px] bg-[#ddb7ff] transition-all duration-500 ${focusedField === "name" ? "w-full" : "w-0"}`} />
                </div>

                {/* Email */}
                <div className="relative">
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending}
                    className="w-full bg-transparent border-b border-white/[0.10] py-3 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors duration-300 disabled:opacity-40"
                    placeholder="ENTER EMAIL ADDRESS"
                  />
                  <span className={`absolute bottom-0 left-0 h-[1px] bg-[#ddb7ff] transition-all duration-500 ${focusedField === "email" ? "w-full" : "w-0"}`} />
                </div>
              </div>

              {/* Subject */}
              <div className="relative">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
                  Subject
                </label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  onFocus={() => setFocusedField("subject")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isPending}
                  className="w-full bg-transparent border-b border-white/[0.10] py-3 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors duration-300 disabled:opacity-40 cursor-pointer appearance-none"
                >
                  <option value="" disabled className="bg-[#1b1620] text-white/40">SELECT INQUIRY CATEGORY</option>
                  {SUBJECTS.map((sub) => (
                    <option key={sub} value={sub} className="bg-[#1b1620] text-[#eadfed] py-2">
                      {sub.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="absolute right-0 bottom-3 pointer-events-none text-white/30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <span className={`absolute bottom-0 left-0 h-[1px] bg-[#ddb7ff] transition-all duration-500 ${focusedField === "subject" ? "w-full" : "w-0"}`} />
              </div>

              {/* Message */}
              <div className="relative">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 mb-2.5">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isPending}
                  className="w-full bg-transparent border border-white/[0.10] p-4 font-mono text-[13px] text-[#eadfed] outline-none focus:border-[#ddb7ff]/40 transition-colors duration-300 disabled:opacity-40 rounded-lg resize-none placeholder:text-white/10"
                  placeholder="WRITE TRANSMISSION CORRESPONDENCE HERE..."
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-[11px] text-[#ff3b30] tracking-[0.1em]"
                >
                  {error}
                </motion.p>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isPending}
                className="relative w-full py-4 overflow-hidden group border border-white/[0.12] transition-all duration-500 hover:border-[#ddb7ff] disabled:opacity-40 cursor-pointer rounded-lg"
              >
                <span className="absolute inset-0 bg-[#ddb7ff] transition-transform duration-500 group-hover:scale-y-0 origin-bottom" />
                <span className="absolute inset-0 bg-[#eadfed] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                <span className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#16111b] flex items-center justify-center gap-2">
                  {isPending ? "Broadcasting..." : "Broadcast Signal"}
                </span>
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-left space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ddb7ff] shadow-[0_0_12px_rgba(221,183,255,0.6)] animate-pulse" />
                <span className="font-bold text-[13px] uppercase tracking-[0.25em] text-[#eadfed]">
                  Signal Transmitted
                </span>
              </div>

              <div className="bg-black/40 border border-white/[0.08] p-5 rounded-lg space-y-3.5 text-xs text-white/70">
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-white/40">TICKET_ID:</span>
                  <span className="text-[#ddb7ff] font-bold">{successData.ticketId}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-white/40">TIMESTAMP:</span>
                  <span>{successData.submittedAt}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-white/40">OPERATIONAL_NODE:</span>
                  <span>MUMBAI-CELL-01</span>
                </div>
                <div className="pt-2">
                  <span className="text-white/40 block mb-1">DECRYPTED RESPONSE:</span>
                  <p className="text-[#eadfed] tracking-wide leading-relaxed font-semibold">
                    {successData.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-3.5 border border-white/[0.12] rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/50 hover:text-white hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300"
              >
                Transmit Another Signal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/[0.06] px-6 sm:px-8 py-3.5 flex items-center justify-between bg-black/[0.15]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">
            Node Active
          </span>
        </div>
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-white/30 uppercase">
          SECURE ENCRYPTED CHANNEL
        </span>
      </div>
    </div>
  );
}
