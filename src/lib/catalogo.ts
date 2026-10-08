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

export const CATALOGO: VoceCatalogo[] = [
  { nome: "Kit 3 Adesivi Daznpoint", valore: 2, colore: "#F04B3A" },
  { nome: "Penne Daznbet Club", valore: 0.5, colore: "#F2C14E" },
  { nome: "Accendini Daznbet Club", valore: 1, colore: "#E37B2C" },
  { nome: "Portachiavi Daznbet Club", valore: 0.75, colore: "#2F7D4A" },
  { nome: "Laccetti Daznbet Club", valore: 2, colore: "#2C6BED" },
  { nome: "Sacche Daznbet Club", valore: 3, colore: "#7A45B5" },
  { nome: "Agenda Daznbet Club", valore: 6, colore: "#1F8A8A" },
  { nome: "Cartellina Daznbet Club", valore: 4, colore: "#D4537E" },
  { nome: "Borraccia Daznbet Club", valore: 10, colore: "#3D8BFF" },
  { nome: "Ombrello Daznbet Club", valore: 15, colore: "#5C6B7A" },
  { nome: "Powerbank Daznbet Club", valore: 25, colore: "#C83B2E" },
  { nome: "T-shirt Daznbet Club", valore: 10, colore: "#111111" },
  { nome: "Felpa Daznbet Club", valore: 20, colore: "#6B4F3A" },
  { nome: "Felpa DaznBet Club Zip", valore: 30, colore: "#8E3D55" },
  { nome: "Zaino Daznbet Club", valore: 65, colore: "#1C4E3A" },
  { nome: "Rollup Daznbet Club", valore: 55, colore: "#B8860B" },
  { nome: "User & Pass Daznbet", valore: 5, colore: "#4C6EF5" },
  { nome: "Totem da banco Daznbet", valore: 5, colore: "#0E7C66" },
  { nome: "Rendiresto Daznbet", valore: 4, colore: "#C45C26" },
  { nome: "Mousepad Daznbet", valore: 3.5, colore: "#546E7A" },
  { nome: "Poster Daznbet Gioco responsabile", valore: 2, colore: "#2E7D32" },
  { nome: "Spilletta Daznbet", valore: 1, colore: "#AD1457" },
  { nome: "Berretto Daznbet", valore: 2.5, colore: "#1565C0" },
  { nome: "T-Shirt Daznbet", valore: 10, colore: "#37474F" },
];
