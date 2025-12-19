-- AGGIUNGE IL RUOLO `amministrazione` ALL'ENUM / COLONNA ROLE DI PROFILES

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'user_role'
      and e.enumlabel = 'amministrazione'
  ) then
    -- il valore esiste già, non fare nulla
    return;
  end if;

  if exists (
    select 1
    from pg_type
    where typname = 'user_role'
  ) then
    alter type public.user_role add value if not exists 'amministrazione';
  end if;
end $$;




