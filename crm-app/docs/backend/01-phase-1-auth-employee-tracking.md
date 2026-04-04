# Phase 1: Authentication & Employee Tracking

> **Duration**: Week 1-2 | **Priority**: CRITICAL | **Dependencies**: None

---

## Objective

Implement secure authentication system with employee tracking functionality. This is the foundation for all subsequent features.

---

## Features

### 1. User Authentication
- Login with email/password
- JWT token generation and validation
- Session management
- Logout functionality

### 2. Login Location Tracking
- Capture IP address on login
- Geocode IP to location (city, country)
- Store login history
- Display recent logins

### 3. Employee Management
- View all employees (admin/HR)
- View own profile (all roles)
- Update profile information
- Change password
- Employee status management

---

## Database Schema

### Users Table
```
Table: users

Fields:
- id: UUID, primary key
- email: VARCHAR(255), unique, not null
- password_hash: VARCHAR(255), not null
- name: VARCHAR(255), not null
- role: VARCHAR(50), not null (admin, hr, team_lead, sales_rep, employee)
- department: VARCHAR(100)
- phone: VARCHAR(20)
- avatar: VARCHAR(500)
- status: VARCHAR(20), default 'active' (active, inactive, suspended)
- managed_by: UUID, foreign key to users.id (for team structure)
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- last_login_at: TIMESTAMPTZ
- deleted_at: TIMESTAMPTZ (soft delete)

Indexes:
- idx_users_email on email
- idx_users_role on role
- idx_users_department on department
- idx_users_status on status

Constraints:
- email must be valid format
- role must be one of defined values
- status must be one of defined values
```

### Login Logs Table
```
Table: login_logs

Fields:
- id: UUID, primary key
- user_id: UUID, foreign key to users.id
- ip_address: VARCHAR(50)
- latitude: DECIMAL(10, 8)
- longitude: DECIMAL(11, 8)
- city: VARCHAR(100)
- region: VARCHAR(100)
- country: VARCHAR(100)
- user_agent: TEXT
- login_at: TIMESTAMPTZ, default now()
- logout_at: TIMESTAMPTZ
- session_duration: INTEGER (seconds)

Indexes:
- idx_login_logs_user_id on user_id
- idx_login_logs_login_at on login_at

Constraints:
- user_id must exist in users table
```

### Refresh Tokens Table
```
Table: refresh_tokens

Fields:
- id: UUID, primary key
- user_id: UUID, foreign key to users.id
- token_hash: VARCHAR(255), unique, not null
- expires_at: TIMESTAMPTZ, not null
- created_at: TIMESTAMPTZ, default now()
- revoked_at: TIMESTAMPTZ
- revoked_by: UUID, foreign key to users.id

Indexes:
- idx_refresh_tokens_user_id on user_id
- idx_refresh_tokens_token_hash on token_hash
- idx_refresh_tokens_expires_at on expires_at

Constraints:
- user_id must exist in users table
- token_hash must be unique
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
```
Purpose: Authenticate user and generate tokens

Request Body:
{
  "email": "string",
  "password": "string"
}

Validation:
- email: required, valid email format
- password: required, min 8 characters

Process:
1. Validate input
2. Check user exists
3. Verify password hash
4. Check user status (active)
5. Generate access token (15 min expiry)
6. Generate refresh token (7 days expiry)
7. Get IP address from request
8. Geocode IP to location
9. Create login log entry
10. Update user's last_login_at
11. Return tokens and user data

Response (200):
{
  "data": {
    "user": { ... },
    "accessToken": "string",
    "refreshToken": "string"
  }
}

Errors:
- 400: Invalid input
- 401: Invalid credentials
- 403: Account suspended/inactive
```

#### POST /api/auth/logout
```
Purpose: Logout user and revoke tokens

Headers:
- Authorization: Bearer {accessToken}

Process:
1. Verify access token
2. Revoke refresh token
3. Log logout time in login_logs

Response (200):
{
  "message": "Logged out successfully"
}

Errors:
- 401: Unauthorized
```

#### POST /api/auth/refresh
```
Purpose: Refresh access token using refresh token

Request Body:
{
  "refreshToken": "string"
}

Process:
1. Validate refresh token
2. Check token not revoked or expired
3. Generate new access token
4. Optionally rotate refresh token
5. Return new tokens

Response (200):
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}

Errors:
- 400: Invalid token
- 401: Token expired/revoked
```

#### GET /api/auth/me
```
Purpose: Get current authenticated user

Headers:
- Authorization: Bearer {accessToken}

Process:
1. Verify access token
2. Fetch user from database
3. Return user data

Response (200):
{
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "department": "string",
    ...
  }
}

Errors:
- 401: Unauthorized
```

### Employee Endpoints

#### GET /api/employees
```
Purpose: List all employees (admin/HR only)

Headers:
- Authorization: Bearer {accessToken}

Query Parameters:
- page: integer (default 1)
- limit: integer (default 20, max 100)
- department: string (filter)
- role: string (filter)
- status: string (filter)
- search: string (search by name/email)

Permission: employees.view_all

Process:
1. Verify authentication
2. Check permission
3. Build query with filters
4. Execute paginated query
5. Return employees list with pagination

Response (200):
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden
```

#### GET /api/employees/:id
```
Purpose: Get employee details

Headers:
- Authorization: Bearer {accessToken}

Permission:
- employees.view_all (for any employee)
- Own profile (always accessible)

Process:
1. Verify authentication
2. Check permission (own profile or employees.view_all)
3. Fetch employee data
4. Include login history (last 10)
5. Return employee details

Response (200):
{
  "data": {
    "id": "string",
    "name": "string",
    ...
    "recentLogins": [ ... ]
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden
- 404: Employee not found
```

#### PUT /api/employees/:id
```
Purpose: Update employee information

Headers:
- Authorization: Bearer {accessToken}

Permission:
- employees.manage (for any employee)
- Own profile (limited fields)

Request Body:
{
  "name": "string",
  "phone": "string",
  "department": "string" (admin/HR only),
  "role": "string" (admin only),
  "status": "string" (admin/HR only)
}

Process:
1. Verify authentication
2. Check permission
3. Validate input
4. Check for conflicts
5. Update employee
6. Create audit log
7. Return updated employee

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid input
- 401: Unauthorized
- 403: Forbidden
- 404: Employee not found
- 409: Email already exists
```

#### PUT /api/employees/:id/password
```
Purpose: Change employee password

Headers:
- Authorization: Bearer {accessToken}

Permission:
- employees.manage (for any employee, resets password)
- Own profile (requires current password)

Request Body:
{
  "currentPassword": "string" (required for own profile),
  "newPassword": "string"
}

Validation:
- newPassword: min 8 characters, must include number and special character

Process:
1. Verify authentication
2. Check permission
3. If own profile, verify current password
4. Hash new password
5. Update password
6. Revoke all refresh tokens (force re-login)
7. Create audit log

Response (200):
{
  "message": "Password updated successfully"
}

Errors:
- 400: Invalid input
- 401: Unauthorized, incorrect current password
- 403: Forbidden
- 404: Employee not found
```

---

## JWT Structure

### Access Token Payload
```
{
  "userId": "uuid",
  "email": "string",
  "role": "string",
  "iat": number (issued at timestamp),
  "exp": number (expiration timestamp, 15 minutes from iat)
}
```

### Refresh Token Payload
```
{
  "userId": "uuid",
  "tokenId": "uuid" (unique identifier for this token),
  "iat": number,
  "exp": number (7 days from iat)
}
```

### Token Storage
- Access Token: In-memory (JavaScript variable)
- Refresh Token: HttpOnly cookie with Secure flag

---

## Security Considerations

### Password Security
- Use bcrypt with cost factor 12
- Minimum 8 characters
- Require: 1 uppercase, 1 lowercase, 1 number, 1 special character
- Never log or expose password hashes
- Force password change on first login (optional)

### Token Security
- Sign tokens with strong secret (256 bits minimum)
- Use different secrets for access and refresh tokens
- Implement token rotation on refresh
- Revoke refresh tokens on password change
- Short expiry for access tokens (15 min)
- Implement token blacklist for immediate revocation

### Session Security
- Limit concurrent sessions (optional)
- Track active sessions
- Allow user to view and revoke sessions
- Implement logout on all devices option

### Login Security
- Rate limiting: Max 5 attempts per 15 minutes per IP
- Account lockout after 10 failed attempts (30 minutes)
- Log all login attempts (success and failure)
- Notify user of login from new location/device
- Implement 2FA (future enhancement)

### IP Geolocation
- Use reliable geolocation API
- Cache results to reduce API calls
- Handle API failures gracefully
- Store coordinates for mapping

---

## Frontend Integration

### Auth Context Updates
- Store access token in memory
- Store refresh token in cookie
- Auto-refresh token before expiry
- Redirect to login on 401
- Clear tokens on logout

### Login Page
- Email/password form
- Remember me option (extends refresh token to 30 days)
- Show login errors clearly
- Redirect to dashboard on success

### Employee List Page
- Show all employees (admin/HR)
- Filter by department, role, status
- Search by name/email
- Pagination
- Status indicators

### Employee Detail Page
- Profile information
- Edit capabilities (based on permissions)
- Change password
- Login history
- Session management

---

## Testing Checklist

### Authentication Tests
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] Login with locked account fails
- [ ] JWT token is valid and contains correct data
- [ ] Token refresh works correctly
- [ ] Token refresh with revoked token fails
- [ ] Logout revokes tokens
- [ ] Me endpoint returns correct user

### Permission Tests
- [ ] Admin can view all employees
- [ ] HR can view all employees
- [ ] Team Lead can view own team
- [ ] Employee can view own profile
- [ ] Employee cannot view others (without permission)
- [ ] Admin can update any employee
- [ ] User can update own profile
- [ ] User cannot update others (without permission)

### Security Tests
- [ ] SQL injection fails
- [ ] XSS attempts are sanitized
- [ ] CSRF protection works
- [ ] Rate limiting works
- [ ] Expired tokens are rejected
- [ ] Invalid signatures are rejected

### Integration Tests
- [ ] Full login flow works
- [ ] Token refresh flow works
- [ ] Password change flow works
- [ ] Employee CRUD operations work
- [ ] Login history is recorded

---

## Success Criteria

- [ ] Users can log in with email/password
- [ ] JWT tokens are generated and validated correctly
- [ ] Login location is captured and stored
- [ ] Employees can be viewed (with proper permissions)
- [ ] Employees can be updated (with proper permissions)
- [ ] Passwords can be changed
- [ ] All endpoints have proper authentication
- [ ] All endpoints have proper authorization
- [ ] All inputs are validated
- [ ] All errors are handled gracefully
- [ ] No security vulnerabilities
- [ ] All tests pass
- [ ] Build succeeds

---

## Migration Steps

### Step 1: Database Setup
1. Create users table with migration
2. Create login_logs table with migration
3. Create refresh_tokens table with migration
4. Add indexes
5. Add seed data for admin user

### Step 2: Query Functions
1. Create user query functions
2. Create login log query functions
3. Create refresh token query functions
4. Test queries with Supabase client

### Step 3: Auth Utilities
1. JWT generation and verification
2. Password hashing and comparison
3. IP geolocation function
4. Auth middleware

### Step 4: API Routes
1. Implement /api/auth/login
2. Implement /api/auth/logout
3. Implement /api/auth/refresh
4. Implement /api/auth/me
5. Test with Postman/curl

### Step 5: Employee Routes
1. Implement GET /api/employees
2. Implement GET /api/employees/:id
3. Implement PUT /api/employees/:id
4. Implement PUT /api/employees/:id/password
5. Test with different roles

### Step 6: Frontend Integration
1. Update auth context to use API
2. Update login page to use API
3. Update employee pages to use API
4. Remove mock data imports
5. Test all user flows

### Step 7: Testing & Deployment
1. Write unit tests
2. Write integration tests
3. Perform security testing
4. Deploy to staging
5. Test on staging
6. Deploy to production

---

## Next Phase

After Phase 1 is complete and tested, proceed to:
- **Phase 2**: Role-Based Access Control

---

**Dependencies for Next Phase**:
- Users must be able to log in
- User roles must be available in context
- Employee data must be accessible via API