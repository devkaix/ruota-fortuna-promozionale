import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { erroreDaCodice, codiceDaMessaggio, ErroreRuota } from "./errori";
import type { Premio, RisultatoGiro, StatoApp, Vincita } from "./tipi";
import { colorePerIndice, normalizzaColore, normalizzaFoto, normalizzaIntero, normalizzaNome, normalizzaValore } from "./validazione";

type RigaPremio = {
  id: string;
  nome: string;
  colore: string;
  quantita: number;
  valore: number | string;
  foto_path: string | null;
  creato_il: string;
};

type RigaVincita = {
  id: string;
  premio_id: string | null;
  premio_nome: string;
  premio_colore: string;
  foto_path: string | null;
  creata_il: string;
  annullata_il: string | null;
  consegnata_il: string | null;
};

type RigaStato = {
  bloccato: boolean;
  vincita_id: string | null;
};

type PayloadVincita = {
  id: string;
  premioId: string | null;
  premioNome: string;
  premioColore: string;
  fotoPath: string | null;
  creataAt: string;
  annullataAt: string | null;
  consegnataAt: string | null;
};

function client(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase non configurato");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseConfigurato(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function urlFoto(pathFoto: string | null): string | null {
  if (!pathFoto) return null;
  if (pathFoto.startsWith("/") || pathFoto.startsWith("http")) return pathFoto;
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const encoded = pathFoto.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/premi/${encoded}`;
}

function aPremio(riga: RigaPremio): Premio {
  return {
    id: riga.id,
    nome: riga.nome,
    colore: riga.colore,
    quantita: riga.quantita,
    valore: Number(riga.valore),
    fotoUrl: urlFoto(riga.foto_path),
  };
}

function aVincita(riga: RigaVincita): Vincita {
  return {
    id: riga.id,
    premioId: riga.premio_id,
    premioNome: riga.premio_nome,
    premioColore: riga.premio_colore,
    fotoUrl: urlFoto(riga.foto_path),
    creataAt: riga.creata_il,
    annullataAt: riga.annullata_il,
    consegnataAt: riga.consegnata_il,
  };
}

function daPayload(payload: PayloadVincita): Vincita {
  return {
    id: payload.id,
    premioId: payload.premioId,
    premioNome: payload.premioNome,
    premioColore: payload.premioColore,
    fotoUrl: urlFoto(payload.fotoPath),
    creataAt: payload.creataAt,
    annullataAt: payload.annullataAt,
    consegnataAt: payload.consegnataAt,
  };
}

function solleva(error: { message: string } | null): void {
  if (!error) return;
  const codice = codiceDaMessaggio(error.message);
  if (codice) throw erroreDaCodice(codice);
  throw new Error(error.message);
}

async function leggiRighe() {
  const supabase = client();
  const [premi, stato, vincite] = await Promise.all([
    supabase.from("premi").select("id, nome, colore, quantita, valore, foto_path, creato_il").order("creato_il"),
    supabase.from("stato_giro").select("bloccato, vincita_id").eq("id", 1).single(),
    supabase
      .from("vincite")
      .select("id, premio_id, premio_nome, premio_colore, foto_path, creata_il, annullata_il, consegnata_il")
      .order("creata_il", { ascending: false }),
  ]);

  solleva(premi.error);
  solleva(stato.error);
  solleva(vincite.error);
  if (!stato.data) throw new ErroreRuota("NON_TROVATO", "Manca lo stato del giro. Applica la migrazione Supabase.");

  return {
    premi: (premi.data ?? []) as RigaPremio[],
    stato: stato.data as RigaStato,
    vincite: (vincite.data ?? []) as RigaVincita[],
  };
}

export async function leggiSupabase(): Promise<StatoApp> {
  const righe = await leggiRighe();
  const vincite = righe.vincite.map(aVincita);
  return {
    modalitaDemo: false,
    premi: righe.premi.map(aPremio),
    bloccato: false,
    vincitaAperta: vincite.find((vincita) => vincita.id === righe.stato.vincita_id) ?? null,
    vincite,
  };
}

export async function giraSupabase(): Promise<RisultatoGiro> {
  const supabase = client();
  const { data, error } = await supabase.rpc("estrai_premio");
  solleva(error);
  const payload = data as {
    indice: number;
    spicchi: { id: string; nome: string; colore: string }[];
    vincita: PayloadVincita;
  };
  return {
    indice: payload.indice,
    spicchi: payload.spicchi,
    vincita: daPayload(payload.vincita),
  };
}

export async function annullaSupabase(id: string): Promise<StatoApp> {
  const supabase = client();
  const { error } = await supabase.rpc("annulla_vincita", { p_id: id });
  solleva(error);
  return leggiSupabase();
}

export async function prossimoSupabase(id: string): Promise<StatoApp> {
  const supabase = client();
  const { error } = await supabase.rpc("prossimo_giro", { p_id: id });
  solleva(error);
  return leggiSupabase();
}

async function premioPerId(id: string): Promise<RigaPremio> {
  const supabase = client();
  const { data, error } = await supabase
    .from("premi")
    .select("id, nome, colore, quantita, valore, foto_path, creato_il")
    .eq("id", id)
    .maybeSingle();
  solleva(error);
  if (!data) throw erroreDaCodice("NON_TROVATO");
  return data as RigaPremio;
}

export async function creaSupabase(nome: string, quantita: number, valore: number): Promise<Premio> {
  const supabase = client();
  const { count, error: conteggio } = await supabase.from("premi").select("id", { count: "exact", head: true });
  solleva(conteggio);
  const { data, error } = await supabase
    .from("premi")
    .insert({
      nome: normalizzaNome(nome),
      quantita: normalizzaIntero(quantita, 0, 100000),
      valore: normalizzaValore(valore),
      colore: colorePerIndice(count ?? 0),
    })
    .select("id, nome, colore, quantita, valore, foto_path, creato_il")
    .single();
  solleva(error);
  return aPremio(data as RigaPremio);
}

export async function aggiornaSupabase(id: string, nome: string, colore: string, valore: number): Promise<Premio> {
  const supabase = client();
  const { data, error } = await supabase
    .from("premi")
    .update({
      nome: normalizzaNome(nome),
      colore: normalizzaColore(colore),
      valore: normalizzaValore(valore),
      aggiornato_il: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, nome, colore, quantita, valore, foto_path, creato_il")
    .maybeSingle();
  solleva(error);
  if (!data) throw erroreDaCodice("NON_TROVATO");
  return aPremio(data as RigaPremio);
}

export async function pezziSupabase(
  id: string,
  corpo: { aggiungi?: number; quantita?: number; attesa?: number },
): Promise<Premio> {
  const supabase = client();

  for (let tentativo = 0; tentativo < 3; tentativo += 1) {
    const attuale = await premioPerId(id);
    const attesa = corpo.aggiungi !== undefined ? attuale.quantita : normalizzaIntero(corpo.attesa, 0, 100000);
    const quantita =
      corpo.aggiungi !== undefined
        ? attuale.quantita + normalizzaIntero(corpo.aggiungi, 1, 100000)
        : normalizzaIntero(corpo.quantita, 0, 100000);

    if (quantita > 100000) {
      throw new ErroreRuota("DATI_NON_VALIDI", "La quantità non è valida.");
    }
    if (corpo.aggiungi === undefined && attuale.quantita !== attesa) {
      throw erroreDaCodice("CONFLITTO");
    }

    const { data, error } = await supabase
      .from("premi")
      .update({ quantita, aggiornato_il: new Date().toISOString() })
      .eq("id", id)
      .eq("quantita", attesa)
      .select("id, nome, colore, quantita, valore, foto_path, creato_il")
      .maybeSingle();
    solleva(error);
    if (data) return aPremio(data as RigaPremio);
    if (corpo.aggiungi === undefined) throw erroreDaCodice("CONFLITTO");
  }

  throw erroreDaCodice("CONFLITTO");
}

export async function eliminaSupabase(id: string): Promise<void> {
  const supabase = client();
  const { error } = await supabase.from("premi").delete().eq("id", id);
  solleva(error);
}

export async function fotoSupabase(id: string, file: File): Promise<Premio> {
  const { tipo, estensione } = normalizzaFoto(file);
  await premioPerId(id);
  const supabase = client();
  const percorso = `${id}/${crypto.randomUUID()}.${estensione}`;
  const { error } = await supabase.storage.from("premi").upload(percorso, Buffer.from(await file.arrayBuffer()), {
    contentType: tipo,
    upsert: false,
  });
  solleva(error);

  const { data, error: aggiornamento } = await supabase
    .from("premi")
    .update({ foto_path: percorso, aggiornato_il: new Date().toISOString() })
    .eq("id", id)
    .select("id, nome, colore, quantita, valore, foto_path, creato_il")
    .maybeSingle();
  solleva(aggiornamento);
  if (!data) throw erroreDaCodice("NON_TROVATO");
  return aPremio(data as RigaPremio);
}
