import { ASOCIATIA, CIFRE, EMAIL, RUTE, TELEFOANE } from "@/date/asociatie";

/**
 * Asistentul din panoul de admin: scrie o ciornă de e-mail, nu o trimite.
 *
 * **Regula care contează.** E site-ul unei asociații de copii cu dizabilități.
 * O cifră inventată — „am dus 200 de copii în tabără”, când au fost 40 — îi
 * costă credibilitatea, și n-o mai recâștigă cu o erată. De aceea asistentul
 * primește în instrucțiuni exact cifrele verificate, și i se cere să lase
 * `[…]` acolo unde ar avea nevoie de una pe care n-o are. Un gol se vede și se
 * completează; o cifră plauzibilă și greșită nu se vede deloc.
 *
 * Nu scrie niciodată singur în inbox-ul cuiva: rezultatul intră în câmpurile
 * formularului, omul îl citește, îl schimbă, și abia apoi face ciorna în
 * MailerLite — pe care tot el o trimite, după o probă pe propria adresă.
 */

const MODEL = "claude-sonnet-5-5";
const PLAFON_RASPUNS = 2000;

export function areAsistent(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Felurile de text pe care le poate scrie, cu ce se așteaptă de la fiecare. */
export const FELURI = {
  buletin: {
    eticheta: "Buletin informativ",
    descriere:
      "Un e-mail către oamenii abonați: ce s-a întâmplat, ce urmează, cum pot ajuta.",
    indicatie:
      "Ton cald și concret, 200–350 de cuvinte. Începe cu ce s-a întâmplat, nu cu o formulă. O singură chemare la acțiune, la final.",
  },
  campanie: {
    eticheta: "Campanie de strângere de fonduri",
    descriere: "Un apel pentru un scop anume: o tabără, o nevoie, un caz.",
    indicatie:
      "Spune limpede pentru ce se strâng banii și ce se schimbă pentru copii dacă se strâng. 200–300 de cuvinte. Fără urgență fabricată și fără milogeală.",
  },
  multumire: {
    eticheta: "Mulțumire după un eveniment",
    descriere: "Pentru donatori, voluntari sau sponsori, după ce s-a terminat.",
    indicatie:
      "Mulțumește concret: ce s-a întâmplat datorită lor. 150–250 de cuvinte. Fără cerere de bani la final.",
  },
  anunt: {
    eticheta: "Anunț scurt",
    descriere: "O știre, o invitație, o schimbare de program.",
    indicatie: "Scurt, 80–150 de cuvinte. Ce, când, unde, pentru cine.",
  },
} as const;

export type Fel = keyof typeof FELURI;

export function esteFel(x: unknown): x is Fel {
  return typeof x === "string" && x in FELURI;
}

function instructiuni(fel: Fel): string {
  const cifre = CIFRE.map(
    (c) => `- ${c.valoare}${c.sufix} ${c.eticheta}`,
  ).join("\n");

  return `Scrii pentru ${ASOCIATIA.denumire}, o asociație din Suceava care aduce bucurie copiilor cu nevoi speciale, copiilor care au trecut prin cancer și familiilor lor. Organizează tabere RESPIRO și ține deschisă Casa Teona, un loc cu jocuri, ateliere și consiliere pentru părinți.

Scrii în română, cu diacritice corecte (ă, â, î, ș, ț). Textul e citit de părinți, donatori și voluntari — oameni obișnuiți, nu specialiști.

REGULA CEA MAI IMPORTANTĂ: nu inventa nicio cifră, nicio dată calendaristică, niciun nume de persoană și niciun loc. Ai mai jos singurele cifre verificate. Dacă textul ar avea nevoie de altceva — câți copii au fost într-o anume tabără, cât costă o zi, când e următorul eveniment — scrie un gol între paranteze drepte, de exemplu [câți copii] sau [data], și mergi mai departe. Un gol se vede și se completează. O cifră inventată care sună bine nu se vede, și costă asociația exact lucrul pe care îl are de vândut: încrederea.

Cifre verificate, singurele pe care le poți folosi:
${cifre}

Date de contact, dacă textul le cere:
- telefon ${TELEFOANE[0].afisat} sau ${TELEFOANE[1].afisat}
- ${EMAIL.contact}
- donații: ${RUTE.doneaza} · redirecționare 3,5%: ${RUTE.redirectionare35} · firme: ${RUTE.directionare20}

Cum scrii:
- la obiect, fără limbă de lemn, fără „suntem încântați să vă anunțăm”;
- concret, nu emoționant cu orice preț. Nu scrie despre copii ca despre niște sărmani; sunt copii;
- fără superlative și fără semne de exclamare în lanț;
- nu promite ce nu ți s-a spus că se întâmplă.

${FELURI[fel].indicatie}

Răspunzi NUMAI cu un obiect JSON, fără text în jur și fără blocuri de cod:
{"titlu": "...", "text": "..."}

"titlu" e titlul din corpul mesajului, sub 90 de caractere, fără punct la final. "text" e corpul, cu un rând gol între paragrafe, text simplu, fără HTML și fără Markdown. Butoanele de donație și subsolul cu datele asociației se adaugă automat după — nu le scrie tu.`;
}

/** Extrage obiectul JSON chiar dacă modelul l-a împachetat în ```json. */
function citesteJson(brut: string): { titlu: string; text: string } | null {
  const fara = brut.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = fara.indexOf("{");
  const stop = fara.lastIndexOf("}");
  if (start === -1 || stop <= start) return null;
  try {
    const obiect = JSON.parse(fara.slice(start, stop + 1)) as unknown;
    if (!obiect || typeof obiect !== "object") return null;
    const { titlu, text } = obiect as Record<string, unknown>;
    if (typeof titlu !== "string" || typeof text !== "string") return null;
    if (!titlu.trim() || !text.trim()) return null;
    return { titlu: titlu.trim(), text: text.trim() };
  } catch {
    return null;
  }
}

export async function scrieCiorna(cerere: {
  fel: Fel;
  despre: string;
}): Promise<{ titlu: string; text: string } | null> {
  const cheie = process.env.ANTHROPIC_API_KEY;
  if (!cheie) return null;

  try {
    const raspuns = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cheie,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: PLAFON_RASPUNS,
        system: instructiuni(cerere.fel),
        messages: [{ role: "user", content: cerere.despre }],
      }),
    });

    if (!raspuns.ok) return null;

    const corp = (await raspuns.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (corp.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("");

    return text ? citesteJson(text) : null;
  } catch {
    // Rețeaua a căzut sau API-ul nu răspunde. Panoul spune că n-a mers;
    // omul scrie singur, ca până acum.
    return null;
  }
}
