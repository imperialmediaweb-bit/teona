import { cineEsteConectat } from "@/lib/admin";
import { intreaba } from "@/lib/baza";
import { raspuns } from "@/lib/api";
import { adresaDeProba } from "@/lib/proba";

/**
 * Curățenia de după o probă automată pe site-ul adevărat.
 *
 * Proba completează formularele publice cu adresa de probă (`PROBA_EMAIL`) și
 * lucrează pe rândurile astea din panou. Panoul nu șterge cereri, firme sau
 * donații — dinadins, pentru oamenii adevărați —, deci fără ruta asta proba ar
 * lăsa urme în CRM-ul asociației. Șterge **numai** rândurile cu adresa de
 * probă și numai pentru intrarea de probă; un cont sau parola asociației
 * primesc 403.
 */
export async function POST() {
  const cine = await cineEsteConectat();
  if (cine?.fel !== "proba") return raspuns("Nu.", 403);
  const e = adresaDeProba();
  if (!e) return raspuns("PROBA_EMAIL lipsește.", 503);

  const sters: Record<string, number> = {};
  const sterge = async (nume: string, sql: string) => {
    const r = await intreaba<{ x: number }>(`WITH d AS (${sql} RETURNING 1 AS x) SELECT count(*)::int AS x FROM d`, [e]).catch(
      (err) => {
        console.error(`[curata-proba] ${nume}: ${(err as Error).message}`);
        return [{ x: -1 }];
      },
    );
    sters[nume] = r[0]?.x ?? 0;
  };

  await sterge("contracte", "DELETE FROM contracte WHERE firma_id IN (SELECT id FROM firme WHERE lower(email) = lower($1))");
  await sterge("interactiuni", "DELETE FROM interactiuni WHERE lower(email) = lower($1) OR firma_id IN (SELECT id FROM firme WHERE lower(email) = lower($1))");
  await sterge("firme", "DELETE FROM firme WHERE lower(email) = lower($1)");
  await sterge("raspunsuri", "DELETE FROM raspunsuri_voluntari WHERE cerere_id IN (SELECT id FROM cereri WHERE lower(email) = lower($1))");
  await sterge("apeluri", "DELETE FROM apeluri_voluntari a WHERE a.creat_de = 'Probă automată' AND $1 <> '' AND NOT EXISTS (SELECT 1 FROM raspunsuri_voluntari r WHERE r.apel_id = a.id)");
  await sterge("cereri", "DELETE FROM cereri WHERE lower(email) = lower($1)");
  await sterge("donatii", "DELETE FROM donatii WHERE lower(email) = lower($1)");
  await sterge("note_donatori", "DELETE FROM note_donatori WHERE lower(email) = lower($1)");
  await sterge("jetoane_cont", "DELETE FROM jetoane_cont WHERE lower(email) = lower($1)");
  await sterge("aniversari", "DELETE FROM campanii_aniversare WHERE lower(email) = lower($1)");
  await sterge("plati_esuate", "DELETE FROM plati_esuate WHERE lower(email) = lower($1)");
  await sterge("abonati_buletin", "DELETE FROM abonati_buletin WHERE lower(email) = lower($1)");
  await sterge("contacte_presa", "DELETE FROM contacte_presa WHERE lower(email) = lower($1)");

  return Response.json({ sters }, { headers: { "Cache-Control": "no-store" } });
}
