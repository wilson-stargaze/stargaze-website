-- Run after the notification migration. First put the same random worker token
-- used in Vercel NOTIFICATION_WORKER_SECRET into Supabase Vault, named
-- stargaze_notification_worker_secret. Never commit its value.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create or replace function public.dispatch_walk_notification_worker()
returns void language plpgsql security definer set search_path='' as $$
declare worker_secret text;
begin
  select decrypted_secret into worker_secret from vault.decrypted_secrets
    where name='stargaze_notification_worker_secret';
  if worker_secret is null then raise exception 'notification_worker_secret_missing'; end if;
  if not exists(select 1 from public.walk_request_notifications
      where (state='pending' and next_attempt_at<=now()) or (state='sending' and lease_until<now())) then return; end if;
  perform net.http_post(
    url:='https://www.stargaze-solutions.com/api/request-notifications',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||worker_secret),
    body:='{}'::jsonb, timeout_milliseconds:=60000);
end;
$$;
revoke all on function public.dispatch_walk_notification_worker() from public, anon, authenticated;
-- Schedule once. If reconfiguring, unschedule the existing named job first.
select cron.schedule('stargaze-booking-email-retries','* * * * *','select public.dispatch_walk_notification_worker();');
