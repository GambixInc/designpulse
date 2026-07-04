// Supabase public credentials (safe to expose; access is governed by RLS)
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lrebfcfrkobpjgwdvauq.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZWJmY2Zya29icGpnd2R2YXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjA0MTUsImV4cCI6MjA5ODY5NjQxNX0.arrrIzD7KORhL14zMrHmxjqbS0lwCxdpKMginkH8hVk";
