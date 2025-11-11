# SST Toolkit Explorer

A visual web application for exploring and analyzing SST (Serverless Stack) infrastructure state.

## Features

- **Visual State Explorer**: Browse your SST resources in an interactive interface
- **Workflow Builder**: Visualize resource relationships and dependencies
- **Resource Details**: Inspect individual resources with full metadata
- **Search & Filter**: Quickly find resources by type, name, or properties
- **Cost Estimation**: Get insights into your infrastructure costs

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

1. **Load State**: Import your SST state file (`.sst/state.json`) or use the sample data
2. **Explore**: Navigate through resources using the sidebar
3. **Visualize**: Switch to workflow view to see resource relationships
4. **Inspect**: Click on resources to view detailed information

## Features in Detail

### State Explorer

- Tree view of all resources
- Resource type filtering
- Search functionality
- Resource status indicators

### Workflow Builder

- Visual node-based representation
- Relationship visualization
- Dependency tracking
- Interactive canvas with zoom and pan

### Resource Inspector

- Full resource metadata
- Output values
- Dependencies and relationships
- Link properties

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
