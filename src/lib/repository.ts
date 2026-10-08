import "server-only";
import {
  annullaDemo,
  creaDemo,
  aggiornaDemo,
  eliminaDemo,
  fotoDemo,
  giraDemo,
  leggiDemo,
  pezziDemo,
  prossimoDemo,
} from "./demo-store";
import { ErroreRuota } from "./errori";
import {
  annullaSupabase,
  aggiornaSupabase,
  creaSupabase,
  eliminaSupabase,
  fotoSupabase,
  giraSupabase,
  leggiSupabase,
  pezziSupabase,
  prossimoSupabase,
  supabaseConfigurato,
} from "./supabase-store";
import type { Premio, RisultatoGiro, StatoApp, Vincita } from "./tipi";
import { statoVincita } from "./tipi";

export function modalitaDemo(): boolean {
  return !supabaseConfigurato();
}

export async function leggiStato(): Promise<StatoApp> {
  return supabaseConfigurato() ? leggiSupabase() : leggiDemo();
}

export async function giraRuota(): Promise<RisultatoGiro> {
  return supabaseConfigurato() ? giraSupabase() : giraDemo();
}

export async function annullaVincita(id: string): Promise<StatoApp> {
  return supabaseConfigurato() ? annullaSupabase(id) : annullaDemo(id);
}

export async function chiudiGiro(id: string): Promise<StatoApp> {
  return supabaseConfigurato() ? prossimoSupabase(id) : prossimoDemo(id);
}

export async function creaPremio(nome: string, quantita: number, valore: number): Promise<Premio> {
  return supabaseConfigurato() ? creaSupabase(nome, quantita, valore) : creaDemo(nome, quantita, valore);
}

export async function aggiornaPremio(id: string, nome: string, colore: string, valore: number): Promise<Premio> {
  return supabaseConfigurato()
    ? aggiornaSupabase(id, nome, colore, valore)
    : aggiornaDemo(id, nome, colore, valore);
}

export async function modificaPezzi(
  id: string,
  corpo: { aggiungi?: number; quantita?: number; attesa?: number },
): Promise<Premio> {
  if (corpo.aggiungi === undefined && corpo.quantita === undefined) {
    throw new ErroreRuota("DATI_NON_VALIDI", "Indica quanti pezzi aggiungere oppure la nuova quantità.");
  }
  return supabaseConfigurato() ? pezziSupabase(id, corpo) : pezziDemo(id, corpo);
}

export async function eliminaPremio(id: string): Promise<StatoApp> {
  if (supabaseConfigurato()) {
    await eliminaSupabase(id);
    return leggiSupabase();
  }
  return eliminaDemo(id);
}

export async function caricaFoto(id: string, file: File): Promise<Premio> {
  return supabaseConfigurato() ? fotoSupabase(id, file) : fotoDemo(id, file);
}

function cella(valore: string): string {
  return `"${valore.replaceAll('"', '""')}"`;
}

export async function esportaCsv(): Promise<string> {
  const stato = await leggiStato();
  const righe = [
    ["Data", "Premio", "Stato"].join(";"),
    ...stato.vincite.map((vincita: Vincita) =>
      [vincita.creataAt, vincita.premioNome, statoVincita(vincita)].map(cella).join(";"),
    ),
  ];
  return `\uFEFF${righe.join("\r\n")}\r\n`;
}
