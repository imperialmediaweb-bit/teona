import { cacheLife } from "next/cache";

/**
 * Cât ține în cache ce se scrie din panou.
 *
 * **De ce nu „hours".** Railway construiește cu `DATABASE_URL` pus, dar fără
 * acces la baza de date, deci la build fiecare citire de aici cade și în cache
 * intră **rezerva din cod**. Cu un profil de o oră, site-ul arăta o oră
 * întreagă după fiecare publicare cifrele și textele de la lansare, nu pe cele
 * puse de asociație. Omul schimba o cifră luni, eu publicam marți, iar cifra
 * lui dispărea pentru o oră — fără să înțeleagă nimeni de ce.
 *
 * Eticheta rezolvă cazul obișnuit: o salvare din panou golește cache-ul și
 * schimbarea se vede pe loc. Fereastra asta acoperă numai cazul celălalt — ce
 * se întâmplă după o publicare, când nimeni n-a salvat nimic.
 *
 * Cinci minute, nu cinci secunde: sunt interogări mici, dar care se fac la
 * randarea paginilor celor mai citite. Scrise ca numere, nu ca nume de profil,
 * ca să se vadă cât e fără să caute nimeni ce înseamnă „minutes".
 */
/**
 * Cât ține **rezerva din cod**, când baza n-a răspuns.
 *
 * Fereastra de cinci minute de mai sus e bună pentru ce vine din baza de
 * date. Dar la build, pe Railway, baza nu răspunde, și în cache intră rezerva
 * — cu aceleași cinci minute. După fiecare publicare, primul vizitator vedea
 * cele 30 de sigle de la lansare, nu cele 54 din panou, și la fel cifrele și
 * textele. Clientul a numărat: „acolo sunt 30 de firme, și eu am 55?”.
 *
 * O valoare despre care codul *știe* că e rezerva nu merită ținută: zece
 * secunde, apoi se reîncearcă pe fundal la prima cerere — deci cel mult un
 * vizitator o mai vede, al doilea primește baza de date. Cu baza căzută
 * de-adevăratelea, rezerva se servește în continuare, doar că se reîncearcă
 * des; e un preț mic pentru ca panoul să se vadă pe loc.
 *
 * `expire` rămâne la 300: e `MIN_PRERENDERABLE_EXPIRE` din Next
 * (`use-cache/constants.js`) — o intrare cu expirare mai scurtă e socotită
 * „date dinamice” și build-ul cade cu „uncached or runtime data during
 * prerendering”. Încercat cu 120: a căzut exact așa.
 *
 * Se cheamă **pe lângă** `cachePanou()`, din ramura de rezervă: Next ia
 * minimul dintre toate apelurile `cacheLife` din aceeași funcție
 * (`use-cache/cache-life.js`), deci nu trebuie restructurat nimic.
 */
export function cacheRezerva() {
  cacheLife({ revalidate: 10, expire: 300 });
}

export function cachePanou() {
  cacheLife({
    /** Cât se servește fără nicio verificare. */
    stale: 60,
    /** După atât se reîmprospătează pe fundal, la prima cerere. */
    revalidate: 300,
    /** Cât se mai poate servi dacă baza nu răspunde deloc. */
    expire: 86_400,
  });
}
