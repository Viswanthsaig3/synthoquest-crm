#!/usr/bin/env bash
# QA matrix against local Next app. Requires: npm run dev, seeded admin, DB reachable.
set -euo pipefail
BASE="${BASE_URL:-http://127.0.0.1:3000}"
# roles.key DB check is ^[a-z_]+$ (no digits) in base migration
set +o pipefail
SUF="$(LC_ALL=C tr -dc 'a-z' </dev/urandom | head -c 10)"
set -o pipefail
CURL="curl -sL"
WORKER_PERMS='["tasks.complete","tasks.view_own","timesheets.submit","attendance.checkin","attendance.checkout"]'
MANAGER_PERMS='["tasks.create","tasks.assign","tasks.edit","tasks.view_own","timesheets.approve","attendance.view_team"]'

pass=0; fail=0
ok() { echo "PASS $1"; pass=$((pass+1)); }
bad() { echo "FAIL $1 :: $2"; fail=$((fail+1)); }

json_token() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.data?.accessToken||j.accessToken||'');}catch(e){console.log('');}})"; }

admin_login() {
  $CURL -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
    -d '{"email":"admin@synthoquest.com","password":"Admin@123"}' | json_token
}

AT="$(admin_login)"
if [ -z "$AT" ]; then bad "TC-01 admin login" "no token"; exit 1; else ok "TC-01 admin login"; fi
AH="Authorization: Bearer $AT"

# Wrong password
CODE=$(curl -sL -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@synthoquest.com","password":"bad"}')
[ "$CODE" = "401" ] && ok "TC-02 wrong password (401)" || bad "TC-02 wrong password" "got $CODE"

# Roles
RW="qa_worker_$SUF"
RM="qa_manager_$SUF"
RD="qa_disposable_$SUF"

CREW=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/roles" -H "$AH" -H "Content-Type: application/json" \
  -d "{\"key\":\"$RW\",\"name\":\"QA Worker\",\"description\":\"test\",\"permissions\":$WORKER_PERMS}")
CRW_HTTP="${CREW##*$'\n'}"
[ "$CRW_HTTP" = "201" ] && ok "TC-07 create qa_worker role" || bad "TC-07 create qa_worker" "$CREW"

CREM=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/roles" -H "$AH" -H "Content-Type: application/json" \
  -d "{\"key\":\"$RM\",\"name\":\"QA Manager\",\"description\":\"test\",\"permissions\":$MANAGER_PERMS}")
CRM_HTTP="${CREM##*$'\n'}"
[ "$CRM_HTTP" = "201" ] && ok "TC-10 create qa_manager role" || bad "TC-10 create qa_manager" "$CREM"

# Patch role metadata
PM=$($CURL -w "\n%{http_code}" -X PATCH "$BASE/api/roles/$RW" -H "$AH" -H "Content-Type: application/json" \
  -d '{"name":"QA Worker Renamed","description":"updated"}')
PM_HTTP="${PM##*$'\n'}"
[ "$PM_HTTP" = "200" ] && ok "TC-08 patch role metadata" || bad "TC-08 patch role" "$PM"

# Disposable + archive
$CURL -X POST "$BASE/api/roles" -H "$AH" -H "Content-Type: application/json" \
  -d "{\"key\":\"$RD\",\"name\":\"Disposable\",\"permissions\":[]}" >/dev/null
AR=$($CURL -w "\n%{http_code}" -X DELETE "$BASE/api/roles/$RD" -H "$AH")
AR_HTTP="${AR##*$'\n'}"
[ "$AR_HTTP" = "200" ] && ok "TC-12 archive custom role" || bad "TC-12 archive custom" "$AR"

ADM_AR=$($CURL -w "\n%{http_code}" -X DELETE "$BASE/api/roles/admin" -H "$AH")
ADM_HTTP="${ADM_AR##*$'\n'}"
[ "$ADM_HTTP" = "403" ] && ok "TC-13 cannot archive admin" || bad "TC-13 archive admin" "$ADM_AR"

# Users
WE="worker.$SUF@qa.test"
ME="manager.$SUF@qa.test"
$CURL -X POST "$BASE/api/employees" -H "$AH" -H "Content-Type: application/json" \
  -d "{\"email\":\"$WE\",\"name\":\"QA Worker User\",\"password\":\"Test@1234\",\"phone\":\"+919111111111\",\"department\":\"training\",\"role\":\"$RW\"}" >/dev/null
$CURL -X POST "$BASE/api/employees" -H "$AH" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ME\",\"name\":\"QA Manager User\",\"password\":\"Test@1234\",\"phone\":\"+919222222222\",\"department\":\"training\",\"role\":\"$RM\"}" >/dev/null

WJSON=$($CURL "$BASE/api/employees?search=worker.$SUF&limit=20" -H "$AH")
WID=$(echo "$WJSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);const u=(j.data||[]).find(x=>x.email==='$WE');console.log(u?.id||'');})")
MJSON=$($CURL "$BASE/api/employees?search=manager.$SUF&limit=20" -H "$AH")
MID=$(echo "$MJSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);const u=(j.data||[]).find(x=>x.email==='$ME');console.log(u?.id||'');})")
[ -n "$WID" ] && ok "TC-14 create worker user" || bad "TC-14 worker id" "$WJSON"
[ -n "$MID" ] && ok "TC-16 create manager user" || bad "TC-16 manager id" "$MJSON"

UB=$($CURL -w "\n%{http_code}" -X PUT "$BASE/api/employees/$WID" -H "$AH" -H "Content-Type: application/json" \
  -d "{\"managedBy\":\"$MID\"}")
UB_HTTP="${UB##*$'\n'}"
[ "$UB_HTTP" = "200" ] && ok "TC-15 assign manager to worker (managedBy)" || bad "TC-15 managedBy" "$UB"

WT=$($CURL -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$WE\",\"password\":\"Test@1234\"}" | json_token)
MT=$($CURL -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ME\",\"password\":\"Test@1234\"}" | json_token)
[ -n "$WT" ] && ok "TC-04 worker login" || bad "TC-04 worker login" "no token"
[ -n "$MT" ] && ok "TC-03 manager login" || bad "TC-03 manager login" "no token"

WH="Authorization: Bearer $WT"
MH="Authorization: Bearer $MT"

# Manager creates task for worker
TASK_BODY=$($CURL -X POST "$BASE/api/tasks" -H "$MH" -H "Content-Type: application/json" \
  -d "{\"title\":\"QA Matrix Task\",\"assignedTo\":\"$WID\",\"priority\":\"medium\"}")
TID=$(echo "$TASK_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.id||'');}catch(e){console.log('');}})")
[ -n "$TID" ] && ok "TC-23 manager create+assign task" || bad "TC-23 task" "$TASK_BODY"

ST=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/tasks/$TID/start" -H "$WH")
ST_HTTP="${ST##*$'\n'}"
[ "$ST_HTTP" = "200" ] && ok "TC-25 worker start task" || bad "TC-25 start" "$ST"

CP=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/tasks/$TID/complete" -H "$WH" -H "Content-Type: application/json" -d '{}')
CP_HTTP="${CP##*$'\n'}"
[ "$CP_HTTP" = "200" ] && ok "TC-26 worker complete task" || bad "TC-26 complete" "$CP"

# Attendance
# Attendance requires GPS coordinates (Bangalore test coords)
CI=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/attendance/today" -H "$WH" -H "Content-Type: application/json" \
  -d '{"latitude":12.9716,"longitude":77.5946}')
CI_HTTP="${CI##*$'\n'}"
{ [ "$CI_HTTP" = "201" ] || [ "$CI_HTTP" = "200" ]; } && ok "TC-30 worker check-in" || bad "TC-30 checkin" "$CI"

CO=$($CURL -w "\n%{http_code}" -X PUT "$BASE/api/attendance/today" -H "$WH" -H "Content-Type: application/json" \
  -d '{"latitude":12.9716,"longitude":77.5946}')
CO_HTTP="${CO##*$'\n'}"
[ "$CO_HTTP" = "200" ] && ok "TC-31 worker check-out" || bad "TC-31 checkout" "$CO"

# Timesheet: daily sheet + entries + entry-level approval (must match API workDate=today, DEFAULT_TIMEZONE)
TODAY=$(TZ=Asia/Kolkata date +%Y-%m-%d)
TS=$($CURL -X POST "$BASE/api/timesheets" -H "$WH" -H "Content-Type: application/json" \
  -d "{\"employeeId\":\"$WID\",\"workDate\":\"$TODAY\",\"notes\":\"qa\"}")
TSID=$(echo "$TS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.id||'');}catch(e){console.log('');}})")
[ -n "$TSID" ] && ok "TC-35 worker create draft timesheet" || bad "TC-35 timesheet" "$TS"

ENT=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/timesheets/$TSID/entries" -H "$WH" -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"description\":\"work\",\"startTime\":\"09:00\",\"endTime\":\"12:00\",\"breakMinutes\":0,\"taskId\":\"$TID\"}")
ENT_BODY="${ENT%$'\n'*}"
ENT_HTTP="${ENT##*$'\n'}"
ENTID=$(echo "$ENT_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.id||'');}catch(e){console.log('');}})")
[ "$ENT_HTTP" = "201" ] && [ -n "$ENTID" ] && ok "TC-36 add entry" || bad "TC-36 entry" "$ENT"

PEND_ST=$(echo "$ENT_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.approvalStatus||'');}catch(e){console.log('');}})")
[ "$PEND_ST" = "pending" ] && ok "TC-38 entry pending for approval" || bad "TC-38 pending status" "$ENT_BODY"

PEND=$($CURL "$BASE/api/timesheet-entries/pending?limit=50" -H "$MH")
PC=$(echo "$PEND" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const a=j.data||[];console.log(a.filter(e=>e.id==='$ENTID').length);}catch(e){console.log(0);}})")
[ "$PC" = "1" ] && ok "TC-39 manager sees pending entry" || bad "TC-39 pending list" "$PEND"

AP=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/timesheet-entries/$ENTID/approve" -H "$MH")
AP_HTTP="${AP##*$'\n'}"
[ "$AP_HTTP" = "200" ] && ok "TC-41 manager approves entry" || bad "TC-41 approve" "$AP"

TD=$($CURL "$BASE/api/timesheets/$TSID/entries" -H "$WH")
ENTRY_OK=$(echo "$TD" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const a=j.data||[];const e=a.find(x=>x.id==='$ENTID');console.log(e?.approvalStatus==='approved'?'1':'0');}catch(e){console.log('0');}})")
[ "$ENTRY_OK" = "1" ] && ok "TC-43 worker sees entry approved" || bad "TC-43 entry status" "$TD"

# Reject path: second entry same day (one timesheet per employee per day)
ENT2=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/timesheets/$TSID/entries" -H "$WH" -H "Content-Type: application/json" \
  -d "{\"date\":\"$TODAY\",\"description\":\"reject me\",\"startTime\":\"14:00\",\"endTime\":\"15:00\",\"breakMinutes\":0}")
ENT2_BODY="${ENT2%$'\n'*}"
ENT2_HTTP="${ENT2##*$'\n'}"
ENT2ID=$(echo "$ENT2_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.id||'');}catch(e){console.log('');}})")
[ "$ENT2_HTTP" = "201" ] && [ -n "$ENT2ID" ] && ok "TC-36b second entry for reject path" || bad "TC-36b entry2" "$ENT2"

RJ=$($CURL -w "\n%{http_code}" -X POST "$BASE/api/timesheet-entries/$ENT2ID/reject" -H "$MH" -H "Content-Type: application/json" \
  -d '{"reason":"no good"}')
RJ_HTTP="${RJ##*$'\n'}"
[ "$RJ_HTTP" = "200" ] && ok "TC-42 manager reject entry with reason" || bad "TC-42 reject" "$RJ"

# Draft notes still editable (timesheet stays draft; approval is per entry)
LK=$($CURL -w "\n%{http_code}" -X PUT "$BASE/api/timesheets/$TSID" -H "$WH" -H "Content-Type: application/json" -d '{"notes":"updated"}')
LK_HTTP="${LK##*$'\n'}"
[ "$LK_HTTP" = "200" ] && ok "TC-47 draft timesheet notes editable after entry actions" || bad "TC-47 put notes" "http=$LK_HTTP"

# Draft delete (single sheet for today)
DL=$($CURL -w "\n%{http_code}" -X DELETE "$BASE/api/timesheets/$TSID" -H "$WH")
DL_HTTP="${DL##*$'\n'}"
[ "$DL_HTTP" = "200" ] && ok "TC-46 worker deletes draft timesheet" || bad "TC-46 delete draft" "$DL"

# Scope: worker tasks list only self
if [ -n "$WT" ] && [ -n "$WID" ]; then
  TL=$($CURL "$BASE/api/tasks?limit=50" -H "$WH")
  OTH=$(echo "$TL" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const rows=j.data||[];const bad=rows.filter(t=>t.assignedTo&&t.assignedTo!=='$WID');console.log(bad.length);}catch(e){console.log('err');}})")
  [ "$OTH" = "0" ] && ok "TC-50 worker tasks scoped" || bad "TC-50 tasks scope" "$OTH other"
else
  bad "TC-50 worker tasks scoped" "skipped (no worker session)"
fi

# Leads API uses token (fixed client) — smoke
LG=$($CURL -w "\n%{http_code}" "$BASE/api/leads?limit=1" -H "$AH")
LG_HTTP="${LG##*$'\n'}"
[ "$LG_HTTP" = "200" ] && ok "TC-leads list (admin)" || bad "TC-leads" "$LG"

echo "---"
echo "PASSED $pass  FAILED $fail"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
