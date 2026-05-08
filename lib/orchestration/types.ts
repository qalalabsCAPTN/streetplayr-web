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
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'on_hold'
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

export interface PaymentEvent {
  id: string;
  orderId: string;
  eventType: PaymentEventType;
  stripeEventId?: string;
  stripePaymentIntentId?: string;
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
