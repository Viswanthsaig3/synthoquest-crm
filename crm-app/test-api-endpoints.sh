#!/bin/bash

# API Endpoint Testing Script for SynthoQuest CRM
# Admin credentials: Admin@synthoquest.com / Admin@123

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="Admin@synthoquest.com"
ADMIN_PASSWORD="Admin@123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    local status=$1
    local endpoint=$2
    local message=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ $status -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC} - $endpoint - $message"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAIL${NC} - $endpoint - $message"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_required=$4
    local expected_status=$5
    
    local url="${BASE_URL}${endpoint}"
    local headers="-H 'Content-Type: application/json'"
    
    if [ "$auth_required" = "true" ]; then
        headers="$headers -H 'Authorization: Bearer $ACCESS_TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        local response=$(curl -s -w "\n%{http_code}" -X $method $headers -d "$data" "$url")
    else
        local response=$(curl -s -w "\n%{http_code}" -X $method $headers "$url")
    fi
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    # Check if status code matches expected (if provided)
    if [ -n "$expected_status" ]; then
        if [ "$http_code" -eq "$expected_status" ]; then
            print_result 0 "$method $endpoint" "Status: $http_code (expected: $expected_status)"
        else
            print_result 1 "$method $endpoint" "Status: $http_code (expected: $expected_status)"
        fi
    else
        # Accept 200, 201, 204 as success
        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ] || [ "$http_code" -eq 204 ]; then
            print_result 0 "$method $endpoint" "Status: $http_code"
        else
            print_result 1 "$method $endpoint" "Status: $http_code"
        fi
    fi
    
    # Show response body if verbose mode or if failed
    if [ "$VERBOSE" = "true" ] || [ "$http_code" -ne 200 ] && [ "$http_code" -ne 201 ] && [ "$http_code" -ne 204 ]; then
        echo -e "${BLUE}Response:${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        echo ""
    fi
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}SynthoQuest CRM API Endpoint Testing${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Step 1: Login and get access token
echo -e "${BLUE}Step 1: Login${NC}"
echo "Logging in as admin..."

LOGIN_RESPONSE=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    "${BASE_URL}/api/auth/login")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "None" ]; then
    echo -e "${RED}✗ Login failed!${NC}"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Access token obtained: ${ACCESS_TOKEN:0:20}..."
echo ""

# Verify token works
echo -e "${BLUE}Step 2: Verify authentication${NC}"
test_endpoint "GET" "/api/auth/me" "" "true" 200

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing All Endpoints${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# ============================================
# AUTH ENDPOINTS
# ============================================
echo -e "${BLUE}=== AUTH ENDPOINTS ===${NC}"
test_endpoint "POST" "/api/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" "false" 200
test_endpoint "GET" "/api/auth/me" "" "true" 200
test_endpoint "POST" "/api/auth/refresh" "" "false" 401
test_endpoint "POST" "/api/auth/logout" "" "true" 200

echo ""

# ============================================
# USER MANAGEMENT ENDPOINTS
# ============================================
echo -e "${BLUE}=== USER MANAGEMENT ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/users/hierarchy" "" "true" 200
test_endpoint "GET" "/api/users/assignable" "" "true" 200

# Test user endpoints with specific IDs (we'll need to get IDs first)
echo -e "${BLUE}Getting user IDs for testing...${NC}"
USERS_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/users/assignable")
USER_ID=$(echo "$USERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$USER_ID" ]; then
    test_endpoint "PUT" "/api/users/$USER_ID/role" "{\"role\":\"employee\"}" "true" 200
    test_endpoint "GET" "/api/users/$USER_ID/role-history" "" "true" 200
    test_endpoint "PUT" "/api/users/$USER_ID/home-location" "{\"latitude\":12.9716,\"longitude\":77.5946}" "true" 200
    test_endpoint "PUT" "/api/users/$USER_ID/manager" "{\"managerId\":\"$USER_ID\"}" "true" 200
    test_endpoint "GET" "/api/users/$USER_ID/compensation" "" "true" 200
fi

echo ""

# ============================================
# EMPLOYEE ENDPOINTS
# ============================================
echo -e "${BLUE}=== EMPLOYEE ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/employees" "" "true" 200

# Get employee ID
EMPLOYEES_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/employees")
EMPLOYEE_ID=$(echo "$EMPLOYEES_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$EMPLOYEE_ID" ]; then
    test_endpoint "GET" "/api/employees/$EMPLOYEE_ID" "" "true" 200
    test_endpoint "PUT" "/api/employees/$EMPLOYEE_ID/password" "{\"password\":\"NewPass123\"}" "true" 200
fi

echo ""

# ============================================
# ROLE & PERMISSION ENDPOINTS
# ============================================
echo -e "${BLUE}=== ROLE & PERMISSION ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/roles" "" "true" 200
test_endpoint "GET" "/api/permissions" "" "true" 200

# Test role endpoints with key
test_endpoint "GET" "/api/roles/admin" "" "true" 200
test_endpoint "GET" "/api/roles/admin/permissions" "" "true" 200

echo ""

# ============================================
# DEPARTMENT ENDPOINTS
# ============================================
echo -e "${BLUE}=== DEPARTMENT ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/departments" "" "true" 200

# Test department with key
DEPT_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/departments")
DEPT_KEY=$(echo "$DEPT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['key'] if data else '')" 2>/dev/null)

if [ -n "$DEPT_KEY" ]; then
    test_endpoint "GET" "/api/departments/$DEPT_KEY" "" "true" 200
fi

echo ""

# ============================================
# LEAD ENDPOINTS
# ============================================
echo -e "${BLUE}=== LEAD ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/leads" "" "true" 200

# Get lead ID
LEADS_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/leads")
LEAD_ID=$(echo "$LEADS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$LEAD_ID" ]; then
    test_endpoint "GET" "/api/leads/$LEAD_ID" "" "true" 200
    test_endpoint "GET" "/api/leads/$LEAD_ID/activities" "" "true" 200
    test_endpoint "GET" "/api/leads/$LEAD_ID/calls" "" "true" 200
    test_endpoint "POST" "/api/leads/$LEAD_ID/claim" "" "true" 200
fi

# Test lead creation
test_endpoint "POST" "/api/leads" "{\"name\":\"Test Lead\",\"email\":\"test@example.com\",\"phone\":\"+1234567890\",\"source\":\"website\",\"type\":\"individual\"}" "true" 201

echo ""

# ============================================
# LEAD TYPE ENDPOINTS
# ============================================
echo -e "${BLUE}=== LEAD TYPE ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/lead-types" "" "true" 200

# Get lead type ID
LEAD_TYPES_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/lead-types")
LEAD_TYPE_ID=$(echo "$LEAD_TYPES_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$LEAD_TYPE_ID" ]; then
    test_endpoint "GET" "/api/lead-types/$LEAD_TYPE_ID" "" "true" 200
fi

echo ""

# ============================================
# TASK ENDPOINTS
# ============================================
echo -e "${BLUE}=== TASK ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/tasks" "" "true" 200

# Get task ID
TASKS_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/tasks")
TASK_ID=$(echo "$TASKS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$TASK_ID" ]; then
    test_endpoint "GET" "/api/tasks/$TASK_ID" "" "true" 200
    test_endpoint "GET" "/api/tasks/$TASK_ID/history" "" "true" 200
    test_endpoint "GET" "/api/tasks/$TASK_ID/comments" "" "true" 200
    test_endpoint "GET" "/api/tasks/$TASK_ID/time-logs" "" "true" 200
    test_endpoint "POST" "/api/tasks/$TASK_ID/assign" "{\"assignedTo\":\"$USER_ID\"}" "true" 200
    test_endpoint "POST" "/api/tasks/$TASK_ID/start" "" "true" 200
    test_endpoint "POST" "/api/tasks/$TASK_ID/complete" "" "true" 200
    test_endpoint "POST" "/api/tasks/$TASK_ID/cancel" "{\"reason\":\"Testing\"}" "true" 200
fi

# Test task creation
test_endpoint "POST" "/api/tasks" "{\"title\":\"Test Task\",\"description\":\"Test description\",\"priority\":\"medium\",\"assignedTo\":\"$USER_ID\"}" "true" 201

echo ""

# ============================================
# BUG ENDPOINTS
# ============================================
echo -e "${BLUE}=== BUG ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/bugs" "" "true" 200

# Get bug ID
BUGS_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/bugs")
BUG_ID=$(echo "$BUGS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$BUG_ID" ]; then
    test_endpoint "GET" "/api/bugs/$BUG_ID" "" "true" 200
    test_endpoint "GET" "/api/bugs/$BUG_ID/screenshot" "" "true" 200
    test_endpoint "POST" "/api/bugs/$BUG_ID/assign" "{\"assignedTo\":\"$USER_ID\"}" "true" 200
fi

# Test bug creation
test_endpoint "POST" "/api/bugs" "{\"title\":\"Test Bug\",\"description\":\"Test bug description\",\"severity\":\"medium\",\"priority\":\"high\"}" "true" 201

echo ""

# ============================================
# ATTENDANCE ENDPOINTS
# ============================================
echo -e "${BLUE}=== ATTENDANCE ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/attendance/today" "" "true" 200
test_endpoint "GET" "/api/attendance/history" "" "true" 200
test_endpoint "GET" "/api/attendance/team-today" "" "true" 200
test_endpoint "GET" "/api/attendance/warnings" "" "true" 200
test_endpoint "GET" "/api/attendance/settings" "" "true" 200
test_endpoint "GET" "/api/attendance/adjustments" "" "true" 200
test_endpoint "GET" "/api/attendance/security" "" "true" 200
test_endpoint "POST" "/api/attendance/heartbeat" "" "true" 200

# Get attendance ID for adjustment
ATTENDANCE_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/attendance/history")
ATTENDANCE_ID=$(echo "$ATTENDANCE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$ATTENDANCE_ID" ]; then
    test_endpoint "POST" "/api/attendance/$ATTENDANCE_ID/adjust" "{\"reason\":\"Testing adjustment\"}" "true" 200
fi

echo ""

# ============================================
# TIME ENTRY ENDPOINTS
# ============================================
echo -e "${BLUE}=== TIME ENTRY ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/time-entries" "" "true" 200
test_endpoint "GET" "/api/time/now" "" "true" 200

# Get time entry ID
TIME_ENTRIES_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/time-entries")
TIME_ENTRY_ID=$(echo "$TIME_ENTRIES_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$TIME_ENTRY_ID" ]; then
    test_endpoint "GET" "/api/time-entries/$TIME_ENTRY_ID" "" "true" 200
    test_endpoint "POST" "/api/time-entries/$TIME_ENTRY_ID/approve" "" "true" 200
    test_endpoint "POST" "/api/time-entries/$TIME_ENTRY_ID/reject" "{\"reason\":\"Testing rejection\"}" "true" 200
fi

echo ""

# ============================================
# TIMESHEET ENDPOINTS
# ============================================
echo -e "${BLUE}=== TIMESHEET ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/timesheets" "" "true" 200
test_endpoint "GET" "/api/timesheet-entries/pending" "" "true" 200
test_endpoint "GET" "/api/timesheet-entries/my-stats" "" "true" 200
test_endpoint "POST" "/api/timesheet-entries/bulk-approve" "{\"ids\":[]}" "true" 200
test_endpoint "POST" "/api/timesheet-entries/bulk-reject" "{\"ids\":[],\"reason\":\"Testing bulk reject\"}" "true" 200

# Get timesheet ID
TIMESHEETS_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/timesheets")
TIMESHEET_ID=$(echo "$TIMESHEETS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$TIMESHEET_ID" ]; then
    test_endpoint "GET" "/api/timesheets/$TIMESHEET_ID" "" "true" 200
    test_endpoint "GET" "/api/timesheets/$TIMESHEET_ID/entries" "" "true" 200
fi

# Get timesheet entry ID
TIMESHEET_ENTRIES_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/timesheet-entries/pending")
TIMESHEET_ENTRY_ID=$(echo "$TIMESHEET_ENTRIES_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$TIMESHEET_ENTRY_ID" ]; then
    test_endpoint "GET" "/api/timesheet-entries/$TIMESHEET_ENTRY_ID" "" "true" 200
    test_endpoint "POST" "/api/timesheet-entries/$TIMESHEET_ENTRY_ID/approve" "" "true" 200
    test_endpoint "POST" "/api/timesheet-entries/$TIMESHEET_ENTRY_ID/reject" "{\"reason\":\"Testing\"}" "true" 200
fi

echo ""

# ============================================
# LEAVE ENDPOINTS
# ============================================
echo -e "${BLUE}=== LEAVE ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/leaves" "" "true" 200
test_endpoint "GET" "/api/leaves/balances" "" "true" 200
test_endpoint "GET" "/api/leaves/balance" "" "true" 200

# Get leave ID
LEAVES_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/leaves")
LEAVE_ID=$(echo "$LEAVES_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$LEAVE_ID" ]; then
    test_endpoint "GET" "/api/leaves/$LEAVE_ID" "" "true" 200
    test_endpoint "POST" "/api/leaves/$LEAVE_ID/approve" "" "true" 200
    test_endpoint "POST" "/api/leaves/$LEAVE_ID/reject" "{\"reason\":\"Testing\"}" "true" 200
    test_endpoint "POST" "/api/leaves/$LEAVE_ID/cancel" "" "true" 200
fi

# Test leave creation
test_endpoint "POST" "/api/leaves" "{\"type\":\"annual\",\"startDate\":\"2026-04-15\",\"endDate\":\"2026-04-16\",\"reason\":\"Testing\"}" "true" 201

echo ""

# ============================================
# PAYROLL ENDPOINTS
# ============================================
echo -e "${BLUE}=== PAYROLL ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/payroll" "" "true" 200
test_endpoint "GET" "/api/payroll/employees" "" "true" 200
test_endpoint "GET" "/api/payroll/hours" "" "true" 200
test_endpoint "GET" "/api/payroll/summary" "" "true" 200
test_endpoint "GET" "/api/payroll/settings" "" "true" 200
test_endpoint "POST" "/api/payroll/run" "{\"month\":\"2026-04\"}" "true" 200

# Get payroll ID
PAYROLL_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/payroll")
PAYROLL_ID=$(echo "$PAYROLL_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$PAYROLL_ID" ]; then
    test_endpoint "GET" "/api/payroll/$PAYROLL_ID" "" "true" 200
fi

echo ""

# ============================================
# INTERN ENDPOINTS
# ============================================
echo -e "${BLUE}=== INTERN ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/interns" "" "true" 200

# Get intern ID
INTERNS_RESPONSE=$(curl -s -X GET \
    -H 'Authorization: Bearer $ACCESS_TOKEN' \
    "${BASE_URL}/api/interns")
INTERN_ID=$(echo "$INTERNS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$INTERN_ID" ]; then
    test_endpoint "GET" "/api/interns/$INTERN_ID" "" "true" 200
    test_endpoint "POST" "/api/interns/$INTERN_ID/approve" "" "true" 200
    test_endpoint "POST" "/api/interns/$INTERN_ID/reject" "{\"reason\":\"Testing\"}" "true" 200
fi

# Test intern creation
test_endpoint "POST" "/api/interns" "{\"name\":\"Test Intern\",\"email\":\"intern@test.com\",\"phone\":\"+1234567890\",\"department\":\"engineering\",\"startDate\":\"2026-04-01\",\"endDate\":\"2026-06-30\"}" "true" 201

echo ""

# ============================================
# BATCH ENDPOINTS
# ============================================
echo -e "${BLUE}=== BATCH ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/batches" "" "true" 200

# Test batch creation
test_endpoint "POST" "/api/batches" "{\"name\":\"Test Batch\",\"startDate\":\"2026-05-01\",\"endDate\":\"2026-07-31\",\"capacity\":30}" "true" 201

echo ""

# ============================================
# DASHBOARD ENDPOINTS
# ============================================
echo -e "${BLUE}=== DASHBOARD ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/dashboard/summary" "" "true" 200

echo ""

# ============================================
# SETTINGS ENDPOINTS
# ============================================
echo -e "${BLUE}=== SETTINGS ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/settings/office-location" "" "true" 200
test_endpoint "PUT" "/api/settings/office-location" "{\"latitude\":12.9716,\"longitude\":77.5946,\"radius\":100}" "true" 200

echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the logs above.${NC}"
    exit 1
fi