import Anthropic from "@anthropic-ai/sdk";
import { intreaba } from "./baza";
import { ASOCIATIA } from "@/date/asociatie";

/**
 * Radarul de finanțări: caută singur pe internet, o dată pe săptămână.
 *
 * **De ce există.** Patru termene mari au trecut pe lângă asociație în 2026 —
 * Fondul SEE, subvenția pe Legea 34/1998, apelul AFCN–Orange, apelul POIDS.
 * Toate fuseseră anunțate public, cu luni înainte. N-au fost ratate din lipsă
 * de informație, ci pentru că nimeni n-avea în sarcină să se uite. Un om care
 * face și comunicarea și evidența nu deschide șase site-uri în fiecare luni.
 *
 * **Ce face, și numai atât.** Caută, citește, scrie într-un tabel. **Nu
 * trimite nimic, nu depune nimic, nu anunță pe nimeni.** Un om deschide
 * `/admin/radar`, se uită, și hotărăște. Aceeași regulă ca la publicare:
 * nimic nu pleacă singur.
 *
 * **Cum se apără de inventat** — partea care contează cel mai mult, fiindcă un
 * termen greșit e mai rău decât unul lipsă: după el se face muncă.
 *
 * - **adresa trebuie să fi apărut într-un rezultat de căutare adevărat.** Se
 *   adună toate adresele din blocurile `web_search_result` ale conversației,
 *   iar o oportunitate a cărei adresă nu e între ele **se aruncă**. Dacă
 *   modelul scrie un link verosimil pe care nu l-a văzut, nu intră în tabel;
 * - **termenul se păstrează ca text**, nu ca dată. Modelul citește „8
 *   octombrie 2026" sau „nu scrie" de pe o pagină; un câmp de tip dată l-ar
 *   obliga să ghicească, iar ghicitul ar arăta în panou exact ca o certitudine.
 *   Ce a citit se scrie cum l-a citit, cu linkul lângă;
 * - **fiecare rând e o pistă, nu o certitudine.** Pagina scrie asta pe ea.
 *
 * **Cheia e adresa.** Aceeași oportunitate găsită săptămâna viitoare nu intră a
 * doua oară, și nici nu învie un rând respins deja de un om — `ON CONFLICT DO
 * NOTHING`. Altfel lista ar fi, după o lună, aceleași zece rânduri respinse
 * care se întorc în fiecare luni.
 */

/** Modelul. Trebuie unul care are unealta de căutare pe server. */
const MODEL = process.env.MODEL_RADAR?.trim() || "claude-opus-5-5";

/**
 * Câte căutări are voie o scanare.
 *
 * Fiecare căutare se plătește, iar asta rulează de la sine, fără ca cineva să
 * apese un buton — adică exact felul de cheltuială care crește neobservată. Cu
 * o limită scrisă aici, o scanare costă cât costă și nu mai mult, oricât s-ar
 * ambiția modelul să caute.
 */
const CAUTARI = Number(process.env.RADAR_CAUTARI) || 12;

/**
 * De câte ori se reia o conversație oprită la jumătate.
 *
 * Cu unelte pe server, API-ul rulează o buclă proprie și se oprește după zece
 * pași cu `stop_reason: "pause_turn"`. Reluarea se face trimițând înapoi
 * întrebarea și răspunsul de până atunci — **fără** un mesaj „continuă": API-ul
 * vede blocul de unealtă neterminat și știe singur. Limita e aici ca o buclă
 * stricată să nu cheltuiască o după-amiază.
 */
const RELUARI = 4;

const PLAFON = 8000;

export function areRadar(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type Pista = {
  id: string;
  url: string;
  titlu: string;
  finantator: string | null;
  termen: string | null;
  suma: string | null;
  rezumat: string;
  stare: "nou" | "urmarit" | "respins";
  gasitLa: Date;
};

export type Scanare = {
  cand: Date;
  gasite: number;
  noi: number;
  eroare: string | null;
};

const CE_CAUTAM = `Cauți finanțări nerambursabile pentru care ar fi eligibilă ${ASOCIATIA.denumire} — o asociație mică din Suceava care organizează tabere pentru copii cu dizabilități și copii care au trecut prin cancer, și ține deschis un centru de zi, Casa Teona.

Caută apeluri și programe care:
- sunt deschise acum sau se deschid în lunile următoare (nu cele cu termenul trecut);
- sunt pentru ONG-uri din România, pe social, dizabilitate, copii, sănătate sau educație;
- vin de la finanțatori publici (fonduri europene, programe guvernamentale, consiliul județean sau primăria din Suceava) sau privați (fundații corporatiste, programe de CSR, fundații comunitare).

REGULI, și sunt mai importante decât numărul de rezultate:

1. **Scrie numai ce ai găsit pe o pagină pe care ai deschis-o în căutare.** Nicio oportunitate din memorie, niciun link construit de tine. Dacă nu ai o adresă dintr-un rezultat de căutare, nu o raportezi.
2. **Termenul se scrie exact cum e pe pagină** („8 octombrie 2026", „31 ianuarie", „apel continuu"). Dacă pagina nu scrie un termen, scrie „null”. Nu deduce, nu aproxima, nu scrie „probabil".
3. **Sumele la fel**: cum sunt pe pagină, cu moneda lor, sau „null”.
4. **Sari peste ce e închis.** Un apel cu termenul trecut nu e o pistă, e zgomot.
5. **Mai bine trei piste bune decât cincisprezece nesigure.** Omul care citește lista are o oră pe săptămână.

La final, și numai la final, scrie un bloc de cod marcat \`json\` cu un tablou. Fiecare element:

{"url": "adresa exactă a paginii", "titlu": "numele apelului", "finantator": "cine dă banii", "termen": "cum scrie pe pagină, sau null", "suma": "cât, sau null", "rezumat": "două propoziții: ce finanțează și de ce ni s-ar potrivi"}

Dacă n-ai găsit nimic nou și sigur, scrie un tablou gol. Un tablou gol e un răspuns bun.`;

type Gasita = {
  url: string;
  titlu: string;
  finantator: string | null;
  termen: string | null;
  suma: string | null;
  rezumat: string;
};

/**
 * Adresele pe care căutarea le-a întors cu adevărat.
 *
 * Capcana e scrisă în documentația uneltei și nu se vede la citit: o căutare
 * care eșuează **nu aruncă** nicio excepție. Vine cu HTTP 200 și un bloc al
 * cărui `content` e un *obiect* cu `error_code`, în loc de *lista* de
 * rezultate. Fără verificarea `Array.isArray`, codul ar citi proprietăți de pe
 * obiectul de eroare, ar găsi `undefined` și ar continua liniștit cu zero
 * adrese văzute — iar atunci filtrul de mai jos ar arunca toate pistele, și
 * scanarea ar raporta „n-am găsit nimic" în loc de „căutarea a picat".
 */
function adreseDinRaspuns(
  blocuri: readonly Anthropic.ContentBlock[],
  unde: Set<string>,
  erori: string[],
): void {
  for (const bloc of blocuri) {
    if (bloc.type !== "web_search_tool_result") continue;
    const continut = bloc.content;
    if (!Array.isArray(continut)) {
      erori.push(String((continut as { error_code?: string })?.error_code ?? "eroare de căutare"));
      continue;
    }
    for (const rezultat of continut) {
      if (rezultat.type === "web_search_result" && rezultat.url) {
        unde.add(rezultat.url);
      }
    }
  }
}

/** Textul răspunsului, lipit din blocurile de text. */
function textul(blocuri: readonly Anthropic.ContentBlock[]): string {
  return blocuri
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/**
 * Scoate tabloul din blocul marcat `json`.
 *
 * Se ia **ultimul** bloc din text: modelul poate arăta un exemplu pe drum, iar
 * ce contează e ce a scris la sfârșit. Orice rând fără adresă, titlu sau
 * rezumat se aruncă aici, înainte de verificarea adreselor.
 */
function citestePiste(text: string): Gasita[] {
  const blocuri = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  const ultim = blocuri.at(-1)?.[1];
  if (!ultim) return [];

  let brut: unknown;
  try {
    brut = JSON.parse(ultim);
  } catch {
    return [];
  }
  if (!Array.isArray(brut)) return [];

  const curat = (x: unknown): string | null => {
    const s = typeof x === "string" ? x.trim() : "";
    // „null" scris ca text, și „necunoscut", sunt tot lipsă de informație.
    if (!s || /^(null|necunoscut|nespecificat|n\/a)$/i.test(s)) return null;
    return s.slice(0, 400);
  };

  const piste: Gasita[] = [];
  for (const rand of brut) {
    if (typeof rand !== "object" || rand === null) continue;
    const r = rand as Record<string, unknown>;
    const url = curat(r.url);
    const titlu = curat(r.titlu);
    const rezumat = curat(r.rezumat);
    if (!url || !titlu || !rezumat) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    piste.push({
      url,
      titlu,
      finantator: curat(r.finantator),
      termen: curat(r.termen),
      suma: curat(r.suma),
      rezumat,
    });
  }
  return piste;
}

const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS radar (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url         text UNIQUE NOT NULL,
    titlu       text NOT NULL,
    finantator  text,
    termen      text,
    suma        text,
    rezumat     text NOT NULL,
    stare       text NOT NULL DEFAULT 'nou',
    gasit_la    timestamptz NOT NULL DEFAULT now(),
    hotarat_la  timestamptz
  );
  CREATE INDEX IF NOT EXISTS radar_dupa_stare ON radar (stare, gasit_la DESC);

  CREATE TABLE IF NOT EXISTS radar_scanari (
    id      bigserial PRIMARY KEY,
    cand    timestamptz NOT NULL DEFAULT now(),
    gasite  integer NOT NULL DEFAULT 0,
    noi     integer NOT NULL DEFAULT 0,
    eroare  text
  );
  CREATE INDEX IF NOT EXISTS radar_scanari_dupa_data ON radar_scanari (cand DESC);
`;

let gata: Promise<void> | null = null;

async function pregateste(): Promise<void> {
  gata ??= intreaba(DEFINITIE)
    .then(() => undefined)
    .catch((eroare) => {
      gata = null;
      throw eroare;
    });
  return gata;
}

export async function piste(stare?: Pista["stare"]): Promise<Pista[]> {
  await pregateste();
  const randuri = await intreaba<{
    id: string;
    url: string;
    titlu: string;
    finantator: string | null;
    termen: string | null;
    suma: string | null;
    rezumat: string;
    stare: string;
    gasit_la: Date;
  }>(
    `SELECT id, url, titlu, finantator, termen, suma, rezumat, stare, gasit_la
       FROM radar
      WHERE $1::text IS NULL OR stare = $1
      ORDER BY gasit_la DESC, titlu
      LIMIT 200`,
    [stare ?? null],
  );
  return randuri.map((r) => ({
    ...r,
    stare: (["nou", "urmarit", "respins"] as const).includes(
      r.stare as Pista["stare"],
    )
      ? (r.stare as Pista["stare"])
      : "nou",
    gasitLa: r.gasit_la,
  }));
}

/** Ultimele scanări, ca să se vadă dacă radarul chiar merge. */
export async function scanari(cate = 5): Promise<Scanare[]> {
  await pregateste();
  const randuri = await intreaba<{
    cand: Date;
    gasite: number;
    noi: number;
    eroare: string | null;
  }>(
    "SELECT cand, gasite, noi, eroare FROM radar_scanari ORDER BY cand DESC LIMIT $1",
    [cate],
  );
  return randuri;
}

/**
 * Câte zile au trecut de la ultima scanare, sau `null` dacă n-a fost niciuna.
 *
 * Se socotește aici, nu în pagină: într-un component server `Date.now()` e o
 * funcție impură — randarea se poate relua, iar două citiri ale ceasului în
 * aceeași pagină ar da două valori. Aici e o funcție obișnuită, chemată o dată.
 */
export async function zileDeLaUltimaScanare(): Promise<number | null> {
  const [ultima] = await scanari(1);
  if (!ultima) return null;
  return Math.floor((Date.now() - ultima.cand.getTime()) / 86_400_000);
}

export async function hotaraste(
  id: string,
  stare: "urmarit" | "respins",
): Promise<boolean> {
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE radar SET stare = $2, hotarat_la = now() WHERE id = $1 RETURNING id`,
    [id, stare],
  );
  return randuri.length > 0;
}

export type Rezultat = {
  gasite: number;
  noi: number;
  aruncate: number;
  eroare: string | null;
};

/**
 * O scanare. Caută, filtrează, scrie.
 *
 * Întoarce și câte piste a aruncat pentru că adresa lor nu era într-un rezultat
 * de căutare: cifra aia se vede în panou, fiindcă dacă începe să crească e
 * semn că modelul inventează linkuri și că întrebarea trebuie strânsă.
 */
export async function scaneaza(): Promise<Rezultat> {
  await pregateste();

  const cheie = process.env.ANTHROPIC_API_KEY;
  if (!cheie) {
    const r = { gasite: 0, noi: 0, aruncate: 0, eroare: "Lipsește ANTHROPIC_API_KEY." };
    await scrieScanarea(r);
    return r;
  }

  const client = new Anthropic({
    apiKey: cheie,
    ...(process.env.ANTHROPIC_API
      ? { baseURL: process.env.ANTHROPIC_API.replace(/\/+$/, "") }
      : {}),
  });

  const vazute = new Set<string>();
  const eroriCautare: string[] = [];
  let text = "";

  try {
    const mesaje: Anthropic.MessageParam[] = [
      { role: "user", content: CE_CAUTAM },
    ];

    for (let pas = 0; pas <= RELUARI; pas++) {
      const raspuns = await client.messages.create({
        model: MODEL,
        max_tokens: PLAFON,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: CAUTARI },
        ],
        messages: mesaje,
      });

      adreseDinRaspuns(raspuns.content, vazute, eroriCautare);
      text += `\n${textul(raspuns.content)}`;

      if (raspuns.stop_reason !== "pause_turn") break;

      /*
        Reluarea: întrebarea și răspunsul de până acum, nimic altceva.
        Un mesaj „continuă" pus aici ar încurca API-ul, care se descurcă
        singur după blocul de unealtă neterminat.
      */
      mesaje.length = 1;
      mesaje.push({ role: "assistant", content: raspuns.content });
    }
  } catch (e) {
    const r = {
      gasite: 0,
      noi: 0,
      aruncate: 0,
      eroare: e instanceof Error ? e.message.slice(0, 300) : "eroare necunoscută",
    };
    await scrieScanarea(r);
    return r;
  }

  const toate = citestePiste(text);
  // Filtrul care face diferența: adresa trebuie să fi fost văzută cu ochii.
  const bune = toate.filter((p) => vazute.has(p.url));
  const aruncate = toate.length - bune.length;

  let noi = 0;
  for (const p of bune) {
    const randuri = await intreaba<{ id: string }>(
      `INSERT INTO radar (url, titlu, finantator, termen, suma, rezumat)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (url) DO NOTHING
       RETURNING id`,
      [p.url, p.titlu, p.finantator, p.termen, p.suma, p.rezumat],
    ).catch(() => []);
    if (randuri.length > 0) noi += 1;
  }

  /*
    O căutare picată se scrie ca eroare chiar dacă s-au găsit piste: altfel o
    scanare care a reușit pe jumătate ar arăta în panou la fel ca una întreagă,
    iar nimeni n-ar afla că jumătate din internet n-a fost citit.
  */
  const r: Rezultat = {
    gasite: bune.length,
    noi,
    aruncate,
    eroare: eroriCautare.length
      ? `căutări picate: ${[...new Set(eroriCautare)].join(", ")}`
      : null,
  };
  await scrieScanarea(r);
  return r;
}

async function scrieScanarea(r: Rezultat): Promise<void> {
  await intreaba(
    "INSERT INTO radar_scanari (gasite, noi, eroare) VALUES ($1, $2, $3)",
    [r.gasite, r.noi, r.eroare],
  ).catch(() => undefined);
}
