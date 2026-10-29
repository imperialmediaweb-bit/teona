import { NextResponse, type NextRequest } from "next/server";
import { proiecteAfisate } from "@/date/proiecte";
import { areBazaDeDate, intreaba } from "@/lib/baza";

/**
 * O adresă de proiect care nu există răspunde cu 404, nu cu 200.
 *
 * **Problema.** `/proiecte/ceva-ce-nu-exista` răspundea cu **codul 200** și
 * pagina „Pagina nu a fost găsită” în corp — verificat pe producție. Cauza e
 * randarea parțială: antetul răspunsului pleacă spre browser înainte ca pagina
 * să ajungă la `notFound()`, iar codul nu se mai poate schimba. Nici mutarea
 * lui `notFound()` în `generateMetadata` nu ajută — încercat.
 *
 * Pentru Google asta e un „soft 404”: o adresă inexistentă care se declară
 * validă. Le indexează ca pagini adevărate și pune apoi la îndoială și restul
 * site-ului. Iar un link greșit dintr-un e-mail sau dintr-o postare veche ar
 * fi arătat ca o pagină de proiect care s-a golit.
 *
 * **De ce aici.** `export const dynamicParams = false` ar fi rezolvat-o într-o
 * linie, dar Next o refuză când `cacheComponents` e pornit („Route segment
 * config «dynamicParams» is not compatible”). Un filtru înaintea randării nu
 * are constrângerea asta.
 *
 * **Cum.** Lista slugurilor e cunoscută în întregime: vine din `continut/` și
 * din `proiecte-scrise.ts`, nu de la vizitatori. Pentru ce nu e în ea, se
 * cere pagina `/proiect-inexistent` și se întoarce corpul ei cu codul 404.
 * Adresa din bara browserului rămâne cea cerută, ca omul să vadă ce a greșit.
 *
 * Două variante mai simple nu merg, amândouă încercate:
 *
 * - rescrierea către o adresă inexistentă dă într-adevăr 404, dar corpul e
 *   documentul de eroare al lui Next, o pagină goală cu `id="__next_error__"`;
 * - `NextResponse.rewrite(…, { status: 404 })` ignoră codul și răspunde 200.
 *
 * Un cod bun cu o pagină goală, sau o pagină bună cu un cod greșit, sunt
 * amândouă pe jumătate. De aceea pagina se cere și se întoarce de aici.
 *
 * Cererea merge la `127.0.0.1`, nu la adresa publică: nu iese din container,
 * nu trece prin certificat și nu depinde de felul în care Railway rezolvă
 * numele propriu. Dacă totuși cade, răspunsul e un 404 simplu, scris de mână —
 * urât, dar corect, și se întâmplă doar la adrese greșite.
 *
 * Fișierul se numește `proxy.ts`, nu `middleware.ts`: Next 16 a redenumit
 * convenția. Rulează întotdeauna pe Node, deci citirea proiectelor cu
 * `node:fs` e în regulă — `runtime` nici nu se mai poate scrie aici.
 */
export const config = {
  /*
    Toate cererile, afară de fișierele statice ale lui Next: filtrul de mai
    jos pentru adresa canonică trebuie să prindă orice cale, iar cel pentru
    `Origin` orice rută din `/api`. Slugurile își fac singure potrivirea.
  */
  matcher: ["/((?!_next/static|_next/image).*)"],
};

/** Numele sub care răspunde site-ul. Toate celelalte duc aici. */
const GAZDA = "teona-ariana.ro";

/*
  Gazde de pe care site-ul se vede, dar nu trebuie: `www.` (aceeași pagină
  la două adrese e conținut dublat pentru Google) și adresa de lucru a
  Railway (`….up.railway.app`), care ocolește Cloudflare cu tot cu
  firewall-ul lui. Amândouă se trimit, cu 308, la adresa adevărată.
  `localhost` și `127.0.0.1` rămân: pe ele rulează probele, iar pagina de 404
  de mai jos se cere chiar de la `127.0.0.1`.
*/
function gazdaDeMutat(gazda: string): boolean {
  const g = gazda.toLowerCase().replace(/:\d+$/, "");
  return g === `www.${GAZDA}` || g.endsWith(".up.railway.app");
}

/*
  Un POST venit de pe alt site e refuzat.

  Cookie-urile panoului sunt `SameSite=strict`, deci un formular pus pe alt
  site n-ar avea cu ce lucra în panou. Dar intrarea în panou, formularele
  publice și contul donatorului nu cer cookie — de pe un site străin se putea
  deci, de exemplu, intra pe ascuns în panou cu contul atacatorului, iar omul
  scria apoi lucruri crezând că e în al lui. Browserele trimit `Origin` la
  orice POST; dacă lipsește, cererea nu vine dintr-un browser (cron-ul
  radarului, Stripe, PayPal) și trece.
*/
const FARA_ORIGIN = [/\/webhook$/, /^\/api\/radar$/];

function originStrain(cerere: NextRequest): boolean {
  const metoda = cerere.method.toUpperCase();
  if (metoda === "GET" || metoda === "HEAD" || metoda === "OPTIONS") return false;
  const cale = cerere.nextUrl.pathname;
  if (!cale.startsWith("/api/")) return false;
  if (FARA_ORIGIN.some((r) => r.test(cale))) return false;
  const origin = cerere.headers.get("origin");
  if (!origin) return false;
  let gazdaOrigin: string;
  try {
    gazdaOrigin = new URL(origin).host.toLowerCase();
  } catch {
    return true;
  }
  const bune = new Set(
    [
      cerere.headers.get("x-forwarded-host"),
      cerere.headers.get("host"),
      GAZDA,
      `www.${GAZDA}`,
    ]
      .filter((x): x is string => Boolean(x))
      .map((x) => x.toLowerCase()),
  );
  return !bune.has(gazdaOrigin);
}

const SLUGURI = new Set(proiecteAfisate().map((p) => p.slug));

/**
 * Există slugul ăsta, publicat?
 *
 * **Fără memorie, deși e o întrebare la fiecare cerere.** Două încercări de a
 * ține minte au eșuat, fiecare în alt fel, și amândouă au fost prinse de
 * probă:
 *
 * - lista tuturor slugurilor, reîmprospătată la treizeci de secunde: cine
 *   publica o noutate și apăsa „Vezi pe site” primea 404 pe textul lui
 *   proaspăt publicat;
 * - ținut minte doar ce există: un text șters rămânea accesibil, pentru că
 *   filtrul îl lăsa să treacă și pagina răspundea cu 200 și „nu a fost
 *   găsit” în corp — exact soft-404-ul pentru care există filtrul.
 *
 * E o singură interogare pe un index unic, pentru un site cu zeci de vizite
 * pe oră. Costul e sub o milisecundă; greșeala pe care o evită se vede.
 */
async function estePublicat(fel: string, slug: string): Promise<boolean | null> {
  if (!areBazaDeDate()) return null;

  try {
    const randuri = await intreaba<{ unu: number }>(
      `SELECT 1 AS unu FROM texte
        WHERE fel = $1 AND slug = $2 AND stare = 'publicat' LIMIT 1`,
      [fel, slug],
    );
    return randuri.length > 0;
  } catch {
    // Baza de date e picată. Lăsăm cererea să treacă: pagina va spune ea ce
    // poate. Un 404 pus aici ar transforma o pană de un minut într-o adresă
    // care pare ștearsă.
    return null;
  }
}

export default async function proxy(cerere: NextRequest) {
  const gazda =
    cerere.headers.get("x-forwarded-host") ?? cerere.headers.get("host") ?? "";
  if (gazdaDeMutat(gazda)) {
    const { pathname, search } = cerere.nextUrl;
    return new NextResponse(null, {
      status: 308,
      headers: { Location: `https://${GAZDA}${pathname}${search}` },
    });
  }

  if (originStrain(cerere)) {
    return new NextResponse("Cererea vine de pe alt site.", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const potriveste = cerere.nextUrl.pathname.match(
    /^\/(proiecte|noutati|campanii)\/(.+)$/,
  );
  if (!potriveste) return NextResponse.next();

  const [, sectiune, brut] = potriveste;
  let slug = brut;
  try {
    slug = decodeURIComponent(brut);
  } catch {
    // O adresă cu procente stricate (`%zz`) nu e un slug valid oricum.
  }

  /*
    Proiectele vin din două locuri: din depozit (exportul WordPress și cele
    scrise în cod) și din panou. Lista din cod se știe la pornire; pentru
    restul se întreabă baza de date, ca o tabără adăugată acum cinci minute să
    nu dea 404.
  */
  if (sectiune === "proiecte") {
    if (SLUGURI.has(slug)) return NextResponse.next();
    const exista = await estePublicat("proiect", slug);
    return exista === false
      ? await paginaDe404(cerere, "proiect")
      : NextResponse.next();
  }

  const fel = sectiune === "noutati" ? "noutate" : "campanie";
  const exista = await estePublicat(fel, slug);
  // `null` = baza de date n-a răspuns; cererea trece mai departe.
  if (exista !== false) return NextResponse.next();
  return await paginaDe404(cerere, fel);
}

/** Pagina „nu a fost găsit”, întoarsă cu codul 404. */
async function paginaDe404(cerere: NextRequest, ce: string) {
  const port = process.env.PORT || "3000";
  const cale = `/proiect-inexistent?ce=${ce}`;
  const acasa = `http://127.0.0.1:${port}${cale}`;

  for (const unde of [acasa, new URL(cale, cerere.nextUrl).toString()]) {
    try {
      const raspuns = await fetch(unde, {
        headers: { "accept-language": cerere.headers.get("accept-language") ?? "ro" },
        signal: AbortSignal.timeout(3000),
      });
      if (!raspuns.ok) continue;
      return new NextResponse(await raspuns.text(), {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
          // Un 404 nu se ține în cache: mâine adresa poate exista.
          "cache-control": "no-store",
        },
      });
    } catch {
      // Se încearcă varianta următoare.
    }
  }

  return new NextResponse("Pagina nu a fost găsită.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
