"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { avviaSuonoRoulette } from "@/lib/suono-roulette";
import { testoSuColore, type RisultatoGiro, type Spicchio, type StatoApp, type Vincita } from "@/lib/tipi";

const DURATA_GIRO = 10;
const GIRI_EXTRA = 6;

function punto(angolo: number, raggio: number): [number, number] {
  const rad = ((angolo - 90) * Math.PI) / 180;
  return [
    Number((50 + raggio * Math.cos(rad)).toFixed(2)),
    Number((50 + raggio * Math.sin(rad)).toFixed(2)),
  ];
}

function percorso(inizio: number, fine: number): string {
  const esterno = 42;
  const interno = 16;
  const ampio = fine - inizio > 180 ? 1 : 0;
  const [x1, y1] = punto(inizio, esterno);
  const [x2, y2] = punto(fine, esterno);
  const [x3, y3] = punto(fine, interno);
  const [x4, y4] = punto(inizio, interno);
  return `M ${x1} ${y1} A ${esterno} ${esterno} 0 ${ampio} 1 ${x2} ${y2} L ${x3} ${y3} A ${interno} ${interno} 0 ${ampio} 0 ${x4} ${y4} Z`;
}

const LAMPADINE = Array.from({ length: 28 }, (_, indice) => {
  const angolo = (indice / 28) * Math.PI * 2 - Math.PI / 2;
  return {
    left: Number((50 + 46 * Math.cos(angolo)).toFixed(2)),
    top: Number((50 + 46 * Math.sin(angolo)).toFixed(2)),
  };
});

function nomeRuota(nome: string): [string] | [string, string] {
  const corto = nome
    .replace(/ daznbet club/gi, "")
    .replace(/ daznpoint/gi, "")
    .replace(/ daznbet/gi, "")
    .replace(/^kit 3 /i, "")
    .trim();
  if (corto.length <= 11) return [corto];
  const spazio = corto.lastIndexOf(" ", 11);
  const taglio = spazio > 3 ? spazio : 11;
  const seconda = corto.slice(taglio).trim();
  return [corto.slice(0, taglio).trim(), seconda.length > 11 ? `${seconda.slice(0, 10)}…` : seconda];
}

function spicchiIniziali(stato: StatoApp): Spicchio[] {
  return stato.premi
    .filter((premio) => premio.quantita > 0)
    .map((premio) => ({
      id: premio.id,
      nome: premio.nome,
      colore: premio.colore,
      fotoUrl: premio.fotoUrl,
    }));
}

function Disco({
  spicchi,
  rotazione,
  durata,
}: {
  spicchi: Spicchio[];
  rotazione: number;
  durata: number;
}) {
  return (
    <svg
      className="disco"
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotazione}deg)`, transitionDuration: `${durata}s` }}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="42" fill="#140e0b" />
      {spicchi.map((spicchio, indice) => {
        const ampiezza = 360 / spicchi.length;
        const inizio = indice * ampiezza;
        const fine = spicchi.length === 1 ? 359.99 : inizio + ampiezza;
        const centro = inizio + ampiezza / 2;
        const tanti = spicchi.length > 8;
        const raggioIcona = tanti ? 33.2 : 31.5;
        const lato = tanti ? 8.4 : spicchi.length > 6 ? 11 : 14;
        const [mx, my] = punto(centro, raggioIcona);
        const [tx, ty] = punto(centro, 22.5);
        const misura = spicchi.length > 6 ? 2.5 : 3.2;
        const righe = nomeRuota(spicchio.nome);
        const giro = `rotate(${centro} ${mx} ${my})`;
        const giroTesto = `rotate(${centro} ${tx} ${ty})`;
        const testo = testoSuColore(spicchio.colore);
        return (
          <g key={spicchio.id}>
            <path d={percorso(inizio, fine)} fill={spicchio.colore} stroke="#111111" strokeWidth="0.4" />
            <circle cx={mx} cy={my} r={lato / 2 + 0.45} fill="#fff6df" />
            <circle cx={mx} cy={my} r={lato / 2} fill="#fffaf2" />
            {spicchio.fotoUrl ? (
              <>
                <clipPath id={`medaglia-${indice}`}>
                  <circle cx={mx} cy={my} r={lato / 2 - 0.15} />
                </clipPath>
                <image
                  href={spicchio.fotoUrl}
                  x={mx - lato / 2}
                  y={my - lato / 2}
                  width={lato}
                  height={lato}
                  transform={giro}
                  clipPath={`url(#medaglia-${indice})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              </>
            ) : null}
            {tanti ? null : (
              <text
                x={tx}
                y={ty}
                fill={testo}
                stroke={testo === "#1C140F" ? "#ffffff" : "#111111"}
                strokeWidth="0.22"
                paintOrder="stroke"
                fontSize={misura}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={giroTesto}
              >
                {righe.length === 1 ? (
                  righe[0]
                ) : (
                  <>
                    <tspan x={tx} dy={-misura * 0.55}>{righe[0]}</tspan>
                    <tspan x={tx} dy={misura * 1.15}>{righe[1]}</tspan>
                  </>
                )}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

async function chiama<T>(url: string, init?: RequestInit): Promise<T> {
  const risposta = await fetch(url, { ...init, cache: "no-store" });
  const dati = (await risposta.json()) as { messaggio?: string };
  if (!risposta.ok) throw new Error(dati.messaggio ?? "Operazione non riuscita.");
  return dati as T;
}

export function Ruota({ iniziale }: { iniziale: StatoApp }) {
  const [stato, setStato] = useState(iniziale);
  const [spicchi, setSpicchi] = useState(() => spicchiIniziali(iniziale));
  const [rotazione, setRotazione] = useState(0);
  const [durata, setDurata] = useState(DURATA_GIRO);
  const [vincita, setVincita] = useState<Vincita | null>(null);
  const [mostraVinto, setMostraVinto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errore, setErrore] = useState("");
  const [disegnata, setDisegnata] = useState(false);
  const blocco = useRef(false);
  const fermaSuono = useRef<() => void>(() => undefined);

  useEffect(() => {
    setDisegnata(true);
    return () => fermaSuono.current();
  }, []);

  const pezzi = spicchi.reduce((somma, spicchio) => {
    const premio = stato.premi.find((voce) => voce.id === spicchio.id);
    return somma + (premio?.quantita ?? 0);
  }, 0);

  async function ricarica() {
    const nuovo = await chiama<StatoApp>("/api/stato");
    setStato(nuovo);
    return nuovo;
  }

  async function onGira() {
    if (blocco.current || spicchi.length === 0) return;
    blocco.current = true;
    setBusy(true);
    setErrore("");
    try {
      const risultato = await chiama<RisultatoGiro>("/api/gira", { method: "POST" });
      const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const secondi = riduci ? 0.25 : DURATA_GIRO;
      setDurata(secondi);
      fermaSuono.current();
      fermaSuono.current = riduci ? () => undefined : avviaSuonoRoulette(secondi);
      const foto = new Map(stato.premi.map((premio) => [premio.id, premio.fotoUrl]));
      setSpicchi(
        risultato.spicchi.map((spicchio) => ({
          ...spicchio,
          fotoUrl: foto.get(spicchio.id) ?? null,
        })),
      );
      setRotazione((attuale) => {
        const centro = (risultato.indice + 0.5) * (360 / risultato.spicchi.length);
        const obiettivo = (360 - centro) % 360;
        const base = ((attuale % 360) + 360) % 360;
        let delta = obiettivo - base;
        if (delta <= 0) delta += 360;
        return attuale + delta + 360 * (riduci ? 1 : GIRI_EXTRA);
      });
      await new Promise((resolve) => window.setTimeout(resolve, secondi * 1000 + 80));
      fermaSuono.current();
      const nuovo = await ricarica();
      setVincita(nuovo.vincitaAperta ?? risultato.vincita);
      setMostraVinto(true);
      setSpicchi(spicchiIniziali(nuovo));
    } catch (problema) {
      fermaSuono.current();
      const messaggio = problema instanceof Error ? problema.message : "Operazione non riuscita.";
      try {
        const nuovo = await ricarica();
        if (nuovo.vincitaAperta) {
          setVincita(nuovo.vincitaAperta);
          setMostraVinto(true);
          setSpicchi(spicchiIniziali(nuovo));
          return;
        }
      } catch {
        // Il messaggio sotto resta quello dell'estrazione.
      }
      setErrore(messaggio);
    } finally {
      blocco.current = false;
      setBusy(false);
    }
  }

  async function onAnnulla() {
    if (blocco.current) return;
    blocco.current = true;
    setBusy(true);
    setErrore("");
    try {
      if (!vincita) return;
      const nuovo = await chiama<StatoApp>("/api/annulla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vincita.id }),
      });
      setStato(nuovo);
      setSpicchi(spicchiIniziali(nuovo));
      setVincita(nuovo.vincite.find((voce) => voce.id === vincita.id) ?? vincita);
    } catch (problema) {
      setErrore(problema instanceof Error ? problema.message : "Operazione non riuscita.");
    } finally {
      blocco.current = false;
      setBusy(false);
    }
  }

  async function onProssimo() {
    if (blocco.current) return;
    blocco.current = true;
    setBusy(true);
    setErrore("");
    try {
      if (!vincita) return;
      const nuovo = await chiama<StatoApp>("/api/prossimo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vincita.id }),
      });
      setStato(nuovo);
      setSpicchi(spicchiIniziali(nuovo));
      setVincita(null);
      setMostraVinto(false);
    } catch (problema) {
      setErrore(problema instanceof Error ? problema.message : "Operazione non riuscita.");
    } finally {
      blocco.current = false;
      setBusy(false);
    }
  }

  const bloccata = busy;

  return (
    <main className="banco">
      {stato.modalitaDemo ? (
        <p className="striscia" role="status">
          Modalità demo. Dati di esempio, Supabase non è collegato.
        </p>
      ) : null}
      <header className="testata">
        <div className="marchio">
          <img src="/dazn-bet.svg" alt="DAZN BET" />
          <div>
            <p className="sopra">Stand promozionale</p>
            <h1>Ruota della fortuna</h1>
          </div>
        </div>
        <Link className="linkQuiet" href="/gestione">
          Gestione
        </Link>
      </header>

      <section className="palco">
        <div className={busy && !mostraVinto ? "ruotaBox inCorsa" : "ruotaBox"}>
          <div className="telaio" aria-hidden="true" />
          <div className="lampadine" aria-hidden="true">
            {LAMPADINE.map((lampadina, indice) => (
              <span
                key={indice}
                className={indice % 2 === 0 ? "lampadina calda" : "lampadina"}
                style={{ left: `${lampadina.left}%`, top: `${lampadina.top}%` }}
              />
            ))}
          </div>
          <div className="lancetta" aria-hidden="true" />
          {spicchi.length === 0 ? (
            <div className="ruotaVuota">Nessun premio con pezzi disponibili</div>
          ) : disegnata ? (
            <Disco spicchi={spicchi} rotazione={rotazione} durata={durata} />
          ) : (
            <div className="disco discoVuoto" />
          )}
          <div className="vetro" aria-hidden="true" />
          <div className="mozzo">
            <img src="/dazn-bet-centro.svg" alt="" />
          </div>
        </div>

        <div className="comandi">
          <button className="gira" type="button" onClick={onGira} disabled={bloccata || spicchi.length === 0}>
            {busy && !mostraVinto ? "Estrazione..." : "Gira"}
          </button>
          <p className="pezzi">
            {spicchi.length === 0
              ? "Aggiungi le quantità dei gadget in gestione."
              : `${pezzi} ${pezzi === 1 ? "pezzo ancora in gioco" : "pezzi ancora in gioco"}`}
          </p>
          {errore ? (
            <p className="errore" role="alert">
              {errore}
            </p>
          ) : null}
          <ul className="legenda">
            {stato.premi.filter((premio) => premio.quantita > 0).map((premio) => (
              <li key={premio.id}>
                <span className="bollino" style={{ background: premio.colore }} />
                <span>{premio.nome}</span>
                <strong>{premio.quantita}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {mostraVinto && vincita ? (
        <VincitaSchermo vincita={vincita} busy={busy} onAnnulla={onAnnulla} onProssimo={onProssimo} />
      ) : null}
    </main>
  );
}

function VincitaSchermo({
  vincita,
  busy,
  onAnnulla,
  onProssimo,
}: {
  vincita: Vincita;
  busy: boolean;
  onAnnulla: () => void;
  onProssimo: () => void;
}) {
  const annullata = Boolean(vincita.annullataAt);

  return (
    <div className="vinto" role="dialog" aria-modal="true" aria-labelledby="titolo-vincita">
      <div className="coriandoli" aria-hidden="true">
        {Array.from({ length: 22 }, (_, indice) => (
          <i key={indice} />
        ))}
      </div>
      <div className="alone" aria-hidden="true" />
      <p id="titolo-vincita" className="vintoTitolo">
        {annullata ? "Vincita annullata" : "Hai vinto!"}
      </p>
      <div className="cornice">
        {vincita.fotoUrl ? (
          <img src={vincita.fotoUrl} alt={vincita.premioNome} />
        ) : (
          <p className="senzaFoto">{vincita.premioNome}</p>
        )}
      </div>
      <div className="vintoPiede">
        <h2>{vincita.premioNome}</h2>
        <p>
          {annullata
            ? "Il pezzo è tornato tra le scorte. Si può annullare una volta sola."
            : "Consegna il gadget, poi prepara il prossimo giro."}
        </p>
        <div className="azioniVinto">
          {annullata ? null : (
            <button className="secondario" type="button" onClick={onAnnulla} disabled={busy}>
              Annulla vincita
            </button>
          )}
          <button className="gira" type="button" onClick={onProssimo} disabled={busy}>
            Prossimo giro
          </button>
        </div>
      </div>
    </div>
  );
}
