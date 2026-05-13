"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { RealtimeManager } from "@/lib/realtime/manager";

/**
 * RealtimeProvider — Manages the lifecycle of global realtime subscriptions.
 * Keeps the UI synced with the database in the background.
 */
export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const sync = useAuthStore((s) => s.sync);
  const syncRef = useRef(sync);
  syncRef.current = sync;

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user?.id) return;

    // Start global listeners
    const cleanup = RealtimeManager.initGlobal(user.id, (updates) => {
      syncRef.current({ ...user, ...updates });
    });

    return () => cleanup();
  }, [isHydrated, isAuthenticated, user?.id]);

  return <>{children}</>;
}
