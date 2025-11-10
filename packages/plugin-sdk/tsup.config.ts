import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/types/index.ts", "src/hooks/index.ts", "src/component/index.ts", "src/resources/index.ts", "src/templates/index.ts", "src/generator/index.ts", "src/test-utils/index.ts", "src/publishing/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["@pulumi/pulumi", "sst"],
});

