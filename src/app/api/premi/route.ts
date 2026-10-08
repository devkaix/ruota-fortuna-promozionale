import { caricaFoto, creaPremio, leggiStato } from "@/lib/repository";
import { ErroreRuota } from "@/lib/errori";
import { json, rispostaErrore } from "@/lib/http";
import { normalizzaIntero, normalizzaNome, normalizzaValore } from "@/lib/validazione";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const nome = normalizzaNome(form.get("nome"));
    const quantita = normalizzaIntero(form.get("quantita"), 0, 100000);
    const premio = await creaPremio(nome, quantita, normalizzaValore(form.get("valore") || 1));
    const foto = form.get("foto");
    let avviso: string | undefined;
    if (foto instanceof File && foto.size > 0) {
      try {
        await caricaFoto(premio.id, foto);
      } catch (errore) {
        avviso =
          errore instanceof ErroreRuota
            ? `Premio creato. ${errore.message}`
            : "Premio creato, ma la foto non è stata caricata.";
      }
    }
    return json({ ...(await leggiStato()), avviso });
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
