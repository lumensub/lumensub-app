/** Decimals used by classic Stellar assets and the native XLM SAC. */
export const DEFAULT_DECIMALS = 7;

const DAY = 86_400n;

/**
 * Convert a human amount such as "12.5" into base units. Throws on anything
 * that isn't a plain non-negative decimal, or that carries more precision than
 * the token supports, rather than silently rounding.
 */
export function toBaseUnits(value: string, decimals = DEFAULT_DECIMALS): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Not a valid amount: "${value}"`);
  }
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places`);
  }
  const padded = fraction.padEnd(decimals, "0");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

/** Convert base units back to a decimal string with trailing zeros removed. */
export function fromBaseUnits(value: bigint, decimals = DEFAULT_DECIMALS): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = abs / scale;
  const fraction = (abs % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  const text = fraction ? `${whole}.${fraction}` : whole.toString();
  return negative ? `-${text}` : text;
}

/**
 * Format an amount for display, e.g. `formatAmount(125000000n, "USDC")` gives
 * "12.5 USDC". Whole-number parts get thousands separators.
 */
export function formatAmount(value: bigint, code?: string, decimals = DEFAULT_DECIMALS): string {
  const [whole, fraction] = fromBaseUnits(value, decimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const text = fraction ? `${grouped}.${fraction}` : grouped;
  return code ? `${text} ${code}` : text;
}

/**
 * Describe a billing period in words. Common periods get their usual names;
 * everything else falls back to days, hours or seconds.
 */
export function formatPeriod(periodSecs: bigint | number): string {
  const secs = BigInt(periodSecs);
  if (secs <= 0n) return "one-off";
  const named: Record<string, string> = {
    [String(DAY)]: "daily",
    [String(7n * DAY)]: "weekly",
    [String(14n * DAY)]: "every 2 weeks",
    [String(30n * DAY)]: "monthly",
    [String(90n * DAY)]: "quarterly",
    [String(365n * DAY)]: "yearly",
  };
  const name = named[String(secs)];
  if (name) return name;
  if (secs % DAY === 0n) return `every ${secs / DAY} days`;
  if (secs % 3600n === 0n) return `every ${secs / 3600n} hours`;
  return `every ${secs} seconds`;
}

/** Shorten a G... or C... address to its first and last few characters. */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Monthly-equivalent revenue for one subscription, used for MRR estimates. */
export function monthlyEquivalent(amount: bigint, periodSecs: bigint): bigint {
  if (periodSecs <= 0n) return 0n;
  return (amount * 30n * DAY) / periodSecs;
}
