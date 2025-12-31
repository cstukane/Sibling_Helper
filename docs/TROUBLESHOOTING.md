# Sibling Helper - Troubleshooting Guide

## Table of Contents
1. [Common Issues & Solutions](#common-issues--solutions)
2. [Build & Development Problems](#build--development-problems)
3. [Authentication & Security Issues](#authentication--security-issues)
4. [Database & Data Problems](#database--data-problems)
5. [API & Server Issues](#api--server-issues)
6. [Performance & Optimization](#performance--optimization)
7. [Deployment & Production Issues](#deployment--production-issues)
8. [Error Messages & Codes](#error-messages--codes)
9. [Debugging Techniques](#debugging-techniques)

## Common Issues & Solutions

### Issue: Application Won't Start
**Symptoms**: `npm run dev` fails to start the application
**Possible Causes**:
- Missing dependencies
- Port already in use
- Configuration errors
- TypeScript compilation errors

**Solutions**:
1. **Install dependencies**:
   ```bash
   cd child-app && npm install
   cd parent-app && npm install
   cd server && npm install
   ```

2. **Check port availability**:
   ```bash
   # Find process using port (Windows)
   netstat -ano | findstr :5173
   # Kill process
   taskkill /PID <process-id> /F
   ```

3. **Check for TypeScript errors**:
   ```bash
   npm run build
   ```

4. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: White Screen / Blank Application
**Symptoms**: Application loads but shows blank screen
**Possible Causes**:
- JavaScript errors
- Missing assets
- Failed API calls
- Authentication issues

**Solutions**:
1. **Check browser console** for JavaScript errors (F12 > Console)
2. **Verify API server** is running and accessible
3. **Check network tab** for failed API requests
4. **Clear browser cache** and reload
5. **Check for TypeScript compilation** errors in build

### Issue: Data Not Persisting
**Symptoms**: Changes are lost after page refresh
**Possible Causes**:
- IndexedDB permission issues
- Browser private/incognito mode
- Storage quota exceeded
- Database corruption

**Solutions**:
1. **Check browser storage settings**
2. **Test in non-private browsing mode**
3. **Clear storage and restart**:
   ```bash
   node clear_storage.js
   ```
4. **Check storage quota**:
   ```javascript
   // In browser console
   navigator.storage.estimate().then(console.log);
   ```

## Build & Development Problems

### Issue: TypeScript Compilation Errors
**Symptoms**: `tsc` or build fails with type errors
**Common Errors**:
- Missing type definitions
- Incorrect type usage
- Path mapping issues

**Solutions**:
1. **Install missing types**:
   ```bash
   npm install --save-dev @types/node
   ```

2. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "strictNullChecks": true,
       "noImplicitReturns": true,
       "noUnusedLocals": true
     }
   }
   ```

3. **Verify path mappings** in tsconfig.json

### Issue: Dependency Conflicts
**Symptoms**: Build fails with version conflicts
**Solutions**:
1. **Check for conflicting versions**:
   ```bash
   npm ls <package-name>
   ```

2. **Update all dependencies**:
   ```bash
   npm update
   ```

3. **Use exact versions** in package.json

### Issue: Hot Reload Not Working
**Symptoms**: Changes don't reflect without manual refresh
**Solutions**:
1. **Restart development server**
2. **Check Vite configuration** in vite.config.ts
3. **Clear browser cache**
4. **Verify file watchers** are working

## Authentication & Security Issues

### Issue: Authentication Failed (401 Error)
**Symptoms**: API calls return 401 Unauthorized
**Possible Causes**:
- Missing or invalid JWT token
- Expired token
- Incorrect JWT_SECRET
- AUTH_REQUIRED not configured

**Solutions**:
1. **Verify JWT_SECRET** is set correctly
2. **Check token expiration**
3. **Validate token format**:
   ```javascript
   // Token should be in format: Bearer <token>
   const token = req.headers.authorization?.split(' ')[1];
   ```

4. **Check AUTH_REQUIRED** setting:
   ```bash
   # Should be 'true' for production
   AUTH_REQUIRED=true
   ```

### Issue: Forbidden Access (403 Error)
**Symptoms**: API calls return 403 Forbidden
**Possible Causes**:
- Insufficient permissions
- Role-based access denied
- Invalid user ID

**Solutions**:
1. **Check user role** in JWT token
2. **Verify authorization logic**:
   ```javascript
   // Check authorizeByRole function
   if (!authorizeByRole(req, res, { parentId, allowChild: false })) {
     // Access denied
   }
   ```

3. **Validate user ID** matches token subject

### Issue: Rate Limit Exceeded (429 Error)
**Symptoms**: API calls return 429 Too Many Requests
**Solutions**:
1. **Check rate limit configuration**:
   ```javascript
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 300, // 300 requests per window
   });
   ```

2. **Adjust rate limits** for development:
   ```bash
   RATE_LIMIT_WINDOW=60000  # 1 minute
   RATE_LIMIT_MAX=1000      # 1000 requests
   ```

3. **Implement client-side caching**

## Database & Data Problems

### Issue: Database Connection Failed
**Symptoms**: Database operations fail silently
**Possible Causes**:
- IndexedDB not supported
- Browser storage full
- Database corruption

**Solutions**:
1. **Check IndexedDB support**:
   ```javascript
   if (!window.indexedDB) {
     console.error('IndexedDB not supported');
   }
   ```

2. **Clear storage and restart**:
   ```bash
   node clear_storage.js
   ```

3. **Check storage quota**:
   ```javascript
   navigator.storage.estimate().then(console.log);
   ```

### Issue: Data Migration Failed
**Symptoms**: Application fails to load after update
**Possible Causes**:
- Schema version mismatch
- Data format changes
- Corrupted data

**Solutions**:
1. **Check schema version** in database
2. **Backup existing data**:
   ```bash
   # Backup before migration
   cp data/data.json data/data.json.backup
   ```

3. **Manual data cleanup**:
   ```javascript
   // In browser console
   indexedDB.deleteDatabase('sibling-helper-db');
   ```

### Issue: Data Validation Errors
**Symptoms**: Invalid data warnings in logs
**Possible Causes**:
- Corrupted records
- Invalid field values
- Schema violations

**Solutions**:
1. **Check validation logs**:
   ```bash
   # Look for warnings like:
   # "Dropped invalid records during load"
   ```

2. **Review validation functions**:
   ```javascript
   // Check cleanLink, cleanLinkCode, cleanAssignment functions
   ```

3. **Restore from backup** if data corruption is severe

## API & Server Issues

### Issue: API Server Won't Start
**Symptoms**: `node server/src/index.js` fails
**Possible Causes**:
- Missing dependencies
- Port conflict
- Configuration errors

**Solutions**:
1. **Install server dependencies**:
   ```bash
   cd server && npm install
   ```

2. **Check port availability**:
   ```bash
   # Change port if needed
   PORT=8080 node server/src/index.js
   ```

3. **Verify environment variables**:
   ```bash
   # Required for production
   AUTH_REQUIRED=true
   JWT_SECRET=your-secret-here
   ```

### Issue: CORS Errors
**Symptoms**: API calls fail with CORS errors
**Solutions**:
1. **Configure CORS properly**:
   ```javascript
   const corsOptions = {
     origin: ['http://localhost:5173', 'https://your-domain.com'],
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   };
   app.use(cors(corsOptions));
   ```

2. **Check server CORS configuration**

### Issue: API Timeout Errors
**Symptoms**: API calls hang or timeout
**Solutions**:
1. **Check server logs** for errors
2. **Increase timeout settings**
3. **Optimize database queries**
4. **Verify network connectivity**

## Performance & Optimization

### Issue: Slow Application Load
**Symptoms**: Application takes long time to load
**Possible Causes**:
- Large bundle size
- Unoptimized assets
- Slow database queries

**Solutions**:
1. **Analyze bundle size**:
   ```bash
   npm run build -- --mode analyze
   ```

2. **Optimize images and assets**
3. **Implement code splitting**
4. **Add database indexes**

### Issue: Memory Leaks
**Symptoms**: Application becomes slow over time
**Solutions**:
1. **Check for event listener leaks**
2. **Profile memory usage**:
   ```javascript
   // In browser console
   window.performance.memory
   ```

3. **Use React.memo** for component optimization

### Issue: High CPU Usage
**Symptoms**: Fan runs constantly, battery drain
**Solutions**:
1. **Check for infinite loops**
2. **Optimize rendering**:
   ```javascript
   // Use useMemo and useCallback
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   ```

3. **Debounce rapid updates**

## Deployment & Production Issues

### Issue: Production Build Fails
**Symptoms**: `npm run build` fails in production
**Possible Causes**:
- Missing production dependencies
- Environment configuration issues
- Build tool version mismatches

**Solutions**:
1. **Install production dependencies**:
   ```bash
   npm install --production
   ```

2. **Verify environment variables** are set
3. **Check Node.js version** compatibility

### Issue: HTTPS/SSL Configuration Errors
**Symptoms**: Mixed content warnings, SSL errors
**Solutions**:
1. **Configure proper SSL certificates**
2. **Set up HTTPS redirect**:
   ```javascript
   app.use((req, res, next) => {
     if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
       return res.redirect(301, `https://${req.headers.host}${req.url}`);
     }
     next();
   });
   ```

3. **Use HSTS headers**

### Issue: Scaling Problems
**Symptoms**: Performance degrades with multiple users
**Solutions**:
1. **Implement load balancing**
2. **Use database connection pooling**
3. **Add caching layer**:
   ```javascript
   const cache = new NodeCache({ stdTTL: 300 });
   ```

4. **Optimize rate limiting** for production

## Error Messages & Codes

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Verify authentication |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify endpoint/ID |
| 429 | Too Many Requests | Wait or adjust rate limits |
| 500 | Server Error | Check server logs |

### Common Error Messages

**Database Errors**:
- "Database connection failed" → Check IndexedDB support
- "Invalid schema version" → Run data migration
- "Data validation failed" → Check data format

**Authentication Errors**:
- "Invalid token" → Verify JWT_SECRET and token
- "Token expired" → Generate new token
- "Missing Authorization header" → Add Bearer token

**Validation Errors**:
- "Invalid ID format" → Use alphanumeric IDs only
- "Field too long" → Reduce input length
- "Invalid characters" → Use ASCII characters only

## Debugging Techniques

### Browser Debugging
1. **Open Developer Tools** (F12)
2. **Check Console** for errors
3. **Network Tab** for API issues
4. **Application Tab** for IndexedDB inspection
5. **Performance Tab** for profiling

### Server Debugging
1. **Enable debug logging**:
   ```bash
   LOG_LEVEL=debug node server/src/index.js
   ```

2. **Check server logs**:
   ```bash
   tail -f server.log
   ```

3. **Use API testing tools**:
   ```bash
   curl -v -H "Authorization: Bearer <token>" http://localhost:5050/api/health
   ```

### Database Debugging
1. **Inspect IndexedDB**:
   ```javascript
   // In browser console
   const dbRequest = indexedDB.open('sibling-helper-db');
   dbRequest.onsuccess = (event) => {
     const db = event.target.result;
     console.log('Database:', db);
   };
   ```

2. **Export data for analysis**:
   ```bash
   # Backup data file
   cp server/data/data.json server/data/debug.json
   ```

### Common Debugging Commands

```bash
# Check running processes
ps aux | grep node

# Check open ports
netstat -tuln | grep 5050

# Test API endpoints
curl -X POST -H "Content-Type: application/json" -d '{"parentId":"test"}' http://localhost:5050/api/link-codes

# Check environment variables
printenv | grep AUTH

# Clear all storage
node clear_storage.js
```

## Advanced Troubleshooting

### Data Recovery Procedures
1. **Restore from backup**:
   ```bash
   # Find latest backup
   ls -t server/data/*.bak* | head -1
   # Restore
   cp server/data/data.json.bak-<timestamp> server/data/data.json
   ```

2. **Manual data repair**:
   ```javascript
   // Use data validation functions
   const { normalized } = normalizeLoadedData(corruptedData);
   ```

### Performance Profiling
1. **Bundle analysis**:
   ```bash
   npm run build -- --mode analyze
   ```

2. **Memory profiling**:
   ```javascript
   // In browser
   window.performance.memory
   ```

3. **Network profiling**:
   ```javascript
   // Check network timing
   performance.getEntriesByType('navigation');
   ```

### Security Auditing
1. **Check for vulnerabilities**:
   ```bash
   npm audit
   ```

2. **Test authentication**:
   ```bash
   # Test with invalid token
   curl -H "Authorization: Bearer invalid" http://localhost:5050/api/health
   ```

3. **Check rate limiting**:
   ```bash
   # Test rate limit
   for i in {1..301}; do curl http://localhost:5050/api/health; done
   ```

This comprehensive troubleshooting guide provides solutions for the most common issues encountered during development, testing, and production use of the Sibling Helper application.
