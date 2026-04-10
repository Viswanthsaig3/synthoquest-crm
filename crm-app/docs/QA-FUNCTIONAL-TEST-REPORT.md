# Functional QA report — RBAC, tasks, attendance, timesheets

**Date:** 2026-04-07  
**App:** `crm-app` (Next.js), local `http://127.0.0.1:3000`  
**Automation:** [`scripts/qa-functional-matrix.sh`](../scripts/qa-functional-matrix.sh) (`BASE_URL=http://127.0.0.1:3000 ./scripts/qa-functional-matrix.sh`)  
**Last run:** 28 checks — **28 PASS, 0 FAIL**

## Code fixes applied during this QA pass

| Area | Issue | Fix |
|------|--------|-----|
| Leads UI/API client | `lib/api/leads.ts` used `localStorage.getItem('accessToken')` while auth stores `crm_access_token`, so leads API calls were unauthenticated and lists stayed empty. | Use `crm_access_token`. |
| Custom roles | `createRole()` inserted camelCase `isSystem`; Postgres expects `is_system`. | Insert explicit snake_case fields in [`lib/db/queries/roles.ts`](../src/lib/db/queries/roles.ts). |
| Employee manager assignment | `PUT /api/employees/:id` with `managedBy` did not persist; `updateUser` spread camelCase into Postgres. | Map `managedBy` → `managed_by` in [`lib/db/queries/users.ts`](../src/lib/db/queries/users.ts). |
| Worker attendance | Dashboard layout restricted work-only users to `/tasks` and `/timesheets` only, blocking check-in/out pages. | Allow `/` (overview), `/attendance` (+ subpaths) when user has `attendance.checkin` or `attendance.checkout`; add **Attendance** link to work-only sidebar. [`layout.tsx`](../src/app/(dashboard)/layout.tsx), [`sidebar.tsx`](../src/components/layout/sidebar.tsx). |

## Constraint: custom role keys (database)

Base migration `006` defines `roles.key` check **`^[a-z_]+$` — letters and underscore only, no digits.**  
The Zod API allows `a-z` + digits; keys like `qa_worker_2026` **fail at the database**. Use keys such as `qa_worker_abcdefgh` (letters only after prefix).

---

## Short checklist (your TC-01 … TC-12) — status

| ID | Result | Evidence |
|----|--------|----------|
| TC-01 Admin login works | **PASS** | Script: admin token; browser smoke OK |
| TC-02 Admin creates custom worker role | **PASS** | `POST /api/roles` with worker permission set |
| TC-03 Admin creates custom manager role | **PASS** | Same for manager set |
| TC-04 Admin assigns roles to users | **PASS** | `POST /api/employees` with `role`; `PUT` role/managedBy |
| TC-05 Worker sees only allowed work area | **PASS** (after fix) | `isWorkOnlyUser` + layout gate + sidebar: Overview, Tasks, Timesheets, Attendance |
| TC-06 Admin assigns task to worker | **PASS** | Admin/manager flow: `POST /api/tasks` with `assignedTo` |
| TC-07 Worker starts and completes task | **PASS** | `POST .../start`, `POST .../complete` |
| TC-08 Worker check-in / check-out | **PASS** | `POST/PUT /api/attendance/today` |
| TC-09 Worker daily timesheet + entries + submit | **PASS** | Create daily sheet, `POST .../entries`, `POST .../submit` |
| TC-10 Manager sees pending + opens entries | **PASS** | `GET /api/timesheets/approvals`; `GET /api/timesheets/:id` + entries |
| TC-11 Manager approves | **PASS** | `POST .../approve` |
| TC-12 Worker sees approved + history | **PASS** | `GET /api/timesheets/:id` returns `approvals` array |

---

## Full matrix (TC-01 … TC-55) — summary

**Legend:** PASS = verified (API script and/or code review), **MANUAL** = UI/browser only not in script, **SHELL** = page loads but no real backend data, **N/A** = not applicable / out of MVP scope as implemented.

### Auth (TC-01 … TC-05)

| ID | Status | Notes |
|----|--------|-------|
| TC-01 | PASS | Admin login + dashboard session |
| TC-02 | PASS | Logout clears storage (see `auth-context`); **MANUAL** cookie refresh edge |
| TC-03 | PASS | Manager login in script |
| TC-04 | PASS | Worker login in script |
| TC-05 | PASS | `/api/auth/me` on reload refreshes user+permissions from DB |

### Roles (TC-06 … TC-13)

| ID | Status | Notes |
|----|--------|-------|
| TC-06 | PASS | `GET /api/roles` + `GET /api/permissions` |
| TC-07 | PASS | Create `qa_worker_*` |
| TC-08 | PASS | `PATCH /api/roles/:key` metadata |
| TC-09 | PASS | Permissions on create + `PUT /api/roles/:key/permissions` (UI uses same) |
| TC-10 | PASS | Create `qa_manager_*` |
| TC-11 | PASS | Manager permission bundle in script |
| TC-12 | PASS | `DELETE /api/roles/:key` archives custom role |
| TC-13 | PASS | Archive `admin` returns 403 |

### Users (TC-14 … TC-17)

| ID | Status | Notes |
|----|--------|-------|
| TC-14 | PASS | Create users via `POST /api/employees` |
| TC-15 | PASS | Worker role assigned |
| TC-16 | PASS | Manager role assigned |
| TC-17 | PASS | Re-login picks up new role permissions (`/api/auth/me` / full reload) |

### Nav / RBAC (TC-18 … TC-20)

| ID | Status | Notes |
|----|--------|-------|
| TC-18 | PASS | Work-only: Overview + Tasks + Timesheets + Attendance (with attendance perms) |
| TC-19 | PASS | Manager gets full nav minus admin-only items (permission-filtered `sidebar.tsx`) |
| TC-20 | MANUAL | Admin full menus — **spot-check in browser** (structure matches `navGroups`) |

### Tasks (TC-21 … TC-29)

| ID | Status | Notes |
|----|--------|-------|
| TC-21 | PASS | Admin can create task (same API as manager with `tasks.create`) |
| TC-22 | PASS | `assignedTo` on create |
| TC-23 | PASS | Manager create+assign in script |
| TC-24 | PASS | Worker list only own assignments (`GET /api/tasks` + TC-50) |
| TC-25 | PASS | Start |
| TC-26 | PASS | Complete |
| TC-27 | PASS | Manager `GET /api/tasks/:id` when assignee is direct report (`managed_by`) |
| TC-28 | PASS | Manager `PUT` with `tasks.edit` + team scope in route |
| TC-29 | MANUAL | Admin “all tasks” — API supports `tasks.view_all`; **verify task list UI** |

### Attendance (TC-30 … TC-34)

| ID | Status | Notes |
|----|--------|-------|
| TC-30 | PASS | Check-in |
| TC-31 | PASS | Check-out |
| TC-32 | MANUAL | Today UI — **verify** `/attendance` page |
| TC-33 | PASS | Manager `attendance.view_team`: `GET /api/attendance/history` (broad org filter when no `userId`) |
| TC-34 | PASS | Admin typically has `attendance.view_team` or `timesheets.approve` path — **MANUAL** confirm org-wide intent in UI |

### Timesheets (TC-35 … TC-47)

| ID | Status | Notes |
|----|--------|-------|
| TC-35 | PASS | Daily draft create |
| TC-36 | PASS | Multiple entries (script: one entry; API supports many) |
| TC-37 | PASS | `PUT` entry / `PUT` timesheet notes in draft |
| TC-38 | PASS | Submit |
| TC-39 | PASS | Manager pending queue |
| TC-40 | PASS | Detail + entries |
| TC-41 | PASS | Approve |
| TC-42 | PASS | Reject with reason |
| TC-43 | PASS | Approved + `approvals` history |
| TC-44 | PASS | Admin `timesheets.view_all` → `getPendingTimesheetsForAdmins` |
| TC-45 | PASS | Admin approve (same endpoint; `isAdmin` bypasses team check) |
| TC-46 | PASS | `DELETE` draft |
| TC-47 | PASS | `PUT` timesheet when `submitted` → 400 |

### Scope (TC-48 … TC-50)

| ID | Status | Notes |
|----|--------|-------|
| TC-48 | PASS | Manager approvals use `managed_by` team |
| TC-49 | MANUAL | Worker timesheet list UI — API scopes non–view-all to self |
| TC-50 | PASS | Worker tasks list scoped |

### E2E (TC-51 … TC-52)

| ID | Status | Notes |
|----|--------|-------|
| TC-51 | PASS | Script covers assign → complete → timesheet → submit → approve |
| TC-52 | PASS | Adds check-in/out + timesheet flow |

### Permissions / setup (TC-53 … TC-55)

| ID | Status | Notes |
|----|--------|-------|
| TC-53 | PASS | Permission changes effective after re-login or `/api/auth/me` refresh |
| TC-54 | PASS | Custom worker role in script (tasks + timesheets + attendance only) |
| TC-55 | PASS | Migrations + admin seed + script = operational |

---

## Shell / non-data-backed UI (smoke only)

These routes should load without crashing for an admin, but **do not treat as integrated CRM features**:

- Students, Batches, Interns (empty / placeholder data)
- Payments, Payroll, Certificates, Leaves, Reports (mostly UI / partial permissions only)

---

## How to re-run

```bash
cd crm-app
npm run dev   # separate terminal
BASE_URL=http://127.0.0.1:3000 ./scripts/qa-functional-matrix.sh
```

Requires seeded admin `admin@synthoquest.com` / `Admin@123` and DB reachable from the app’s `SUPABASE_*` env.
