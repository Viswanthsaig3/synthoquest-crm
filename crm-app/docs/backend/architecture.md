# Backend Architecture

> **Document Version**: 1.0.0 | **Last Updated**: 2026-04-04

---

## Architecture Overview

SynthoQuest CRM uses a **layered architecture** with clear separation of concerns.

```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│  React Components | Pages | UI Elements                 │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                      API LAYER                           │
│  Next.js API Routes | Middleware | Validation           │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                   │
│  Query Functions | Domain Logic | Business Rules        │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                     │
│  Supabase Client | Database Queries | Transactions      │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                      │
│  PostgreSQL | Tables | Indexes | Constraints | RLS      │
└────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Presentation Layer

**Location**: `src/app/`, `src/components/`

**Responsibilities**:
- Render UI
- Handle user interactions
- Validate user input (UX)
- Display loading/error states
- Route navigation

**Rules**:
- Never access database directly
- Always use API client
- Handle all error states
- Show loading indicators
- Validate on client (UX) but rely on server validation (security)

**Communication**:
- Calls API Layer via fetch/axios
- Uses React context for global state

---

### 2. API Layer

**Location**: `src/app/api/`

**Responsibilities**:
- Authenticate requests
- Authorize actions
- Validate input (security)
- Execute business logic
- Format responses
- Handle errors

**Rules**:
- Every route must authenticate
- Every route must authorize
- Validate ALL input with Zod
- Use consistent response format
- Log all errors
- Never expose internal errors to client

**Communication**:
- Receives HTTP requests from Presentation Layer
- Calls Business Logic Layer
- Returns HTTP responses

**Pattern**:
```
Request → Auth → Permission → Validate → Execute → Response
```

---

### 3. Business Logic Layer

**Location**: `src/lib/db/queries/`, `src/lib/`

**Responsibilities**:
- Implement business rules
- Orchestrate workflows
- Perform calculations
- Validate business constraints
- Manage transactions

**Rules**:
- Keep functions focused (single responsibility)
- Return typed data
- Throw descriptive errors
- Document complex logic
- Use transactions for multi-step operations

**Communication**:
- Called by API Layer
- Calls Data Access Layer

**Example Functions**:
- `getUserById(id)` - Fetch user
- `createUser(data)` - Create user with validation
- `approveTimesheet(id, approver)` - Workflow logic

---

### 4. Data Access Layer

**Location**: `src/lib/db/client.ts`

**Responsibilities**:
- Database connection management
- Query execution
- Transaction management
- Connection pooling

**Rules**:
- Single Supabase client instance
- Handle connection errors
- Use connection pooling
- Implement retry logic for transient errors

**Communication**:
- Called by Business Logic Layer
- Executes SQL queries

---

### 5. Database Layer

**Technology**: Supabase PostgreSQL

**Responsibilities**:
- Data storage
- Data integrity (constraints)
- Indexes for performance
- Row Level Security
- Triggers and functions

**Rules**:
- Use migrations for schema changes
- Implement soft delete
- Add proper indexes
- Use foreign key constraints
- Enable Row Level Security

---

## Request Flow

### Read Operation Flow
```
1. Client sends GET request
2. API route receives request
3. Auth middleware verifies JWT
4. Permission check (can view?)
5. Call query function
6. Query function calls Supabase
7. Supabase executes query
8. Data returned to query function
9. Data returned to API route
10. API route formats response
11. Response sent to client
```

### Write Operation Flow
```
1. Client sends POST/PUT/DELETE request
2. API route receives request
3. Auth middleware verifies JWT
4. Permission check (can create/edit/delete?)
5. Validate input with Zod
6. Call query function (with transaction if needed)
7. Query function executes in transaction
8. Create audit log entry
9. Commit transaction
10. Return result to API route
11. API route formats response
12. Response sent to client
```

---

## Directory Structure

```
src/
├── app/
│   ├── (auth)/                   # Auth pages
│   │   └── login/page.tsx
│   ├── (dashboard)/              # Dashboard pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── employees/
│   │   ├── timesheets/
│   │   ├── tasks/
│   │   └── ...
│   └── api/                      # API routes
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── refresh/route.ts
│       │   └── me/route.ts
│       ├── employees/
│       │   ├── route.ts          # GET, POST
│       │   └── [id]/
│       │       ├── route.ts      # GET, PUT, DELETE
│       │       └── role/route.ts
│       ├── timesheets/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── approve/route.ts
│       │       ├── reject/route.ts
│       │       └── entries/route.ts
│       └── tasks/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               ├── assign/route.ts
│               ├── start/route.ts
│               ├── complete/route.ts
│               ├── cancel/route.ts
│               └── comments/route.ts
│
├── components/
│   ├── ui/                       # Shadcn components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared components
│
├── context/
│   └── auth-context.tsx          # Auth context
│
├── hooks/                        # Custom hooks
│
├── lib/
│   ├── api/                      # API client utilities
│   │   ├── client.ts             # Fetch wrapper
│   │   └── endpoints.ts          # Endpoint constants
│   │
│   ├── auth/                     # Auth utilities
│   │   ├── jwt.ts                # JWT helpers
│   │   ├── middleware.ts         # Auth middleware
│   │   └── password.ts           # Password hashing
│   │
│   ├── db/                       # Database utilities
│   │   ├── client.ts             # Supabase client
│   │   ├── queries/              # Query functions
│   │   │   ├── users.ts
│   │   │   ├── employees.ts
│   │   │   ├── timesheets.ts
│   │   │   ├── tasks.ts
│   │   │   └── ...
│   │   └── migrations/           # SQL migrations
│   │
│   ├── constants.ts              # App constants
│   ├── permissions.ts            # Permission helpers
│   └── utils.ts                  # Utility functions
│
└── types/                        # TypeScript types
    ├── user.ts
    ├── employee.ts
    ├── timesheet.ts
    ├── task.ts
    └── ...
```

---

## Middleware Stack

### Authentication Middleware
```
Purpose: Verify JWT token and attach user to request

Process:
1. Extract token from Authorization header
2. Verify token signature
3. Check token expiration
4. Fetch user from database
5. Attach user to request context
6. Continue to next middleware/handler

Error Responses:
- 401: Missing token
- 401: Invalid token
- 401: Token expired
```

### Authorization Middleware
```
Purpose: Check if user has required permission

Process:
1. Receive required permission
2. Check if user has permission
3. If yes, continue
4. If no, return 403

Error Response:
- 403: Permission denied
```

### Validation Middleware
```
Purpose: Validate request body against schema

Process:
1. Receive Zod schema
2. Parse request body
3. Validate against schema
4. If valid, continue with validated data
5. If invalid, return 400 with errors

Error Response:
- 400: Validation errors with details
```

---

## Error Handling Strategy

### Error Types

**Application Errors**:
- Validation errors (user input)
- Business logic errors (business rules)
- Permission errors (authorization)

**System Errors**:
- Database errors
- Network errors
- External service errors

### Error Response Format
```json
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": []
}
```

### Error Logging
```
Log Format:
{
  "timestamp": "ISO 8601",
  "level": "error",
  "message": "Error description",
  "stack": "Stack trace",
  "context": {
    "userId": "uuid",
    "requestId": "uuid",
    "path": "/api/resource",
    "method": "POST"
  }
}
```

### Error Handling Layers
```
Presentation Layer:
- Display user-friendly message
- Show toast notification
- Log to console in development

API Layer:
- Catch all errors
- Log with context
- Return appropriate HTTP status
- Never expose internal details

Business Logic Layer:
- Throw descriptive errors
- Include error codes
- Document error conditions

Data Access Layer:
- Catch database errors
- Wrap in application errors
- Handle connection issues
```

---

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Server verifies credentials
3. Server generates JWT
4. Client stores token
5. Client sends token with each request
6. Server verifies token
7. Server attaches user to request
```

### Authorization Flow
```
1. User authenticated
2. User role determined
3. Role permissions loaded
4. Permission checked for action
5. If permitted, allow
6. If not, deny
```

### Data Access Security
```
Row Level Security (RLS):
- Enable RLS on all tables
- Define policies per role
- Enforce at database level

Query-Level Security:
- Always filter by user context
- Check ownership
- Verify team membership
```

### Input Validation
```
Client-Side (UX):
- Validate for user experience
- Show inline errors
- Prevent unnecessary requests

Server-Side (Security):
- Validate everything
- Never trust client
- Use Zod schemas
- Sanitize for SQL injection
- Encode for XSS
```

---

## Performance Considerations

### Database
```
Indexing Strategy:
- Index foreign keys
- Index frequently queried columns
- Index sort columns
- Composite indexes for common queries

Query Optimization:
- Select only needed columns
- Use pagination
- Avoid N+1 queries
- Use joins efficiently

Connection Pooling:
- Use Supabase connection pooler
- Limit concurrent connections
- Monitor connection usage
```

### Caching
```
Strategies:
- Permission caching (5 min TTL)
- Reference data caching
- Query result caching

Implementation:
- In-memory cache (small scale)
- Redis (production)
- Cache invalidation on updates
```

### API
```
Response Time Targets:
- Simple GET: < 100ms
- Complex GET: < 300ms
- POST/PUT: < 200ms

Pagination:
- Default limit: 20
- Maximum limit: 100
- Include total count
```

---

## Scalability Considerations

### Horizontal Scaling
```
Stateless API Routes:
- No server-side sessions
- JWT for authentication
- Database for state

Load Balancing:
- Vercel handles automatically
- Stateless routes scale easily
```

### Database Scaling
```
Read Replicas:
- Use for reporting
- Offload read traffic

Connection Pooling:
- Supabase pooler
- Limit per instance
```

### Future Considerations
```
Message Queue:
- For async tasks
- Email notifications
- Report generation

Microservices:
- Separate reporting service
- Notification service
- Analytics service
```

---

## Monitoring & Observability

### Metrics to Track
```
Application Metrics:
- Request count
- Response time
- Error rate
- Active users

Database Metrics:
- Query count
- Query time
- Connection count
- Lock waits

Business Metrics:
- User signups
- Feature usage
- Conversion rates
```

### Logging Strategy
```
Log Levels:
- ERROR: Application errors
- WARN: Unexpected but handled
- INFO: Significant events
- DEBUG: Development details

Log Context:
- User ID
- Request ID
- Timestamp
- Error details
```

### Alerting
```
Critical Alerts:
- Application down
- Database connection lost
- Error rate spike
- Response time degradation

Warning Alerts:
- High memory usage
- Slow queries
- Failed background jobs
```

---

## Backup & Recovery

### Database Backups
```
Automated Backups:
- Daily full backup
- Point-in-time recovery
- 30-day retention

Manual Backups:
- Before migrations
- Before major changes

Backup Testing:
- Monthly restore test
- Verify data integrity
```

### Disaster Recovery
```
Recovery Time Objective: 1 hour
Recovery Point Objective: 1 hour

Recovery Process:
1. Assess damage
2. Stop affected services
3. Restore from backup
4. Verify data integrity
5. Resume services
6. Monitor for issues
```

---

## Documentation Requirements

### API Documentation
- OpenAPI/Swagger specification
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error codes

### Architecture Decisions
- Record major decisions
- Explain rationale
- Document alternatives considered
- Track decision date

### Runbooks
- Deployment procedures
- Monitoring setup
- Incident response
- Recovery procedures