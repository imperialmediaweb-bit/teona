import { cuBaza, formularAdmin, limitaDeRata, nuTrece, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { scrieNotita, uitaDonatorul } from "@/lib/plati/donatori";

/** Acțiunile din lista de donatori: notiță sau ștergerea datelor personale. */
export const POST = cuBaza(posteaza);

async function posteaza(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-donatori",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/donatori"))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const { formular } = citit;

  const email = String(formular.get("email") ?? "").trim();
  const fapta = String(formular.get("fapta") ?? "");
  if (!email) return nuTrece("Lipsește adresa.");

  if (fapta === "uita") {
    await uitaDonatorul(email);
  } else if (fapta === "notita") {
    await scrieNotita(email, String(formular.get("text") ?? "").slice(0, 2000));
  } else {
    return nuTrece("Acțiune necunoscută.");
  }

  return trimiteLa("/admin/donatori");
}
