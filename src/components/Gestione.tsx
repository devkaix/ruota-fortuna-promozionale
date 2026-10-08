"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Premio, StatoApp } from "@/lib/tipi";
import { statoVincita } from "@/lib/tipi";
import { PALETTE } from "@/lib/validazione";

async function chiama<T>(url: string, init?: RequestInit): Promise<T> {
  const risposta = await fetch(url, { ...init, cache: "no-store" });
  const dati = (await risposta.json()) as { messaggio?: string };
  if (!risposta.ok) throw new Error(dati.messaggio ?? "Operazione non riuscita.");
  return dati as T;
}

function CampoFoto({
  nome,
  etichetta = "Fotografia",
  obbligatorio = false,
}: {
  nome: string;
  etichetta?: string;
  obbligatorio?: boolean;
}) {
  const [file, setFile] = useState("JPG, PNG o WebP");
  return (
    <label>
      {etichetta}
      <span className="campoFoto">
        <input
          name={nome}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={obbligatorio}
          onChange={(evento) => setFile(evento.target.files?.[0]?.name ?? "JPG, PNG o WebP")}
        />
        <span>{file}</span>
      </span>
    </label>
  );
}

function formatta(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function Gestione({ iniziale }: { iniziale: StatoApp }) {
  const [stato, setStato] = useState(iniziale);
  const [nome, setNome] = useState("");
  const [quantita, setQuantita] = useState("1");
  const [messaggio, setMessaggio] = useState("");
  const [errore, setErrore] = useState("");
  const [occupato, setOccupato] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const blocco = useRef(false);

  async function esegui(chiave: string, lavoro: () => Promise<void>) {
    if (blocco.current) return;
    blocco.current = true;
    setOccupato(chiave);
    setErrore("");
    setMessaggio("");
    try {
      await lavoro();
    } catch (problema) {
      setErrore(problema instanceof Error ? problema.message : "Operazione non riuscita.");
    } finally {
      blocco.current = false;
      setOccupato("");
    }
  }

  return (
    <main className="scrivania">
      {stato.modalitaDemo ? (
        <p className="striscia" role="status">
          Modalità demo. Dati di esempio, Supabase non è collegato.
        </p>
      ) : null}
      <header className="testata chiara">
        <div>
          <p className="sopra">Scorte e registro</p>
          <h1>Gestione premi</h1>
        </div>
        <Link className="linkQuiet scuro" href="/">
          Torna alla ruota
        </Link>
      </header>

      {messaggio ? <p className="ok">{messaggio}</p> : null}
      {errore ? (
        <p className="errore" role="alert">
          {errore}
        </p>
      ) : null}

      <form
        ref={formRef}
        className="nuovo"
        onSubmit={(evento) => {
          evento.preventDefault();
          const dati = new FormData(evento.currentTarget);
          void esegui("nuovo", async () => {
            const nuovo = await chiama<StatoApp & { avviso?: string }>("/api/premi", {
              method: "POST",
              body: dati,
            });
            setStato(nuovo);
            setNome("");
            setQuantita("1");
            formRef.current?.reset();
            setMessaggio(nuovo.avviso ?? "Premio aggiunto.");
          });
        }}
      >
        <h2>Aggiungi un gadget</h2>
        <p className="nota">
          Foto e pezzi dell’evento. La ruota mostra solo i gadget con scorta: più pezzi, più possibilità. Un valore più alto esce meno spesso.
        </p>
        <div className="campi">
          <label>
            Nome
            <input
              name="nome"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              maxLength={40}
              required
              placeholder="Es. Zaino"
            />
          </label>
          <label>
            Quantità
            <input
              name="quantita"
              type="number"
              min={0}
              max={100000}
              step={1}
              value={quantita}
              onChange={(evento) => setQuantita(evento.target.value)}
              required
            />
          </label>
          <label>
            Valore €
            <input name="valore" type="number" min={0.01} max={100000} step={0.01} defaultValue={1} required />
          </label>
          <CampoFoto nome="foto" />
          <button className="gira scuro" type="submit" disabled={Boolean(occupato)}>
            Aggiungi premio
          </button>
        </div>
        <p className="nota">Gli spicchi restano tutti uguali. Le probabilità le calcola la ruota.</p>
      </form>

      <section className="schede">
        {stato.premi.length === 0 ? <p className="nota">Nessun premio ancora.</p> : null}
        {stato.premi.map((premio) => (
          <Scheda
            key={premio.id}
            premio={premio}
            occupato={occupato}
            onFatto={(nuovo, testo) => {
              setStato(nuovo);
              setMessaggio(testo);
              setErrore("");
            }}
            onPremio={(aggiornato, testo) => {
              setStato((attuale) => ({
                ...attuale,
                premi: attuale.premi.map((voce) => (voce.id === aggiornato.id ? aggiornato : voce)),
              }));
              setMessaggio(testo);
              setErrore("");
            }}
            onErrore={setErrore}
            esegui={esegui}
          />
        ))}
      </section>

      <section className="registro">
        <div className="registroTesta">
          <h2>Registro vincite</h2>
          <a className="secondario" href="/api/vincite/csv">
            Esporta CSV
          </a>
        </div>
        {stato.vincite.length === 0 ? (
          <p className="nota">Nessuna vincita registrata.</p>
        ) : (
          <div className="tabellaWrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Premio</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {stato.vincite.map((vincita) => (
                  <tr key={vincita.id}>
                    <td>{formatta(vincita.creataAt)}</td>
                    <td>{vincita.premioNome}</td>
                    <td>{statoVincita(vincita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Scheda({
  premio,
  occupato,
  esegui,
  onFatto,
  onPremio,
  onErrore,
}: {
  premio: Premio;
  occupato: string;
  esegui: (chiave: string, lavoro: () => Promise<void>) => Promise<void>;
  onFatto: (stato: StatoApp, testo: string) => void;
  onPremio: (premio: Premio, testo: string) => void;
  onErrore: (testo: string) => void;
}) {
  const [nome, setNome] = useState(premio.nome);
  const [colore, setColore] = useState(premio.colore);
  const [valore, setValore] = useState(String(premio.valore));
  const [arrivo, setArrivo] = useState("1");
  const [correzione, setCorrezione] = useState(String(premio.quantita));
  const disabilitato = Boolean(occupato);

  return (
    <article className="scheda">
      <div className="miniatura">
        {premio.fotoUrl ? <img src={premio.fotoUrl} alt="" /> : <span>Nessuna foto</span>}
      </div>
      <div className="schedaCorpo">
        <label>
          Nome
          <input value={nome} maxLength={40} onChange={(evento) => setNome(evento.target.value)} />
        </label>
        <div className="colori" role="group" aria-label={`Colore di ${premio.nome}`}>
          {PALETTE.map((tono) => (
            <button
              key={tono}
              type="button"
              className={tono.toLowerCase() === colore.toLowerCase() ? "tono attivo" : "tono"}
              style={{ background: tono }}
              aria-label={tono}
              disabled={disabilitato}
              onClick={() => setColore(tono)}
            />
          ))}
        </div>
        <label>
          Valore €
          <input
            type="number"
            min={0.01}
            max={100000}
            step={0.01}
            value={valore}
            onChange={(evento) => setValore(evento.target.value)}
          />
        </label>
        <button
          className="testo"
          type="button"
          disabled={disabilitato}
          onClick={() =>
            void esegui(`nome-${premio.id}`, async () => {
              const aggiornato = await chiama<Premio>(`/api/premi/${premio.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, colore, valore: Number(valore.replace(",", ".")) }),
              });
              setValore(String(aggiornato.valore));
              onPremio(aggiornato, "Premio aggiornato.");
            })
          }
        >
          Salva nome e valore
        </button>

        <p className="scorta">
          Pezzi rimasti <strong>{premio.quantita}</strong>
        </p>
        <div className="rigaPezzi">
          <label>
            Pezzi in arrivo
            <input
              type="number"
              min={1}
              max={100000}
              step={1}
              value={arrivo}
              onChange={(evento) => setArrivo(evento.target.value)}
            />
          </label>
          <button
            className="gira scuro" 
            type="button"
            disabled={disabilitato}
            onClick={() =>
              void esegui(`add-${premio.id}`, async () => {
                const aggiornato = await chiama<Premio>(`/api/premi/${premio.id}/pezzi`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ aggiungi: Number(arrivo) }),
                });
                setCorrezione(String(aggiornato.quantita));
                onPremio(aggiornato, `Aggiunti ${arrivo} pezzi a ${aggiornato.nome}.`);
              })
            }
          >
            Aggiungi pezzi
          </button>
        </div>
        <div className="rigaPezzi">
          <label>
            Imposta quantità
            <input
              type="number"
              min={0}
              max={100000}
              step={1}
              value={correzione}
              onChange={(evento) => setCorrezione(evento.target.value)}
            />
          </label>
          <button
            className="secondario"
            type="button"
            disabled={disabilitato}
            onClick={() => {
              const prossima = Number(correzione);
              if (!window.confirm(`Impostare ${premio.nome} a ${prossima} pezzi? Sostituisce la quantità attuale.`)) {
                return;
              }
              void esegui(`set-${premio.id}`, async () => {
                const aggiornato = await chiama<Premio>(`/api/premi/${premio.id}/pezzi`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ quantita: prossima, attesa: premio.quantita }),
                });
                setCorrezione(String(aggiornato.quantita));
                onPremio(aggiornato, "Quantità aggiornata.");
              });
            }}
          >
            Imposta
          </button>
        </div>
        <p className="nota">Aggiungi pezzi quando arriva nuova merce. Imposta solo per correggere un errore.</p>

        <form
          className="fotoForm"
          onSubmit={(evento) => {
            evento.preventDefault();
            const dati = new FormData(evento.currentTarget);
            const form = evento.currentTarget;
            void esegui(`foto-${premio.id}`, async () => {
              const aggiornato = await chiama<Premio>(`/api/premi/${premio.id}/foto`, {
                method: "POST",
                body: dati,
              });
              form.reset();
              onPremio(aggiornato, "Fotografia aggiornata.");
            });
          }}
        >
          <CampoFoto nome="foto" etichetta="Cambia fotografia" obbligatorio />
          <button className="secondario" type="submit" disabled={disabilitato}>
            Carica foto
          </button>
        </form>

        <button
          className="pericolo"
          type="button"
          disabled={disabilitato}
          onClick={() => {
            if (!window.confirm(`Eliminare ${premio.nome}? Le vincite già registrate restano nel registro.`)) return;
            void esegui(`del-${premio.id}`, async () => {
              try {
                const nuovo = await chiama<StatoApp>(`/api/premi/${premio.id}`, { method: "DELETE" });
                onFatto(nuovo, "Premio eliminato.");
              } catch (problema) {
                onErrore(problema instanceof Error ? problema.message : "Operazione non riuscita.");
                throw problema;
              }
            });
          }}
        >
          Elimina premio
        </button>
      </div>
    </article>
  );
}
