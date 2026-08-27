/** on_hand minus active reservations. Never negative. */
export function netAvailable(onHand: number, reserved: number): number {
  return Math.max(0, (onHand ?? 0) - reserved);
}
