# Exploring Infrastructure

This guide explains how to use the CLI and Explorer to explore and visualize your SST infrastructure.

## CLI Commands

### Explore State

Explore your SST state file:

```bash
# Basic exploration
pnpm sst-toolkit explore .sst/state.json

# Output:
# Found 42 resources
# Found 38 relationships
```

### Visualize Workflow

Generate a workflow visualization:

```bash
# Export to JSON
pnpm sst-toolkit visualize .sst/state.json --format json --output workflow.json

# Export to image (future)
pnpm sst-toolkit visualize .sst/state.json --format image --output workflow.png
```

### Plugin Management

```bash
# List installed plugins
pnpm sst-toolkit plugin list

# Install a plugin
pnpm sst-toolkit plugin install @mycompany/my-plugin

# Remove a plugin
pnpm sst-toolkit plugin remove @mycompany/my-plugin

# Test a plugin
pnpm sst-toolkit plugin test

# Publish a plugin
pnpm sst-toolkit plugin publish --dry-run
```

### Component Generation

```bash
# Generate a component
pnpm sst-toolkit generate component MyComponent --namespace mycompany

# Generate an adapter
pnpm sst-toolkit generate adapter MyAdapter --namespace mycompany
```

## Explorer Web App

The Explorer provides a visual interface for exploring your SST infrastructure.

### Starting the Explorer

```bash
cd apps/explorer
pnpm dev

# Open http://localhost:5173
```

### Features

#### Overview Tab

- Resource statistics
- Resource counts by type
- Provider distribution
- Category breakdown

#### Explorer Tab

- Resource list with filtering
- Resource details panel
- Search functionality
- Type and provider filters

#### Workflow Tab

- Interactive workflow visualization
- Resource relationships
- Dependency graph
- Node selection and details

#### Costs Tab

- Cost estimation dashboard
- Resource cost breakdown
- Cost trends
- Provider cost analysis

#### Plugins Tab

- Plugin marketplace
- Installed plugins
- Plugin dependencies
- Plugin management

### Loading State

The Explorer automatically loads state from `/public/misc/state.json`. To use your own SST state:

#### Export State from Your SST Project

From your SST project directory, export the state for the stage you want to explore:

```bash
# Export state for a specific stage (e.g., dev, staging, prod)
npx sst state export --stage dev > /path/to/sst-toolkit/apps/explorer/public/misc/state.json

# Example with absolute path
npx sst state export --stage dev > ~/Documents/development/playground/oss/sst-toolkit/apps/explorer/public/misc/state.json

# Or use relative path from your SST project
npx sst state export --stage dev > ../sst-toolkit/apps/explorer/public/misc/state.json
```

**Important Notes**:
- Replace `/path/to/sst-toolkit` with the actual path to your sst-toolkit repository
- Adjust the stage name (`dev`, `staging`, `prod`, etc.) to match your SST project stages
- The state file will be saved to `apps/explorer/public/misc/state.json`
- The Explorer will automatically load this file when you start the development server

#### Alternative: Manual Copy

If you prefer to copy the state file manually:

1. Export state from your SST project: `npx sst state export --stage dev > state.json`
2. Copy the file to `apps/explorer/public/misc/state.json`
3. Start the Explorer development server

## Visualization

### Workflow Visualization

The workflow visualization shows:

- **Nodes**: Resources in your infrastructure
- **Edges**: Relationships between resources
- **Colors**: Different relationship types
  - Blue: Parent-child relationships
  - Purple: Dependencies
  - Green: Events
  - Orange: Data flow

### Resource Relationships

The Explorer detects and visualizes:

- Parent-child relationships
- Dependencies
- Event connections
- Data flow

## Exporting Data

### Export Workflow

```bash
pnpm sst-toolkit visualize .sst/state.json --format json --output workflow.json
```

### Export State

```bash
# Copy state file
cp .sst/state.json exported-state.json
```

## Next Steps

- **[Component Examples](../examples/components.md)** - See component examples
- **[Using Components](./using-components.md)** - Learn how to use components
- **[API Reference](../API.md)** - Complete API documentation

