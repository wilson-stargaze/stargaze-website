-- Run once in the Supabase SQL Editor for the Stargaze project.
-- Guests have no database read access. Only the server can call this function.
begin;
create table public.walk_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  preferred_date date not null,
  guest_count integer not null check (guest_count between 1 and 20),
  guest_names text[] not null,
  contact_name text not null,
  contact_email text not null,
  payment_preference text not null check (payment_preference in ('hotel', 'discuss')),
  hotel_name text,
  room_number text,
  referral_code text,
  notes text,
  consent_at timestamptz not null default now(),
  consent_version text not null default 'walk-request-v1',
  status text not null default 'requested' check (status in ('requested', 'availability_confirmed', 'hotel_contacted', 'confirmed', 'cancelled')),
  payment_status text not null default 'not_arranged' check (payment_status in ('not_arranged', 'hotel_arranging', 'arranged', 'paid')),
  sender_hash text not null,
  request_payload jsonb not null,
  check (cardinality(guest_names) = guest_count),
  check (extract(isodow from preferred_date) in (1, 3))
);
alter table public.walk_requests enable row level security;
revoke all on public.walk_requests from anon, authenticated;
grant select, insert, update on public.walk_requests to service_role;
create index walk_requests_referral_date on public.walk_requests (referral_code, created_at);
create index walk_requests_sender_date on public.walk_requests (sender_hash, created_at);

create function public.submit_walk_request(payload jsonb, sender_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  request_id uuid := (payload->>'requestId')::uuid;
  chosen_date date := (payload->>'date')::date;
  local_today date := (now() at time zone 'Asia/Singapore')::date;
  previous_payload jsonb;
begin
  if chosen_date < local_today or chosen_date >= local_today + 90
    or extract(isodow from chosen_date) not in (1, 3)
    or payload->>'consent' is distinct from 'true' then
    raise exception 'invalid_request';
  end if;
  -- Serialize submissions from the same source for durable hourly throttling.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(sender_hash, 0));
  select r.request_payload into previous_payload from public.walk_requests r where r.id = request_id;
  if found then
    if previous_payload = payload then return request_id; end if;
    raise exception 'request_id_conflict';
  end if;
  if (select count(*) from public.walk_requests r where r.sender_hash = submit_walk_request.sender_hash and r.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'request_rate_limit';
  end if;
  insert into public.walk_requests (id, preferred_date, guest_count, guest_names, contact_name, contact_email, payment_preference, hotel_name, room_number, referral_code, notes, sender_hash, request_payload)
  values (request_id, chosen_date, (payload->>'guestCount')::integer,
    array(select pg_catalog.jsonb_array_elements_text(payload->'guestNames')),
    payload->>'contactName', payload->>'email', payload->>'paymentMethod',
    nullif(payload->>'hotelName', ''), nullif(payload->>'roomNumber', ''),
    nullif(payload->>'referral', ''), nullif(payload->>'notes', ''), sender_hash, payload);
  return request_id;
end;
$$;
revoke all on function public.submit_walk_request(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_walk_request(jsonb, text) to service_role;
commit;
