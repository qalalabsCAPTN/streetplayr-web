'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ContactForm from '@/components/sections/contact/ContactForm';
import { SOCIAL_LINKS } from '@/lib/social';

const EASE = [0.22, 1, 0.36, 1] as const;

const CARDS = [
  {
    label: 'Email',
    title: SOCIAL_LINKS.email,
    href: SOCIAL_LINKS.emailHref,
    body: 'Orders, returns, and product questions. Reply within 12–24 hours.',
  },
  {
    label: 'Customer Support',
    title: SOCIAL_LINKS.phoneDisplay,
    href: SOCIAL_LINKS.phone,
    body: 'WhatsApp and phone for live order help.',
  },
  {
    label: 'Business Enquiries',
    title: 'Collaborations & PR',
    href: SOCIAL_LINKS.emailHref,
    body: 'Wholesale, press, partnerships — include brand + brief.',
  },
];

const SOCIALS = [
  { name: 'Instagram', href: SOCIAL_LINKS.instagram },
  { name: 'Facebook', href: SOCIAL_LINKS.facebook },
  { name: 'YouTube', href: SOCIAL_LINKS.youtube },
  { name: 'LinkedIn', href: SOCIAL_LINKS.linkedin },
  { name: 'WhatsApp', href: SOCIAL_LINKS.whatsapp },
];

/** Navbar/Footer come from contact/layout.tsx — do not duplicate. */
export default function ContactPage() {
  return (
    <div className="contact-page flex flex-col w-full">
      <section className="contact-hero w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
        <motion.span
          className="contact-hero__eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          Contact
        </motion.span>
        <motion.h1
          className="contact-hero__title"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
        >
          Talk to
          <br />
          StreetPlayR
        </motion.h1>
        <motion.p
          className="contact-hero__sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.14, ease: EASE }}
        >
          Support, collaborations, and everything in between.
        </motion.p>
      </section>

      <section className="w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
        <div className="contact-cards">
          {CARDS.map((card, i) => (
            <motion.article
              key={card.label}
              className="contact-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.06 * i, ease: EASE }}
            >
              <div className="contact-card__label">{card.label}</div>
              <h2 className="contact-card__title">
                <a href={card.href}>{card.title}</a>
              </h2>
              <p className="contact-card__body">{card.body}</p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="contact-card__label" style={{ marginBottom: 12 }}>
            Social
          </div>
          <div className="contact-social">
            {SOCIALS.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">
                {s.name}
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-8 lg:gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <span className="contact-hero__eyebrow">Message</span>
            <h2 className="listing__title" style={{ fontSize: 'clamp(26px, 3.5vw, 36px)' }}>
              Send a note
            </h2>
            <p className="contact-hero__sub" style={{ marginTop: 10 }}>
              Include your order ID when you have one.
            </p>
          </motion.div>
          <motion.div
            className="contact-form-shell"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </section>

      <motion.section
        className="contact-cta w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2>Shop the drop</h2>
        <p>Browse the latest collection while you wait.</p>
        <Link href="/collections" className="contact-cta__btn">
          View Collections
        </Link>
      </motion.section>
    </div>
  );
}
