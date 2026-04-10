#!/bin/bash

# Comprehensive API Endpoint Testing Script for SynthoQuest CRM
# Tests all endpoints with realistic workflows
# Compatible with macOS (BSD bash)

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="admin@synthoquest.com"
ADMIN_PASSWORD="Admin@123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Store created IDs (using regular variables for macOS compatibility)
USER_ID=""
EMPLOYEE_ID=""
NEW_EMPLOYEE_ID=""
LEAD_ID=""
NEW_LEAD_ID=""
TASK_ID=""
NEW_TASK_ID=""
BUG_ID=""
NEW_BUG_ID=""
ATTENDANCE_ID=""
TIME_ENTRY_ID=""
NEW_TIME_ENTRY_ID=""
TIMESHEET_ID=""
NEW_TIMESHEET_ID=""
LEAVE_ID=""
NEW_LEAVE_ID=""
PAYROLL_ID=""
INTERN_ID=""
NEW_INTERN_ID=""
NEW_BATCH_ID=""
DEPT_KEY=""
LEAD_TYPE_ID=""

# Function to test endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    local description=${5:-}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local url="${BASE_URL}${endpoint}"
    local curl_cmd="curl -s -w '\n%{http_code}'"
    
    if [ -n "$ACCESS_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $ACCESS_TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd -X $method '$url'"
    
    local response=$(eval $curl_cmd 2>/dev/null)
    local http_code=$(echo "$response" | sed '$!d')
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC} [$http_code] $method $endpoint"
        if [ -n "$description" ]; then
            echo -e "  ${CYAN}$description${NC}"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAIL${NC} [$http_code (expected: $expected_status)] $method $endpoint"
        if [ -n "$description" ]; then
            echo -e "  ${CYAN}$description${NC}"
        fi
        # Show response for failures
        echo -e "${YELLOW}Response:${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        echo ""
    fi
    
    # Return body for parsing
    echo "$body"
}

# Function to extract ID from response
extract_id() {
    local response=$1
    echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('id', ''))" 2>/dev/null
}

# Function to extract first ID from list
extract_first_id() {
    local response=$1
    echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); items=data.get('data', []); print(items[0].get('id', '') if items else '')" 2>/dev/null
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}SynthoQuest CRM - Complete API Testing${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# ============================================
# SECTION 1: AUTHENTICATION
# ============================================
echo -e "${YELLOW}=== SECTION 1: AUTHENTICATION ===${NC}"
echo ""

echo -e "${BLUE}1.1 Login${NC}"
LOGIN_RESPONSE=$(test_api "POST" "/api/auth/login" \
    "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    201 "Admin login")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('accessToken', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}✗ Failed to get access token. Aborting tests.${NC}"
    exit 1
fi

echo -e "${GREEN}Access token obtained${NC}"
echo ""

echo -e "${BLUE}1.2 Get Current User${NC}"
test_api "GET" "/api/auth/me" "" 200 "Get current user details"
echo ""

echo -e "${BLUE}1.3 Refresh Token${NC}"
test_api "POST" "/api/auth/refresh" "" 401 "Refresh without cookie"
echo ""

echo -e "${BLUE}1.4 Logout${NC}"
test_api "POST" "/api/auth/logout" "" 200 "Logout current session"
echo ""

# Re-login to continue testing
LOGIN_RESPONSE=$(test_api "POST" "/api/auth/login" \
    "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    201 "Re-login for continued testing")
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('accessToken', ''))" 2>/dev/null)
echo ""

# ============================================
# SECTION 2: USER MANAGEMENT
# ============================================
echo -e "${YELLOW}=== SECTION 2: USER MANAGEMENT ===${NC}"
echo ""

echo -e "${BLUE}2.1 User Hierarchy${NC}"
test_api "GET" "/api/users/hierarchy" "" 200 "Get organizational hierarchy"
echo ""

echo -e "${BLUE}2.2 Assignable Users${NC}"
ASSIGNABLE_RESPONSE=$(test_api "GET" "/api/users/assignable" "" 200 "Get assignable users")
USER_ID=$(extract_first_id "$ASSIGNABLE_RESPONSE")
echo ""

if [ -n "$USER_ID" ]; then
    echo -e "${BLUE}2.3 Update User Role${NC}"
    test_api "PUT" "/api/users/$USER_ID/role" "{\"role\":\"employee\"}" 200 "Update user role"
    echo ""
    
    echo -e "${BLUE}2.4 Get Role History${NC}"
    test_api "GET" "/api/users/$USER_ID/role-history" "" 200 "Get role change history"
    echo ""
    
    echo -e "${BLUE}2.5 Update Home Location${NC}"
    test_api "PUT" "/api/users/$USER_ID/home-location" \
        "{\"latitude\":12.9716,\"longitude\":77.5946}" \
        200 "Update user home location"
    echo ""
    
    echo -e "${BLUE}2.6 Update Manager${NC}"
    test_api "PUT" "/api/users/$USER_ID/manager" \
        "{\"managerId\":\"$USER_ID\"}" \
        200 "Assign manager to user"
    echo ""
    
    echo -e "${BLUE}2.7 Get Compensation${NC}"
    test_api "GET" "/api/users/$USER_ID/compensation" "" 200 "Get user compensation details"
    echo ""
fi

# ============================================
# SECTION 3: EMPLOYEES
# ============================================
echo -e "${YELLOW}=== SECTION 3: EMPLOYEES ===${NC}"
echo ""

echo -e "${BLUE}3.1 List Employees${NC}"
EMPLOYEES_RESPONSE=$(test_api "GET" "/api/employees" "" 200 "List all employees")
EMPLOYEE_ID=$(extract_first_id "$EMPLOYEES_RESPONSE")
echo ""

echo -e "${BLUE}3.2 List Employees with Filters${NC}"
test_api "GET" "/api/employees?department=engineering&status=active&page=1&limit=10" "" 200 "Filter employees"
echo ""

echo -e "${BLUE}3.3 Create Employee${NC}"
NEW_EMPLOYEE_RESPONSE=$(test_api "POST" "/api/employees" \
    "{\"email\":\"test.employee@example.com\",\"name\":\"Test Employee\",\"password\":\"TestPass123\",\"phone\":\"+919876543210\",\"department\":\"engineering\",\"role\":\"employee\",\"salary\":50000,\"compensationType\":\"paid\",\"compensationAmount\":50000}" \
    201 "Create new employee")
NEW_EMPLOYEE_ID=$(extract_id "$NEW_EMPLOYEE_RESPONSE")
echo ""

if [ -n "$NEW_EMPLOYEE_ID" ]; then
    echo -e "${BLUE}3.4 Get Employee Details${NC}"
    test_api "GET" "/api/employees/$NEW_EMPLOYEE_ID" "" 200 "Get specific employee"
    echo ""
    
    echo -e "${BLUE}3.5 Update Employee Password${NC}"
    test_api "PUT" "/api/employees/$NEW_EMPLOYEE_ID/password" \
        "{\"password\":\"NewPassword123\"}" \
        200 "Update employee password"
    echo ""
fi

if [ -n "$EMPLOYEE_ID" ]; then
    echo -e "${BLUE}3.6 Get Existing Employee${NC}"
    test_api "GET" "/api/employees/$EMPLOYEE_ID" "" 200 "Get existing employee"
    echo ""
fi

# ============================================
# SECTION 4: ROLES & PERMISSIONS
# ============================================
echo -e "${YELLOW}=== SECTION 4: ROLES & PERMISSIONS ===${NC}"
echo ""

echo -e "${BLUE}4.1 List Roles${NC}"
test_api "GET" "/api/roles" "" 200 "List all roles"
echo ""

echo -e "${BLUE}4.2 Get Specific Role${NC}"
test_api "GET" "/api/roles/admin" "" 200 "Get admin role details"
echo ""

echo -e "${BLUE}4.3 Get Role Permissions${NC}"
test_api "GET" "/api/roles/admin/permissions" "" 200 "Get admin role permissions"
echo ""

echo -e "${BLUE}4.4 Get Role by Key${NC}"
test_api "GET" "/api/roles/employee" "" 200 "Get employee role"
echo ""

echo -e "${BLUE}4.5 List Permissions${NC}"
test_api "GET" "/api/permissions" "" 200 "List all available permissions"
echo ""

# ============================================
# SECTION 5: DEPARTMENTS
# ============================================
echo -e "${YELLOW}=== SECTION 5: DEPARTMENTS ===${NC}"
echo ""

echo -e "${BLUE}5.1 List Departments${NC}"
DEPT_RESPONSE=$(test_api "GET" "/api/departments" "" 200 "List all departments")
DEPT_KEY=$(echo "$DEPT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); items=data.get('data', []); print(items[0].get('key', '') if items else '')" 2>/dev/null)
echo ""

if [ -n "$DEPT_KEY" ]; then
    echo -e "${BLUE}5.2 Get Department Details${NC}"
    test_api "GET" "/api/departments/$DEPT_KEY" "" 200 "Get specific department"
    echo ""
fi

# ============================================
# SECTION 6: LEADS
# ============================================
echo -e "${YELLOW}=== SECTION 6: LEADS ===${NC}"
echo ""

echo -e "${BLUE}6.1 List Leads${NC}"
LEADS_RESPONSE=$(test_api "GET" "/api/leads" "" 200 "List all leads")
LEAD_ID=$(extract_first_id "$LEADS_RESPONSE")
echo ""

echo -e "${BLUE}6.2 Filter Leads${NC}"
test_api "GET" "/api/leads?status=open&priority=hot&page=1&limit=10" "" 200 "Filter leads by status and priority"
echo ""

echo -e "${BLUE}6.3 Search Leads${NC}"
test_api "GET" "/api/leads?search=test" "" 200 "Search leads"
echo ""

echo -e "${BLUE}6.4 Create Lead${NC}"
NEW_LEAD_RESPONSE=$(test_api "POST" "/api/leads" \
    "{\"name\":\"Test Lead\",\"email\":\"test.lead@example.com\",\"phone\":\"+919876543211\",\"alternatePhone\":\"+919876543212\",\"courseInterested\":\"Cyber Security\",\"source\":\"ads\",\"priority\":\"hot\",\"notes\":\"Interested in full course\",\"assignedTo\":\"$USER_ID\"}" \
    201 "Create new lead")
NEW_LEAD_ID=$(extract_id "$NEW_LEAD_RESPONSE")
echo ""

if [ -n "$LEAD_ID" ]; then
    echo -e "${BLUE}6.5 Get Lead Details${NC}"
    test_api "GET" "/api/leads/$LEAD_ID" "" 200 "Get specific lead"
    echo ""
    
    echo -e "${BLUE}6.6 Get Lead Activities${NC}"
    test_api "GET" "/api/leads/$LEAD_ID/activities" "" 200 "Get lead activity history"
    echo ""
    
    echo -e "${BLUE}6.7 Get Lead Calls${NC}"
    test_api "GET" "/api/leads/$LEAD_ID/calls" "" 200 "Get lead call records"
    echo ""
    
    echo -e "${BLUE}6.8 Claim Lead${NC}"
    test_api "POST" "/api/leads/$LEAD_ID/claim" "" 200 "Claim lead for current user"
    echo ""
fi

# ============================================
# SECTION 7: LEAD TYPES
# ============================================
echo -e "${YELLOW}=== SECTION 7: LEAD TYPES ===${NC}"
echo ""

echo -e "${BLUE}7.1 List Lead Types${NC}"
LEAD_TYPES_RESPONSE=$(test_api "GET" "/api/lead-types" "" 200 "List all lead types")
LEAD_TYPE_ID=$(extract_first_id "$LEAD_TYPES_RESPONSE")
echo ""

if [ -n "$LEAD_TYPE_ID" ]; then
    echo -e "${BLUE}7.2 Get Lead Type${NC}"
    test_api "GET" "/api/lead-types/$LEAD_TYPE_ID" "" 200 "Get specific lead type"
    echo ""
fi

# ============================================
# SECTION 8: TASKS
# ============================================
echo -e "${YELLOW}=== SECTION 8: TASKS ===${NC}"
echo ""

echo -e "${BLUE}8.1 List Tasks${NC}"
TASKS_RESPONSE=$(test_api "GET" "/api/tasks" "" 200 "List all tasks")
TASK_ID=$(extract_first_id "$TASKS_RESPONSE")
echo ""

echo -e "${BLUE}8.2 Filter Tasks${NC}"
test_api "GET" "/api/tasks?status=pending&priority=high&type=task" "" 200 "Filter tasks"
echo ""

echo -e "${BLUE}8.3 Search Tasks${NC}"
test_api "GET" "/api/tasks?search=test" "" 200 "Search tasks"
echo ""

echo -e "${BLUE}8.4 Create Task${NC}"
NEW_TASK_RESPONSE=$(test_api "POST" "/api/tasks" \
    "{\"title\":\"Test Task for API Testing\",\"description\":\"This is a comprehensive test task\",\"type\":\"task\",\"priority\":\"medium\",\"assignedTo\":\"$USER_ID\",\"dueDate\":\"2026-04-20\",\"estimatedHours\":2.5,\"tags\":[\"testing\",\"api\"],\"notes\":\"Created during API testing\"}" \
    201 "Create new task")
NEW_TASK_ID=$(extract_id "$NEW_TASK_RESPONSE")
echo ""

if [ -n "$TASK_ID" ]; then
    echo -e "${BLUE}8.5 Get Task Details${NC}"
    test_api "GET" "/api/tasks/$TASK_ID" "" 200 "Get specific task"
    echo ""
    
    echo -e "${BLUE}8.6 Get Task History${NC}"
    test_api "GET" "/api/tasks/$TASK_ID/history" "" 200 "Get task change history"
    echo ""
    
    echo -e "${BLUE}8.7 Get Task Comments${NC}"
    test_api "GET" "/api/tasks/$TASK_ID/comments" "" 200 "Get task comments"
    echo ""
    
    echo -e "${BLUE}8.8 Get Task Time Logs${NC}"
    test_api "GET" "/api/tasks/$TASK_ID/time-logs" "" 200 "Get task time logs"
    echo ""
    
echo -e "${BLUE}8.9 Assign Task${NC}"
test_api "POST" "/api/tasks/$TASK_ID/assign" \
    "{\"assignedTo\":\"$USER_ID\"}" \
    200 "Reassign task"
echo ""
    
    echo -e "${BLUE}8.10 Start Task${NC}"
    test_api "POST" "/api/tasks/$TASK_ID/start" "" 200 "Start task execution"
    echo ""
    
    echo -e "${BLUE}8.11 Complete Task${NC}"
    test_api "POST" "/api/tasks/$TASK_ID/complete" "" 200 "Mark task as complete"
    echo ""
fi

if [ -n "$NEW_TASK_ID" ]; then
    echo -e "${BLUE}8.12 Cancel Task${NC}"
    test_api "POST" "/api/tasks/$NEW_TASK_ID/cancel" \
        "{\"reason\":\"Cancelled during testing\"}" \
        200 "Cancel task"
    echo ""
fi

# ============================================
# SECTION 9: BUGS
# ============================================
echo -e "${YELLOW}=== SECTION 9: BUGS ===${NC}"
echo ""

echo -e "${BLUE}9.1 List Bugs${NC}"
BUGS_RESPONSE=$(test_api "GET" "/api/bugs" "" 200 "List all bugs")
BUG_ID=$(extract_first_id "$BUGS_RESPONSE")
echo ""

echo -e "${BLUE}9.2 Create Bug${NC}"
NEW_BUG_RESPONSE=$(test_api "POST" "/api/bugs" \
    "{\"title\":\"Test Bug Report\",\"description\":\"This is a test bug for API testing\",\"severity\":\"medium\",\"priority\":\"high\",\"assignedTo\":\"$USER_ID\"}" \
    201 "Report new bug")
NEW_BUG_ID=$(extract_id "$NEW_BUG_RESPONSE")
echo ""

if [ -n "$BUG_ID" ]; then
    echo -e "${BLUE}9.3 Get Bug Details${NC}"
    test_api "GET" "/api/bugs/$BUG_ID" "" 200 "Get specific bug"
    echo ""
    
    echo -e "${BLUE}9.4 Get Bug Screenshot${NC}"
    test_api "GET" "/api/bugs/$BUG_ID/screenshot" "" 200 "Get bug screenshot"
    echo ""
    
echo -e "${BLUE}9.5 Assign Bug${NC}"
test_api "POST" "/api/bugs/$BUG_ID/assign" \
    "{\"assignedTo\":\"$USER_ID\"}" \
    200 "Assign bug to developer"
echo ""
fi

# ============================================
# SECTION 10: ATTENDANCE
# ============================================
echo -e "${YELLOW}=== SECTION 10: ATTENDANCE ===${NC}"
echo ""

echo -e "${BLUE}10.1 Get Today's Attendance${NC}"
ATTENDANCE_RESPONSE=$(test_api "GET" "/api/attendance/today" "" 200 "Get today's attendance status")
ATTENDANCE_ID=$(extract_id "$ATTENDANCE_RESPONSE")
echo ""

echo -e "${BLUE}10.2 Check In${NC}"
test_api "POST" "/api/attendance/today" \
    "{\"latitude\":12.9716,\"longitude\":77.5946,\"notes\":\"API test check-in\"}" \
    201 "Check in with location"
echo ""

echo -e "${BLUE}10.3 Check Out${NC}"
test_api "PUT" "/api/attendance/today" \
    "{\"latitude\":12.9716,\"longitude\":77.5946,\"notes\":\"API test check-out\"}" \
    200 "Check out with location"
echo ""

echo -e "${BLUE}10.4 Get Attendance History${NC}"
test_api "GET" "/api/attendance/history" "" 200 "Get attendance history"
echo ""

echo -e "${BLUE}10.5 Get Team Attendance${NC}"
test_api "GET" "/api/attendance/team-today" "" 200 "Get team's attendance"
echo ""

echo -e "${BLUE}10.6 Get Attendance Warnings${NC}"
test_api "GET" "/api/attendance/warnings" "" 200 "Get attendance warnings"
echo ""

echo -e "${BLUE}10.7 Get Attendance Settings${NC}"
test_api "GET" "/api/attendance/settings" "" 200 "Get attendance settings"
echo ""

echo -e "${BLUE}10.8 Get Attendance Adjustments${NC}"
test_api "GET" "/api/attendance/adjustments" "" 200 "Get attendance adjustments"
echo ""

echo -e "${BLUE}10.9 Get Security Logs${NC}"
test_api "GET" "/api/attendance/security" "" 200 "Get security attendance logs"
echo ""

echo -e "${BLUE}10.10 Send Heartbeat${NC}"
test_api "POST" "/api/attendance/heartbeat" "" 200 "Send attendance heartbeat"
echo ""

if [ -n "$ATTENDANCE_ID" ]; then
    echo -e "${BLUE}10.11 Adjust Attendance${NC}"
    test_api "POST" "/api/attendance/$ATTENDANCE_ID/adjust" \
        "{\"reason\":\"Testing adjustment\"}" \
        200 "Adjust attendance record"
    echo ""
fi

# ============================================
# SECTION 11: TIME ENTRIES
# ============================================
echo -e "${YELLOW}=== SECTION 11: TIME ENTRIES ===${NC}"
echo ""

TODAY_DATE=$(date +%Y-%m-%d)

echo -e "${BLUE}11.1 List Time Entries${NC}"
TIME_ENTRIES_RESPONSE=$(test_api "GET" "/api/time-entries" "" 200 "List time entries")
TIME_ENTRY_ID=$(extract_first_id "$TIME_ENTRIES_RESPONSE")
echo ""

echo -e "${BLUE}11.2 Filter Time Entries${NC}"
test_api "GET" "/api/time-entries?date=$TODAY_DATE&status=pending" "" 200 "Filter time entries by date"
echo ""

echo -e "${BLUE}11.3 Create Time Entry${NC}"
NEW_TIME_ENTRY_RESPONSE=$(test_api "POST" "/api/time-entries" \
    "{\"date\":\"$TODAY_DATE\",\"startTime\":\"09:00\",\"endTime\":\"11:00\",\"description\":\"API testing time entry\",\"taskId\":\"$NEW_TASK_ID\"}" \
    201 "Log time entry")
NEW_TIME_ENTRY_ID=$(extract_id "$NEW_TIME_ENTRY_RESPONSE")
echo ""

echo -e "${BLUE}11.4 Get Current Time${NC}"
test_api "GET" "/api/time/now" "" 200 "Get server time"
echo ""

if [ -n "$TIME_ENTRY_ID" ]; then
    echo -e "${BLUE}11.5 Get Time Entry${NC}"
    test_api "GET" "/api/time-entries/$TIME_ENTRY_ID" "" 200 "Get specific time entry"
    echo ""
    
    echo -e "${BLUE}11.6 Approve Time Entry${NC}"
    test_api "POST" "/api/time-entries/$TIME_ENTRY_ID/approve" "" 200 "Approve time entry"
    echo ""
fi

if [ -n "$NEW_TIME_ENTRY_ID" ]; then
    echo -e "${BLUE}11.7 Reject Time Entry${NC}"
    test_api "POST" "/api/time-entries/$NEW_TIME_ENTRY_ID/reject" \
        "{\"reason\":\"Rejected during testing\"}" \
        200 "Reject time entry"
    echo ""
fi

# ============================================
# SECTION 12: TIMESHEETS
# ============================================
echo -e "${YELLOW}=== SECTION 12: TIMESHEETS ===${NC}"
echo ""

echo -e "${BLUE}12.1 List Timesheets${NC}"
TIMESHEETS_RESPONSE=$(test_api "GET" "/api/timesheets" "" 200 "List timesheets")
TIMESHEET_ID=$(extract_first_id "$TIMESHEETS_RESPONSE")
echo ""

echo -e "${BLUE}12.2 Filter Timesheets${NC}"
test_api "GET" "/api/timesheets?workDate=$TODAY_DATE" "" 200 "Filter timesheets by date"
echo ""

echo -e "${BLUE}12.3 Create Timesheet${NC}"
NEW_TIMESHEET_RESPONSE=$(test_api "POST" "/api/timesheets" \
    "{\"employeeId\":\"$USER_ID\",\"workDate\":\"$TODAY_DATE\",\"notes\":\"API test timesheet\"}" \
    201 "Create timesheet")
NEW_TIMESHEET_ID=$(extract_id "$NEW_TIMESHEET_RESPONSE")
echo ""

if [ -n "$TIMESHEET_ID" ]; then
    echo -e "${BLUE}12.4 Get Timesheet${NC}"
    test_api "GET" "/api/timesheets/$TIMESHEET_ID" "" 200 "Get specific timesheet"
    echo ""
    
    echo -e "${BLUE}12.5 Get Timesheet Entries${NC}"
    test_api "GET" "/api/timesheets/$TIMESHEET_ID/entries" "" 200 "Get timesheet entries"
    echo ""
fi

# ============================================
# SECTION 13: TIMESHEET ENTRIES (APPROVALS)
# ============================================
echo -e "${YELLOW}=== SECTION 13: TIMESHEET APPROVALS ===${NC}"
echo ""

echo -e "${BLUE}13.1 Get Pending Entries${NC}"
test_api "GET" "/api/timesheet-entries/pending" "" 200 "Get pending timesheet entries"
echo ""

echo -e "${BLUE}13.2 Get My Stats${NC}"
test_api "GET" "/api/timesheet-entries/my-stats" "" 200 "Get my timesheet statistics"
echo ""

echo -e "${BLUE}13.3 Bulk Approve${NC}"
test_api "POST" "/api/timesheet-entries/bulk-approve" "{\"ids\":[]}" 200 "Bulk approve entries"
echo ""

echo -e "${BLUE}13.4 Bulk Reject${NC}"
test_api "POST" "/api/timesheet-entries/bulk-reject" "{\"ids\":[],\"reason\":\"Testing bulk reject\"}" 200 "Bulk reject entries"
echo ""

PENDING_ENTRIES_RESPONSE=$(test_api "GET" "/api/timesheet-entries/pending" "" 200)
PENDING_ENTRY_ID=$(extract_first_id "$PENDING_ENTRIES_RESPONSE")

if [ -n "$PENDING_ENTRY_ID" ]; then
    echo -e "${BLUE}13.5 Get Entry Details${NC}"
    test_api "GET" "/api/timesheet-entries/$PENDING_ENTRY_ID" "" 200 "Get entry details"
    echo ""
    
    echo -e "${BLUE}13.6 Approve Entry${NC}"
    test_api "POST" "/api/timesheet-entries/$PENDING_ENTRY_ID/approve" "" 200 "Approve single entry"
    echo ""
fi

# ============================================
# SECTION 14: LEAVES
# ============================================
echo -e "${YELLOW}=== SECTION 14: LEAVES ===${NC}"
echo ""

echo -e "${BLUE}14.1 List Leaves${NC}"
LEAVES_RESPONSE=$(test_api "GET" "/api/leaves" "" 200 "List leave requests")
LEAVE_ID=$(extract_first_id "$LEAVES_RESPONSE")
echo ""

echo -e "${BLUE}14.2 Filter Leaves${NC}"
test_api "GET" "/api/leaves?status=pending&type=sick&year=2026" "" 200 "Filter leave requests"
echo ""

echo -e "${BLUE}14.3 Get Leave Balances${NC}"
test_api "GET" "/api/leaves/balances" "" 200 "Get leave balances for all"
echo ""

echo -e "${BLUE}14.4 Get My Leave Balance${NC}"
test_api "GET" "/api/leaves/balance" "" 200 "Get my leave balance"
echo ""

echo -e "${BLUE}14.5 Apply for Leave${NC}"
FUTURE_DATE=$(date -v+7d +%Y-%m-%d)
END_DATE=$(date -v+8d +%Y-%m-%d)
NEW_LEAVE_RESPONSE=$(test_api "POST" "/api/leaves" \
    "{\"type\":\"casual\",\"startDate\":\"$FUTURE_DATE\",\"endDate\":\"$END_DATE\",\"reason\":\"API testing leave application\"}" \
    201 "Apply for casual leave")
NEW_LEAVE_ID=$(extract_id "$NEW_LEAVE_RESPONSE")
echo ""

if [ -n "$LEAVE_ID" ]; then
    echo -e "${BLUE}14.6 Get Leave Details${NC}"
    test_api "GET" "/api/leaves/$LEAVE_ID" "" 200 "Get leave request details"
    echo ""
    
    echo -e "${BLUE}14.7 Approve Leave${NC}"
    test_api "POST" "/api/leaves/$LEAVE_ID/approve" "" 200 "Approve leave request"
    echo ""
fi

if [ -n "$NEW_LEAVE_ID" ]; then
    echo -e "${BLUE}14.8 Cancel Leave${NC}"
    test_api "POST" "/api/leaves/$NEW_LEAVE_ID/cancel" "" 200 "Cancel leave request"
    echo ""
fi

# ============================================
# SECTION 15: PAYROLL
# ============================================
echo -e "${YELLOW}=== SECTION 15: PAYROLL ===${NC}"
echo ""

echo -e "${BLUE}15.1 List Payroll Records${NC}"
PAYROLL_RESPONSE=$(test_api "GET" "/api/payroll" "" 200 "List payroll records")
PAYROLL_ID=$(extract_first_id "$PAYROLL_RESPONSE")
echo ""

echo -e "${BLUE}15.2 Get Payroll Employees${NC}"
test_api "GET" "/api/payroll/employees" "" 200 "Get payroll employee list"
echo ""

echo -e "${BLUE}15.3 Get Payroll Hours${NC}"
test_api "GET" "/api/payroll/hours" "" 200 "Get payroll hours data"
echo ""

echo -e "${BLUE}15.4 Get Payroll Summary${NC}"
test_api "GET" "/api/payroll/summary" "" 200 "Get payroll summary"
echo ""

echo -e "${BLUE}15.5 Get Payroll Settings${NC}"
test_api "GET" "/api/payroll/settings" "" 200 "Get payroll settings"
echo ""

CURRENT_MONTH=$(date +%Y-%m)
echo -e "${BLUE}15.6 Run Payroll${NC}"
test_api "POST" "/api/payroll/run" "{\"month\":\"$CURRENT_MONTH\"}" 200 "Process payroll for month"
echo ""

if [ -n "$PAYROLL_ID" ]; then
    echo -e "${BLUE}15.7 Get Payroll Details${NC}"
    test_api "GET" "/api/payroll/$PAYROLL_ID" "" 200 "Get specific payroll record"
    echo ""
fi

# ============================================
# SECTION 16: INTERNS
# ============================================
echo -e "${YELLOW}=== SECTION 16: INTERNS ===${NC}"
echo ""

echo -e "${BLUE}16.1 List Interns${NC}"
INTERNS_RESPONSE=$(test_api "GET" "/api/interns" "" 200 "List all interns")
INTERN_ID=$(extract_first_id "$INTERNS_RESPONSE")
echo ""

echo -e "${BLUE}16.2 Filter Interns${NC}"
test_api "GET" "/api/interns?status=active&department=engineering" "" 200 "Filter interns"
echo ""

START_DATE=$(date +%Y-%m-%d)
END_DATE=$(date -v+3m +%Y-%m-%d)
echo -e "${BLUE}16.3 Create Intern${NC}"
NEW_INTERN_RESPONSE=$(test_api "POST" "/api/interns" \
    "{\"email\":\"test.intern@example.com\",\"password\":\"InternPass123\",\"name\":\"Test Intern\",\"phone\":\"+919876543213\",\"department\":\"engineering\",\"managedBy\":\"$USER_ID\",\"compensationType\":\"paid\",\"compensationAmount\":5000,\"profile\":{\"alternatePhone\":\"+919876543214\",\"internshipType\":\"paid\",\"duration\":\"3_months\",\"college\":\"Test University\",\"degree\":\"B.Tech\",\"year\":\"3rd\",\"skills\":[\"python\",\"javascript\"],\"startDate\":\"$START_DATE\",\"expectedEndDate\":\"$END_DATE\",\"status\":\"active\",\"source\":\"website\",\"notes\":\"API test intern\"}}" \
    201 "Register new intern")
NEW_INTERN_ID=$(extract_id "$NEW_INTERN_RESPONSE")
echo ""

if [ -n "$INTERN_ID" ]; then
    echo -e "${BLUE}16.4 Get Intern Details${NC}"
    test_api "GET" "/api/interns/$INTERN_ID" "" 200 "Get intern profile"
    echo ""
    
    echo -e "${BLUE}16.5 Approve Intern${NC}"
    test_api "POST" "/api/interns/$INTERN_ID/approve" "" 200 "Approve intern registration"
    echo ""
fi

if [ -n "$NEW_INTERN_ID" ]; then
    echo -e "${BLUE}16.6 Reject Intern${NC}"
    test_api "POST" "/api/interns/$NEW_INTERN_ID/reject" \
        "{\"reason\":\"Rejected during testing\"}" \
        200 "Reject intern"
    echo ""
fi

# ============================================
# SECTION 17: BATCHES
# ============================================
echo -e "${YELLOW}=== SECTION 17: BATCHES ===${NC}"
echo ""

echo -e "${BLUE}17.1 List Batches${NC}"
test_api "GET" "/api/batches" "" 200 "List training batches"
echo ""

BATCH_START=$(date -v+1m +%Y-%m-%d)
BATCH_END=$(date -v+4m +%Y-%m-%d)
echo -e "${BLUE}17.2 Create Batch${NC}"
NEW_BATCH_RESPONSE=$(test_api "POST" "/api/batches" \
    "{\"name\":\"Test Batch 2026\",\"startDate\":\"$BATCH_START\",\"endDate\":\"$BATCH_END\",\"capacity\":30,\"course\":\"Cyber Security\",\"department\":\"training\"}" \
    201 "Create new training batch")
NEW_BATCH_ID=$(extract_id "$NEW_BATCH_RESPONSE")
echo ""

# ============================================
# SECTION 18: DASHBOARD
# ============================================
echo -e "${YELLOW}=== SECTION 18: DASHBOARD ===${NC}"
echo ""

echo -e "${BLUE}18.1 Dashboard Summary${NC}"
test_api "GET" "/api/dashboard/summary" "" 200 "Get dashboard statistics"
echo ""

# ============================================
# SECTION 19: SETTINGS
# ============================================
echo -e "${YELLOW}=== SECTION 19: SETTINGS ===${NC}"
echo ""

echo -e "${BLUE}19.1 Get Office Location${NC}"
test_api "GET" "/api/settings/office-location" "" 200 "Get office location settings"
echo ""

echo -e "${BLUE}19.2 Update Office Location${NC}"
test_api "PUT" "/api/settings/office-location" \
    "{\"latitude\":12.9716,\"longitude\":77.5946,\"radius\":100,\"address\":\"Test Office Address\"}" \
    200 "Update office location"
echo ""

# ============================================
# FINAL SUMMARY
# ============================================
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Total Tests Run:     ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:              ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:              ${FAILED_TESTS}${NC}"
echo -e "Success Rate:        $(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}Review the failed tests above for details${NC}"
    exit 1
fi