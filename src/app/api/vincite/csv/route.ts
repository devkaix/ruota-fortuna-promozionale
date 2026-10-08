import { esportaCsv } from "@/lib/repository";
import { rispostaErrore } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const csv = await esportaCsv();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vincite.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (errore) {
    return rispostaErrore(errore);
  }
}
