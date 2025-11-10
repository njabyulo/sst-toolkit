export interface IBuildScriptGeneratorOptions {
  entry?: string[];
}

export function generateTsupConfig(options: IBuildScriptGeneratorOptions = {}): string {
  const entry = options.entry || ["src/index.ts"];
  
  return `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ${JSON.stringify(entry)},
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["@pulumi/pulumi", "sst"],
});
`;
}

