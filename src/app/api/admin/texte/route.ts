import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import {
  creeazaText,
  esteFel,
  schimbaText,
  stergeText,
  textDupaId,
} from "@/lib/texte";
import { POZA_MAXIM, pareImagine, urcaPoza } from "@/lib/poza-urcata";
import { citesteSuma, laBan } from "@/lib/suma";

/**
 * Salvarea unei noutăți sau a unei campanii scrise din panou.
 *
 * Un singur capăt pentru toate trei acțiunile — salvează ciorna, publică,
 * șterge — pentru că formularul e același și pentru că butonul apăsat spune
 * care dintre ele e. Trei rute ar fi însemnat trei verificări de acces și trei
 * locuri în care să uiți una.
 *
 * **Poza se urcă în Cloudinary, nu pe disc.** Discul containerului dispare la
 * fiecare publicare, iar o noutate de acum trei luni și-ar pierde fotografia.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-texte",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();
  const actiune = camp("actiune");
  const id = camp("id");

  if (actiune === "sterge") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Text necunoscut.", 400);
    const text = await textDupaId(id);
    await stergeText(id);
    return inapoi(cerere, text?.fel ?? "noutate", "sters");
  }

  const fel = camp("fel");
  if (!esteFel(fel)) return raspuns("Fel necunoscut.", 400);

  const titlu = camp("titlu");
  if (titlu.length < 3) {
    return raspuns("Scrie un titlu de cel puțin trei litere.", 400);
  }
  const continut = camp("continut");
  if (continut.length < 20) {
    return raspuns("Scrie textul: cel puțin câteva fraze.", 400);
  }
  if (titlu.length > 200 || camp("rezumat").length > 400) {
    return raspuns("Titlul sau rezumatul e prea lung.", 400);
  }
  if (continut.length > 40_000) {
    return raspuns("Textul e prea lung.", 400);
  }

  /*
    Ținta campaniei e opțională, dar dacă e scrisă trebuie să fie o sumă.
    `citesteSuma` înțelege și „12.500", și „12500,50" — aceeași funcție care
    citește sumele în calculatorul de sponsorizare.
  */
  let tintaBani: number | null = null;
  if (fel === "campanie" && camp("tinta")) {
    const suma = citesteSuma(camp("tinta"));
    if (suma.suma === null) {
      return raspuns("Ținta campaniei nu pare o sumă în lei.", 400);
    }
    // În bani, ca `donatii.suma_bani`: o singură unitate în toată baza de
    // date înseamnă o grijă mai puțin la fiecare comparație.
    tintaBani = Math.round(laBan(suma.suma) * 100);
  }

  // Poza e opțională la salvare: la editare, lipsa ei înseamnă „păstrează ce
  // era”, nu „șterge poza”.
  let poza: {
    id: string;
    latime: number;
    inaltime: number;
    alt: string;
  } | null = null;

  const fisier = formular.get("poza");
  if (fisier instanceof File && fisier.size > 0) {
    if (fisier.size > POZA_MAXIM) {
      return raspuns("Poza e prea mare.", 400);
    }
    const alt = camp("poza_alt");
    if (alt.length < 5) {
      return raspuns(
        "Scrie ce se vede în poză. Fără descriere, poza nu există pentru cineva care nu vede.",
        400,
      );
    }
    const octeti = new Uint8Array(await fisier.arrayBuffer());
    if (!pareImagine(fisier.type, octeti)) {
      return raspuns("Fișierul nu pare o fotografie (JPG, PNG sau WebP).", 400);
    }
    const urcata = await urcaPoza(octeti, fisier.type, "noutati");
    if (!urcata) return raspuns("Nu am putut urca poza. Încearcă din nou.", 502);
    poza = { ...urcata, alt };
  } else if (camp("poza_alt")) {
    // Fără fișier nou, dar cu descriere schimbată: se păstrează poza și i se
    // schimbă doar descrierea.
    const vechi = id ? await textDupaId(id) : null;
    if (vechi?.poza) {
      poza = { ...vechi.poza, alt: camp("poza_alt") };
    }
  }

  const date = {
    titlu,
    rezumat: camp("rezumat"),
    continut,
    poza,
    tintaBani,
    publicat: actiune === "publica",
  };

  if (/^[0-9a-f-]{36}$/i.test(id)) {
    await schimbaText(id, date);
    return inapoi(cerere, fel, actiune === "publica" ? "publicat" : "salvat", id);
  }

  const nou = await creeazaText({ ...date, fel });
  return inapoi(cerere, fel, actiune === "publica" ? "publicat" : "salvat", nou);
}

function inapoi(
  cerere: Request,
  fel: string,
  ce: string,
  id?: string,
): NextResponse {
  const unde = id
    ? `/admin/scrie/${id}?gata=${ce}`
    : `/admin/scrie?fel=${fel}&gata=${ce}`;
  return NextResponse.redirect(new URL(unde, cerere.url), { status: 303 });
}
