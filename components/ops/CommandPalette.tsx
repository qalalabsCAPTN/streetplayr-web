"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOps } from "./OpsProvider";

const COMMANDS = [
  { id: "inv", label: "Inventory Orchestration", shortcut: "G I" },
  { id: "prod", label: "Product Authority", shortcut: "G P" },
  { id: "drop", label: "Active Drops", shortcut: "G D" },
  { id: "ord", label: "Order Narratives", shortcut: "G O" },
  { id: "wal", label: "Wallet Progression", shortcut: "G W" },
  { id: "cust", label: "CRM Profiles", shortcut: "G C" },
];

export default function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useOps();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
    }
  }, [isCommandPaletteOpen]);

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl bg-[var(--ops-bg-elevated)] border border-[var(--ops-border-subtle)] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-6 border-b border-[var(--ops-border-subtle)]">
              <input
                autoFocus
                type="text"
                placeholder="Command operational search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xl font-body placeholder:text-[var(--ops-text-muted)] text-[var(--ops-text-primary)]"
              />
            </div>
            
            <div className="max-h-[400px] overflow-y-auto p-2">
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.id}
                  className="w-full flex items-center justify-between p-4 rounded-sm hover:bg-[var(--ops-bg-surface)] group transition-colors"
                >
                  <span className="text-sm font-mono tracking-wider text-[var(--ops-text-secondary)] group-hover:text-[var(--ops-text-primary)]">
                    {cmd.label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ops-text-muted)] group-hover:text-[var(--ops-text-secondary)]">
                    {cmd.shortcut}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-[var(--ops-bg-surface)] flex items-center justify-between border-t border-[var(--ops-border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                ESC to close
              </span>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-[var(--ops-text-muted)]">
                  ↑↓ to navigate
                </span>
                <span className="text-[10px] font-mono text-[var(--ops-text-muted)]">
                  ↵ to execute
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
