/**
 * Documentele pe care le descarcă oamenii de pe site.
 *
 * **De ce există lista.** Caietul cere, în două locuri, ca asociația să le
 * poată înlocui singură:
 *
 * - la 2.4, despre contractul de sponsorizare și Declarația 177: „Asociația
 *   poate înlocui singură cele două fișiere când se actualizează modelele";
 * - la 7.5, despre cele trei documente de la pagina de 3,5%: „Cele trei
 *   documente le pregătește asociația; fără ele, butoanele de descărcare
 *   rămân inactive la lansare."
 *
 * Până acum doar Formularul 230 se putea înlocui din panou. Contractul și
 * Declarația 177 stăteau ca fișiere în depozitul de cod, deci un model nou de
 * contract însemna o publicare. Declarația de consimțământ și informarea GDPR
 * nu existau deloc.
 *
 * **Lista e fixă, fișierele nu.** Nu se adaugă documente din panou, și nu din
 * lene: fiecare document de aici e legat de un buton anume, dintr-o pagină
 * anume, cu un text care spune ce e. Un document urcat fără un buton care să
 * ducă la el ar sta în depozit fără să-l vadă nimeni — iar omul care l-a urcat
 * ar crede că l-a publicat.
 *
 * **Fișierul din depozitul de cod rămâne ca rezervă.** Cele două contracte
 * există deja în `public/documente/`. Dacă nimeni n-a urcat nimic în R2, omul
 * primește fișierul de acolo, nu o pagină de eroare: ce funcționează azi
 * trebuie să funcționeze și mâine, chiar dacă R2 n-are încă nimic în el.
 */

/**
 * Unde stă în R2 formularul 230 gol.
 *
 * Cheia stă aici, nu în fișierul rutei: o importa și ruta de urcare, deci un
 * fișier de rută importa din alt fișier de rută. Lista de documente e date
 * curate, fără nimic de server în ea, deci e locul bun pentru ea.
 */
export const CHEIE_FORMULAR = "public/formular-230.pdf";

export type Document = {
  /** Bucata din adresă: `/documente/<slug>`. */
  slug: string;
  titlu: string;
  /** Ce e, pe scurt, pentru pagina din panou. */
  descriere: string;
  /** Unde stă în R2. */
  cheie: string;
  /** Numele fișierului primit de om, când îl descarcă. */
  fisier: string;
  /** Pagina pe care apare butonul care duce aici. */
  unde: string;
  /**
   * Fișierul din `public/`, folosit cât timp nu s-a urcat nimic.
   *
   * Calea e relativă la `public/`. Lipsa ei înseamnă că documentul n-a existat
   * niciodată pe site — butonul spune asta, cum cere caietul la 7.5.
   */
  rezerva?: string;
};

export const DOCUMENTE: ReadonlyArray<Document> = [
  {
    slug: "formular-230",
    titlu: "Formularul 230",
    descriere:
      "Formularul tipizat, cu datele asociației deja completate. Îl descarcă oamenii care redirecționează 3,5%.",
    cheie: CHEIE_FORMULAR,
    fisier: "Formular-230-Teona-Ariana.pdf",
    unde: "/redirectioneaza-3-5",
  },
  {
    slug: "acord-depunere-230",
    titlu: "Declarația de consimțământ",
    descriere:
      "Prin ea, omul vă dă dreptul să depuneți Formularul 230 la ANAF în numele lui. Cerută de caiet la 7.5.",
    cheie: "public/acord-depunere-230.pdf",
    fisier: "Declaratie-consimtamant-Teona-Ariana.pdf",
    unde: "/redirectioneaza-3-5",
  },
  {
    slug: "informare-gdpr-230",
    titlu: "Informarea GDPR pentru Formularul 230",
    descriere:
      "Ce date primiți, pentru ce le folosiți și cât le păstrați. Cerută de caiet la 7.5.",
    cheie: "public/informare-gdpr-230.pdf",
    fisier: "Informare-GDPR-Teona-Ariana.pdf",
    unde: "/redirectioneaza-3-5",
  },
  {
    slug: "contract-de-sponsorizare",
    titlu: "Contractul de sponsorizare",
    descriere:
      "Modelul pe care îl completează firma. Se descarcă de pe pagina pentru firme și de pe Donează.",
    cheie: "public/contract-de-sponsorizare.pdf",
    fisier: "Contract-sponsorizare-Teona-Ariana.pdf",
    unde: "/directioneaza-20",
    rezerva: "documente/contract-de-sponsorizare.pdf",
  },
  {
    slug: "contract-declaratia-177",
    titlu: "Contractul pentru Declarația 177",
    descriere:
      "Varianta în care suma o virează ANAF din impozitul firmei, nu firma din contul ei.",
    cheie: "public/contract-declaratia-177.pdf",
    fisier: "Contract-Declaratia-177-Teona-Ariana.pdf",
    unde: "/directioneaza-20",
    rezerva: "documente/contract-sponsorizare-declaratia-177.pdf",
  },
] as const;

export function documentDupaSlug(slug: string): Document | undefined {
  return DOCUMENTE.find((d) => d.slug === slug);
}
