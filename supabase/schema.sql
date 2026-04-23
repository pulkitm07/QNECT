-- Qnect — Supabase schema
-- Run this in your Supabase SQL editor to set up the database.

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ─── Queue ────────────────────────────────────────────────────────────────
create table if not exists queue (
  id         bigint generated always as identity primary key,
  name       text        not null,
  party      int         not null default 1,
  phone      text,
  status     text        not null default 'waiting', -- waiting | admitted | cancelled
  notified   boolean     not null default false,
  joined_at  timestamptz not null default now()
);

alter table queue enable row level security;

-- Allow anyone to read the queue (customers see their position)
create policy "public read" on queue for select using (true);
-- Allow anyone to insert (customer joining)
create policy "public insert" on queue for insert with check (true);
-- Allow authenticated staff to update
create policy "staff update" on queue for update using (auth.role() = 'authenticated');

-- ─── Staff / Employees ────────────────────────────────────────────────────
create table if not exists staff (
  id          bigint generated always as identity primary key,
  name        text not null,
  role        text not null,
  clocked_in  boolean     not null default false,
  clocked_at  timestamptz
);

alter table staff enable row level security;
create policy "staff read"   on staff for select using (auth.role() = 'authenticated');
create policy "staff update" on staff for update using (auth.role() = 'authenticated');

-- ─── Deliveries ───────────────────────────────────────────────────────────
create table if not exists deliveries (
  id          text primary key,           -- e.g. D-07
  order_id    text        not null,
  platform    text        not null,
  partner     text,
  step        int         not null default 1, -- 1=received 2=cooking 3=packing 4=ready
  checked_in  timestamptz not null default now()
);

alter table deliveries enable row level security;
create policy "public read"   on deliveries for select using (true);
create policy "public insert" on deliveries for insert with check (true);
create policy "staff update"  on deliveries for update using (auth.role() = 'authenticated');

-- ─── Realtime ─────────────────────────────────────────────────────────────
-- Enable realtime on queue and deliveries so the frontend gets live updates
alter publication supabase_realtime add table queue;
alter publication supabase_realtime add table deliveries;
