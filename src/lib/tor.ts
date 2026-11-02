import { isIP } from "node:net";

/**
 * Nodurile de ieșire din rețeaua Tor, de la care nu se primesc formulare.
 *
 * În octombrie 2026, toate cele zece încercări de a crea o campanie de
 * aniversare cu litere la întâmplare („jfqbwd”) și toate cele opt cereri
 * aruncate în formularul de card au venit prin Tor — fiecare de la alt nod,
 * deci limitele pe adresă nu le vedeau. Un formular de donație lovit din
 * spatele anonimatului e semnul obișnuit al testării cardurilor furate, iar o
 * pagină de campanie publicată de un robot ar sta pe domeniul asociației.
 *
 * Paginile se citesc normal și din Tor; numai trimiterea e oprită, cu un
 * mesaj care spune unde se poate scrie.
 *
 * Lista vine de la Tor Project și se reîmprospătează din oră în oră. Dacă nu
 * se poate lua, se lasă totul să treacă: un formular blocat pentru toată lumea
 * din cauza unei liste e mai rău decât un robot în plus.
 */
const SURSA = "https://check.torproject.org/torbulkexitlist";
const ORA_MS = 60 * 60 * 1000;

let lista = new Set<string>();
let luataLa = 0;
let inCurs: Promise<void> | null = null;

async function reimprospateaza(): Promise<void> {
  try {
    const r = await fetch(SURSA, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const noua = new Set(
        (await r.text()).split(/\s+/).filter((x) => isIP(x) !== 0),
      );
      // O listă aproape goală e un răspuns stricat, nu o rețea Tor goală.
      if (noua.size > 100) lista = noua;
    }
  } catch {
    // Rămâne lista de dinainte (sau niciuna).
  } finally {
    luataLa = Date.now();
    inCurs = null;
  }
}

export async function eNodTor(ip: string): Promise<boolean> {
  if (Date.now() - luataLa > ORA_MS && !inCurs) inCurs = reimprospateaza();
  // Prima cerere de după pornire așteaptă lista, dar cel mult trei secunde.
  if (lista.size === 0 && inCurs) {
    await Promise.race([inCurs, new Promise((r) => setTimeout(r, 3000))]);
  }
  return lista.has(ip);
}
