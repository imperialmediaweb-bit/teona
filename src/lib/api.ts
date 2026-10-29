import { BlockList, isIP } from "node:net";
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
/**
 * Trimite browserul la o pagină de pe site, după un formular.
 *
 * Cu `Location` **relativ**, dinadins. Felul obișnuit —
 * `NextResponse.redirect(new URL(cale, cerere.url))` — scrie o adresă
 * absolută, construită din adresa cererii. Pe Railway adresa cererii nu e
 * `https://teona-ariana.ro/…`, ci `https://localhost:8080/…`: ce vede
 * serverul în spatele proxy-ului, nu ce a scris omul în browser. Browserul
 * primea „du-te la localhost:8080”, refuza, și rămânea pe pagină fără niciun
 * semn: formularul se salva, dar „butonul nu făcea nimic”, iar la refresh
 * apărea. Ăsta a fost defectul semnalat în octombrie 2026 la intrarea în
 * panou și la conturi — prima explicație (mesajul rămas în capul paginii)
 * era adevărată, dar nu era cauza. Local nu se vede: acolo adresa cererii
 * chiar e cea din browser, deci nicio probă n-a prins-o; a prins-o un
 * `curl -D -` pe site-ul publicat.
 *
 * Un `Location` relativ îl rezolvă browserul singur, față de adresa pe care
 * a trimis formularul. Merge oriunde ar sta serverul, fără să știe numele
 * site-ului. Se construiește de mână, fiindcă `NextResponse.redirect()`
 * refuză adresele relative.
 *
 * Numai cărări de pe site: o valoare care nu începe cu un singur `/` (un
 * `inapoi=https://…` scris de mână în formular) duce la prima pagină, nu
 * afară.
 */
export function trimiteLa(unde: string | URL, status = 303): NextResponse {
  const cale =
    typeof unde === "string" ? unde : unde.pathname + unde.search + unde.hash;
  return new NextResponse(null, {
    status,
    // Nici `/\evil.com`: browserul citește bara inversă ca pe una dreaptă,
    // deci `/\…` ar fi tot `//…`, adică alt site.
    headers: { Location: /^\/(?![\/\\])/.test(cale) ? cale : "/" },
  });
}

/**
 * Răspunsul unui formular din panou care nu trece: o pagină cu mesajul și un
 * buton „Înapoi”, nu un JSON.
 *
 * Formularele din panou se trimit ca formulare obișnuite, deci ce răspunde
 * ruta e exact ce vede omul. Până în octombrie 2026, un text prea scurt sau o
 * poză prea mare duceau la o pagină albă cu `{"mesaj":"…"}` — asociația a
 * raportat-o ca „a trimis și nu merge”. Butonul face `history.back()`:
 * browserul întoarce formularul cu tot ce era scris în el, deci nu se pierde
 * nimic. `raspuns()` rămâne pentru rutele chemate din cod, nu din formulare.
 */
export function nuTrece(mesaj: string, status = 400) {
  const sigur = mesaj.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  return new Response(
    `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nu s-a salvat</title></head><body style="font-family:system-ui,sans-serif;background:#f9f5f2;color:#232323;margin:0;padding:48px 20px"><main style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px;border-top:6px solid #f74f22"><h1 style="margin:0 0 12px;font-size:22px">Nu s-a salvat încă</h1><p style="font-size:17px;line-height:1.5;margin:0 0 24px">${sigur}</p><a href="javascript:history.back()" style="display:inline-block;background:#b82b09;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Înapoi</a><p style="font-size:14px;color:#666;margin:18px 0 0">Ce ai completat e tot acolo.</p></main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

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
 * Octeții corpului, cel mult `limita`; `null` dacă trec de ea.
 *
 * `formData()` și `text()` citesc tot ce trimite clientul, oricât: un singur
 * corp de câțiva gigaocteți trimis la o rută publică umple memoria
 * containerului și oprește site-ul pentru toată lumea. Aici se numără pe
 * măsură ce vin, ca la `citesteJson`, iar `Content-Length` (care poate lipsi
 * sau minți) e doar prima sită.
 */
export async function octetiCuLimita(
  cerere: Request,
  limita: number,
): Promise<Buffer | null> {
  const anuntat = Number(cerere.headers.get("content-length"));
  if (Number.isFinite(anuntat) && anuntat > limita) return null;
  if (!cerere.body) return Buffer.alloc(0);
  const bucati: Uint8Array[] = [];
  let citit = 0;
  const cititor = cerere.body.getReader();
  for (;;) {
    const { done, value } = await cititor.read();
    if (done) break;
    citit += value.byteLength;
    if (citit > limita) {
      await cititor.cancel().catch(() => {});
      return null;
    }
    bucati.push(value);
  }
  return Buffer.concat(bucati);
}

/**
 * Formularul trimis, citit cu limită. `null` dacă e prea mare sau stricat —
 * exact ce întorcea și `cerere.formData().catch(() => null)`, deci rutele
 * nu-și schimbă purtarea.
 */
export async function formularCuLimita(
  cerere: Request,
  limita: number,
): Promise<FormData | null> {
  const octeti = await octetiCuLimita(cerere, limita).catch(() => null);
  if (!octeti) return null;
  const tip = cerere.headers.get("content-type") ?? "";
  return new Response(new Uint8Array(octeti), { headers: { "content-type": tip } })
    .formData()
    .catch(() => null);
}

/*
  Intervalele Cloudflare, de la https://www.cloudflare.com/ips (octombrie
  2026). Se schimbă rar; dacă Cloudflare adaugă unul, cererile venite prin el
  se numără pe adresa Cloudflare, adică limita devine mai strânsă, nu mai
  largă — greșeala merge în partea sigură.
*/
const CLOUDFLARE = new BlockList();
for (const r of [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
]) {
  const [ip, lung] = r.split("/");
  CLOUDFLARE.addSubnet(ip, Number(lung), "ipv4");
}
for (const r of [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
]) {
  const [ip, lung] = r.split("/");
  CLOUDFLARE.addSubnet(ip, Number(lung), "ipv6");
}

function eCloudflare(ip: string): boolean {
  try {
    return CLOUDFLARE.check(ip, isIP(ip) === 6 ? "ipv6" : "ipv4");
  } catch {
    return false;
  }
}

/**
 * Adresa IP a clientului, pentru limitele de cereri.
 *
 * **Nu din `X-Forwarded-For`.** Până în octombrie 2026 se lua prima adresă
 * din el, iar pe aia o scrie clientul: cu un antet schimbat la fiecare
 * cerere, limita de 5 intrări în panou la 15 minute nu mai limita nimic, și
 * nici cea de la asistent (un API plătit) sau de la formulare.
 *
 * Drumul e: om → Cloudflare → marginea Railway → noi. Railway pune în
 * `X-Real-IP` adresa care s-a legat de el — adică a Cloudflare, nu a omului.
 * Doar atunci, când adresa e chiar a Cloudflare, se crede `CF-Connecting-IP`,
 * pe care Cloudflare îl scrie el, peste ce trimite clientul. Cine ocolește
 * Cloudflare și vine direct la Railway rămâne cu adresa lui reală, oricâte
 * antete ar scrie.
 *
 * Fără `X-Real-IP` nu suntem pe Railway (rulare locală, probe): acolo se ia
 * `X-Forwarded-For`, ca probele să poată juca mai mulți oameni.
 */
function adresaClient(cerere: Request): string {
  const real = cerere.headers.get("x-real-ip")?.trim();
  if (real) {
    if (eCloudflare(real)) {
      const cf = cerere.headers.get("cf-connecting-ip")?.trim();
      if (cf && isIP(cf)) return cf;
    }
    return real;
  }
  const inainte = cerere.headers.get("x-forwarded-for");
  return inainte?.split(",")[0]?.trim() || "necunoscut";
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
