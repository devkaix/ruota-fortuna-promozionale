function ticchetta(ctx: AudioContext, uscita: AudioNode, quando: number, forza: number) {
  const durata = 0.022 + forza * 0.018;
  const campioni = Math.max(1, Math.floor(ctx.sampleRate * durata));
  const buffer = ctx.createBuffer(1, campioni, ctx.sampleRate);
  const dati = buffer.getChannelData(0);
  for (let i = 0; i < campioni; i += 1) {
    const inviluppo = Math.exp(-i / (campioni * 0.16));
    dati[i] = (Math.random() * 2 - 1) * inviluppo;
  }

  const sorgente = ctx.createBufferSource();
  sorgente.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = 1600 + forza * 1800;
  filtro.Q.value = 7;
  const gain = ctx.createGain();
  gain.gain.value = 0.18 + forza * 0.28;
  sorgente.connect(filtro);
  filtro.connect(gain);
  gain.connect(uscita);
  sorgente.start(quando);

  const ping = ctx.createOscillator();
  ping.type = "triangle";
  ping.frequency.setValueAtTime(720 + forza * 900, quando);
  ping.frequency.exponentialRampToValueAtTime(280, quando + 0.04);
  const pingGain = ctx.createGain();
  pingGain.gain.setValueAtTime(0.0001, quando);
  pingGain.gain.exponentialRampToValueAtTime(0.05 + forza * 0.05, quando + 0.004);
  pingGain.gain.exponentialRampToValueAtTime(0.0001, quando + 0.05);
  ping.connect(pingGain);
  pingGain.connect(uscita);
  ping.start(quando);
  ping.stop(quando + 0.055);
}

function ronzio(ctx: AudioContext, uscita: AudioNode, inizio: number, durata: number) {
  const campioni = Math.max(1, Math.floor(ctx.sampleRate * durata));
  const buffer = ctx.createBuffer(1, campioni, ctx.sampleRate);
  const dati = buffer.getChannelData(0);
  let precedente = 0;
  for (let i = 0; i < campioni; i += 1) {
    const bianco = Math.random() * 2 - 1;
    precedente = precedente * 0.96 + bianco * 0.04;
    dati[i] = precedente * 3.2;
  }

  const sorgente = ctx.createBufferSource();
  sorgente.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 0.8;
  filtro.frequency.setValueAtTime(520, inizio);
  filtro.frequency.exponentialRampToValueAtTime(90, inizio + durata);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, inizio);
  gain.gain.exponentialRampToValueAtTime(0.22, inizio + 0.25);
  gain.gain.setValueAtTime(0.16, inizio + durata * 0.62);
  gain.gain.exponentialRampToValueAtTime(0.0001, inizio + durata * 0.9);
  sorgente.connect(filtro);
  filtro.connect(gain);
  gain.connect(uscita);
  sorgente.start(inizio);
  sorgente.stop(inizio + durata);
}

/** Pallina che rallenta sul bordo, poi i rimbalzi nel piattino. */
export function avviaSuonoRoulette(durataSecondi: number): () => void {
  const Costruttore =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Costruttore) return () => undefined;

  const ctx = new Costruttore();
  void ctx.resume();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  const inizio = ctx.currentTime + 0.03;
  ronzio(ctx, master, inizio, durataSecondi);

  let trascorso = 0;
  while (trascorso < durataSecondi * 0.9) {
    const progresso = trascorso / durataSecondi;
    ticchetta(ctx, master, inizio + trascorso, 1 - progresso * 0.35);
    trascorso += 0.034 + progresso ** 1.75 * 0.28;
  }

  for (const punto of [0.925, 0.952, 0.971, 0.984, 0.994]) {
    ticchetta(ctx, master, inizio + durataSecondi * punto, punto > 0.98 ? 1 : 0.7);
  }

  let chiuso = false;
  return () => {
    if (chiuso) return;
    chiuso = true;
    const ora = ctx.currentTime;
    master.gain.cancelScheduledValues(ora);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ora);
    master.gain.exponentialRampToValueAtTime(0.0001, ora + 0.06);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 90);
  };
}
