import { modificaPezzi } from "@/lib/repository";
import { json, rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

type Contesto = { params: Promise<{ id: string }> };

export async function POST(request: Request, contesto: Contesto) {
  try {
    const { id } = await contesto.params;
    const corpo = (await request.json()) as { aggiungi?: number; quantita?: number; attesa?: number };
    return json(await modificaPezzi(id, corpo));
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
