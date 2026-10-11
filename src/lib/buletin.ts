import { intreaba } from "./baza";

/**
 * Lista de buletin informativ, în MailerLite.
 *
 * Regula care decide tot ce e aici: **un om ajunge pe listă numai dacă a
 * bifat el acordul.** O donație nu e acord de marketing. Pe formularul de
 * donație bifa e separată de acordul de prelucrare a datelor și e nebifată
 * din start; funcția asta se cheamă doar pentru cine a bifat-o.
 *
 * Din același motiv nu există nicăieri o funcție care să urce donatorii
 * existenți: ei n-au dat un asemenea acord, deci nu pot fi adăugați
 * retroactiv.
 *
 * Fără `MAILERLITE_API_KEY`, acordul se păstrează oricum în baza de date, iar
 * oamenii se pot urca mai târziu, când cheia există. Nimic nu se pierde.
 */

export function areBuletin(): boolean {
  return Boolean(process.env.MAILERLITE_API_KEY);
}

export async function laBuletin(email: string): Promise<boolean> {
  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return false;

  const grup = process.env.MAILERLITE_GROUP_ID;

  const raspuns = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cheie}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      status: "active",
      ...(grup ? { groups: [grup] } : {}),
    }),
  });

  if (!raspuns.ok) return false;

  await intreaba(
    "UPDATE donatii SET dus_la_buletin = true WHERE email = $1 AND acord_buletin = true",
    [email],
  ).catch(() => undefined);

  return true;
}

/**
 * Scoate un om de pe listă.
 *
 * MailerLite nu are o rută „dezabonează după adresă”: trebuie întâi găsit
 * identificatorul abonatului, apoi pus pe `unsubscribed`. Nu se șterge
 * abonatul — MailerLite păstrează dezabonații tocmai ca să nu poată fi
 * reabonați din greșeală la următorul import.
 *
 * `dus_la_buletin` se pune pe `false` indiferent dacă MailerLite a răspuns:
 * dacă omul a cerut să nu mai primească, evidența noastră trebuie să arate
 * asta, iar dacă apelul a eșuat, e mai bine să încercăm din nou decât să
 * credem că e abonat când nu e.
 */
export async function daJosDinBuletin(email: string): Promise<boolean> {
  await intreaba(
    "UPDATE donatii SET acord_buletin = false, dus_la_buletin = false WHERE email = $1",
    [email],
  ).catch(() => undefined);

  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return false;

  const antete = {
    Authorization: `Bearer ${cheie}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const cautare = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`,
      { headers: antete },
    );
    if (!cautare.ok) {
      // 404 înseamnă că nici nu era pe listă. Nimic de făcut, și nu e o pană.
      return cautare.status === 404;
    }
    const corp = (await cautare.json()) as { data?: { id?: string } };
    const id = corp.data?.id;
    if (!id) return false;

    const oprire = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${id}`,
      {
        method: "PUT",
        headers: antete,
        body: JSON.stringify({ status: "unsubscribed" }),
      },
    );
    return oprire.ok;
  } catch {
    return false;
  }
}
