import { cookies } from "next/headers";
import { limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import {
  COOKIE_DISPOZITIV,
  VIATA_DISPOZITIV_S,
  arePermisiune,
  cineEsteConectat,
  cititDispozitivul,
  valoareaDispozitivului,
} from "@/lib/admin";
import {
  intraCuParola,
  pinValid,
  puneCodRapid,
  stergeCodRapid,
} from "@/lib/utilizatori";

/**
 * Codul de intrare rapidă: pus, șters, și dispozitivul uitat.
 *
 * Pusul cere parola de acum, ca la schimbarea parolei: un laptop lăsat
 * deschis nu trebuie să fie de ajuns ca cineva să-și facă o cheie a lui.
 * Pusul ține minte și dispozitivul, altfel codul n-ar avea unde să meargă.
 */
const INAPOI = "/admin/parola";

function gata(cod: string) {
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-cod-rapid",
    maxim: 10,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;
  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const cine = await cineEsteConectat();
  if (cine?.fel !== "cont") return gata("fara-cont");

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);
  const ce = String(formular.get("ce") ?? "");
  const id = cine.utilizator.id;

  if (ce === "uita") {
    const r = gata("dispozitiv-uitat");
    r.cookies.set(COOKIE_DISPOZITIV, "", { path: "/", maxAge: 0 });
    return r;
  }

  const parola = String(formular.get("parola") ?? "");
  const bun = await intraCuParola(cine.utilizator.email, parola).catch(() => null);
  if (!bun || bun.id !== id) return gata("veche");

  if (ce === "sterge") {
    await stergeCodRapid(id);
    return gata("cod-sters");
  }

  const cod = String(formular.get("cod") ?? "").trim();
  const iar = String(formular.get("iar") ?? "").trim();
  if (!pinValid(cod)) return gata("cod-format");
  if (cod !== iar) return gata("cod-diferit");
  if (!(await puneCodRapid(id, cod))) return gata("necunoscut");

  const r = gata("cod-pus");
  // Dispozitivul de pe care s-a pus codul e ținut minte, ca să-l poată folosi.
  if (cititDispozitivul((await cookies()).get(COOKIE_DISPOZITIV)?.value) !== id) {
    const d = valoareaDispozitivului(id);
    if (d)
      r.cookies.set(COOKIE_DISPOZITIV, d, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: VIATA_DISPOZITIV_S,
      });
  }
  return r;
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
