import { formularCuLimita, limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import { foloseșteJeton } from "@/lib/cont";
import { deschideSesiunea } from "@/lib/sesiune";

/**
 * Butonul „Intră în cont” de pe `/contul-meu/intra`: consumă jetonul și
 * deschide sesiunea. Prin POST, ca un scaner de e-mail care deschide linkul
 * să nu ardă jetonul înaintea omului (vezi pagina).
 *
 * După consum, omul e dus la `/contul-meu` fără niciun parametru: jetonul
 * nu rămâne în bara de adrese după ce a fost folosit.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "cont-intra",
    maxim: 20,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await formularCuLimita(cerere, 8 * 1024);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const jeton = String(formular.get("jeton") ?? "");
  const email = await foloseșteJeton(jeton).catch(() => null);
  if (!email) return trimiteLa("/contul-meu?expirat=1");

  await deschideSesiunea(email);
  return trimiteLa("/contul-meu");
}
