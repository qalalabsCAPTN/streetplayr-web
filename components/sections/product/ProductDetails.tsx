"use client";

import { motion } from "framer-motion";

type DetailItem = {
  title: string;
  content: string;
};

type ProductDetailsProps = {
  details: DetailItem[];
};

export default function ProductDetails({ details }: ProductDetailsProps) {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h2 className="font-display text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              Specifications
            </h2>
            <p className="mt-6 max-w-sm font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-white/30">
              Technical details and product care intelligence.
            </p>
          </div>
          
          <div className="lg:col-span-7 lg:col-start-6">
            <div className="flex flex-col">
              {details.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4 border-b border-white/10 py-8 first:pt-0 sm:flex-row sm:gap-16 lg:gap-24"
                >
                  <h3 className="w-48 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                    {item.title}
                  </h3>
                  <div className="font-mono text-xs leading-loose tracking-widest text-white/60">
                    {item.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-4" : ""}>{line}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
