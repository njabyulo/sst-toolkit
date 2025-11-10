import { describe, it, expect } from "vitest";
import { generatePackageJson } from "./package-generator";

describe("Package Generator", () => {
  it("should generate package.json with correct name", () => {
    const pkg = generatePackageJson({
      packageName: "@example/mycomponent",
    });

    expect(pkg).toContain('"name": "@example/mycomponent"');
  });

  it("should generate package.json with correct exports", () => {
    const pkg = generatePackageJson({
      packageName: "@example/mycomponent",
    });

    expect(pkg).toContain('"exports"');
    expect(pkg).toContain('"./dist/index.js"');
  });

  it("should include peerDependencies", () => {
    const pkg = generatePackageJson({
      packageName: "@example/mycomponent",
    });

    expect(pkg).toContain('"peerDependencies"');
    expect(pkg).toContain('"sst"');
  });

  it("should use default version when not provided", () => {
    const pkg = generatePackageJson({
      packageName: "@example/mycomponent",
    });

    expect(pkg).toContain('"version": "1.0.0"');
  });

  it("should use custom version when provided", () => {
    const pkg = generatePackageJson({
      packageName: "@example/mycomponent",
      version: "2.0.0",
    });

    expect(pkg).toContain('"version": "2.0.0"');
  });
});

