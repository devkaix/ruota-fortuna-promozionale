import fs from "fs";
import path from "path";
import { copiaSeme } from "./demo-seme";
import {
  aggiungiPezzi,
  annullaGiro,
  eliminaPremio,
  gira,
  impostaQuantita,
  prossimoGiro,
  type PremioMotore,
  type StatoMotore,
} from "./engine";
import { erroreDaCodice } from "./errori";
import type { Premio, RisultatoGiro, StatoApp, Vincita } from "./tipi";
import { colorePerIndice, normalizzaColore, normalizzaFoto, normalizzaIntero, normalizzaNome, normalizzaValore } from "./validazione";

const FILE_STATO = path.join(process.cwd(), "data", "demo-state.json");

let memoria: StatoMotore | null = null;
let coda: Promise<unknown> = Promise.resolve();

function carica(): StatoMotore {
  if (memoria) return memoria;
  try {
    const testo = fs.readFileSync(FILE_STATO, "utf8");
    memoria = JSON.parse(testo) as StatoMotore;
    return memoria;
  } catch {
    memoria = copiaSeme();
    return memoria;
  }
}

function salva(stato: StatoMotore) {
  memoria = stato;
  try {
    fs.mkdirSync(path.dirname(FILE_STATO), { recursive: true });
    fs.writeFileSync(FILE_STATO, JSON.stringify(stato));
  } catch {
    // Su un filesystem in sola lettura resta solo la memoria del processo.
  }
}

function inFila<T>(operazione: (stato: StatoMotore) => T): Promise<T> {
  const esecuzione = coda.then(() => {
    const stato = structuredClone(carica());
    const risultato = operazione(stato);
    return risultato;
  });
  coda = esecuzione.then(
    () => undefined,
    () => undefined,
  );
  return esecuzione;
}

function fotoUrl(pathFoto: string | null): string | null {
  return pathFoto;
}

function aPremio(premio: PremioMotore): Premio {
  return {
    id: premio.id,
    nome: premio.nome,
    colore: premio.colore,
    quantita: premio.quantita,
    valore: premio.valore,
    fotoUrl: fotoUrl(premio.fotoPath),
  };
}

function aVincita(stato: StatoMotore, id: string | null) {
  if (!id) return null;
  const vincita = stato.vincite.find((voce) => voce.id === id);
  if (!vincita) return null;
  return {
    id: vincita.id,
    premioId: vincita.premioId,
    premioNome: vincita.premioNome,
    premioColore: vincita.premioColore,
    fotoUrl: fotoUrl(vincita.fotoPath),
    creataAt: vincita.creataAt,
    annullataAt: vincita.annullataAt,
    consegnataAt: vincita.consegnataAt,
  } satisfies Vincita;
}

export function statoDemo(stato: StatoMotore): StatoApp {
  const aperta = aVincita(stato, stato.vincitaApertaId);
  return {
    modalitaDemo: true,
    premi: [...stato.premi]
      .sort((a, b) => a.creatoIl.localeCompare(b.creatoIl) || a.id.localeCompare(b.id))
      .map(aPremio),
    bloccato: stato.bloccato,
    vincitaAperta: aperta,
    vincite: stato.vincite.map((vincita) => ({
      id: vincita.id,
      premioId: vincita.premioId,
      premioNome: vincita.premioNome,
      premioColore: vincita.premioColore,
      fotoUrl: fotoUrl(vincita.fotoPath),
      creataAt: vincita.creataAt,
      annullataAt: vincita.annullataAt,
      consegnataAt: vincita.consegnataAt,
    })),
  };
}

function aRisultato(
  indice: number,
  spicchi: { id: string; nome: string; colore: string }[],
  vincita: Vincita,
): RisultatoGiro {
  return { indice, spicchi, vincita };
}

export function leggiDemo(): Promise<StatoApp> {
  return inFila((stato) => statoDemo(stato));
}

export function giraDemo(): Promise<RisultatoGiro> {
  return inFila((stato) => {
    const risultato = gira(stato, Math.random());
    salva(risultato.stato);
    const vincita = statoDemo(risultato.stato).vincite[0];
    return aRisultato(risultato.indice, risultato.spicchi, vincita);
  });
}

export function annullaDemo(id: string): Promise<StatoApp> {
  return inFila((stato) => {
    const prossimo = annullaGiro(stato, id);
    salva(prossimo);
    return statoDemo(prossimo);
  });
}

export function prossimoDemo(id: string): Promise<StatoApp> {
  return inFila((stato) => {
    const prossimo = prossimoGiro(stato, id);
    salva(prossimo);
    return statoDemo(prossimo);
  });
}

export function creaDemo(nome: string, quantita: number, valore: number): Promise<Premio> {
  return inFila((stato) => {
    const premio: PremioMotore = {
      id: crypto.randomUUID(),
      nome: normalizzaNome(nome),
      colore: colorePerIndice(stato.premi.length),
      quantita: normalizzaIntero(quantita, 0, 100000),
      valore: normalizzaValore(valore),
      fotoPath: null,
      creatoIl: new Date().toISOString(),
    };
    salva({ ...stato, premi: [...stato.premi, premio] });
    return aPremio(premio);
  });
}

export function aggiornaDemo(id: string, nome: string, colore: string, valore: number): Promise<Premio> {
  return inFila((stato) => {
    if (!stato.premi.some((premio) => premio.id === id)) throw erroreDaCodice("NON_TROVATO");
    const nomeOk = normalizzaNome(nome);
    const coloreOk = normalizzaColore(colore);
    const valoreOk = normalizzaValore(valore);
    const premi = stato.premi.map((premio) =>
      premio.id === id ? { ...premio, nome: nomeOk, colore: coloreOk, valore: valoreOk } : premio,
    );
    salva({ ...stato, premi });
    return aPremio(premi.find((premio) => premio.id === id)!);
  });
}

export function pezziDemo(
  id: string,
  corpo: { aggiungi?: number; quantita?: number; attesa?: number },
): Promise<Premio> {
  return inFila((stato) => {
    const prossimo =
      corpo.aggiungi !== undefined
        ? aggiungiPezzi(stato, id, normalizzaIntero(corpo.aggiungi, 1, 100000))
        : impostaQuantita(
            stato,
            id,
            normalizzaIntero(corpo.quantita, 0, 100000),
            normalizzaIntero(corpo.attesa, 0, 100000),
          );
    salva(prossimo);
    return aPremio(prossimo.premi.find((premio) => premio.id === id)!);
  });
}

export function eliminaDemo(id: string): Promise<StatoApp> {
  return inFila((stato) => {
    const prossimo = eliminaPremio(stato, id);
    salva(prossimo);
    return statoDemo(prossimo);
  });
}

export async function fotoDemo(id: string, file: File): Promise<Premio> {
  const { tipo } = normalizzaFoto(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${tipo};base64,${buffer.toString("base64")}`;
  return inFila((stato) => {
    if (!stato.premi.some((premio) => premio.id === id)) throw erroreDaCodice("NON_TROVATO");
    const premi = stato.premi.map((premio) =>
      premio.id === id ? { ...premio, fotoPath: dataUrl } : premio,
    );
    salva({ ...stato, premi });
    return aPremio(premi.find((premio) => premio.id === id)!);
  });
}
