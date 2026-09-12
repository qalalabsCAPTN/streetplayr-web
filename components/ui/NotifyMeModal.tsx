'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { submitNotifyMeAction } from '@/app/actions/notify-me';
import { validateNotifyMeInput } from '@/lib/notify-me/validate';

export type NotifyMeProduct = {
  id: string;
  name: string;
  slug: string;
  variantsLabel?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  product: NotifyMeProduct;
};

export default function NotifyMeModal({ open, onClose, product }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  const pendingRef = useRef(pending);
  onCloseRef.current = onClose;
  pendingRef.current = pending;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setPending(false);
    setError('');
    setSuccess('');
    setFieldErrors({});
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pendingRef.current) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, product.id]);

  if (!open || !mounted) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const local = validateNotifyMeInput({
      name,
      email,
      phone,
      productId: product.id,
      productName: product.name,
      productHandle: product.slug,
      variants: product.variantsLabel ?? '',
    });
    const visible = Object.fromEntries(
      Object.entries(local).filter(([key]) => key !== 'product')
    );
    if (Object.keys(visible).length > 0) {
      setFieldErrors(visible);
      setError('Please check the form and try again.');
      return;
    }
    setPending(true);
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      const result = await submitNotifyMeAction({
        name,
        email,
        phone,
        website,
        productId: product.id,
        productName: product.name,
        productHandle: product.slug,
        variants: product.variantsLabel ?? '',
      });
      if (result.success) {
        setSuccess(result.message);
        return;
      }
      setError(result.error);
      if (result.fields) setFieldErrors(result.fields);
    } catch {
      setError('Could not save your request. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return createPortal(
    <div className="nmodal-overlay" role="presentation" onClick={() => !pending && onClose()}>
      <div
        className="nmodal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nmodal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="nmodal__close"
          onClick={onClose}
          aria-label="Close"
          disabled={pending}
        >
          ×
        </button>
        <p className="nmodal__eyebrow">Back in stock</p>
        <h2 id="nmodal-title" className="nmodal__title">
          Notify me
        </h2>
        <p className="nmodal__sub">{product.name}</p>

        {success ? (
          <p className="nmodal__success" role="status">
            {success}
          </p>
        ) : (
          <form className="nmodal__form" onSubmit={submit} noValidate>
            <label className="nmodal__label" htmlFor="notify-name">
              Name
            </label>
            <input
              id="notify-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
              required
            />
            {fieldErrors.name ? <p className="nmodal__error">{fieldErrors.name}</p> : null}

            <label className="nmodal__label" htmlFor="notify-email">
              Email
            </label>
            <input
              id="notify-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              required
            />
            {fieldErrors.email ? <p className="nmodal__error">{fieldErrors.email}</p> : null}

            <label className="nmodal__label" htmlFor="notify-phone">
              Phone Number
            </label>
            <input
              id="notify-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending}
              required
            />
            {fieldErrors.phone ? <p className="nmodal__error">{fieldErrors.phone}</p> : null}

            <div className="nmodal__hp" aria-hidden="true">
              <label htmlFor="notify-website">Website</label>
              <input
                id="notify-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {error ? (
              <p className="nmodal__error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="nmodal__submit" disabled={pending}>
              {pending ? 'Sending…' : 'Notify me'}
            </button>
          </form>
        )}
      </div>
    </div>,
    (document.querySelector('.storefront-root') as HTMLElement) || document.body
  );
}
