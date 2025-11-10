import { describe, it, expect } from "vitest";
import { validateBeforePublish } from "./validator";

describe("Publishing Validator", () => {
  describe("validateBeforePublish", () => {
    it("should return true", () => {
      expect(validateBeforePublish()).toBe(true);
    });
  });
});

