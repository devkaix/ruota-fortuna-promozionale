import { CATALOGO, percorsoIcona, scortaIniziale } from "./catalogo";
import type { StatoMotore } from "./engine";

export const SEME_DEMO: StatoMotore = {
  bloccato: false,
  vincitaApertaId: null,
  vincite: [],
  premi: CATALOGO.map((voce, indice) => ({
    id: `10000000-0000-4000-8000-${String(indice + 1).padStart(12, "0")}`,
    nome: voce.nome,
    colore: voce.colore,
    valore: voce.valore,
    quantita: scortaIniziale(voce.valore),
    fotoPath: percorsoIcona(voce.nome),
    creatoIl: new Date(Date.UTC(2026, 0, 1, 10, indice, 0)).toISOString(),
  })),
};

export function copiaSeme(): StatoMotore {
  return structuredClone(SEME_DEMO);
}
