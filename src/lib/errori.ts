export type CodiceErrore =
  | "GIRO_IN_CORSO"
  | "ESAURITO"
  | "NESSUN_GIRO"
  | "GIA_ANNULLATA"
  | "DATI_NON_VALIDI"
  | "NON_TROVATO"
  | "CONFLITTO";

export class ErroreRuota extends Error {
  codice: CodiceErrore;

  constructor(codice: CodiceErrore, messaggio: string) {
    super(messaggio);
    this.name = "ErroreRuota";
    this.codice = codice;
  }
}

export const MESSAGGI: Record<CodiceErrore, string> = {
  GIRO_IN_CORSO: "C'è già un giro aperto. Consegna il premio oppure annulla, poi premi Prossimo giro.",
  ESAURITO: "Non ci sono più pezzi da estrarre.",
  NESSUN_GIRO: "Non c'è un giro aperto.",
  GIA_ANNULLATA: "Questa vincita è già stata annullata.",
  DATI_NON_VALIDI: "Controlla i dati inseriti.",
  NON_TROVATO: "Premio non trovato.",
  CONFLITTO: "La scorta è appena cambiata. Riprova.",
};

export function erroreDaCodice(codice: CodiceErrore): ErroreRuota {
  return new ErroreRuota(codice, MESSAGGI[codice]);
}

export function codiceDaMessaggio(messaggio: string): CodiceErrore | null {
  const codici = Object.keys(MESSAGGI) as CodiceErrore[];
  return codici.find((codice) => messaggio.includes(codice)) ?? null;
}
