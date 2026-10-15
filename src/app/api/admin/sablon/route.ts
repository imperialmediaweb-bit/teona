import { NextResponse } from "next/server";
import { limitaDeRata, raspuns, text as curataText } from "@/lib/api";
import { email as emailValid } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { pozaPentruEmail } from "@/lib/cloudinary-listare";
import { creeazaCiorna } from "@/lib/email/mailerlite";
import { areEmail, trimiteEmail } from "@/lib/email/trimite";
import {
  esteFelSablon,
  sablonCampanie,
  textSimpluCampanie,
  type ContinutCampanie,
  type FelSablon,
} from "@/lib/email/campanie-sabloane";

/**
 * Șablonul de campanie: de văzut, de descărcat, de probat, de dus în MailerLite.
 *
 * Patru lucruri, o singură rută, fiindcă toate pornesc din același formular și
 * din aceleași câmpuri. Butonul apăsat vine în `fac`.
 *
 * **Trimiterea către listă nu e aici și nu va fi.** Ruta face cel mult o
 * ciornă în MailerLite. Un e-mail plecat spre mii de oameni nu se mai poate
 * opri, nu se mai poate corecta și nu se mai poate retrage; un om trebuie
 * să-l vadă în MailerLite, să-și trimită o probă și abia apoi să apese. Cele
 * două minute economisite nu merită.
 */

/** Textul care umple șablonul când nimeni n-a scris încă nimic. */
const EXEMPLU: ContinutCampanie = {
  titlu: "Titlul campaniei — îl scrii tu",
  paragrafe: [
    "Aici intră textul tău. Un rând gol desparte paragrafele.",
    "Spune limpede pentru ce se strâng banii și ce se schimbă pentru copii dacă se strâng. Restul — butoanele, conturile, datele de contact, subsolul legal — sunt deja în șablon și nu trebuie scrise de fiecare dată.",
  ],
  poza: null,
};

function citeste(formular: FormData): {
  fel: FelSablon;
  continut: ContinutCampanie;
  eroare?: string;
} {
  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  const fel = camp("fel");
  const titlu = curataText(camp("titlu"), 160) ?? "";
  const corp = camp("text");
  const pozaId = camp("poza");
  const pozaAlt = curataText(camp("poza_alt"), 200) ?? "";
  const campanie = camp("campanie");

  const continut: ContinutCampanie = {
    titlu: titlu || EXEMPLU.titlu,
    paragrafe: corp
      ? corp
          .replace(/\r\n/g, "\n")
          .split(/\n{2,}/)
          .map((p) => p.replace(/\n/g, " ").trim())
          .filter(Boolean)
      : EXEMPLU.paragrafe,
    poza: pozaId ? { adresa: pozaPentruEmail(pozaId), alt: pozaAlt } : null,
    campanie: /^[a-z0-9-]{1,120}$/.test(campanie) ? campanie : null,
  };

  if (!esteFelSablon(fel)) return { fel: "persoane", continut, eroare: "fel" };
  /*
    Poza fără descriere nu intră.

    Aceeași regulă ca la scrisul pe site. Un e-mail ajunge și la oameni care
    folosesc cititor de ecran, și la cei cărora clientul de e-mail nu încarcă
    imaginile — pentru amândoi, textul alternativ e singura urmă a pozei.
  */
  if (pozaId && pozaAlt.length < 3) return { fel, continut, eroare: "poza" };
  return { fel, continut };
}

function inapoi(cerere: Request, parametri: Record<string, string>) {
  const unde = new URL("/admin/sabloane", cerere.url);
  for (const [cheie, valoare] of Object.entries(parametri)) {
    unde.searchParams.set(cheie, valoare);
  }
  return NextResponse.redirect(unde, { status: 303 });
}

function paginaHtml(html: string) {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/** Previzualizarea din panou, pentru cadrul care arată șablonul gol. */
export async function GET(cerere: Request) {
  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);
  const fel = new URL(cerere.url).searchParams.get("fel");
  return paginaHtml(
    sablonCampanie(esteFelSablon(fel) ? fel : "persoane", EXEMPLU),
  );
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-sablon",
    maxim: 40,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;
  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const { fel, continut, eroare } = citeste(formular);
  if (eroare) return inapoi(cerere, { ratat: eroare, fel });

  const fac = String(formular.get("fac") ?? "vezi");
  const html = sablonCampanie(fel, continut);

  if (fac === "vezi") return paginaHtml(html);

  if (fac === "descarca") {
    const nume = `Sablon-campanie-${fel}.html`;
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="${nume}"`,
        "cache-control": "no-store",
      },
    });
  }

  if (fac === "proba") {
    const catre = String(formular.get("catre") ?? "").trim();
    if (!emailValid(catre)) return inapoi(cerere, { ratat: "adresa", fel });
    if (!areEmail()) return inapoi(cerere, { ratat: "fara-resend", fel });
    /*
      Proba pleacă cu dezabonarea înlocuită.

      `{$unsubscribe}` e o variabilă pe care o completează MailerLite. Trimisă
      prin Resend, ar ajunge în inbox ca text, iar linkul ar duce nicăieri —
      și cine primește proba ar crede că așa pleacă și către listă.
    */
    const deProba: ContinutCampanie = {
      ...continut,
      dezabonare: `${new URL(cerere.url).origin}/politica-de-confidentialitate`,
    };
    const trimis = await trimiteEmail({
      catre,
      subiect: `[probă] ${continut.titlu}`,
      html: sablonCampanie(fel, deProba),
      text: textSimpluCampanie(fel, deProba),
      raspundeLa: EMAIL.contact,
    });
    return inapoi(cerere, { facut: trimis ? "proba" : "proba-nu", fel });
  }

  if (fac === "ciorna") {
    const grupuri = formular
      .getAll("grup")
      .map((g) => String(g))
      .filter(Boolean);
    const subiect =
      curataText(String(formular.get("subiect") ?? "").trim(), 160) ||
      continut.titlu;

    const raspunsul = await creeazaCiorna({
      nume: `${continut.titlu} (${fel === "firme" ? "firme" : "persoane"})`,
      subiect,
      expeditor: EMAIL.contact,
      numeExpeditor: ASOCIATIA.denumire,
      grupuri,
      continut: {
        titlu: continut.titlu,
        paragrafe: continut.paragrafe,
        poza: continut.poza,
      },
      html,
      textSimplu: textSimpluCampanie(fel, continut),
    });

    return raspunsul.ok
      ? inapoi(cerere, { facut: "ciorna", fel })
      : inapoi(cerere, { ratat: "mailerlite", mesaj: raspunsul.mesaj, fel });
  }

  return raspuns("Nu știu ce să fac.", 400);
}
