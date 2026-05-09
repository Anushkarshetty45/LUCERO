# Security Policy

## Supported Versions

Currently supported versions of LUCERO:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. DO NOT Open a Public Issue

Please **do not** open a public GitHub issue if the bug is a security vulnerability.

### 2. Report Privately

Email security vulnerabilities to: **security@lucero.app**

Include the following information:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### 3. Response Timeline

- **24 hours**: Initial acknowledgment of your report
- **72 hours**: Preliminary assessment of severity
- **7 days**: Detailed response with remediation plan
- **90 days**: Public disclosure (coordinated with you)

### 4. Safe Harbor

We support responsible disclosure. If you follow these guidelines:
- Make a good faith effort to avoid privacy violations, data destruction, and service interruption
- Give us reasonable time to address the issue before any disclosure
- We will not take legal action against you

### 5. Recognition

Security researchers who responsibly disclose vulnerabilities will be:
- Acknowledged in our security hall of fame (with permission)
- Credited in release notes (with permission)
- May be eligible for a bug bounty (if program is active)

## Security Features

### Authentication & Authorization
- Supabase Auth with Row Level Security (RLS)
- OAuth 2.0 support (Google)
- Strong password requirements (12+ characters, special chars)
- Session management with auto-refresh tokens
- PKCE (Proof Key for Code Exchange) flow

### Data Protection
- All data encrypted in transit (HTTPS)
- Encryption at rest via Supabase
- API keys stored in environment variables
- No sensitive data in logs
- PII handling compliant with GDPR/CCPA

### Input Validation
- DOMPurify for XSS prevention
- File upload restrictions (type, size)
- Input sanitization on all user inputs
- SQL injection prevention via parameterized queries

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### Monitoring & Logging
- Security event logging
- Failed authentication tracking
- Rate limiting on sensitive endpoints
- Anomaly detection

## Best Practices

When contributing to LUCERO:

1. **Never commit secrets**
   - Use environment variables
   - Check .gitignore before committing
   - Use pre-commit hooks

2. **Validate all inputs**
   - Sanitize user input
   - Validate file uploads
   - Check data types

3. **Follow secure coding**
   - Use parameterized queries
   - Avoid eval() and innerHTML
   - Use secure random generators

4. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages promptly
   - Review security advisories

5. **Test security**
   - Write security tests
   - Perform code reviews
   - Use static analysis tools

## Security Tools We Use

- **npm audit** - Dependency vulnerability scanning
- **DOMPurify** - XSS protection
- **Supabase** - Database security and RLS
- **Pre-commit hooks** - Secret detection
- **ESLint** - Code quality and security

## Compliance

LUCERO is designed to comply with:
- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **OWASP Top 10** security standards

## Contact

- **Security issues**: security@lucero.app
- **General questions**: support@lucero.app
- **Website**: https://lucero.app

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Testing Guide](./SECURITY_TESTING_GUIDE.md)
- [Incident Response Plan](./SECURITY_INCIDENT_RESPONSE.md)

---

**Last Updated**: March 27, 2026
**Next Review**: June 27, 2026
