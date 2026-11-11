"use client";

import { useSyncExternalStore } from "react";

const nimic = () => () => {};

/**
 * O adresă de e-mail scrisă de o componentă din browser.
 *
 * Cloudflare ascunde adresele din HTML („Email Address Obfuscation”): le
 * înlocuiește cu `[email protected]` și un script le pune la loc. Într-o
 * componentă care se hidratează, React găsește în pagină altceva decât a
 * desenat și aruncă eroarea #418 — prinsă pe 11 noiembrie 2026 la
 * `/admin/presa`, numai pe site-ul adevărat (local nu e Cloudflare).
 *
 * Așa că adresa nu se scrie în HTML-ul de la server: apare după hidratare.
 * Într-o pagină de server ajunge ca adresa să aibă elementul ei, nu lipită
 * de alt text: vezi `TextCuAdrese`.
 */
export default function Adresa({ children }: { children: string }) {
  const inBrowser = useSyncExternalStore(nimic, () => true, () => false);
  return <>{inBrowser ? children : ""}</>;
}
