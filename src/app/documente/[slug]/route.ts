import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ASOCIATIA, EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";
import { areR2, legaturaSemnata } from "@/lib/r2";
import { documentDupaSlug, type Document } from "@/lib/documente";

/**
 * Documentele de descărcat: contractele, declarațiile, informarea GDPR.
 *
 * Adresa publică rămâne aceeași — `/documente/contract-de-sponsorizare` — și
 * când asociația înlocuiește fișierul din panou. Așa un link pus într-un
 * e-mail acum trei luni duce la modelul de acum, nu la cel de atunci.
 *
 * **Trei trepte, în ordinea asta:**
 *
 * 1. fișierul urcat din panou, din R2;
 * 2. fișierul din depozitul de cod, dacă documentul a avut unul — cele două
 *    contracte există de dinainte, iar ce funcționează azi trebuie să
 *    funcționeze și mâine, chiar dacă nimeni n-a urcat nimic în R2;
 * 3. o pagină care spune pe față că fișierul nu e încă pe site, cu telefonul
 *    și adresa de e-mail.
 *
 * **Nu se redirecționează către legătura semnată din R2**: aia expiră în
 * câteva minute, iar o adresă trimisă pe WhatsApp e deschisă și a doua zi.
 * Fișierul se aduce aici și se trimite mai departe.
 */

/*
  Formularul 230 e servit și de aici, și de `/formular-230`.

  Adresa scurtă rămâne cea pe care o pune asociația în postări; aceeași cheie
  din R2 stă în spatele amândurora, deci fișierul urcat o dată se vede pe
  amândouă. Nu se redirecționează una spre alta: un ocol în plus la descărcarea
  unui PDF nu rezolvă nimic.
*/
export async function GET(
  _cerere: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const doc = documentDupaSlug(slug);
  if (!doc) return lipseste(null);

  /* 1. Ce a urcat asociația. */
  if (areR2()) {
    const legatura = legaturaSemnata(doc.cheie, 120);
    if (legatura) {
      try {
        const raspuns = await fetch(legatura, {
          signal: AbortSignal.timeout(15_000),
        });
        if (raspuns.ok && raspuns.body) return trimite(raspuns.body, doc);
      } catch {
        /* R2 n-a răspuns. Mai jos e rezerva. */
      }
    }
  }

  /* 2. Fișierul din depozit, dacă documentul are unul. */
  if (doc.rezerva) {
    try {
      const octeti = await readFile(join(process.cwd(), "public", doc.rezerva));
      return trimite(new Uint8Array(octeti), doc);
    } catch {
      /* Nici el nu e acolo. */
    }
  }

  /* 3. Spus pe față. */
  return lipseste(doc);
}

function trimite(corp: BodyInit, doc: Document) {
  return new Response(corp, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${doc.fisier}"`,
      /*
        O zi. Modelele se schimbă o dată pe an, dar nu vrem ca unul înlocuit
        azi să stea în cache-ul cuiva o lună.
      */
      "cache-control": "public, max-age=86400",
    },
  });
}

/**
 * Când fișierul nu e acolo.
 *
 * **O pagină, nu o propoziție pe fond alb.** Adresa asta e capătul unui buton
 * apăsat de o firmă care vrea să sponsorizeze sau de un om care vrea să
 * redirecționeze 3,5%. Un text gol arată ca un site stricat, iar cine crede
 * că site-ul e stricat nu mai încearcă pe altă cale.
 *
 * Codul rămâne 404: fișierul chiar nu e acolo, iar Google n-are ce indexa.
 */
function lipseste(doc: Document | null) {
  const ce = doc ? curat(doc.titlu) : "Documentul";
  const html = `<!doctype html>
<html lang="ro"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${ce} · ${curat(ASOCIATIA.denumire)}</title>
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
  <h1>${ce} nu e încă pe site</h1>
  <p>Îl punem aici imediat ce îl primim. Până atunci ți-l trimitem noi, pe loc:</p>
  <p>
    Sună la <a href="tel:${TELEFON_PRINCIPAL.apel}">${curat(TELEFON_PRINCIPAL.afisat)}</a><br />
    sau scrie la <a href="mailto:${EMAIL.contact}">${curat(EMAIL.contact)}</a>
  </p>
  <a class="inapoi" href="${doc?.unde ?? RUTE.acasa}">← Înapoi pe site</a>
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
