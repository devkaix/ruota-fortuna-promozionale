import { Ruota } from "@/components/Ruota";
import { leggiStato } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const stato = await leggiStato();
    return <Ruota iniziale={stato} />;
  } catch {
    return (
      <main className="problema">
        <h1>Supabase non risponde</h1>
        <p>Controlla SUPABASE_URL e SUPABASE_ANON_KEY, poi ricarica la pagina.</p>
      </main>
    );
  }
}
