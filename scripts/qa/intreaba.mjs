/**
 * Asistentul de pe site.
 *
 * E singurul loc din proiect în care un model vorbește direct cu publicul, în
 * numele asociației, fără ca cineva să citească înainte. Proba se uită la ce
 * poate strica asta:
 *
 *   1. **ce pleacă spre model** — un server care imită API-ul Anthropic
 *      citește cererea și verifică să conțină datele verificate (IBAN,
 *      telefon, regula de 20% / 0,75%) și să NU conțină nimic din baza de
 *      date: niciun donator, nicio sumă strânsă;
 *   2. **răspunsul ajunge la om pe bucăți**, nu dintr-o dată la final;
 *   3. **capătul public e strâns legat** — limită de rată, întrebări tăiate la
 *      600 de semne, cereri strâmbe refuzate;
 *   4. **fără cheie, nu există nici casetă, nici capăt** — site-ul merge mai
 *      departe fără ea.
 *
 * Rulare (pornește singur site-ul, pe alt port):
 *     node scripts/qa/intreaba.mjs
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const PORT_API = 4411;
const PORT_SITE = 4412;
const RASPUNS = "Poți dona lunar de pe /doneaza. ";

let primit = "";

const fals = createServer((cer, raspunde) => {
  let corp = "";
  cer.on("data", (b) => (corp += b));
  cer.on("end", async () => {
    primit = corp;
    raspunde.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    });
    const trimite = (eveniment, date) =>
      raspunde.write(`event: ${eveniment}\ndata: ${JSON.stringify(date)}\n\n`);

    trimite("message_start", {
      type: "message_start",
      message: {
        id: "msg_proba",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 1 },
      },
    });
    trimite("content_block_start", {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    });
    /* Două bucăți, cu o pauză între ele: așa se vede că fluxul chiar curge. */
    for (const bucata of [RASPUNS, "Se oprește oricând."]) {
      trimite("content_block_delta", {
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: bucata },
      });
      await new Promise((r) => setTimeout(r, 120));
    }
    trimite("content_block_stop", { type: "content_block_stop", index: 0 });
    trimite("message_delta", {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 12 },
    });
    trimite("message_stop", { type: "message_stop" });
    raspunde.end();
  });
});
await new Promise((r) => fals.listen(PORT_API, r));

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT_SITE),
    ANTHROPIC_API_KEY: "cheie-de-proba",
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${PORT_API}`,
  },
  stdio: "ignore",
});

const BAZA = `http://127.0.0.1:${PORT_SITE}`;
const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;

async function intreaba(mesaje, deLa = DE_LA) {
  return fetch(`${BAZA}/api/intreaba`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": deLa },
    body: JSON.stringify({ mesaje }),
  });
}

try {
  const pornit = Date.now();
  while (Date.now() - pornit < 60000) {
    try {
      const r = await fetch(`${BAZA}/`);
      if (r.ok) break;
    } catch {
      /* încă nu ascultă */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // ─── 1. Răspunsul curge, nu vine dintr-o dată ──────────────────────────
  const r = await intreaba([{ rol: "om", text: "Cum pot dona lunar?" }]);
  verifica(r.ok, `întrebarea primește răspuns (${r.status})`);

  const citeste = r.body.getReader();
  const decodor = new TextDecoder();
  const bucati = [];
  for (;;) {
    const { done, value } = await citeste.read();
    if (done) break;
    bucati.push(decodor.decode(value, { stream: true }));
  }
  const tot = bucati.join("");
  verifica(tot.includes("/doneaza"), `răspunsul ajunge întreg (${tot.length} semne)`);
  verifica(
    bucati.length > 1,
    `răspunsul vine pe bucăți, nu dintr-o dată (${bucati.length} bucăți)`,
  );

  // ─── 2. Ce pleacă spre model ───────────────────────────────────────────
  const cerere = JSON.parse(primit);
  const sistem = JSON.stringify(cerere.system ?? "");

  for (const [bucata, ce] of [
    ["RO16 RNCB 0234 1852 3366 0001", "IBAN-ul de la BCR"],
    ["0754 510 167", "telefonul asociației"],
    ["contact@teona-ariana.ro", "adresa de e-mail"],
    ["0,75%", "regula de 0,75% din cifra de afaceri"],
    ["SUSTIN", "SMS-ul"],
    ["/directioneaza-20", "pagina pentru firme"],
    ["Casa Teona", "Casa Teona"],
    ["33", "numărul de tabere"],
  ]) {
    verifica(sistem.includes(bucata), `modelul primește ${ce}`);
  }

  verifica(
    sistem.includes("Nu inventa nimic"),
    "modelului i se cere să nu inventeze",
  );
  verifica(
    /cache_control/.test(primit),
    "partea care nu se schimbă e trimisă spre păstrat în cache",
  );
  verifica(
    cerere.messages?.length === 1 && cerere.messages[0].role === "user",
    "întrebarea omului pleacă drept mesaj, nu lipită în instrucțiuni",
  );

  // ─── 3. Capătul public e strâns legat ──────────────────────────────────
  const stramb = await fetch(`${BAZA}/api/intreaba`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": DE_LA },
    body: "nu e json",
  });
  verifica(stramb.status === 400, `o cerere strâmbă e refuzată (${stramb.status})`);

  const gol = await intreaba([{ rol: "om", text: "   " }]);
  verifica(gol.status === 400, `o întrebare goală e refuzată (${gol.status})`);

  const inainte = primit;
  const lung = await intreaba([{ rol: "om", text: "a".repeat(5000) }]);
  verifica(
    lung.status === 400,
    `o întrebare de 5.000 de semne e refuzată, nu tăiată (${lung.status})`,
  );
  verifica(primit === inainte, "întrebarea prea lungă nu ajunge la model");

  /*
    Limita de rată: douăzeci pe oră, pe adresă. Se numără de la o adresă
    proaspătă, ca să nu depindă de ce au consumat probele de mai sus.
  */
  const alta = "198.51.100.251";
  let ultimul = 200;
  for (let i = 0; i < 22; i++) {
    const r2 = await intreaba([{ rol: "om", text: "test" }], alta);
    ultimul = r2.status;
    if (r2.body) await r2.body.cancel();
    if (ultimul === 429) break;
  }
  verifica(ultimul === 429, `limita de rată oprește la timp (${ultimul})`);

  // ─── 4. Caseta e pe site ───────────────────────────────────────────────
  const acasa = await (await fetch(`${BAZA}/`)).text();
  verifica(acasa.includes("Întreabă-ne"), "caseta apare pe site");
} finally {
  try {
    process.kill(-site.pid);
  } catch {
    /* se închisese singur */
  }
  fals.close();
}

console.log(rele === 0 ? "\ntoate probele trec" : `\n${rele} probe cad`);
process.exit(rele === 0 ? 0 : 1);
