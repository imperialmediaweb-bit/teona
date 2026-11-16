import { formularAdmin, limitaDeRata, nuTrece, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { opresteEmailurile, pornesteEmailurile } from "@/lib/mesaje-firme";

/** Din panou: „Nu mai scrie acestei firme” sau, după ce a cerut-o, „Vrea iar e-mailuri”. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "admin-firme-refuz", maxim: 60, fereastraMs: 60 * 60 * 1000 });
  if (prea) return prea;
  if (!(await arePermisiune("/admin/firme"))) return sesiuneExpirata();
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const id = String(citit.formular.get("firma") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return nuTrece("Firma nu există.");
  const cine = (await cineEsteConectat())?.nume ?? "Asociația";
  if (citit.formular.get("fac") === "porneste") await pornesteEmailurile(id, cine);
  else await opresteEmailurile(id, cine);
  return trimiteLa(`/admin/firme/${id}/mesaje#jos`);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
