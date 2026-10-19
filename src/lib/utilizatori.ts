import {
  randomBytes,
  scrypt as scryptCuApel,
  timingSafeEqual,
} from "node:crypto";
import { intreaba } from "./baza";

/**
 * Conturile oamenilor din asociație.
 *
 * Până acum panoul avea **o singură parolă**, în `PAROLA_ADMIN`, pe care o
 * foloseau toți. Pentru doi oameni care se uită peste campanii era de ajuns.
 * Pentru un om de strângere de fonduri nu mai e, din trei motive care n-au
 * nicio legătură cu neîncrederea:
 *
 * - **nu se poate opri unul singur.** Omul pleacă, iar singura cale de a-i
 *   lua accesul e să schimbi parola tuturor — deci să suni pe toată lumea;
 * - **nu se vede cine a făcut ce.** Jurnalul discuțiilor spune „l-am sunat",
 *   nu „cine l-a sunat". Când sună doi oameni, rândul fără nume e aproape
 *   nefolositor: se sună de două ori sau niciodată;
 * - **nu se poate da mai puțin.** Parola deschide tot. Cine vine să ajute cu
 *   firmele primește și Formularele 230, în care stau coduri numerice
 *   personale — date pe care n-are de ce să le vadă ca să-și facă treaba.
 *
 * **Parolă, nu link pe e-mail.** Contul donatorului (`cont.ts`) intră fără
 * parolă, dinadins, și argumentul de acolo rămâne întreg: un donator intră de
 * două ori pe an, ar uita parola, iar o bază cu miile de parole ale unor
 * oameni care le refolosesc e o răspundere pe care asociația n-are cum s-o
 * poarte. Aici e altceva: trei-cinci oameni care intră zilnic. Un link cerut
 * pe e-mail la fiecare intrare ar face munca de zi mai grea decât e, iar
 * cutia poștală ar deveni singura cheie a panoului. Parolele se păstrează
 * trecute prin `scrypt`, cu sare pe fiecare, deci nici cine citește tabelul
 * nu poate intra în niciun cont.
 *
 * **`PAROLA_ADMIN` rămâne.** E cheia de administrator a asociației și calea
 * prin care se face primul cont: fără ea, un tabel gol de utilizatori ar
 * însemna un panou în care nu mai poate intra nimeni.
 */

/**
 * `scrypt` ca promisiune, scris de mână.
 *
 * `promisify` ar fi fost de ajuns, dar tipurile lui aleg varianta cu trei
 * argumente a funcției din Node — fără `options` —, deci `N`, `r` și `p` n-ar
 * mai încăpea. Cu valorile implicite (`N` = 16.384 e tot implicitul, dar
 * nescris) codul ar fi mers și ar fi tăcut despre ce parametri folosește, iar
 * o întărire de mai târziu ar fi devenit o ghicitoare.
 */
function scrypt(
  parola: string,
  sare: Buffer,
  octeti: number,
  optiuni: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((rezolva, respinge) => {
    scryptCuApel(parola, sare, octeti, optiuni, (eroare, cheie) =>
      eroare ? respinge(eroare) : rezolva(cheie),
    );
  });
}

/** Rolurile. Mai multe n-ar fi roluri, ar fi un sistem de drepturi. */
export const ROLURI = ["administrator", "fundraising"] as const;
export type Rol = (typeof ROLURI)[number];

export function esteRol(ce: unknown): ce is Rol {
  return typeof ce === "string" && (ROLURI as readonly string[]).includes(ce);
}

export const NUMELE_ROLULUI: Record<Rol, string> = {
  administrator: "Administrator",
  fundraising: "Strângere de fonduri",
};

/*
  Ce spune rolul despre el însuși.

  Textul trebuie să promită exact cât dă. Un rol al cărui nume sună mai strâmt
  decât e — „strângere de fonduri", care deschide de fapt tot panoul în afară
  de conturi — e felul în care cineva dă mai mult acces decât crede, cu cele
  mai bune intenții și fără să greșească nimic.
*/
export const EXPLICATIA_ROLULUI: Record<Rol, string> = {
  administrator: "Tot panoul, plus conturile celorlalți oameni.",
  fundraising:
    "Tot panoul — bani, donatori, firme, contracte, Formularele 230, scrisul pe site, pozele, Facebook. Singurul lucru care-i lipsește e facerea conturilor.",
};

/**
 * Paginile panoului, fiecare cu rolurile care au voie pe ea.
 *
 * Lista e singurul loc în care se hotărăște cine vede ce: pagina o citește ca
 * să se închidă, meniul ca să nu arate linkuri care duc la un refuz, iar
 * rutele din `/api/admin` ca să nu se poată apela de-a dreptul ce nu se vede
 * în meniu. Un drept uitat într-unul din cele trei locuri e exact felul în
 * care o pagină ascunsă rămâne deschisă pentru cine îi știe adresa.
 *
 * **Un singur lucru nu intră la `fundraising`: `/admin/utilizatori`.** Cine
 * poate face conturi își poate face unul de administrator, deci dreptul ăsta
 * *este* dreptul de administrator; dat altcuiva, rolurile n-ar mai însemna
 * nimic.
 *
 * Restul au intrat toate, la cererea asociației, iar două dintre ele merită
 * scrise negru pe alb, ca să nu pară o scăpare:
 *
 * - `/admin/formulare` — Formularele 230 au **coduri numerice personale** în
 *   ele și legătură de WhatsApp către oameni. Era pagina pe care rolul n-o
 *   avea; o are acum fiindcă redirecționarea a 3,5% din impozit *este* muncă
 *   de strângere de fonduri, iar cine o face trebuie să-i poată suna. Un rol
 *   de fundraising înseamnă deci acces la date personale sensibile — de aceea
 *   contează cui se dă, și de aceea oprirea contului are efect pe loc;
 * - `/admin/scrie`, `/admin/poze`, `/admin/facebook` — scrisul campaniei,
 *   poza ei și trimiterea pe pagina asociației. Fuseseră lăsate deoparte
 *   fiindcă o publicare greșită nu se mai ia înapoi, dar rolul avea deja
 *   șabloanele de e-mail pentru campanii: pleca poșta despre o campanie pe
 *   care omul nu putea s-o creeze.
 */
export const PAGINI: ReadonlyArray<{ cale: string; roluri: readonly Rol[] }> = [
  { cale: "/admin", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/rapoarte", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/analiza", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/radar", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/donatii", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/donatori", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/firme", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/contracte", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/cereri", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/aniversari", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/sabloane", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/emailuri", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/qr", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/presa", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/calendar", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/cauta", roluri: ["administrator", "fundraising"] },
  /*
    Parola proprie o schimbă fiecare, deci pagina e deschisă tuturor.

    Fără ea, parola pusă de administrator la facerea contului ar rămâne pe
    veci parola omului — știută de doi oameni, scrisă probabil pe WhatsApp.
    Pagina nu arată și nu schimbă nimic despre altcineva: se cere parola de
    acum, ca un cookie furat să nu fie de ajuns pentru a lua contul definitiv.
  */
  { cale: "/admin/parola", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/formulare", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/scrie", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/poze", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/testimoniale", roluri: ["administrator", "fundraising"] },
  { cale: "/admin/facebook", roluri: ["administrator", "fundraising"] },
  /* Singura pagină a cărei lipsă deosebește rolurile. Vezi mai sus de ce. */
  { cale: "/admin/utilizatori", roluri: ["administrator"] },
];

/**
 * Are rolul ăsta voie pe pagina asta?
 *
 * O pagină care nu e în listă se refuză, nu se permite. Varianta cealaltă —
 * „nu știu de ea, deci treci" — face ca fiecare pagină nouă să fie deschisă
 * tuturor până își amintește cineva s-o adauge, iar uitarea nu dă nicio
 * eroare: pagina merge, doar că o vede cine nu trebuie.
 */
export function poateVedea(rol: Rol, cale: string): boolean {
  const pagina = PAGINI.find((p) => p.cale === cale);
  return pagina ? pagina.roluri.includes(rol) : false;
}

export type Utilizator = {
  id: string;
  email: string;
  nume: string;
  rol: Rol;
  activ: boolean;
  creatLa: Date;
  intratLa: Date | null;
  areParola: boolean;
};

/*
  Parametrii lui scrypt.

  Memoria cerută e 128 × N × r ≈ 16 MB, sub cei 32 MB pe care Node îi lasă
  implicit. Mai mult ar fi mai bine la o bază de parole mare; aici, cu cinci
  conturi și o intrare pe zi, câștigul n-ar acoperi riscul de a cădea cu
  „memory limit exceeded" pe un container mic de pe Railway.
*/
const SCRYPT = { N: 16_384, r: 8, p: 1, octeti: 64 } as const;

/**
 * Trece parola prin scrypt și întoarce un singur șir, cu tot ce trebuie ca să
 * poată fi verificată mai târziu.
 *
 * Parametrii se scriu **în** șir, nu doar în cod: dacă peste doi ani se
 * întărește `N`, parolele vechi trebuie să se mai poată verifica cu valoarea
 * cu care au fost scrise. Fără ele, o întărire ar da afară toți oamenii din
 * panou, fără niciun mesaj care să spună de ce.
 */
async function trece(parola: string, sare?: Buffer): Promise<string> {
  const s = sare ?? randomBytes(16);
  const cheie = await scrypt(parola.normalize("NFKC"), s, SCRYPT.octeti, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  });
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    s.toString("base64"),
    cheie.toString("base64"),
  ].join("$");
}

/** Cât de scurtă poate fi o parolă de panou. */
export const MINIM_PAROLA = 12;

export async function pregatesteParola(parola: string): Promise<string> {
  if (parola.length < MINIM_PAROLA) {
    throw new Error(`Parola are nevoie de cel puțin ${MINIM_PAROLA} semne.`);
  }
  return trece(parola);
}

/**
 * Verifică o parolă față de ce scrie în baza de date.
 *
 * Comparația e în timp constant. Fără ea, durata răspunsului spune cât din
 * amprentă s-a potrivit, iar din asta se poate reconstrui, octet cu octet.
 */
export async function parolaSePotriveste(
  parola: string,
  pastrat: string | null,
): Promise<boolean> {
  if (!pastrat) return false;
  const parti = pastrat.split("$");
  if (parti.length !== 6 || parti[0] !== "scrypt") return false;

  const N = Number(parti[1]);
  const r = Number(parti[2]);
  const p = Number(parti[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }
  // Un N venit stricat din baza de date ar putea cere gigaocteți de memorie.
  if (N > 1 << 20 || r > 32 || p > 16) return false;

  const sare = Buffer.from(parti[4], "base64");
  const asteptat = Buffer.from(parti[5], "base64");
  let primit: Buffer;
  try {
    primit = await scrypt(parola.normalize("NFKC"), sare, asteptat.length, {
      N,
      r,
      p,
    });
  } catch {
    return false;
  }
  if (primit.length !== asteptat.length) return false;
  return timingSafeEqual(primit, asteptat);
}

/** Adresa, adusă la o formă unică: cheia contului e ea. */
export function normalizeazaEmail(email: string): string {
  return email.trim().toLowerCase();
}

const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS utilizatori (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        text UNIQUE NOT NULL,
    nume         text NOT NULL,
    rol          text NOT NULL DEFAULT 'fundraising',
    parola       text,
    activ        boolean NOT NULL DEFAULT true,
    creat_la     timestamptz NOT NULL DEFAULT now(),
    intrat_la    timestamptz,
    schimbat_la  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS utilizatori_activi ON utilizatori (activ, nume);
`;

let gata: Promise<void> | null = null;

/**
 * Creează tabelul la prima folosire.
 *
 * Separat de schema din `baza.ts`, nu lipit la ea: tabelul ăsta se citește la
 * **fiecare** cerere din panou, deci trebuie să existe înainte de orice
 * altceva. Dacă n-a mers, următoarea cerere încearcă din nou.
 */
async function pregateste(): Promise<void> {
  gata ??= intreaba(DEFINITIE)
    .then(() => undefined)
    .catch((eroare) => {
      gata = null;
      throw eroare;
    });
  return gata;
}

type Rand = {
  id: string;
  email: string;
  nume: string;
  rol: string;
  parola: string | null;
  activ: boolean;
  creat_la: Date;
  intrat_la: Date | null;
};

/**
 * Un rând stricat nu dă afară tot panoul.
 *
 * Rolul vine din baza de date, iar acolo poate ajunge orice — o scriere de
 * mână, un rol scos din cod după ce fusese dat cuiva. Un rol necunoscut se
 * citește ca `fundraising`, cel mai strâmt, nu ca administrator.
 */
function cites(rand: Rand): Utilizator {
  return {
    id: rand.id,
    email: rand.email,
    nume: rand.nume,
    rol: esteRol(rand.rol) ? rand.rol : "fundraising",
    activ: rand.activ,
    creatLa: rand.creat_la,
    intratLa: rand.intrat_la,
    areParola: Boolean(rand.parola),
  };
}

const COLOANE = "id, email, nume, rol, parola, activ, creat_la, intrat_la";

export async function utilizatorDupaId(id: string): Promise<Utilizator | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await pregateste();
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM utilizatori WHERE id = $1`,
    [id],
  );
  return randuri[0] ? cites(randuri[0]) : null;
}

export async function listaUtilizatorilor(): Promise<Utilizator[]> {
  await pregateste();
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM utilizatori ORDER BY activ DESC, nume`,
  );
  return randuri.map(cites);
}

export async function cutiUtilizatori(): Promise<number> {
  await pregateste();
  const randuri = await intreaba<{ nr: string }>(
    "SELECT count(*)::text AS nr FROM utilizatori WHERE activ",
  );
  return Number(randuri[0]?.nr ?? 0);
}

/**
 * Intrarea cu e-mail și parolă.
 *
 * Întoarce `null` la orice nepotrivire, fără să spună care: nici „nu există
 * adresa", nici „parola e greșită". Altfel formularul de intrare devine un
 * instrument de aflat cine lucrează la asociație.
 *
 * Parola se verifică **și** când contul nu există sau e oprit, cu o amprentă
 * de aruncat. Fără asta, răspunsul pentru o adresă necunoscută vine în
 * milisecunde și cel pentru una cunoscută în zeci — iar din diferența aia se
 * citește lista de adrese, oricât de la fel ar suna mesajele.
 */
export async function intraCuParola(
  email: string,
  parola: string,
): Promise<Utilizator | null> {
  await pregateste();
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM utilizatori WHERE email = $1`,
    [normalizeazaEmail(email)],
  );
  const rand = randuri[0];
  const bun = await parolaSePotriveste(parola, rand?.parola ?? MOMEALA);
  if (!rand || !rand.activ || !rand.parola || !bun) return null;

  await intreaba("UPDATE utilizatori SET intrat_la = now() WHERE id = $1", [
    rand.id,
  ]).catch(() => undefined);
  return cites(rand);
}

/*
  O amprentă adevărată, de o parolă pe care n-o știe nimeni, folosită doar ca
  verificarea să dureze la fel când contul nu există. Nu e un secret: rostul
  ei e să coste aceleași zeci de milisecunde.
*/
const MOMEALA =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "cGFyb2xhIGNhcmUgbnUgZXhpc3RhIG5pY2kgbnUgdHJlYnVpZSBzYSBleGlzdGUgdmUyMDI2";

export async function faceUtilizator(date: {
  email: string;
  nume: string;
  rol: Rol;
  parola: string;
}): Promise<Utilizator | null> {
  await pregateste();
  const parola = await pregatesteParola(date.parola);
  const randuri = await intreaba<Rand>(
    `INSERT INTO utilizatori (email, nume, rol, parola)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING ${COLOANE}`,
    [normalizeazaEmail(date.email), date.nume.trim(), date.rol, parola],
  );
  return randuri[0] ? cites(randuri[0]) : null;
}

export async function schimbaParola(
  id: string,
  parola: string,
): Promise<boolean> {
  await pregateste();
  const trecuta = await pregatesteParola(parola);
  const randuri = await intreaba<{ id: string }>(
    `UPDATE utilizatori SET parola = $2, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, trecuta],
  );
  return randuri.length > 0;
}

/**
 * Schimbă parola proprie, după ce o dovedești cu cea de acum.
 *
 * Parola veche se cere chiar dacă omul e deja conectat: un cookie furat sau un
 * laptop lăsat deschis ar fi altfel de ajuns ca să iei contul definitiv, nu
 * doar să te uiți prin el până expiră sesiunea.
 */
export async function schimbaParolaProprie(
  id: string,
  veche: string,
  noua: string,
): Promise<"ok" | "veche-greșită" | "nu-există"> {
  await pregateste();
  const randuri = await intreaba<Rand>(
    `SELECT ${COLOANE} FROM utilizatori WHERE id = $1`,
    [id],
  );
  const rand = randuri[0];
  // Verificăm și când rândul lipsește, ca durata să nu spună dacă există.
  const bun = await parolaSePotriveste(veche, rand?.parola ?? MOMEALA);
  if (!rand || !rand.activ) return "nu-există";
  if (!bun) return "veche-greșită";
  await schimbaParola(id, noua);
  return "ok";
}

export async function schimbaRolul(id: string, rol: Rol): Promise<boolean> {
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE utilizatori SET rol = $2, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, rol],
  );
  return randuri.length > 0;
}

/**
 * Oprește sau repornește un cont.
 *
 * Nu se șterge rândul: jurnalul discuțiilor trimite la el, iar un „l-a sunat
 * cineva care nu mai există" e mai rău decât un nume de om plecat. Oprit
 * înseamnă că nu mai poate intra, de îndată — cookie-ul lui e verificat la
 * fiecare cerere, nu doar la intrare.
 */
export async function schimbaStarea(
  id: string,
  activ: boolean,
): Promise<boolean> {
  await pregateste();
  const randuri = await intreaba<{ id: string }>(
    `UPDATE utilizatori SET activ = $2, schimbat_la = now()
      WHERE id = $1 RETURNING id`,
    [id, activ],
  );
  return randuri.length > 0;
}
