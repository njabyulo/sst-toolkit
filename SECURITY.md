# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public GitHub issue
2. Email the security team at [INSERT SECURITY EMAIL] with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)

3. We will:
   - Acknowledge receipt of your report within 48 hours
   - Provide an initial assessment within 7 days
   - Keep you informed of our progress
   - Credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using SST Toolkit:

- Keep dependencies up to date
- Review component code before using in production
- Use environment variables for sensitive configuration
- Follow SST security guidelines
- Regularly audit your infrastructure

## Known Security Considerations

- SST Toolkit processes SST state files which may contain sensitive information
- Always validate state files before processing
- Be cautious when sharing state files publicly
- Use appropriate access controls for the Explorer application

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.0 → 1.0.1)
- Documented in the CHANGELOG.md
- Announced via GitHub security advisories

Thank you for helping keep SST Toolkit secure!

