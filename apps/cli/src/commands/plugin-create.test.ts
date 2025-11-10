import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { createPlugin } from "./plugin-create";

describe("Plugin Create", () => {
  const testDir = path.join(process.cwd(), "test-output");

  beforeEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  it("should create a basic plugin component", async () => {
    await createPlugin({
      name: "TestComponent",
      template: "basic",
      namespace: "test",
      outputDir: testDir,
    });

    const componentPath = path.join(testDir, "testcomponent", "src", "testcomponent.ts");
    const componentExists = await fs
      .access(componentPath)
      .then(() => true)
      .catch(() => false);

    expect(componentExists).toBe(true);
  });

  it("should validate component name", async () => {
    await expect(
      createPlugin({
        name: "invalid-name",
        template: "basic",
        namespace: "test",
        outputDir: testDir,
      })
    ).rejects.toThrow();
  });

  it("should validate namespace", async () => {
    await expect(
      createPlugin({
        name: "TestComponent",
        template: "basic",
        namespace: "Invalid_Namespace",
        outputDir: testDir,
      })
    ).rejects.toThrow();
  });
});

