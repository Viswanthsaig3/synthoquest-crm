# Supabase Migration Guide - Phase 1

## Manual Migration Steps

Since we're using Supabase's hosted service, follow these steps to apply the migrations:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/ybeasksflypsboiiszjp

2. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar

3. **Copy and paste each migration file** in order:

#### Step 1: Create Users Table
Copy the contents of: `supabase/migrations/001_create_users_table.sql`
- Paste into SQL Editor
- Click "Run"
- Verify success message

#### Step 2: Create Login Logs Table
Copy the contents of: `supabase/migrations/002_create_login_logs_table.sql`
- Paste into SQL Editor
- Click "Run"
- Verify success message

#### Step 3: Create Refresh Tokens Table
Copy the contents of: `supabase/migrations/003_create_refresh_tokens_table.sql`
- Paste into SQL Editor
- Click "Run"
- Verify success message

#### Step 4: Seed Admin User
Copy the contents of: `supabase/migrations/004_seed_admin_user.sql`
- Paste into SQL Editor
- Click "Run"
- Verify success message

### Option 2: Using Supabase CLI (If you have access token)

```bash
# Set your Supabase access token
export SUPABASE_ACCESS_TOKEN=your-access-token-here

# Link to your project
supabase link --project-ref ybeasksflypsboiiszjp

# Apply all migrations
supabase db push
```

To get your access token:
1. Go to https://supabase.com/dashboard/account/tokens
2. Copy your access token
3. Set it as environment variable

---

## Verify Migrations

After applying migrations, verify they worked:

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'login_logs', 'refresh_tokens');
```

Should return 3 rows.

### 2. Check Admin User Exists

```sql
SELECT id, email, name, role, status 
FROM users 
WHERE email = 'admin@synthoquest.com';
```

Should return the admin user.

### 3. Test Login

Try logging in with:
- Email: `admin@synthoquest.com`
- Password: `Admin@123`

---

## Troubleshooting

### Error: "type already exists"
This is normal if running migrations multiple times. The migrations use `IF NOT EXISTS` to handle this.

### Error: "relation already exists"
Same as above - tables already created. Safe to ignore.

### Error: "permission denied"
Make sure you're using the service role key or have proper permissions.

### Admin login doesn't work
1. Verify the admin user exists in the database
2. Check the password hash is correct
3. Try resetting the password:

```sql
UPDATE users 
SET password_hash = '$2b$12$v208AabK4KsXdgtheomRe.ZS0qZsVfmjQNScxonfCSm0LGAkWW3Au'
WHERE email = 'admin@synthoquest.com';
```

---

## Quick SQL Test

After migrations, test with this query:

```sql
-- Check all tables and row counts
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'login_logs', COUNT(*) FROM login_logs
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens;
```

---

## Security Notes

- ✅ Password hash is for `Admin@123` (bcrypt cost 12)
- ✅ Change password after first login
- ✅ Update JWT secrets before production
- ✅ Enable HTTPS for secure cookies

---

**Next Step**: After migrations are applied, run `npm run dev` and test login!
