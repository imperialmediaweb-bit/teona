import { revalidateTag } from "next/cache";
import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { POZA_MAXIM, areCloudinary, tipDinOcteti, urcaPoza } from "@/lib/poza-urcata";
import { PREFIX_CLOUD } from "@/lib/cloud";
import { campPanou } from "@/lib/camp-panou";
import { ETICHETA_ECHIPA, faceMembru, schimbaMembru } from "@/lib/echipa";
import { mutaInLista, stareInLista } from "@/lib/lista-panou";

/** Echipa de pe „Despre noi”: adaugă, schimbă (și poza), scoate, mută. */
const INAPOI = "/admin/echipa";
const gata = (cod: string) => trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
const ACUM = { expire: 0 };

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "admin-echipa", maxim: 60, fereastraMs: 10 * 60 * 1000 });
  if (prea) return prea;
  if (!(await arePermisiune(INAPOI))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const f = citit.formular;
  const fel = String(f.get("fel") ?? "");
  const id = String(f.get("id") ?? "").trim();

  if (fel === "opreste" || fel === "porneste") {
    const ok = await stareInLista("echipa", id, fel === "porneste").catch(() => false);
    if (ok) revalidateTag(ETICHETA_ECHIPA, ACUM);
    return gata(ok ? "stare" : "necunoscut");
  }
  if (fel === "sus" || fel === "jos") {
    const ok = await mutaInLista("echipa", id, fel).catch(() => false);
    if (ok) revalidateTag(ETICHETA_ECHIPA, ACUM);
    return gata(ok ? "mutat" : "necunoscut");
  }

  const nume = campPanou(f.get("nume"), 80);
  const rol = campPanou(f.get("rol"), 80);
  const descriere = campPanou(f.get("descriere"), 400);
  if (nume.prea || rol.prea || descriere.prea) return gata("lung");
  if (!nume.text) return gata("nume");

  // Poza e opțională: fără ea, cardul arată inițialele.
  let poza: string | undefined;
  const fisier = f.get("poza");
  if (fisier instanceof File && fisier.size > 0) {
    if (fisier.size > POZA_MAXIM) return gata("mare");
    const octeti = new Uint8Array(await fisier.arrayBuffer());
    const tip = tipDinOcteti(octeti);
    if (!tip) return gata("imagine");
    if (!areCloudinary()) return gata("depozit");
    const urcata = await urcaPoza(octeti, tip, "echipa").catch(() => null);
    if (!urcata) return gata("urcare");
    poza = `${PREFIX_CLOUD}${urcata.id}`;
  }

  const membru = {
    nume: nume.text,
    rol: rol.text ?? undefined,
    descriere: descriere.text ?? undefined,
    poza,
  };
  const ok = id
    ? await schimbaMembru(id, membru).catch(() => false)
    : await faceMembru(membru).catch(() => false);
  if (ok) revalidateTag(ETICHETA_ECHIPA, ACUM);
  return gata(ok ? (id ? "schimbat" : "facut") : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
