# Sibling Helper - Security Best Practices & Implementation

## Table of Contents
1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [Security Headers](#security-headers)
6. [Environment Configuration](#environment-configuration)
7. [Data Protection](#data-protection)
8. [Production Security Checklist](#production-security-checklist)
9. [Common Security Issues & Solutions](#common-security-issues--solutions)

## Security Overview

The Sibling Helper application implements comprehensive security measures across both client and server components to protect user data and prevent common vulnerabilities.

### Security Features Implemented:
- **JWT-based Authentication** with role-based authorization
- **Input Validation & Sanitization** for all API endpoints
- **Rate Limiting** to prevent brute force attacks
- **Helmet Security Headers** for HTTP protection
- **Environment-based Configuration** for sensitive settings
- **Data Validation** at repository level
- **Error Boundaries** to prevent app crashes
- **Secure PIN Validation** for parent access

## Authentication & Authorization

### JWT Authentication Setup

The server uses JSON Web Tokens (JWT) for authentication with the following configuration:

```javascript
// Environment variables for authentication
const AUTH_REQUIRED = process.env.AUTH_REQUIRED === 'true';
const JWT_SECRET = process.env.JWT_SECRET || '';
```

#### Configuration Requirements:
- **JWT_SECRET**: Must be at least 16 characters when AUTH_REQUIRED=true
- **AUTH_REQUIRED**: Set to 'true' for production environments
- **Algorithm**: Uses HS256 for token signing

#### Token Structure:
```json
{
  "sub": "user-id",
  "role": "parent|child|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-Based Authorization

The system implements three roles:
- **admin**: Full access to all endpoints
- **parent**: Access to parent-specific endpoints and child management
- **child**: Access to child-specific endpoints only

#### Authorization Logic:
```javascript
function authorizeByRole(req, res, { parentId, childId, allowAdmin = true, allowParent = true, allowChild = true }) {
  if (!AUTH_REQUIRED) return true;
  const user = req.user;

  // Role-based access control
  if (allowAdmin && user.role === 'admin') return true;
  if (allowParent && parentId && user.role === 'parent' && user.sub === parentId) return true;
  if (allowChild && childId && user.role === 'child' && user.sub === childId) return true;

  return false;
}
```

### Authentication Middleware

The authentication middleware handles:
- **Bearer token extraction** from Authorization header
- **Token validation** with proper error handling
- **Graceful degradation** when AUTH_REQUIRED=false

## Input Validation & Sanitization

### Validation Principles

All API inputs undergo strict validation before processing:

1. **Type Checking**: Ensure correct data types
2. **Length Validation**: Prevent buffer overflow attacks
3. **Pattern Matching**: Validate format using regex
4. **Range Checking**: Validate numeric ranges
5. **Character Whitelisting**: Remove dangerous characters

### Common Validation Functions

#### String Sanitization:
```javascript
function sanitizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[^\x20-\x7E]/g, ''); // ASCII only
}
```

#### ID Validation:
```javascript
function cleanId(value) {
  const clean = sanitizeString(value);
  if (!clean) return null;
  if (clean.length > MAX_ID_LEN) return null;
  if (!ID_REGEX.test(clean)) return null;
  return clean;
}
```

#### Numeric Validation:
```javascript
function parseNumberInRange(value, fieldName, min, max, fallback) {
  if (value === undefined || value === null || value === '') {
    return { value: fallback };
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return { error: `${fieldName} must be a number` };
  if (num < min || num > max) return { error: `${fieldName} must be between ${min} and ${max}` };
  return { value: num };
}
```

### Validation Rules by Endpoint

| Endpoint | Validated Fields | Rules |
|----------|------------------|-------|
| `/api/link-codes` | parentId, ttlMinutes | ID format, 1-1440 minutes |
| `/api/links/enter-code` | childId, code | ID format, 6-digit code |
| `/api/tasks/assign` | parentId, childId, questId, title, points | ID formats, title length, points range |

## Rate Limiting

### Configuration

The API implements rate limiting to prevent brute force attacks:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Rate Limiting Rules:
- **Window**: 15 minutes
- **Limit**: 300 requests per IP address
- **Headers**: Standard rate limit headers included
- **Scope**: Applied to all `/api` endpoints

### Customizing Rate Limits

To adjust rate limits, modify the environment variables:

```bash
# Increase limit for high-traffic environments
RATE_LIMIT_WINDOW=300000  # 5 minutes
RATE_LIMIT_MAX=500        # 500 requests
```

## Security Headers

The application uses Helmet.js to set secure HTTP headers:

```javascript
app.use(helmet());
```

### Headers Applied:
- **Content-Security-Policy**: Prevents XSS attacks
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filtering
- **Strict-Transport-Security**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information

### Customizing Security Headers

Add custom headers in the Express middleware:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Sibling Helper');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AUTH_REQUIRED` | Enable authentication | No | `false` |
| `JWT_SECRET` | JWT signing secret | Yes (if AUTH_REQUIRED) | `''` |
| `LOG_LEVEL` | Logging level | No | `'info'` |
| `PORT` | Server port | No | `5050` |

### Production Configuration Example

```bash
# Production environment variables
AUTH_REQUIRED=true
JWT_SECRET=your-very-secure-secret-at-least-16-chars
LOG_LEVEL=info
PORT=8080
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
```

### Configuration Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for different environments
3. **Rotate secrets regularly**
4. **Use environment-specific configuration** files
5. **Validate configuration** on startup

## Data Protection

### Data Validation & Sanitization

All data undergoes validation before storage:

```javascript
function normalizeLoadedData(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  let schemaVersion = Number.isInteger(data.schemaVersion) ? data.schemaVersion : 0;

  // Validate and clean all data arrays
  const links = Array.isArray(data.links) ? data.links : [];
  const linkCodes = Array.isArray(data.linkCodes) ? data.linkCodes : [];
  const assignedTasks = Array.isArray(data.assignedTasks) ? data.assignedTasks : [];

  // Apply validation functions to each record
  const cleanedLinks = links.map(cleanLink).filter(Boolean);
  const cleanedCodes = linkCodes.map(cleanLinkCode).filter(Boolean);
  const cleanedTasks = assignedTasks.map(cleanAssignment).filter(Boolean);

  // Log any dropped invalid records
  const droppedLinks = links.length - cleanedLinks.length;
  const droppedCodes = linkCodes.length - cleanedCodes.length;
  const droppedTasks = assignedTasks.length - cleanedTasks.length;
  if (droppedLinks || droppedCodes || droppedTasks) {
    logger.warn({ droppedLinks, droppedCodes, droppedTasks }, 'Dropped invalid records during load');
  }

  return {
    migrated: schemaVersion !== DATA_SCHEMA_VERSION,
    normalized: {
      schemaVersion: DATA_SCHEMA_VERSION,
      links: cleanedLinks,
      linkCodes: cleanedCodes,
      assignedTasks: cleanedTasks,
    },
  };
}
```

### Data Backup Strategy

The system automatically creates backups:

```javascript
function backupDataFile(reason) {
  if (!fs.existsSync(DATA_FILE)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${DATA_FILE}.bak-${stamp}`;
  try {
    fs.copyFileSync(DATA_FILE, backupPath);
    logger.info({ backupPath, reason }, 'Created data backup');
  } catch (err) {
    logger.warn({ err }, 'Failed to create data backup');
  }
}
```

## Production Security Checklist

### Pre-Deployment Checklist:
- [ ] Set `AUTH_REQUIRED=true` in production
- [ ] Configure strong `JWT_SECRET` (minimum 32 characters)
- [ ] Set appropriate `LOG_LEVEL` for production
- [ ] Configure proper rate limiting values
- [ ] Enable HTTPS with valid certificates
- [ ] Set secure cookie attributes
- [ ] Configure proper CORS settings
- [ ] Set up monitoring and alerting

### Deployment Checklist:
- [ ] Use environment variables for all secrets
- [ ] Enable all security headers
- [ ] Configure proper database permissions
- [ ] Set up regular backups
- [ ] Implement request logging
- [ ] Configure error monitoring
- [ ] Set up health checks
- [ ] Enable automatic updates for dependencies

### Post-Deployment Checklist:
- [ ] Run security vulnerability scans
- [ ] Perform penetration testing
- [ ] Monitor for unusual activity
- [ ] Set up automated security updates
- [ ] Configure backup verification
- [ ] Implement incident response plan

## Common Security Issues & Solutions

### Issue: Invalid JWT Token
**Symptoms**: 401 Unauthorized errors
**Solution**:
1. Verify `JWT_SECRET` is set correctly
2. Check token expiration
3. Validate token signing algorithm
4. Ensure proper token format

### Issue: Rate Limit Exceeded
**Symptoms**: 429 Too Many Requests errors
**Solution**:
1. Check rate limit configuration
2. Implement client-side caching
3. Optimize API calls
4. Adjust rate limits if needed

### Issue: Input Validation Failure
**Symptoms**: 400 Bad Request errors
**Solution**:
1. Validate input format
2. Check field lengths
3. Ensure proper data types
4. Review validation rules

### Issue: Authentication Bypass
**Symptoms**: Unauthorized access
**Solution**:
1. Verify `AUTH_REQUIRED` is set to true
2. Check authorization middleware
3. Review role-based access control
4. Audit user permissions

### Issue: Data Corruption
**Symptoms**: Invalid data in database
**Solution**:
1. Restore from backup
2. Run data validation scripts
3. Check input sanitization
4. Review data migration processes

## Security Monitoring & Maintenance

### Logging Configuration
```javascript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});
```

### Security Monitoring Recommendations:
1. **Log all authentication attempts**
2. **Monitor for failed login attempts**
3. **Track rate limit violations**
4. **Alert on data validation failures**
5. **Monitor for unusual API patterns**
6. **Set up automated security scans**
7. **Implement regular security audits**

### Dependency Security:
- Regularly update all dependencies
- Use `npm audit` to check for vulnerabilities
- Implement automated dependency updates
- Monitor for security advisories
- Test updates in staging before production

This comprehensive security documentation covers all aspects of the Sibling Helper application's security implementation and provides best practices for secure deployment and operation.
