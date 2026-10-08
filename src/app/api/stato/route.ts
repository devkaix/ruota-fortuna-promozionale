import { leggiStato } from "@/lib/repository";
import { json, rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json(await leggiStato());
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
