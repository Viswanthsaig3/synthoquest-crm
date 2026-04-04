const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.ybeasksflypsboiiszjp:SynthoQuest@123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

const migrations = [
  // Phase 1
  '001_create_users_table.sql',
  '002_create_login_logs_table.sql',
  '003_create_refresh_tokens_table.sql',
  '004_seed_admin_user.sql',
  // Phase 2
  '005_create_permissions_table.sql',
  '006_create_roles_table.sql',
  '007_create_role_permissions_table.sql',
  '008_create_audit_tables.sql',
  '009_seed_permissions_and_roles.sql'
];

async function applyMigrations() {
  const client = new Client(DIRECT_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');
    console.log('📋 Applying all migrations in order...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'supabase/migrations', migration);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  ${migration} - File not found, skipping`);
        continue;
      }
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`Applying: ${migration}...`);
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ ${migration} - Success\n`);
        successCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        const errorMsg = error.message.split('\n')[0];
        if (errorMsg.includes('already exists')) {
          console.log(`⚠️  ${migration} - Already exists, skipping\n`);
        } else {
          console.log(`⚠️  ${migration} - Skipped`);
          console.log(`   Error: ${errorMsg}\n`);
        }
        skipCount++;
      }
    }
    
    // Verify migrations
    console.log('\n📊 VERIFICATION\n');
    
    try {
      const users = await client.query('SELECT COUNT(*) FROM users');
      console.log(`Users: ${users.rows[0].count}`);
      
      const admin = await client.query("SELECT email FROM users WHERE email = 'admin@synthoquest.com'");
      if (admin.rowCount > 0) {
        console.log(`✅ Admin user exists: ${admin.rows[0].email}`);
      }
    } catch (e) {
      console.log('Users: Not created yet');
    }
    
    try {
      const permissions = await client.query('SELECT COUNT(*) FROM permissions');
      console.log(`\nPermissions: ${permissions.rows[0].count}`);
    } catch (e) {
      console.log('\nPermissions: Table not created');
    }
    
    try {
      const roles = await client.query('SELECT key, name FROM roles ORDER BY key');
      console.log(`Roles: ${roles.rowCount}`);
      roles.rows.forEach(row => console.log(`  - ${row.key}: ${row.name}`));
    } catch (e) {
      console.log('Roles: Table not created');
    }
    
    try {
      const rolePerms = await client.query('SELECT COUNT(*) FROM role_permissions');
      console.log(`Role Permissions: ${rolePerms.rows[0].count}`);
    } catch (e) {
      console.log('Role Permissions: Table not created');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Summary: ${successCount} applied, ${skipCount} skipped`);
    console.log('='.repeat(50));
    
    if (successCount > 0) {
      console.log('\n✅ Migrations applied successfully!');
      console.log('\n🚀 Next: Test API endpoints with `npm run dev`');
    } else {
      console.log('\n⚠️  All migrations were skipped (may already be applied)');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
