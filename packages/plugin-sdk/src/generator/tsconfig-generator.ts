export interface ITsconfigGeneratorOptions {
  extends?: string;
}

export function generateTsconfig(options: ITsconfigGeneratorOptions = {}): string {
  const extendsPath = options.extends || "../../tsconfig.base.json";
  
  const tsconfig = {
    extends: extendsPath,
    compilerOptions: {
      outDir: "./dist",
      rootDir: "./src",
    },
    include: ["src/**/*", "src/**/*.d.ts"],
    exclude: ["node_modules", "dist"],
  };

  return JSON.stringify(tsconfig, null, 2);
}

