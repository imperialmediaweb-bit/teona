import type { Metadata } from "next";
import { isValidElement, type ReactNode } from "react";
import {
  ADRESE,
  ASOCIATIA,
  EMAIL,
  RETELE_ASOCIATIE,
  RUTE,
  TELEFOANE,
} from "@/date/asociatie";

/**
 * Tot ce ține de motoarele de căutare, într-un singur loc: adresa publică a
 * site-ului, metadatele fiecărei pagini și datele structurate (JSON-LD).
 *
 * Fișierul stă în `app/`, lângă paginile care îl folosesc, dar nu e o rută:
 * Next tratează ca rute doar `page`, `layout`, `route` și celelalte nume
 * rezervate. `sitemap.ts` și `robots.ts` citesc tot de aici, ca adresa
 * site-ului să fie scrisă o singură dată.
 */

/**
 * Adresa publică a site-ului, fără bară la sfârșit.
 *
 * De aici se rezolvă adresele absolute: `canonical`, imaginile pentru
 * Facebook și WhatsApp, `sitemap.xml`, datele structurate. Fără ea, Next
 * cădea pe `http://localhost:3000` și previzualizările distribuite pe rețele
 * arătau o adresă care nu există.
 *
 * Valoarea implicită e domeniul final, `www.teona-ariana.ro`, pentru că e singura
 * valoare care nu trebuie ținută minte la lansare: dacă variabila lipsește,
 * site-ul se descrie corect.
 *
 * Până la lansare, site-ul nou e la `https://site-production-641f.up.railway.app`.
 * Ca previzualizările distribuite de acolo să aibă imaginea și adresa bune,
 * se setează în Railway:
 *
 *     ADRESA_SITE=https://site-production-641f.up.railway.app
 *
 * LA LANSARE: se șterge variabila din Railway (sau se pune
 * `https://www.teona-ariana.ro`). Cât timp adresa nu e cea finală, `robots.txt`
 * și eticheta `robots` cer motoarelor să NU indexeze — vezi `INDEXABIL`.
 */
export const ADRESA_SITE = (
  process.env.ADRESA_SITE?.trim() || "https://www.teona-ariana.ro"
).replace(/\/+$/, "");

/**
 * Domeniul pe care site-ul are voie să fie indexat.
 *
 * Verificat pe site-ul viu: `teona-ariana.ro`, cu sau fără `http`, se
 * redirecționează la `https://www.teona-ariana.ro`. Deci adresa canonică e
 * cea cu `www`, iar valoarea implicită de mai sus o folosește pe ea — altfel
 * fiecare pagină ar fi declarat drept canonică o adresă care, cerută, duce
 * în altă parte.
 *
 * Verificarea de mai jos acceptă și forma fără `www`, pentru cazul în care
 * cineva pune `ADRESA_SITE` așa din obișnuință: site-ul tot pe domeniul lui
 * e, și n-are rost să se stingă indexarea pentru trei litere.
 */
const DOMENIU_FINAL = "teona-ariana.ro";

/**
 * Site-ul se lasă indexat numai pe domeniul final.
 *
 * Adresa de previzualizare de pe Railway e publică și, odată găsită, Google
 * ar indexa-o ca pe un site separat, cu același conținut. La lansare, cele
 * două copii s-ar bate între ele, iar autoritatea câștigată de
 * `teona-ariana.ro` în ani s-ar împărți. De aceea, pe orice altă adresă decât
 * cea finală, `robots.txt` interzice tot și fiecare pagină poartă `noindex`.
 */
export const INDEXABIL = (() => {
  try {
    const gazda = new URL(ADRESA_SITE).hostname;
    return gazda === DOMENIU_FINAL || gazda.endsWith(`.${DOMENIU_FINAL}`);
  } catch {
    return false;
  }
})();

/** Adresă absolută dintr-o cale relativă (`/casa-teona` → `https://…/casa-teona`). */
export const absoluta = (cale: string) =>
  cale.startsWith("http") ? cale : `${ADRESA_SITE}${cale}`;

/**
 * Semnul grafic al asociației, 512×512, cu fundal transparent — același pe
 * care îl folosește sigla din antet. Pentru `logo` din datele structurate e
 * nevoie de o adresă stabilă din `public/`, nu de `icon.png`, pe care Next îl
 * servește cu un hash în adresă.
 */
const SIGLA = "/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1.png";

/**
 * Metadatele unei pagini: titlu, descriere, adresă canonică, Open Graph și
 * Twitter, toate din aceleași trei valori.
 *
 * Titlul trece prin șablonul din `layout.tsx` (`%s · Asociația Teona Ariana
 * Suceava`). Pentru Open Graph șablonul nu se aplică automat, așa că titlul
 * complet se scrie aici o dată și se folosește peste tot.
 *
 * Imaginea de distribuire e `app/opengraph-image.jpg` (1200×630, cu sigla și
 * fotografia din tabără). Ca fișier cu nume rezervat, Next o aplică singur
 * DOAR primei pagini, nu și celor interioare — verificat pe HTML-ul randat —
 * așa că aici se trece explicit pe fiecare pagină. O pagină care are o
 * imagine mai potrivită o dă prin `imagine`.
 */

/** Imaginea generală de distribuire; textul e cel din `opengraph-image.alt.txt`. */
const IMAGINE_GENERALA = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "Asociația Teona Ariana Suceava — „Împreună, aducem bucurie”. Copii, părinți și voluntari într-o tabără RESPIRO.",
};
export function metadate({
  titlu,
  descriere,
  cale,
  imagine,
  titluAbsolut = false,
}: {
  titlu: string;
  descriere: string;
  /** Calea paginii, de la rădăcină: `/casa-teona`. */
  cale: string;
  /** Imagine proprie pentru Facebook/WhatsApp, în locul celei generale. */
  imagine?: { cale: string; alt: string };
  /** `true` = titlul e deja complet și nu trece prin șablon (prima pagină). */
  titluAbsolut?: boolean;
}): Metadata {
  const titluComplet = titluAbsolut ? titlu : `${titlu} · ${ASOCIATIA.denumire}`;
  const imagini = [
    imagine ? { url: absoluta(imagine.cale), alt: imagine.alt } : IMAGINE_GENERALA,
  ];

  return {
    title: titluAbsolut ? { absolute: titlu } : titlu,
    description: descriere,
    alternates: { canonical: cale },
    openGraph: {
      title: titluComplet,
      description: descriere,
      url: cale,
      siteName: ASOCIATIA.denumire,
      locale: "ro_RO",
      type: "website",
      images: imagini,
    },
    twitter: {
      card: "summary_large_image",
      title: titluComplet,
      description: descriere,
      images: imagini,
    },
  };
}

type Jsonld = Record<string, unknown>;

/**
 * Scrie un obiect ca `<script type="application/ld+json">`.
 *
 * `<` se scapă ca `<`: altfel un text care ar conține `</script>` ar
 * închide eticheta și ar rupe pagina. Textele vin din cod, nu de la
 * vizitatori, dar o regulă care nu depinde de asta e mai sigură.
 */
export function JsonLd({ date }: { date: Jsonld | Jsonld[] }) {
  const continut = JSON.stringify(date).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: continut }}
    />
  );
}

/** Identificatorul asociației, la care trimit celelalte blocuri. */
const ID_ASOCIATIE = `${ADRESA_SITE}/#asociatia`;

/**
 * Asociația, ca organizație non-profit, și site-ul ei.
 *
 * Numai date verificate, din `src/date/asociatie.ts`: nume, CIF, adrese,
 * telefoane, e-mail, rețele. Fără cifre, fără an de înființare, fără
 * afirmații — un panou Google construit pe o informație greșită e mai greu
 * de corectat decât unul care lipsește.
 */
export function jsonLdAsociatie(): Jsonld[] {
  const { casaTeona, sediuSocial } = ADRESE;
  return [
    {
      "@context": "https://schema.org",
      "@type": "NGO",
      "@id": ID_ASOCIATIE,
      name: ASOCIATIA.denumire,
      legalName: ASOCIATIA.denumireLegala,
      alternateName: "Asociația Teona Ariana",
      url: `${ADRESA_SITE}/`,
      logo: absoluta(SIGLA),
      image: absoluta(SIGLA),
      description: ASOCIATIA.fraza,
      slogan: ASOCIATIA.motto,
      taxID: ASOCIATIA.cif,
      email: EMAIL.contact,
      telephone: TELEFOANE.map((t) => t.apel),
      address: {
        "@type": "PostalAddress",
        streetAddress: sediuSocial.strada,
        addressLocality: sediuSocial.oras,
        addressRegion: "Suceava",
        addressCountry: "RO",
      },
      location: {
        "@type": "Place",
        name: casaTeona.nume,
        address: {
          "@type": "PostalAddress",
          streetAddress: casaTeona.strada,
          addressLocality: casaTeona.oras,
          addressRegion: "Suceava",
          postalCode: casaTeona.cod,
          addressCountry: "RO",
        },
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: TELEFOANE[0].apel,
        email: EMAIL.contact,
        availableLanguage: "ro",
      },
      sameAs: RETELE_ASOCIATIE.map((r) => r.url),
      nonprofitStatus: "Nonprofit",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${ADRESA_SITE}/#site`,
      url: `${ADRESA_SITE}/`,
      name: ASOCIATIA.denumire,
      inLanguage: "ro",
      publisher: { "@id": ID_ASOCIATIE },
    },
  ];
}

/**
 * Firul de navigare al unei pagini interioare: Acasă › … › pagina curentă.
 *
 * Google îl afișează în locul adresei brute în rezultate. Ultimul element e
 * pagina curentă; primul e mereu prima pagină.
 */
export function jsonLdFir(
  pasi: ReadonlyArray<{ nume: string; cale: string }>,
): Jsonld {
  const tot = [{ nume: "Acasă", cale: RUTE.acasa }, ...pasi];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: tot.map((pas, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: pas.nume,
      item: absoluta(pas.cale),
    })),
  };
}

/** Elementele după care, în text, urmează un spațiu — ca „și” să nu se lipească de „Da.” */
const BLOCURI = new Set(["p", "li", "ul", "ol", "div", "br"]);

/**
 * Textul simplu dintr-un fragment de JSX.
 *
 * Răspunsurile de la întrebările frecvente sunt scrise ca JSX, cu linkuri și
 * liste. Datele structurate au nevoie de același text, fără etichete. Se
 * extrage de aici, din aceeași sursă, nu se copiază de mână: o copie ar
 * rămâne în urmă la prima modificare, iar Google penalizează un FAQ în care
 * textul din cod nu e cel de pe pagină.
 */
export function textDin(nod: ReactNode): string {
  const extrage = (n: ReactNode): string => {
    if (n == null || typeof n === "boolean") return "";
    if (typeof n === "string" || typeof n === "number") return String(n);
    if (Array.isArray(n)) return n.map(extrage).join("");
    if (isValidElement<{ children?: ReactNode }>(n)) {
      const text = extrage(n.props.children);
      return typeof n.type === "string" && BLOCURI.has(n.type) ? `${text} ` : text;
    }
    return "";
  };
  return extrage(nod).replace(/\s+/g, " ").trim();
}

/** Întrebările frecvente ale unei pagini, pentru rezultatele extinse. */
export function jsonLdIntrebari(
  intrebari: ReadonlyArray<{ intrebare: string; raspuns: ReactNode }>,
): Jsonld {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: intrebari.map((i) => ({
      "@type": "Question",
      name: i.intrebare,
      acceptedAnswer: { "@type": "Answer", text: textDin(i.raspuns) },
    })),
  };
}
