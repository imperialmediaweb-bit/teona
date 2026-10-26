import { limitaDeRata, raspuns, text as curataText, trimiteLa } from "@/lib/api";
import { email as emailValid } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { pozaPentruEmail } from "@/lib/cloudinary-listare";
import { creeazaCiorna } from "@/lib/email/mailerlite";
import { areEmail, trimiteEmail } from "@/lib/email/trimite";
import {
  POZA_MAXIM,
  areCloudinary,
  numeDupaContinut,
  pareImagine,
  urcaPoza,
} from "@/lib/poza-urcata";
import {
  esteFelSablon,
  sablonCampanie,
  textSimpluCampanie,
  type ContinutCampanie,
  type FelSablon,
} from "@/lib/email/campanie-sabloane";
import { ADRESA_SITE } from "@/app/seo";

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

/**
 * Urcă fotografia aleasă din formular și întoarce identificatorul ei.
 *
 * `null` înseamnă „n-a ales niciun fișier"; un șir de eroare înseamnă că a
 * ales unul și n-a mers, iar omul trebuie să afle de ce — altfel ar trimite
 * campania crezând că are poză în ea.
 *
 * Numele e luat din octeții pozei, deci cele patru butoane ale formularului
 * („vezi", „descarcă", „probă", „ciornă") urcă de fiecare dată peste aceeași
 * fotografie, nu fac patru copii în depozit.
 */
async function pozaDinFormular(
  formular: FormData,
): Promise<{ id: string } | { eroare: string } | null> {
  const fisier = formular.get("poza_fisier");
  if (!(fisier instanceof File) || fisier.size === 0) return null;
  /*
    Întâi fișierul, apoi configurarea.

    Invers, cineva care alege din greșeală un PDF pe un site fără chei de
    Cloudinary ar primi „urcarea nu e configurată" și ar suna degeaba
    dezvoltatorul, când de fapt greșise fișierul.
  */
  if (fisier.size > POZA_MAXIM) return { eroare: "poza-mare" };

  const octeti = new Uint8Array(await fisier.arrayBuffer());
  if (!pareImagine(fisier.type, octeti)) return { eroare: "poza-tip" };
  if (!areCloudinary()) return { eroare: "fara-cloudinary" };

  const urcata = await urcaPoza(
    octeti,
    fisier.type,
    "campanii-email",
    numeDupaContinut(octeti, "campanie"),
  ).catch(() => null);
  return urcata ? { id: urcata.id } : { eroare: "poza-urcare" };
}

function citeste(
  formular: FormData,
  /** Identificatorul fotografiei urcate acum; bate câmpul scris de mână. */
  pozaUrcata?: string,
): {
  fel: FelSablon;
  continut: ContinutCampanie;
  eroare?: string;
} {
  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  const fel = camp("fel");
  const titlu = curataText(camp("titlu"), 160) ?? "";
  const corp = camp("text");
  const pozaId = pozaUrcata ?? camp("poza");
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
  return trimiteLa(unde);
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
  if (!(await arePermisiune("/admin/sabloane"))) return raspuns("Nu ai acces.", 403);
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
  if (!(await arePermisiune("/admin/sabloane"))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const felCerut = String(formular.get("fel") ?? "");
  const felSigur = esteFelSablon(felCerut) ? felCerut : "persoane";

  const poza = await pozaDinFormular(formular);
  if (poza && "eroare" in poza)
    return inapoi(cerere, { ratat: poza.eroare, fel: felSigur });

  const { fel, continut, eroare } = citeste(
    formular,
    poza ? poza.id : undefined,
  );
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
      // Adresa site-ului, nu a cererii: pe Railway cererea vine de la
      // `localhost:8080`, iar un link de dezabonare către localhost într-un
      // e-mail trimis la sute de oameni e mai rău decât niciunul.
      dezabonare: `${ADRESA_SITE}/politica-de-confidentialitate`,
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
