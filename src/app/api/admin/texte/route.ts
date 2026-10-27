import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ETICHETA_PROIECTE_PANOU } from "@/date/proiecte";
import { limitaDeRata, nuTrece, raspuns, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
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

  if (!(await arePermisiune("/admin/scrie"))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();
  const actiune = camp("actiune");
  const id = camp("id");

  if (actiune === "sterge") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return nuTrece("Text necunoscut.");
    const text = await textDupaId(id);
    await stergeText(id);
    return inapoi(cerere, text?.fel ?? "noutate", "sters");
  }

  const fel = camp("fel");
  if (!esteFel(fel)) return nuTrece("Fel necunoscut.");

  const titlu = camp("titlu");
  if (titlu.length < 3) {
    return nuTrece("Scrie un titlu de cel puțin trei litere.");
  }
  const continut = camp("continut");
  if (continut.length < 20) {
    return nuTrece("Scrie textul: cel puțin câteva fraze.");
  }
  if (titlu.length > 200 || camp("rezumat").length > 400) {
    return nuTrece("Titlul sau rezumatul e prea lung.");
  }
  if (continut.length > 40_000) {
    return nuTrece("Textul e prea lung.");
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
      return nuTrece("Ținta campaniei nu pare o sumă în lei.");
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
      return nuTrece("Poza e prea mare.");
    }
    const alt = camp("poza_alt");
    if (alt.length < 5) {
      return nuTrece("Scrie ce se vede în poză. Fără descriere, poza nu există pentru cineva care nu vede.");
    }
    const octeti = new Uint8Array(await fisier.arrayBuffer());
    if (!pareImagine(fisier.type, octeti)) {
      return nuTrece("Fișierul nu pare o fotografie (JPG, PNG sau WebP).");
    }
    const urcata = await urcaPoza(octeti, fisier.type, "noutati");
    if (!urcata)
      return nuTrece("Nu am putut urca poza. Încearcă din nou.", 502);
    poza = { ...urcata, alt };
  } else if (camp("poza_alt")) {
    // Fără fișier nou, dar cu descriere schimbată: se păstrează poza și i se
    // schimbă doar descrierea.
    const vechi = id ? await textDupaId(id) : null;
    if (vechi?.poza) {
      poza = { ...vechi.poza, alt: camp("poza_alt") };
    }
  }

  /*
    Datele unui proiect: când a fost și unde-i sunt pozele.

    `data_inceput` e cheia de ordonare și ce intră în `<time>`; `data_citita`
    e ce vede omul („9 – 13 iunie 2025”), scris de cine adaugă tabăra,
    pentru că o tabără ține cinci zile, nu una, iar o dată singură ar minți.
    Categoria se deduce din an dacă nu e aleasă alta: altfel tabăra nouă nu
    s-ar vedea sub niciun filtru de pe pagina Proiecte.
  */
  const dataInceput = camp("dataInceput") || null;
  if (dataInceput && !/^\d{4}-\d{2}-\d{2}$/.test(dataInceput)) {
    return nuTrece("Data de început trebuie să fie o zi din calendar.");
  }

  const categorie =
    camp("categorie") ||
    (dataInceput
      ? Number(dataInceput.slice(0, 4)) >= 2026
        ? "2026"
        : dataInceput.slice(0, 4) === "2025"
          ? "2025"
          : "2021-2024"
      : null);

  const date = {
    titlu,
    rezumat: camp("rezumat"),
    continut,
    poza,
    tintaBani,
    dataInceput: fel === "proiect" ? dataInceput : null,
    dataCitita: fel === "proiect" ? camp("dataCitita") || null : null,
    dosarCloud: fel === "proiect" ? camp("dosarCloud") || null : null,
    categorie: fel === "proiect" ? categorie : null,
    publicat: actiune === "publica",
  };

  if (/^[0-9a-f-]{36}$/i.test(id)) {
    await schimbaText(id, date);
    // Descrierile taberelor se citesc dintr-un cache cu etichetă. Fără
    // golirea asta, omul publică și nu vede nimic schimbat pe site.
    if (fel === "proiect") revalidateTag(ETICHETA_PROIECTE_PANOU, "max");
    return inapoi(
      cerere,
      fel,
      actiune === "publica" ? "publicat" : "salvat",
      id,
    );
  }

  /*
    Slugul cerut vine dintr-un câmp ascuns, pus de butonul „Scrie descrierea"
    de pe lista de proiecte. Numai la proiecte: noutățile și campaniile nu
    înlocuiesc nicio pagină din cod, deci n-au de ce să-și aleagă adresa.
  */
  if (fel === "proiect") revalidateTag(ETICHETA_PROIECTE_PANOU, "max");
  const nou = await creeazaText(
    { ...date, fel },
    fel === "proiect" ? camp("slug") : undefined,
  );
  return inapoi(
    cerere,
    fel,
    actiune === "publica" ? "publicat" : "salvat",
    nou,
  );
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
  return trimiteLa(unde);
}
