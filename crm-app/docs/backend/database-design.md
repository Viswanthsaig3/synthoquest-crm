# Database Design Guidelines

> **Document Version**: 1.0.0 | **Last Updated**: 2026-04-04

---

## Database Platform

**Technology**: Supabase PostgreSQL
**Version**: PostgreSQL 15+
**Features**: 
- Managed PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions
- Automatic backups
- Connection pooling

---

## Naming Conventions

### Tables
```
Format: snake_case, singular

Examples:
- user (not users)
- employee_profile
- timesheet_entry
- task_comment
```

### Columns
```
Format: snake_case

Primary Keys: id
Foreign Keys: {table}_id
Timestamps: {action}_at
Status: status
Booleans: is_{state}
```

### Indexes
```
Format: idx_{table}_{columns}

Examples:
- idx_users_email
- idx_tasks_assigned_to
- idx_timesheets_employee_week
```

### Constraints
```
Foreign Keys: fk_{table}_{column}
Unique: uq_{table}_{columns}
Check: ck_{table}_{condition}
```

---

## Data Types

### Identifiers
```
Primary Keys:
- Type: UUID
- Default: gen_random_uuid()
- Never use sequential integers for security

Foreign Keys:
- Type: UUID
- Must match referenced primary key
```

### Text
```
VARCHAR(n): When max length known
TEXT: When length varies significantly
Never use CHAR
```

### Numbers
```
INTEGER: Whole numbers
DECIMAL(p,s): Financial/currency
SERIAL: NEVER use (use UUID instead)
```

### Dates/Times
```
DATE: Date only
TIME: Time only
TIMESTAMPTZ: Date + time + timezone (RECOMMENDED)
TIMESTAMP: Only if timezone not needed

Always use TIMESTAMPTZ for:
- created_at
- updated_at
- Any timestamp that matters
```

### Boolean
```
BOOLEAN: True/false
Never use INTEGER for booleans
Default values preferred
```

### JSON
```
JSONB: When needed (RECOMMENDED over JSON)
Use for:
- Flexible schemas
- User preferences
- Metadata
- Dynamic fields

Avoid for:
- Frequently queried data
- Data that needs constraints
```

### Arrays
```
TEXT[]: String arrays
UUID[]: UUID arrays
INTEGER[]: Integer arrays

Use for:
- Tags
- Lists
- Multiple references (rare)
```

---

## Table Design Patterns

### Standard Columns
```
Every table should have:

id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
deleted_at      TIMESTAMPTZ (for soft delete)

Optional:
created_by      UUID REFERENCES users(id)
updated_by      UUID REFERENCES users(id)
```

### Soft Delete Pattern
```
Column: deleted_at TIMESTAMPTZ

Query Pattern:
- SELECT ... WHERE deleted_at IS NULL
- UPDATE ... SET deleted_at = NOW()

Benefits:
- Data recovery
- Audit trail
- Undo capability

Index:
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
```

### Audit Columns
```
created_at      TIMESTAMPTZ DEFAULT NOW()
created_by      UUID REFERENCES users(id)
updated_at      TIMESTAMPTZ DEFAULT NOW()
updated_by      UUID REFERENCES users(id)

Trigger to update updated_at:
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER {table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

---

## Relationships

### One-to-One
```
Example: User ↔ EmployeeProfile

users:
  id UUID PRIMARY KEY

employee_profiles:
  id UUID PRIMARY KEY
  user_id UUID UNIQUE REFERENCES users(id)
```

### One-to-Many
```
Example: User → Tasks

users:
  id UUID PRIMARY KEY

tasks:
  id UUID PRIMARY KEY
  assigned_to UUID REFERENCES users(id)
```

### Many-to-Many
```
Example: Users ↔ Projects (through ProjectMembers)

users:
  id UUID PRIMARY KEY

projects:
  id UUID PRIMARY KEY

project_members:
  id UUID PRIMARY KEY
  project_id UUID REFERENCES projects(id)
  user_id UUID REFERENCES users(id)
  role VARCHAR(50)
  
  UNIQUE(project_id, user_id)
```

### Self-Referencing
```
Example: Users hierarchy

users:
  id UUID PRIMARY KEY
  managed_by UUID REFERENCES users(id)
```

---

## Indexes

### When to Index
```
ALWAYS index:
- Primary keys (automatic)
- Foreign keys
- Columns in WHERE clauses
- Columns in ORDER BY
- Columns in GROUP BY

CONSIDER:
- Frequently queried combinations
- Partial indexes for common filters
```

### Index Types
```
B-tree (default):
- Equality comparisons
- Range queries
- Most use cases

GIN:
- JSONB
- Arrays
- Full-text search

Partial Index:
- WHERE deleted_at IS NULL
- WHERE status = 'active'
```

### Composite Indexes
```
Order matters: Most selective first

Example: Timesheet queries
CREATE INDEX idx_timesheets_employee_week 
ON timesheets(employee_id, week_start_date);

Query benefits:
WHERE employee_id = ? AND week_start_date = ?
WHERE employee_id = ?

Does NOT help:
WHERE week_start_date = ?
```

### Index Guidelines
```
DO:
- Index foreign keys
- Index status columns
- Index date ranges
- Use composite indexes for common queries

DON'T:
- Over-index
- Index small tables
- Index frequently updated columns unnecessarily
- Index without measuring impact
```

---

## Constraints

### Primary Keys
```
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Keys
```
Format:
{column} UUID REFERENCES {table}(id)

Actions:
ON DELETE CASCADE (if dependent records should be deleted)
ON DELETE SET NULL (if reference is optional)
ON DELETE RESTRICT (if cannot delete while referenced)

Example:
assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
```

### Unique Constraints
```
Single column:
email VARCHAR(255) UNIQUE

Multiple columns:
CONSTRAINT uq_timesheet_week UNIQUE(employee_id, week_start_date)

Partial unique (with soft delete):
CREATE UNIQUE INDEX uq_user_email 
ON users(email) 
WHERE deleted_at IS NULL;
```

### Check Constraints
```
Range validation:
CHECK (progress_percentage >= 0 AND progress_percentage <= 100)

Status validation:
CHECK (status IN ('pending', 'active', 'completed'))

Date validation:
CHECK (end_date >= start_date)
```

### Not Null
```
Use NOT NULL when:
- Data is required
- Default value not appropriate

Avoid NOT NULL when:
- Data is optional
- Default value exists
- Foreign keys with SET NULL
```

---

## Row Level Security (RLS)

### Enable RLS
```
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
```

### Policy Types
```
SELECT: Read access
INSERT: Create access
UPDATE: Modify access
DELETE: Remove access
ALL: All operations
```

### Common Patterns

#### User Owns Record
```
CREATE POLICY "Users can view own records"
ON {table} FOR SELECT
USING (user_id = auth.uid());
```

#### Role-Based Access
```
CREATE POLICY "Admins have full access"
ON {table} FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

#### Team Access
```
CREATE POLICY "Team leads manage team records"
ON {table} FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users team_member
    WHERE team_member.id = {table}.user_id
    AND team_member.managed_by = auth.uid()
  )
);
```

#### Soft Delete Filter
```
CREATE POLICY "Exclude deleted records"
ON {table} FOR SELECT
USING (deleted_at IS NULL);
```

### Bypass RLS
```
Service role bypasses RLS
Use for:
- Background jobs
- System operations
- Migrations

NEVER bypass RLS for user requests
```

---

## Migrations

### Migration Files
```
Naming: {timestamp}_{description}.sql

Examples:
20260404_create_users_table.sql
20260405_add_role_to_users.sql
20260406_create_timesheets.sql
```

### Migration Structure
```
-- Up migration
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Down migration (rollback)
DROP TABLE IF EXISTS example;
```

### Best Practices
```
- One logical change per migration
- Always include rollback
- Test migrations locally first
- Test rollback works
- Never modify applied migrations
- Use transactions
```

---

## Query Performance

### Query Optimization
```
SELECT only needed columns:
NO: SELECT *
YES: SELECT id, name, email

Use LIMIT:
SELECT ... LIMIT 20

Avoid N+1:
Use JOINs or batch queries

Use EXPLAIN ANALYZE to understand query plans
```

### Pagination
```
Offset-based:
SELECT * FROM items
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

Cursor-based (better for large datasets):
SELECT * FROM items
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT 20;
```

### Common Table Expressions (CTEs)
```
Use for:
- Complex queries
- Readability
- Reusable subqueries

Example:
WITH user_tasks AS (
  SELECT * FROM tasks WHERE assigned_to = $userId
)
SELECT * FROM user_tasks WHERE status = 'pending';
```

---

## Data Integrity

### Referential Integrity
```
Foreign keys ensure:
- No orphan records
- Valid references
- Cascading updates/deletes
```

### Entity Integrity
```
Primary keys ensure:
- Unique identification
- No duplicate records
```

### Domain Integrity
```
Constraints ensure:
- Valid data values
- Correct formats
- Business rules
```

### User-Defined Integrity
```
Triggers and functions:
- Complex validation
- Cross-table rules
- Automatic calculations
```

---

## Backup Strategy

### Automated Backups
```
Supabase provides:
- Daily automated backups
- Point-in-time recovery
- 7-day retention (free tier)
- Longer retention (paid)

Additional backups:
- Before migrations
- Before major changes
```

### Backup Verification
```
Regular testing:
- Restore to test environment
- Verify data integrity
- Test recovery procedures
```

---

## Monitoring

### Metrics to Track
```
Performance:
- Query execution time
- Slow queries
- Lock waits
- Connection count

Storage:
- Table sizes
- Index sizes
- Bloat
- Growth rate
```

### Query Logging
```
Log slow queries:
- Queries > 100ms
- Queries with high resource usage
- Queries causing locks
```

### Health Checks
```
Regular checks:
- Connection pool status
- Replication lag (if applicable)
- Disk usage
- Index usage
```

---

## Security

### Database Users
```
Principles:
- Minimum necessary privileges
- Separate users per application
- No superuser for application

Users:
- app_user: Normal operations
- app_admin: Administrative operations
- app_service: Background jobs
```

### Connection Security
```
SSL required:
- All connections encrypted
- Certificate verification

Network:
- Private network access
- IP whitelisting
- VPN for admin access
```

### Data Encryption
```
At Rest:
- Transparent encryption (Supabase)
- Column encryption for sensitive data

In Transit:
- TLS 1.2+ required
- Certificate verification
```

---

## Schema Version Control

### Version Table
```
CREATE TABLE schema_versions (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);
```

### Migration Tracking
```
Record each migration:
INSERT INTO schema_versions (version, description)
VALUES ('20260404', 'Create users table');
```

---

**End of Database Design Guidelines**