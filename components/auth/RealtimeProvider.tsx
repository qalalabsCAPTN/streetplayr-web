"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user?.id) return;

    // Start global listeners
    const cleanup = RealtimeManager.initGlobal(user.id, (updates) => {
      sync({ ...user, ...updates });
    });

    return () => cleanup();
  }, [isHydrated, isAuthenticated, user?.id, sync, user]);

  return <>{children}</>;
}
