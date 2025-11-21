create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  temperature numeric(6,2) not null,
  humidity numeric(6,2) not null,
  threshold_value numeric(6,2),
  recorded_at timestamptz not null default timezone('utc', now())
);

create index if not exists sensor_readings_recorded_at_idx
  on public.sensor_readings (recorded_at desc);

create table if not exists public.threshold_settings (
  id uuid primary key default gen_random_uuid(),
  temperature_value numeric(6,2),
  humidity_value numeric(6,2),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  check (temperature_value is not null or humidity_value is not null)
);

create index if not exists threshold_settings_created_at_idx
  on public.threshold_settings (created_at desc);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  profile_picture text,
  created_at timestamptz not null default timezone('utc', now()),
  last_login timestamptz
);

create index if not exists users_username_idx
  on public.users (username);
