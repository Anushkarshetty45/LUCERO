# Security Testing Guide

## Pre-Deployment Security Checklist

### Authentication & Authorization
- [ ] Password requirements enforced (12+ chars, special chars)
- [ ] Account lockout after failed attempts
- [ ] Session timeout configured
- [ ] OAuth flows tested (Google)
- [ ] Password reset flow secure
- [ ] Email verification required
- [ ] Rate limiting on auth endpoints
- [ ] No user enumeration vulnerabilities

### Input Validation
- [ ] All user inputs validated
- [ ] File uploads restricted (type, size)
- [ ] SQL injection prevented
- [ ] XSS protection in place
- [ ] CSRF tokens implemented
- [ ] Command injection prevented
- [ ] Path traversal blocked

### Data Security
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] Sensitive data encrypted at rest
- [ ] No secrets in code or git
- [ ] API keys in environment variables
- [ ] Database uses parameterized queries
- [ ] RLS policies configured
- [ ] No PII in logs

### API Security
- [ ] Rate limiting implemented
- [ ] Input sanitization
- [ ] Error messages don't leak info
- [ ] CORS configured correctly
- [ ] Authentication required
- [ ] Authorization checks enforced
- [ ] API versioning in place

### Frontend Security
- [ ] Content Security Policy set
- [ ] X-Frame-Options configured
- [ ] X-Content-Type-Options set
- [ ] No dangerouslySetInnerHTML
- [ ] DOMPurify used for user content
- [ ] Dependencies updated
- [ ] No vulnerable packages

### Session Management
- [ ] Secure cookies (httpOnly, secure)
- [ ] Session timeout configured
- [ ] Logout clears session
- [ ] No session fixation
- [ ] CSRF protection

### File Operations
- [ ] File type validation
- [ ] File size limits
- [ ] Filename sanitization
- [ ] Malware scanning (if applicable)
- [ ] Secure file storage

---

## Manual Testing Procedures

### 1. Authentication Testing

**Test Password Strength:**
```
1. Try weak passwords: "password", "12345678"
   Expected: Rejected with error message

2. Try strong password: "MyP@ssw0rd123!"
   Expected: Accepted

3. Try SQL injection: "' OR '1'='1"
   Expected: Rejected, no database error shown
```

**Test Rate Limiting:**
```
1. Attempt login 5 times with wrong password
   Expected: Account temporarily locked

2. Wait 15 minutes
   Expected: Can attempt login again
```

**Test Session Management:**
```
1. Login successfully
2. Close browser
3. Reopen and navigate to dashboard
   Expected: Still logged in (if "Remember me")

4. Logout
5. Try accessing protected route
   Expected: Redirected to login
```

### 2. Input Validation Testing

**Test XSS:**
```
1. Try entering: <script>alert('XSS')</script>
   In: Username, notes, any text field
   Expected: Sanitized, no script execution

2. Try: <img src=x onerror=alert('XSS')>
   Expected: Sanitized or safely rendered
```

**Test SQL Injection:**
```
1. Try: ' OR '1'='1
   In: Login, search fields
   Expected: No database error, handled safely
```

**Test File Upload:**
```
1. Upload .exe file
   Expected: Rejected

2. Upload PDF larger than 10MB
   Expected: Rejected with size error

3. Upload valid PDF
   Expected: Uploaded successfully
```

### 3. Authorization Testing

**Test Access Control:**
```
1. Login as User A
2. Try accessing User B's data by changing URL ID
   Expected: Access denied or redirected

3. Try accessing admin routes as regular user
   Expected: Access denied
```

### 4. Error Handling

**Test Error Messages:**
```
1. Trigger 404 error
   Expected: Generic message, no stack trace

2. Trigger 500 error (server error)
   Expected: User-friendly message, no internal details

3. Trigger validation error
   Expected: Specific, helpful message
```

---

## Automated Security Testing

### NPM Audit
```bash
npm audit
npm audit fix
```

### Dependency Checking
```bash
# Install dependency-check
npm install -g dependency-check

# Run check
dependency-check package.json
```

### Secret Scanning
```bash
# Install gitleaks
brew install gitleaks

# Scan repository
gitleaks detect --source . --verbose
```

### OWASP ZAP (Web Application Scanner)
```bash
# Install ZAP
# Run against local development
zap-cli quick-scan --self-contained http://localhost:3000

# Full scan
zap-cli active-scan --self-contained http://localhost:3000
```

---

## Security Testing Tools

### Static Analysis
- **ESLint Security Plugin**
  ```bash
  npm install --save-dev eslint-plugin-security
  ```

- **SonarQube**
  - Code quality and security scanning
  - Detects vulnerabilities, code smells

### Dynamic Analysis
- **OWASP ZAP** - Web app vulnerability scanner
- **Burp Suite** - Security testing platform
- **Postman** - API security testing

### Dependency Scanning
- **npm audit** - Built-in vulnerability scanner
- **Snyk** - Continuous vulnerability monitoring
- **Dependabot** - Automated dependency updates

### Secret Detection
- **GitLeaks** - Scan for secrets in git
- **TruffleHog** - Find secrets in git history
- **GitHub Secret Scanning** - Built-in scanning

---

## Penetration Testing Checklist

### Reconnaissance
- [ ] Identify all entry points
- [ ] Map application structure
- [ ] Enumerate users/roles
- [ ] Identify technologies used

### Vulnerability Assessment
- [ ] Test authentication mechanisms
- [ ] Test authorization controls
- [ ] Test input validation
- [ ] Test session management
- [ ] Test error handling
- [ ] Test file operations
- [ ] Test API endpoints

### Exploitation
- [ ] Attempt XSS attacks
- [ ] Attempt SQL injection
- [ ] Attempt CSRF attacks
- [ ] Attempt file upload vulnerabilities
- [ ] Attempt session hijacking
- [ ] Attempt brute force attacks

### Reporting
- [ ] Document all findings
- [ ] Categorize by severity
- [ ] Provide reproduction steps
- [ ] Suggest remediation
- [ ] Estimate risk impact

---

## Common Vulnerabilities to Test

### OWASP Top 10 (2021)

1. **Broken Access Control**
   - Test unauthorized data access
   - Test privilege escalation

2. **Cryptographic Failures**
   - Check for unencrypted sensitive data
   - Verify proper encryption usage

3. **Injection**
   - Test SQL injection
   - Test command injection
   - Test XSS

4. **Insecure Design**
   - Review architecture for flaws
   - Check threat modeling

5. **Security Misconfiguration**
   - Check default configurations
   - Verify security headers

6. **Vulnerable Components**
   - Run dependency scans
   - Check for outdated packages

7. **Authentication Failures**
   - Test weak passwords
   - Test session management

8. **Software and Data Integrity**
   - Verify dependencies
   - Check for supply chain attacks

9. **Security Logging Failures**
   - Verify logging coverage
   - Check log security

10. **Server-Side Request Forgery (SSRF)**
    - Test URL validation
    - Check for SSRF vulnerabilities

---

## Security Testing Schedule

### Daily (Automated)
- npm audit on dependencies
- Pre-commit hooks for secrets

### Weekly
- Manual security review of new features
- Review authentication logs

### Monthly
- Full vulnerability scan
- Dependency updates
- Security patch review

### Quarterly
- Penetration testing
- Security audit
- Incident response drill

### Annually
- Third-party security assessment
- Compliance audit
- Security training update

---

## Resources

**Tools:**
- OWASP ZAP: https://www.zaproxy.org/
- Burp Suite: https://portswigger.net/burp
- GitLeaks: https://github.com/gitleaks/gitleaks
- npm audit: Built-in to npm

**Documentation:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- CWE Top 25: https://cwe.mitre.org/top25/

**Training:**
- OWASP WebGoat
- HackTheBox
- TryHackMe
- PortSwigger Academy

---

**Last Updated:** 2026-03-27
**Next Review:** 2026-06-27
