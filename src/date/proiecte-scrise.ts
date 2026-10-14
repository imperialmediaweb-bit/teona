import type { ProiectAfisat } from "./proiecte-tipuri";

/**
 * Proiectele scrise de mână, cu descriere.
 *
 * Restul proiectelor vin din exportul WordPress și au doar titlu, dată și
 * poze: textele de acolo erau postări de Facebook, cu nume de familii și
 * diagnostice de copii, pe care caietul interzice să le publicăm. Astea de
 * aici sunt scrise din materialele trimise de asociație în octombrie 2026.
 *
 * **Ce s-a scos din textele primite.** Erau postări de Facebook, cu emoji și
 * cu liste lungi de mulțumiri: vreo șaizeci de nume și prenume de voluntari,
 * kinetoterapeuți, medici, psihologi și preoți. Pe Facebook e un lucru; pe
 * site-ul asociației, publicate permanent și indexate de Google, sunt datele
 * personale ale unor oameni care n-au semnat nimic pentru asta. Caietul însuși
 * cere, la testimoniale, „prenumele și rolul, fără nume de familie”.
 *
 * Instituțiile și firmele au rămas: un sponsor e mulțumit public, e parte din
 * înțelegere, iar o firmă nu e o persoană. Dacă asociația vrea și numele
 * oamenilor, are nevoie de acordul fiecăruia.
 *
 * **Ce nu s-a adăugat.** Nicio cifră care nu era în materialul primit. Unde
 * textul spunea „38 de copii”, scrie 38; unde nu spunea nimic, nu scrie nimic.
 *
 * **Două tabere lipsesc încă.** Materialele mai conțineau o tabără pentru mame
 * și copii cu autism (8–12 septembrie, fără an) și a 29-a tabără RESPIRO (fără
 * nicio dată). Fără an nu pot fi așezate pe pagina Proiecte, care e organizată
 * pe ani, și nici nu pot primi o adresă stabilă. Se adaugă în clipa în care
 * asociația spune datele.
 */

/** Un proiect scris de mână: ca cele din export, plus descrierea. */
export type ProiectScris = ProiectAfisat & { descriere: readonly string[] };

export const PROIECTE_SCRISE: readonly ProiectScris[] = [
  {
    slug: "tabara-respiro-sustinem-performanta-iulie-2026",
    titlu: "Tabăra RESPIRO — Susținem performanța",
    data: "2026-07-06",
    dataCitita: "6 – 10 iulie 2026",
    categorie: "2026",
    coperta: null,
    poze: [],
    descriere: [
      "Tabăra a adus împreună 38 de copii și tineri din sistemul de protecție socială din județul Suceava, premiați pentru rezultatele obținute la învățătură, în artă și în sport. Cinci zile la Pensiunea „La Brazi” din Vama, între 6 și 10 iulie 2026.",
      "Programul a mers dincolo de pensiune: Mocănița „Huțulca”, roata panoramică, telegondola și pista de coaster din Gura Humorului au primit grupul, iar în tabără au fost activități, jocuri și timp de odihnă.",
      "Proiectul s-a făcut cu finanțare nerambursabilă de la Consiliul Județean Suceava, în baza Legii 350/2005, și cu sprijinul Direcției Generale de Asistență Socială și Protecția Copilului Suceava. Au fost alături Nolte Suceava, Manaz & Co, Sorghe Spedition, Montage Construct A.G. și cotidianul Monitorul de Suceava.",
    ],
  },
  {
    slug: "respiro-impreuna-a-32-a-tabara-septembrie-2026",
    titlu: "Respiro. Împreună — a 32-a tabără",
    data: "2026-08-31",
    dataCitita: "31 august – 4 septembrie 2026",
    categorie: "2026",
    coperta: null,
    poze: [],
    descriere: [
      "A 32-a tabără a asociației și prima din regiunea Moldovei dedicată copiilor aflați în remisiune după cancer și familiilor lor. Douăsprezece familii au venit la Vama fără grija costurilor, între 31 august și 4 septembrie 2026.",
      "Tabăra a pornit de la un lucru simplu: când un copil trece prin cancer, prin cancer trece toată familia, iar după tratament familia are nevoie de timp ca să-și regăsească ritmul. Cinci zile în care boala n-a fost în centrul tuturor lucrurilor — înot, dans, desen, tiroliană, plimbări și o zi la Mănăstirea Voroneț.",
      "Medicii au venit fără halat și psihologii fără cabinet: discuțiile au pornit de la ce trăiesc familiile cu adevărat — frica de recidivă, oboseala, relația dintre frați, întrebarea „cum mergem mai departe de aici”.",
      "Alături au fost Consiliul Județean Suceava, Destine Broker de Asigurare, DEM Consulting, Rocast Nord, Tudia, YuliDey Spedition, Farmacia Oana Maria, Cofetăria SCALA și Ariniș Park. Au adus oameni și competențe Spitalul Clinic Județean de Urgență „Sf. Ioan cel Nou” Suceava, Facultatea de Medicină și Științe Biologice a Universității „Ștefan cel Mare”, Colegiul Psihologilor din România – Filiala Suceava, ParentEase, DGASPC Suceava și Asociația SOS Surâs.",
    ],
  },
  {
    slug: "tabara-respiro-septembrie-2026",
    titlu: "Tabăra RESPIRO — ediția EGGER",
    data: "2026-09-07",
    dataCitita: "7 – 11 septembrie 2026",
    categorie: "2026",
    coperta: null,
    poze: [],
    descriere: [
      "Cinci zile la Pensiunea La Brazi din Vama, între 7 și 11 septembrie 2026, pentru copii cu nevoi speciale și pentru părinții lor. Copiii au avut activități creative, jocuri și mișcare; părinții, timp de odihnă, discuții și sprijin.",
      "Au fost alături un preot, un pastor și o psihologă, pentru cine a vrut să stea de vorbă, iar kinetoterapeuții voluntari au ținut ședințe de masaj pentru mame și pentru voluntari.",
      "Ediția a fost susținută de EGGER Group. Au mai fost alături Direcția Generală de Asistență Socială și Protecția Copilului Suceava, și Tarsin, care a asigurat transportul.",
    ],
  },
];
