/**
 * Ce fel de poză e un fișier ales în browser — citit din primii octeți, nu
 * din eticheta pe care o pune sistemul de operare.
 *
 * Pe Windows, un `.jpg` poate veni cu `type` gol sau greșit, după ce program
 * e legat de extensie. Un cod care cere „image/jpeg” înainte să se uite la
 * fișier sare peste poza aia în tăcere, iar omul vede o imagine ruptă fără
 * nicio explicație. Octeții din cap nu mint: FF D8 FF e JPEG, 89 50 4E 47 e
 * PNG, RIFF…WEBP e WebP.
 */
export type TipPoza = "image/jpeg" | "image/png" | "image/webp";

export async function tipulPozei(f: Blob): Promise<TipPoza | null> {
  const cap = new Uint8Array(await f.slice(0, 16).arrayBuffer());
  if (cap[0] === 0xff && cap[1] === 0xd8 && cap[2] === 0xff) return "image/jpeg";
  if (cap[0] === 0x89 && cap[1] === 0x50 && cap[2] === 0x4e && cap[3] === 0x47) return "image/png";
  if (
    cap[0] === 0x52 && cap[1] === 0x49 && cap[2] === 0x46 && cap[3] === 0x46 &&
    cap[8] === 0x57 && cap[9] === 0x45 && cap[10] === 0x42 && cap[11] === 0x50
  )
    return "image/webp";
  return null;
}

/**
 * Poza ca `data:`, cu tipul citit din conținut. `readAsDataURL` pune tipul
 * fișierului, care pe Windows poate fi gol — și atunci browserul nu știe că
 * e o imagine.
 */
export async function pozaInPagina(f: Blob, tip: TipPoza): Promise<string> {
  const brut = await new Promise<string>((r, nu) => {
    const c = new FileReader();
    c.onload = () => r(String(c.result));
    c.onerror = () => nu(c.error);
    c.readAsDataURL(f);
  });
  return brut.replace(/^data:[^;,]*/, `data:${tip}`);
}

/**
 * HTML-ul previzualizării, pregătit pentru cadru.
 *
 * Două înlocuiri, **în ordinea asta**: întâi semnul de loc al pozei alese
 * (`blob:https://teona-ariana.ro/…`) devine poza scrisă în pagină; abia apoi
 * adresele site-ului se scriu relativ, pentru regula de securitate a
 * panoului, care lasă poze numai de pe adresa exactă a paginii. Invers,
 * regula a doua tăia domeniul și din semnul de loc, iar poza aleasă apărea
 * ruptă — **numai pe site**, unde semnul de loc poartă domeniul; pe
 * localhost nu-l poartă, și probele treceau. Prins de fundraiser pe 4
 * noiembrie 2026, la a treia încercare.
 */
export function htmlPentruCadru(
  text: string,
  semnDeLoc: string | null,
  pozaInPagina: string | null,
): string {
  let html = text.replace(/<head>/i, '<head><base target="_blank">');
  if (semnDeLoc && pozaInPagina) html = html.replaceAll(semnDeLoc, pozaInPagina);
  return html.replace(/(?<!blob:)https?:\/\/(www\.)?teona-ariana\.ro\//g, "/");
}
