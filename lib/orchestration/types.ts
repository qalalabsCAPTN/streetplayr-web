/**
 * StreetPlayR Orchestration — Shared Types
 *
 * Core type definitions used across reservation, order, payment,
 * and event subsystems. All lifecycle state is enum-driven.
 */

// ─── Reservation ──────────────────────────────────────────────────────────

export type ReservationState =
  | 'pending'
  | 'held'
  | 'converted'
  | 'released'
  | 'expired';

export type ReservationSource =
  | 'checkout_enter'
  | 'payment_intent_created'
  | 'payment_confirmed'
  | 'admin_override'
  | 'system_release';

export interface InventoryReservation {
  id: string;
  cartId?: string;
  orderId?: string;
  productId: string;
  variantId: string;
  reservedQuantity: number;
  reservationState: ReservationState;
  reservationOwner: string;
  expiresAt: string;
  convertedAt?: string;
  releasedAt?: string;
  createdAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  currency: string;
  shippingAddress: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  paymentIntentId?: string;
  metadata: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  metadata: Record<string, unknown>;
}

// ─── Payment ──────────────────────────────────────────────────────────────

// Kept as-is deliberately: this is the canonical, provider-neutral event
// vocabulary the whole orchestration layer already speaks (matches the live
// `payment_event_type` DB enum exactly). The "payment_intent."/"charge."
// prefixes read as Stripe-flavored naming but the values themselves are the
// shared contract every provider's webhook adapter maps into — renaming
// them would mean an `ALTER TYPE ... RENAME VALUE` on the live enum, which
// is a live DB change out of scope for this pass (see audit report).
export type PaymentEventType =
  | 'payment_intent.created'
  | 'payment_intent.processing'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'payment_intent.expired'
  | 'charge.refunded'
  | 'charge.disputed'
  | 'charge.refund.updated';

// Gateways that plug into this orchestration layer via a webhook adapter.
// 'stripe' is a currently-inactive/orphaned adapter (no checkout flow
// creates a Stripe PaymentIntent anywhere in this app) kept only because
// its webhook route still exists; 'easebuzz' is the active provider.
export type PaymentProvider = 'stripe' | 'easebuzz';

export interface PaymentEvent {
  id: string;
  orderId: string;
  eventType: PaymentEventType;
  provider?: PaymentProvider;
  /** Provider-issued event identifier (Stripe's `event.id`, or an
   *  app-constructed `easebuzz:{txnid}:{eventType}` key). Physically still
   *  stored in the `stripe_event_id` DB column pending the provider-neutral
   *  rename migration proposed in the audit — see lib/orchestration/payment.ts. */
  providerEventId?: string;
  /** Provider-issued transaction identifier (Stripe PaymentIntent id, or
   *  Easebuzz `txnid`). Physically still stored in `stripe_payment_intent_id`. */
  providerTransactionId?: string;
  amount: number;
  currency: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
}

// ─── Operational Event Timeline ───────────────────────────────────────────

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

export type EventDomain =
  | 'auth'
  | 'reservation'
  | 'order'
  | 'payment'
  | 'inventory'
  | 'fulfillment'
  | 'system';

export interface OperationalEvent {
  id: string;
  domain: EventDomain;
  severity: EventSeverity;
  action: string;
  actorId?: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  message: string;
  createdAt: string;
}

// ─── Action Response ──────────────────────────────────────────────────────

export interface OrchestrationResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
