# SynthoQuest CRM - AI Agent Rules

> **AUDIENCE**: This document is for AI agents (Cursor, Claude, etc.)
> **VERSION**: 4.0.0 | **UPDATED**: 2026-04-04

---

## Project Context

**Project**: CRM for Cyber Security Institute
**Stack**: Next.js 14 | TypeScript | Tailwind | Shadcn/UI | Supabase | Custom JWT
**Roles**: admin, hr, team_lead, sales_rep, employee

---

## 1. Critical Rules (NEVER VIOLATE)

### Rule 1: Authentication
```
ALWAYS check authentication:
- Pages: const { isAuthenticated } = useAuth() → redirect to /login if false
- API routes: Verify JWT from Authorization header → return 401 if invalid
```

### Rule 2: Authorization
```
ALWAYS check permissions:
- Pages: <PermissionGuard check={canViewX}>
- Actions: {canDoX(user) && <Button>}
- API routes: if (!hasPermission(user, 'x.view')) return 403
```

### Rule 3: Input Validation
```
ALWAYS validate with Zod:
- Client: Use zodResolver with react-hook-form
- Server: Parse body with same Zod schema
- NEVER trust user input
```

### Rule 4: Error Handling
```
ALWAYS handle errors:
- Wrap async in try-catch
- Log to console.error
- Show toast to user
- Return safe default
```

### Rule 5: TypeScript
```
ALWAYS use strict types:
- NO any without justification
- Define types BEFORE implementing
- Use existing types from src/types/
```

---

## 2. Code Templates (COPY THESE)

### Database Query Template
```typescript
// src/lib/db/queries/{entity}.ts
import { supabase } from '../client'
import type { Entity } from '@/types/entity'

export async function getEntities(filters?: Filters): Promise<Entity[]> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getEntityById(id: string): Promise<Entity | null> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createEntity(entity: Omit<Entity, 'id' | 'created_at'>): Promise<Entity> {
  const { data, error } = await supabase
    .from('entities')
    .insert(entity)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
  const { data, error } = await supabase
    .from('entities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEntity(id: string): Promise<void> {
  const { error } = await supabase
    .from('entities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
```

### API Route Template
```typescript
// src/app/api/{entity}/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!canViewEntity(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    try {
      const data = await getEntities()
      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET /api/entity error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!canCreateEntity(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    try {
      const body = await request.json()
      const validated = schema.parse(body)
      const data = await createEntity(validated)
      return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('POST /api/entity error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}
```

### Page Component Template
```typescript
// src/app/(dashboard)/entity/page.tsx
'use client'

import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, PermissionGuard } from '@/components/shared'
import { canViewEntity } from '@/lib/permissions'

export default function EntityPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <PermissionGuard check={canViewEntity}>
      <div className="space-y-6">
        <Breadcrumb />
        <PageHeader title="Entities" description="Manage entities" />
        {/* content */}
      </div>
    </PermissionGuard>
  )
}
```

### Form Component Template
```typescript
// src/components/entity-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

export function EntityForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
```

---

## 3. File Placement Rules

```
ALWAYS place files in correct location:

API Routes:
  /api/{entity}/route.ts         → GET, POST
  /api/{entity}/[id]/route.ts    → GET, PUT, DELETE

Database Queries:
  /lib/db/queries/{entity}.ts    → All query functions

Types:
  /types/{entity}.ts             → Type definitions

UI Components:
  /components/ui/{component}.tsx → Shadcn components
  /components/layout/{name}.tsx  → Layout components
  /components/shared/{name}.tsx  → Reusable components

Pages:
  /app/(dashboard)/{entity}/page.tsx           → List page
  /app/(dashboard)/{entity}/[id]/page.tsx      → Detail page
  /app/(dashboard)/{entity}/new/page.tsx       → Create page

Permissions:
  /lib/permissions.ts            → All permission logic

Constants:
  /lib/constants.ts              → App-wide constants
```

---

## 4. Naming Conventions

```
Components:     PascalCase.tsx       → UserCard.tsx
Functions:      camelCase            → getUsers, handleSubmit
Variables:      camelCase            → userData, isLoading
Constants:      SCREAMING_SNAKE      → API_ENDPOINTS
Types:          PascalCase           → User, LeadStatus
Files:          kebab-case.tsx       → user-card.tsx
Folders:        kebab-case           → user-profile/
DB Tables:      snake_case           → user_profiles
API Routes:     kebab-case           → /api/user-profiles
```

---

## 5. Do / Don't Rules

### DO:
```
✅ Use PermissionGuard for page-level auth
✅ Use can* helpers for action-level auth
✅ Import Shadcn components from @/components/ui/
✅ Use query functions from lib/db/queries/
✅ Handle errors with try-catch
✅ Show loading states for async operations
✅ Show toast notifications for user feedback
✅ Use React Hook Form + Zod for all forms
✅ Add Breadcrumb component to every page
✅ Use soft delete (deleted_at column)
```

### DON'T:
```
❌ Call supabase directly in components
❌ Skip authentication checks
❌ Skip permission checks
❌ Use any type without justification
❌ Create custom components if Shadcn has equivalent
❌ Catch errors without showing feedback
❌ Hardcode API URLs (use constants)
❌ Leave console.log in production code
❌ Commit .env.local file
❌ Use raw SQL in components
```

---

## 6. Workflow Steps

### When Creating New Feature:
```
1. Create types in src/types/{entity}.ts
2. Add permissions in src/lib/permissions.ts
3. Create query functions in src/lib/db/queries/{entity}.ts
4. Create API route in src/app/api/{entity}/route.ts
5. Create page in src/app/(dashboard)/{entity}/page.tsx
6. Add navigation item in src/components/layout/sidebar.tsx
7. Test with different user roles
8. Run npm run lint && npm run build
```

### When Creating API Endpoint:
```
1. Define Zod schema for validation
2. Create route.ts file
3. Add withAuth middleware
4. Add permission checks
5. Implement GET/POST/PUT/DELETE
6. Handle all error cases
7. Return consistent response format
```

### When Creating Page:
```
1. Check user authentication
2. Add PermissionGuard
3. Add Breadcrumb
4. Add PageHeader
5. Implement content with loading/error states
6. Add permission checks for actions
```

### When Fixing Bug:
```
1. Reproduce the bug
2. Identify root cause
3. Fix with minimal changes
4. Test the fix
5. Check for similar issues elsewhere
```

---

## 7. Response Format Rules

### API Response Format:
```json
// Success
{ "data": {...}, "message": "optional" }

// List
{ "data": [...], "pagination": {"page": 1, "total": 100} }

// Error
{ "error": "message", "code": "OPTIONAL", "details": [...] }
```

### HTTP Status Codes:
```
200 → Success (GET, PUT)
201 → Created (POST)
204 → No Content (DELETE)
400 → Validation Error
401 → Unauthorized
403 → Forbidden
404 → Not Found
500 → Internal Error
```

---

## 8. Permission Matrix

| Role | Leads | Students | Interns | Tasks | Timesheets | Payroll |
|------|-------|----------|---------|-------|------------|---------|
| admin | all | all | all | all | all | all |
| hr | all | all | all | all | all | all |
| team_lead | all | assigned | all | all | approve | none |
| sales_rep | assigned | assigned | none | complete | own | none |
| employee | none | none | none | complete | own | own |

### Permission Helper Pattern:
```typescript
// In lib/permissions.ts
export function canViewAllLeads(user: User): boolean {
  return hasPermission(user, 'leads.view_all')
}

export function canViewAssignedLeads(user: User): boolean {
  return hasPermission(user, 'leads.view_assigned')
}

export function canViewLeads(user: User): boolean {
  return canViewAllLeads(user) || canViewAssignedLeads(user)
}
```

---

## 9. Component Rules

### Server vs Client Components:
```
DEFAULT: Server Component (no 'use client')

USE 'use client' ONLY when:
- onClick, onChange handlers
- useState, useEffect hooks
- localStorage, window APIs
- Third-party libs requiring client
```

### Shadcn Component Usage:
```
ALWAYS import from @/components/ui/
NEVER modify Shadcn component files
Customize via className prop only

Common imports:
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
```

---

## 10. Error Handling Pattern

```typescript
// ALWAYS use this pattern
try {
  const result = await asyncOperation()
  toast({ title: 'Success', description: 'Operation completed' })
  return result
} catch (error) {
  console.error('Operation failed:', error)
  toast({
    title: 'Error',
    description: 'Failed to complete operation. Please try again.',
    variant: 'destructive',
  })
  return defaultValue // Safe fallback
}
```

---

## 11. Environment Variables

```bash
# Client-side (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side only (NO prefix)
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
```

---

## 12. Git Rules

### Branch Names:
```
feature/CRM-123-description
bugfix/CRM-456-description
hotfix/CRM-789-description
```

### Commit Messages:
```
feat(entity): add feature
fix(entity): fix bug
refactor(entity): improve code
docs: update documentation
```

### Before Committing:
```bash
npm run lint
npm run build
# Remove console.log statements
# Check for hardcoded values
```

---

## 13. If Unsure

```
If unsure about implementation:
1. Check existing code patterns in codebase
2. Follow existing file structure
3. Copy existing similar component/route
4. Do NOT create new architecture patterns
5. Ask user for clarification
```

---

## 14. Common Mistakes to Avoid

```
❌ Forgetting PermissionGuard on new pages
❌ Not checking user before accessing properties
❌ Using supabase directly in components instead of query functions
❌ Forgetting to add new pages to sidebar navigation
❌ Not handling loading states
❌ Not handling error states
❌ Forgetting to validate on server side
❌ Using any type
❌ Hardcoding values that should be in env vars
❌ Creating new components when Shadcn has equivalent
```

---

## 15. Quick Checks Before Creating PR

```
□ Types defined in src/types/?
□ Permissions added to lib/permissions.ts?
□ Query functions in lib/db/queries/?
□ API routes have auth + permission checks?
□ Pages have PermissionGuard?
□ Loading states implemented?
□ Error handling implemented?
□ Toast notifications added?
□ Added to sidebar navigation?
□ npm run lint passes?
□ npm run build passes?
□ Tested with different user roles?
```

---

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production
npm run lint         # Run ESLint
```

---

**END OF DOCUMENT**