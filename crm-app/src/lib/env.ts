function readRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getServerEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    JWT_SECRET: readRequiredEnv('JWT_SECRET'),
    JWT_REFRESH_SECRET: readRequiredEnv('JWT_REFRESH_SECRET'),
  }
}

export function assertRequiredServerEnv(): void {
  void getServerEnv()
}
