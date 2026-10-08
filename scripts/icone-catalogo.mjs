import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "catalogo");
mkdirSync(root, { recursive: true });

const sfondo = "#f6f1e8";
const nero = "#1c1c1c";
const oro = "#f2c14e";
const argento = "#d9dde3";

function svg(corpo) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${sfondo}"/>
  ${corpo}
</svg>
`;
}

const icone = {
  "kit-3-adesivi-daznpoint": svg(`
    <rect x="14" y="12" width="28" height="38" rx="4" fill="${nero}" transform="rotate(-8 28 31)"/>
    <rect x="22" y="14" width="28" height="38" rx="4" fill="#f04b3a"/>
    <rect x="26" y="40" width="20" height="8" rx="2" fill="${oro}"/>
  `),
  "penne-daznbet-club": svg(`
    <g transform="rotate(-28 32 32)">
      <rect x="27" y="10" width="5" height="38" rx="2" fill="${nero}"/>
      <polygon points="27,48 32,58 37,48" fill="${argento}"/>
      <rect x="27" y="10" width="5" height="6" rx="1" fill="${oro}"/>
      <rect x="34" y="14" width="5" height="36" rx="2" fill="#3a3a3a"/>
      <polygon points="34,50 39,58 44,50" fill="${argento}"/>
      <rect x="34" y="14" width="5" height="5" rx="1" fill="${oro}"/>
    </g>
  `),
  "accendini-daznbet-club": svg(`
    <rect x="24" y="18" width="16" height="34" rx="3" fill="${nero}"/>
    <rect x="24" y="16" width="16" height="8" rx="2" fill="${argento}"/>
    <rect x="30" y="12" width="4" height="6" rx="1" fill="#9aa3ad"/>
    <path d="M32 8c2 3 4 4 4 7a4 4 0 0 1-8 0c0-3 2-4 4-7z" fill="#ffb020"/>
  `),
  "portachiavi-daznbet-club": svg(`
    <circle cx="46" cy="18" r="8" fill="none" stroke="${argento}" stroke-width="3"/>
    <rect x="12" y="28" width="34" height="12" rx="4" fill="${nero}" transform="rotate(-18 29 34)"/>
    <rect x="16" y="31" width="10" height="6" rx="1" fill="${oro}" transform="rotate(-18 21 34)"/>
  `),
  "laccetti-daznbet-club": svg(`
    <path d="M18 14c8 10 8 26 0 36" fill="none" stroke="${nero}" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 14c8 10 8 26 0 36" fill="none" stroke="#333" stroke-width="5" stroke-linecap="round"/>
    <rect x="14" y="12" width="10" height="6" rx="2" fill="${oro}"/>
    <rect x="24" y="12" width="10" height="6" rx="2" fill="${oro}"/>
    <circle cx="16" cy="52" r="3" fill="${argento}"/>
  `),
  "sacche-daznbet-club": svg(`
    <path d="M16 26h32l-3 26H19z" fill="${nero}"/>
    <path d="M20 26c0-8 24-8 24 0" fill="none" stroke="${nero}" stroke-width="3"/>
    <path d="M22 22c6-8 14-8 20 0" fill="none" stroke="${argento}" stroke-width="2"/>
    <rect x="24" y="34" width="16" height="10" rx="2" fill="${oro}"/>
  `),
  "agenda-daznbet-club": svg(`
    <rect x="16" y="10" width="32" height="42" rx="3" fill="${nero}"/>
    <rect x="16" y="10" width="6" height="42" fill="#333"/>
    <rect x="26" y="18" width="16" height="8" rx="1" fill="${oro}"/>
    <rect x="26" y="30" width="16" height="2" fill="#444"/>
    <rect x="26" y="36" width="12" height="2" fill="#444"/>
  `),
  "cartellina-daznbet-club": svg(`
    <rect x="16" y="12" width="32" height="40" rx="3" fill="#2a2a2a"/>
    <rect x="20" y="18" width="24" height="30" rx="2" fill="${nero}"/>
    <path d="M24 12h16v6H24z" fill="${argento}"/>
    <rect x="24" y="28" width="16" height="10" rx="1" fill="${oro}"/>
  `),
  "borraccia-daznbet-club": svg(`
    <rect x="24" y="16" width="16" height="36" rx="6" fill="${nero}"/>
    <rect x="26" y="10" width="12" height="8" rx="2" fill="${argento}"/>
    <rect x="28" y="6" width="8" height="5" rx="2" fill="#9aa3ad"/>
    <rect x="27" y="30" width="10" height="8" rx="2" fill="${oro}"/>
  `),
  "ombrello-daznbet-club": svg(`
    <path d="M10 34c6-16 38-16 44 0H10z" fill="${nero}"/>
    <path d="M32 34v16" stroke="${argento}" stroke-width="3"/>
    <path d="M32 50c6 0 8 4 4 4" fill="none" stroke="${argento}" stroke-width="3" stroke-linecap="round"/>
    <rect x="28" y="24" width="8" height="4" rx="1" fill="${oro}"/>
  `),
  "powerbank-daznbet-club": svg(`
    <rect x="14" y="20" width="36" height="24" rx="6" fill="${nero}"/>
    <rect x="18" y="28" width="8" height="8" rx="2" fill="${oro}"/>
    <path d="M34 26l-4 7h5l-4 7 8-9h-5l4-5z" fill="#fff6df"/>
  `),
  "t-shirt-daznbet-club": svg(`
    <path d="M16 18l8-4h16l8 4-6 8-2-3v25H24V23l-2 3z" fill="${nero}"/>
    <rect x="26" y="30" width="12" height="8" rx="1" fill="${oro}"/>
  `),
  "felpa-daznbet-club": svg(`
    <path d="M14 22l8-6h20l8 6-4 8h-6v22H24V30h-6z" fill="${nero}"/>
    <path d="M26 16c2 6 10 6 12 0" fill="none" stroke="#3a3a3a" stroke-width="3"/>
    <rect x="27" y="34" width="10" height="8" rx="1" fill="${oro}"/>
  `),
  "felpa-daznbet-club-zip": svg(`
    <path d="M14 22l8-6h20l8 6-4 8h-6v22H24V30h-6z" fill="#2c2c2c"/>
    <path d="M32 20v30" stroke="${argento}" stroke-width="2"/>
    <rect x="30" y="28" width="4" height="4" rx="1" fill="${oro}"/>
    <rect x="30" y="36" width="4" height="4" rx="1" fill="${oro}"/>
  `),
  "zaino-daznbet-club": svg(`
    <rect x="18" y="16" width="28" height="36" rx="8" fill="${nero}"/>
    <rect x="24" y="10" width="16" height="10" rx="4" fill="#333"/>
    <rect x="22" y="28" width="20" height="12" rx="3" fill="#2a2a2a" stroke="${oro}" stroke-width="2"/>
  `),
  "rollup-daznbet-club": svg(`
    <rect x="20" y="8" width="24" height="40" rx="2" fill="${nero}"/>
    <rect x="24" y="16" width="16" height="10" rx="1" fill="${oro}"/>
    <rect x="16" y="48" width="32" height="6" rx="2" fill="${argento}"/>
  `),
  "user-e-pass-daznbet": svg(`
    <rect x="20" y="14" width="24" height="36" rx="3" fill="#f7f7f7" stroke="${nero}" stroke-width="2"/>
    <circle cx="32" cy="26" r="5" fill="${nero}"/>
    <rect x="26" y="34" width="12" height="3" rx="1" fill="${oro}"/>
    <rect x="26" y="40" width="12" height="2" fill="#ccc"/>
  `),
  "totem-da-banco-daznbet": svg(`
    <rect x="26" y="36" width="12" height="16" fill="${argento}"/>
    <rect x="18" y="48" width="28" height="6" rx="2" fill="${nero}"/>
    <rect x="22" y="8" width="20" height="30" rx="2" fill="${nero}"/>
    <rect x="26" y="16" width="12" height="10" rx="1" fill="${oro}"/>
  `),
  "rendiresto-daznbet": svg(`
    <rect x="8" y="28" width="48" height="16" rx="3" fill="${nero}"/>
    <rect x="12" y="32" width="10" height="8" rx="1" fill="${oro}"/>
    <rect x="26" y="32" width="10" height="8" rx="1" fill="${argento}"/>
    <rect x="40" y="32" width="10" height="8" rx="1" fill="#f04b3a"/>
    <rect x="14" y="18" width="36" height="8" rx="2" fill="#333"/>
  `),
  "mousepad-daznbet": svg(`
    <rect x="8" y="18" width="48" height="30" rx="6" fill="${nero}"/>
    <ellipse cx="40" cy="32" rx="8" ry="10" fill="${argento}"/>
    <rect x="16" y="26" width="12" height="8" rx="1" fill="${oro}"/>
  `),
  "poster-daznbet-gioco-responsabile": svg(`
    <rect x="16" y="8" width="32" height="44" rx="2" fill="#f7f7f7" stroke="${nero}" stroke-width="2"/>
    <rect x="22" y="16" width="20" height="12" fill="${oro}"/>
    <rect x="22" y="32" width="20" height="3" fill="${nero}"/>
    <rect x="22" y="38" width="14" height="3" fill="#bbb"/>
  `),
  "spilletta-daznbet": svg(`
    <circle cx="32" cy="32" r="16" fill="${nero}" stroke="${oro}" stroke-width="4"/>
    <circle cx="32" cy="32" r="6" fill="${oro}"/>
    <rect x="30" y="46" width="4" height="8" rx="1" fill="${argento}"/>
  `),
  "berretto-daznbet": svg(`
    <path d="M14 36c2-14 34-14 36 0H14z" fill="${nero}"/>
    <path d="M12 36h28c6 0 12 3 14 6H12z" fill="${oro}"/>
    <rect x="28" y="16" width="8" height="8" rx="2" fill="#333"/>
  `),
  "t-shirt-daznbet": svg(`
    <path d="M16 18l8-4h16l8 4-6 8-2-3v25H24V23l-2 3z" fill="#f7f7f7" stroke="${nero}" stroke-width="2"/>
    <rect x="26" y="30" width="12" height="8" rx="1" fill="${nero}"/>
  `),
};

for (const [nome, contenuto] of Object.entries(icone)) {
  writeFileSync(join(root, `${nome}.svg`), contenuto);
}

console.log(Object.keys(icone).length);
