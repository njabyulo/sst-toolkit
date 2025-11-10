# Publishing Components

This guide explains how to publish your custom SST components for others to use.

## Prerequisites

Before publishing, ensure your component:

- ✅ Follows [Best Practices](./best-practices.md)
- ✅ Has proper TypeScript types
- ✅ Includes a README with usage examples
- ✅ Has proper package.json configuration
- ✅ Is tested and working

## Preparation

### 1. Validate Your Component

```bash
# Test your component
pnpm sst-toolkit plugin test

# Validate structure
pnpm sst-toolkit plugin validate
```

### 2. Build Your Component

```bash
# Build the component
pnpm build

# Verify build output
ls dist/
```

### 3. Update Version

Update version in `package.json`:

```json
{
  "version": "1.0.0"
}
```

Follow semantic versioning:
- `1.0.0` - Initial release
- `1.0.1` - Patch (bug fixes)
- `1.1.0` - Minor (new features, backward compatible)
- `2.0.0` - Major (breaking changes)

## Publishing to npm

### 1. Create npm Account

If you don't have one, create an account at [npmjs.com](https://www.npmjs.com/)

### 2. Login to npm

```bash
npm login
```

### 3. Publish

```bash
# Dry run first
pnpm sst-toolkit plugin publish --dry-run

# Publish
pnpm sst-toolkit plugin publish
```

Or use npm directly:

```bash
npm publish
```

## Package.json Configuration

Ensure your `package.json` has:

```json
{
  "name": "@mycompany/my-component",
  "version": "1.0.0",
  "description": "My custom SST component",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.mjs"
    }
  },
  "peerDependencies": {
    "sst": "^3.0.0"
  },
  "keywords": [
    "sst",
    "sst-component",
    "aws",
    "serverless"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/mycompany/my-component.git"
  },
  "license": "MIT"
}
```

## README Requirements

Your component should include a README with:

- Description
- Installation instructions
- Usage examples
- API reference
- License

Example:

```markdown
# @mycompany/my-component

My custom SST component.

## Installation

\`\`\`bash
pnpm add @mycompany/my-component
\`\`\`

## Usage

\`\`\`typescript
import { MyComponent } from "@mycompany/my-component";

const component = new MyComponent("MyComponent", {
  // ... props
});
\`\`\`

## License

MIT
```

## Versioning

Follow semantic versioning:

- **Major** (2.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes

## Publishing Checklist

- [ ] Component is tested and working
- [ ] README is complete
- [ ] package.json is properly configured
- [ ] Version is updated
- [ ] Build succeeds
- [ ] Tests pass
- [ ] License is included
- [ ] Repository URL is correct

## After Publishing

### Update Plugin Registry

After publishing, your component may be automatically added to the plugin registry, or you may need to submit it manually.

### Share with Community

- Share on SST Discord
- Post on Twitter/X
- Write a blog post
- Add to SST community resources

## Next Steps

- **[Best Practices](./best-practices.md)** - Development guidelines
- **[Component Examples](../examples/components.md)** - See examples
- **[Using Components](./using-components.md)** - Learn how others will use your component

