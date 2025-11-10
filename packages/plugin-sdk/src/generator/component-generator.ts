export interface IComponentGeneratorOptions {
  componentName: string;
  namespace: string;
  template: string;
}

export function generateComponent(options: IComponentGeneratorOptions): string {
  const { componentName, namespace, template } = options;
  
  return template
    .replace(/\{\{ComponentName\}\}/g, componentName)
    .replace(/\{\{namespace\}\}/g, namespace);
}

