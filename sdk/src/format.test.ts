import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatPeriod,
  fromBaseUnits,
  monthlyEquivalent,
  shortenAddress,
  toBaseUnits,
} from "./format";

describe("toBaseUnits", () => {
  it("converts whole and fractional amounts", () => {
    expect(toBaseUnits("1")).toBe(10_000_000n);
    expect(toBaseUnits("12.5")).toBe(125_000_000n);
    expect(toBaseUnits("0.0000001")).toBe(1n);
  });

  it("respects a custom decimals value", () => {
    expect(toBaseUnits("1.25", 2)).toBe(125n);
  });

  it("rejects too much precision instead of rounding", () => {
    expect(() => toBaseUnits("0.00000001")).toThrow(/decimal places/);
  });

  it("rejects things that are not amounts", () => {
    for (const bad of ["", "-1", "1e5", "abc", "1.", ".5", "1,000"]) {
      expect(() => toBaseUnits(bad)).toThrow();
    }
  });
});

describe("fromBaseUnits", () => {
  it("drops trailing zeros", () => {
    expect(fromBaseUnits(125_000_000n)).toBe("12.5");
    expect(fromBaseUnits(10_000_000n)).toBe("1");
    expect(fromBaseUnits(1n)).toBe("0.0000001");
  });

  it("handles negatives", () => {
    expect(fromBaseUnits(-5_000_000n)).toBe("-0.5");
  });

  it("round-trips with toBaseUnits", () => {
    for (const value of ["0", "3", "99.99", "1234567.1234567"]) {
      expect(fromBaseUnits(toBaseUnits(value))).toBe(value);
    }
  });
});

describe("formatAmount", () => {
  it("adds thousands separators and the asset code", () => {
    expect(formatAmount(12_345_675_000_000n, "USDC")).toBe("1,234,567.5 USDC");
    expect(formatAmount(10_000_000n)).toBe("1");
  });
});

describe("formatPeriod", () => {
  it("names common periods", () => {
    expect(formatPeriod(86_400)).toBe("daily");
    expect(formatPeriod(604_800n)).toBe("weekly");
    expect(formatPeriod(2_592_000n)).toBe("monthly");
    expect(formatPeriod(31_536_000n)).toBe("yearly");
  });

  it("falls back to days, hours and seconds", () => {
    expect(formatPeriod(3n * 86_400n)).toBe("every 3 days");
    expect(formatPeriod(7_200n)).toBe("every 2 hours");
    expect(formatPeriod(90n)).toBe("every 90 seconds");
    expect(formatPeriod(0)).toBe("one-off");
  });
});

describe("shortenAddress", () => {
  it("keeps the ends of long addresses", () => {
    const g = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    expect(shortenAddress(g)).toBe("GBRP...OX2H");
  });

  it("leaves short strings alone", () => {
    expect(shortenAddress("GABC")).toBe("GABC");
  });
});

describe("monthlyEquivalent", () => {
  it("normalises weekly and yearly plans to 30 days", () => {
    expect(monthlyEquivalent(70n, 7n * 86_400n)).toBe(300n);
    expect(monthlyEquivalent(365n, 365n * 86_400n)).toBe(30n);
    expect(monthlyEquivalent(100n, 0n)).toBe(0n);
  });
});
