"use client";

import { motion } from "framer-motion";
import { SOCIAL_LINKS } from "@/lib/social";

const infoItems = [
  {
    category: "Operational Hub",
    title: "Mumbai, India",
    details: ["Street PlayR Pvt. Ltd.", "Lower Parel, Mumbai, MH 400013"],
  },
  {
    category: "Customer Care",
    title: SOCIAL_LINKS.email,
    href: SOCIAL_LINKS.emailHref,
    details: [
      "Order inquiries & exchanges",
      "Response window: 12-24 hours",
    ],
  },
  {
    category: "Phone",
    title: SOCIAL_LINKS.phoneDisplay,
    href: SOCIAL_LINKS.phone,
    details: ["Customer Care", "WhatsApp available"],
  },
];

export default function ContactInfo() {
  return (
    <div className="flex flex-col gap-10 md:gap-12 w-full lg:max-w-[400px]">
      <div className="flex items-center gap-3">
        <span className="h-px w-6 bg-white/20 block" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          Active Channels
        </span>
      </div>

      <div className="space-y-8">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="border-l border-white/[0.08] pl-6 py-1 group hover:border-[#ddb7ff]/50 transition-colors duration-300"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30 block mb-2.5">
              {item.category}
            </span>
            <h3 className="font-display text-[15px] sm:text-[17px] uppercase tracking-[0.08em] text-[#eadfed] group-hover:text-[#ddb7ff] transition-colors duration-300 mb-2">
              {"href" in item && item.href ? (
                <a href={item.href} className="hover:underline">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {item.details.map((detail, idx) => (
              <p key={idx} className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-white/45 leading-relaxed">
                {detail}
              </p>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Network Signals / Socials */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="pt-6 border-t border-white/[0.06]"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30 block mb-4">
          Network Signals
        </span>
        <div className="flex flex-wrap gap-2.5">
          {[
            { name: "Instagram", href: SOCIAL_LINKS.instagram },
            { name: "Facebook", href: SOCIAL_LINKS.facebook },
            { name: "YouTube", href: SOCIAL_LINKS.youtube },
            { name: "LinkedIn", href: SOCIAL_LINKS.linkedin },
            { name: "WhatsApp", href: SOCIAL_LINKS.whatsapp },
          ].map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-white/[0.08] rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 hover:text-[#ddb7ff] hover:border-[#ddb7ff]/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              {social.name}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
