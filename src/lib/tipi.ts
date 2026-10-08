export type Premio = {
  id: string;
  nome: string;
  colore: string;
  quantita: number;
  valore: number;
  fotoUrl: string | null;
};

export type Spicchio = {
  id: string;
  nome: string;
  colore: string;
  fotoUrl?: string | null;
};

export type Vincita = {
  id: string;
  premioId: string | null;
  premioNome: string;
  premioColore: string;
  fotoUrl: string | null;
  creataAt: string;
  annullataAt: string | null;
  consegnataAt: string | null;
};

export type StatoApp = {
  modalitaDemo: boolean;
  premi: Premio[];
  bloccato: boolean;
  vincitaAperta: Vincita | null;
  vincite: Vincita[];
};

export type RisultatoGiro = {
  indice: number;
  spicchi: Spicchio[];
  vincita: Vincita;
};

export function statoVincita(vincita: Vincita): "Annullata" | "Consegnata" | "In consegna" {
  if (vincita.annullataAt) return "Annullata";
  if (vincita.consegnataAt) return "Consegnata";
  return "In consegna";
}

export function testoSuColore(esadecimale: string): string {
  const rosso = Number.parseInt(esadecimale.slice(1, 3), 16);
  const verde = Number.parseInt(esadecimale.slice(3, 5), 16);
  const blu = Number.parseInt(esadecimale.slice(5, 7), 16);
  const luminanza = (rosso * 299 + verde * 587 + blu * 114) / 1000;
  return luminanza > 155 ? "#1C140F" : "#FFF8EF";
}
