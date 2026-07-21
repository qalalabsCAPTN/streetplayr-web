"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    q: "How long does dispatch and delivery take?",
    a: "Garments from active drops are typically processed and dispatched from our Mumbai facility within 24-48 hours. Standard shipping across India is free on all orders, and express delivery (2-3 business days) is available at checkout for an additional fee.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order has been dispatched, a unique tracking number is linked to your member profile under “Order History,” and you'll get real-time email notifications as it moves through carrier milestones.",
  },
  {
    q: "Can I return or exchange an item?",
    a: "Items in our limited “Archive” drops are eligible for exchange only, subject to sizing availability — refunds are only issued for manufacturing defects. You have 7 days from delivery to notify us, and items must come back unworn, unwashed, with original labels and packaging intact.",
  },
  {
    q: "Who pays for return shipping?",
    a: "Return shipping is covered by the buyer, unless the return is due to a verifiable manufacturing defect or a delivery error on our end.",
  },
  {
    q: "How long does an exchange take to process?",
    a: "Once your returned item is received and cleared by our warehouse, exchanges or credit adjustments are processed within 5-7 business days. Any Member Credits earned on the returned item are adjusted accordingly.",
  },
  {
    q: "How do I find my size?",
    a: "Every product page has a Size Guide with chest/waist measurements and fit notes — tap “Size Guide” next to the size selector before you buy.",
  },
  {
    q: "What are Member Credits?",
    a: "Member Credits are earned automatically on eligible purchases and shown on each product page — they build toward rewards in your account. If an item you earned credits on is later returned, those credits are adjusted to match.",
  },
  {
    q: "What if my package arrives damaged?",
    a: "Take photos before opening it and contact us immediately — we'll run a priority audit and issue a replacement if you're eligible.",
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-hero">
          <span className="legal-hero__eyebrow">Support</span>
          <h1>Frequently Asked Questions</h1>
          <span className="legal-hero__meta">Shipping, returns, sizing &amp; orders</span>
        </div>

        <div className="faq-list">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className="faq-item" key={item.q}>
                <button
                  className="faq-item__q"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className="faq-item__toggle">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p className="faq-item__a">{item.a}</p>}
              </div>
            );
          })}
        </div>

        <div className="legal-contact" style={{ marginTop: 28 }}>
          <h2>Still need help?</h2>
          <div className="legal-contact__row">
            <span className="legal-contact__label">Email</span>
            <a href="mailto:Orders@playR.in">Orders@playR.in</a>
          </div>
          <div className="legal-contact__row">
            <span className="legal-contact__label">Phone</span>
            <a href="tel:+919599220517">+91 95992 20517</a>
          </div>
        </div>

        <Link href="/home" className="legal-back">
          ← Return to Home
        </Link>
      </div>
    </div>
  );
}
