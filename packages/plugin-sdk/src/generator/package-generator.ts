export interface IPackageGeneratorOptions {
  packageName: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
}

export function generatePackageJson(options: IPackageGeneratorOptions): string {
  const {
    packageName,
    version = "1.0.0",
    description = "",
    author = "",
    license = "MIT",
  } = options;

  const packageJson = {
    name: packageName,
    version,
    description,
    main: "./dist/index.js",
    module: "./dist/index.mjs",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.mjs",
        require: "./dist/index.js",
        default: "./dist/index.mjs",
      },
    },
    scripts: {
      build: "tsup",
      lint: "eslint .",
      "lint:fix": "eslint . --fix",
    },
    peerDependencies: {
      sst: "catalog:",
    },
    devDependencies: {
      "@pulumi/pulumi": "catalog:",
      "@sst-toolkit/plugin-sdk": "workspace:*",
      "@sst-toolkit/core": "workspace:*",
      "@sst-toolkit/shared": "workspace:*",
      "sst": "catalog:",
      "tsup": "catalog:",
      "typescript": "catalog:",
      "eslint": "catalog:",
    },
  };

  if (author) {
    Object.assign(packageJson, { author });
  }

  if (license) {
    Object.assign(packageJson, { license });
  }

  return JSON.stringify(packageJson, null, 2);
}

