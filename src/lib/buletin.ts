import { intreaba } from "./baza";
import { anuntaAbonarea } from "./email/buletin";
import { notificaPanoul } from "./notificari";

/** De unde a venit abonarea: caseta de newsletter, o donație, contul de donator. */
export type SursaAbonare = "formular" | "donatie" | "cont";

export const NUMELE_SURSEI: Record<SursaAbonare, string> = {
  formular: "Formularul de newsletter",
  donatie: "Bifa de la donație",
  cont: "Contul de donator",
};

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

export async function laBuletin(
  email: string,
  /**
   * În ce listă intră. „firme” pune adresa în lista de firme
   * (`MAILERLITE_GROUP_FIRME`), cea la care pleacă șablonul de campanie
   * pentru firme; o firmă se înscrie singură, din caseta de newsletter.
   */
  lista: "persoane" | "firme" = "persoane",
  nume?: string | null,
  sursa: SursaAbonare = "formular",
): Promise<boolean> {
  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return false;

  const grup =
    lista === "firme"
      ? process.env.MAILERLITE_GROUP_FIRME
      : process.env.MAILERLITE_GROUP_ID;

  // Aceeași adresă ca în `email/mailerlite.ts`, ca probele să poată pune un server de mențiune.
  const baza =
    process.env.MAILERLITE_API?.replace(/\/+$/, "") ??
    "https://connect.mailerlite.com/api";
  const raspuns = await fetch(`${baza}/subscribers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cheie}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      ...(nume ? { fields: { name: nume } } : {}),
      status: "active",
      ...(grup ? { groups: [grup] } : {}),
    }),
  });

  if (!raspuns.ok) return false;

  await intreaba(
    "UPDATE donatii SET dus_la_buletin = true WHERE email = $1 AND acord_buletin = true",
    [email],
  ).catch(() => undefined);

  await notaAbonarea(email, lista, nume ?? null, sursa).catch(() => undefined);
  return true;
}

/**
 * Rândul din `abonati_buletin` și anunțul către asociație.
 *
 * Anunțul pleacă numai la o abonare **nouă** sau la o reabonare după
 * dezabonare: același om care bifează iar la a doua donație nu e o veste.
 */
async function notaAbonarea(
  email: string,
  lista: "persoane" | "firme",
  nume: string | null,
  sursa: SursaAbonare,
): Promise<void> {
  const nou = await intreaba<{ email: string }>(
    `INSERT INTO abonati_buletin (email, nume, lista, sursa)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET dezabonat_la = NULL, creat_la = now(), sursa = EXCLUDED.sursa,
           lista = EXCLUDED.lista, nume = COALESCE(EXCLUDED.nume, abonati_buletin.nume)
       WHERE abonati_buletin.dezabonat_la IS NOT NULL
     RETURNING email`,
    [email, nume, lista, sursa],
  );
  if (!nou.length) return;
  await anuntaAbonarea({ email, nume, lista, sursa: NUMELE_SURSEI[sursa] }).catch(() => false);
  await notificaPanoul({
    titlu: "Abonat nou la buletin",
    text: `${nume?.trim().split(/\s+/)[0] || "Cineva"} s-a abonat (${NUMELE_SURSEI[sursa].toLowerCase()}).`,
    adresa: "/admin/abonati",
  }).catch(() => 0);
}

export type Abonat = {
  email: string;
  nume: string | null;
  lista: string;
  sursa: SursaAbonare;
  creatLa: string;
  dezabonatLa: string | null;
};

export async function abonati(limita = 1000): Promise<Abonat[]> {
  const r = await intreaba<{
    email: string;
    nume: string | null;
    lista: string;
    sursa: string;
    creat_la: Date;
    dezabonat_la: Date | null;
  }>("SELECT * FROM abonati_buletin ORDER BY creat_la DESC LIMIT $1", [limita]);
  return r.map((x) => ({
    email: x.email,
    nume: x.nume,
    lista: x.lista,
    sursa: (x.sursa in NUMELE_SURSEI ? x.sursa : "formular") as SursaAbonare,
    creatLa: x.creat_la.toISOString(),
    dezabonatLa: x.dezabonat_la?.toISOString() ?? null,
  }));
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
  await intreaba(
    "UPDATE abonati_buletin SET dezabonat_la = now() WHERE email = $1 AND dezabonat_la IS NULL",
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
