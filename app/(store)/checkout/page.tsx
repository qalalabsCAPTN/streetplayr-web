"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PremiumInput from "@/components/checkout/PremiumInput";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    setMounted(true);
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  if (!mounted || items.length === 0) return null;

  const handleCheckout = () => {
    router.push("/checkout/success");
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-32 px-6 sm:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Header / Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <span className="font-display text-xl tracking-[0.16em] text-white">
            STREET PLAYR
          </span>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">
            Secure Checkout
          </p>
        </motion.div>

        {/* Form Container */}
        <div className="space-y-32">
          {/* Contact & Shipping */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="space-y-24"
          >
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 border-b border-white/5 pb-4">
                Contact
              </h2>
              <PremiumInput
                id="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 border-b border-white/5 pb-4">
                Shipping
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12">
                <PremiumInput
                  id="firstName"
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <PremiumInput
                  id="lastName"
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <div className="sm:col-span-2">
                  <PremiumInput
                    id="address"
                    label="Street Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <PremiumInput
                  id="city"
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <PremiumInput
                  id="country"
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Payment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            className="space-y-12"
          >
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-12 border-b border-white/5 pb-4">
                Payment
              </h2>
              
              <div className="space-y-12">
                <PremiumInput
                  id="cardName"
                  label="Name on Card"
                />
                <PremiumInput
                  id="cardNumber"
                  label="Card Number"
                  maxLength={19}
                />
                <div className="grid grid-cols-2 gap-12">
                  <PremiumInput
                    id="expiry"
                    label="Expiry (MM/YY)"
                    maxLength={5}
                  />
                  <PremiumInput
                    id="cvc"
                    label="CVC"
                    type="password"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1, ease: "easeOut" }}
            onClick={handleCheckout}
            className="w-full mt-24 py-8 bg-transparent border border-white/20 font-mono text-xs uppercase tracking-[0.3em] text-white transition-all duration-700 hover:bg-white hover:text-black"
          >
            Secure Allocation
          </motion.button>

          {/* Embedded Atmospheric Order Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 1.5 }}
            className="pt-32 mt-32 border-t border-white/5"
          >
            <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/20 mb-16 text-center">
              Dossier Summary
            </h3>
            
            <div className="space-y-12">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center group opacity-40 hover:opacity-100 transition-opacity duration-1000">
                  <div className="flex items-center gap-8">
                    <div className="relative w-16 h-24 bg-[#050505] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
                      <Image
                        src={item.image || "/images/placeholder.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover opacity-60 mix-blend-screen"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <p className="font-display text-xs tracking-[0.2em] uppercase text-white/80">{formatProductTitle(item.name)}</p>
                      <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mt-2">
                        {item.color} // {item.size} // QTY {item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-12 mt-12 border-t border-white/5 flex flex-col items-end gap-4">
                <div className="flex gap-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
                  <span>Value</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex gap-12 font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
                  <span>Shipping</span>
                  <span>Complimentary</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
