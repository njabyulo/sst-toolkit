/**
 * Compute Resource Finder
 * Finds Lambda functions and event source mappings
 */

import { findResourcesByTags } from "../../resources/base.js";
import type { IResourceFinder } from "../../resources/interfaces.js";
import type { IFinderOptions } from "../../resources/types.js";

export class ComputeResourceFinder implements IResourceFinder {
  async find(options: IFinderOptions) {
    return findResourcesByTags(options, "lambda");
  }
}

export const findComputeResources = async (options: IFinderOptions = {}) => {
  const finder = new ComputeResourceFinder();
  return finder.find(options);
};

