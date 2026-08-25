'use client';

/**
 * Global Admin toast system.
 *
 * Hand-rolled (no @radix-ui/react-toast in this repo's deps — see
 * ADMIN_CURRENT_STATE.md, "no shared toast exists anywhere in
 * app/admin"; individual pages that had any toast at all used local
 * `useState<string|null>`). This is the first shared one. Mount
 * `<AdminToaster />` once in app/admin/layout.tsx; call `useAdminToast()`
 * anywhere under it.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastVariant = 'default' | 'success' | 'destructive';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'border-border bg-base-elevated text-text-primary',
  success: 'border-status-success/40 bg-status-success/10 text-status-success',
  destructive: 'border-status-error/40 bg-status-error/10 text-status-error',
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur ${VARIANT_STYLES[item.variant]}`}
          >
            <p className="font-medium">{item.title}</p>
            {item.description && <p className="mt-0.5 text-xs opacity-80">{item.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft, not hard — a missing provider shouldn't crash an admin
    // page mid-mutation; it should just silently not show the toast.
    return { toast: () => {} };
  }
  return ctx;
}
