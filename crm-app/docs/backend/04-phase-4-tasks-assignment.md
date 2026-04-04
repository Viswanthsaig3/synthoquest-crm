# Phase 4: Task Assignment

> **Duration**: Week 4-5 | **Priority**: HIGH | **Dependencies**: Phase 1, Phase 2

---

## Objective

Implement a comprehensive task management system with assignment workflows, status tracking, and progress monitoring.

---

## Features

### 1. Task Creation
- Create tasks with details
- Set priority and due dates
- Attach files and links
- Define task type

### 2. Task Assignment
- Assign to single/multiple users
- Set team assignments
- Self-assignment capability
- Reassignment workflow

### 3. Status Tracking
- Status transitions
- Progress updates
- Time tracking
- Completion tracking

### 4. Task Management
- View assigned tasks
- View created tasks
- Filter and search
- Bulk operations

### 5. Notifications
- Assignment notifications
- Due date reminders
- Status change alerts
- Mention notifications

---

## Database Schema

### Tasks Table
```
Table: tasks

Fields:
- id: UUID, primary key
- title: VARCHAR(255), not null
- description: TEXT
- type: VARCHAR(50), not null
  - task: General task
  - bug: Bug fix
  - feature: Feature implementation
  - maintenance: Maintenance work
  - training: Training task
  - meeting: Meeting/event
- priority: VARCHAR(20), default 'medium'
  - low: Low priority
  - medium: Normal priority
  - high: Important
  - urgent: Critical/Urgent
- status: VARCHAR(20), default 'pending'
  - pending: Created, not started
  - in_progress: Currently working
  - review: Under review
  - completed: Finished
  - cancelled: Cancelled
  - on_hold: Paused
- assigned_to: UUID, foreign key to users.id
- assigned_by: UUID, foreign key to users.id, not null
- team_id: UUID, foreign key to teams.id (optional)
- project_id: UUID, foreign key to projects.id (optional)
- parent_task_id: UUID, foreign key to tasks.id (for subtasks)
- due_date: DATE
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- cancelled_at: TIMESTAMPTZ
- estimated_hours: DECIMAL(4,2)
- actual_hours: DECIMAL(4,2)
- progress_percentage: INTEGER, default 0 (0-100)
- is_recurring: BOOLEAN, default false
- recurrence_pattern: VARCHAR(50) (daily, weekly, monthly)
- tags: TEXT[] (array of tags)
- attachments: JSONB (array of file metadata)
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ (soft delete)

Indexes:
- idx_tasks_assigned_to on assigned_to
- idx_tasks_assigned_by on assigned_by
- idx_tasks_status on status
- idx_tasks_priority on priority
- idx_tasks_due_date on due_date
- idx_tasks_team_id on team_id
- idx_tasks_project_id on project_id

Constraints:
- assigned_to must exist in users table (or null for unassigned)
- assigned_by must exist in users table
- progress_percentage between 0 and 100
- due_date >= created_at (cannot be in past when created)
```

### Task Comments Table
```
Table: task_comments

Fields:
- id: UUID, primary key
- task_id: UUID, foreign key to tasks.id, not null
- user_id: UUID, foreign key to users.id, not null
- comment: TEXT, not null
- mentions: UUID[] (array of user IDs mentioned)
- attachments: JSONB
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ

Indexes:
- idx_task_comments_task_id on task_id
- idx_task_comments_user_id on user_id

Constraints:
- task_id must exist in tasks table
- user_id must exist in users table
- Cascade delete on task delete
```

### Task History Table
```
Table: task_history

Fields:
- id: UUID, primary key
- task_id: UUID, foreign key to tasks.id, not null
- user_id: UUID, foreign key to users.id, not null
- action: VARCHAR(50), not null
  - created: Task created
  - assigned: Assigned to user
  - reassigned: Reassigned
  - status_changed: Status updated
  - priority_changed: Priority updated
  - due_date_changed: Due date updated
  - completed: Task completed
  - cancelled: Task cancelled
  - comment_added: Comment added
- old_value: JSONB
- new_value: JSONB
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_task_history_task_id on task_id
- idx_task_history_user_id on user_id
- idx_task_history_created_at on created_at

Constraints:
- task_id must exist in tasks table
- user_id must exist in users table
```

### Task Time Logs Table
```
Table: task_time_logs

Fields:
- id: UUID, primary key
- task_id: UUID, foreign key to tasks.id, not null
- user_id: UUID, foreign key to users.id, not null
- started_at: TIMESTAMPTZ, not null
- ended_at: TIMESTAMPTZ
- duration_minutes: INTEGER
- description: TEXT
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_task_time_logs_task_id on task_id
- idx_task_time_logs_user_id on user_id
- idx_task_time_logs_started_at on started_at

Constraints:
- task_id must exist in tasks table
- user_id must exist in users table
- ended_at must be > started_at
```

### Task Assignments Table (for multiple assignees)
```
Table: task_assignments

Fields:
- id: UUID, primary key
- task_id: UUID, foreign key to tasks.id, not null
- user_id: UUID, foreign key to users.id, not null
- role: VARCHAR(50), default 'assignee'
  - assignee: Main assignee
  - reviewer: Reviewer
  - collaborator: Collaborator
- assigned_by: UUID, foreign key to users.id
- assigned_at: TIMESTAMPTZ, default now()
- accepted_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ

Indexes:
- idx_task_assignments_task_id on task_id
- idx_task_assignments_user_id on user_id

Constraints:
- task_id must exist in tasks table
- user_id must exist in users table
- unique (task_id, user_id)
```

---

## Task Workflow

### State Machine
```
[PENDING] ──start──> [IN_PROGRESS] ──submit──> [REVIEW]
    │                      │                        │
    │                      │                        ├──approve──> [COMPLETED]
    │                      │                        │
    │                      │                        └──reject──> [IN_PROGRESS]
    │                      │
    │                      └──cancel──> [CANCELLED]
    │
    └──cancel──> [CANCELLED]

Any state ──hold──> [ON_HOLD]
[ON_HOLD] ──resume──> [PREVIOUS_STATE]
```

### Status Transitions

**Pending → In Progress**
- Trigger: Assignee starts work
- Permission: tasks.complete (own tasks) or tasks.edit
- Validation: Task is assigned to user
- Actions:
  - Update status to 'in_progress'
  - Set started_at
  - Notify creator

**In Progress → Review**
- Trigger: Assignee submits for review
- Permission: tasks.complete (own tasks)
- Validation: Task in 'in_progress' status
- Actions:
  - Update status to 'review'
  - Notify reviewers

**Review → Completed**
- Trigger: Reviewer approves
- Permission: tasks.edit or tasks.assign
- Validation: Task in 'review' status
- Actions:
  - Update status to 'completed'
  - Set completed_at
  - Update actual_hours
  - Notify assignee and creator

**Review → In Progress**
- Trigger: Reviewer requests changes
- Permission: tasks.edit or tasks.assign
- Validation: Task in 'review' status
- Actions:
  - Update status to 'in_progress'
  - Add comment with feedback
  - Notify assignee

**Any → Cancelled**
- Trigger: Creator or manager cancels
- Permission: tasks.edit or tasks.assign
- Validation: Task not already completed
- Actions:
  - Update status to 'cancelled'
  - Set cancelled_at
  - Notify assignee
  - Log reason

**Any → On Hold**
- Trigger: User pauses work
- Permission: tasks.edit or tasks.complete
- Actions:
  - Update status to 'on_hold'
  - Log reason

---

## API Endpoints

### Task Endpoints

#### GET /api/tasks
```
Purpose: List tasks

Headers:
- Authorization: Bearer {accessToken}

Query Parameters:
- page: integer
- limit: integer
- status: string (pending, in_progress, review, completed, cancelled, on_hold)
- priority: string (low, medium, high, urgent)
- assigned_to: string (user ID)
- assigned_by: string (user ID)
- due_before: date
- due_after: date
- search: string (title, description)
- type: string
- sort: string (due_date, priority, created_at)

Permission:
- tasks.view_all: See all tasks
- Default: See own tasks + tasks created by user

Process:
1. Verify authentication
2. Check permission
3. Build query based on permission
4. Apply filters
5. Execute paginated query
6. Return tasks with assignee info

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "status": "in_progress",
      "priority": "high",
      "due_date": "2026-04-10",
      "assigned_to": { "id": "...", "name": "..." },
      "assigned_by": { "id": "...", "name": "..." },
      ...
    }
  ],
  "pagination": { ... }
}

Errors:
- 401: Unauthorized
```

#### POST /api/tasks
```
Purpose: Create new task

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.create

Request Body:
{
  "title": "Task title",
  "description": "Detailed description",
  "type": "task",
  "priority": "medium",
  "assigned_to": "user-uuid",
  "team_id": "team-uuid",
  "project_id": "project-uuid",
  "due_date": "2026-04-10",
  "estimated_hours": 8,
  "tags": ["frontend", "urgent"],
  "parent_task_id": "parent-task-uuid"
}

Validation:
- title: required, max 255 characters
- type: must be valid type
- priority: must be valid priority
- assigned_to: must exist and be assignable
- due_date: must be future date

Process:
1. Verify authentication
2. Check permission
3. Validate input
4. Check assignee is valid
5. Create task
6. Create history record (created)
7. Create history record (assigned)
8. Send notification to assignee
9. Return task

Response (201):
{
  "data": { ... }
}

Errors:
- 400: Invalid input
- 401: Unauthorized
- 403: Forbidden
- 404: Assignee not found
```

#### GET /api/tasks/:id
```
Purpose: Get task details

Headers:
- Authorization: Bearer {accessToken}

Permission:
- tasks.view_all
- Assigned to user
- Created by user

Process:
1. Verify authentication
2. Check permission
3. Fetch task
4. Include comments, history, time logs
5. Return task details

Response (200):
{
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "status": "in_progress",
    "assignee": { ... },
    "creator": { ... },
    "comments": [ ... ],
    "history": [ ... ],
    "time_logs": [ ... ],
    "subtasks": [ ... ]
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

#### PUT /api/tasks/:id
```
Purpose: Update task details

Headers:
- Authorization: Bearer {accessToken}

Permission:
- tasks.edit: Update any field
- tasks.complete (own tasks): Update status only

Request Body:
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "high",
  "due_date": "2026-04-12",
  "status": "in_progress"
}

Validation:
- Status transitions must be valid
- Cannot modify completed tasks

Process:
1. Verify authentication
2. Check permission
3. Validate input
4. Track field changes
5. Update task
6. Create history records
7. Send notifications (if needed)
8. Return updated task

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid input, invalid status transition
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

#### DELETE /api/tasks/:id
```
Purpose: Delete task (soft delete)

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.delete

Validation:
- Cannot delete completed tasks
- Must be creator or have tasks.delete permission

Process:
1. Verify authentication
2. Check permission
3. Soft delete task
4. Notify assignee
5. Return success

Response (200):
{
  "message": "Task deleted"
}

Errors:
- 400: Cannot delete completed task
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

### Task Action Endpoints

#### POST /api/tasks/:id/assign
```
Purpose: Assign or reassign task

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.assign

Request Body:
{
  "assigned_to": "user-uuid"
}

Validation:
- User must be assignable
- Task not completed

Process:
1. Verify authentication
2. Check permission
3. Validate assignee
4. Update task
5. Create history record
6. Notify new assignee
7. Notify old assignee (if reassign)
8. Return task

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid assignee
- 401: Unauthorized
- 403: Forbidden
- 404: Task/User not found
```

#### POST /api/tasks/:id/start
```
Purpose: Start working on task

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.complete (assigned user only)

Validation:
- Task in 'pending' status
- User is assignee

Process:
1. Verify authentication
2. Check assignment
3. Update status to 'in_progress'
4. Set started_at
5. Create history record
6. Notify creator
7. Return task

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden (not assignee)
- 404: Task not found
```

#### POST /api/tasks/:id/complete
```
Purpose: Mark task as complete

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.complete (assigned user only)

Request Body:
{
  "actual_hours": 6.5,
  "comment": "Completion notes"
}

Validation:
- Task in 'in_progress' or 'review' status
- User is assignee or reviewer

Process:
1. Verify authentication
2. Check assignment
3. Update status to 'completed'
4. Set completed_at, actual_hours
5. Create history record
6. Notify creator and stakeholders
7. Return task

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

#### POST /api/tasks/:id/cancel
```
Purpose: Cancel task

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.edit or tasks.assign

Request Body:
{
  "reason": "Cancellation reason"
}

Validation:
- Task not already completed or cancelled

Process:
1. Verify authentication
2. Check permission
3. Update status to 'cancelled'
4. Set cancelled_at
5. Create history record with reason
6. Notify assignee
7. Return task

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

### Task Comment Endpoints

#### GET /api/tasks/:id/comments
```
Purpose: Get task comments

Headers:
- Authorization: Bearer {accessToken}

Permission: Can view task

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "comment": "...",
      "user": { ... },
      "created_at": "...",
      ...
    }
  ]
}

Errors:
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

#### POST /api/tasks/:id/comments
```
Purpose: Add comment to task

Headers:
- Authorization: Bearer {accessToken}

Permission: Can view task

Request Body:
{
  "comment": "Comment text",
  "mentions": ["user-id-1", "user-id-2"]
}

Process:
1. Verify authentication
2. Check access
3. Create comment
4. Create history record
5. Notify mentioned users
6. Return comment

Response (201):
{
  "data": { ... }
}

Errors:
- 400: Invalid input
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

### Task Time Log Endpoints

#### POST /api/tasks/:id/time-logs
```
Purpose: Log time spent on task

Headers:
- Authorization: Bearer {accessToken}

Permission: tasks.complete (assigned user only)

Request Body:
{
  "started_at": "2026-04-04T09:00:00Z",
  "ended_at": "2026-04-04T12:30:00Z",
  "description": "Worked on frontend"
}

Process:
1. Verify authentication
2. Check assignment
3. Calculate duration
4. Create time log
5. Update task actual_hours
6. Return time log

Response (201):
{
  "data": { ... }
}

Errors:
- 400: Invalid times
- 401: Unauthorized
- 403: Forbidden
- 404: Task not found
```

---

## Permission Matrix

| Action | Admin | HR | Team Lead | Sales Rep | Employee |
|--------|-------|-----|-----------|-----------|----------|
| View all tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit any task | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Complete own tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own tasks | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Notification Rules

### Trigger Events
```
Task Created:
- Notify: Assignee, Team members

Task Assigned:
- Notify: New assignee

Task Reassigned:
- Notify: New assignee, Old assignee

Status Changed:
- Notify: Creator, Assignee (if not changer)

Comment Added:
- Notify: Task participants, Mentioned users

Due Soon (1 day before):
- Notify: Assignee

Overdue:
- Notify: Assignee, Creator

Task Completed:
- Notify: Creator, Stakeholders
```

---

## Testing Checklist

### Task Creation Tests
- [ ] Create task with valid data
- [ ] Validation: title required
- [ ] Validation: valid assignee
- [ ] Validation: future due date
- [ ] Create with tags
- [ ] Create subtask

### Assignment Tests
- [ ] Assign to user
- [ ] Reassign task
- [ ] Self-assign (if allowed)
- [ ] Assign to team
- [ ] Notification sent

### Status Transition Tests
- [ ] Pending → In Progress
- [ ] In Progress → Review
- [ ] Review → Completed
- [ ] Review → In Progress
- [ ] Any → Cancelled
- [ ] Any → On Hold
- [ ] Invalid transitions rejected

### Permission Tests
- [ ] Admin can do all
- [ ] HR can do all
- [ ] Team Lead can manage team tasks
- [ ] Sales Rep can complete own
- [ ] Employee can complete own
- [ ] Cannot view others' tasks (without permission)

### Time Tracking Tests
- [ ] Log time correctly
- [ ] Duration calculated
- [ ] Total hours updated
- [ ] Cannot log for others

### Comment Tests
- [ ] Add comment
- [ ] Mention users
- [ ] Notifications sent
- [ ] Edit comment
- [ ] Delete comment

---

## Success Criteria

- [ ] Tasks can be created
- [ ] Tasks can be assigned
- [ ] Status transitions work
- [ ] Time tracking works
- [ ] Comments work
- [ ] Notifications sent
- [ ] Permissions enforced
- [ ] History tracked
- [ ] All tests pass
- [ ] No security issues

---

## Migration Steps

### Step 1: Database Setup
1. Create tasks table
2. Create task_comments table
3. Create task_history table
4. Create task_time_logs table
5. Create task_assignments table
6. Add indexes

### Step 2: Query Functions
1. Task CRUD functions
2. Assignment functions
3. Status transition functions
4. Comment functions
5. Time log functions
6. History functions

### Step 3: API Routes
1. Task endpoints
2. Assignment endpoints
3. Status endpoints
4. Comment endpoints
5. Time log endpoints

### Step 4: Frontend Integration
1. Update task pages
2. Implement workflow UI
3. Add notifications
4. Remove mock data

### Step 5: Testing & Deployment
1. Write tests
2. Test thoroughly
3. Deploy
4. Monitor

---

## Next Phase

After Phase 4 is complete, proceed to:
- **Phase 5**: Next Features (Leads, Students, Batches, Payments)

---

**Dependencies for Next Phase**:
- Authentication working
- RBAC working
- Timesheets working
- Tasks working