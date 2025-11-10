import { describe, it, expect } from "vitest";
import { generateModuleAugmentation } from "./module-augmentation";

describe("Module Augmentation Generator", () => {
  it("should generate module augmentation with correct namespace", () => {
    const code = generateModuleAugmentation({
      componentName: "MyComponent",
      namespace: "example",
      componentClassName: "MyComponentClass",
      propsInterfaceName: "IMyComponentProps",
      importPath: "./mycomponent",
    });

    expect(code).toContain("export namespace sst");
    expect(code).toContain("export namespace example");
    expect(code).toContain("export class MyComponent");
    expect(code).toContain("MyComponentClass");
    expect(code).toContain("IMyComponentProps");
    expect(code).toContain('from "./mycomponent"');
  });

  it("should use correct component name", () => {
    const code = generateModuleAugmentation({
      componentName: "TestComponent",
      namespace: "mycompany",
      componentClassName: "TestComponentClass",
      propsInterfaceName: "ITestComponentProps",
      importPath: "./testcomponent",
    });

    expect(code).toContain("TestComponent");
    expect(code).toContain("TestComponentClass");
    expect(code).toContain("ITestComponentProps");
    expect(code).toContain("mycompany");
  });
});

