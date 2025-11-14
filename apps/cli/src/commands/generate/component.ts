import * as fs from "fs/promises";
import * as path from "path";
import * as Templates from "@sst-toolkit/plugin-sdk/templates";
import * as Generator from "@sst-toolkit/plugin-sdk/generator";

import type { IGenerateComponentOptions } from "@sst-toolkit/shared/types/cli/commands";

function validateComponentName(name: string): void {
  if (!name || name.trim() === "") {
    throw new Error("Component name cannot be empty");
  }
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    throw new Error("Component name must start with uppercase letter and contain only alphanumeric characters");
  }
}

function validateNamespace(namespace: string): void {
  if (!namespace || namespace.trim() === "") {
    throw new Error("Namespace cannot be empty");
  }
  if (!/^[a-z][a-z0-9-]*$/.test(namespace)) {
    throw new Error("Namespace must start with lowercase letter and contain only lowercase letters, numbers, and hyphens");
  }
}

function getTemplateContent(template: string): string {
  switch (template) {
    case "basic":
      return Templates.Basic.Basic;
    case "aws":
      return Templates.AWS.AWS;
    case "cloudflare":
      return Templates.Cloudflare.Cloudflare;
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

export async function generateComponent(options: IGenerateComponentOptions): Promise<void> {
  const { name, template = "basic", namespace = "example", outputDir = process.cwd() } = options;

  validateComponentName(name);
  validateNamespace(namespace);

  const componentName = name;
  const propsInterfaceName = `I${componentName}Props`;
  const packageName = `@${namespace}/${name.toLowerCase()}`;
  const outputPath = path.join(outputDir, name.toLowerCase());

  await fs.mkdir(outputPath, { recursive: true });
  await fs.mkdir(path.join(outputPath, "src"), { recursive: true });

  const templateContent = getTemplateContent(template);
  const componentCode = Generator.Component.generateComponent({
    componentName,
    namespace,
    template: templateContent,
  });

  const componentPath = path.join(outputPath, "src", `${name.toLowerCase()}.ts`);
  await fs.writeFile(componentPath, componentCode, "utf-8");

  const indexContent = `export * as ${componentName} from "./${name.toLowerCase()}";\n`;
  const indexPath = path.join(outputPath, "src", "index.ts");
  await fs.writeFile(indexPath, indexContent, "utf-8");

  const moduleAugmentation = Generator.ModuleAugmentation.generateModuleAugmentation({
    componentName,
    namespace,
    componentClassName: componentName,
    propsInterfaceName,
    importPath: `./${name.toLowerCase()}`,
  });

  const globalDtsPath = path.join(outputPath, "src", "global.d.ts");
  await fs.writeFile(globalDtsPath, moduleAugmentation, "utf-8");

  const packageJson = Generator.Package.generatePackageJson({
    packageName,
    description: `${componentName} SST component`,
  });

  const packageJsonPath = path.join(outputPath, "package.json");
  await fs.writeFile(packageJsonPath, packageJson, "utf-8");

  const tsconfig = Generator.Tsconfig.generateTsconfig();
  const tsconfigPath = path.join(outputPath, "tsconfig.json");
  await fs.writeFile(tsconfigPath, tsconfig, "utf-8");

  const tsupConfig = Generator.BuildScript.generateTsupConfig();
  const tsupConfigPath = path.join(outputPath, "tsup.config.ts");
  await fs.writeFile(tsupConfigPath, tsupConfig, "utf-8");

  const readmeContent = `# ${componentName}

SST component created with SST Toolkit.

## Usage

\`\`\`typescript
import { ${componentName} } from "${packageName}";

const component = new sst.${namespace}.${componentName}("My${componentName}", {
  // props
});
\`\`\`

## Development

\`\`\`bash
pnpm install
pnpm build
\`\`\`
`;

  const readmePath = path.join(outputPath, "README.md");
  await fs.writeFile(readmePath, readmeContent, "utf-8");
}
