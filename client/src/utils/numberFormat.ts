/**
 * Boundary Value Analysis (BVA) & Equivalence Partitioning (EQP) Formatter
 * Formats user input with Indonesian thousand separators (dot).
 * Examples: '2000' -> '2.000', '2000000' -> '2.000.000'
 */

export const BVA_LIMITS = {
  MIN_AMOUNT: 1, // Batas bawah: minimal Rp 1
  MAX_AMOUNT: 10_000_000_000, // Batas atas: maksimal Rp 10 Miliar
};

export function formatNominalInput(value: string | number): string {
  const str = String(value);
  const cleanDigits = str.replace(/\D/g, '');
  if (!cleanDigits) return '';

  const num = parseInt(cleanDigits, 10);
  // Boundary Value Analysis: clamp to maximum 10 Miliar
  if (num > BVA_LIMITS.MAX_AMOUNT) {
    return new Intl.NumberFormat('id-ID').format(BVA_LIMITS.MAX_AMOUNT);
  }

  return new Intl.NumberFormat('id-ID').format(num);
}

export function parseNominalRaw(formatted: string | number): number {
  if (typeof formatted === 'number') return formatted;
  const cleanDigits = formatted.replace(/\D/g, '');
  return cleanDigits ? parseInt(cleanDigits, 10) : 0;
}

export function validateBVAAmount(amount: number): { valid: boolean; message?: string } {
  if (isNaN(amount) || amount < BVA_LIMITS.MIN_AMOUNT) {
    return { valid: false, message: 'Nominal minimal Rp 1' };
  }
  if (amount > BVA_LIMITS.MAX_AMOUNT) {
    return { valid: false, message: 'Nominal melebihi batas maksimal Rp 10.000.000.000' };
  }
  return { valid: true };
}
