-- Order tracking. Run after setup.sql (safe to re-run).
--
-- Customers look up an order with its code AND the last 4 digits of the
-- phone used. They only ever see status, times and the delivery area:
-- never names, phones or items.

alter table public.orders add column if not exists status_at timestamptz not null default now();
alter table public.orders add column if not exists timeline jsonb not null default '{}'::jsonb;

-- Stamp the time whenever an order is created or its status changes.
create or replace function public.orders_status_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.status_at := now();
    new.timeline := jsonb_build_object(new.status, now());
  elsif new.status is distinct from old.status then
    new.status_at := now();
    new.timeline := coalesce(old.timeline, '{}'::jsonb) || jsonb_build_object(new.status, now());
  end if;
  return new;
end $$;

drop trigger if exists orders_status_stamp on public.orders;
create trigger orders_status_stamp before insert or update on public.orders
  for each row execute function public.orders_status_stamp();

-- Backfill orders that existed before tracking.
update public.orders set timeline = jsonb_build_object(status, created_at), status_at = created_at
where timeline = '{}'::jsonb;

create or replace function public.track_order(p_code text, p_phone4 text)
returns table (code text, status text, status_at timestamptz, created_at timestamptz, timeline jsonb, drop_area text)
language sql stable security definer set search_path = public as $$
  select o.code, o.status, o.status_at, o.created_at, o.timeline,
         split_part(o.drop_to, ' (', 1)
  from public.orders o
  where o.code = upper(trim(p_code))
    and length(p_phone4) = 4
    and right(regexp_replace(o.phone, '\D', '', 'g'), 4) = p_phone4
    and o.created_at > now() - interval '60 days'
  order by o.created_at desc
  limit 1;
$$;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
