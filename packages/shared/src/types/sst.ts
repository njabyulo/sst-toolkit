export interface ISSTResource {
  urn: string;
  custom: boolean;
  type: string;
  parent?: string;
  outputs?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  id?: string;
  created?: string;
  modified?: string;
  sourcePosition?: string;
}

export interface IPendingOperation {
  resource: ISSTResource;
  type: string;
}

export interface ISSTState {
  stack: string;
  latest: {
    manifest: {
      time: string;
      magic: string;
      version: string;
    };
    secrets_providers: {
      type: string;
      state: {
        salt: string;
      };
    };
    resources: ISSTResource[];
    pending_operations?: IPendingOperation[];
  };
}

export interface IResourceNode {
  resource: ISSTResource;
  children: IResourceNode[];
}

export interface IResourceGroup {
  parentUrn: string | null;
  parentResource: ISSTResource | null;
  resources: ISSTResource[];
}

