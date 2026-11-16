import type { ReactNode } from "react";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

/**
 * Ușa paginilor de mesaje cu firmele: aceeași ca la Firme, din care fac
 * parte. Întoarce ce se arată în loc de pagină, sau `null` dacă se intră.
 */
export async function poarta(titlu: string, activ: string, gresit?: string): Promise<ReactNode | null> {
  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu={titlu} activ={activ}>
        <p className="max-w-2xl text-amplu text-cerneala-moale">Panoul nu e configurat. Setează PAROLA_ADMIN în Railway.</p>
      </Cadru>
    );
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ={activ} faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde={activ} />
      </Cadru>
    );
  }
  if (!(await arePermisiune("/admin/firme"))) return <FaraDrept titlu={titlu} activ={activ} />;
  if (!areBazaDeDate()) {
    return (
      <Cadru titlu={titlu} activ={activ}>
        <p className="max-w-2xl text-amplu text-cerneala-moale">Lipsește DATABASE_URL.</p>
      </Cadru>
    );
  }
  return null;
}
