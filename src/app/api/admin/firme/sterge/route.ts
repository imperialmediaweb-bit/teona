import { arePermisiune } from "@/lib/admin";
import { cuBaza, formularAdmin, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { stergeSauArhiveazaFirma } from "@/lib/crm";

/**
 * Șterge o firmă (lead) cu discuția și atașamentele ei — numai rolul de
 * administrator (`/admin/firme/sterge` în `PAGINI`). Cu contracte sau donații
 * legate, o arhivează în loc s-o șteargă. Confirmarea se cere în pagină.
 */
export const POST = cuBaza(async (cerere: Request) => {
  if (!(await arePermisiune("/admin/firme/sterge"))) return sesiuneExpirata();
  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const id = String(citit.formular.get("firma") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Firma nu există.", 400);
  const rez = await stergeSauArhiveazaFirma(id);
  if (rez === "nu-exista") return raspuns("Firma nu există.", 404);
  return trimiteLa(`/admin/firme?${rez === "stearsa" ? "stearsa" : "arhivata"}=1`);
});

export const GET = () => raspuns("Metodă nepermisă.", 405);
