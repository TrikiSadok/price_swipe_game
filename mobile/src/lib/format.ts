// Small formatting helpers.

const DECIMALS: Record<string, number> = { TND: 3, DZD: 2, JPY: 0, XOF: 0 };

/** "1.250 TND", "180 JPY", "2.40 EUR". */
export function formatMoney(amount: number, currency: string): string {
  const digits = DECIMALS[currency] ?? 2;
  const number = new Intl.NumberFormat("en", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(amount);
  return `${number} ${currency}`;
}

/** Country code -> flag emoji ("TN" -> 🇹🇳). */
export function flagEmoji(countryCode: string): string {
  return String.fromCodePoint(
    ...countryCode.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** "812 km", "12.3 km", "350 m". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en")} km`;
}

const UNITS: Record<string, string> = { g: "g", kg: "kg", ml: "ml", L: "L", piece: "piece(s)" };

export function formatSize(quantity: string, unit: string): string {
  return `${quantity} ${UNITS[unit] ?? unit}`;
}

/** "2,49" or "2.49" -> 2.49; null if not a positive number. */
export function parseAmount(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}
