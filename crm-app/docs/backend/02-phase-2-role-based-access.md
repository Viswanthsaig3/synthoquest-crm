# Phase 2: Role-Based Access Control (RBAC)

> **Duration**: Week 2-3 | **Priority**: CRITICAL | **Dependencies**: Phase 1

---

## Objective

Implement a comprehensive role-based access control system that enforces permissions across all layers (database, API, UI).

---

## Features

### 1. Permission Management
- Define granular permissions
- Map permissions to roles
- Check permissions efficiently
- Cache permission data

### 2. Role Management
- View roles and their permissions
- Assign roles to users
- Modify role permissions (admin only)
- Custom roles (future enhancement)

### 3. Permission Enforcement
- API route protection
- UI component protection
- Navigation filtering
- Action-level checks

### 4. Audit Trail
- Log permission checks
- Track role changes
- Monitor access attempts

---

## Permission System Design

### Permission Granularity

**Resource-Based**:
- `leads.view_all` - View all leads
- `leads.view_assigned` - View only assigned leads
- `leads.create` - Create new leads
- `leads.edit` - Edit leads
- `leads.delete` - Delete leads
- `leads.claim` - Claim unassigned leads
- `leads.call` - Make calls to leads
- `leads.convert` - Convert leads to students/interns

**Action-Based**:
- `view` - Read access
- `create` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records
- `approve` - Approve workflows
- `assign` - Assign to others

### Permission Hierarchy

```
admin
├── All permissions granted
└── Can manage roles

hr
├── Most permissions granted
├── HR-specific permissions
└── Cannot manage admin roles

team_lead
├── Team-related permissions
├── Approval permissions
└── Limited to team members

sales_rep
├── Lead management permissions
├── Own data permissions
└── Limited view permissions

employee
├── Own data permissions only
└── Basic operations
```

---

## Database Schema

### Permissions Table
```
Table: permissions

Fields:
- id: UUID, primary key
- key: VARCHAR(100), unique, not null (e.g., 'leads.view_all')
- name: VARCHAR(255), not null (e.g., 'View All Leads')
- description: TEXT
- resource: VARCHAR(100), not null (e.g., 'leads')
- action: VARCHAR(50), not null (e.g., 'view_all')
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_permissions_key on key
- idx_permissions_resource on resource

Constraints:
- key must be unique
- key format: {resource}.{action}
```

### Roles Table
```
Table: roles

Fields:
- id: UUID, primary key
- key: VARCHAR(50), unique, not null (e.g., 'admin', 'hr')
- name: VARCHAR(100), not null (e.g., 'Administrator')
- description: TEXT
- is_system: BOOLEAN, default false (cannot be deleted)
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()

Indexes:
- idx_roles_key on key

Constraints:
- key must be unique
- key must be lowercase with underscores
```

### Role Permissions Table
```
Table: role_permissions

Fields:
- id: UUID, primary key
- role_id: UUID, foreign key to roles.id
- permission_id: UUID, foreign key to permissions.id
- created_at: TIMESTAMPTZ, default now()
- created_by: UUID, foreign key to users.id

Indexes:
- idx_role_permissions_role_id on role_id
- idx_role_permissions_permission_id on permission_id

Constraints:
- role_id + permission_id must be unique
- Cascade delete on role delete
```

### User Roles Audit Table
```
Table: user_roles_audit

Fields:
- id: UUID, primary key
- user_id: UUID, not null
- old_role: VARCHAR(50)
- new_role: VARCHAR(50)
- changed_by: UUID, foreign key to users.id
- changed_at: TIMESTAMPTZ, default now()
- reason: TEXT

Indexes:
- idx_user_roles_audit_user_id on user_id
- idx_user_roles_audit_changed_at on changed_at

Constraints:
- user_id must exist in users table
- changed_by must exist in users table
```

### Permission Checks Audit Table
```
Table: permission_checks_audit

Fields:
- id: UUID, primary key
- user_id: UUID, not null
- permission: VARCHAR(100), not null
- resource: VARCHAR(100)
- resource_id: VARCHAR(255)
- granted: BOOLEAN, not null
- checked_at: TIMESTAMPTZ, default now()
- ip_address: VARCHAR(50)

Indexes:
- idx_permission_checks_user_id on user_id
- idx_permission_checks_checked_at on checked_at
- idx_permission_checks_granted on granted

Constraints:
- user_id must exist in users table

Note: Use with caution, can grow quickly
Consider: Only log denied permissions, or sample 10% of checks
```

---

## Permission Definitions

### CRM Permissions
```
leads.view_all          - View all leads
leads.view_assigned     - View only assigned leads
leads.create            - Create new leads
leads.edit              - Edit leads
leads.delete            - Delete leads
leads.claim             - Claim unassigned leads
leads.call              - Make calls to leads
leads.convert           - Convert leads to students/interns

students.view_all       - View all students
students.view_assigned  - View only assigned students
students.create         - Create new students
students.edit           - Edit students
students.enroll         - Enroll in courses

interns.view_all        - View all interns
interns.view_assigned   - View only assigned interns
interns.approve         - Approve intern applications
```

### HR Permissions
```
employees.view_all      - View all employees
employees.manage        - Create, edit, delete employees

tasks.view_all          - View all tasks
tasks.create            - Create tasks
tasks.assign            - Assign tasks to others
tasks.edit              - Edit tasks
tasks.delete            - Delete tasks
tasks.complete          - Mark tasks complete (own tasks)

timesheets.view_all     - View all timesheets
timesheets.submit       - Submit own timesheets
timesheets.approve      - Approve timesheets

attendance.view_team    - View team attendance

leaves.apply            - Apply for leave
leaves.approve          - Approve leave requests

payroll.view_all        - View all payroll
payroll.view_own        - View own payroll only
payroll.process         - Process payroll
```

### Operations Permissions
```
batches.view            - View batches
batches.create          - Create batches
batches.edit            - Edit batches
batches.manage          - Manage batch students

payments.view_all       - View all payments
payments.view_assigned  - View assigned payments
payments.create         - Record payments
payments.process        - Process refunds

certificates.view_all   - View all certificates
certificates.issue      - Issue certificates
```

### System Permissions
```
reports.view            - View reports
settings.manage         - Manage system settings
roles.manage            - Manage roles and permissions
```

---

## Role Definitions

### Admin Role
```
All permissions + special privileges:
- Manage all roles
- Access all features
- Delete any data
- Manage system settings
- View all reports
```

### HR Role
```
CRM:
- leads.view_all, leads.create, leads.claim
- students.view_all, students.create, students.edit, students.enroll
- interns.view_all, interns.approve

HR:
- employees.view_all, employees.manage
- tasks.view_all, tasks.create, tasks.assign
- timesheets.view_all, timesheets.approve
- attendance.view_team
- leaves.approve
- payroll.view_all, payroll.process

Operations:
- batches.view, batches.create, batches.edit
- payments.view_all, payments.create
- certificates.view_all, certificates.issue

System:
- reports.view
```

### Team Lead Role
```
CRM:
- leads.view_all, leads.create, leads.edit, leads.claim, leads.call, leads.convert
- students.view_assigned
- interns.view_all

HR:
- tasks.view_all, tasks.create, tasks.assign, tasks.edit
- timesheets.view_all, timesheets.approve
- attendance.view_team
- leaves.approve

System:
- reports.view
```

### Sales Rep Role
```
CRM:
- leads.view_assigned, leads.create, leads.edit, leads.claim, leads.call, leads.convert
- students.view_assigned
- payments.view_assigned

HR:
- tasks.complete
- timesheets.submit
- leaves.apply
```

### Employee Role
```
HR:
- tasks.complete
- timesheets.submit
- leaves.apply
- payroll.view_own
```

---

## API Endpoints

### Permission Endpoints

#### GET /api/permissions
```
Purpose: List all available permissions

Headers:
- Authorization: Bearer {accessToken}

Permission: roles.manage (admin only)

Process:
1. Verify authentication
2. Check permission
3. Fetch all permissions
4. Group by resource
5. Return grouped permissions

Response (200):
{
  "data": {
    "leads": [
      { "key": "leads.view_all", "name": "View All Leads", ... },
      ...
    ],
    "students": [ ... ],
    ...
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden
```

#### GET /api/roles
```
Purpose: List all roles with their permissions

Headers:
- Authorization: Bearer {accessToken}

Permission: roles.manage or employees.view_all

Process:
1. Verify authentication
2. Check permission
3. Fetch all roles
4. Include permissions for each role
5. Return roles list

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "key": "admin",
      "name": "Administrator",
      "permissions": ["leads.view_all", ...]
    },
    ...
  ]
}

Errors:
- 401: Unauthorized
- 403: Forbidden
```

#### PUT /api/roles/:key/permissions
```
Purpose: Update role permissions

Headers:
- Authorization: Bearer {accessToken}

Permission: roles.manage (admin only)

Request Body:
{
  "permissions": ["leads.view_all", "leads.create", ...]
}

Process:
1. Verify authentication
2. Check permission
3. Validate role exists
4. Check role is not system role (or is admin)
5. Validate all permissions exist
6. Delete existing role_permissions
7. Insert new role_permissions
8. Create audit log
9. Clear permission cache
10. Return updated role

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid permissions
- 401: Unauthorized
- 403: Forbidden
- 404: Role not found
- 409: Cannot modify system role
```

### User Role Endpoints

#### PUT /api/users/:id/role
```
Purpose: Change user's role

Headers:
- Authorization: Bearer {accessToken}

Permission: employees.manage (admin/HR)

Request Body:
{
  "role": "team_lead",
  "reason": "Promotion to team lead"
}

Process:
1. Verify authentication
2. Check permission
3. Validate user exists
4. Validate role exists
5. Check if changing own role (not allowed)
6. Check if demoting admin (admin only)
7. Update user role
8. Create audit log
9. Revoke all refresh tokens (force re-login)
10. Return updated user

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid role
- 401: Unauthorized
- 403: Forbidden
- 404: User not found
- 409: Cannot change own role
```

#### GET /api/users/:id/role-history
```
Purpose: Get user's role change history

Headers:
- Authorization: Bearer {accessToken}

Permission: employees.view_all or own profile

Process:
1. Verify authentication
2. Check permission (own profile or employees.view_all)
3. Fetch role change history
4. Include changer details
5. Return history

Response (200):
{
  "data": [
    {
      "oldRole": "sales_rep",
      "newRole": "team_lead",
      "changedBy": { "name": "...", ... },
      "changedAt": "...",
      "reason": "..."
    },
    ...
  ]
}

Errors:
- 401: Unauthorized
- 403: Forbidden
- 404: User not found
```

---

## Permission Middleware

### Auth Middleware Pattern
```
Middleware function signature:
(request, user) => Promise<NextResponse>

Flow:
1. Extract token from Authorization header
2. Verify JWT
3. Fetch user from database
4. Attach user to request context
5. Continue to handler
```

### Permission Check Middleware
```
Middleware function:
requirePermission(permission: string)

Flow:
1. Run auth middleware
2. Check if user has permission
3. If yes, continue
4. If no, return 403 Forbidden
```

### Resource Access Middleware
```
Middleware function:
requireResourceAccess(resource: string, resourceId: string)

Flow:
1. Run auth middleware
2. Check if user can access specific resource
3. Check ownership or team membership
4. If yes, continue
5. If no, return 403 Forbidden
```

---

## Frontend Integration

### Permission Context
```
Provide:
- user: Current user object
- permissions: Array of user's permissions
- hasPermission(key): Check if user has permission
- canViewAll(resource): Check view_all permission
- canViewAssigned(resource): Check view_assigned permission
- canCreate(resource): Check create permission
- canEdit(resource): Check edit permission
- canDelete(resource): Check delete permission
```

### PermissionGuard Component
```
Props:
- check: (user) => boolean
- fallback: React.ReactNode (optional)

Render:
- If check passes, render children
- If check fails, render fallback or null
```

### Navigation Filtering
```
Process:
1. Get all navigation items
2. Check permission for each item
3. Filter out items without permission
4. Render filtered navigation
```

### Action Buttons
```
Pattern:
{canCreate(user) && <CreateButton />}
{canEdit(user, resource) && <EditButton />}
{canDelete(user, resource) && <DeleteButton />}
```

---

## Caching Strategy

### Permission Cache
```
Structure:
{
  "user:{userId}:permissions": ["perm1", "perm2", ...]
}

TTL: 5 minutes

Invalidation:
- User role changed
- Role permissions changed
- Manual cache clear
```

### Cache Implementation
```
Using Redis (recommended):
- Store permission arrays
- Set TTL
- Invalidate on changes

Using in-memory (acceptable for small scale):
- Use Map with TTL
- Clear on server restart
- Limited to single instance
```

---

## Testing Checklist

### Permission Tests
- [ ] Admin has all permissions
- [ ] HR has correct permissions
- [ ] Team Lead has correct permissions
- [ ] Sales Rep has correct permissions
- [ ] Employee has correct permissions
- [ ] Permission check returns correct boolean
- [ ] Multiple permission checks work
- [ ] Resource-specific checks work

### Role Tests
- [ ] Roles can be listed
- [ ] Role permissions can be viewed
- [ ] Role permissions can be updated (admin)
- [ ] System roles cannot be modified
- [ ] User role can be changed
- [ ] Role change creates audit log
- [ ] Role change revokes tokens

### Integration Tests
- [ ] Permission middleware blocks unauthorized
- [ ] Permission middleware allows authorized
- [ ] PermissionGuard hides unauthorized UI
- [ ] Navigation filters correctly
- [ ] Action buttons show/hide correctly

### Audit Tests
- [ ] Permission denials are logged
- [ ] Role changes are logged
- [ ] Permission changes are logged
- [ ] Audit logs can be retrieved

---

## Success Criteria

- [ ] All permissions defined in database
- [ ] All roles have correct permissions
- [ ] Permission checks work in all layers
- [ ] UI filters based on permissions
- [ ] Navigation shows only accessible items
- [ ] API routes enforce permissions
- [ ] Audit logs capture permission changes
- [ ] Caching improves performance
- [ ] All tests pass
- [ ] No security vulnerabilities

---

## Migration Steps

### Step 1: Database Setup
1. Create permissions table
2. Create roles table
3. Create role_permissions table
4. Create audit tables
5. Seed default permissions
6. Seed default roles with permissions

### Step 2: Permission Utilities
1. Create permission query functions
2. Create permission check functions
3. Create permission cache utilities
4. Create audit logging functions

### Step 3: API Routes
1. Implement permission endpoints
2. Implement role endpoints
3. Implement user role endpoints
4. Add permission middleware
5. Test all endpoints

### Step 4: Frontend Integration
1. Update auth context with permissions
2. Update PermissionGuard component
3. Update navigation filtering
4. Update action button visibility
5. Test all UI elements

### Step 5: Testing & Deployment
1. Write unit tests
2. Write integration tests
3. Perform security testing
4. Deploy and test
5. Monitor audit logs

---

## Next Phase

After Phase 2 is complete and tested, proceed to:
- **Phase 3**: Timesheets

---

**Dependencies for Next Phase**:
- Users have roles
- Permission system is functional
- Permission checks work in API routes
- UI respects permissions