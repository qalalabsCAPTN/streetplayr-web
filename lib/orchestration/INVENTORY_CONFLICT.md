# Realtime Inventory Conflict Strategy

## Availability Calculation

```sql
available = variant.stock_quantity
          - COALESCE(
              (SELECT SUM(quantity)
               FROM inventory_reservations
               WHERE variant_id = $1
                 AND reservation_state IN ('pending', 'held')),
              0)
          - COALESCE(
              (SELECT SUM(oi.quantity)
               FROM order_items oi
               JOIN orders o ON o.id = oi.order_id
               WHERE oi.variant_id = $1
                 AND o.status NOT IN ('cancelled', 'refunded')),
              0)
```

## Conflict Scenarios

| Scenario | Resolution |
|---|---|
| Two users enter checkout simultaneously for last item | First `reserveInventoryAction` succeeds. Second gets `409 Conflict` → "Item no longer available" |
| User adds to cart while stock depletes | Cart allows addition. Checkout entry fails with stock check. |
| Payment completes after reservation expired | Server-side PaymentIntent confirmation checks stock. If unavailable → full refund + notify customer + notify ops. |
| Admin manually releases inventory | Real-time push via Supabase Realtime channel. PDP updates available count. |

## Real-time Strategy

```
PDP mounts
  │
  ▼
Subscribe to channel: `inventory:product:{productId}`
  │
  ▼
On message: update `availableStock` state
  │
  ▼
If stock === 0: show "Sold Out" / notify if in cart
```

## Race Condition Protection

Reservation creation uses atomic Supabase RPC:

```sql
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_owner UUID,
  p_expires_at TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Atomic availability check + reservation
  SELECT stock_quantity - COALESCE(SUM(r.reserved_quantity), 0)
  INTO v_available
  FROM product_variants pv
  LEFT JOIN inventory_reservations r
    ON r.variant_id = pv.id
    AND r.reservation_state IN ('pending', 'held')
  WHERE pv.id = p_variant_id
  GROUP BY pv.stock_quantity;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: available=%, requested=%', v_available, p_quantity;
  END IF;

  INSERT INTO inventory_reservations (variant_id, reserved_quantity, reservation_owner, expires_at)
  VALUES (p_variant_id, p_quantity, p_owner, p_expires_at)
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;
```
