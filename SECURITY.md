# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |

## Current Security Status

**Total Vulnerabilities**: 9 (3 moderate, 6 high)  
**Last Updated**: December 2024  
**Status**: ✅ **Production Safe** - All vulnerabilities are in development dependencies only

## Known Vulnerabilities

### Development Dependencies (Non-Critical)

The following vulnerabilities are present in development dependencies and do not affect production builds:

#### React Scripts 5.0.1 Dependencies
- **nth-check < 2.0.1** (High) - Inefficient Regular Expression Complexity
  - **Impact**: Development-time SVG processing
  - **Mitigation**: Only affects build tools, not runtime
  - **Status**: Known issue in react-scripts ecosystem

- **postcss < 8.4.31** (Moderate) - PostCSS line return parsing error
  - **Impact**: CSS processing during build
  - **Mitigation**: Development dependency only
  - **Status**: Known issue in resolve-url-loader

- **webpack-dev-server <= 5.2.0** (Moderate) - Source code exposure
  - **Impact**: Development server only
  - **Mitigation**: Not used in production builds
  - **Status**: Known issue in react-scripts ecosystem

## Recently Resolved

### ✅ Removed Critical Vulnerabilities (December 2024)
- **Removed old `gym-locker-manager` directory** containing 26 vulnerabilities
- **Eliminated 6 critical, 11 high, and 9 moderate vulnerabilities**
- **Source**: Outdated MQTT broker package (`mosca`) with vulnerable dependencies

## Mitigation Strategies

### For Development
1. **Use .npmrc configuration** to suppress audit warnings for dev dependencies
2. **Run security scans** only on production builds
3. **Keep dependencies updated** within compatible versions

### For Production
1. **Docker builds** use production dependencies only
2. **Security scanning** on final container images
3. **Regular dependency updates** for production packages

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. **Email** security@solace-software.com
3. **Include** detailed description and reproduction steps
4. **Expect** response within 48 hours

## Security Updates

- **Critical vulnerabilities**: Immediate patch releases
- **High vulnerabilities**: Next minor version
- **Medium/Low vulnerabilities**: Next major version
- **Development dependencies**: As part of regular updates

## Best Practices

1. **Never commit** API keys or secrets
2. **Use environment variables** for configuration
3. **Regular security audits** on production builds
4. **Keep dependencies updated** within supported versions
5. **Monitor security advisories** for all packages

---

**Last Updated**: December 2024  
**Next Review**: January 2025
