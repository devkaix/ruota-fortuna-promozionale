import type { Metadata } from "next";
import { Gestione } from "@/components/Gestione";
import { leggiStato } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestione premi",
  robots: { index: false, follow: false },
};

export default async function GestionePage() {
  try {
    const stato = await leggiStato();
    return <Gestione iniziale={stato} />;
  } catch {
    return (
      <main className="problema">
        <h1>Supabase non risponde</h1>
        <p>Controlla SUPABASE_URL e SUPABASE_ANON_KEY, poi ricarica la pagina.</p>
      </main>
    );
  }
}
