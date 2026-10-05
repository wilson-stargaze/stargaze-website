begin;
create table public.walk_request_notifications (
  request_id uuid primary key references public.walk_requests(id),
  request_payload jsonb not null,
  email_payload jsonb,
  created_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  state text not null default 'pending' check (state in ('pending', 'sending', 'accepted', 'needs_review')),
  lease_token uuid,
  lease_until timestamptz,
  accepted_at timestamptz,
  provider_email_id text,
  last_error text
);
alter table public.walk_request_notifications enable row level security;
revoke all on public.walk_request_notifications from anon, authenticated;
grant select on public.walk_request_notifications to service_role;
create index walk_notification_pending on public.walk_request_notifications(next_attempt_at) where state in ('pending','sending');

create function public.queue_walk_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.walk_request_notifications(request_id, request_payload) values(new.id, new.request_payload);
  return new;
end;
$$;
revoke all on function public.queue_walk_notification() from public, anon, authenticated;
create trigger queue_walk_notification after insert on public.walk_requests for each row execute function public.queue_walk_notification();

create function public.claim_walk_notification(target_request uuid default null)
returns setof public.walk_request_notifications language plpgsql security definer set search_path = '' as $$
declare chosen_id uuid;
begin
  -- Resend deduplicates for 24 hours. Stop automatic sends at 23 hours
  -- rather than risk a duplicate after an ambiguous provider response.
  update public.walk_request_notifications set state='needs_review', last_error='retry_window_expired'
  where state in ('pending','sending') and first_attempt_at < now() - interval '23 hours'
    and (lease_until is null or lease_until < now());
  select request_id into chosen_id from public.walk_request_notifications
  where (target_request is null or request_id=target_request)
    and ((state='pending' and next_attempt_at <= now()) or (state='sending' and lease_until < now()))
  order by created_at for update skip locked limit 1;
  if chosen_id is null then return; end if;
  return query update public.walk_request_notifications
  set state='sending', lease_token=gen_random_uuid(), lease_until=now()+interval '2 minutes',
    attempts=attempts+1, first_attempt_at=coalesce(first_attempt_at,now())
  where request_id=chosen_id returning *;
end;
$$;

create function public.prepare_walk_notification(target_request uuid, token uuid, email jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.walk_request_notifications set email_payload=email
  where request_id=target_request and lease_token=token and state='sending' and email_payload is null;
  return found;
end;
$$;

create function public.finish_walk_notification(target_request uuid, token uuid, provider_id text, failure text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.walk_request_notifications set
    state=case when provider_id is not null then 'accepted' else 'pending' end,
    accepted_at=case when provider_id is not null then now() else null end,
    provider_email_id=provider_id, last_error=failure,
    next_attempt_at=now()+make_interval(secs=>least(3600,60*power(2,least(attempts-1,6))::integer)),
    lease_until=null, lease_token=null
  where request_id=target_request and lease_token=token and state='sending';
  return found;
end;
$$;

revoke all on function public.claim_walk_notification(uuid) from public, anon, authenticated;
revoke all on function public.prepare_walk_notification(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.finish_walk_notification(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.claim_walk_notification(uuid) to service_role;
grant execute on function public.prepare_walk_notification(uuid,uuid,jsonb) to service_role;
grant execute on function public.finish_walk_notification(uuid,uuid,text,text) to service_role;
commit;
