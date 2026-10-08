import { cacheLife } from "next/cache";

/**
 * Anul curent, pe server.
 *
 * Cu Cache Components pornit, Next refuză `new Date()` la pregenerare: valoarea
 * s-ar îngheța la momentul build-ului, iar site-ul ar afișa un an vechi până la
 * următoarea publicare. Funcția cu memorie de câteva ore rămâne randată pe
 * server și se împrospătează singură.
 *
 * Folosită de rândul de copyright din subsol și de termenele-limită anuale de
 * pe paginile Redirecționează 3,5% și Direcționează 20%.
 */
export async function anulCurent(): Promise<number> {
  "use cache";
  cacheLife("hours");
  return new Date().getFullYear();
}
