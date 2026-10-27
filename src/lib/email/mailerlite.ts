import { construieste, textSimplu, type ContinutEmail } from "./sablon";

/**
 * Campaniile de e-mail, prin MailerLite.
 *
 * Panoul compune mesajul și îl duce aici: ca **ciornă**, sau, din octombrie
 * 2026, **trimis** de-a dreptul, cerut de asociație („să nu mai intru prin
 * MailerLite"). Trimiterea pleacă tot de pe serverele MailerLite — livrarea,
 * dezabonarea și statisticile rămân ale lor —, panoul doar apasă butonul.
 *
 * Un e-mail plecat spre toată lista nu se mai poate opri, nu se mai poate
 * corecta și nu se mai poate retrage. De aceea trimiterea cere o listă aleasă
 * (fără ea, MailerLite n-ar ști cui) și o bifă de confirmare care scrie
 * câți oameni o primesc — numărul citit chiar atunci din MailerLite.
 *
 * Două lucruri de știut despre MailerLite, aflate pe pielea noastră:
 *
 * 1. Adresa expeditorului trebuie să fie **deja verificată** în contul lor.
 *    Una neverificată face cererea să pice, nu să trimită de la altcineva.
 * 2. Trimiterea propriului HTML (câmpul `content`) e, după documentația lor,
 *    legată de planul Advanced. Sursele se contrazic, iar planurile se
 *    schimbă. Dacă răspunsul vine cu o eroare despre plan, campania se
 *    creează oricum, goală, și se umple din editorul lor.
 */

const BAZA = "https://connect.mailerlite.com/api";

export function areCampanii(): boolean {
  return Boolean(process.env.MAILERLITE_API_KEY);
}

type Raspuns = { ok: true; id: string } | { ok: false; mesaj: string };

export async function creeazaCiorna(date: {
  nume: string;
  subiect: string;
  expeditor: string;
  numeExpeditor: string;
  grupuri: string[];
  continut: ContinutEmail;
  /**
   * HTML gata făcut, dacă vine din altă parte.
   *
   * Șabloanele de campanie (`campanie-sabloane.ts`) își construiesc singure
   * mesajul, cu butoanele lor: unul pentru persoane, altul pentru firme.
   * Când sunt date, `continut` rămâne doar ce se vede în numele ciornei.
   */
  html?: string;
  textSimplu?: string;
}): Promise<Raspuns> {
  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return { ok: false, mesaj: "Cheia MailerLite lipsește." };

  const raspuns = await fetch(`${BAZA}/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cheie}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: date.nume.slice(0, 255),
      type: "regular",
      ...(date.grupuri.length ? { groups: date.grupuri } : {}),
      emails: [
        {
          subject: date.subiect.slice(0, 255),
          from_name: date.numeExpeditor.slice(0, 255),
          from: date.expeditor,
          content: date.html ?? construieste(date.continut),
          plain_text: date.textSimplu ?? textSimplu(date.continut),
        },
      ],
    }),
  });

  const corp = (await raspuns.json().catch(() => ({}))) as {
    data?: { id?: string | number };
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (!raspuns.ok) {
    // Erorile de validare vin pe câmpuri; le arătăm pe prima, întreagă —
    // „a eșuat" nu ajută pe nimeni să repare nimic.
    const prima = corp.errors ? Object.entries(corp.errors)[0] : undefined;
    const detaliu = prima ? `${prima[0]}: ${prima[1][0]}` : corp.message;
    return {
      ok: false,
      mesaj: detaliu ?? `MailerLite a răspuns ${raspuns.status}.`,
    };
  }

  const id = corp.data?.id;
  if (!id)
    return { ok: false, mesaj: "MailerLite n-a întors identificatorul." };
  return { ok: true, id: String(id) };
}

/**
 * Pornește trimiterea unei campanii deja create, acum.
 *
 * MailerLite o pune în coadă și o expediază de pe serverele lor. Răspunsul
 * bun înseamnă „a intrat în coadă", nu „a ajuns la toți": asta se vede în
 * MailerLite, la statistici.
 */
export async function trimiteCampania(id: string): Promise<Raspuns> {
  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return { ok: false, mesaj: "Cheia MailerLite lipsește." };
  const raspuns = await fetch(
    `${BAZA}/campaigns/${encodeURIComponent(id)}/schedule`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cheie}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ delivery: "instant" }),
    },
  );
  if (raspuns.ok) return { ok: true, id };
  const corp = (await raspuns.json().catch(() => ({}))) as {
    message?: string;
    errors?: Record<string, string[]>;
  };
  const prima = corp.errors ? Object.entries(corp.errors)[0] : undefined;
  return {
    ok: false,
    mesaj:
      (prima ? `${prima[0]}: ${prima[1][0]}` : corp.message) ??
      `MailerLite a răspuns ${raspuns.status}.`,
  };
}

/**
 * Grupurile din cont, pentru lista de ales în panou, cu câți abonați activi
 * are fiecare — numărul pe care îl scrie confirmarea de trimitere.
 */
export async function grupuri(): Promise<
  Array<{ id: string; nume: string; activi: number }>
> {
  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return [];

  const raspuns = await fetch(`${BAZA}/groups?limit=100`, {
    headers: { Authorization: `Bearer ${cheie}`, Accept: "application/json" },
  });
  if (!raspuns.ok) return [];

  const corp = (await raspuns.json().catch(() => ({}))) as {
    data?: Array<{ id?: string | number; name?: string; active_count?: number }>;
  };
  return (corp.data ?? [])
    .filter((g) => g.id && g.name)
    .map((g) => ({
      id: String(g.id),
      nume: String(g.name),
      activi: Number(g.active_count ?? 0),
    }));
}
