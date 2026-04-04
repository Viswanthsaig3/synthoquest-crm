# Security Guidelines

> **Document Version**: 1.0.0 | **Last Updated**: 2026-04-04

---

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Grant minimum necessary permissions
3. **Fail Secure**: Default to secure state on failure
4. **No Security Through Obscurity**: Security doesn't rely on secrecy
5. **Trust Nothing**: Validate all input, verify all claims

---

## Authentication Security

### Password Requirements
```
Minimum Requirements:
- Length: 8 characters minimum
- Complexity: 
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character

Storage:
- Algorithm: bcrypt
- Cost factor: 12
- Never store plain text
- Never log passwords
```

### JWT Security
```
Token Generation:
- Algorithm: HS256 or RS256
- Secret: 256 bits minimum
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days

Token Content:
- User ID (sub)
- Email
- Role
- Issued at (iat)
- Expiration (exp)

Token Storage:
- Access token: In-memory only (JavaScript variable)
- Refresh token: HttpOnly, Secure, SameSite cookie

Token Transmission:
- Always over HTTPS
- In Authorization header
- Never in URL parameters
```

### Session Security
```
Session Management:
- Track active sessions
- Limit concurrent sessions (optional)
- Allow session revocation
- Force re-login on password change

Cookie Security:
- HttpOnly flag: true
- Secure flag: true (production)
- SameSite: 'strict' or 'lax'
- Path: restricted
```

### Login Security
```
Brute Force Protection:
- Rate limiting: 5 attempts per 15 minutes per IP
- Account lockout: 10 failed attempts → 30 min lock
- Progressive delays: Increase delay after each failure

Monitoring:
- Log all login attempts
- Alert on suspicious patterns
- Track location changes

Notifications:
- Email on new device login
- Email on login from new location
- Alert on multiple failed attempts
```

---

## Authorization Security

### Permission Checks
```
Requirement: Check permissions at EVERY layer

API Layer:
- Middleware checks permission before handler
- Permission required for every action
- Resource-level checks (can user access this specific resource?)

Business Logic:
- Verify permission before operation
- Check resource ownership
- Validate team membership

Database Layer:
- Row Level Security (RLS)
- Filter by user context
- Enforce data access boundaries
```

### Role Management
```
Role Assignment:
- Only admin/HR can assign roles
- Audit all role changes
- Require justification
- Notification on role change

Role Hierarchy:
- Roles cannot escalate own privileges
- Lower roles cannot manage higher roles
- Admin is immutable
```

### Resource Access Control
```
Ownership Checks:
- User can only access own resources
- Team leads can access team resources
- Admin/HR can access all resources

Data Filtering:
- Always filter queries by user context
- Never expose all data
- Use parameterized queries
```

---

## Input Validation

### Validation Rules
```
Always Validate:
- All user input
- File uploads
- URL parameters
- Request body
- Query parameters
- Headers (when used)

Validation Methods:
- Type checking
- Format validation (email, phone, etc.)
- Length limits
- Range checks
- Whitelist allowed values
- Reject unexpected input
```

### Validation Layers
```
Client-Side:
- For user experience
- Immediate feedback
- Not for security

Server-Side:
- ALWAYS validate
- Use Zod schemas
- Sanitize before use
- Never trust client
```

### Input Sanitization
```
HTML/Script:
- Escape HTML entities
- Strip dangerous tags
- Use sanitization libraries

SQL:
- NEVER concatenate user input
- ALWAYS use parameterized queries
- Use ORM/query builder

File Uploads:
- Validate file type
- Check file size
- Scan for malware
- Generate new filename
- Store outside web root
```

---

## Database Security

### SQL Injection Prevention
```
NEVER:
- Concatenate user input into SQL
- Use raw queries with user input
- Trust any input

ALWAYS:
- Use parameterized queries
- Use ORM/query builder (Supabase)
- Validate and sanitize input
- Use stored procedures for complex logic
```

### Row Level Security (RLS)
```
Enable RLS on ALL tables

Policy Patterns:

User owns record:
CREATE POLICY "Users can view own records"
ON table_name FOR SELECT
USING (user_id = auth.uid());

Role-based:
CREATE POLICY "Admins can do everything"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

Team membership:
CREATE POLICY "Team leads manage team"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users team_member
    WHERE team_member.id = table_name.user_id
    AND team_member.managed_by = auth.uid()
  )
);
```

### Data Encryption
```
At Rest:
- Enable database encryption (Supabase handles)
- Encrypt sensitive fields (SSN, financial data)
- Use pgcrypto for sensitive columns

In Transit:
- Enforce TLS 1.2+
- Certificate pinning (mobile apps)
- Disable insecure protocols
```

### Database Access
```
Connection:
- Use connection pooling
- Limit max connections
- Use service role key only server-side
- Never expose service role key to client

Credentials:
- Store in environment variables
- Rotate regularly
- Use strong passwords
- Separate per environment
```

---

## API Security

### Authentication Required
```
Every API route must:
1. Verify authentication
2. Check token validity
3. Extract user context
4. Verify token not revoked

Public endpoints:
- /api/auth/login
- /api/auth/refresh
- Health check endpoints

All other endpoints require authentication
```

### Authorization Required
```
Every operation must check:
1. User has required permission
2. User can access specific resource
3. Operation is allowed for user's role

Never skip authorization checks
```

### Rate Limiting
```
Implementation:
- Per IP limit
- Per user limit
- Endpoint-specific limits

Limits:
- General API: 100 requests/minute
- Authentication: 5 attempts/15 minutes
- Search: 20 requests/minute
- Export: 5 requests/minute

Response:
- 429 Too Many Requests
- Retry-After header
```

### CORS Configuration
```
Allowed Origins:
- Production: exact domain
- Development: localhost
- NEVER: *

Allowed Methods:
- Only needed methods
- Never allow all

Allowed Headers:
- Authorization
- Content-Type
- Custom headers as needed

Credentials:
- Allow credentials for authenticated requests
```

### Request/Response Security
```
Headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Strict-Transport-Security

Response:
- Never expose internal errors
- Sanitize error messages
- Use consistent error format
- Include request ID for debugging
```

---

## Frontend Security

### XSS Prevention
```
React handles most XSS by default

Additional measures:
- Sanitize user-generated HTML
- Use dangerouslySetInnerHTML sparingly
- Validate and sanitize URLs
- Escape dynamic content
- Content Security Policy
```

### CSRF Protection
```
SameSite cookies
CSRF tokens for forms
Verify origin/referer headers
```

### Sensitive Data
```
NEVER store in:
- LocalStorage
- SessionStorage
- IndexedDB (without encryption)

ONLY store in:
- Memory (access tokens)
- HttpOnly cookies (refresh tokens)
- Secure backend
```

### Third-Party Libraries
```
Regular audits:
- npm audit
- Dependabot
- Snyk

Updates:
- Keep dependencies updated
- Review changelogs
- Test after updates
```

---

## Sensitive Data Handling

### Classification
```
Highly Sensitive:
- Passwords
- API keys
- SSN/Tax IDs
- Financial data (bank accounts)
- Medical information

Sensitive:
- Email addresses
- Phone numbers
- Addresses
- Employment details

Internal:
- User IDs
- Role assignments
- Audit logs

Public:
- Names
- Departments
- Roles (not specific assignments)
```

### Handling Rules
```
Highly Sensitive:
- Encrypt at rest
- Encrypt in transit
- Mask in logs
- Limit access
- Audit all access

Sensitive:
- Limit access
- Mask in UI (partial display)
- Audit access
- Never expose in URLs

Internal:
- Role-based access
- Audit modifications
- Not exposed to unauthorized users

Public:
- Accessible to authenticated users
- No special handling needed
```

### Logging
```
NEVER log:
- Passwords (even hashed)
- API keys
- JWT tokens
- Credit card numbers
- SSN

ALWAYS mask:
- Email: j***@example.com
- Phone: +91 98*** ***45
- Address: 123 M*** St

Log for audit:
- Who accessed data
- When accessed
- What was accessed
- Source IP
```

---

## Error Handling Security

### Information Disclosure
```
NEVER expose to client:
- Stack traces
- Database errors
- File paths
- Internal IP addresses
- Framework versions
- Server configuration

ONLY return:
- Generic error message
- Error code (if useful)
- Request ID (for support)
```

### Error Response Format
```
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "requestId": "uuid"
}

NO:
- Internal details
- Debug information
- System information
```

### Logging Errors
```
Log internally:
- Full error details
- Stack trace
- User context
- Request details
- Timestamp

Do NOT send to client
```

---

## Dependency Security

### Package Management
```
Only install:
- Necessary packages
- Well-maintained packages
- Trusted sources

Before installing:
- Check npm downloads
- Check GitHub stars/activity
- Check security advisories
- Review dependencies
```

### Vulnerability Scanning
```
Tools:
- npm audit
- Snyk
- Dependabot
- GitHub Security

Frequency:
- On every install
- Daily automated scan
- Before deployment
```

### Update Policy
```
Security patches:
- Apply immediately
- Test thoroughly
- Deploy urgently

Feature updates:
- Review changelog
- Test in staging
- Plan deployment

Breaking changes:
- Evaluate impact
- Plan migration
- Document changes
```

---

## Infrastructure Security

### Environment Variables
```
Storage:
- .env.local (development)
- Vercel environment variables (production)
- NEVER commit to git
- NEVER hardcode

Naming:
- NEXT_PUBLIC_* for client-side
- No prefix for server-only

Rotation:
- Regular rotation schedule
- Update all environments
- Document rotation process
```

### Secret Management
```
Never store secrets in:
- Code
- Comments
- Documentation
- Client-side code

Use:
- Environment variables
- Secret management services
- Encrypted storage
```

### HTTPS
```
Always use HTTPS:
- All environments
- All endpoints
- No exceptions

TLS Configuration:
- TLS 1.2 minimum
- Strong cipher suites
- HSTS enabled
```

---

## Incident Response

### Security Incident Types
```
Categories:
- Data breach
- Unauthorized access
- Malware
- DDoS attack
- Insider threat
```

### Response Plan
```
1. Detect and identify
2. Contain the incident
3. Eradicate the threat
4. Recover systems
5. Post-incident review
```

### Communication
```
Internal:
- Notify security team
- Notify stakeholders
- Document timeline

External:
- Notify affected users
- Notify regulators (if required)
- Public disclosure (if required)
```

---

## Security Checklist

### Before Deployment
- [ ] All endpoints have authentication
- [ ] All endpoints have authorization
- [ ] Input validation on all endpoints
- [ ] No secrets in code
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] CORS configured properly
- [ ] RLS enabled on tables
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Dependencies audited

### Regular Reviews
- [ ] Access logs reviewed
- [ ] Failed login attempts checked
- [ ] Permission assignments reviewed
- [ ] API key rotation
- [ ] Dependency updates
- [ ] Security scan results reviewed

### Annual Tasks
- [ ] Penetration testing
- [ ] Security training
- [ ] Policy review
- [ ] Incident response drill
- [ ] Access review

---

## Security Contacts

### Reporting Vulnerabilities
```
Email: security@synthoquest.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Your contact information
```

### Emergency Contacts
```
Security Team: security@synthoquest.com
On-call: (defined in runbook)
```

---

## Compliance

### Data Protection
```
Principles:
- Data minimization
- Purpose limitation
- Storage limitation
- Accuracy
- Integrity and confidentiality
```

### Access Rights
```
Users can:
- Access their data
- Correct inaccuracies
- Request deletion
- Data portability
```

### Audit Trail
```
Log for sensitive operations:
- Who performed action
- When performed
- What was changed
- Source IP
- Justification (if applicable)
```

---

**End of Security Guidelines**