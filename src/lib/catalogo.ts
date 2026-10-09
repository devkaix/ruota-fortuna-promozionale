import { colorePerIndice } from "./validazione";

export type VoceCatalogo = {
  nome: string;
  valore: number;
  colore: string;
};

/** Icona di riserva usata solo in modalità demo. In evento la foto è quella caricata su Supabase. */
export function percorsoIcona(nome: string): string {
  const slug = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/catalogo/${slug}.svg`;
}

/** Scorte di partenza: i pezzi piccoli sono di più, quelli cari di meno. */
export function scortaIniziale(valore: number): number {
  if (valore <= 1) return 10;
  if (valore <= 3) return 6;
  if (valore <= 10) return 3;
  if (valore <= 30) return 2;
  return 1;
}

const VOCI: Array<Omit<VoceCatalogo, "colore">> = [
  { nome: "Kit 3 Adesivi Daznpoint", valore: 2 },
  { nome: "Penne Daznbet Club", valore: 0.5 },
  { nome: "Accendini Daznbet Club", valore: 1 },
  { nome: "Portachiavi Daznbet Club", valore: 0.75 },
  { nome: "Laccetti Daznbet Club", valore: 2 },
  { nome: "Sacche Daznbet Club", valore: 3 },
  { nome: "Agenda Daznbet Club", valore: 6 },
  { nome: "Cartellina Daznbet Club", valore: 4 },
  { nome: "Borraccia Daznbet Club", valore: 10 },
  { nome: "Ombrello Daznbet Club", valore: 15 },
  { nome: "Powerbank Daznbet Club", valore: 25 },
  { nome: "T-shirt Daznbet Club", valore: 10 },
  { nome: "Felpa Daznbet Club", valore: 20 },
  { nome: "Felpa DaznBet Club Zip", valore: 30 },
  { nome: "Zaino Daznbet Club", valore: 65 },
  { nome: "Rollup Daznbet Club", valore: 55 },
  { nome: "User & Pass Daznbet", valore: 5 },
  { nome: "Totem da banco Daznbet", valore: 5 },
  { nome: "Rendiresto Daznbet", valore: 4 },
  { nome: "Mousepad Daznbet", valore: 3.5 },
  { nome: "Poster Daznbet Gioco responsabile", valore: 2 },
  { nome: "Spilletta Daznbet", valore: 1 },
  { nome: "Berretto Daznbet", valore: 2.5 },
  { nome: "T-Shirt Daznbet", valore: 10 },
];

export const CATALOGO: VoceCatalogo[] = VOCI.map((voce, indice) => ({
  ...voce,
  colore: colorePerIndice(indice),
}));
