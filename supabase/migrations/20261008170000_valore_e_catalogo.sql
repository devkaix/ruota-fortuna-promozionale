-- Valore in euro e estrazione non bloccante.
-- Il peso è quantità / valore: più pezzi, più possibilità; un prezzo più alto esce meno spesso.
-- Non rilanciare sul database già aggiornato.

alter table public.premi add column if not exists valore numeric(8,2);

update public.premi set valore = 1 where valore is null;

alter table public.premi alter column valore set default 1;
alter table public.premi alter column valore set not null;

alter table public.premi drop constraint if exists premi_valore_check;
alter table public.premi add constraint premi_valore_check check (valore > 0);

create or replace function public.estrai_premio()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_totale integer := 0;
  v_soglia integer;
  v_cursore integer := 0;
  v_peso integer;
  v_premio public.premi%rowtype;
  v_vincita public.vincite%rowtype;
  v_spicchi jsonb := '[]'::jsonb;
  v_indice integer := -1;
  v_i integer := 0;
  r public.premi%rowtype;
begin
  perform 1
  from public.premi
  where quantita > 0
  for update;

  for r in
    select *
    from public.premi
    where quantita > 0
    order by creato_il, id
  loop
    v_peso := greatest(1, round((r.quantita::numeric * 100) / r.valore)::integer);
    v_totale := v_totale + v_peso;
    v_spicchi := v_spicchi || jsonb_build_array(
      jsonb_build_object('id', r.id, 'nome', r.nome, 'colore', r.colore)
    );
  end loop;

  if v_totale = 0 then
    raise exception 'ESAURITO';
  end if;

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
    v_peso := greatest(1, round((r.quantita::numeric * 100) / r.valore)::integer);
    v_cursore := v_cursore + v_peso;
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

drop function if exists public.annulla_giro();

create or replace function public.annulla_vincita(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vincita public.vincite%rowtype;
begin
  select * into v_vincita
  from public.vincite
  where id = p_id
  for update;

  if not found then
    raise exception 'NESSUN_GIRO';
  end if;

  if v_vincita.annullata_il is not null then
    raise exception 'GIA_ANNULLATA';
  end if;

  update public.vincite
  set annullata_il = now()
  where id = p_id
  returning * into v_vincita;

  if v_vincita.premio_id is not null then
    update public.premi
    set quantita = quantita + 1,
        aggiornato_il = now()
    where id = v_vincita.premio_id;
  end if;

  update public.stato_giro
  set bloccato = false,
      vincita_id = null,
      bloccato_il = null
  where id = 1;

  return jsonb_build_object('ok', true);
end;
$$;

drop function if exists public.prossimo_giro();

create or replace function public.prossimo_giro(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vincita public.vincite%rowtype;
begin
  select * into v_vincita
  from public.vincite
  where id = p_id
  for update;

  if not found then
    raise exception 'NESSUN_GIRO';
  end if;

  if v_vincita.annullata_il is null and v_vincita.consegnata_il is null then
    update public.vincite
    set consegnata_il = now()
    where id = p_id;
  end if;

  update public.stato_giro
  set bloccato = false,
      vincita_id = null,
      bloccato_il = null
  where id = 1;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.estrai_premio() from public;
revoke all on function public.annulla_vincita(uuid) from public;
revoke all on function public.prossimo_giro(uuid) from public;
grant execute on function public.estrai_premio() to anon, authenticated;
grant execute on function public.annulla_vincita(uuid) to anon, authenticated;
grant execute on function public.prossimo_giro(uuid) to anon, authenticated;

delete from public.vincite where premio_nome = 'Gadget prova';
delete from public.premi where nome = 'Gadget prova';

update public.stato_giro
set bloccato = false,
    vincita_id = null,
    bloccato_il = null
where id = 1;

insert into public.premi (nome, colore, quantita, valore)
select v.nome, v.colore, 0, v.valore
from (
  values
    ('Kit 3 Adesivi Daznpoint', '#F04B3A', 2.00),
    ('Penne Daznbet Club', '#F2C14E', 0.50),
    ('Accendini Daznbet Club', '#E37B2C', 1.00),
    ('Portachiavi Daznbet Club', '#2F7D4A', 0.75),
    ('Laccetti Daznbet Club', '#2C6BED', 2.00),
    ('Sacche Daznbet Club', '#7A45B5', 3.00),
    ('Agenda Daznbet Club', '#1F8A8A', 6.00),
    ('Cartellina Daznbet Club', '#D4537E', 4.00),
    ('Borraccia Daznbet Club', '#3D8BFF', 10.00),
    ('Ombrello Daznbet Club', '#5C6B7A', 15.00),
    ('Powerbank Daznbet Club', '#C83B2E', 25.00),
    ('T-shirt Daznbet Club', '#111111', 10.00),
    ('Felpa Daznbet Club', '#6B4F3A', 20.00),
    ('Felpa DaznBet Club Zip', '#8E3D55', 30.00),
    ('Zaino Daznbet Club', '#1C4E3A', 65.00),
    ('Rollup Daznbet Club', '#B8860B', 55.00),
    ('User & Pass Daznbet', '#4C6EF5', 5.00),
    ('Totem da banco Daznbet', '#0E7C66', 5.00),
    ('Rendiresto Daznbet', '#C45C26', 4.00),
    ('Mousepad Daznbet', '#546E7A', 3.50),
    ('Poster Daznbet Gioco responsabile', '#2E7D32', 2.00),
    ('Spilletta Daznbet', '#AD1457', 1.00),
    ('Berretto Daznbet', '#1565C0', 2.50),
    ('T-Shirt Daznbet', '#37474F', 10.00)
) as v(nome, colore, valore)
where not exists (
  select 1 from public.premi p where p.nome = v.nome
);

notify pgrst, 'reload schema';
