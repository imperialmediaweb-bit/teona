import { construieste, textSimplu, type ContinutEmail } from "./sablon";

/**
 * Campaniile de e-mail, prin MailerLite.
 *
 * Panoul compune mesajul și îl trimite aici ca **ciornă**. Nu îl expediază.
 *
 * Motivul nu e tehnic — endpointul de trimitere există și e o linie în plus.
 * Un e-mail plecat spre toată lista nu se mai poate opri, nu se mai poate
 * corecta și nu se mai poate retrage. Un om trebuie să-l vadă în MailerLite,
 * să dea o trimitere de probă către el însuși și abia apoi să apese. Pentru o
 * asociație de copii, un mesaj greșit plecat la mii de oameni costă mai mult
 * decât cele două minute economisite.
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
          content: construieste(date.continut),
          plain_text: textSimplu(date.continut),
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

/** Grupurile din cont, pentru lista de ales în panou. */
export async function grupuri(): Promise<Array<{ id: string; nume: string }>> {
  const cheie = process.env.MAILERLITE_API_KEY;
  if (!cheie) return [];

  const raspuns = await fetch(`${BAZA}/groups?limit=100`, {
    headers: { Authorization: `Bearer ${cheie}`, Accept: "application/json" },
  });
  if (!raspuns.ok) return [];

  const corp = (await raspuns.json().catch(() => ({}))) as {
    data?: Array<{ id?: string | number; name?: string }>;
  };
  return (corp.data ?? [])
    .filter((g) => g.id && g.name)
    .map((g) => ({ id: String(g.id), nume: String(g.name) }));
}
