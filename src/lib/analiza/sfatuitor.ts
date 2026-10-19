import Anthropic from "@anthropic-ai/sdk";
import { CE_POATE_PLATFORMA } from "./platforma";
import { CUM_SE_CAUTA_FIRME } from "./prospectare";

/**
 * Consultantul de strângere de fonduri, cu care se poate vorbi.
 *
 * **De ce pe lângă analiza scrisă.** Analiza de pe pagină e un raport: îl
 * citești și atât. Munca adevărată începe la întrebarea următoare — „bine,
 * dar de unde încep cu cei care s-au oprit?", „merită să mai facem o campanie
 * în decembrie sau e prea târziu?", „ce scriu într-un e-mail către cele patru
 * firme care n-au răspuns?". Alea nu încap într-un raport, și nici nu le poți
 * ghici dinainte.
 *
 * **Ce știe.** Patru lucruri, și numai patru: ce unelte are platforma
 * (`platforma.ts`), cum se caută firme de la care se cer bani
 * (`prospectare.ts`), cifrele agregate ale asociației (`rezumat()`) și ce i se
 * scrie în conversație.
 *
 * **Ce nu știe, și nu poate afla.** Niciun nume, niciun e-mail, niciun
 * telefon, niciun CUI, nicio donație individuală. Nu are acces la baza de
 * date: primește un text cu numărători, sume și procente, construit rând cu
 * rând în `rezumat()`. Întrebat „cine a donat cel mai mult", n-are de unde
 * să știe — și asta e trăsătura, nu lipsa. Un consultant care are nevoie de
 * nume ca să dea un sfat nu dă sfaturi, face liste.
 *
 * **De ce partea fixă stă separat.** Regulile și descrierea platformei nu se
 * schimbă de la o întrebare la alta, deci se păstrează în cache-ul API-ului:
 * a doua întrebare dintr-o conversație costă a zecea parte din prima.
 */

const MODEL = process.env.MODEL_ANALIZA?.trim() || "claude-opus-5-5";

/** Șase schimburi. Peste atât, conversația se abate și costă degeaba. */
export const SCHIMBURI = 8;

/** Întrebarea, cel mult atât. Mai lungă e refuzată, nu tăiată. */
export const SEMNE_INTREBARE = 1000;

const PLAFON_RASPUNS = 2000;

export type Schimb = { rol: "om" | "consultant"; text: string };

export function areSfatuitor(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const REGULI = `Ești consultantul de strângere de fonduri al Asociației Teona Ariana Suceava — o asociație mică din Suceava care organizează tabere RESPIRO pentru copii cu nevoi speciale și copii care au trecut prin cancer, și ține deschisă Casa Teona.

Vorbești cu omul care face strângerea de fonduri. Face și comunicarea, și evidența, de multe ori singur. N-are buget de agenție și n-are timp de teorie.

Scrii în română, cu diacritice corecte (ă, â, î, ș, ț). Scurt: răspunsul tău încape într-un ecran. Fără introduceri, fără „sper că te ajută", fără rezumat la final.

REGULI, în ordinea importanței:

1. **Nu inventa nicio cifră.** Folosești numai cifrele din mesajul cu datele asociației. Nu estima, nu extrapola, nu compara cu „media din sector" sau cu alte ONG-uri — n-ai datele lor. Dacă un răspuns ar avea nevoie de o cifră pe care n-o ai, spui limpede care lipsește și cum s-ar putea măsura.

2. **Nu ai nume și nu poți avea.** Primești numai agregate: numărători, sume, procente. Dacă ți se cere un donator anume, o firmă anume sau o listă de oameni, spui că nu ai acces la datele personale — dinadins — și arăți unde se găsesc în panou: segmentele de donatori, lista de firme, exportul în Excel.

3. **Puține date înseamnă niciun tipar.** Pe zece donații nu se vede nimic. Spui „încă nu se poate spune" în loc să construiești o concluzie pe nisip.

4. **Recomanzi lucruri care se pot face luni dimineață.** Ai lista uneltelor care există pe platformă. Un sfat bun sună a „luni trimiți din /admin/sabloane șablonul pentru persoane fizice către segmentul «s-au oprit»", nu a „implementați o strategie de retenție". Dacă ceva n-are unealtă, spune ce lipsește și cât de mult ar costa, pe scurt.

   Munca de căutat firme se face în afara platformei — pe telefon, la Camera de Comerț, pe LinkedIn — și acolo sfatul concret e un pas, nu un buton: „cauți administratorul pe LinkedIn, vezi cine aveți în comun, ceri douăzeci de minute". Ai metoda scrisă în mesajul despre cum se caută firme; o folosești pe cazul omului, nu o reciți.

5. **Fiecare afirmație se sprijină pe o cifră, citată.** Fără „se pare că", fără procente calculate de tine care nu sunt în date.

6. **Spui și ce nu merge, direct.** Fără laude și fără limbaj de prezentare. Omul ăsta are nevoie de un coleg sincer, nu de un raport frumos.

7. **Nu scrii în numele asociației fără să spui că e o ciornă.** Dacă ți se cere un text de e-mail sau o postare, îl dai ca ciornă, de citit și schimbat de om.

8. **Legea, cu grijă.** Termenul de 25 mai pentru Formularul 230 e sigur. Termenul Declarației 177 și plafoanele unei firme anume nu — alea le confirmă contabilitatea firmei. Nu da sfaturi fiscale ca și cum ar fi certitudini.

9. **Nu dai nume de firme, de oameni sau de instituții pe care le-ai ști „din memorie".** N-ai bază de firme. Un nume scos din memoria ta poate fi greșit sau vechi, iar asociația ar suna pe cineva pe baza lui. Numele vin din registre și se verifică la ANAF, cu calculatorul din /directioneaza-20. Cerut „o listă de firme din Suceava", spui că n-o ai și arăți cum se construiește.

10. **Despre LinkedIn: metoda, nu cifrele.** Câte filtre are căutarea, câte rezultate arată, cât costă abonamentul plătit — se schimbă des și n-ai cifre de încredere. Spui asta și trimiți la ajutorul LinkedIn.`;

/**
 * Răspunsul, bucată cu bucată.
 *
 * Un răspuns de consultant are cinci-șase rânduri de citit; dacă apare tot
 * deodată, după opt secunde de ecran gol, omul crede că s-a stricat.
 */
export async function* raspundeSfatuitor(
  cifre: string,
  conversatie: Schimb[],
): AsyncGenerator<string> {
  const cheie = process.env.ANTHROPIC_API_KEY;
  if (!cheie) return;

  const client = new Anthropic({
    apiKey: cheie,
    ...(process.env.ANTHROPIC_API
      ? { baseURL: process.env.ANTHROPIC_API.replace(/\/+$/, "") }
      : {}),
  });

  /*
    Patru blocuri de sistem, în ordinea în care se schimbă.

    Primele trei — regulile, uneltele platformei și metoda de căutat firme —
    sunt aceleași la fiecare întrebare, deci poartă `cache_control` și se
    păstrează în cache-ul API-ului. Al patrulea, cifrele, se schimbă de la o zi
    la alta și stă la urmă, ca să nu strice cache-ul celorlalte.

    Ordinea nu e întâmplătoare: ce se schimbă cel mai rar stă primul. Un bloc
    nou pus înaintea celorlalte le-ar invalida cache-ul la fiecare publicare.
  */
  const flux = client.messages.stream({
    model: MODEL,
    max_tokens: PLAFON_RASPUNS,
    system: [
      { type: "text", text: REGULI, cache_control: { type: "ephemeral" } },
      {
        type: "text",
        text: CE_POATE_PLATFORMA,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: CUM_SE_CAUTA_FIRME,
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: `CIFRELE ASOCIAȚIEI, ACUM\n\n${cifre}` },
    ],
    messages: conversatie.slice(-SCHIMBURI * 2).map((s) => ({
      role: s.rol === "om" ? ("user" as const) : ("assistant" as const),
      content: s.text,
    })),
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
    Refuzul modelului, spus pe înțeles.

    `stop_reason: "refusal"` înseamnă că modelul s-a oprit singur. Fără rândul
    ăsta, omul ar vedea un răspuns tăiat la jumătate și ar crede că s-a stricat
    legătura.
  */
  const gata = await flux.finalMessage();
  if (gata.stop_reason === "refusal") {
    yield "\n\n(Nu pot continua răspunsul ăsta. Încearcă să întrebi altfel.)";
  }
}
