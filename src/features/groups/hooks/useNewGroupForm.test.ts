import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  MAX_GROUP_DESCRIPTION_LENGTH as BACKEND_MAX_DESCRIPTION,
  MAX_GROUP_NAME_LENGTH as BACKEND_MAX_NAME,
} from "../../../../convex/groups";
import {
  CREATE_ERROR_ALERT,
  DESCRIPTION_TOO_LONG_MESSAGE,
  getNewGroupErrors,
  MAX_GROUP_DESCRIPTION_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  NAME_REQUIRED_MESSAGE,
  NAME_TOO_LONG_MESSAGE,
  parseNewGroupFields,
} from "./useNewGroupForm";

describe("parseNewGroupFields", () => {
  it("trims the name and description and builds the create arguments", () => {
    const result = parseNewGroupFields({ name: "  Viatge a Roma  ", description: " Estiu 2027 " });

    expect(result.errors).toEqual({});
    expect(result.args).toEqual({ name: "Viatge a Roma", description: "Estiu 2027" });
  });

  it("accepts an empty description and sends it as an empty string", () => {
    const result = parseNewGroupFields({ name: "Pis", description: "   " });

    expect(result.args).toEqual({ name: "Pis", description: "" });
  });

  it("requires a name that is not only spaces", () => {
    const result = parseNewGroupFields({ name: "   ", description: "" });

    expect(result.args).toBeNull();
    expect(result.errors.name).toBe(NAME_REQUIRED_MESSAGE);
  });

  it("accepts a name of exactly 80 characters and rejects 81", () => {
    const atLimit = parseNewGroupFields({ name: "a".repeat(MAX_GROUP_NAME_LENGTH), description: "" });
    const overLimit = parseNewGroupFields({
      name: "a".repeat(MAX_GROUP_NAME_LENGTH + 1),
      description: "",
    });

    expect(atLimit.args).not.toBeNull();
    expect(overLimit.args).toBeNull();
    expect(overLimit.errors.name).toBe(NAME_TOO_LONG_MESSAGE);
  });

  it("accepts a description of exactly 200 characters and rejects 201", () => {
    const atLimit = parseNewGroupFields({
      name: "Pis",
      description: "a".repeat(MAX_GROUP_DESCRIPTION_LENGTH),
    });
    const overLimit = parseNewGroupFields({
      name: "Pis",
      description: "a".repeat(MAX_GROUP_DESCRIPTION_LENGTH + 1),
    });

    expect(atLimit.args).not.toBeNull();
    expect(overLimit.args).toBeNull();
    expect(overLimit.errors.description).toBe(DESCRIPTION_TOO_LONG_MESSAGE);
  });

  it("reports both errors at once", () => {
    const result = parseNewGroupFields({
      name: "",
      description: "a".repeat(MAX_GROUP_DESCRIPTION_LENGTH + 1),
    });

    expect(result.errors).toEqual({
      name: NAME_REQUIRED_MESSAGE,
      description: DESCRIPTION_TOO_LONG_MESSAGE,
    });
  });

  it("uses the same limits as the backend", () => {
    expect(MAX_GROUP_NAME_LENGTH).toBe(BACKEND_MAX_NAME);
    expect(MAX_GROUP_DESCRIPTION_LENGTH).toBe(BACKEND_MAX_DESCRIPTION);
  });
});

describe("getNewGroupErrors", () => {
  it("shows a backend name error under the name field", () => {
    const error = new ConvexError({ code: "INVALID_NAME", message: NAME_TOO_LONG_MESSAGE });

    expect(getNewGroupErrors(error)).toEqual({ fieldErrors: { name: NAME_TOO_LONG_MESSAGE } });
  });

  it("shows a backend description error under the description field", () => {
    const error = new ConvexError({
      code: "INVALID_DESCRIPTION",
      message: DESCRIPTION_TOO_LONG_MESSAGE,
    });

    expect(getNewGroupErrors(error)).toEqual({
      fieldErrors: { description: DESCRIPTION_TOO_LONG_MESSAGE },
    });
  });

  it("shows a general alert for any other error", () => {
    const codeClash = new ConvexError({ code: "CODE_GENERATION_FAILED", message: "..." });

    expect(getNewGroupErrors(codeClash)).toEqual({ fieldErrors: {}, alert: CREATE_ERROR_ALERT });
    expect(getNewGroupErrors(new Error("network"))).toEqual({
      fieldErrors: {},
      alert: CREATE_ERROR_ALERT,
    });
  });
});
