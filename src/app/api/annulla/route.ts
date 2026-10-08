import { annullaVincita } from "@/lib/repository";
import { json, rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as { id?: string };
    return json(await annullaVincita(String(corpo.id ?? "")));
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
