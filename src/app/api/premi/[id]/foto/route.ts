import { caricaFoto } from "@/lib/repository";
import { json, rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

type Contesto = { params: Promise<{ id: string }> };

export async function POST(request: Request, contesto: Contesto) {
  try {
    const { id } = await contesto.params;
    const form = await request.formData();
    const foto = form.get("foto");
    if (!(foto instanceof File)) {
      return json({ errore: "DATI_NON_VALIDI", messaggio: "Scegli una fotografia." }, 400);
    }
    return json(await caricaFoto(id, foto));
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
