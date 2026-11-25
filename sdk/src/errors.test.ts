import { describe, expect, it } from "vitest";
import { CONTRACT_ERRORS, contractErrorCode } from "./errors";

describe("CONTRACT_ERRORS", () => {
  it("covers codes 1 to 20 with no gaps", () => {
    expect(Object.keys(CONTRACT_ERRORS).map(Number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("keeps the names the contract uses", () => {
    expect(CONTRACT_ERRORS[6].name).toBe("PlanInactive");
    expect(CONTRACT_ERRORS[17].name).toBe("InsufficientAllowance");
    expect(CONTRACT_ERRORS[20].name).toBe("SamePlan");
  });
});

describe("contractErrorCode", () => {
  it("finds the code in a host error message", () => {
    expect(contractErrorCode("HostError: Error(Contract, #6)\n\nEvent log: ...")).toBe(6);
    expect(contractErrorCode("Error(Contract, #17)")).toBe(17);
  });

  it("returns null for other errors and unknown codes", () => {
    expect(contractErrorCode("Error(WasmVm, InvalidAction)")).toBeNull();
    expect(contractErrorCode("Error(Contract, #99)")).toBeNull();
    expect(contractErrorCode("network down")).toBeNull();
  });
});
