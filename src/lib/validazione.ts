import { ErroreRuota, erroreDaCodice } from "./errori";

const COLORE = /^#[0-9A-Fa-f]{6}$/;

/** Nero, giallo DAZN BET, bianco e rosso roulette, alternati scuro/chiaro. */
export const PALETTE = [
  "#111111",
  "#E6FF00",
  "#1A1A1A",
  "#FFFFFF",
  "#C8102E",
  "#FFF4A3",
  "#2A2A2A",
  "#F4F4F4",
];

export function colorePerIndice(indice: number): string {
  return PALETTE[indice % PALETTE.length];
}

export function normalizzaNome(valore: unknown): string {
  if (typeof valore !== "string") throw erroreDaCodice("DATI_NON_VALIDI");
  const nome = valore.trim();
  if (nome.length < 1 || nome.length > 40) {
    throw new ErroreRuota("DATI_NON_VALIDI", "Il nome deve avere da 1 a 40 caratteri.");
  }
  return nome;
}

export function normalizzaIntero(valore: unknown, minimo: number, massimo: number): number {
  const numero = typeof valore === "number" ? valore : Number(String(valore ?? "").trim());
  if (!Number.isInteger(numero) || numero < minimo || numero > massimo) {
    throw new ErroreRuota("DATI_NON_VALIDI", "La quantità non è valida.");
  }
  return numero;
}

export function normalizzaValore(valore: unknown): number {
  const testo = typeof valore === "number" ? String(valore) : String(valore ?? "").trim().replace(",", ".");
  const numero = Number(testo);
  if (!Number.isFinite(numero) || numero <= 0 || numero > 100000) {
    throw new ErroreRuota("DATI_NON_VALIDI", "Il valore in euro non è valido.");
  }
  return Math.round(numero * 100) / 100;
}

export function normalizzaColore(valore: unknown): string {
  if (typeof valore !== "string" || !COLORE.test(valore)) {
    throw new ErroreRuota("DATI_NON_VALIDI", "Il colore non è valido.");
  }
  return valore.toUpperCase();
}

const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function normalizzaFoto(file: File): { tipo: string; estensione: string } {
  const estensione = ESTENSIONI[file.type];
  if (!estensione) {
    throw new ErroreRuota("DATI_NON_VALIDI", "Usa una foto JPG, PNG o WebP.");
  }
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new ErroreRuota("DATI_NON_VALIDI", "La foto deve pesare al massimo 5 MB.");
  }
  return { tipo: file.type, estensione };
}
