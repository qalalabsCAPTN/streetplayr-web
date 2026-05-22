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
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-[#1f1a23] border p-6 md:p-8 relative ${
        address.is_primary ? 'border-[#ddb7ff]/30' : 'border-white/[0.06] hover:border-white/[0.1]'
      } transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl uppercase text-[#eadfed]">{address.label}</span>
          {address.is_primary && (
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ddb7ff] border border-[#ddb7ff]/30 px-2 py-0.5">
              Primary
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onEdit(address.id)}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-red-400/50 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-1.5 mb-4">
        <p className="font-mono text-xs text-white/70">{address.name}</p>
        <p className="font-mono text-[10px] text-white/40">{address.line1}</p>
        {address.line2 && <p className="font-mono text-[10px] text-white/40">{address.line2}</p>}
        <p className="font-mono text-[10px] text-white/40">{address.city}, {address.state} — {address.pincode}</p>
        <p className="font-mono text-[10px] text-white/40">{address.phone}</p>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full border border-white/20" />
          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/15">NODE_ACTIVE</span>
          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/10">ID: {address.id.slice(0, 6).toUpperCase()}</span>
        </div>
        {!address.is_primary && (
          <button
            type="button"
            onClick={() => onSetPrimary(address.id)}
            className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ddb7ff]/[0.5] hover:text-[#ddb7ff] transition-colors"
          >
            Set as Primary
          </button>
        )}
      </div>
    </motion.div>
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
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8"
      noValidate
    >
      <h3 className="font-display text-2xl uppercase text-[#eadfed] mb-6 pb-4 border-b border-white/[0.05]">
        {initial.label ? 'Edit Address' : 'New Delivery Node'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { name: 'label', label: 'Label', placeholder: 'Home, Work…' },
          { name: 'name', label: 'Full Name', placeholder: 'Your name' },
          { name: 'line1', label: 'Address Line 1', placeholder: 'Street, building, floor' },
          { name: 'line2', label: 'Address Line 2', placeholder: 'Landmark, area (optional)' },
          { name: 'city', label: 'City', placeholder: 'Mumbai' },
          { name: 'state', label: 'State', placeholder: 'Maharashtra' },
          { name: 'pincode', label: 'Pincode', placeholder: '400001' },
          { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
        ].map(({ name, label, placeholder }) => (
          <div key={name} className={`space-y-1.5 ${name === 'line1' || name === 'line2' ? 'md:col-span-2' : ''}`}>
            <label htmlFor={`addr-${name}`} className="block font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              {label}
            </label>
            <input
              id={`addr-${name}`}
              name={name}
              type="text"
              value={(form as Record<string, string>)[name]}
              onChange={handleChange}
              placeholder={placeholder}
              disabled={saving}
              className="w-full bg-transparent border border-white/[0.08] px-4 py-2.5 font-mono text-xs text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-[#ddb7ff]/40"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.05]">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#ddb7ff] text-[#16111b] font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
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

  const editingAddress = addresses.find((a) => a.id === editingId);
  const primaryAddress = addresses.find((a) => a.is_primary);
  const otherAddresses = addresses.filter((a) => !a.is_primary);

  if (loading) {
    return (
      <div className="max-w-[1200px]">
        <div className="mb-10 border-l-4 border-[#ddb7ff] pl-6">
          <div className="h-3 w-48 bg-white/[0.04] mb-2" />
          <div className="h-12 w-64 bg-white/[0.03]" />
        </div>
        <div className="flex h-[30vh] items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      {/* ═══ HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 border-l-4 border-[#ddb7ff] pl-6"
      >
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
          Saved Nodes
        </h1>
      </motion.header>

      {/* ═══ PRIMARY NODE ═══ */}
      {primaryAddress && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.05]">
            <h2 className="font-display text-xl uppercase text-[#ddb7ff]">Primary Node</h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">ACTIVE</span>
          </div>
          <AnimatePresence mode="popLayout">
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
          </AnimatePresence>
        </section>
      )}

      {/* ═══ OTHER NODES ═══ */}
      {otherAddresses.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.05]">
            <h2 className="font-display text-xl uppercase text-[#ddb7ff]">Saved Nodes</h2>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">{otherAddresses.length} NODE{otherAddresses.length !== 1 ? 'S' : ''}</span>
          </div>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
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
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ═══ ADD NEW NODE ═══ */}
      {isAdding && (
        <div className="mb-10">
          <AddressForm
            onSave={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {!addresses.length && !isAdding && !editingId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-white/[0.06] p-12 text-center mb-10"
        >
          <p className="font-display text-3xl uppercase text-white/15 mb-3">No nodes registered.</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20 mb-6">
            Add a delivery node to get started.
          </p>
        </motion.div>
      )}

      {!isAdding && !editingId && addresses.length > 0 && (
        <motion.button
          type="button"
          onClick={() => setIsAdding(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full py-5 border border-dashed border-white/[0.1] hover:border-[#ddb7ff]/30 bg-transparent font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-[#ddb7ff]/70 transition-all"
        >
          + Add New Node
        </motion.button>
      )}
    </div>
  );
}
