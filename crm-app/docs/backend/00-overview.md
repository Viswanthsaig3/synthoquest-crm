# Backend Implementation - Overview

> **Document Version**: 1.0.0 | **Last Updated**: 2026-04-04

---

## Purpose

This document outlines the backend implementation strategy for SynthoQuest CRM. The goal is to build a **functional application first**, then **iteratively add backend** to one feature at a time.

---

## Implementation Philosophy

### Core Principles

1. **Functional First**: Every feature should work end-to-end before moving to next
2. **Iterative Backend**: Migrate from mock data to real backend one feature at a time
3. **Security by Design**: Every endpoint, every query must be secure from day one
4. **Type Safety**: TypeScript types must match database schema exactly
5. **Testable**: Each feature should be testable in isolation

### Migration Strategy

```
Mock Data → Database Schema → Query Functions → API Routes → UI Updates → Testing
```

**NOT**: Build all APIs at once
**YES**: Complete one feature end-to-end before next

---

## Phase Overview

### Phase 1: Authentication & Employee Tracking (Week 1-2)
**Priority**: CRITICAL
**Dependencies**: None

**Features**:
- User login with JWT
- Location tracking on login
- Employee CRUD operations
- Session management

**Why First**: Everything else depends on authentication and user context

---

### Phase 2: Role-Based Access Control (Week 2-3)
**Priority**: CRITICAL
**Dependencies**: Phase 1

**Features**:
- Permission system implementation
- Role management
- Dynamic permission checks
- UI permission guards

**Why Second**: Security and access control needed before exposing data

---

### Phase 3: Timesheets (Week 3-4)
**Priority**: HIGH
**Dependencies**: Phase 1, Phase 2

**Features**:
- Timesheet submission
- Approval workflow
- Hours calculation
- Weekly/Monthly views

**Why Third**: Core HR functionality, depends on employee tracking

---

### Phase 4: Task Assignment (Week 4-5)
**Priority**: HIGH
**Dependencies**: Phase 1, Phase 2

**Features**:
- Task CRUD operations
- Assignment workflow
- Status tracking
- Notifications

**Why Fourth**: Depends on employee tracking and permissions

---

### Phase 5: Next Features (Week 6+)
**Priority**: MEDIUM
**Dependencies**: All previous phases

**Features**:
- Leads management
- Student enrollment
- Batch management
- Payments tracking
- Intern management

**Why Later**: These are CRM-specific features, not core HR

---

## Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 14 API Routes | REST endpoints |
| Database | Supabase PostgreSQL | Primary data store |
| Auth | Custom JWT | Authentication |
| Validation | Zod | Input validation |
| Password | bcrypt | Hashing |
| Geo | IP Geolocation API | Login tracking |

### Why This Stack

**Next.js API Routes**:
- Same codebase as frontend
- TypeScript end-to-end
- No separate server deployment
- Serverless-friendly

**Supabase PostgreSQL**:
- Managed PostgreSQL
- Row Level Security
- Real-time capabilities
- Built-in auth (optional)

**Custom JWT**:
- Full control over tokens
- No vendor lock-in
- Easy to test
- Works with any frontend

---

## Architecture Layers

```
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
│  - React Components                 │
│  - State Management                 │
│  - API Client                       │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         API Routes (/api/*)         │
│  - Authentication Middleware        │
│  - Permission Checks                │
│  - Input Validation (Zod)           │
│  - Business Logic                   │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Query Functions (lib/db/queries)│
│  - Type-safe database queries       │
│  - Error handling                   │
│  - Data transformations             │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      Database (Supabase Postgres)   │
│  - Tables & Relations               │
│  - Row Level Security               │
│  - Indexes                          │
│  - Constraints                      │
└─────────────────────────────────────┘
```

---

## Security Architecture

### Defense Layers

**Layer 1: Authentication**
- JWT verification on every request
- Token expiration (15 min access, 7 days refresh)
- Secure cookie storage for refresh token

**Layer 2: Authorization**
- Role-based permissions
- Resource-level access control
- Action-level permission checks

**Layer 3: Input Validation**
- Client-side validation (UX)
- Server-side validation (security)
- Parameterized queries (SQL injection prevention)

**Layer 4: Data Protection**
- Row Level Security in database
- Soft delete for audit trail
- Encryption at rest (Supabase handles)
- HTTPS in transit

**Layer 5: Audit & Monitoring**
- Login tracking with location
- Action logging
- Error tracking
- Performance monitoring

---

## Data Flow Pattern

### Read Operation
```
User Request → Auth Check → Permission Check → Query Function → Database → Response
```

### Write Operation
```
User Request → Auth Check → Permission Check → Validate Input → 
Business Logic → Query Function → Database → Audit Log → Response
```

---

## Error Handling Strategy

### Error Categories

**Client Errors (4xx)**:
- 400: Invalid input, validation failed
- 401: Not authenticated
- 403: Not authorized
- 404: Resource not found
- 409: Conflict (duplicate, constraint violation)

**Server Errors (5xx)**:
- 500: Unexpected errors
- Log full stack trace
- Return generic message to client

### Error Response Format
```json
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": []
}
```

---

## Testing Strategy

### Unit Tests
- Permission functions
- Validation schemas
- Utility functions
- Business logic

### Integration Tests
- API routes
- Database queries
- Authentication flow
- Permission enforcement

### End-to-End Tests
- Critical user flows
- Multi-step workflows
- Role-based scenarios

---

## Migration Approach

### From Mock to Real Data

**Step 1**: Create database schema
**Step 2**: Create query functions
**Step 3**: Create API routes
**Step 4**: Update frontend to use API
**Step 5**: Remove mock data imports
**Step 6**: Test thoroughly

### Per Feature

```
Feature X:
1. Design schema → Create migration
2. Write query functions → Test queries
3. Build API routes → Test endpoints
4. Update UI components → Test UI
5. Write tests → Verify coverage
6. Deploy → Monitor
```

---

## Rollout Plan

### Week 1-2: Phase 1
- Authentication system
- Employee management
- Basic UI updates
- Testing

### Week 2-3: Phase 2
- Permission system
- Role management
- UI guards
- Testing

### Week 3-4: Phase 3
- Timesheets
- Approval workflows
- Testing

### Week 4-5: Phase 4
- Tasks
- Assignments
- Testing

### Week 6+: Phase 5
- CRM features
- Advanced features
- Optimization

---

## Success Criteria

### Each Phase Must Have:
- ✅ Working feature end-to-end
- ✅ All security checks in place
- ✅ Error handling implemented
- ✅ Loading states in UI
- ✅ Tested with all roles
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build passes

### Phase Dependencies

```
Phase 1 (Auth) ──┬──> Phase 2 (RBAC) ──┬──> Phase 5 (CRM)
                  │                       │
                  └──> Phase 3 (Timesheets)
                  │
                  └──> Phase 4 (Tasks)
```

---

## Risk Mitigation

### Technical Risks

**Risk**: Database migration errors
**Mitigation**: Test migrations on copy of database first, have rollback plan

**Risk**: Authentication bypass
**Mitigation**: Every endpoint checks auth, penetration testing

**Risk**: Performance issues
**Mitigation**: Database indexes, query optimization, caching

**Risk**: Data loss
**Mitigation**: Regular backups, soft delete, audit logs

### Process Risks

**Risk**: Feature creep
**Mitigation**: Stick to phase plan, defer non-critical features

**Risk**: Integration issues
**Mitigation**: Test each phase thoroughly before next

**Risk**: Security vulnerabilities
**Mitigation**: Security review for each phase, follow OWASP guidelines

---

## Documentation Structure

```
docs/backend/
├── 00-overview.md (this file)
├── 01-phase-1-auth-employee-tracking.md
├── 02-phase-2-role-based-access.md
├── 03-phase-3-timesheets.md
├── 04-phase-4-tasks-assignment.md
├── 05-phase-5-next-features.md
├── architecture.md
├── security.md
├── database-design.md
└── api-design.md
```

---

## References

### External Documentation
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Supabase Documentation: https://supabase.com/docs
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://auth0.com/blog/jwt-authentication-best-practices/

### Internal Documentation
- AGENTS.md: Development rules and patterns
- README.md: Project setup instructions

---

**Next Document**: 01-phase-1-auth-employee-tracking.md