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
 * **Taberele din 2025.** Exportul WordPress se oprește în noiembrie 2024, așa
 * că anul 2025 lipsea cu totul de pe site. Cele patru tabere de aici au fost
 * reconstituite din numele folderelor de poze din Cloudinary, scrise de
 * asociație: grupul de copii și datele exacte sunt acolo („TABĂRĂ NEVĂZĂTORI
 * 9-13 IUNIE 2025”). Formularea titlurilor o urmează pe cea pe care asociația
 * o folosește deja pe proiectele mai vechi („copii cu deficiențe grave de
 * vedere”), nu eticheta scurtă din folder.
 *
 * Doar una dintre ele are descriere — cea din 8–12 septembrie, pentru care
 * asociația a trimis textul. Celelalte trei au titlu, dată și fotografii.
 *
 * **O tabără lipsește încă.** Materialele conțineau și a 29-a tabără RESPIRO,
 * fără nicio dată. Fără dată nu poate fi așezată pe pagina Proiecte, care e
 * organizată pe ani, nu poate primi o adresă stabilă și nu-și poate găsi
 * folderul de poze. Se adaugă în clipa în care asociația spune când a fost.
 *
 * **Pozele nu sunt scrise aici.** Proiectele de mai jos au `poze: []` și
 * `coperta: null` intenționat: fotografiile se iau din Cloudinary, din
 * folderul cu aceeași dată — vezi `proiecte-cloud.ts`.
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
  {
    slug: "tabara-respiro-mame-si-copii-cu-autism-septembrie-2025",
    titlu: "Tabăra RESPIRO — mame și copii cu autism",
    data: "2025-09-08",
    dataCitita: "8 – 12 septembrie 2025",
    categorie: "2025",
    coperta: null,
    poze: [],
    descriere: [
      "„Această Tabără RESPIRO este despre a învăța să mergem mai departe împreună!” — cu sentimentul ăsta au plecat acasă mamele și copiii care au stat, între 8 și 12 septembrie 2025, la pensiunea La Brazi din Vama.",
      "Pentru multe mame, mereu în căutarea unor răspunsuri la întrebările pe care autismul le ridică, tabăra a însemnat mai mult decât o pauză: un loc unde au găsit ascultare, sprijin și încurajare. Au stat de vorbă cu o psihologă de la DGASPC Suceava, cu un preot și cu un pastor, iar emoțiile grele au primit nume și înțelegere.",
      "Copiii au încercat tiroliana, pictura, modelajul și jocurile, fiecare după puterile și ritmul lui, alături de voluntari. Șase fizioterapeute voluntare au ținut ședințe de masaj pentru mame. Tabăra s-a încheiat cu o fotografie de grup.",
      "Proiectul „Tabăra RESPIRO – Recuperare, Integrare și Respiro pentru copii cu nevoi speciale și părinți din județul Suceava” s-a făcut cu sprijinul Consiliului Județean Suceava, prin finanțare nerambursabilă acordată în baza Legii nr. 350/2005. Tarsin a asigurat transportul, iar DGASPC Suceava a fost partener.",
    ],
  },
  {
    slug: "tabara-respiro-copii-cu-autism-15-19-septembrie-2025",
    titlu: "Tabăra RESPIRO pentru copii cu autism",
    data: "2025-09-15",
    dataCitita: "15 – 19 septembrie 2025",
    categorie: "2025",
    coperta: null,
    poze: [],
    descriere: [],
  },
  {
    slug: "tabara-respiro-copii-cu-deficiente-de-auz-si-vorbire-iunie-2025",
    titlu: "Tabăra RESPIRO pentru copii cu deficiențe de auz și vorbire",
    data: "2025-06-16",
    dataCitita: "16 – 20 iunie 2025",
    categorie: "2025",
    coperta: null,
    poze: [],
    descriere: [],
  },
  {
    slug: "tabara-respiro-copii-cu-deficiente-grave-de-vedere-iunie-2025",
    titlu: "Tabăra RESPIRO pentru copii cu deficiențe grave de vedere",
    data: "2025-06-09",
    dataCitita: "9 – 13 iunie 2025",
    categorie: "2025",
    coperta: null,
    poze: [],
    descriere: [],
  },
];
