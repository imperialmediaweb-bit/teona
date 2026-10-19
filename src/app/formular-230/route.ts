import { legaturaSemnata, areR2 } from "@/lib/r2";
import { ASOCIATIA, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { CHEIE_FORMULAR } from "@/lib/documente";

/**
 * Formularul 230 gol, pe care îl descarcă oamenii.
 *
 * Fișierul îl urcă asociația din panou și stă în R2, privat. Ruta asta îl
 * aduce și îl trimite mai departe, ca adresa publică să rămână
 * `teona-ariana.ro/formular-230` — una scurtă, de pus într-o postare, care
 * nu se schimbă când se înlocuiește fișierul.
 *
 * Nu se redirecționează către legătura semnată: aia expiră în zece minute,
 * iar o adresă trimisă pe WhatsApp e deschisă și a doua zi.
 */

export async function GET() {
  if (!areR2()) return lipseste();

  const legatura = legaturaSemnata(CHEIE_FORMULAR, 120);
  if (!legatura) return lipseste();

  try {
    const raspuns = await fetch(legatura, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!raspuns.ok || !raspuns.body) return lipseste();

    return new Response(raspuns.body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition":
          'inline; filename="Formular-230-Teona-Ariana.pdf"',
        // O zi: formularul se schimbă o dată pe an, dar nu vrem să rămână
        // vechiul în cache o lună după ce s-a înlocuit.
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return lipseste();
  }
}

/**
 * Când fișierul nu e acolo.
 *
 * **O pagină, nu o propoziție pe fond alb.** Adresa asta e capătul unui buton
 * mare, „Descarcă formularul", apăsat de un om care vrea să doneze 3,5% din
 * impozit. Un text gol, cu Times New Roman, arată ca un site stricat — iar
 * omul care crede că site-ul e stricat nu mai încearcă pe altă cale, nici
 * acum, nici la anul.
 *
 * Codul rămâne 404: fișierul chiar nu e acolo, iar Google n-are ce indexa.
 * Dar omul primește numărul de telefon și adresa de e-mail, pe o pagină care
 * seamănă cu restul site-ului.
 */
function lipseste() {
  const html = `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Formularul 230 · ${curat(ASOCIATIA.denumire)}</title>
<meta name="robots" content="noindex" />
<style>
  :root{color-scheme:light}
  body{margin:0;background:#f9f5f2;color:#232323;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;line-height:1.6}
  main{max-width:34rem;margin:0 auto;padding:4rem 1.25rem}
  h1{font-size:1.6rem;line-height:1.25;margin:0 0 1rem}
  p{margin:0 0 1rem;color:#4a4a4a}
  a{color:#b82b09;font-weight:700}
  .card{background:#fff;border:1px solid #efe7e1;border-radius:14px;padding:1.5rem}
  .inapoi{display:inline-block;margin-top:1.5rem;color:#616161;font-size:.9rem}
</style></head>
<body><main><div class="card">
  <h1>Formularul nu e încă încărcat pe site</h1>
  <p>Îl punem aici imediat ce îl primim. Până atunci ți-l trimitem noi, pe loc:</p>
  <p>
    Sună la <a href="tel:${TELEFON_PRINCIPAL.apel}">${curat(TELEFON_PRINCIPAL.afisat)}</a><br />
    sau scrie la <a href="mailto:${EMAIL.contact}">${curat(EMAIL.contact)}</a>
  </p>
  <p>Poți completa formularul și <a href="${RUTE.redirectionare35}">direct pe site</a>, fără imprimantă și fără drum.</p>
  <a class="inapoi" href="${RUTE.redirectionare35}">← Înapoi la pagina de redirecționare</a>
</div></main></body></html>`;
  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Scapă textul pus în HTML. Puțin, dar dintr-un singur loc. */
function curat(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}
