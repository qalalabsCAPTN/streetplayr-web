"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface OpsContextType {
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
}

const OpsContext = createContext<OpsContextType | undefined>(undefined);

export function OpsProvider({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<string | null>("streetplayr"); // Default V1

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <OpsContext.Provider
      value={{
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        activeBrandId,
        setActiveBrandId,
      }}
    >
      {children}
    </OpsContext.Provider>
  );
}

export function useOps() {
  const context = useContext(OpsContext);
  if (context === undefined) {
    throw new Error("useOps must be used within an OpsProvider");
  }
  return context;
}
