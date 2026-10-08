import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggiungiPezzi,
  annullaGiro,
  eliminaPremio,
  gira,
  impostaQuantita,
  pesoPremio,
  premiInRuota,
  prossimoGiro,
  scegliIndice,
  type PremioMotore,
  type StatoMotore,
} from "../src/lib/engine.ts";
import { ErroreRuota } from "../src/lib/errori.ts";

function premio(parziale: Partial<PremioMotore> & Pick<PremioMotore, "id" | "nome" | "quantita">): PremioMotore {
  return {
    colore: "#C83B2E",
    valore: 1,
    fotoPath: "/demo/maglietta.svg",
    creatoIl: "2026-01-01T00:00:00.000Z",
    ...parziale,
  };
}

function stato(premi: PremioMotore[], extra: Partial<StatoMotore> = {}): StatoMotore {
  return { premi, vincite: [], bloccato: false, vincitaApertaId: null, ...extra };
}

function mulberry32(seme: number) {
  let valore = seme;
  return () => {
    valore |= 0;
    valore = (valore + 0x6d2b79f5) | 0;
    let t = Math.imul(valore ^ (valore >>> 15), 1 | valore);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("estrazione pesata", () => {
  it("con tiro 0 esce il primo premio che ha pezzi", () => {
    const iniziale = stato([
      premio({ id: "vuoto", nome: "Finito", quantita: 0, creatoIl: "2026-01-01T00:00:00.000Z" }),
      premio({ id: "a", nome: "Maglietta", quantita: 5, creatoIl: "2026-01-01T00:01:00.000Z" }),
      premio({ id: "b", nome: "Borraccia", quantita: 1, creatoIl: "2026-01-01T00:02:00.000Z" }),
    ]);
    const risultato = gira(iniziale, 0, "2026-10-08T12:00:00.000Z", "v1");
    assert.equal(risultato.vincita.premioNome, "Maglietta");
    assert.equal(risultato.indice, 0);
    assert.deepEqual(
      risultato.spicchi.map((spicchio) => spicchio.nome),
      ["Maglietta", "Borraccia"],
    );
    assert.equal(risultato.stato.premi.find((voce) => voce.id === "a")?.quantita, 4);
    assert.equal(iniziale.premi.find((voce) => voce.id === "a")?.quantita, 5);
    assert.equal(risultato.stato.bloccato, false);
  });

  it("il peso alto cade sull'ultimo spicchio", () => {
    assert.equal(scegliIndice([5, 1], 0.999), 1);
    assert.equal(scegliIndice([5, 1], 0), 0);
  });

  it("a parità di pezzi un valore più alto pesa meno", () => {
    assert.equal(pesoPremio(10, 0.5), 2000);
    assert.equal(pesoPremio(1, 65), 2);
    const iniziale = stato([
      premio({ id: "penna", nome: "Penne Daznbet Club", quantita: 10, valore: 0.5 }),
      premio({ id: "zaino", nome: "Zaino Daznbet Club", quantita: 1, valore: 65, creatoIl: "2026-01-01T00:01:00.000Z" }),
    ]);
    assert.equal(gira(iniziale, 0).vincita.premioNome, "Penne Daznbet Club");
    assert.equal(gira(iniziale, 0.9995).vincita.premioNome, "Zaino Daznbet Club");
  });

  it("su molte estrazioni le frequenze seguono le quantità", () => {
    const casuale = mulberry32(1);
    let magliette = 0;
    const prove = 4000;
    for (let i = 0; i < prove; i += 1) {
      if (scegliIndice([5, 1], casuale()) === 0) magliette += 1;
    }
    const quota = magliette / prove;
    assert.ok(quota > 0.8 && quota < 0.87, `quota magliette ${quota}`);
  });

  it("a quantità zero il premio non è in ruota", () => {
    const attuale = stato([premio({ id: "a", nome: "Solo", quantita: 0 })]);
    assert.equal(premiInRuota(attuale).length, 0);
    assert.throws(() => gira(attuale, 0), (errore: ErroreRuota) => errore.codice === "ESAURITO");
  });
});

describe("giro, annullo e scorte", () => {
  const base = () => stato([premio({ id: "a", nome: "Maglietta", quantita: 1 })]);

  it("un secondo giro non resta bloccato e scala un altro pezzo", () => {
    const iniziale = stato([premio({ id: "a", nome: "Maglietta", quantita: 2 })]);
    const primo = gira(iniziale, 0, "2026-10-08T12:00:00.000Z", "v1");
    const secondo = gira(primo.stato, 0, "2026-10-08T12:00:01.000Z", "v2");
    assert.equal(secondo.stato.premi[0].quantita, 0);
    assert.equal(secondo.stato.bloccato, false);
  });

  it("l'annullo reintegra il pezzo una volta sola", () => {
    const primo = gira(base(), 0, "2026-10-08T12:00:00.000Z", "v1");
    const annullato = annullaGiro(primo.stato, "v1", "2026-10-08T12:01:00.000Z");
    assert.equal(annullato.premi[0].quantita, 1);
    assert.equal(annullato.vincite[0].annullataAt, "2026-10-08T12:01:00.000Z");
    assert.throws(() => annullaGiro(annullato, "v1"), (errore: ErroreRuota) => errore.codice === "GIA_ANNULLATA");
    assert.equal(annullato.premi[0].quantita, 1);
  });

  it("prossimo giro segna la consegna e non reintegra", () => {
    const primo = gira(base(), 0, "2026-10-08T12:00:00.000Z", "v1");
    const chiuso = prossimoGiro(primo.stato, "v1", "2026-10-08T12:05:00.000Z");
    assert.equal(chiuso.bloccato, false);
    assert.equal(chiuso.premi[0].quantita, 0);
    assert.equal(chiuso.vincite[0].consegnataAt, "2026-10-08T12:05:00.000Z");
    assert.throws(() => gira(chiuso, 0), (errore: ErroreRuota) => errore.codice === "ESAURITO");
  });

  it("dopo l'annullo il pezzo può uscire di nuovo senza aspettare", () => {
    const primo = gira(base(), 0, "2026-10-08T12:00:00.000Z", "v1");
    const chiuso = prossimoGiro(annullaGiro(primo.stato, "v1"), "v1", "2026-10-08T12:02:00.000Z");
    assert.equal(chiuso.vincite[0].consegnataAt, null);
    const secondo = gira(chiuso, 0, "2026-10-08T12:03:00.000Z", "v2");
    assert.equal(secondo.vincita.premioNome, "Maglietta");
    assert.equal(secondo.stato.premi[0].quantita, 0);
  });

  it("aggiungere pezzi somma, impostare sostituisce solo se la scorta non è cambiata", () => {
    const iniziale = base();
    const aumentato = aggiungiPezzi(iniziale, "a", 3);
    assert.equal(aumentato.premi[0].quantita, 4);
    const corretto = impostaQuantita(aumentato, "a", 2, 4);
    assert.equal(corretto.premi[0].quantita, 2);
    assert.throws(
      () => impostaQuantita(corretto, "a", 9, 4),
      (errore: ErroreRuota) => errore.codice === "CONFLITTO",
    );
    assert.equal(corretto.premi[0].quantita, 2);
  });

  it("si può togliere un premio anche dopo una vincita", () => {
    const primo = gira(base(), 0, "2026-10-08T12:00:00.000Z", "v1");
    const senza = eliminaPremio(primo.stato, "a");
    assert.equal(senza.premi.length, 0);
    assert.equal(senza.vincite[0].premioNome, "Maglietta");
  });
});
