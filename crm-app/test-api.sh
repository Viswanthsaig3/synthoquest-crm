#!/bin/bash

# Comprehensive API Endpoint Testing Script for SynthoQuest CRM
# macOS compatible version

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

# Store IDs
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
ACCESS_TOKEN=""

# Store test results file
RESULTS_FILE="api-test-results.md"

# Initialize results file
echo "# SynthoQuest CRM API Test Results" > $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "**Date:** $(date)" >> $RESULTS_FILE
echo "**Base URL:** $BASE_URL" >> $RESULTS_FILE
echo "**Admin Email:** $ADMIN_EMAIL" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Test function - returns HTTP code and Body
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected=${4:-200}
    
    local url="${BASE_URL}${endpoint}"
    local headers=""
    
    if [ -n "$ACCESS_TOKEN" ]; then
        headers="-H 'Authorization: Bearer $ACCESS_TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        headers="$headers -H 'Content-Type: application/json'"
    fi
    
    # Execute curl - make two calls for reliability
    local body
    local http_code
    
    if [ -n "$data" ]; then
        body=$(curl -s $headers -d "$data" -X "$method" "$url")
        http_code=$(curl -s -o /dev/null -w "%{http_code}" $headers -d "$data" -X "$method" "$url")
    else
        body=$(curl -s $headers -X "$method" "$url")
        http_code=$(curl -s -o /dev/null -w "%{http_code}" $headers -X "$method" "$url")
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Store body in global variable for extraction
    LAST_BODY="$body"
    
    # Check result
    if [ "$http_code" -eq "$expected" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC} [$http_code] $method $endpoint"
        echo "- **Test:** $method $endpoint" >> $RESULTS_FILE
        echo "- **Status:** ✓ PASS ($http_code)" >> $RESULTS_FILE
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAIL${NC} [$http_code (expected: $expected)] $method $endpoint"
        echo "- **Test:** $method $endpoint" >> $RESULTS_FILE
        echo "- **Status:** ✗ FAIL (expected: $expected, got: $http_code)" >> $RESULTS_FILE
        if [ -n "$body" ]; then
            echo "- **Response:**" >> $RESULTS_FILE
            echo '```json' >> $RESULTS_FILE
            echo "$body" | python3 -m json.tool 2>/dev/null >> $RESULTS_FILE || echo "$body" >> $RESULTS_FILE
            echo '```' >> $RESULTS_FILE
        fi
        echo "" >> $RESULTS_FILE
        return 1
    fi
}

# Helper to extract ID
get_id() {
    echo "$LAST_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', {}).get('id', ''))" 2>/dev/null
}

# Helper to extract first ID from list
get_first_id() {
    echo "$LAST_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); items=d.get('data', []); print(items[0].get('id', '') if items else '')" 2>/dev/null
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}SynthoQuest CRM - API Endpoint Testing${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "## Test Execution Log" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# ============================================
# SECTION 1: AUTH
# ============================================
echo -e "${YELLOW}=== AUTH ENDPOINTS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 1. Authentication Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}1.1 Login${NC}"
test_endpoint POST "/api/auth/login" '{"email":"admin@synthoquest.com","password":"Admin@123"}' 201
ACCESS_TOKEN=$(echo "$LAST_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', {}).get('accessToken', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Failed to obtain access token. Cannot continue testing.${NC}"
    exit 1
fi

echo -e "${GREEN}Access token obtained${NC}"
echo ""

echo -e "${BLUE}1.2 Get Current User${NC}"
test_endpoint GET "/api/auth/me" '' 200
echo ""

echo -e "${BLUE}1.3 Logout${NC}"
test_endpoint POST "/api/auth/logout" '' 200
echo ""

# Re-login for continued testing
echo -e "${BLUE}1.4 Re-login${NC}"
test_endpoint POST "/api/auth/login" '{"email":"admin@synthoquest.com","password":"Admin@123"}' 201
ACCESS_TOKEN=$(echo "$LAST_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', {}).get('accessToken', ''))" 2>/dev/null)
echo ""

# ============================================
# SECTION 2: USER MANAGEMENT
# ============================================
echo -e "${YELLOW}=== USER MANAGEMENT ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 2. User Management Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}2.1 User Hierarchy${NC}"
test_endpoint GET "/api/users/hierarchy" '' 200
echo ""

echo -e "${BLUE}2.2 Assignable Users${NC}"
test_endpoint GET "/api/users/assignable" '' 200
USER_ID=$(get_first_id)
echo ""

if [ -n "$USER_ID" ]; then
    echo -e "${BLUE}2.3 Update User Role${NC}"
    test_endpoint PUT "/api/users/$USER_ID/role" '{"role":"employee"}' 200
    echo ""
    
    echo -e "${BLUE}2.4 Get Role History${NC}"
    test_endpoint GET "/api/users/$USER_ID/role-history" '' 200
    echo ""
    
    echo -e "${BLUE}2.5 Update Home Location${NC}"
    test_endpoint PUT "/api/users/$USER_ID/home-location" '{"latitude":12.9716,"longitude":77.5946}' 200
    echo ""
    
    echo -e "${BLUE}2.6 Update Manager${NC}"
    test_endpoint PUT "/api/users/$USER_ID/manager" '{"managerId":"$USER_ID"}' 200
    echo ""
    
    echo -e "${BLUE}2.7 Get Compensation${NC}"
    test_endpoint GET "/api/users/$USER_ID/compensation" '' 200
    echo ""
fi

# ============================================
# SECTION 3: EMPLOYEES
# ============================================
echo -e "${YELLOW}=== EMPLOYEES ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 3. Employee Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}3.1 List Employees${NC}"
test_endpoint GET "/api/employees" '' 200
EMPLOYEE_ID=$(get_first_id)
echo ""

echo -e "${BLUE}3.2 List Employees with Filters${NC}"
test_endpoint GET "/api/employees?department=engineering&status=active&page=1&limit=10" '' 200
echo ""

echo -e "${BLUE}3.3 Create Employee${NC}"
test_endpoint POST "/api/employees" '{"email":"test.employee@example.com","name":"Test Employee","password":"TestPass123","phone":"+919876543210","department":"engineering","role":"employee","salary":50000,"compensationType":"paid","compensationAmount":50000}' 201
NEW_EMPLOYEE_ID=$(get_id)
echo ""

if [ -n "$NEW_EMPLOYEE_ID" ]; then
    echo -e "${BLUE}3.4 Get Employee Details${NC}"
    test_endpoint GET "/api/employees/$NEW_EMPLOYEE_ID" '' 200
    echo ""
    
    echo -e "${BLUE}3.5 Update Employee Password${NC}"
    test_endpoint PUT "/api/employees/$NEW_EMPLOYEE_ID/password" '{"password":"NewPassword123"}' 200
    echo ""
fi

if [ -n "$EMPLOYEE_ID" ]; then
    echo -e "${BLUE}3.6 Get Existing Employee${NC}"
    test_endpoint GET "/api/employees/$EMPLOYEE_ID" '' 200
    echo ""
fi

# ============================================
# SECTION 4: ROLES & PERMISSIONS
# ============================================
echo -e "${YELLOW}=== ROLES & PERMISSIONS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 4. Roles & Permissions Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}4.1 List Roles${NC}"
test_endpoint GET "/api/roles" '' 200
echo ""

echo -e "${BLUE}4.2 Get Admin Role${NC}"
test_endpoint GET "/api/roles/admin" '' 200
echo ""

echo -e "${BLUE}4.3 Get Role Permissions${NC}"
test_endpoint GET "/api/roles/admin/permissions" '' 200
echo ""

echo -e "${BLUE}4.4 List Permissions${NC}"
test_endpoint GET "/api/permissions" '' 200
echo ""

# ============================================
# SECTION 5: DEPARTMENTS
# ============================================
echo -e "${YELLOW}=== DEPARTMENTS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 5. Department Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}5.1 List Departments${NC}"
test_endpoint GET "/api/departments" '' 200
DEPT_KEY=$(echo "$LAST_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); items=d.get('data', []); print(items[0].get('key', '') if items else '')" 2>/dev/null)
echo ""

if [ -n "$DEPT_KEY" ]; then
    echo -e "${BLUE}5.2 Get Department${NC}"
    test_endpoint GET "/api/departments/$DEPT_KEY" '' 200
    echo ""
fi

# ============================================
# SECTION 6: LEADS
# ============================================
echo -e "${YELLOW}=== LEADS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 6. Lead Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}6.1 List Leads${NC}"
test_endpoint GET "/api/leads" '' 200
LEAD_ID=$(get_first_id)
echo ""

echo -e "${BLUE}6.2 Filter Leads${NC}"
test_endpoint GET "/api/leads?status=open&priority=hot&page=1&limit=10" '' 200
echo ""

echo -e "${BLUE}6.3 Search Leads${NC}"
test_endpoint GET "/api/leads?search=test" '' 200
echo ""

echo -e "${BLUE}6.4 Create Lead${NC}"
test_endpoint POST "/api/leads" '{"name":"Test Lead","email":"test.lead@example.com","phone":"+919876543211","courseInterested":"Cyber Security","source":"ads","priority":"hot","notes":"Interested in full course","assignedTo":"$USER_ID"}' 201
NEW_LEAD_ID=$(get_id)
echo ""

if [ -n "$LEAD_ID" ]; then
    echo -e "${BLUE}6.5 Get Lead Details${NC}"
    test_endpoint GET "/api/leads/$LEAD_ID" '' 200
    echo ""
    
    echo -e "${BLUE}6.6 Get Lead Activities${NC}"
    test_endpoint GET "/api/leads/$LEAD_ID/activities" '' 200
    echo ""
    
    echo -e "${BLUE}6.7 Get Lead Calls${NC}"
    test_endpoint GET "/api/leads/$LEAD_ID/calls" '' 200
    echo ""
    
    echo -e "${BLUE}6.8 Claim Lead${NC}"
    test_endpoint POST "/api/leads/$LEAD_ID/claim" '' 200
    echo ""
fi

# ============================================
# SECTION 7: LEAD TYPES
# ============================================
echo -e "${YELLOW}=== LEAD TYPES ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 7. Lead Type Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}7.1 List Lead Types${NC}"
test_endpoint GET "/api/lead-types" '' 200
LEAD_TYPE_ID=$(get_first_id)
echo ""

if [ -n "$LEAD_TYPE_ID" ]; then
    echo -e "${BLUE}7.2 Get Lead Type${NC}"
    test_endpoint GET "/api/lead-types/$LEAD_TYPE_ID" '' 200
    echo ""
fi

# ============================================
# SECTION 8: TASKS
# ============================================
echo -e "${YELLOW}=== TASKS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 8. Task Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}8.1 List Tasks${NC}"
test_endpoint GET "/api/tasks" '' 200
TASK_ID=$(get_first_id)
echo ""

echo -e "${BLUE}8.2 Filter Tasks${NC}"
test_endpoint GET "/api/tasks?status=pending&priority=high&type=task" '' 200
echo ""

echo -e "${BLUE}8.3 Search Tasks${NC}"
test_endpoint GET "/api/tasks?search=test" '' 200
echo ""

echo -e "${BLUE}8.4 Create Task${NC}"
test_endpoint POST "/api/tasks" '{"title":"Test Task for API Testing","description":"This is a comprehensive test task","type":"task","priority":"medium","assignedTo":"$USER_ID","dueDate":"2026-04-20","estimatedHours":2.5,"tags":["testing","api"],"notes":"Created during API testing"}' 201
NEW_TASK_ID=$(get_id)
echo ""

if [ -n "$TASK_ID" ]; then
    echo -e "${BLUE}8.5 Get Task Details${NC}"
    test_endpoint GET "/api/tasks/$TASK_ID" '' 200
    echo ""
    
    echo -e "${BLUE}8.6 Get Task History${NC}"
    test_endpoint GET "/api/tasks/$TASK_ID/history" '' 200
    echo ""
    
    echo -e "${BLUE}8.7 Get Task Comments${NC}"
    test_endpoint GET "/api/tasks/$TASK_ID/comments" '' 200
    echo ""
    
    echo -e "${BLUE}8.8 Get Task Time Logs${NC}"
    test_endpoint GET "/api/tasks/$TASK_ID/time-logs" '' 200
    echo ""
    
    echo -e "${BLUE}8.9 Assign Task${NC}"
    test_endpoint POST "/api/tasks/$TASK_ID/assign" '{"assignedTo":"$USER_ID"}' 200
    echo ""
    
    echo -e "${BLUE}8.10 Start Task${NC}"
    test_endpoint POST "/api/tasks/$TASK_ID/start" '' 200
    echo ""
    
    echo -e "${BLUE}8.11 Complete Task${NC}"
    test_endpoint POST "/api/tasks/$TASK_ID/complete" '' 200
    echo ""
fi

if [ -n "$NEW_TASK_ID" ]; then
    echo -e "${BLUE}8.12 Cancel Task${NC}"
    test_endpoint POST "/api/tasks/$NEW_TASK_ID/cancel" '{"reason":"Cancelled during testing"}' 200
    echo ""
fi

# ============================================
# SECTION 9: BUGS
# ============================================
echo -e "${YELLOW}=== BUGS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 9. Bug Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}9.1 List Bugs${NC}"
test_endpoint GET "/api/bugs" '' 200
BUG_ID=$(get_first_id)
echo ""

echo -e "${BLUE}9.2 Create Bug${NC}"
test_endpoint POST "/api/bugs" '{"title":"Test Bug Report","description":"This is a test bug for API testing","severity":"medium","priority":"high","assignedTo":"$USER_ID"}' 201
NEW_BUG_ID=$(get_id)
echo ""

if [ -n "$BUG_ID" ]; then
    echo -e "${BLUE}9.3 Get Bug Details${NC}"
    test_endpoint GET "/api/bugs/$BUG_ID" '' 200
    echo ""
    
    echo -e "${BLUE}9.4 Get Bug Screenshot${NC}"
    test_endpoint GET "/api/bugs/$BUG_ID/screenshot" '' 200
    echo ""
    
    echo -e "${BLUE}9.5 Assign Bug${NC}"
    test_endpoint POST "/api/bugs/$BUG_ID/assign" '{"assignedTo":"$USER_ID"}' 200
    echo ""
fi

# ============================================
# SECTION 10: ATTENDANCE
# ============================================
echo -e "${YELLOW}=== ATTENDANCE ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 10. Attendance Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}10.1 Get Today's Attendance${NC}"
test_endpoint GET "/api/attendance/today" '' 200
ATTENDANCE_ID=$(get_id)
echo ""

echo -e "${BLUE}10.2 Check In${NC}"
test_endpoint POST "/api/attendance/today" '{"latitude":12.9716,"longitude":77.5946,"notes":"API test check-in"}' 201
echo ""

echo -e "${BLUE}10.3 Check Out${NC}"
test_endpoint PUT "/api/attendance/today" '{"latitude":12.9716,"longitude":77.5946,"notes":"API test check-out"}' 200
echo ""

echo -e "${BLUE}10.4 Get Attendance History${NC}"
test_endpoint GET "/api/attendance/history" '' 200
echo ""

echo -e "${BLUE}10.5 Get Team Attendance${NC}"
test_endpoint GET "/api/attendance/team-today" '' 200
echo ""

echo -e "${BLUE}10.6 Get Attendance Warnings${NC}"
test_endpoint GET "/api/attendance/warnings" '' 200
echo ""

echo -e "${BLUE}10.7 Get Attendance Settings${NC}"
test_endpoint GET "/api/attendance/settings" '' 200
echo ""

echo -e "${BLUE}10.8 Get Attendance Adjustments${NC}"
test_endpoint GET "/api/attendance/adjustments" '' 200
echo ""

echo -e "${BLUE}10.9 Get Security Logs${NC}"
test_endpoint GET "/api/attendance/security" '' 200
echo ""

echo -e "${BLUE}10.10 Send Heartbeat${NC}"
test_endpoint POST "/api/attendance/heartbeat" '' 200
echo ""

if [ -n "$ATTENDANCE_ID" ]; then
    echo -e "${BLUE}10.11 Adjust Attendance${NC}"
    test_endpoint POST "/api/attendance/$ATTENDANCE_ID/adjust" '{"reason":"Testing adjustment"}' 200
    echo ""
fi

# ============================================
# SECTION 11: TIME ENTRIES
# ============================================
TODAY=$(date +%Y-%m-%d)
echo -e "${YELLOW}=== TIME ENTRIES ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 11. Time Entry Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}11.1 List Time Entries${NC}"
test_endpoint GET "/api/time-entries" '' 200
TIME_ENTRY_ID=$(get_first_id)
echo ""

echo -e "${BLUE}11.2 Filter Time Entries${NC}"
test_endpoint GET "/api/time-entries?date=$TODAY&status=pending" '' 200
echo ""

echo -e "${BLUE}11.3 Create Time Entry${NC}"
test_endpoint POST "/api/time-entries" '{"date":"$TODAY","startTime":"09:00","endTime":"11:00","description":"API testing time entry","taskId":"$NEW_TASK_ID"}' 201
NEW_TIME_ENTRY_ID=$(get_id)
echo ""

echo -e "${BLUE}11.4 Get Current Time${NC}"
test_endpoint GET "/api/time/now" '' 200
echo ""

if [ -n "$TIME_ENTRY_ID" ]; then
    echo -e "${BLUE}11.5 Get Time Entry${NC}"
    test_endpoint GET "/api/time-entries/$TIME_ENTRY_ID" '' 200
    echo ""
    
    echo -e "${BLUE}11.6 Approve Time Entry${NC}"
    test_endpoint POST "/api/time-entries/$TIME_ENTRY_ID/approve" '' 200
    echo ""
fi

if [ -n "$NEW_TIME_ENTRY_ID" ]; then
    echo -e "${BLUE}11.7 Reject Time Entry${NC}"
    test_endpoint POST "/api/time-entries/$NEW_TIME_ENTRY_ID/reject" '{"reason":"Rejected during testing"}' 200
    echo ""
fi

# ============================================
# SECTION 12: TIMESHEETS
# ============================================
echo -e "${YELLOW}=== TIMESHEETS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 12. Timesheet Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}12.1 List Timesheets${NC}"
test_endpoint GET "/api/timesheets" '' 200
TIMESHEET_ID=$(get_first_id)
echo ""

echo -e "${BLUE}12.2 Filter Timesheets${NC}"
test_endpoint GET "/api/timesheets?workDate=$TODAY" '' 200
echo ""

echo -e "${BLUE}12.3 Create Timesheet${NC}"
test_endpoint POST "/api/timesheets" '{"employeeId":"$USER_ID","workDate":"$TODAY","notes":"API test timesheet"}' 201
echo ""

if [ -n "$TIMESHEET_ID" ]; then
    echo -e "${BLUE}12.4 Get Timesheet${NC}"
    test_endpoint GET "/api/timesheets/$TIMESHEET_ID" '' 200
    echo ""
    
    echo -e "${BLUE}12.5 Get Timesheet Entries${NC}"
    test_endpoint GET "/api/timesheets/$TIMESHEET_ID/entries" '' 200
    echo ""
fi

# ============================================
# SECTION 13: TIMESHEET APPROVALS
# ============================================
echo -e "${YELLOW}=== TIMESHEET APPROVALS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 13. Timesheet Approval Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}13.1 Get Pending Entries${NC}"
test_endpoint GET "/api/timesheet-entries/pending" '' 200
echo ""

echo -e "${BLUE}13.2 Get My Stats${NC}"
test_endpoint GET "/api/timesheet-entries/my-stats" '' 200
echo ""

echo -e "${BLUE}13.3 Bulk Approve${NC}"
test_endpoint POST "/api/timesheet-entries/bulk-approve" '{"ids":[]}' 200
echo ""

echo -e "${BLUE}13.4 Bulk Reject${NC}"
test_endpoint POST "/api/timesheet-entries/bulk-reject" '{"ids":[],"reason":"Testing bulk reject"}' 200
echo ""

# ============================================
# SECTION 14: LEAVES
# ============================================
echo -e "${YELLOW}=== LEAVES ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 14. Leave Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}14.1 List Leaves${NC}"
test_endpoint GET "/api/leaves" '' 200
LEAVE_ID=$(get_first_id)
echo ""

echo -e "${BLUE}14.2 Filter Leaves${NC}"
test_endpoint GET "/api/leaves?status=pending&type=sick&year=2026" '' 200
echo ""

echo -e "${BLUE}14.3 Get Leave Balances${NC}"
test_endpoint GET "/api/leaves/balances" '' 200
echo ""

echo -e "${BLUE}14.4 Get My Leave Balance${NC}"
test_endpoint GET "/api/leaves/balance" '' 200
echo ""

FUTURE=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d)
END=$(date -v+8d +%Y-%m-%d 2>/dev/null || date -d "+8 days" +%Y-%m-%d)

echo -e "${BLUE}14.5 Apply for Leave${NC}"
test_endpoint POST "/api/leaves" '{"type":"casual","startDate":"$FUTURE","endDate":"$END","reason":"API testing leave application"}' 201
NEW_LEAVE_ID=$(get_id)
echo ""

if [ -n "$LEAVE_ID" ]; then
    echo -e "${BLUE}14.6 Get Leave Details${NC}"
    test_endpoint GET "/api/leaves/$LEAVE_ID" '' 200
    echo ""
    
    echo -e "${BLUE}14.7 Approve Leave${NC}"
    test_endpoint POST "/api/leaves/$LEAVE_ID/approve" '' 200
    echo ""
fi

if [ -n "$NEW_LEAVE_ID" ]; then
    echo -e "${BLUE}14.8 Cancel Leave${NC}"
    test_endpoint POST "/api/leaves/$NEW_LEAVE_ID/cancel" '' 200
    echo ""
fi

# ============================================
# SECTION 15: PAYROLL
# ============================================
echo -e "${YELLOW}=== PAYROLL ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 15. Payroll Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}15.1 List Payroll Records${NC}"
test_endpoint GET "/api/payroll" '' 200
PAYROLL_ID=$(get_first_id)
echo ""

echo -e "${BLUE}15.2 Get Payroll Employees${NC}"
test_endpoint GET "/api/payroll/employees" '' 200
echo ""

echo -e "${BLUE}15.3 Get Payroll Hours${NC}"
test_endpoint GET "/api/payroll/hours" '' 200
echo ""

echo -e "${BLUE}15.4 Get Payroll Summary${NC}"
test_endpoint GET "/api/payroll/summary" '' 200
echo ""

echo -e "${BLUE}15.5 Get Payroll Settings${NC}"
test_endpoint GET "/api/payroll/settings" '' 200
echo ""

CURRENT_MONTH=$(date +%Y-%m)
echo -e "${BLUE}15.6 Run Payroll${NC}"
test_endpoint POST "/api/payroll/run" '{"month":"$CURRENT_MONTH"}' 200
echo ""

if [ -n "$PAYROLL_ID" ]; then
    echo -e "${BLUE}15.7 Get Payroll Details${NC}"
    test_endpoint GET "/api/payroll/$PAYROLL_ID" '' 200
    echo ""
fi

# ============================================
# SECTION 16: INTERNS
# ============================================
echo -e "${YELLOW}=== INTERNS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 16. Intern Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}16.1 List Interns${NC}"
test_endpoint GET "/api/interns" '' 200
INTERN_ID=$(get_first_id)
echo ""

echo -e "${BLUE}16.2 Filter Interns${NC}"
test_endpoint GET "/api/interns?status=active&department=engineering" '' 200
echo ""

START=$(date +%Y-%m-%d)
END_INT=$(date -v+3m +%Y-%m-%d 2>/dev/null || date -d "+3 months" +%Y-%m-%d)

echo -e "${BLUE}16.3 Create Intern${NC}"
test_endpoint POST "/api/interns" '{"email":"test.intern@example.com","password":"InternPass123","name":"Test Intern","phone":"+919876543213","department":"engineering","managedBy":"$USER_ID","compensationType":"paid","compensationAmount":5000,"profile":{"alternatePhone":"+919876543214","internshipType":"paid","duration":"3_months","college":"Test University","degree":"B.Tech","year":"3rd","skills":["python","javascript"],"startDate":"$START","expectedEndDate":"$END_INT","status":"active","source":"website","notes":"API test intern"}}' 201
NEW_INTERN_ID=$(get_id)
echo ""

if [ -n "$INTERN_ID" ]; then
    echo -e "${BLUE}16.4 Get Intern Details${NC}"
    test_endpoint GET "/api/interns/$INTERN_ID" '' 200
    echo ""
    
    echo -e "${BLUE}16.5 Approve Intern${NC}"
    test_endpoint POST "/api/interns/$INTERN_ID/approve" '' 200
    echo ""
fi

if [ -n "$NEW_INTERN_ID" ]; then
    echo -e "${BLUE}16.6 Reject Intern${NC}"
    test_endpoint POST "/api/interns/$NEW_INTERN_ID/reject" '{"reason":"Rejected during testing"}' 200
    echo ""
fi

# ============================================
# SECTION 17: BATCHES
# ============================================
echo -e "${YELLOW}=== BATCHES ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 17. Batch Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}17.1 List Batches${NC}"
test_endpoint GET "/api/batches" '' 200
echo ""

BATCH_START=$(date -v+1m +%Y-%m-%d 2>/dev/null || date -d "+1 month" +%Y-%m-%d)
BATCH_END=$(date -v+4m +%Y-%m-%d 2>/dev/null || date -d "+4 months" +%Y-%m-%d)

echo -e "${BLUE}17.2 Create Batch${NC}"
test_endpoint POST "/api/batches" '{"name":"Test Batch 2026","startDate":"$BATCH_START","endDate":"$BATCH_END","capacity":30,"course":"Cyber Security","department":"training"}' 201
echo ""

# ============================================
# SECTION 18: DASHBOARD
# ============================================
echo -e "${YELLOW}=== DASHBOARD ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 18. Dashboard Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}18.1 Dashboard Summary${NC}"
test_endpoint GET "/api/dashboard/summary" '' 200
echo ""

# ============================================
# SECTION 19: SETTINGS
# ============================================
echo -e "${YELLOW}=== SETTINGS ===${NC}"
echo "" >> $RESULTS_FILE
echo "### 19. Settings Endpoints" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${BLUE}19.1 Get Office Location${NC}"
test_endpoint GET "/api/settings/office-location" '' 200
echo ""

echo -e "${BLUE}19.2 Update Office Location${NC}"
test_endpoint PUT "/api/settings/office-location" '{"latitude":12.9716,"longitude":77.5946,"radius":100,"address":"Test Office Address"}' 200
echo ""

# ============================================
# FINAL SUMMARY
# ============================================
echo "" >> $RESULTS_FILE
echo "## Test Summary" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

echo "**Total Tests:** $TOTAL_TESTS" >> $RESULTS_FILE
echo "**Passed:** $PASSED_TESTS" >> $RESULTS_FILE
echo "**Failed:** $FAILED_TESTS" >> $RESULTS_FILE

SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo "**Success Rate:** $SUCCESS_RATE%" >> $RESULTS_FILE

echo -e "Total Tests:    ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:        ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:        ${FAILED_TESTS}${NC}"
echo -e "Success Rate:  ${SUCCESS_RATE}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}" >> $RESULTS_FILE
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Test results saved to: $RESULTS_FILE"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}" >> $RESULTS_FILE
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Test results saved to: $RESULTS_FILE"
    echo "Review failed tests in the results file"
    exit 1
fi