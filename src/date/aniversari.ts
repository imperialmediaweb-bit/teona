/**
 * Modulul „Donează-ți ziua de naștere”.
 *
 * Caietul (2.3) cere doar un buton care duce la Galantom. Formularul de acolo
 * cere ocazia, data, numele, e-mailul, titlul paginii și suma țintă — dar
 * **nu** cere poză și nici descriere. Modulul ăsta adaugă exact partea care
 * lipsește: o pagină pe domeniul asociației, cu poza omului, care arată cum
 * trebuie când e distribuită pe Facebook sau WhatsApp.
 *
 * Butonul de pe pagina de campanie duce la formularul de donație al
 * site-ului, cu slugul campaniei în adresă: donațiile poartă slugul, deci se
 * vede cât a strâns fiecare pagină. Până acum duceau pe altă platformă, și nu
 * se mai știa nimic despre ei.
 */

export const OCAZII = [
  { id: "zi-de-nastere", eticheta: "Ziua mea de naștere" },
  { id: "zi-de-nastere-copil", eticheta: "Ziua copilului meu" },
  { id: "botez", eticheta: "Botez" },
  { id: "nunta", eticheta: "Nuntă" },
  { id: "aniversare", eticheta: "O aniversare" },
  { id: "altceva", eticheta: "Altă ocazie" },
] as const;

export type IdOcazie = (typeof OCAZII)[number]["id"];

export function esteOcazie(valoare: unknown): valoare is IdOcazie {
  return OCAZII.some((o) => o.id === valoare);
}

export function etichetaOcaziei(id: string): string {
  return OCAZII.find((o) => o.id === id)?.eticheta ?? "O ocazie specială";
}

/**
 * Un text gata scris, cu numele omului în el.
 *
 * Cel mai greu lucru dintr-un formular nu e un câmp, e o foaie albă. Cine
 * ajunge aici vrea să ajute, nu să scrie o compunere — iar dacă se blochează
 * la „mesaj”, închide fila și nu se mai întoarce.
 *
 * Textul nu se pune singur peste ce a scris omul: apare la apăsarea unui
 * buton, și rămâne de schimbat cuvânt cu cuvânt. E un punct de plecare, nu o
 * scrisoare semnată de noi în numele lui.
 *
 * **Nicio cifră inventată.** Textele nu spun cât costă ceva și câți copii
 * ajută o sumă: n-avem cifrele acelea, iar un om care le citește le repetă
 * mai departe ca pe adevăr.
 */
export function textGataFacut(ocazie: string, numeIntreg: string): string {
  const nume = numeIntreg.trim().split(/\s+/)[0] || "";
  const eu = nume ? `Eu sunt ${nume} și` : "";

  const final = [
    "Nu am nevoie de cadouri. Mi-aș dori, în schimb, să dăruim împreună ceva copiilor de la Asociația Teona Ariana Suceava — copii cu dizabilități, copii care au trecut prin cancer și familiilor lor.",
    "Orice sumă, oricât de mică, ajunge la ei. Îți mulțumesc din inimă că ai citit până aici.",
  ].join("\n\n");

  switch (ocazie) {
    case "zi-de-nastere":
      return `${eu} îmi sărbătoresc ziua de naștere.\n\n${final}`.trim();
    case "zi-de-nastere-copil":
      return `${eu} sărbătoresc ziua copilului meu.\n\nNe-am gândit că cel mai frumos cadou ar fi unul care ajunge la alți copii.\n\n${final}`.trim();
    case "botez":
      return `${eu} sărbătoresc botezul copilului nostru.\n\nE o zi de bucurie, iar bucuria e mai mare când o împărțim.\n\n${final}`.trim();
    case "nunta":
      return `${eu} ne căsătorim.\n\nAvem tot ce ne trebuie, așa că ne-am gândit să ne bucurăm altfel în ziua asta.\n\n${final}`.trim();
    case "aniversare":
      return `${eu} sărbătoresc o zi importantă pentru mine.\n\n${final}`.trim();
    default:
      return `${eu} am o ocazie specială și vreau s-o sărbătoresc altfel.\n\n${final}`.trim();
  }
}

/**
 * Cât de mare poate fi poza trimisă de un vizitator.
 *
 * Stă aici, nu lângă codul de urcare: formularul rulează în browser, iar
 * modulul de urcare importă `node:crypto`. Un component de client care l-ar
 * importa pentru o singură constantă ar pica la construire.
 */
export const POZA_MAXIM = 6 * 1024 * 1024;

/** Limitele câmpurilor, într-un singur loc: formularul și ruta citesc de aici. */
export const LIMITE = {
  titlu: 80,
  mesaj: 1200,
  numePublic: 60,
  link: 300,
} as const;

export const STARI = ["in_asteptare", "publicata", "respinsa"] as const;
export type Stare = (typeof STARI)[number];

export type Campanie = {
  slug: string;
  ocazie: string;
  titlu: string;
  mesaj: string;
  numePublic: string;
  dataEvenimentului: string | null;
  pozaId: string | null;
  pozaLatime: number | null;
  pozaInaltime: number | null;
  stare: Stare;
  creatLa: string;
};

/** Ce vede asociația în lista de verificat — include și e-mailul. */
export type CampanieDeVerificat = Campanie & { id: string; email: string };
