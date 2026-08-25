'use client';

/**
 * Generic destructive/confirmation dialog for Admin mutations.
 * Built on @radix-ui/react-dialog (already a dependency, previously
 * unused anywhere in app/admin — see ADMIN_CURRENT_STATE.md). Modeled
 * on Airbone's `shared/confirm-dialog.tsx` prop shape (title,
 * description, confirmLabel, onConfirm, variant, loading) — see
 * AIRBONE_ADMIN_REFERENCE_AUDIT.md §8.
 */
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[91] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-base-elevated p-5 shadow-xl">
          <Dialog.Title className="text-sm font-semibold text-text-primary">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1.5 text-xs text-text-secondary">{description}</Dialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-base-elevated"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                variant === 'destructive'
                  ? 'bg-status-error text-white hover:bg-status-error/90'
                  : 'bg-nectar-400 text-black hover:bg-nectar-300'
              }`}
            >
              {loading ? 'Working…' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
