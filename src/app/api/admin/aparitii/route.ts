import { revalidateTag } from "next/cache";
import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { campPanou } from "@/lib/camp-panou";
import { ETICHETA_APARITII, faceAparitie, schimbaAparitie } from "@/lib/aparitii";
import { mutaInLista, stareInLista } from "@/lib/lista-panou";

/** Aparițiile de pe „Suntem în presă”: adaugă, schimbă, scoate, mută. */
const INAPOI = "/admin/aparitii";
const gata = (cod: string) => trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
const ACUM = { expire: 0 };

/** O adresă de pe internet, sau nimic. Un link fără `https://` nu duce nicăieri. */
function adresaBuna(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "admin-aparitii", maxim: 60, fereastraMs: 10 * 60 * 1000 });
  if (prea) return prea;
  if (!(await arePermisiune(INAPOI))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const f = citit.formular;
  const fel = String(f.get("fel") ?? "");
  const id = String(f.get("id") ?? "").trim();

  if (fel === "opreste" || fel === "porneste") {
    const ok = await stareInLista("aparitii_presa", id, fel === "porneste").catch(() => false);
    if (ok) revalidateTag(ETICHETA_APARITII, ACUM);
    return gata(ok ? "stare" : "necunoscut");
  }
  if (fel === "sus" || fel === "jos") {
    const ok = await mutaInLista("aparitii_presa", id, fel).catch(() => false);
    if (ok) revalidateTag(ETICHETA_APARITII, ACUM);
    return gata(ok ? "mutat" : "necunoscut");
  }

  const publicatie = campPanou(f.get("publicatie"), 80);
  const data = campPanou(f.get("data"), 40);
  const titlu = campPanou(f.get("titlu"), 300);
  const adresa = campPanou(f.get("adresa"), 500);
  if ([publicatie, data, titlu, adresa].some((c) => c.prea)) return gata("lung");
  if (!publicatie.text) return gata("publicatie");
  if (!titlu.text) return gata("titlu");
  if (!data.text) return gata("data");
  // Anul se citește din dată: lista se împarte pe ani.
  const an = data.text.match(/\b(19|20)\d{2}\b/)?.[0];
  if (!an) return gata("an");
  if (adresa.text && !adresaBuna(adresa.text)) return gata("adresa");
  const link = adresa.text ?? undefined;
  // Filmările de pe Facebook se arată în pagină, cu playerul lor.
  const incorporare =
    link && /^https:\/\/(www\.)?facebook\.com\/(reel|watch|[^/]+\/videos)/.test(link) ? link : undefined;

  const aparitie = { publicatie: publicatie.text, data: data.text, an, titlu: titlu.text, adresa: link, incorporare };
  const ok = id
    ? await schimbaAparitie(id, aparitie).catch(() => false)
    : await faceAparitie(aparitie).catch(() => false);
  if (ok) revalidateTag(ETICHETA_APARITII, ACUM);
  return gata(ok ? (id ? "schimbat" : "facut") : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
