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
