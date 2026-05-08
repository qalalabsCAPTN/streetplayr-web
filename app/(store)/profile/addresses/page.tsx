'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isPrimary: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    name: 'Arjun Mehta',
    line1: '12, Green Park Colony',
    line2: 'Near Metro Station',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    phone: '+91 98765 43210',
    isPrimary: true,
  },
];

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
}: {
  address: Address;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  return (
    <motion.div
      className={`address-card ${address.isPrimary ? 'address-card--primary' : ''}`}
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
          {address.isPrimary && (
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

      {!address.isPrimary && (
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

interface AddressFormProps {
  initial?: Partial<Address>;
  onSave: (addr: Omit<Address, 'id' | 'isPrimary'>) => void;
  onCancel: () => void;
}

function AddressForm({ initial = {}, onSave, onCancel }: AddressFormProps) {
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
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
          { name: 'label', label: 'Label (Home, Work…)', placeholder: 'Home' },
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
            />
          </div>
        ))}
      </div>

      <div className="address-form-actions">
        <button type="submit" className="auth-cta" id="save-address-btn">Save Address</button>
        <button type="button" onClick={onCancel} className="address-form-cancel" id="cancel-address-btn">Cancel</button>
      </div>
    </motion.form>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd(data: Omit<Address, 'id' | 'isPrimary'>) {
    const newAddr: Address = {
      ...data,
      id: `addr-${Date.now()}`,
      isPrimary: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, newAddr]);
    setIsAdding(false);
  }

  function handleEdit(id: string, data: Omit<Address, 'id' | 'isPrimary'>) {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      // If deleted was primary, set first remaining as primary
      if (next.length > 0 && !next.some((a) => a.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }

  function handleSetPrimary(id: string) {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.id === id }))
    );
  }

  const editingAddress = addresses.find((a) => a.id === editingId);

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
