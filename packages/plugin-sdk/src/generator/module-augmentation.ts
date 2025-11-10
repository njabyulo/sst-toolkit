export interface IModuleAugmentationOptions {
  componentName: string;
  namespace: string;
  componentClassName: string;
  propsInterfaceName: string;
  importPath: string;
}

export function generateModuleAugmentation(options: IModuleAugmentationOptions): string {
  const { componentName, namespace, componentClassName, propsInterfaceName, importPath } = options;
  
  return `import { ${componentClassName} as ${componentClassName}Class, ${propsInterfaceName} } from "${importPath}";

declare global {
  export namespace sst {
    export namespace ${namespace} {
      export class ${componentName} extends ${componentClassName}Class {}
    }
  }
}

export {};
`;
}

