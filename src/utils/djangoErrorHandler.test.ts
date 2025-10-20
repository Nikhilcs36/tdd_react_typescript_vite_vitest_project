import { describe, it, expect } from "vitest";
import { handleDjangoErrors, DjangoErrorResponse } from "./djangoErrorHandler";

describe("handleDjangoErrors", () => {
  it("should handle field-specific errors with array values", () => {
    const errors: DjangoErrorResponse = {
      username: ["This field is required."],
      password: ["Password is too short."],
    };
    const result = handleDjangoErrors(errors);
    expect(result.fieldErrors).toEqual({
      username: "This field is required.",
      password: "Password is too short.",
    });
    expect(result.nonFieldErrors).toEqual([]);
    expect(result.hasErrors).toBe(true);
  });

  it("should handle field-specific errors with string values", () => {
    const errors: DjangoErrorResponse = {
      email: "Enter a valid email address.",
    };
    const result = handleDjangoErrors(errors);
    expect(result.fieldErrors).toEqual({
      email: "Enter a valid email address.",
    });
    expect(result.nonFieldErrors).toEqual([]);
    expect(result.hasErrors).toBe(true);
  });

  it("should handle non_field_errors", () => {
    const errors: DjangoErrorResponse = {
      non_field_errors: ["Invalid credentials provided."],
    };
    const result = handleDjangoErrors(errors);
    expect(result.fieldErrors).toEqual({});
    expect(result.nonFieldErrors).toEqual(["Invalid credentials provided."]);
    expect(result.hasErrors).toBe(true);
  });

  it("should handle a mix of field-specific and non-field errors", () => {
    const errors: DjangoErrorResponse = {
      username: ["Username already exists."],
      non_field_errors: ["Please correct the errors below."],
    };
    const result = handleDjangoErrors(errors);
    expect(result.fieldErrors).toEqual({
      username: "Username already exists.",
    });
    expect(result.nonFieldErrors).toEqual(["Please correct the errors below."]);
    expect(result.hasErrors).toBe(true);
  });

  it("should apply a translation prefix correctly", () => {
    const errors: DjangoErrorResponse = {
      username: ["required"],
      non_field_errors: ["invalid_credentials"],
    };
    const result = handleDjangoErrors(errors, "login.errors.");
    expect(result.fieldErrors).toEqual({
      username: "login.errors.required",
    });
    expect(result.nonFieldErrors).toEqual(["login.errors.invalid_credentials"]);
    expect(result.hasErrors).toBe(true);
  });

  it("should return an empty result for null or undefined errors", () => {
    const resultForNull = handleDjangoErrors(null as any);
    expect(resultForNull.hasErrors).toBe(false);
    expect(resultForNull.fieldErrors).toEqual({});
    expect(resultForNull.nonFieldErrors).toEqual([]);

    const resultForUndefined = handleDjangoErrors(undefined as any);
    expect(resultForUndefined.hasErrors).toBe(false);
    expect(resultForUndefined.fieldErrors).toEqual({});
    expect(resultForUndefined.nonFieldErrors).toEqual([]);
  });

  it("should return an empty result for an empty error object", () => {
    const result = handleDjangoErrors({});
    expect(result.hasErrors).toBe(false);
    expect(result.fieldErrors).toEqual({});
    expect(result.nonFieldErrors).toEqual([]);
  });
});
