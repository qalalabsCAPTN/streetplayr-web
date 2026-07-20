'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAddressesAction,
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setPrimaryAddressAction,
  type AddressData,
} from '@/app/actions/address';

// ─── Address Card ───────────────────────────────────────────────────────
function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
}: {
  address: AddressData;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  return (
    <div className={`acct-address ${address.is_primary ? 'primary' : ''}`}>
      <div className="acct-address__head">
        <div className="acct-address__label">
          <span>{address.label}</span>
          {address.is_primary && <span className="acct-address__badge">Primary</span>}
        </div>
        <div className="acct-address__actions">
          <button type="button" onClick={() => onEdit(address.id)}>Edit</button>
          <button type="button" onClick={() => onDelete(address.id)} className="danger">Remove</button>
        </div>
      </div>

      <div className="acct-address__body">
        <p>{address.name}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>{address.city}, {address.state} — {address.pincode}</p>
        <p>{address.phone}</p>
      </div>

      {!address.is_primary && (
        <button type="button" onClick={() => onSetPrimary(address.id)} className="acct-address__setprimary">
          Set as primary
        </button>
      )}
    </div>
  );
}

// ─── Address Form ────────────────────────────────────────────────────────
function AddressForm({
  initial = {},
  onSave,
  onCancel,
}: {
  initial?: Partial<AddressData>;
  onSave: (addr: Omit<AddressData, 'id' | 'is_primary' | 'user_id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    label: initial.label ?? '',
    name: initial.name ?? '',
    line1: initial.line1 ?? '',
    line2: initial.line2 ?? '',
    city: initial.city ?? '',
    state: initial.state ?? '',
    pincode: initial.pincode ?? '',
    phone: initial.phone ?? '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-panel" noValidate>
      <h3 className="checkout-panel__title">{initial.label ? 'Edit address' : 'New address'}</h3>

      <div className="checkout-fields">
        <div className="checkout-fields-row">
          {[
            { name: 'label', label: 'Label', placeholder: 'Home, Work…' },
            { name: 'name', label: 'Full name', placeholder: 'Your name' },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="checkout-field">
              <label htmlFor={`addr-${name}`}>{label}</label>
              <input
                id={`addr-${name}`}
                name={name}
                type="text"
                value={(form as Record<string, string>)[name]}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={saving}
              />
            </div>
          ))}
        </div>
        {[
          { name: 'line1', label: 'Address line 1', placeholder: 'Street, building, floor' },
          { name: 'line2', label: 'Address line 2', placeholder: 'Landmark, area (optional)' },
        ].map(({ name, label, placeholder }) => (
          <div key={name} className="checkout-field">
            <label htmlFor={`addr-${name}`}>{label}</label>
            <input
              id={`addr-${name}`}
              name={name}
              type="text"
              value={(form as Record<string, string>)[name]}
              onChange={handleChange}
              placeholder={placeholder}
              disabled={saving}
            />
          </div>
        ))}
        <div className="checkout-fields-row checkout-fields-row--3">
          {[
            { name: 'city', label: 'City', placeholder: 'Mumbai' },
            { name: 'state', label: 'State', placeholder: 'Maharashtra' },
            { name: 'pincode', label: 'Pincode', placeholder: '400001' },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className="checkout-field">
              <label htmlFor={`addr-${name}`}>{label}</label>
              <input
                id={`addr-${name}`}
                name={name}
                type="text"
                value={(form as Record<string, string>)[name]}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={saving}
              />
            </div>
          ))}
        </div>
        <div className="checkout-field">
          <label htmlFor="addr-phone">Phone</label>
          <input
            id="addr-phone"
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            disabled={saving}
          />
        </div>
      </div>

      <div className="acct-address-form__actions">
        <button type="submit" disabled={saving} className="pill">
          {saving ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="acct-address-form__cancel">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────
export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    setLoading(true);
    const result = await getAddressesAction();
    if (result.success && result.data) {
      setAddresses(result.data);
    }
    setLoading(false);
  }

  const handleAdd = useCallback(async (data: Omit<AddressData, 'id' | 'is_primary' | 'user_id' | 'created_at'>) => {
    const result = await createAddressAction(data);
    if (result.success && result.data) {
      setAddresses((prev) => [...prev, result.data as AddressData]);
    }
    setIsAdding(false);
  }, []);

  const handleEdit = useCallback(async (id: string, data: Omit<AddressData, 'id' | 'is_primary' | 'user_id' | 'created_at'>) => {
    const result = await updateAddressAction(id, data);
    if (result.success && result.data) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === id ? (result.data as AddressData) : a))
      );
    }
    setEditingId(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteAddressAction(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSetPrimary = useCallback(async (id: string) => {
    await setPrimaryAddressAction(id);
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_primary: a.id === id }))
    );
  }, []);

  const primaryAddress = addresses.find((a) => a.is_primary);
  const otherAddresses = addresses.filter((a) => !a.is_primary);

  if (loading) {
    return (
      <div>
        <div className="acct-hero">
          <h1>Saved Addresses</h1>
        </div>
        <p className="acct-card__sub">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="acct-hero">
        <h1>Saved Addresses</h1>
      </div>

      {primaryAddress && (
        <>
          <div className="acct-section-head" style={{ marginTop: 0 }}>
            <h2>Primary address</h2>
          </div>
          {editingId === primaryAddress.id ? (
            <AddressForm
              key={`form-${primaryAddress.id}`}
              initial={primaryAddress}
              onSave={(data) => handleEdit(primaryAddress.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <AddressCard
              key={primaryAddress.id}
              address={primaryAddress}
              onEdit={setEditingId}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
            />
          )}
        </>
      )}

      {otherAddresses.length > 0 && (
        <>
          <div className="acct-section-head">
            <h2>Other addresses ({otherAddresses.length})</h2>
          </div>
          <div className="acct-address-list">
            {otherAddresses.map((addr) =>
              editingId === addr.id ? (
                <AddressForm
                  key={`form-${addr.id}`}
                  initial={addr}
                  onSave={(data) => handleEdit(addr.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={setEditingId}
                  onDelete={handleDelete}
                  onSetPrimary={handleSetPrimary}
                />
              )
            )}
          </div>
        </>
      )}

      {isAdding && (
        <div style={{ marginTop: 20 }}>
          <AddressForm onSave={handleAdd} onCancel={() => setIsAdding(false)} />
        </div>
      )}

      {!addresses.length && !isAdding && !editingId && (
        <div className="acct-empty" style={{ margin: '20px 0' }}>
          <p className="acct-empty__title">No addresses saved.</p>
          <p className="acct-empty__sub">Add a delivery address to get started.</p>
        </div>
      )}

      {!isAdding && !editingId && addresses.length > 0 && (
        <button type="button" onClick={() => setIsAdding(true)} className="acct-address-add">
          + Add new address
        </button>
      )}
    </div>
  );
}
