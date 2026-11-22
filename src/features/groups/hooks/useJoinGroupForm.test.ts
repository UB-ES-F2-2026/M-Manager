import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { INVALID_GROUP_CODE_MESSAGE } from "../../../../convex/lib/groupCodes";
import { getJoinGroupErrors, JOIN_ERROR_ALERT, parseJoinCode } from "./useJoinGroupForm";

describe("parseJoinCode", () => {
  it("accepts a valid code", () => {
    expect(parseJoinCode("K7M2QX")).toEqual({ code: "K7M2QX" });
  });

  it("trims spaces and uppercases what the user typed or pasted", () => {
    expect(parseJoinCode("  k7m2qx ")).toEqual({ code: "K7M2QX" });
  });

  it("rejects an empty code", () => {
    expect(parseJoinCode("   ")).toEqual({ code: null, error: INVALID_GROUP_CODE_MESSAGE });
  });

  it("rejects codes with the wrong length", () => {
    expect(parseJoinCode("K7M2Q").code).toBeNull();
    expect(parseJoinCode("K7M2QXA").code).toBeNull();
  });

  it("rejects the look-alike characters that codes never use", () => {
    expect(parseJoinCode("K7M2Q0").code).toBeNull();
    expect(parseJoinCode("K7M2QO").code).toBeNull();
    expect(parseJoinCode("K7M2Q1").code).toBeNull();
    expect(parseJoinCode("K7M2QI").code).toBeNull();
  });
});

describe("getJoinGroupErrors", () => {
  it("shows an unknown code under the field", () => {
    const error = new ConvexError({ code: "INVALID_CODE", message: INVALID_GROUP_CODE_MESSAGE });

    expect(getJoinGroupErrors(error)).toEqual({ codeError: INVALID_GROUP_CODE_MESSAGE });
  });

  it("shows a general alert for any other error", () => {
    const unauthenticated = new ConvexError({ code: "UNAUTHENTICATED", message: "..." });

    expect(getJoinGroupErrors(unauthenticated)).toEqual({ alert: JOIN_ERROR_ALERT });
    expect(getJoinGroupErrors(new Error("network"))).toEqual({ alert: JOIN_ERROR_ALERT });
  });
});
