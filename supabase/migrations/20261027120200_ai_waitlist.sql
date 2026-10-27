-- Early-access list for the AI hub (/ai). Anyone can join; only admins can
-- read it. One row per email and product line, so a second sign-up for the
-- same line is a harmless duplicate the form reports as "already on the list".
create table public.ai_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null check (role in ('agency', 'business', 'freelancer')),
  trade text not null check (length(trade) between 2 and 40),
  interest text not null check (interest in ('front_desk', 'ai_search_site', 'agency_toolkit', 'done_for_you')),
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (email, interest)
);

alter table public.ai_waitlist enable row level security;
create policy "anyone can join the ai waitlist" on public.ai_waitlist
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "admins read the ai waitlist" on public.ai_waitlist
  for select using (public.is_admin());
