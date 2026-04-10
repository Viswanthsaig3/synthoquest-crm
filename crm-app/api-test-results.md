# SynthoQuest CRM API Test Results

**Date:** Fri Apr 10 13:02:47 IST 2026
**Base URL:** http://localhost:3000
**Admin Email:** admin@synthoquest.com

## Test Execution Log


### 1. Authentication Endpoints

- **Test:** POST /api/auth/login
- **Status:** ✗ FAIL (expected: 201, got: 000{"data":{"user":{"id":"01641a72-c445-4ee8-b564-fdf82ccecac7","email":"admin@synthoquest.com","name":"Admin User","role":"admin","permissions":["tasks.view_all","tasks.create","tasks.assign","tasks.edit","tasks.delete","tasks.complete","leads.view_all","leads.view_assigned","leads.create","leads.edit","leads.delete","leads.claim","leads.call","leads.convert","students.view_all","students.view_assigned","students.create","students.edit","students.enroll","interns.view_all","interns.view_assigned","interns.approve","employees.view_all","employees.manage","timesheets.view_all","timesheets.submit","timesheets.approve","attendance.view_team","leaves.apply","leaves.approve","payroll.view_all","payroll.view_own","payroll.process","batches.view","batches.create","batches.edit","batches.manage","payments.view_all","payments.view_assigned","payments.create","payments.process","certificates.view_all","certificates.issue","reports.view","settings.manage","roles.manage","leaves.view_all","leaves.manage_balances","leaves.cancel","employees.manage_assigned","interns.manage_all","interns.manage_assigned","compensation.manage","attendance.manage_office_location","attendance.manage_home_location_all","attendance.view_warnings","attendance.adjust_records","attendance.view_adjustments","bugs.create","bugs.delete_screenshot","bugs.manage","bugs.view_all"],"department":"training","phone":"+91 9876543210","avatar":null,"status":"active","managedBy":null},"accessToken":"eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIwMTY0MWE3Mi1jNDQ1LTRlZTgtYjU2NC1mZGY4MmNjZWNhYzciLCJlbWFpbCI6ImFkbWluQHN5bnRob3F1ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTgwNjM2OSwiZXhwIjoxNzc1ODIwNzY5fQ.Hb7oVA9s4ykRcpZiueTdPETySkfwUDTIBab7XzcS8a4"}}200)
- **Response:**
```json
{
    "data": {
        "user": {
            "id": "01641a72-c445-4ee8-b564-fdf82ccecac7",
            "email": "admin@synthoquest.com",
            "name": "Admin User",
            "role": "admin",
            "permissions": [
                "tasks.view_all",
                "tasks.create",
                "tasks.assign",
                "tasks.edit",
                "tasks.delete",
                "tasks.complete",
                "leads.view_all",
                "leads.view_assigned",
                "leads.create",
                "leads.edit",
                "leads.delete",
                "leads.claim",
                "leads.call",
                "leads.convert",
                "students.view_all",
                "students.view_assigned",
                "students.create",
                "students.edit",
                "students.enroll",
                "interns.view_all",
                "interns.view_assigned",
                "interns.approve",
                "employees.view_all",
                "employees.manage",
                "timesheets.view_all",
                "timesheets.submit",
                "timesheets.approve",
                "attendance.view_team",
                "leaves.apply",
                "leaves.approve",
                "payroll.view_all",
                "payroll.view_own",
                "payroll.process",
                "batches.view",
                "batches.create",
                "batches.edit",
                "batches.manage",
                "payments.view_all",
                "payments.view_assigned",
                "payments.create",
                "payments.process",
                "certificates.view_all",
                "certificates.issue",
                "reports.view",
                "settings.manage",
                "roles.manage",
                "leaves.view_all",
                "leaves.manage_balances",
                "leaves.cancel",
                "employees.manage_assigned",
                "interns.manage_all",
                "interns.manage_assigned",
                "compensation.manage",
                "attendance.manage_office_location",
                "attendance.manage_home_location_all",
                "attendance.view_warnings",
                "attendance.adjust_records",
                "attendance.view_adjustments",
                "bugs.create",
                "bugs.delete_screenshot",
                "bugs.manage",
                "bugs.view_all"
            ],
            "department": "training",
            "phone": "+91 9876543210",
            "avatar": null,
            "status": "active",
            "managedBy": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIwMTY0MWE3Mi1jNDQ1LTRlZTgtYjU2NC1mZGY4MmNjZWNhYzciLCJlbWFpbCI6ImFkbWluQHN5bnRob3F1ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTgwNjM2OCwiZXhwIjoxNzc1ODIwNzY4fQ.3mobpIBUcgSn_JgNljkBluF-DjlJ8dYWi5lCuG34cJs"
    }
}
```

- **Test:** GET /api/auth/me
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized","code":"MISSING_TOKEN"}401)
- **Response:**
```json
{
    "error": "Unauthorized",
    "code": "MISSING_TOKEN"
}
```

- **Test:** POST /api/auth/logout
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized","code":"MISSING_TOKEN"}401)
- **Response:**
```json
{
    "error": "Unauthorized",
    "code": "MISSING_TOKEN"
}
```

- **Test:** POST /api/auth/login
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"data":{"user":{"id":"01641a72-c445-4ee8-b564-fdf82ccecac7","email":"admin@synthoquest.com","name":"Admin User","role":"admin","permissions":["tasks.view_all","tasks.create","tasks.assign","tasks.edit","tasks.delete","tasks.complete","leads.view_all","leads.view_assigned","leads.create","leads.edit","leads.delete","leads.claim","leads.call","leads.convert","students.view_all","students.view_assigned","students.create","students.edit","students.enroll","interns.view_all","interns.view_assigned","interns.approve","employees.view_all","employees.manage","timesheets.view_all","timesheets.submit","timesheets.approve","attendance.view_team","leaves.apply","leaves.approve","payroll.view_all","payroll.view_own","payroll.process","batches.view","batches.create","batches.edit","batches.manage","payments.view_all","payments.view_assigned","payments.create","payments.process","certificates.view_all","certificates.issue","reports.view","settings.manage","roles.manage","leaves.view_all","leaves.manage_balances","leaves.cancel","employees.manage_assigned","interns.manage_all","interns.manage_assigned","compensation.manage","attendance.manage_office_location","attendance.manage_home_location_all","attendance.view_warnings","attendance.adjust_records","attendance.view_adjustments","bugs.create","bugs.delete_screenshot","bugs.manage","bugs.view_all"],"department":"training","phone":"+91 9876543210","avatar":null,"status":"active","managedBy":null},"accessToken":"eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIwMTY0MWE3Mi1jNDQ1LTRlZTgtYjU2NC1mZGY4MmNjZWNhYzciLCJlbWFpbCI6ImFkbWluQHN5bnRob3F1ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTgwNjM3MSwiZXhwIjoxNzc1ODIwNzcxfQ.rkwvXot7DjDsk0kO2jX9JT5XfvKYyJBecKIGVARk0r0"}}200)
- **Response:**
```json
{
    "data": {
        "user": {
            "id": "01641a72-c445-4ee8-b564-fdf82ccecac7",
            "email": "admin@synthoquest.com",
            "name": "Admin User",
            "role": "admin",
            "permissions": [
                "tasks.view_all",
                "tasks.create",
                "tasks.assign",
                "tasks.edit",
                "tasks.delete",
                "tasks.complete",
                "leads.view_all",
                "leads.view_assigned",
                "leads.create",
                "leads.edit",
                "leads.delete",
                "leads.claim",
                "leads.call",
                "leads.convert",
                "students.view_all",
                "students.view_assigned",
                "students.create",
                "students.edit",
                "students.enroll",
                "interns.view_all",
                "interns.view_assigned",
                "interns.approve",
                "employees.view_all",
                "employees.manage",
                "timesheets.view_all",
                "timesheets.submit",
                "timesheets.approve",
                "attendance.view_team",
                "leaves.apply",
                "leaves.approve",
                "payroll.view_all",
                "payroll.view_own",
                "payroll.process",
                "batches.view",
                "batches.create",
                "batches.edit",
                "batches.manage",
                "payments.view_all",
                "payments.view_assigned",
                "payments.create",
                "payments.process",
                "certificates.view_all",
                "certificates.issue",
                "reports.view",
                "settings.manage",
                "roles.manage",
                "leaves.view_all",
                "leaves.manage_balances",
                "leaves.cancel",
                "employees.manage_assigned",
                "interns.manage_all",
                "interns.manage_assigned",
                "compensation.manage",
                "attendance.manage_office_location",
                "attendance.manage_home_location_all",
                "attendance.view_warnings",
                "attendance.adjust_records",
                "attendance.view_adjustments",
                "bugs.create",
                "bugs.delete_screenshot",
                "bugs.manage",
                "bugs.view_all"
            ],
            "department": "training",
            "phone": "+91 9876543210",
            "avatar": null,
            "status": "active",
            "managedBy": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIwMTY0MWE3Mi1jNDQ1LTRlZTgtYjU2NC1mZGY4MmNjZWNhYzciLCJlbWFpbCI6ImFkbWluQHN5bnRob3F1ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTgwNjM3MCwiZXhwIjoxNzc1ODIwNzcwfQ.iETOpnOTdb3HJO4__2ZAXOx_ArQDFAhrOGbKA8Uzivc"
    }
}
```


### 2. User Management Endpoints

- **Test:** GET /api/users/hierarchy
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/users/assignable
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 3. Employee Endpoints

- **Test:** GET /api/employees
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/employees?department=engineering&status=active&page=1&limit=10
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/employees
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 4. Roles & Permissions Endpoints

- **Test:** GET /api/roles
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/roles/admin
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/roles/admin/permissions
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/permissions
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 5. Department Endpoints

- **Test:** GET /api/departments
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 6. Lead Endpoints

- **Test:** GET /api/leads
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/leads?status=open&priority=hot&page=1&limit=10
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/leads?search=test
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/leads
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 7. Lead Type Endpoints

- **Test:** GET /api/lead-types
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 8. Task Endpoints

- **Test:** GET /api/tasks
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/tasks?status=pending&priority=high&type=task
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/tasks?search=test
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/tasks
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 9. Bug Endpoints

- **Test:** GET /api/bugs
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/bugs
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 10. Attendance Endpoints

- **Test:** GET /api/attendance/today
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/attendance/today
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** PUT /api/attendance/today
- **Status:** ✗ FAIL (expected: 200, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/attendance/history
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/attendance/team-today
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/attendance/warnings
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/attendance/settings
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/attendance/adjustments
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/attendance/security
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/attendance/heartbeat
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 11. Time Entry Endpoints

- **Test:** GET /api/time-entries
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/time-entries?date=2026-04-10&status=pending
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/time-entries
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/time/now
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 12. Timesheet Endpoints

- **Test:** GET /api/timesheets
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/timesheets?workDate=2026-04-10
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/timesheets
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 13. Timesheet Approval Endpoints

- **Test:** GET /api/timesheet-entries/pending
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/timesheet-entries/my-stats
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/timesheet-entries/bulk-approve
- **Status:** ✗ FAIL (expected: 200, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/timesheet-entries/bulk-reject
- **Status:** ✗ FAIL (expected: 200, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 14. Leave Endpoints

- **Test:** GET /api/leaves
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/leaves?status=pending&type=sick&year=2026
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/leaves/balances
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/leaves/balance
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/leaves
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 15. Payroll Endpoints

- **Test:** GET /api/payroll
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/payroll/employees
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/payroll/hours
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/payroll/summary
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/payroll/settings
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/payroll/run
- **Status:** ✗ FAIL (expected: 200, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 16. Intern Endpoints

- **Test:** GET /api/interns
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** GET /api/interns?status=active&department=engineering
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/interns
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 17. Batch Endpoints

- **Test:** GET /api/batches
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** POST /api/batches
- **Status:** ✗ FAIL (expected: 201, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 18. Dashboard Endpoints

- **Test:** GET /api/dashboard/summary
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


### 19. Settings Endpoints

- **Test:** GET /api/settings/office-location
- **Status:** ✗ FAIL (expected: 200, got: 000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```

- **Test:** PUT /api/settings/office-location
- **Status:** ✗ FAIL (expected: 200, got: 000000000{"error":"Unauthorized"}401)
- **Response:**
```json
{
    "error": "Unauthorized"
}
```


## Test Summary

**Total Tests:** 65
**Passed:** 0
**Failed:** 65
**Success Rate:** 0.00%
[0;31m✗ SOME TESTS FAILED[0m
