-- Schema della ruota promozionale.
-- Eseguire una sola volta su un database vuoto.
-- Sul progetto già collegato questa migrazione è stata applicata: non rilanciarla.

create table public.premi (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  colore text not null check (colore ~ '^#[0-9A-Fa-f]{6}$'),
  quantita integer not null default 0 check (quantita >= 0),
  foto_path text,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);

create table public.vincite (
  id uuid primary key default gen_random_uuid(),
  premio_id uuid references public.premi (id) on delete set null,
  premio_nome text not null,
  premio_colore text not null,
  foto_path text,
  creata_il timestamptz not null default now(),
  annullata_il timestamptz,
  consegnata_il timestamptz
);

create table public.stato_giro (
  id integer primary key default 1 check (id = 1),
  bloccato boolean not null default false,
  vincita_id uuid references public.vincite (id),
  bloccato_il timestamptz
);

insert into public.stato_giro (id, bloccato) values (1, false);

create index vincite_creata_il_idx on public.vincite (creata_il desc);

alter table public.premi enable row level security;
alter table public.vincite enable row level security;
alter table public.stato_giro enable row level security;

create policy "premi lettura" on public.premi
  for select to anon, authenticated using (true);
create policy "premi inserimento" on public.premi
  for insert to anon, authenticated with check (true);
create policy "premi aggiornamento" on public.premi
  for update to anon, authenticated using (true) with check (true);
create policy "premi eliminazione" on public.premi
  for delete to anon, authenticated using (true);

create policy "vincite lettura" on public.vincite
  for select to anon, authenticated using (true);
create policy "stato lettura" on public.stato_giro
  for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.vincite from anon, authenticated;
revoke insert, update, delete, truncate on public.stato_giro from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'premi',
  'premi',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "lettura pubblica foto premi"
on storage.objects for select
to public
using (bucket_id = 'premi');

create policy "inserimento foto premi"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'premi');

create policy "aggiornamento foto premi"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'premi')
with check (bucket_id = 'premi');

create policy "eliminazione foto premi"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'premi');

create or replace function public.estrai_premio()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bloccato boolean;
  v_totale integer;
  v_soglia integer;
  v_cursore integer := 0;
  v_premio public.premi%rowtype;
  v_vincita public.vincite%rowtype;
  v_spicchi jsonb;
  v_indice integer := -1;
  v_i integer := 0;
  r public.premi%rowtype;
begin
  select bloccato into v_bloccato
  from public.stato_giro
  where id = 1
  for update;

  if v_bloccato then
    raise exception 'GIRO_IN_CORSO';
  end if;

  perform 1
  from public.premi
  where quantita > 0
  for update;

  select coalesce(sum(quantita), 0) into v_totale
  from public.premi
  where quantita > 0;

  if v_totale = 0 then
    raise exception 'ESAURITO';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object('id', id, 'nome', nome, 'colore', colore)
    order by creato_il, id
  ), '[]'::jsonb)
  into v_spicchi
  from public.premi
  where quantita > 0;

  v_soglia := floor(random() * v_totale)::integer;
  if v_soglia < 0 or v_soglia >= v_totale then
    v_soglia := 0;
  end if;

  for r in
    select *
    from public.premi
    where quantita > 0
    order by creato_il, id
  loop
    v_cursore := v_cursore + r.quantita;
    if v_cursore > v_soglia then
      v_premio := r;
      v_indice := v_i;
      exit;
    end if;
    v_i := v_i + 1;
  end loop;

  if v_premio.id is null then
    raise exception 'ESAURITO';
  end if;

  update public.premi
  set quantita = quantita - 1,
      aggiornato_il = now()
  where id = v_premio.id;

  insert into public.vincite (premio_id, premio_nome, premio_colore, foto_path)
  values (v_premio.id, v_premio.nome, v_premio.colore, v_premio.foto_path)
  returning * into v_vincita;

  update public.stato_giro
  set bloccato = true,
      vincita_id = v_vincita.id,
      bloccato_il = now()
  where id = 1;

  return jsonb_build_object(
    'indice', v_indice,
    'spicchi', v_spicchi,
    'vincita', jsonb_build_object(
      'id', v_vincita.id,
      'premioId', v_vincita.premio_id,
      'premioNome', v_vincita.premio_nome,
      'premioColore', v_vincita.premio_colore,
      'fotoPath', v_vincita.foto_path,
      'creataAt', v_vincita.creata_il,
      'annullataAt', v_vincita.annullata_il,
      'consegnataAt', v_vincita.consegnata_il
    )
  );
end;
$$;

create or replace function public.annulla_giro()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stato public.stato_giro%rowtype;
  v_vincita public.vincite%rowtype;
begin
  select * into v_stato
  from public.stato_giro
  where id = 1
  for update;

  if not v_stato.bloccato or v_stato.vincita_id is null then
    raise exception 'NESSUN_GIRO';
  end if;

  select * into v_vincita
  from public.vincite
  where id = v_stato.vincita_id
  for update;

  if v_vincita.annullata_il is not null then
    raise exception 'GIA_ANNULLATA';
  end if;

  update public.vincite
  set annullata_il = now()
  where id = v_vincita.id
  returning * into v_vincita;

  if v_vincita.premio_id is not null then
    update public.premi
    set quantita = quantita + 1,
        aggiornato_il = now()
    where id = v_vincita.premio_id;
  end if;

  return jsonb_build_object(
    'id', v_vincita.id,
    'premioId', v_vincita.premio_id,
    'premioNome', v_vincita.premio_nome,
    'premioColore', v_vincita.premio_colore,
    'fotoPath', v_vincita.foto_path,
    'creataAt', v_vincita.creata_il,
    'annullataAt', v_vincita.annullata_il,
    'consegnataAt', v_vincita.consegnata_il
  );
end;
$$;

create or replace function public.prossimo_giro()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stato public.stato_giro%rowtype;
begin
  select * into v_stato
  from public.stato_giro
  where id = 1
  for update;

  if not v_stato.bloccato or v_stato.vincita_id is null then
    raise exception 'NESSUN_GIRO';
  end if;

  update public.vincite
  set consegnata_il = now()
  where id = v_stato.vincita_id
    and annullata_il is null;

  update public.stato_giro
  set bloccato = false,
      vincita_id = null,
      bloccato_il = null
  where id = 1;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.estrai_premio() from public;
revoke all on function public.annulla_giro() from public;
revoke all on function public.prossimo_giro() from public;
grant execute on function public.estrai_premio() to anon, authenticated;
grant execute on function public.annulla_giro() to anon, authenticated;
grant execute on function public.prossimo_giro() to anon, authenticated;
