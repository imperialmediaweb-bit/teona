import { NextResponse } from "next/server";

/**
 * Ce au în comun rutele din `src/app/api/`: citirea corpului cu limită,
 * limitarea de rată și răspunsurile.
 *
 * Rutele primesc date personale (nume, email, telefon, data nașterii) de la
 * oricine, fără autentificare. Trei lucruri le apără aici, înainte ca vreo
 * rută să se uite la conținut:
 *
 * - **corpul e citit cu limită** — `cerere.json()` citește tot ce trimite
 *   clientul, oricât; un formular de contact nu are nevoie de mai mult de
 *   câțiva kilooctreți;
 * - **limitare de rată pe adresa IP** — fără ea, oricine poate trimite
 *   formularul de o mie de ori pe minut, iar când trimiterea va fi conectată
 *   la email, fiecare apel va fi un email pentru asociație și unul pentru
 *   adresa (străină, poate) scrisă în formular;
 * - **răspunsurile nu se pun în cache** și nu spun nimic despre interior:
 *   mesajele sunt pentru om, nu pentru depanare.
 *
 * Nimic de aici nu scrie în jurnal. Un `console.log(corp)` pe un formular de
 * voluntariat ar pune nume, telefoane și date de naștere în jurnalele gazdei,
 * de unde nu le mai scoate nimeni.
 */

/** Cât de mare poate fi corpul unei cereri. Un formular întreg are sub 10 KB. */
export const LIMITA_CORP = 16 * 1024;

/** Un răspuns JSON cu un mesaj pentru om, niciodată pus în cache. */
export function raspuns(mesaj: string, status: number, antete?: HeadersInit) {
  return NextResponse.json(
    { mesaj },
    { status, headers: { "Cache-Control": "no-store", ...antete } },
  );
}

type Citire =
  | { ok: true; corp: Record<string, unknown> }
  | { ok: false; raspuns: NextResponse };

/**
 * Citește corpul ca JSON, dar nu mai mult de `limita` octeți.
 *
 * `Content-Length` se verifică întâi, ca o cerere evident prea mare să fie
 * refuzată fără să citim nimic. Dar antetul e opțional (corpurile `chunked`
 * nu-l au) și poate minți, așa că numărăm și octeții pe măsură ce vin și ne
 * oprim la limită.
 */
export async function citesteJson(
  cerere: Request,
  limita = LIMITA_CORP,
): Promise<Citire> {
  const tip = cerere.headers.get("content-type") ?? "";
  if (!tip.toLowerCase().includes("application/json")) {
    return { ok: false, raspuns: raspuns("Cerere invalidă.", 415) };
  }

  const anuntat = Number(cerere.headers.get("content-length"));
  if (Number.isFinite(anuntat) && anuntat > limita) {
    return { ok: false, raspuns: raspuns("Mesajul e prea lung.", 413) };
  }

  if (!cerere.body) {
    return { ok: false, raspuns: raspuns("Cerere invalidă.", 400) };
  }

  const bucati: Uint8Array[] = [];
  let citit = 0;
  const cititor = cerere.body.getReader();
  for (;;) {
    const { done, value } = await cititor.read();
    if (done) break;
    citit += value.byteLength;
    if (citit > limita) {
      // Nu mai citim restul: clientul poate trimite gigaocteți, noi nu-i ținem.
      await cititor.cancel().catch(() => {});
      return { ok: false, raspuns: raspuns("Mesajul e prea lung.", 413) };
    }
    bucati.push(value);
  }

  let corp: unknown;
  try {
    corp = JSON.parse(new TextDecoder().decode(Buffer.concat(bucati)));
  } catch {
    return { ok: false, raspuns: raspuns("Cerere invalidă.", 400) };
  }

  // Un JSON valid poate fi și `null`, `42` sau `"text"`; rutele vor un obiect.
  if (typeof corp !== "object" || corp === null || Array.isArray(corp)) {
    return { ok: false, raspuns: raspuns("Cerere invalidă.", 400) };
  }

  return { ok: true, corp: corp as Record<string, unknown> };
}

/**
 * Adresa IP a clientului.
 *
 * Railway termină TLS-ul și pune adresa reală în `X-Forwarded-For`; procesul
 * nostru vede doar proxy-ul. Luăm prima adresă din listă — cea pe care a
 * scris-o proxy-ul nostru e ultima, dar lanțul de aici are un singur proxy,
 * iar prima e cea a clientului. Dacă antetul lipsește (rulare locală), toate
 * cererile se numără la un loc, ceea ce e în regulă pentru dezvoltare.
 */
function adresaClient(cerere: Request): string {
  const inainte = cerere.headers.get("x-forwarded-for");
  if (inainte) {
    const prima = inainte.split(",")[0]?.trim();
    if (prima) return prima;
  }
  return cerere.headers.get("x-real-ip")?.trim() || "necunoscut";
}

/**
 * Contorul de cereri, în memoria procesului.
 *
 * E destul pentru un singur container, cum e site-ul pe Railway: la repornire
 * se golește (acceptabil), iar dacă site-ul ar rula vreodată pe mai multe
 * instanțe, fiecare ar număra separat și limita reală ar fi înmulțită cu
 * numărul lor. Atunci contorul trebuie mutat într-un loc comun (Redis sau
 * baza de date aleasă pentru donatori). Nu adăugăm o bibliotecă pentru o
 * fereastră glisantă de câteva rânduri.
 */
const contoare = new Map<string, number[]>();
/** Peste atâtea adrese ținute minte, le scoatem pe cele expirate. */
const PRAG_CURATARE = 5_000;

export function limitaDeRata(
  cerere: Request,
  {
    cheie,
    maxim,
    fereastraMs,
  }: {
    /** Numele rutei: fiecare rută are propria limită, nu una comună. */
    cheie: string;
    /** Câte cereri sunt permise într-o fereastră. */
    maxim: number;
    fereastraMs: number;
  },
): NextResponse | null {
  const acum = Date.now();
  const id = `${cheie}:${adresaClient(cerere)}`;

  if (contoare.size > PRAG_CURATARE) {
    for (const [k, momente] of contoare) {
      if (momente.every((t) => acum - t > fereastraMs)) contoare.delete(k);
    }
  }

  const recente = (contoare.get(id) ?? []).filter((t) => acum - t <= fereastraMs);
  if (recente.length >= maxim) {
    contoare.set(id, recente);
    const asteapta = Math.ceil((fereastraMs - (acum - recente[0])) / 1000);
    return raspuns(
      "Ai trimis prea multe cereri într-un timp scurt. Încearcă din nou peste câteva minute.",
      429,
      { "Retry-After": String(Math.max(asteapta, 1)) },
    );
  }

  recente.push(acum);
  contoare.set(id, recente);
  return null;
}

/** Un șir nevid, fără spații pe margini, de cel mult `maxim` caractere. */
export function text(valoare: unknown, maxim: number): string | null {
  if (typeof valoare !== "string") return null;
  const curat = valoare.trim();
  if (curat.length === 0 || curat.length > maxim) return null;
  return curat;
}

/** Un câmp opțional: lipsă e în regulă, dar dacă e dat trebuie să fie text scurt. */
export function textOptional(valoare: unknown, maxim: number): boolean {
  if (valoare === undefined || valoare === null || valoare === "") return true;
  return typeof valoare === "string" && valoare.length <= maxim;
}

/**
 * O adresă de email plauzibilă.
 *
 * Nu validăm după RFC: scopul e să prindem greșelile de tastare și gunoiul,
 * nu să respingem adrese legitime dar neobișnuite. Limita de 254 e cea din
 * standard.
 */
export function email(valoare: unknown): string | null {
  const curat = text(valoare, 254);
  if (!curat || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(curat)) return null;
  return curat;
}

/**
 * Capcana pentru roboți.
 *
 * Formularele pot pune un câmp `site_web`, ascuns vizual și pentru cititoarele
 * de ecran, pe care un om nu-l completează niciodată. Roboții completează tot.
 * Dacă e completat, ruta răspunde ca și cum a mers, fără să facă nimic:
 * robotul nu află că a fost prins, și nu încearcă altfel.
 */
export function esteRobot(corp: Record<string, unknown>): boolean {
  const capcana = corp.site_web;
  return typeof capcana === "string" && capcana.trim().length > 0;
}
