# SST Toolkit - Implementation Tasks

> **Actionable tasks for implementing the architecture improvements**

## Overview

This document tracks all tasks needed to implement the architecture improvements outlined in [ARCHITECTURE_IMPROVEMENT_PLAN.md](./ARCHITECTURE_IMPROVEMENT_PLAN.md).

**Status Legend**:
- ⏳ **Pending** - Not started
- 🚧 **In Progress** - Currently working on
- ✅ **Completed** - Finished
- ❌ **Blocked** - Cannot proceed (blocker noted)
- 🔄 **Review** - Needs review

## Phase 1: Consolidate Core (Week 1)

**Goal**: Eliminate code duplication and establish single source of truth

### Tasks

- [ ] ⏳ **Move state parsing from `packages/shared` to `packages/core`**
  - [ ] Move `packages/shared/src/utils/state.ts` → `packages/core/src/state/state.ts`
  - [ ] Update `packages/core/src/state/index.ts` to export state utilities
  - [ ] Update all imports across codebase
  - [ ] Remove state utilities from `packages/shared`
  - [ ] Update `packages/shared/src/utils/index.ts`

- [ ] ⏳ **Move relationship detection from `packages/shared` to `packages/core`**
  - [ ] Move `packages/shared/src/utils/relationships.ts` → `packages/core/src/relationships/relationships.ts`
  - [ ] Update `packages/core/src/relationships/index.ts` to export relationship utilities
  - [ ] Update all imports across codebase
  - [ ] Remove relationship utilities from `packages/shared`
  - [ ] Update `packages/shared/src/utils/index.ts`

- [ ] ⏳ **Move workflow building from `packages/shared` to `packages/core`**
  - [ ] Move `packages/shared/src/utils/workflow.ts` → `packages/core/src/workflow/workflow.ts`
  - [ ] Update `packages/core/src/workflow/index.ts` to export workflow utilities
  - [ ] Update all imports across codebase
  - [ ] Remove workflow utilities from `packages/shared`
  - [ ] Update `packages/shared/src/utils/index.ts`

- [ ] ⏳ **Remove duplicate code from `apps/explorer`**
  - [ ] Remove `apps/explorer/src/lib/state-parser.ts` (use `@sst-toolkit/core`)
  - [ ] Remove `apps/explorer/src/lib/relationship-parser.ts` (use `@sst-toolkit/core`)
  - [ ] Remove `apps/explorer/src/lib/workflow-builder.ts` (use `@sst-toolkit/core`)
  - [ ] Update `apps/explorer/src/App.tsx` imports
  - [ ] Update `apps/explorer/src/components/workflow/WorkflowCanvas.tsx` imports

- [ ] ⏳ **Update all imports across codebase**
  - [ ] Update `apps/explorer` imports
  - [ ] Update `apps/cli` imports
  - [ ] Update `packages/core` imports
  - [ ] Update `packages/plugin-sdk` imports
  - [ ] Verify no broken imports

- [ ] ⏳ **Update package.json dependencies**
  - [ ] Remove `@sst-toolkit/shared` dependency from packages that now use `@sst-toolkit/core`
  - [ ] Add `@sst-toolkit/core` dependency where needed
  - [ ] Update `packages/shared/package.json` to remove moved utilities
  - [ ] Update `packages/core/package.json` to include new utilities

- [ ] ⏳ **Update exports in `packages/core/src/index.ts`**
  - [ ] Export state utilities: `export * as State from './state'`
  - [ ] Export relationship utilities: `export * as Relationships from './relationships'`
  - [ ] Export workflow utilities: `export * as Workflow from './workflow'`

- [ ] ⏳ **Test and verify**
  - [ ] Run `pnpm build` to verify no build errors
  - [ ] Run `pnpm lint` to verify no linting errors
  - [ ] Run `pnpm type-check` to verify no type errors
  - [ ] Test explorer app still works
  - [ ] Test CLI still works

### Deliverables

- ✅ Single source of truth for core utilities
- ✅ No code duplication
- ✅ All apps use `@sst-toolkit/core` utilities
- ✅ Clean imports across codebase

---

## Phase 2: Adapter Layer (Week 2)

**Goal**: Create adapter layer for extending SST components

### Tasks

- [ ] ⏳ **Create `ComponentAdapter` base class**
  - [ ] Create `packages/core/src/adapters/component.ts`
  - [ ] Import `Component` from `sst/components/component`
  - [ ] Extend `Component` class
  - [ ] Handle Pulumi type setting in constructor
  - [ ] Set static `__pulumiType` property automatically
  - [ ] Add TypeScript types and interfaces
  - [ ] Write JSDoc documentation
  - [ ] Add unit tests

- [ ] ⏳ **Create `SSTComponent` helper class**
  - [ ] Create `packages/plugin-sdk/src/component/sst-component.ts`
  - [ ] Import `ComponentAdapter` from `@sst-toolkit/core`
  - [ ] Import `Link` from `sst/components/link`
  - [ ] Extend `ComponentAdapter`
  - [ ] Implement `Link.Linkable` interface
  - [ ] Add abstract `getLinkProperties()` method
  - [ ] Add TypeScript types and interfaces
  - [ ] Write JSDoc documentation
  - [ ] Add unit tests

- [ ] ⏳ **Create validation utilities**
  - [ ] Create `packages/core/src/adapters/validator.ts`
  - [ ] Add `validatePulumiType()` function
    - [ ] Check format: `sst:namespace:Type`
    - [ ] Validate namespace is not empty
    - [ ] Validate type is not empty
  - [ ] Add `validateParent()` function
    - [ ] Check child resources have `{ parent: this }`
  - [ ] Add `validateOutputs()` function
    - [ ] Verify outputs are registered
  - [ ] Add `validateLinkable()` function
    - [ ] Verify `Link.Linkable` implementation
    - [ ] Check `getSSTLink()` method exists
  - [ ] Add comprehensive validation function
  - [ ] Write JSDoc documentation
  - [ ] Add unit tests

- [ ] ⏳ **Create adapter index exports**
  - [ ] Create `packages/core/src/adapters/index.ts`
  - [ ] Export `ComponentAdapter`
  - [ ] Export validation utilities
  - [ ] Update `packages/core/src/index.ts` to export adapters

- [ ] ⏳ **Create plugin-sdk component exports**
  - [ ] Update `packages/plugin-sdk/src/component/index.ts`
  - [ ] Export `SSTComponent`
  - [ ] Update `packages/plugin-sdk/src/index.ts` to export component

- [ ] ⏳ **Add peer dependencies**
  - [ ] Update `packages/core/package.json` to include `sst` as peer dependency
  - [ ] Update `packages/plugin-sdk/package.json` to include `sst` as peer dependency
  - [ ] Update `packages/plugin-sdk/package.json` to include `@sst-toolkit/core` as dependency

- [ ] ⏳ **Create example component**
  - [ ] Create `examples/custom-component/src/my-component.ts`
  - [ ] Use `SSTComponent` base class
  - [ ] Implement example component
  - [ ] Create `examples/custom-component/sst.config.ts`
  - [ ] Test component works with SST

- [ ] ⏳ **Test and verify**
  - [ ] Run `pnpm build` to verify no build errors
  - [ ] Run `pnpm lint` to verify no linting errors
  - [ ] Run `pnpm type-check` to verify no type errors
  - [ ] Test `ComponentAdapter` works
  - [ ] Test `SSTComponent` works
  - [ ] Test validation utilities
  - [ ] Test example component

### Deliverables

- ✅ `ComponentAdapter` base class (handles SST requirements)
- ✅ `SSTComponent` helper class (simplifies component creation)
- ✅ Validation utilities (catch common mistakes)
- ✅ Type definitions and interfaces
- ✅ Example component demonstrating usage

---

## Phase 3: Plugin SDK Enhancement (Week 3)

**Goal**: Create component generator and templates

### Tasks

- [ ] ⏳ **Create component templates**
  - [ ] Create `packages/plugin-sdk/src/templates/aws.ts`
    - [ ] Template with ApiGatewayV2, Function, DynamoDB
    - [ ] Include Link.Linkable implementation
    - [ ] Include proper parent setting
    - [ ] Include output registration
  - [ ] Create `packages/plugin-sdk/src/templates/cloudflare.ts`
    - [ ] Template with Worker, KV, D1
    - [ ] Include Link.Linkable implementation
    - [ ] Include proper parent setting
    - [ ] Include output registration
  - [ ] Create `packages/plugin-sdk/src/templates/basic.ts`
    - [ ] Minimal template structure
    - [ ] Basic component skeleton
    - [ ] Include all required patterns

- [ ] ⏳ **Create component generator**
  - [ ] Create `packages/plugin-sdk/src/generator/component-generator.ts`
    - [ ] Function to generate component class from template
    - [ ] Replace template variables with actual values
    - [ ] Generate TypeScript code
  - [ ] Create `packages/plugin-sdk/src/generator/module-augmentation.ts`
    - [ ] Function to generate `global.d.ts` file
    - [ ] Generate module augmentation code
    - [ ] Include proper imports
  - [ ] Create `packages/plugin-sdk/src/generator/package-generator.ts`
    - [ ] Function to generate `package.json`
    - [ ] Include correct peer dependencies
    - [ ] Include correct dev dependencies
    - [ ] Include build scripts
  - [ ] Create `packages/plugin-sdk/src/generator/tsconfig-generator.ts`
    - [ ] Function to generate `tsconfig.json`
    - [ ] Include proper TypeScript configuration
    - [ ] Include module augmentation includes
  - [ ] Create `packages/plugin-sdk/src/generator/build-script-generator.ts`
    - [ ] Function to generate build scripts
    - [ ] Include tsup configuration
    - [ ] Include type generation

- [ ] ⏳ **Create generator CLI command**
  - [ ] Create `apps/cli/src/commands/plugin-create.ts`
  - [ ] Parse command arguments (name, template, namespace)
  - [ ] Validate component name
  - [ ] Validate template exists
  - [ ] Generate component files
  - [ ] Generate module augmentation
  - [ ] Generate package.json
  - [ ] Generate tsconfig.json
  - [ ] Generate build scripts
  - [ ] Create directory structure
  - [ ] Write files to disk
  - [ ] Print success message

- [ ] ⏳ **Add testing utilities**
  - [ ] Create `packages/plugin-sdk/src/test-utils/validator.ts`
    - [ ] Component validator
    - [ ] Integration with validation utilities
  - [ ] Create `packages/plugin-sdk/src/test-utils/mock-sst.ts`
    - [ ] Mock SST environment
    - [ ] Mock Component class
    - [ ] Mock Link interface
  - [ ] Create `packages/plugin-sdk/src/test-utils/test-helpers.ts`
    - [ ] Test helper functions
    - [ ] Component testing utilities

- [ ] ⏳ **Add publishing helpers**
  - [ ] Create `packages/plugin-sdk/src/publishing/validator.ts`
    - [ ] Validate before publish
    - [ ] Check all requirements met
  - [ ] Create `packages/plugin-sdk/src/publishing/changelog.ts`
    - [ ] Generate changelog
    - [ ] Version management
  - [ ] Create `packages/plugin-sdk/src/publishing/publisher.ts`
    - [ ] Publishing utilities
    - [ ] npm publish helpers

- [ ] ⏳ **Create generator index exports**
  - [ ] Create `packages/plugin-sdk/src/generator/index.ts`
  - [ ] Export all generator functions
  - [ ] Update `packages/plugin-sdk/src/index.ts` to export generators

- [ ] ⏳ **Test and verify**
  - [ ] Test component generator creates valid component
  - [ ] Test module augmentation generator creates valid file
  - [ ] Test package.json generator creates valid package.json
  - [ ] Test CLI command works end-to-end
  - [ ] Test generated component works with SST
  - [ ] Test module augmentation works
  - [ ] Run `pnpm build` to verify no build errors
  - [ ] Run `pnpm lint` to verify no linting errors
  - [ ] Run `pnpm type-check` to verify no type errors

### Deliverables

- ✅ Component templates (AWS, Cloudflare, basic)
- ✅ Component generator CLI
- ✅ Module augmentation generator
- ✅ Package.json generator
- ✅ Testing utilities
- ✅ Publishing helpers
- ✅ Working CLI command: `sst-toolkit plugin create`

---

## Phase 4: CLI Enhancement (Week 4)

**Goal**: Complete CLI toolset for plugin management

### Tasks

- [ ] ⏳ **Add plugin management commands**
  - [ ] Create `apps/cli/src/commands/plugin-list.ts`
    - [ ] List installed plugins
    - [ ] Show plugin information
  - [ ] Create `apps/cli/src/commands/plugin-install.ts`
    - [ ] Install plugin from npm
    - [ ] Install plugin from GitHub
    - [ ] Install plugin from local path
  - [ ] Create `apps/cli/src/commands/plugin-remove.ts`
    - [ ] Remove installed plugin
    - [ ] Clean up dependencies
  - [ ] Create `apps/cli/src/commands/plugin-test.ts`
    - [ ] Test plugin locally
    - [ ] Run validation
    - [ ] Run tests
  - [ ] Create `apps/cli/src/commands/plugin-publish.ts`
    - [ ] Validate before publish
    - [ ] Build plugin
    - [ ] Publish to npm
    - [ ] Update registry

- [ ] ⏳ **Enhance state exploration commands**
  - [ ] Update `apps/cli/src/commands/explore.ts`
    - [ ] Add plugin information display
    - [ ] Show installed plugins
    - [ ] Show plugin dependencies
  - [ ] Create `apps/cli/src/commands/visualize.ts`
    - [ ] Generate visualization
    - [ ] Export to image
    - [ ] Export to JSON

- [ ] ⏳ **Add component generation commands**
  - [ ] Create `apps/cli/src/commands/generate-component.ts`
    - [ ] Generate component from template
    - [ ] Interactive prompts
    - [ ] Validation
  - [ ] Create `apps/cli/src/commands/generate-adapter.ts`
    - [ ] Generate adapter from template
    - [ ] Interactive prompts
    - [ ] Validation

- [ ] ⏳ **Add plugin discovery**
  - [ ] Create `apps/cli/src/commands/plugin-search.ts`
    - [ ] Search plugin registry
    - [ ] Show plugin information
    - [ ] Show plugin ratings
  - [ ] Create `apps/cli/src/commands/plugin-browse.ts`
    - [ ] Browse plugin marketplace
    - [ ] Filter by category
    - [ ] Show popular plugins

- [ ] ⏳ **Update CLI main command**
  - [ ] Update `apps/cli/src/index.ts`
    - [ ] Add plugin subcommands
    - [ ] Add generate subcommands
    - [ ] Add explore subcommands
    - [ ] Add help text
    - [ ] Add error handling

- [ ] ⏳ **Add CLI utilities**
  - [ ] Create `apps/cli/src/utils/plugin-loader.ts`
    - [ ] Load plugin from path
    - [ ] Load plugin from npm
    - [ ] Validate plugin structure
  - [ ] Create `apps/cli/src/utils/registry.ts`
    - [ ] Plugin registry client
    - [ ] Search plugins
    - [ ] Get plugin info

- [ ] ⏳ **Test and verify**
  - [ ] Test all CLI commands work
  - [ ] Test plugin create command
  - [ ] Test plugin list command
  - [ ] Test plugin install command
  - [ ] Test plugin test command
  - [ ] Test plugin publish command
  - [ ] Test explore command
  - [ ] Test generate commands
  - [ ] Run `pnpm build` to verify no build errors
  - [ ] Run `pnpm lint` to verify no linting errors
  - [ ] Run `pnpm type-check` to verify no type errors

### Deliverables

- ✅ Complete CLI toolset
- ✅ Plugin management commands
- ✅ Component generation commands
- ✅ Plugin discovery commands
- ✅ State exploration commands
- ✅ Working CLI: `sst-toolkit plugin create/test/publish/list/install`

---

## Phase 5: Explorer Integration (Week 5)

**Goal**: Integrate explorer with core and add plugin marketplace

### Tasks

- [ ] ⏳ **Integrate explorer with core**
  - [ ] Update `apps/explorer/src/App.tsx` to use `@sst-toolkit/core`
  - [ ] Update `apps/explorer/src/components/workflow/WorkflowCanvas.tsx` to use `@sst-toolkit/core`
  - [ ] Remove all duplicate code
  - [ ] Verify explorer still works
  - [ ] Test all explorer features

- [ ] ⏳ **Add plugin marketplace browser**
  - [ ] Create `apps/explorer/src/components/plugin/PluginMarketplace.tsx`
    - [ ] Display available plugins
    - [ ] Search and filter plugins
    - [ ] Show plugin information
    - [ ] Install plugin button
  - [ ] Create `apps/explorer/src/components/plugin/PluginCard.tsx`
    - [ ] Display plugin card
    - [ ] Show plugin metadata
    - [ ] Show install button
  - [ ] Create `apps/explorer/src/components/plugin/PluginDetail.tsx`
    - [ ] Display plugin details
    - [ ] Show plugin documentation
    - [ ] Show plugin dependencies
  - [ ] Add plugin marketplace tab to explorer

- [ ] ⏳ **Show installed plugins**
  - [ ] Create `apps/explorer/src/components/plugin/InstalledPlugins.tsx`
    - [ ] List installed plugins
    - [ ] Show plugin status
    - [ ] Show plugin version
  - [ ] Create `apps/explorer/src/lib/plugin-loader.ts`
    - [ ] Load installed plugins
    - [ ] Parse plugin metadata
    - [ ] Validate plugins
  - [ ] Add installed plugins section to explorer

- [ ] ⏳ **Visualize plugin dependencies**
  - [ ] Create `apps/explorer/src/components/plugin/PluginDependencies.tsx`
    - [ ] Display plugin dependency graph
    - [ ] Show dependency relationships
    - [ ] Visualize dependency tree
  - [ ] Integrate with workflow canvas
    - [ ] Show plugins in workflow
    - [ ] Show plugin dependencies in workflow
    - [ ] Visualize plugin relationships

- [ ] ⏳ **Add plugin management UI**
  - [ ] Create `apps/explorer/src/components/plugin/PluginManager.tsx`
    - [ ] Install plugin UI
    - [ ] Remove plugin UI
    - [ ] Update plugin UI
  - [ ] Add plugin management actions
    - [ ] Install plugin
    - [ ] Remove plugin
    - [ ] Update plugin

- [ ] ⏳ **Update explorer navigation**
  - [ ] Add "Plugins" tab to explorer
  - [ ] Add plugin marketplace to navigation
  - [ ] Add installed plugins to navigation
  - [ ] Update routing

- [ ] ⏳ **Test and verify**
  - [ ] Test explorer still works
  - [ ] Test plugin marketplace displays correctly
  - [ ] Test installed plugins display correctly
  - [ ] Test plugin dependencies visualization
  - [ ] Test plugin management UI
  - [ ] Test all explorer features
  - [ ] Run `pnpm build` to verify no build errors
  - [ ] Run `pnpm lint` to verify no linting errors
  - [ ] Run `pnpm type-check` to verify no type errors

### Deliverables

- ✅ Integrated explorer (uses `@sst-toolkit/core`)
- ✅ Plugin marketplace UI
- ✅ Installed plugins display
- ✅ Plugin dependencies visualization
- ✅ Plugin management UI
- ✅ All explorer features working

---

## Additional Tasks

### Documentation

- [ ] ⏳ **Update README.md**
  - [ ] Add plugin creation guide
  - [ ] Add component extension guide
  - [ ] Update architecture section
  - [ ] Add examples

- [ ] ⏳ **Create plugin development guide**
  - [ ] Create `docs/plugins/creating-plugins.md`
  - [ ] Create `docs/plugins/plugin-api.md`
  - [ ] Create `docs/plugins/examples.md`
  - [ ] Create `docs/plugins/best-practices.md`

- [ ] ⏳ **Create component development guide**
  - [ ] Create `docs/components/creating-components.md`
  - [ ] Create `docs/components/component-api.md`
  - [ ] Create `docs/components/examples.md`
  - [ ] Create `docs/components/best-practices.md`

- [ ] ⏳ **Update API documentation**
  - [ ] Document `ComponentAdapter` API
  - [ ] Document `SSTComponent` API
  - [ ] Document validation utilities
  - [ ] Document generator utilities

### Testing

- [ ] ⏳ **Add unit tests**
  - [ ] Test `ComponentAdapter`
  - [ ] Test `SSTComponent`
  - [ ] Test validation utilities
  - [ ] Test generator utilities
  - [ ] Test CLI commands

- [ ] ⏳ **Add integration tests**
  - [ ] Test component creation end-to-end
  - [ ] Test plugin generation end-to-end
  - [ ] Test explorer integration
  - [ ] Test CLI integration

- [ ] ⏳ **Add E2E tests**
  - [ ] Test plugin create workflow
  - [ ] Test plugin publish workflow
  - [ ] Test explorer plugin display
  - [ ] Test component usage in SST

### Infrastructure

- [ ] ⏳ **Set up CI/CD**
  - [ ] Add GitHub Actions workflows
  - [ ] Add build pipeline
  - [ ] Add test pipeline
  - [ ] Add publish pipeline

- [ ] ⏳ **Set up testing infrastructure**
  - [ ] Configure Vitest
  - [ ] Configure test coverage
  - [ ] Add test utilities

- [ ] ⏳ **Set up plugin registry**
  - [ ] Create plugin registry structure
  - [ ] Create plugin registry API
  - [ ] Create plugin registry UI

---

## Quick Reference

### Priority Order

1. **Phase 1** - Consolidate Core (Foundation)
2. **Phase 2** - Adapter Layer (Core functionality)
3. **Phase 3** - Plugin SDK Enhancement (Developer experience)
4. **Phase 4** - CLI Enhancement (Developer tools)
5. **Phase 5** - Explorer Integration (User experience)

### Key Files to Create

1. `packages/core/src/adapters/component.ts` - ComponentAdapter base class
2. `packages/plugin-sdk/src/component/sst-component.ts` - SSTComponent helper
3. `packages/core/src/adapters/validator.ts` - Validation utilities
4. `packages/plugin-sdk/src/generator/component-generator.ts` - Component generator
5. `packages/plugin-sdk/src/generator/module-augmentation.ts` - Module augmentation generator
6. `apps/cli/src/commands/plugin-create.ts` - Plugin create command

### Key Files to Update

1. `packages/core/src/index.ts` - Export adapters
2. `packages/plugin-sdk/src/index.ts` - Export component and generators
3. `apps/explorer/src/App.tsx` - Use `@sst-toolkit/core`
4. `apps/cli/src/index.ts` - Add plugin commands

---

## Progress Tracking

**Last Updated**: 2024-01-XX

**Overall Progress**: 0% (0/150+ tasks completed)

**Phase Progress**:
- Phase 1: 0% (0/8 tasks)
- Phase 2: 0% (0/8 tasks)
- Phase 3: 0% (0/8 tasks)
- Phase 4: 0% (0/8 tasks)
- Phase 5: 0% (0/6 tasks)
- Additional: 0% (0/12 tasks)

---

**Let's build the best 3rd party toolkit for SST! 🚀**

