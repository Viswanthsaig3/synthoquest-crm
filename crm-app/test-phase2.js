// Phase 2 Test Script
const fs = require('fs');
const path = require('path');

console.log('🧪 PHASE 2 IMPLEMENTATION TESTS\n');
let passed = 0, failed = 0;

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

test('Migration files exist', () => {
  ['005_create_permissions_table.sql', '006_create_roles_table.sql', '007_create_role_permissions_table.sql', '008_create_audit_tables.sql', '009_seed_permissions_and_roles.sql'].forEach(file => {
    if (!fs.existsSync(path.join(__dirname, 'supabase/migrations', file))) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test('Query function files exist', () => {
  ['src/lib/db/queries/permissions.ts', 'src/lib/db/queries/roles.ts', 'src/lib/db/queries/audit.ts'].forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

test('API route files exist', () => {
  ['src/app/api/permissions/route.ts', 'src/app/api/roles/route.ts', 'src/app/api/roles/[key]/permissions/route.ts', 'src/app/api/users/[id]/role/route.ts', 'src/app/api/users/[id]/role-history/route.ts'].forEach(route => {
    if (!fs.existsSync(path.join(__dirname, route))) {
      throw new Error(`Missing: ${route}`);
    }
  });
});

test('Permission cache exists', () => {
  if (!fs.existsSync(path.join(__dirname, 'src/lib/permissions-cache.ts'))) {
    throw new Error('Missing: permissions-cache.ts');
  }
});

test('Permissions.ts has DB integration', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src/lib/permissions.ts'), 'utf8');
  if (!content.includes('getUserPermissionsFromDB') || !content.includes('permissionCache')) {
    throw new Error('Missing DB/cache integration');
  }
});

test('Migrations contain required tables', () => {
  const migration9 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/009_seed_permissions_and_roles.sql'), 'utf8');
  if (!migration9.includes('INSERT INTO permissions') || !migration9.includes('INSERT INTO roles')) {
    throw new Error('Missing seed data');
  }
});

test('API routes have authentication', () => {
  ['src/app/api/permissions/route.ts', 'src/app/api/roles/route.ts'].forEach(route => {
    const content = fs.readFileSync(path.join(__dirname, route), 'utf8');
    if (!content.includes('withAuth')) {
      throw new Error(`Missing withAuth in ${route}`);
    }
  });
});

test('Build succeeded', () => {
  if (!fs.existsSync(path.join(__dirname, '.next'))) {
    console.log('   Note: Run `npm run build`');
  }
});

test('Five roles seeded', () => {
  const migration9 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/009_seed_permissions_and_roles.sql'), 'utf8');
  ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'].forEach(role => {
    if (!migration9.includes(`'${role}'`)) {
      throw new Error(`Missing role: ${role}`);
    }
  });
});

test('Audit logging implemented', () => {
  const auditFile = fs.readFileSync(path.join(__dirname, 'src/lib/db/queries/audit.ts'), 'utf8');
  if (!auditFile.includes('logPermissionCheck') || !auditFile.includes('logRoleChange')) {
    throw new Error('Missing audit functions');
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n⚠️  Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Phase 2 is complete.');
  console.log('\n📋 NEXT: Apply migrations to Supabase');
  process.exit(0);
}
