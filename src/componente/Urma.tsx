"use client";

import { useEffect } from "react";
import { tineMinteUrma } from "@/lib/atribuire-browser";

/**
 * Ține minte de unde a venit omul, cât ține fila.
 *
 * Nu randează nimic și nu cere nimic de la nimeni; vezi
 * `src/lib/atribuire-browser.ts` pentru ce se păstrează (două cuvinte despre
 * canal, niciun identificator) și de ce nu atârnă de bannerul de cookie-uri.
 */
export default function Urma() {
  useEffect(() => {
    tineMinteUrma();
  }, []);
  return null;
}
