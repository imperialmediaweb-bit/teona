import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { REGULI, stiinta } from "./stiinta";

/**
 * Asistentul de pe site: răspunde vizitatorilor, în numele asociației.
 *
 * **Ce poate face.** Răspunde la întrebări despre asociație din informațiile
 * verificate din `stiinta.ts`: cum se donează, ce e Casa Teona, cum
 * redirecționează o firmă 20%, când e următoarea tabără, pe ce se duc banii.
 *
 * **Ce nu poate face, dinadins.** Nu completează formulare, nu înscrie pe
 * nimeni, nu confirmă nimic și n-are acces la baza de date: nu știe cine a
 * donat, cât s-a strâns sau cine e pe vreo listă. E un om de la recepție care
 * știe bine casa, nu un angajat cu chei la toate ușile.
 *
 * **Costul și abuzul.** E un capăt public care cheamă un API plătit, deci:
 * limită de rată pe adresă, întrebări scurte, răspunsuri scurte și o
 * conversație tăiată la câteva schimburi. Întrebarea omului e singurul lucru
 * care se schimbă de la o cerere la alta; tot ce e înaintea ei se păstrează în
 * cache-ul API-ului, deci a doua întrebare costă a zecea parte din prima.
 */

const MODEL = process.env.MODEL_ASISTENT?.trim() || "claude-opus-5-5";
const PLAFON_RASPUNS = 700;

/** Câte schimburi din conversație se trimit înapoi. */
export const SCHIMBURI = 6;

export function areAsistentPeSite(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type Mesaj = { rol: "om" | "asistent"; text: string };

let clientul: Anthropic | null = null;
function client(): Anthropic {
  clientul ??= new Anthropic();
  return clientul;
}

/**
 * Răspunsul, ca șir de bucăți.
 *
 * Se transmite pe măsură ce se scrie: la o întrebare mai grea, modelul se
 * gândește câteva secunde, iar o casetă care stă goală atâta timp pare
 * stricată. Cu bucăți, scrisul începe imediat.
 */
export async function* raspunde(
  istoric: Mesaj[],
): AsyncGenerator<string, void, unknown> {
  if (!areAsistentPeSite()) return;

  const mesaje: Anthropic.MessageParam[] = istoric
    .slice(-SCHIMBURI * 2)
    .map((m) => ({
      role: m.rol === "om" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
  if (mesaje.length === 0 || mesaje[0].role !== "user") return;

  const flux = client().messages.stream({
    model: MODEL,
    max_tokens: PLAFON_RASPUNS,
    /*
      Regulile și ce știe asociația sunt aceleași la fiecare întrebare, deci se
      păstrează în cache: se scriu o dată și se citesc la a zecea parte din
      preț. Ce se schimbă — întrebarea — vine după, în mesaje.
    */
    system: [
      {
        type: "text",
        text: `${REGULI}\n\n---\n\n${stiinta()}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: { effort: "low" },
    messages: mesaje,
  });

  for await (const bucata of flux) {
    if (
      bucata.type === "content_block_delta" &&
      bucata.delta.type === "text_delta"
    ) {
      yield bucata.delta.text;
    }
  }

  /*
    Refuzul clasificatoarelor e un răspuns cu `stop_reason: "refusal"`, nu o
    eroare: fără verificarea asta, caseta ar rămâne goală fără niciun motiv
    vizibil. Se întâmplă rar — dar un site public primește și întrebări la
    care modelul nu răspunde.
  */
  const gata = await flux.finalMessage();
  if (gata.stop_reason === "refusal") {
    yield "La asta nu pot răspunde. Dacă e ceva despre asociație, sună la 0754 510 167 sau scrie la contact@teona-ariana.ro.";
  }
}
