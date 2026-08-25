import { describe, it, expect } from 'vitest';
import { buildEvent } from './client';

describe('buildEvent — purchase.completed envelope construction', () => {
  it('builds a NECTAR-conformant envelope with all required fields', () => {
    const event = buildEvent({
      eventType: 'purchase.completed',
      actorUserId: 'user-1',
      eventId: 'order-1',
      payload: { orderId: 'order-1', orderTotal: 999, currency: 'INR', isFirstOrder: false, siteId: 'streetplayr' },
    });

    expect(event.eventId).toBe('order-1');
    expect(event.eventType).toBe('purchase.completed');
    expect(event.version).toBe(1);
    expect(event.platform).toBe('streetplayr');
    expect(event.actorUserId).toBe('user-1');
    expect(event.payload).toEqual({
      orderId: 'order-1',
      orderTotal: 999,
      currency: 'INR',
      isFirstOrder: false,
      siteId: 'streetplayr',
    });
    // timestamp must be valid, recent ISO8601 — matches NECTAR's ≤5min-future validator
    expect(new Date(event.timestamp).getTime()).not.toBeNaN();
    expect(Math.abs(Date.now() - new Date(event.timestamp).getTime())).toBeLessThan(5000);
  });

  it('defaults eventId to a fresh UUID when not provided (non-order events)', () => {
    const a = buildEvent({ eventType: 'content.shared', actorUserId: 'u1', payload: {} });
    const b = buildEvent({ eventType: 'content.shared', actorUserId: 'u1', payload: {} });
    expect(a.eventId).not.toBe(b.eventId);
  });

  it('reusing the same eventId for the same order makes retried emits naturally idempotent at NECTAR', () => {
    const a = buildEvent({ eventType: 'purchase.completed', actorUserId: 'u1', eventId: 'order-1', payload: {} });
    const b = buildEvent({ eventType: 'purchase.completed', actorUserId: 'u1', eventId: 'order-1', payload: {} });
    expect(a.eventId).toBe(b.eventId); // same order id in => same NECTAR event id out, every time
  });
});
