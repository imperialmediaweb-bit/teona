/**
 * Modulul „Donează-ți ziua de naștere”.
 *
 * Caietul (2.3) cere doar un buton care duce la Galantom. Formularul de acolo
 * cere ocazia, data, numele, e-mailul, titlul paginii și suma țintă — dar
 * **nu** cere poză și nici descriere. Modulul ăsta adaugă exact partea care
 * lipsește: o pagină pe domeniul asociației, cu poza omului, care arată cum
 * trebuie când e distribuită pe Facebook sau WhatsApp.
 *
 * Banii nu trec pe aici. Site-ul încă nu încasează, iar o pagină care ar
 * strânge donații fără procesator ar fi un buton fals. Butonul de pe pagina
 * de campanie duce la Galantom: la pagina personală a omului, dacă ne-a dat
 * linkul, altfel la proiectul asociației.
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
  linkGalantom: string | null;
  stare: Stare;
  creatLa: string;
};

/** Ce vede asociația în lista de verificat — include și e-mailul. */
export type CampanieDeVerificat = Campanie & { id: string; email: string };
