const store = new Map<string, string[]>();

export function getInventoryCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [pid, codes] of store) out[pid] = codes.length;
  return out;
}

export function addCodes(productId: string, codes: string[]): void {
  const existing = store.get(productId) ?? [];
  store.set(productId, [...existing, ...codes]);
}

export function popCode(productId: string): string | null {
  const codes = store.get(productId);
  if (!codes || codes.length === 0) return null;
  const code = codes.shift()!;
  store.set(productId, codes);
  return code;
}
