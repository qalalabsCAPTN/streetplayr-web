'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import {
  getAddressesAction,
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setPrimaryAddressAction,
  type AddressData,
} from '@/app/actions/address';

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
    <motion.div
      className={`address-card ${address.is_primary ? 'address-card--primary' : ''}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Address: ${address.label}`}
    >
      <div className="address-card-top">
        <div className="address-card-label-row">
          <span className="address-card-label">{address.label}</span>
          {address.is_primary && (
            <span className="address-card-primary-badge">Primary</span>
          )}
        </div>
        <div className="address-card-actions">
          <button
            type="button"
            onClick={() => onEdit(address.id)}
            className="address-card-btn"
            id={`edit-address-${address.id}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            className="address-card-btn address-card-btn--danger"
            id={`delete-address-${address.id}`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="address-card-body">
        <p className="address-card-name">{address.name}</p>
        <p className="address-card-line">{address.line1}</p>
        {address.line2 && <p className="address-card-line">{address.line2}</p>}
        <p className="address-card-line">{address.city}, {address.state} — {address.pincode}</p>
        <p className="address-card-line">{address.phone}</p>
      </div>

      {!address.is_primary && (
        <button
          type="button"
          onClick={() => onSetPrimary(address.id)}
          className="address-card-set-primary"
          id={`set-primary-${address.id}`}
        >
          Set as primary
        </button>
      )}
    </motion.div>
  );
}

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
    <motion.form
      className="address-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      noValidate
    >
      <h3 className="address-form-title">{initial.label ? 'Edit Address' : 'New Address'}</h3>

      <div className="address-form-grid">
        {[
          { name: 'label', label: 'Label (Home, Work\u2026)', placeholder: 'Home' },
          { name: 'name', label: 'Full Name', placeholder: 'Your name' },
          { name: 'line1', label: 'Address Line 1', placeholder: 'Street, building, floor' },
          { name: 'line2', label: 'Address Line 2 (optional)', placeholder: 'Landmark, area' },
          { name: 'city', label: 'City', placeholder: 'Mumbai' },
          { name: 'state', label: 'State', placeholder: 'Maharashtra' },
          { name: 'pincode', label: 'Pincode', placeholder: '400001' },
          { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
        ].map(({ name, label, placeholder }) => (
          <div key={name} className={`auth-field ${name === 'line1' || name === 'line2' ? 'address-form-full' : ''}`}>
            <label htmlFor={`addr-${name}`} className="auth-label">{label}</label>
            <input
              id={`addr-${name}`}
              name={name}
              type="text"
              value={(form as Record<string, string>)[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="auth-input"
              disabled={saving}
            />
          </div>
        ))}
      </div>

      <div className="address-form-actions">
        <button type="submit" className="auth-cta" id="save-address-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Address'}
        </button>
        <button type="button" onClick={onCancel} className="address-form-cancel" id="cancel-address-btn" disabled={saving}>Cancel</button>
      </div>
    </motion.form>
  );
}

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

  const editingAddress = addresses.find((a) => a.id === editingId);

  if (loading) {
    return (
      <div className="profile-page-root">
        <div className="profile-page-header">
          <p className="profile-page-eyebrow">Delivery locations</p>
          <h1 className="profile-page-title">Addresses</h1>
        </div>
        <div className="flex h-[30vh] items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-root">
      <motion.div
        className="profile-page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="profile-page-eyebrow">Delivery locations</p>
        <h1 className="profile-page-title">Addresses</h1>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {addresses.map((addr) =>
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
      </AnimatePresence>

      {isAdding && (
        <AddressForm
          key="new-form"
          onSave={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {!isAdding && !editingId && (
        <motion.button
          type="button"
          onClick={() => setIsAdding(true)}
          className="address-add-btn"
          id="add-address-btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          + Add New Address
        </motion.button>
      )}
    </div>
  );
}
