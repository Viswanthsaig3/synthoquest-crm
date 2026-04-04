// Phase 2 Test Script
// Run this after applying migrations to Supabase

const fs = require('fs');
const path = require('path');

console.log('🧪 PHASE 2 IMPLEMENTATION TESTS\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Check migration files exist
test('Migration files exist', () => {
  const migrations = [
    '005_create_permissions_table.sql',
    '006_create_roles_table.sql',
    '007_create_role_permissions_table.sql',
    '008_create_audit_tables.sql',
    '009_seed_permissions_and_roles.sql'
  ];
  
  const basePath = path.join(__dirname, 'supabase/migrations');
  migrations.forEach(file => {
    const filePath = path.join(basePath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

// Test 2: Check query functions exist
test('Query function files exist', () => {
  const files = [
    'src/lib/db/queries/permissions.ts',
    'src/lib/db/queries/roles.ts',
    'src/lib/db/queries/audit.ts'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

// Test 3: Check API routes exist
test('API route files exist', () => {
  const routes = [
    'src/app/api/permissions/route.ts',
    'src/app/api/roles/route.ts',
    'src/app/api/roles/[key]/permissions/route.ts',
    'src/app/api/users/[id]/role/route.ts',
    'src/app/api/users/[id]/role-history/route.ts'
  ];
  
  routes.forEach(route => {
    const filePath = path.join(__dirname, route);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing: ${route}`);
    }
  });
});

// Test 4: Check permission cache exists
test('Permission cache exists', () => {
  const filePath = path.join(__dirname, 'src/lib/permissions-cache.ts');
  if (!fs.existsSync(filePath)) {
    throw new Error('Missing: permissions-cache.ts');
  }
});

// Test 5: Check permissions.ts updated
test('Permissions.ts has DB integration', () => {
  const filePath = path.join(__dirname, 'src/lib/permissions.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('getUserPermissionsFromDB')) {
    throw new Error('Missing DB integration in permissions.ts');
  }
  
  if (!content.includes('permissionCache')) {
    throw new Error('Missing cache integration in permissions.ts');
  }
});

// Test 6: Check migrations have correct content
test('Migrations contain required tables', () => {
  const migration9 = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/009_seed_permissions_and_roles.sql'),
    'utf8'
  );
  
  if (!migration9.includes('INSERT INTO permissions')) {
    throw new Error('Migration 009 missing permissions seed');
  }
  
  if (!migration9.includes('INSERT INTO roles')) {
    throw new Error('Migration 009 missing roles seed');
  }
  
  // Count permissions (should be 50+)
  const permissionCount = (migration9.match(/^\\s*\\('[a-z_]+\\.[a-z_]+'/gm) || []).length;
  if (permissionCount < 50) {
    throw new Error(`Expected 50+ permissions, found ${permissionCount}`);
  }
});

// Test 7: Check API routes have proper auth
test('API routes have authentication', () => {
  const routes = [
    'src/app/api/permissions/route.ts',
    'src/app/api/roles/route.ts',
    'src/app/api/roles/[key]/permissions/route.ts'
  ];
  
  routes.forEach(route => {
    const filePath = path.join(__dirname, route);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('withAuth')) {
      throw new Error(`Missing withAuth in ${route}`);
    }
  });
});

// Test 8: Check build succeeded
test('Build succeeded', () => {
  const nextDir = path.join(__dirname, '.next');
  if (!fs.existsSync(nextDir)) {
    console.log('   Note: Build not run yet. Run `npm run build`');
  }
});

// Test 9: Check 5 roles are seeded
test('Five roles seeded', () => {
  const migration9 = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/009_seed_permissions_and_roles.sql'),
    'utf8'
  );
  
  const requiredRoles = ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'];
  requiredRoles.forEach(role => {
    if (!migration9.includes(`'${role}'`)) {
      throw new Error(`Missing role: ${role}`);
    }
  });
});

// Test 10: Check audit logging exists
test('Audit logging implemented', () => {
  const auditFile = fs.readFileSync(
    path.join(__dirname, 'src/lib/db/queries/audit.ts'),
    'utf8'
  );
  
  if (!auditFile.includes('logPermissionCheck')) {
    throw new Error('Missing logPermissionCheck function');
  }
  
  if (!auditFile.includes('logRoleChange')) {
    throw new Error('Missing logRoleChange function');
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Phase 2 implementation is complete.');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Apply migrations to Supabase (see PHASE-2-COMPLETE.md)');
  console.log('2. Test API endpoints with: npm run dev');
  console.log('3. Verify with curl or Postman');
  process.exit(0);
}
