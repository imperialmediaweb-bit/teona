import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { adresaDeProba, esteProba } from "@/lib/proba";
import { mediu } from "@/lib/mediu";

/**
 * Trimiterea e-mailurilor, prin Resend.
 *
 * Două feluri de mesaje pleacă de pe site, și sunt lucruri diferite:
 *
 * - **tranzacționale** — o cerere de contact care ajunge la asociație, o
 *   confirmare către om. Astea trec pe aici.
 * - **buletinul informativ** — merge prin MailerLite, cu acordul bifat
 *   separat. Nu se amestecă: o chitanță nu are voie să depindă de o listă de
 *   marketing, iar un abonat nu trebuie să primească o confirmare de contact.
 *
 * Fără `RESEND_API_KEY`, funcția spune că n-a trimis, iar rutele răspund
 * cinstit că trimiterea nu e activă — în loc să afișeze „am primit mesajul"
 * pentru un mesaj care n-a plecat nicăieri.
 */

export function areEmail(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Expeditorul.
 *
 * Trebuie să fie pe un domeniu verificat în Resend, altfel cererea e
 * refuzată. Se poate schimba din mediu fără atins codul.
 */
function expeditor(): string {
  return (
    process.env.EMAIL_EXPEDITOR || `${ASOCIATIA.denumire} <${EMAIL.contact}>`
  );
}

/*
  Site-ul nu face campanii. Campaniile către liste pleacă din MailerLite, de
  pe serverele lor; de aici pleacă numai mesaje către un om anume (mulțumiri,
  confirmări, anunțuri) și câteva trimiteri mici către mai mulți, făcute de un
  om din panou. Asociația a fost oprită odată de Railway pentru e-mailuri în
  masă, așa că trimiterile „în masă” au o limită pe oră, oricine ar apăsa și
  de oricâte ori. Mesajele către un om anume nu intră sub limită: o mulțumire
  pentru o donație nu se oprește niciodată.
*/
export const LIMITA_MASA = 150;
const trimiseInMasa: number[] = [];
function locInMasa(): boolean {
  const acum = Date.now();
  while (trimiseInMasa.length && acum - trimiseInMasa[0] > 60 * 60 * 1000) trimiseInMasa.shift();
  if (trimiseInMasa.length >= LIMITA_MASA) return false;
  trimiseInMasa.push(acum);
  return true;
}

export async function trimiteEmail(mesaj: {
  catre: string | string[];
  subiect: string;
  html: string;
  text: string;
  /** Adresa omului, ca asociația să poată răspunde direct din inbox. */
  raspundeLa?: string;
  /**
   * Fișiere atașate.
   *
   * Pentru contractul semnat online: firma trebuie să primească pe loc, în
   * inbox, exact documentul pe care l-a semnat. Un link către site n-ar fi
   * același lucru — linkul se poate schimba, atașamentul rămâne în e-mailul
   * ei și e dovada că l-a primit atunci.
   */
  atasamente?: Array<{ nume: string; continut: Uint8Array }>;
  /**
   * Face parte dintr-o trimitere către mai mulți oameni deodată (presă,
   * apel către voluntari, proba unui șablon). Vezi `LIMITA_MASA`.
   */
  masa?: boolean;
}): Promise<boolean> {
  if (mesaj.masa && !locInMasa()) {
    console.error(`[email] limita de ${LIMITA_MASA} pe oră atinsă; n-a plecat „${mesaj.subiect}”`);
    return false;
  }
  // O probă automată nu scrie nimănui adevărat: totul merge la adresa de probă.
  if (await esteProba()) {
    const proba = adresaDeProba();
    if (!proba) {
      console.warn(`[email] probă fără PROBA_EMAIL; n-a plecat „${mesaj.subiect}”`);
      return true;
    }
    mesaj = { ...mesaj, catre: proba, subiect: /^\[prob[ăa]\]/i.test(mesaj.subiect) ? mesaj.subiect.replace(/^\[prob[ăa]\]/i, "[PROBĂ]") : `[PROBĂ] ${mesaj.subiect}` };
  }
  const cheie = mediu("RESEND_API_KEY");
  if (!cheie) {
    console.error(`[email] RESEND_API_KEY lipsește; n-a plecat „${mesaj.subiect}”`);
    return false;
  }

  /*
    `EMAIL_API` mută trimiterea pe un server de probă.

    Aceeași convenție ca `ANTHROPIC_API`, `CLOUDINARY_API`, `GA_API`,
    `META_API`: fără ea, singurul fel de a verifica un e-mail de la un capăt
    la altul ar fi să-l trimiți cuiva adevărat. Nu e o ușă: fără
    `RESEND_API_KEY` nu pleacă nimic nicăieri, iar în Railway variabila asta
    nu există.
  */
  const adresa =
    process.env.EMAIL_API?.replace(/\/+$/, "") ?? "https://api.resend.com";

  try {
    const raspuns = await fetch(`${adresa}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cheie}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: expeditor(),
        to: Array.isArray(mesaj.catre) ? mesaj.catre : [mesaj.catre],
        subject: mesaj.subiect,
        html: mesaj.html,
        text: mesaj.text,
        ...(mesaj.raspundeLa ? { reply_to: mesaj.raspundeLa } : {}),
        ...(mesaj.atasamente?.length
          ? {
              attachments: mesaj.atasamente.map((a) => ({
                filename: a.nume,
                content: Buffer.from(a.continut).toString("base64"),
              })),
            }
          : {}),
      }),
    });
    /*
      Un refuz de la Resend (domeniu neverificat, adresă invalidă, limită)
      vine ca 4xx cu motivul în corp. Fără rândul ăsta, un e-mail care nu
      pleacă nu lasă nicio urmă: omul spune „n-am primit nimic”, iar
      jurnalul e curat. Se scrie subiectul și motivul, nu adresa omului.
    */
    if (!raspuns.ok) {
      const motiv = (await raspuns.text().catch(() => "")).slice(0, 300);
      console.error(`[email] Resend ${raspuns.status} la „${mesaj.subiect}”: ${motiv}`);
    }
    return raspuns.ok;
  } catch (e) {
    console.error(`[email] rețea la „${mesaj.subiect}”: ${(e as Error).message}`);
    // Rețeaua a căzut sau Resend nu răspunde. Ruta va spune omului că n-a
    // mers și îi va da telefonul — nu „am primit mesajul tău".
    return false;
  }
}

/** Scapă textul scris de om: un e-mail HTML nu trebuie să poarte marcaj străin. */
export function curat(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Un tabel simplu cu perechile completate în formular. */
export function tabel(randuri: Array<[string, string]>): {
  html: string;
  text: string;
} {
  const utile = randuri.filter(([, v]) => v && v.trim() !== "");
  return {
    html: utile
      .map(
        ([eticheta, valoare]) =>
          `<tr><td style="padding:6px 16px 6px 0;font-family:Arial,sans-serif;font-size:14px;color:#616161;vertical-align:top;white-space:nowrap;">${curat(eticheta)}</td><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:15px;color:#232323;">${curat(valoare).replace(/\n/g, "<br>")}</td></tr>`,
      )
      .join(""),
    text: utile.map(([e, v]) => `${e}: ${v}`).join("\n"),
  };
}
