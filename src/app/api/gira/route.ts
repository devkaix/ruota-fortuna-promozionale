import { giraRuota } from "@/lib/repository";
import { json, rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return json(await giraRuota());
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
