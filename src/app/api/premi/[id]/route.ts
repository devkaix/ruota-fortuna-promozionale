import { aggiornaPremio, eliminaPremio } from "@/lib/repository";
import { json, rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

type Contesto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, contesto: Contesto) {
  try {
    const { id } = await contesto.params;
    const corpo = (await request.json()) as { nome?: string; colore?: string; valore?: number };
    const premio = await aggiornaPremio(
      id,
      String(corpo.nome ?? ""),
      String(corpo.colore ?? ""),
      Number(corpo.valore),
    );
    return json(premio);
  } catch (errore) {
    return rispostaErrore(errore);
  }
}

export async function DELETE(_request: Request, contesto: Contesto) {
  try {
    const { id } = await contesto.params;
    return json(await eliminaPremio(id));
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
