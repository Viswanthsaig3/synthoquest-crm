# Leave Management System - Implementation Complete ✅

## Overview
The leave management feature has been fully integrated into SynthoQuest CRM with database-driven functionality, replacing all mock data with real API endpoints and database operations.

---

## What Was Implemented

### 1. Database Schema ✅

**Tables Created:**
- `leaves` - Stores leave requests with status tracking
- `leave_balances` - Monthly customizable leave allocations

**Key Features:**
- Monthly leave balance allocation (customizable by admin/HR)
- Single-level approval workflow
- Status tracking: pending → approved/rejected → cancelled
- Automatic balance updates on approval/cancellation
- Row Level Security (RLS) for data protection

### 2. Permissions Added ✅

New permissions in the system:
- `leaves.view_all` - View all employee leaves
- `leaves.manage_balances` - Manage monthly leave allocations
- `leaves.cancel` - Cancel approved leaves

Existing permissions:
- `leaves.apply` - Apply for leave
- `leaves.approve` - Approve/reject leave requests

### 3. API Endpoints Created ✅

**Leave Management:**
- `GET /api/leaves` - List leaves (permission-based filtering)
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/[id]` - Get single leave
- `PUT /api/leaves/[id]` - Update leave (pending only)
- `DELETE /api/leaves/[id]` - Delete leave (pending only)
- `POST /api/leaves/[id]/approve` - Approve leave
- `POST /api/leaves/[id]/reject` - Reject leave (with reason)
- `POST /api/leaves/[id]/cancel` - Cancel approved leave (with reason)

**Leave Balance Management:**
- `GET /api/leaves/balance` - Get current balance
- `POST /api/leaves/balance` - Initialize balance
- `PUT /api/leaves/balance` - Update allocations

### 4. Frontend Pages Updated ✅

**All 4 leave pages now use real data:**

1. **Overview Page** (`/leaves`)
   - Real leave history
   - Live balance display
   - Pending requests for approvers
   - Loading states and error handling

2. **Apply Page** (`/leaves/apply`)
   - Real balance validation
   - API submission
   - Date range validation
   - Success/error feedback

3. **Approvals Page** (`/leaves/approvals`)
   - Real pending requests
   - Approve/reject with API calls
   - Rejection reason modal
   - Real-time updates

4. **Calendar Page** (`/leaves/calendar`)
   - Real leave data on calendar
   - Team member filtering
   - Monthly navigation

### 5. Navigation Integration ✅

- Added to sidebar navigation
- Visible on dashboard
- Sub-navigation tabs working

---

## How to Test

### Prerequisites
1. ✅ Dev server running at http://localhost:3000
2. ✅ Database migrations applied
3. ✅ User authentication working

### Test Scenarios

#### For Employees (leaves.apply permission):

1. **View Leave Balance**
   - Navigate to `/leaves`
   - See current month's balance (sick, casual, paid)
   - Balance shows 0 if not initialized by HR

2. **Apply for Leave**
   - Click "Apply Leave" button
   - Select leave type (sick/casual/paid)
   - Choose date range
   - Enter reason (min 10 characters)
   - Submit request
   - Verify success toast notification

3. **View Leave History**
   - See all submitted leaves
   - Status badges (pending, approved, rejected, cancelled)
   - Details including dates and reason

#### For Managers/HR (leaves.approve permission):

1. **View Pending Approvals**
   - Navigate to `/leaves/approvals`
   - See team members' pending requests
   - Employee name, dates, reason visible

2. **Approve Leave**
   - Click approve button
   - Verify success toast
   - Check balance updated
   - Leave disappears from pending list

3. **Reject Leave**
   - Click reject button
   - Modal appears
   - Enter rejection reason (required)
   - Submit rejection
   - Verify toast notification

4. **View Calendar**
   - Navigate to `/leaves/calendar`
   - See team leaves on calendar
   - Filter by employee
   - View monthly summary

#### For Admins/HR (leaves.manage_balances permission):

1. **Initialize Leave Balance**
   ```
   POST /api/leaves/balance
   {
     "employeeId": "user-uuid",
     "year": 2026,
     "month": 4,
     "sickAllocated": 2,
     "casualAllocated": 2,
     "paidAllocated": 2
   }
   ```

2. **Update Allocations**
   ```
   PUT /api/leaves/balance
   {
     "employeeId": "user-uuid",
     "year": 2026,
     "month": 4,
     "sickAllocated": 3,
     "casualAllocated": 3,
     "paidAllocated": 3
   }
   ```

---

## Workflow States

```
Pending → Approved → Cancelled
   ↓
Rejected
```

**Allowed Transitions:**
- Pending → Approved (by approver)
- Pending → Rejected (by approver)
- Pending → Deleted (by employee)
- Approved → Cancelled (by employee or admin)

---

## Database Queries for Testing

### Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leaves', 'leave_balances');
```

### View permissions:
```sql
SELECT key, name, description FROM permissions 
WHERE key LIKE 'leaves.%';
```

### Check leave balances:
```sql
SELECT 
  lb.employee_id,
  u.name as employee_name,
  lb.year,
  lb.month,
  lb.sick_allocated,
  lb.sick_used,
  lb.sick_remaining,
  lb.casual_allocated,
  lb.casual_used,
  lb.casual_remaining,
  lb.paid_allocated,
  lb.paid_used,
  lb.paid_remaining
FROM leave_balances lb
JOIN users u ON u.id = lb.employee_id
WHERE lb.year = 2026 AND lb.month = 4;
```

### View leave requests:
```sql
SELECT 
  l.id,
  u.name as employee_name,
  l.type,
  l.start_date,
  l.end_date,
  l.days,
  l.status,
  l.reason,
  l.created_at
FROM leaves l
JOIN users u ON u.id = l.employee_id
WHERE l.deleted_at IS NULL
ORDER BY l.created_at DESC;
```

---

## Key Features Implemented

✅ **Monthly Customizable Balances**
- Admin/HR can set leave allocations per month
- Different amounts for sick, casual, and paid leave
- Automatic tracking of used vs remaining

✅ **Approval Workflow**
- Employees submit requests
- Managers/HR approve or reject
- Rejection requires reason
- Email notifications not included (as per requirement)

✅ **Cancellation Support**
- Approved leaves can be cancelled
- Balance automatically restored
- Cancellation reason required

✅ **Permission-Based Access**
- Employees see own leaves
- Managers see team leaves
- Admins/HR see all leaves
- Proper authorization on all endpoints

✅ **Real-Time Balance Updates**
- Balance decrements on approval
- Balance restores on cancellation
- Generated columns for automatic calculation

---

## Next Steps

### To initialize leave balances for testing:

1. **Option A: Via API (using Postman/curl)**
   ```bash
   curl -X POST http://localhost:3000/api/leaves/balance \
   -H "Authorization: Bearer YOUR_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{
     "employeeId": "user-uuid-here",
     "year": 2026,
     "month": 4,
     "sickAllocated": 2,
     "casualAllocated": 2,
     "paidAllocated": 2
   }'
   ```

2. **Option B: Via Supabase Dashboard**
   - Go to Table Editor
   - Select `leave_balances` table
   - Insert rows manually

3. **Option C: Bulk Initialization Script**
   - Create a script to initialize balances for all employees
   - Run monthly to set new allocations

---

## Files Modified/Created

**Database Migrations:**
- `supabase/migrations/039_create_leaves_system.sql`
- `supabase/migrations/040_add_leave_permissions.sql`

**Backend:**
- `src/lib/db/queries/leaves.ts` (new)
- `src/app/api/leaves/route.ts` (new)
- `src/app/api/leaves/[id]/route.ts` (new)
- `src/app/api/leaves/[id]/approve/route.ts` (new)
- `src/app/api/leaves/[id]/reject/route.ts` (new)
- `src/app/api/leaves/[id]/cancel/route.ts` (new)
- `src/app/api/leaves/balance/route.ts` (new)

**Frontend:**
- `src/app/(dashboard)/leaves/page.tsx` (updated)
- `src/app/(dashboard)/leaves/apply/page.tsx` (updated)
- `src/app/(dashboard)/leaves/approvals/page.tsx` (updated)
- `src/app/(dashboard)/leaves/calendar/page.tsx` (updated)

**Navigation:**
- `src/lib/nav-visibility.ts` (updated)
- `src/context/auth-context.tsx` (added token export)

**Types:**
- `src/types/leave.ts` (updated with cancelled status)

---

## Success Criteria

✅ Database tables created with RLS policies
✅ All API endpoints functional
✅ Frontend pages using real data
✅ Leave balance tracking working
✅ Approval workflow complete
✅ Cancellation support implemented
✅ Navigation visible in sidebar
✅ Permission-based access control
✅ No build errors
✅ Dev server running successfully

---

## Support

If you encounter any issues:

1. **Check console logs** in browser developer tools
2. **Check server logs** in terminal
3. **Verify database data** using Supabase dashboard
4. **Test API endpoints** using Postman or curl
5. **Review permissions** assigned to your user role

The leave management system is now fully functional and ready for use! 🎉