import { formularAdmin, limitaDeRata, nuTrece, raspuns, sesiuneExpirata, text as curataText, trimiteLa } from "@/lib/api";
import { esteProba } from "@/lib/proba";
import { email as emailValid } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { ASOCIATIA, EMAIL } from "@/date/asociatie";
import { pozaPentruEmail } from "@/lib/cloudinary-listare";
import { creeazaCiorna, trimiteCampania } from "@/lib/email/mailerlite";
import { areEmail, trimiteEmail } from "@/lib/email/trimite";
import {
  POZA_MAXIM,
  areCloudinary,
  numeDupaContinut,
  tipDinOcteti,
  urcaPoza,
} from "@/lib/poza-urcata";
import {
  esteFelSablon,
  sablonCampanie,
  textSimpluCampanie,
  BLOCURI,
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
  // Întâi tipul (din primii octeți), apoi mărimea: un HEIC de 8 MB primea
  // „prea mare, micșoreaz-o” — n-avea cum, formatul era problema.
  const cap = new Uint8Array(await fisier.slice(0, 16).arrayBuffer());
  const tip = tipDinOcteti(cap);
  if (!tip) return { eroare: "poza-tip" };
  if (fisier.size > POZA_MAXIM) return { eroare: "poza-mare" };

  const octeti = new Uint8Array(await fisier.arrayBuffer());
  if (!areCloudinary()) return { eroare: "fara-cloudinary" };

  const urcata = await urcaPoza(
    octeti,
    tip,
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
          .split(/(?:\r?\n){2,}/)
          .map((p) => p.replace(/\n/g, " ").trim())
          .filter(Boolean)
      : EXEMPLU.paragrafe,
    // Fără descriere scrisă, poza poartă titlul campaniei: cine nu vede
    // imaginea (cititor de ecran, poze blocate în Outlook) află măcar despre
    // ce e. Înainte lipsa ei oprea trimiterea; fundraiserul a sărit-o și
    // n-a înțeles de ce nu merge.
    poza: pozaId
      ? { adresa: pozaPentruEmail(pozaId), alt: pozaAlt || titlu || EXEMPLU.titlu }
      : null,
    campanie: /^[a-z0-9-]{1,120}$/.test(campanie) ? campanie : null,
  };

  if (!esteFelSablon(fel)) return { fel: "persoane", continut, eroare: "fel" };
  // Bifele „Ce apare în e-mail”. Fără ele în formular (o cerere veche),
  // apar toate; cu ele, numai cele bifate și cunoscute.
  if (formular.get("blocuri_trimise") === "da") {
    const stiute = new Set(BLOCURI[fel].map((b) => b.id));
    continut.blocuri = formular
      .getAll(`bloc_${fel}`)
      .map(String)
      .filter((id) => stiute.has(id));
  }
  return { fel, continut };
}

function inapoi(cerere: Request, parametri: Record<string, string>) {
  const unde = new URL("/admin/sabloane", cerere.url);
  for (const [cheie, valoare] of Object.entries(parametri)) {
    unde.searchParams.set(cheie, valoare);
  }
  return trimiteLa(unde);
}

/*
  `no-transform`: Cloudflare ascunde adresele de e-mail din orice HTML care
  trece prin el (le face „[email protected]” și lipește un script). Pe
  șablonul de campanie asta strica previzualizarea și fișierul descărcat
  pentru MailerLite. Cu `no-transform`, Cloudflare nu atinge răspunsul.
*/
function paginaHtml(html: string) {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-transform",
    },
  });
}

/** Previzualizarea din panou, pentru cadrul care arată șablonul gol. */
export async function GET(cerere: Request) {
  if (!(await arePermisiune("/admin/sabloane")))
    return sesiuneExpirata();
  const fel = new URL(cerere.url).searchParams.get("fel");
  return paginaHtml(
    sablonCampanie(esteFelSablon(fel) ? fel : "persoane", EXEMPLU),
  );
}

export async function POST(cerere: Request) {
  /*
    Previzualizarea de lângă formular cere un desen la fiecare pauză de
    scris, deci are limita ei, mai largă: cu limita de 40 a trimiterilor,
    un text scris în zece minute ar fi blocat butoanele adevărate.
  */
  const previzualizare =
    new URL(cerere.url).searchParams.get("previzualizare") === "1";
  const prea = limitaDeRata(cerere, {
    cheie: previzualizare ? "admin-sablon-vezi" : "admin-sablon",
    maxim: previzualizare ? 600 : 40,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;
  if (!(await arePermisiune("/admin/sabloane")))
    return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const formular = citit.formular;

  if (previzualizare) {
    /*
      Numai desenul: nimic nu se urcă și nimic nu pleacă. Poza aleasă de pe
      calculator vine ca adresă `blob:` din browserul omului, care o poate
      arăta numai el; lipsa descrierii nu oprește desenul.
    */
    formular.delete("poza_fisier");
    const { fel, continut } = citeste(formular);
    const locala = String(formular.get("poza_locala") ?? "");
    if (locala.startsWith("blob:")) {
      continut.poza = {
        adresa: locala,
        alt: String(formular.get("poza_alt") ?? "").trim() || continut.titlu,
      };
    }
    return paginaHtml(sablonCampanie(fel, continut));
  }

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
  /*
    Textul de exemplu e pentru „vezi” și „descarcă”. La probă, ciornă și
    trimitere, câmpurile goale ar pleca la listă ca „Titlul campaniei — îl
    scrii tu” — exact „Sorem ipsum” de pe site-ul vechi (prins de audit pe 4
    noiembrie 2026). Un titlu peste 160 de semne devenea, în tăcere, exemplul.
  */
  const scris = (n: string) => String(formular.get(n) ?? "").trim();
  if (fac !== "vezi" && fac !== "descarca" && (!scris("titlu") || !scris("text"))) {
    return inapoi(cerere, { ratat: "gol", fel });
  }
  if (scris("titlu").length > 160) return inapoi(cerere, { ratat: "titlu-lung", fel });
  const html = sablonCampanie(fel, continut);

  if (fac === "vezi") return paginaHtml(html);

  if (fac === "descarca") {
    const nume = `Sablon-campanie-${fel}.html`;
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="${nume}"`,
        "cache-control": "no-store, no-transform",
      },
    });
  }

  if (fac === "proba") {
    /*
      Mai multe adrese, despărțite prin virgulă, spațiu sau rând nou — ca
      proba s-o vadă deodată și colegii. Fiecare primește mesajul separat:
      la o probă, nimeni n-are de ce să vadă adresele celorlalți. Cel mult
      zece, altfel nu mai e probă, e o listă.
    */
    const adrese = [
      ...new Set(
        String(formular.get("catre") ?? "")
          .split(/[\s,;]+/)
          .map((a) => a.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    if (
      !adrese.length ||
      adrese.length > 10 ||
      !adrese.every((a) => emailValid(a))
    )
      return inapoi(cerere, { ratat: "adresa", fel });
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
    const html = sablonCampanie(fel, deProba);
    const text = textSimpluCampanie(fel, deProba);
    let plecate = 0;
    for (const catre of adrese) {
      const trimis = await trimiteEmail({
        catre,
        subiect: `[probă] ${continut.titlu}`,
        html,
        text,
        raspundeLa: EMAIL.contact,
        masa: true,
      }).catch(() => false);
      if (trimis) plecate++;
    }
    if (plecate === adrese.length) return inapoi(cerere, { facut: "proba", fel });
    return inapoi(cerere, { ratat: "proba-nu", fel });
  }

  // O probă automată nu atinge MailerLite: de acolo pleacă la toată lista.
  if ((fac === "ciorna" || fac === "trimite") && (await esteProba())) {
    return raspuns("Proba nu face ciorne și nu trimite în MailerLite.", 403);
  }
  if (fac === "ciorna" || fac === "trimite") {
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

    if (!raspunsul.ok)
      return inapoi(cerere, {
        ratat: "mailerlite",
        mesaj: raspunsul.mesaj,
        fel,
      });
    if (fac === "ciorna") return inapoi(cerere, { facut: "ciorna", fel });

    /*
      Trimiterea: ciorna de mai sus, apoi „trimite acum". Două condiții, și
      amândouă se verifică aici, nu doar în pagină: o listă aleasă (fără ea,
      MailerLite n-are cui) și bifa de confirmare. Lângă fiecare listă scrie
      câți abonați are, citit din MailerLite la deschiderea paginii.
    */
    if (!grupuri.length) return inapoi(cerere, { ratat: "fara-lista", fel });
    if (formular.get("confirm") !== "da")
      return inapoi(cerere, { ratat: "neconfirmat", fel });

    const plecat = await trimiteCampania(raspunsul.id);
    return plecat.ok
      ? inapoi(cerere, { facut: "trimisa", fel })
      : inapoi(cerere, { ratat: "mailerlite", mesaj: plecat.mesaj, fel });
  }

  return nuTrece("Nu știu ce să fac.");
}
