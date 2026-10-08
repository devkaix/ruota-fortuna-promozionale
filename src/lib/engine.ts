import { erroreDaCodice } from "./errori";

export type PremioMotore = {
  id: string;
  nome: string;
  colore: string;
  quantita: number;
  valore: number;
  fotoPath: string | null;
  creatoIl: string;
};

export type VincitaMotore = {
  id: string;
  premioId: string | null;
  premioNome: string;
  premioColore: string;
  fotoPath: string | null;
  creataAt: string;
  annullataAt: string | null;
  consegnataAt: string | null;
};

export type SpicchioMotore = {
  id: string;
  nome: string;
  colore: string;
};

export type StatoMotore = {
  premi: PremioMotore[];
  vincite: VincitaMotore[];
  bloccato: boolean;
  vincitaApertaId: string | null;
};

export type RisultatoMotore = {
  stato: StatoMotore;
  indice: number;
  spicchi: SpicchioMotore[];
  vincita: VincitaMotore;
};

function confronta(a: PremioMotore, b: PremioMotore): number {
  if (a.creatoIl < b.creatoIl) return -1;
  if (a.creatoIl > b.creatoIl) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function premiInRuota(stato: StatoMotore): PremioMotore[] {
  return stato.premi.filter((premio) => premio.quantita > 0).sort(confronta);
}

/** Peso estrazione: più pezzi pesano di più, un valore in euro più alto pesa di meno. */
export function pesoPremio(quantita: number, valore: number): number {
  if (quantita <= 0 || !(valore > 0)) return 0;
  return Math.max(1, Math.round((quantita * 100) / valore));
}

/** Indice dello spicchio. `pesi` sono i pesi già calcolati, `tiro` è in [0, 1). */
export function scegliIndice(pesi: number[], tiro: number): number {
  const totale = pesi.reduce((somma, peso) => somma + peso, 0);
  if (totale <= 0) throw erroreDaCodice("ESAURITO");

  const limitato = Math.min(Math.max(tiro, 0), 0.999999999999);
  let soglia = Math.floor(limitato * totale);
  if (soglia < 0 || soglia >= totale) soglia = 0;

  let cursore = 0;
  for (let indice = 0; indice < pesi.length; indice += 1) {
    cursore += pesi[indice];
    if (cursore > soglia) return indice;
  }

  return pesi.length - 1;
}

export function gira(
  stato: StatoMotore,
  tiro: number,
  ora = new Date().toISOString(),
  idVincita = crypto.randomUUID(),
): RisultatoMotore {
  const attivi = premiInRuota(stato);
  if (attivi.length === 0) throw erroreDaCodice("ESAURITO");

  const indice = scegliIndice(
    attivi.map((premio) => pesoPremio(premio.quantita, premio.valore)),
    tiro,
  );
  const scelto = attivi[indice];
  const vincita: VincitaMotore = {
    id: idVincita,
    premioId: scelto.id,
    premioNome: scelto.nome,
    premioColore: scelto.colore,
    fotoPath: scelto.fotoPath,
    creataAt: ora,
    annullataAt: null,
    consegnataAt: null,
  };

  return {
    indice,
    spicchi: attivi.map((premio) => ({
      id: premio.id,
      nome: premio.nome,
      colore: premio.colore,
    })),
    vincita,
    stato: {
      ...stato,
      bloccato: false,
      vincitaApertaId: null,
      premi: stato.premi.map((premio) =>
        premio.id === scelto.id ? { ...premio, quantita: premio.quantita - 1 } : premio,
      ),
      vincite: [vincita, ...stato.vincite],
    },
  };
}

export function annullaGiro(stato: StatoMotore, vincitaId: string, ora = new Date().toISOString()): StatoMotore {
  const aperta = stato.vincite.find((vincita) => vincita.id === vincitaId);
  if (!aperta) throw erroreDaCodice("NESSUN_GIRO");
  if (aperta.annullataAt) throw erroreDaCodice("GIA_ANNULLATA");

  return {
    ...stato,
    premi: stato.premi.map((premio) =>
      premio.id === aperta.premioId ? { ...premio, quantita: premio.quantita + 1 } : premio,
    ),
    vincite: stato.vincite.map((vincita) =>
      vincita.id === aperta.id ? { ...vincita, annullataAt: ora } : vincita,
    ),
  };
}

export function prossimoGiro(stato: StatoMotore, vincitaId: string, ora = new Date().toISOString()): StatoMotore {
  const aperta = stato.vincite.find((vincita) => vincita.id === vincitaId);
  if (!aperta) throw erroreDaCodice("NESSUN_GIRO");

  return {
    ...stato,
    bloccato: false,
    vincitaApertaId: null,
    vincite: stato.vincite.map((vincita) =>
      vincita.id === vincitaId && !vincita.annullataAt && !vincita.consegnataAt
        ? { ...vincita, consegnataAt: ora }
        : vincita,
    ),
  };
}

export function aggiungiPezzi(stato: StatoMotore, id: string, pezzi: number): StatoMotore {
  const premio = stato.premi.find((voce) => voce.id === id);
  if (!premio) throw erroreDaCodice("NON_TROVATO");
  if (!Number.isInteger(pezzi) || pezzi < 1 || premio.quantita + pezzi > 100000) {
    throw erroreDaCodice("DATI_NON_VALIDI");
  }

  return {
    ...stato,
    premi: stato.premi.map((voce) =>
      voce.id === id ? { ...voce, quantita: voce.quantita + pezzi } : voce,
    ),
  };
}

export function impostaQuantita(
  stato: StatoMotore,
  id: string,
  quantita: number,
  attesa: number,
): StatoMotore {
  const premio = stato.premi.find((voce) => voce.id === id);
  if (!premio) throw erroreDaCodice("NON_TROVATO");
  if (premio.quantita !== attesa) throw erroreDaCodice("CONFLITTO");
  if (!Number.isInteger(quantita) || quantita < 0 || quantita > 100000) {
    throw erroreDaCodice("DATI_NON_VALIDI");
  }

  return {
    ...stato,
    premi: stato.premi.map((voce) => (voce.id === id ? { ...voce, quantita } : voce)),
  };
}

export function eliminaPremio(stato: StatoMotore, id: string): StatoMotore {
  if (!stato.premi.some((premio) => premio.id === id)) throw erroreDaCodice("NON_TROVATO");

  return {
    ...stato,
    premi: stato.premi.filter((premio) => premio.id !== id),
  };
}
