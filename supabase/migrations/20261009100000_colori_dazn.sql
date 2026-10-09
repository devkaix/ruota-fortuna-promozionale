with ordinati as (
  select id, (row_number() over (order by creato_il) - 1) as indice
  from public.premi
)
update public.premi as p
set colore = (
  array['#111111', '#E6FF00', '#1A1A1A', '#FFFFFF', '#C8102E', '#FFF4A3', '#2A2A2A', '#F4F4F4']
)[(ordinati.indice % 8) + 1]
from ordinati
where p.id = ordinati.id;
