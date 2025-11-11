# Contributing to SST Toolkit

Thank you for your interest in contributing to SST Toolkit! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/sst-toolkit/sst-toolkit/issues) to see if the problem has already been reported.

When creating a bug report, please include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, SST version, etc.)
- Screenshots or error messages if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement request:
- Use a clear, descriptive title
- Provide a detailed description of the proposed enhancement
- Explain why this enhancement would be useful
- List any alternatives you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding standards** (see below)
3. **Write or update tests** as needed
4. **Update documentation** if you're changing functionality
5. **Ensure all tests pass** (`pnpm test`)
6. **Ensure linting passes** (`pnpm lint`)
7. **Commit your changes** using [conventional commits](https://www.conventionalcommits.org/)
8. **Push to your fork** and open a Pull Request

### Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sst-toolkit.git
   cd sst-toolkit
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

5. Start development:
   ```bash
   pnpm dev
   ```

### Coding Standards

- **TypeScript**: All code must be written in TypeScript with proper types
- **Linting**: Code must pass ESLint checks (`pnpm lint:code`)
- **Type Checking**: Code must pass TypeScript checks (`pnpm lint:type`)
- **Formatting**: Code is automatically formatted with Prettier
- **Naming Conventions**:
  - Interfaces: Prefix with `I` (e.g., `IUser`)
  - Types: Prefix with `T` (e.g., `TUser`)
  - Zod Schemas: Prefix with `S` (e.g., `SUser`)
- **Code Quality**: Follow SOLID principles and design patterns where appropriate
- **Documentation**: Add JSDoc comments for public APIs

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat: add support for Cloudflare components

- Add Cloudflare adapter
- Update component generator
- Add tests for Cloudflare integration
```

### Testing

- Write tests for new features
- Ensure all existing tests pass
- Aim for good test coverage
- Use descriptive test names

### Documentation

- Update README.md if you're adding features
- Update API documentation if you're changing APIs
- Add examples for new features
- Keep documentation clear and concise

## Project Structure

```
sst-toolkit/
├── apps/              # Applications (CLI, Explorer)
├── packages/           # Core packages
│   ├── core/          # Core utilities
│   ├── shared/        # Shared types and utilities
│   ├── plugin-sdk/    # Plugin SDK
│   └── community/     # Community components
├── docs/              # Documentation
├── examples/          # Example components
└── extensions/        # Extensions
```

## Questions?

If you have questions about contributing, please:
- Open a [GitHub Discussion](https://github.com/sst-toolkit/sst-toolkit/discussions)
- Check existing [issues](https://github.com/sst-toolkit/sst-toolkit/issues)
- Review the [documentation](./docs/README.md)

Thank you for contributing to SST Toolkit! 🎉

