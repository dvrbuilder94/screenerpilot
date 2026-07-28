create or replace function public.verify_cron_secret(candidate text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = 'cron_secret';
  if v is null or candidate is null then return false; end if;
  return v = candidate;
end;
$$;

revoke all on function public.verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;