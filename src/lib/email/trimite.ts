import { ASOCIATIA, EMAIL } from "@/date/asociatie";

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

export async function trimiteEmail(mesaj: {
  catre: string | string[];
  subiect: string;
  html: string;
  text: string;
  /** Adresa omului, ca asociația să poată răspunde direct din inbox. */
  raspundeLa?: string;
}): Promise<boolean> {
  const cheie = process.env.RESEND_API_KEY;
  if (!cheie) return false;

  try {
    const raspuns = await fetch("https://api.resend.com/emails", {
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
      }),
    });
    return raspuns.ok;
  } catch {
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
