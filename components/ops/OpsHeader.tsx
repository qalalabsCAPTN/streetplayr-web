"use client";

import React from "react";
import { useOps } from "./OpsProvider";
import Link from "next/link";

export default function OpsHeader() {
  const { activeBrandId } = useOps();

  return (
    <header className="relative z-50 flex items-center justify-between px-6 py-4 border-bottom border-[var(--ops-border-subtle)] bg-[var(--ops-bg-base)]/80 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/ops" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-display text-sm tracking-tighter">
            SP
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--ops-text-secondary)]">
            OpsOS / {activeBrandId}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {["Inventory", "Products", "Drops", "Orders", "Customers", "Wallet"].map((item) => (
            <Link
              key={item}
              href={`/ops/${item.toLowerCase()}`}
              className="text-[10px] font-mono tracking-[0.15em] uppercase text-[var(--ops-text-muted)] hover:text-[var(--ops-text-primary)] transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-[var(--ops-text-secondary)]">
            System Live
          </span>
        </div>
        
        <button className="w-8 h-8 rounded-full bg-[var(--ops-bg-elevated)] border border-[var(--ops-border-subtle)] flex items-center justify-center text-[10px] font-mono text-[var(--ops-text-secondary)] hover:text-white transition-colors">
          JD
        </button>
      </div>
    </header>
  );
}
