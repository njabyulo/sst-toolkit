/**
 * SST Resource type based on Pulumi state file structure.
 * 
 * Note: SST does not export TypeScript types for the state.json structure.
 * This type is derived from the actual Pulumi state file format that SST uses.
 * The state.json is a Pulumi state file, and SST doesn't provide official types for it.
 * 
 * @see https://www.pulumi.com/docs/concepts/state/ for Pulumi state structure
 */
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
  /** Provider URN for the resource */
  provider?: string;
  /** Resource dependencies (array of URNs) */
  dependencies?: string[];
  /** Property-level dependencies mapping property names to dependent URNs */
  propertyDependencies?: Record<string, string[]>;
}

export interface IPendingOperation {
  resource: ISSTResource;
  type: string;
}

/**
 * SST State type based on Pulumi state file structure.
 * 
 * Note: SST does not export TypeScript types for the state.json structure.
 * This type is derived from the actual Pulumi state file format that SST uses.
 * The state.json is a Pulumi state file, and SST doesn't provide official types for it.
 * 
 * @see https://www.pulumi.com/docs/concepts/state/ for Pulumi state structure
 */
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
    /** Additional metadata (optional, structure varies) */
    metadata?: Record<string, unknown>;
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

