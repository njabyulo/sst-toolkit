# SST Toolkit Explorer

A visual web application for exploring and analyzing SST (Serverless Stack) infrastructure state.

## Features

- **File Upload**: Upload and visualize SST state files directly in the browser
- **Visual State Explorer**: Browse your SST resources in an interactive interface
- **Workflow Visualization**: Visualize resource relationships and dependencies in an interactive graph
- **Pending Operations**: View and manage pending operations (create, update, delete, replace)
- **Resource Details**: Inspect individual resources with full metadata
- **Global Search**: Quickly find resources by name, type, URN, or category (⌘K / Ctrl+K)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### Installation

```bash
# From the repository root
pnpm install

# Build dependencies
pnpm build
```

### Development

```bash
# Start the development server
cd apps/explorer
pnpm dev

# The app will be available at http://localhost:5173
```

### Building for Production

```bash
pnpm build
pnpm preview
```

## Usage

### Exporting SST State

Before using the Explorer, export your SST state from your SST project:

```bash
# From your SST project directory
# Export state for a specific stage (e.g., dev, staging, prod)
npx sst state export --stage dev > state.json
```

### Using the Explorer

1. **Start Explorer**: Start the development server (see Development section)
2. **Upload State**: Click the "Upload State File" button and select your exported `state.json` file
3. **Explore**: Navigate through resources using the Explorer tab
4. **View Pending**: Check the Pending tab to see any pending operations (if available)
5. **Visualize**: Switch to Workflow tab to see resource relationships
6. **Search**: Use global search (⌘K / Ctrl+K) to quickly find resources
7. **Inspect**: Click on resources to view detailed information

## Features in Detail

### File Upload

- Upload SST state files directly in the browser
- No need to manually place files in specific directories
- Supports any valid SST state JSON file
- Automatic validation and error handling

### State Explorer

- Tree view of all resources organized by type
- Resource type filtering
- Search functionality within the resource list
- Resource status indicators
- Click to view detailed resource information

### Pending Operations

- View all pending operations (create, update, delete, replace)
- Grouped by operation type and resource category
- Search and filter pending operations
- Visual indicators for different operation types
- Click to view resource details

### Workflow Visualization

- Visual node-based representation of your infrastructure
- Relationship visualization between resources
- Dependency tracking
- Interactive canvas with zoom and pan
- Click nodes to view resource details

### Resource Inspector

- Full resource metadata display
- Output values
- Dependencies and relationships
- Link properties
- Resource type and provider information

### Global Search

- Quick search across all resources (⌘K / Ctrl+K)
- Search by name, type, URN, or category
- Results ranked by relevance
- Visual indicators for pending resources
- Keyboard navigation support

## Development

### Project Structure

```
apps/explorer/
├── src/
│   ├── components/    # React components
│   ├── lib/          # Utilities and helpers
│   ├── types/        # TypeScript types
│   └── App.tsx       # Main application
├── public/           # Static assets
└── tests/            # Test files
```

### Adding Features

1. Create components in `src/components/`
2. Add utilities in `src/lib/`
3. Update types in `src/types/`
4. Write tests in `tests/`

## Technologies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Flow**: Workflow visualization
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible components

## Contributing

See the [main CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to SST Toolkit.

## License

MIT
