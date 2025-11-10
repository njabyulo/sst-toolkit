import { describe, it, expect } from "vitest";
import * as Templates from "./index";

describe("Templates", () => {
  it("should export Basic template", () => {
    expect(Templates.Basic).toBeDefined();
    expect(Templates.Basic.Basic).toBeDefined();
    expect(typeof Templates.Basic.Basic).toBe("string");
  });

  it("should export AWS template", () => {
    expect(Templates.AWS).toBeDefined();
    expect(Templates.AWS.AWS).toBeDefined();
    expect(typeof Templates.AWS.AWS).toBe("string");
  });

  it("should export Cloudflare template", () => {
    expect(Templates.Cloudflare).toBeDefined();
    expect(Templates.Cloudflare.Cloudflare).toBeDefined();
    expect(typeof Templates.Cloudflare.Cloudflare).toBe("string");
  });

  it("should have Basic template with SSTComponent", () => {
    expect(Templates.Basic.Basic).toContain("SSTComponent");
    expect(Templates.Basic.Basic).toContain("{{ComponentName}}");
    expect(Templates.Basic.Basic).toContain("{{namespace}}");
  });

  it("should have AWS template with Function and ApiGatewayV2", () => {
    expect(Templates.AWS.AWS).toContain("Function");
    expect(Templates.AWS.AWS).toContain("ApiGatewayV2");
    expect(Templates.AWS.AWS).toContain("DynamoDB");
  });

  it("should have Cloudflare template with Worker", () => {
    expect(Templates.Cloudflare.Cloudflare).toContain("Worker");
  });
});

