import { NextResponse } from "next/server";
import {
  email as citesteEmail,
  esteRobot,
  limitaDeRata,
  raspuns,
  text,
} from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { creeazaCampanie } from "@/lib/campanii";
import { anuntaAsociatia, campanieTrimisa } from "@/lib/email/campanie";
import {
  POZA_MAXIM,
  areCloudinary,
  pareImagine,
  urcaPoza,
} from "@/lib/poza-urcata";
import { LIMITE, esteOcazie } from "@/date/aniversari";

/**
 * Crearea unei campanii aniversare.
 *
 * Primește `multipart/form-data`, nu JSON, pentru că poate aduce o poză.
 * Campania intră întotdeauna cu starea `in_asteptare`: nimic nu apare pe
 * domeniul asociației înainte să se uite un om peste text și peste poză.
 * Site-ul e al unei asociații de copii; aici nu există variantă de publicare
 * automată.
 */

/** Cel mult atât: poza are plafonul ei, restul câmpurilor sunt text scurt. */
const LIMITA_CERERE = POZA_MAXIM + 64 * 1024;

const GALANTOM = /^https:\/\/([a-z0-9-]+\.)*galantom\.ro\//i;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "campanii",
    maxim: 3,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  const tip = (cerere.headers.get("content-type") ?? "").toLowerCase();
  if (!tip.includes("multipart/form-data")) {
    return raspuns("Cerere invalidă.", 415);
  }

  const anuntat = Number(cerere.headers.get("content-length"));
  if (Number.isFinite(anuntat) && anuntat > LIMITA_CERERE) {
    return raspuns("Poza e prea mare. Alege una de cel mult 6 MB.", 413);
  }

  let formular: FormData;
  try {
    formular = await cerere.formData();
  } catch {
    return raspuns("Cerere invalidă.", 400);
  }

  const camp = (nume: string) => {
    const v = formular.get(nume);
    return typeof v === "string" ? v : "";
  };

  // Capcana pentru roboți: răspundem ca și cum a mers, fără să scriem nimic.
  if (esteRobot({ site_web: camp("site_web") })) {
    return NextResponse.json(
      { slug: "", jeton: "" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!areBazaDeDate()) {
    return raspuns(
      "Momentan nu putem salva campanii. Scrie-ne la contact@teona-ariana.ro și o facem noi, manual.",
      503,
    );
  }

  const ocazie = camp("ocazie");
  if (!esteOcazie(ocazie)) return raspuns("Alege ocazia campaniei.", 400);

  const titlu = text(camp("titlu"), LIMITE.titlu);
  if (!titlu) return raspuns("Scrie un titlu pentru pagina ta.", 400);

  const mesaj = text(camp("mesaj"), LIMITE.mesaj);
  if (!mesaj) return raspuns("Scrie câteva rânduri despre campania ta.", 400);

  const numePublic = text(camp("nume_public"), LIMITE.numePublic);
  if (!numePublic) return raspuns("Scrie numele care apare pe pagină.", 400);

  const email = citesteEmail(camp("email"));
  if (!email) return raspuns("Introdu o adresă de e-mail validă.", 400);

  if (camp("acord") !== "da") {
    return raspuns("Bifează acordul pentru a continua.", 400);
  }

  const dataBruta = camp("data_evenimentului").trim();
  let dataEvenimentului: string | null = null;
  if (dataBruta) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataBruta)) {
      return raspuns("Data nu e scrisă corect.", 400);
    }
    dataEvenimentului = dataBruta;
  }

  const linkBrut = camp("link_galantom").trim();
  if (linkBrut) {
    if (linkBrut.length > LIMITE.link || !GALANTOM.test(linkBrut)) {
      return raspuns("Linkul trebuie să fie o adresă de pe galantom.ro.", 400);
    }
  }

  // ─── Poza ───────────────────────────────────────────────────────────────
  let pozaId: string | null = null;
  let pozaLatime: number | null = null;
  let pozaInaltime: number | null = null;

  const fisier = formular.get("poza");
  if (fisier instanceof File && fisier.size > 0) {
    if (fisier.size > POZA_MAXIM) {
      return raspuns("Poza e prea mare. Alege una de cel mult 6 MB.", 413);
    }
    if (!areCloudinary()) {
      return raspuns(
        "Momentan nu putem primi poze. Trimite campania fără poză și o adăugăm noi.",
        503,
      );
    }
    const octeti = new Uint8Array(await fisier.arrayBuffer());
    if (!pareImagine(fisier.type, octeti)) {
      return raspuns("Poza trebuie să fie un fișier JPG, PNG sau WebP.", 415);
    }
    const urcata = await urcaPoza(octeti, fisier.type);
    if (!urcata) {
      return raspuns(
        "Nu am putut încărca poza. Încearcă din nou sau trimite campania fără ea.",
        502,
      );
    }
    pozaId = urcata.id;
    pozaLatime = urcata.latime;
    pozaInaltime = urcata.inaltime;
  }

  try {
    const { slug, jeton } = await creeazaCampanie({
      ocazie,
      titlu,
      mesaj,
      numePublic,
      email,
      dataEvenimentului,
      pozaId,
      pozaLatime,
      pozaInaltime,
      linkGalantom: linkBrut || null,
    });

    // E-mailurile pleacă după ce campania e salvată, și nu pot anula salvarea:
    // omul și-a scris textul o dată. Dacă Resend nu răspunde, campania rămâne
    // în listă, iar linkul privat se vede oricum pe ecran.
    await Promise.allSettled([
      campanieTrimisa({ email, numePublic, titlu, slug, jeton }),
      anuntaAsociatia({ numePublic, titlu, email }),
    ]);

    return NextResponse.json(
      { slug, jeton },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return raspuns(
      "Nu am putut salva campania. Încearcă din nou peste câteva minute.",
      503,
    );
  }
}
