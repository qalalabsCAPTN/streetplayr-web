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
        message: result.message || "Message received.",
        submittedAt: new Date().toLocaleTimeString(),
        ticketId: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    }
  };

  const fieldClass =
    "w-full bg-transparent border border-[var(--line)] px-3 py-3 text-[13px] outline-none focus:border-[var(--fg)] transition-colors duration-200 disabled:opacity-40";

  const labelClass =
    "block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] mb-2";

  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait">
        {!successData ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isPending}
                  className={fieldClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isPending}
                  className={fieldClass}
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className={labelClass}>
                Subject
              </label>
              <select
                id="contact-subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={isPending}
                className={`${fieldClass} cursor-pointer appearance-none`}
              >
                <option value="" disabled>
                  Select a topic
                </option>
                {SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className={labelClass}>
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={isPending}
                className={`${fieldClass} resize-none`}
                placeholder="How can we help?"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[12px] text-red-500"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="contact-cta__btn w-full text-center disabled:opacity-40"
            >
              {isPending ? "Sending…" : "Send Message"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5 py-2"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Received</p>
            <h3 className="text-[22px] tracking-[0.04em] uppercase">Message sent</h3>
            <div className="border border-[var(--line)] p-4 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--muted)]">Ticket</span>
                <span>{successData.ticketId}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--muted)]">Time</span>
                <span>{successData.submittedAt}</span>
              </div>
              <p className="pt-2 text-[var(--muted)] leading-relaxed">{successData.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="contact-cta__btn w-full text-center"
            >
              Send another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
