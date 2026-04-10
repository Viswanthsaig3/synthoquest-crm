# 🔑 How to Get Supabase API Keys

## What We Need:

We need the **API Keys** (JWT tokens) from your Supabase dashboard.

## Steps to Get API Keys:

### 1. Go to Supabase Dashboard
https://supabase.com/dashboard/project/ybeasksflypsboiiszjp

### 2. Click Project Settings
- Look for the gear icon ⚙️ in the bottom left sidebar
- Click it

### 3. Click API
- In the settings menu, click **API**
- You'll see a page with API keys

### 4. Copy These TWO Keys:

#### Key 1: `anon` / `public` key
- Labeled as: **anon public**
- Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Used by: Frontend (browser)

#### Key 2: `service_role` key  
- Labeled as: **service_role**
- Also starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (different value)
- Used by: Backend (server)
- ⚠️ Keep this secret!

### 5. Update `.env.local`

Open the file and replace:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ybeasksflypsboiiszjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PASTE_THE_ANON_KEY_HERE>
SUPABASE_SERVICE_ROLE_KEY=<PASTE_THE_SERVICE_ROLE_KEY_HERE>

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=<GENERATE_A_RANDOM_SECRET>
JWT_REFRESH_SECRET=<GENERATE_A_RANDOM_SECRET>
```

⚠️ **SECURITY WARNING:**
- Never commit `.env.local` to git
- Never share your `service_role` key or JWT secrets publicly
- Regenerate any exposed tokens immediately in Supabase dashboard

### 6. Restart Server

```bash
pkill -f "next dev"
npm run dev
```

---

## Example (Don't Use These - Get Yours):

```env
NEXT_PUBLIC_SUPABASE_URL=https://ybeasksflypsboiiszjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZWFza3NmbHlwcyNvbWl6bnNqcCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQzMzM4NzA3LCJleHAiOjIwNTg5MTQ3MDd9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZWFza3NmbHlwcyNvbWl6bnNqcCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NDMzMzg3MDcsImV4cCI6MjA1ODkxNDcwN30.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Need Help?

If you can't find the API keys, you can:
1. Take a screenshot of the API page in Supabase dashboard
2. Share the anon and service_role keys (they're long JWT strings)

