import { NextResponse } from "next/server";
import { ErroreRuota, type CodiceErrore } from "./errori";

const STATI: Record<CodiceErrore, number> = {
  GIRO_IN_CORSO: 409,
  ESAURITO: 409,
  NESSUN_GIRO: 409,
  GIA_ANNULLATA: 409,
  DATI_NON_VALIDI: 400,
  NON_TROVATO: 404,
  CONFLITTO: 409,
};

export function json(dati: unknown, status = 200) {
  return NextResponse.json(dati, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function rispostaErrore(errore: unknown) {
  if (errore instanceof ErroreRuota) {
    return json({ errore: errore.codice, messaggio: errore.message }, STATI[errore.codice]);
  }
  console.error(errore);
  return json({ errore: "ERRORE", messaggio: "Operazione non riuscita." }, 500);
}
