// Pure notification decision logic (no chrome/viem deps → unit-testable).

/**
 * Notify only when we have a previous reading AND the balance went up.
 * Generic over number | bigint so the SW can compare raw wei (bigint) with no
 * floating-point precision loss while the unit tests use plain numbers.
 */
export function shouldNotify<T extends number | bigint>(prev: T | null, current: T): boolean {
  return prev !== null && current > prev;
}
