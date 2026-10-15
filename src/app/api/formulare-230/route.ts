import { email as emailValid, esteRobot, limitaDeRata, raspuns, text } from "@/lib/api";
import { areBazaDeDate } from "@/lib/baza";
import { areR2, urcaInR2 } from "@/lib/r2";
import { salveazaFormular230 } from "@/lib/formulare230";
import { EMAIL, TELEFON_PRINCIPAL } from "@/date/asociatie";

/**
 * Formularul 230 completat pe hârtie, fotografiat și trimis înapoi.
 *
 * **Fotografia nu ține loc de hârtie.** Originalul semnat tot trebuie să
 * ajungă la asociație — ANAF îl poate cere. Răspunsul spune asta limpede, ca
 * nimeni să nu creadă că a terminat când a apăsat trimite.
 *
 * **Fișierul pleacă direct în R2, privat.** Nu trece prin disc, nu rămâne
 * nicăieri pe server, și nu există nicio adresă permanentă către el: panoul
 * cere o legătură semnată, valabilă zece minute, de fiecare dată.
 *
 * Pe un formular 230 scrie nume, adresă, **CNP** și o semnătură. De aceea
 * acordul e separat și explicit, limita de rată e strânsă, iar fișierul se
 * acceptă doar dacă octeții lui chiar arată a fotografie sau a PDF.
 */

const MAXIM_OCTETI = 8 * 1024 * 1024;

/** Ce se acceptă, verificat pe octeți, nu pe ce declară browserul. */
const TIPURI: Array<{ tip: string; extensie: string; semn: number[] }> = [
  { tip: "application/pdf", extensie: "pdf", semn: [0x25, 0x50, 0x44, 0x46] },
  { tip: "image/jpeg", extensie: "jpg", semn: [0xff, 0xd8, 0xff] },
  { tip: "image/png", extensie: "png", semn: [0x89, 0x50, 0x4e, 0x47] },
  { tip: "image/webp", extensie: "webp", semn: [0x52, 0x49, 0x46, 0x46] },
];

function recunoaste(octeti: Uint8Array) {
  return TIPURI.find((t) => t.semn.every((o, i) => octeti[i] === o)) ?? null;
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "formular-230",
    maxim: 5,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => String(formular.get(nume) ?? "").trim();

  if (esteRobot(Object.fromEntries(formular.entries()))) {
    return raspuns("Mulțumim! Am primit formularul.", 200);
  }

  const nume = text(camp("nume"), 120);
  if (!nume || nume.length < 2) {
    return raspuns("Scrie-ți numele, ca să știm al cui e formularul.", 400);
  }
  if (!emailValid(camp("email"))) {
    return raspuns("Introdu o adresă de e-mail validă.", 400);
  }
  if (formular.get("acord") !== "da") {
    return raspuns("Bifează acordul pentru a putea trimite formularul.", 400);
  }

  const fisier = formular.get("fisier");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return raspuns("Alege fotografia sau PDF-ul formularului completat.", 400);
  }
  if (fisier.size > MAXIM_OCTETI) {
    return raspuns(
      "Fișierul e prea mare. O fotografie de până la 8 MB e mai mult decât destul.",
      400,
    );
  }

  const octeti = new Uint8Array(await fisier.arrayBuffer());
  const fel = recunoaste(octeti);
  if (!fel) {
    return raspuns(
      "Fișierul nu pare o fotografie sau un PDF. Acceptăm JPG, PNG, WebP și PDF.",
      400,
    );
  }

  if (!areR2() || !areBazaDeDate()) {
    return raspuns(
      `Primirea formularelor pe site nu e încă pornită. Trimite-l pe ${EMAIL.contact} sau sună la ${TELEFON_PRINCIPAL.afisat}.`,
      503,
    );
  }

  /*
    Cheia conține ziua și un număr întâmplător, nu numele omului.

    Cine ar vedea vreodată lista de chei n-ar afla din ea cine a trimis ce;
    legătura dintre fișier și persoană stă în baza de date, la care se ajunge
    numai cu parola panoului.
  */
  const zi = new Date().toISOString().slice(0, 10);
  const cheie = `formulare-230/${zi}/${crypto.randomUUID()}.${fel.extensie}`;

  const urcat = await urcaInR2(cheie, octeti, fel.tip);
  if (!urcat) {
    return raspuns(
      "N-am putut primi fișierul acum. Mai încearcă peste câteva minute.",
      502,
    );
  }

  await salveazaFormular230({
    nume,
    email: camp("email"),
    telefon: camp("telefon") || null,
    fisierCheie: cheie,
    fisierTip: fel.tip,
    octeti: fisier.size,
  });

  return raspuns(
    "Am primit formularul. Trimite-ne și hârtia semnată, în original — fără ea ANAF nu poate înregistra redirecționarea.",
    200,
  );
}
