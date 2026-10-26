import { cacheTag } from "next/cache";
import { cachePanou, cacheRezerva } from "./cache-panou";
import { areR2, legaturaSemnata } from "@/lib/r2";
import { DOCUMENTE } from "@/lib/documente";

/**
 * Care documente au chiar un fișier în spate.
 *
 * **De ce se verifică, în loc să se presupună.** Caietul cere la 7.5 ca
 * butoanele de descărcare să rămână **inactive** până vin documentele, iar
 * `DocumentDeDescarcat` desenează deja cardul altfel când n-are fișier. Un
 * buton care arată a buton și nu descarcă nimic e varianta cea mai proastă:
 * omul îl apasă de trei ori și crede că site-ul e stricat. Deci pagina
 * trebuie să știe ce există, nu doar ce ar putea exista.
 *
 * **Verificarea stă în alt fișier decât lista.** `lib/documente.ts` e date
 * curate și o citesc și pagini care n-au ce face cu R2; aici intră `r2.ts`,
 * cu semnături și crypto. Aceeași lecție ca la tipul `Cifra`: un import
 * nevinovat trage după el o bibliotecă de server într-un loc în care n-are ce
 * căuta, și nu se vede la verificarea de tipuri.
 *
 * **Un document cu rezervă în depozitul de cod e întotdeauna gata.** Cele două
 * contracte există de dinainte, ca fișiere în `public/`; ruta publică le
 * servește de acolo cât timp nu s-a urcat nimic în R2.
 */

/** Eticheta cache-ului. Se golește când asociația urcă un document. */
export const ETICHETA_DOCUMENTE = "documente";

/**
 * Se cere un singur octet, nu tot fișierul.
 *
 * `Range: bytes=0-0` întoarce 206 și un octet. Legătura semnată e semnată
 * pentru GET, deci un HEAD n-ar trece verificarea — iar un GET întreg ar
 * descărca zece megaocteți de contract la fiecare randare a paginii, doar ca
 * să afle dacă fișierul e acolo.
 */
async function exista(cheie: string): Promise<boolean> {
  const legatura = legaturaSemnata(cheie, 120);
  if (!legatura) return false;
  try {
    const r = await fetch(legatura, {
      headers: { range: "bytes=0-0" },
      signal: AbortSignal.timeout(8000),
    });
    return r.ok || r.status === 206;
  } catch {
    return false;
  }
}

/**
 * Slugurile documentelor care se pot descărca acum.
 *
 * Dacă R2 nu răspunde, rămân cele cu rezervă în depozit — nu se pierde ce
 * funcționează deja. Cache cu etichetă, ca paginile publice să poată fi
 * pregenerate: altfel construirea s-ar opri cu „uncached or runtime data
 * during prerendering", iar o verificare la fiecare cerere ar însemna trei
 * cereri către R2 pentru fiecare vizitator.
 */
export async function documenteGata(): Promise<ReadonlyArray<string>> {
  "use cache";
  cachePanou();
  cacheTag(ETICHETA_DOCUMENTE);

  const cuRezerva = DOCUMENTE.filter((d) => d.rezerva).map((d) => d.slug);
  if (!areR2()) return cuRezerva;

  const verificate = await Promise.all(
    DOCUMENTE.map(
      async (d): Promise<string | null> =>
        d.rezerva || (await exista(d.cheie)) ? d.slug : null,
    ),
  ).catch((): Array<string | null> => {
    // Rezerva nu se ține: după publicare, primul vizitator să vadă panoul.
    cacheRezerva();
    return [];
  });

  const gata = verificate.filter((s): s is string => s !== null);
  return gata.length > 0 ? gata : cuRezerva;
}
