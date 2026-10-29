import { createHmac } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { egale } from "./comparatie";
import { cheiaDeSemnat } from "./cheie-semnare";
import {
  type Rol,
  type Utilizator,
  poateVedea,
  utilizatorDupaId,
} from "./utilizatori";

/**
 * Intrarea în panou.
 *
 * Două căi, dinadins:
 *
 * - **`PAROLA_ADMIN`** — cheia asociației. Deschide tot, nu are nume și nu
 *   lasă urmă. Rămâne pentru că fără ea un tabel gol de utilizatori ar
 *   însemna un panou în care nu mai poate intra nimeni, și pentru că din ea
 *   se face primul cont;
 * - **cont propriu** (`utilizatori.ts`) — e-mail și parolă, cu rol. Ce vede
 *   omul atârnă de rol, iar oprirea contului îl dă afară de îndată.
 *
 * Nici într-un caz, nici în celălalt parola nu umblă prin adresă — ar ajunge
 * în istoricul browserului și în jurnalele serverului. Se trimite prin POST,
 * iar ce rămâne în browser e un cookie `httpOnly` cu o semnătură.
 */

export const COOKIE_ADMIN = "teona_verificare";

/** Cât ține sesiunea. Douăsprezece ore: o zi de lucru, nu o săptămână. */
const VIATA_S = 12 * 60 * 60;

/**
 * Cu „Ține-mă minte pe acest dispozitiv”: treizeci de zile. Numai pentru
 * conturi, nu pentru parola asociației — aia n-are nume și deschide tot.
 * Contul se citește oricum din baza de date la fiecare cerere, deci un om
 * oprit iese pe loc, oricât ar mai ține cookie-ul.
 */
export const VIATA_LUNGA_S = 30 * 24 * 60 * 60;

/** Cât ține minte un dispozitiv, pentru intrarea cu codul rapid. */
export const VIATA_DISPOZITIV_S = 90 * 24 * 60 * 60;

/** Cookie-ul care spune „pe dispozitivul ăsta a intrat X cu parola”. */
export const COOKIE_DISPOZITIV = "teona_dispozitiv";

function cheie(): string | null {
  const parola = process.env.PAROLA_ADMIN;
  return parola && parola.length >= 12 ? parola : null;
}

/** Cheia sesiunilor de cont: numai `SECRET_SESIUNE` (vezi `cheie-semnare.ts`). */
function cheieSesiune(): string | null {
  return cheiaDeSemnat();
}

/** Amprenta unei parole, pentru comparația în timp constant. */
function semnatura(parola: string): string {
  return createHmac("sha256", parola)
    .update("verificare-campanii")
    .digest("hex");
}

/*
  Cookie-ul dat de parola asociației: `k:<expiră>:<semnătură>`.

  Până în octombrie 2026 era o valoare fixă, aceeași la fiecare intrare și
  fără nicio expirare în ea: cele 12 ore le respecta numai browserul, iar o
  valoare copiată o dată mergea până la schimbarea parolei. Acum expirarea e
  semnată, ca la conturi, și o verifică serverul. Semnat cu parola însăși,
  deci schimbarea ei în Railway închide pe loc toate sesiunile deschise cu ea.
*/
function semneazaCheia(parola: string, expira: number): string {
  return createHmac("sha256", parola).update(`cheie:${expira}`).digest("hex");
}

function cookieCheieValid(brut: string): boolean {
  const parola = cheie();
  if (!parola || !brut.startsWith("k:")) return false;
  const parti = brut.split(":");
  if (parti.length !== 3) return false;
  const expira = Number(parti[1]);
  if (!Number.isInteger(expira) || expira * 1000 <= Date.now()) return false;
  // Nu mai mult decât poate da intrarea: o expirare împinsă în viitor nu trece.
  if (expira - Math.floor(Date.now() / 1000) > VIATA_S + 60) return false;
  return egale(parti[2], semneazaCheia(parola, expira));
}

/** Comparație în timp constant: altfel durata răspunsului trădează parola. */
export function parolaCorecta(incercare: string): boolean {
  const parola = cheie();
  if (!parola) return false;
  return egale(semnatura(incercare), semnatura(parola));
}

export function valoareaCookieului(): string | null {
  const parola = cheie();
  if (!parola) return null;
  const expira = Math.floor(Date.now() / 1000) + VIATA_S;
  return `k:${expira}:${semneazaCheia(parola, expira)}`;
}

export function areParolaConfigurata(): boolean {
  return cheie() !== null;
}

/*
  Cookie-ul unui cont: `u:<id>:<expiră>:<semnătură>`.

  Expirarea stă **în** semnătură, nu doar în `maxAge`. `maxAge` e o rugăminte
  făcută browserului: cine păstrează valoarea cookie-ului o poate trimite și
  peste un an. Ceasul care contează e al serverului.

  Identificatorul, nu adresa de e-mail: o adresă se schimbă, iar un rând de
  jurnal legat de ea ar rămâne în urmă.
*/
function semneazaSesiunea(id: string, expira: number): string | null {
  const c = cheieSesiune();
  if (!c) return null;
  return createHmac("sha256", c)
    .update(`panou:${id}:${expira}`)
    .digest("hex");
}

export function valoareaCookieuluiUtilizator(
  id: string,
  viataS: number = VIATA_S,
): string | null {
  const expira = Math.floor(Date.now() / 1000) + viataS;
  const sem = semneazaSesiunea(id, expira);
  return sem ? `u:${id}:${expira}:${sem}` : null;
}

/*
  Cookie-ul de dispozitiv: `d:<id>:<expiră>:<semnătură>`, cu alt prefix în
  semnătură decât sesiunea, ca unul să nu poată fi folosit în locul celuilalt.
  Singur nu deschide nimic: spune doar cui îi cere pagina de intrare codul.
*/
function semneazaDispozitivul(id: string, expira: number): string | null {
  const c = cheieSesiune();
  if (!c) return null;
  return createHmac("sha256", c)
    .update(`dispozitiv:${id}:${expira}`)
    .digest("hex");
}

export function valoareaDispozitivului(id: string): string | null {
  const expira = Math.floor(Date.now() / 1000) + VIATA_DISPOZITIV_S;
  const sem = semneazaDispozitivul(id, expira);
  return sem ? `d:${id}:${expira}:${sem}` : null;
}

export function cititDispozitivul(brut: string | undefined): string | null {
  if (!brut || !brut.startsWith("d:")) return null;
  const parti = brut.split(":");
  if (parti.length !== 4) return null;
  const [, id, expiraText, sem] = parti;
  const expira = Number(expiraText);
  if (!Number.isInteger(expira) || expira * 1000 <= Date.now()) return null;
  const asteptat = semneazaDispozitivul(id, expira);
  if (!asteptat) return null;
  return egale(sem, asteptat) ? id : null;
}

/** Cine e conectat: cheia asociației, un cont, sau nimeni. */
export type Conectat =
  | { fel: "cheie"; rol: Rol; nume: string }
  | { fel: "cont"; rol: Rol; nume: string; utilizator: Utilizator };

/**
 * Scoate identificatorul din cookie-ul unui cont, dacă semnătura ține.
 *
 * Nu atinge baza de date: partea care chiar poate greși e verificarea
 * semnăturii, și trebuie să poată fi pusă la probă fără server.
 */
export function cititSesiuneaUtilizator(brut: string | undefined): string | null {
  if (!brut || !brut.startsWith("u:")) return null;
  const parti = brut.split(":");
  if (parti.length !== 4) return null;
  const [, id, expiraText, sem] = parti;

  const expira = Number(expiraText);
  if (!Number.isInteger(expira) || expira * 1000 <= Date.now()) return null;

  const asteptat = semneazaSesiunea(id, expira);
  if (!asteptat) return null;
  return egale(sem, asteptat) ? id : null;
}

/**
 * Cine e conectat acum.
 *
 * `cache` de la React, nu o variabilă de modul: pe o pagină de panou
 * verificarea se cere de zeci de ori — cadrul, meniul, fiecare bucată care se
 * închide —, iar fără dedublare ar fi zeci de interogări identice pe cerere.
 * Cu `cache`, prima o face, celelalte o primesc. O variabilă de modul ar
 * amesteca cererile între ele, deci omul altcuiva.
 *
 * Contul se citește din baza de date la **fiecare** cerere, nu doar la
 * intrare. Asta e tot rostul conturilor: un om oprit la 10:00 nu mai intră la
 * 10:01, nu la expirarea cookie-ului.
 */
export const cineEsteConectat = cache(async (): Promise<Conectat | null> => {
  const borcan = await cookies();
  const gasit = borcan.get(COOKIE_ADMIN)?.value;
  if (!gasit) return null;

  if (cookieCheieValid(gasit)) {
    return { fel: "cheie", rol: "administrator", nume: "Asociația" };
  }

  const id = cititSesiuneaUtilizator(gasit);
  if (!id) return null;

  const utilizator = await utilizatorDupaId(id).catch(() => null);
  if (!utilizator || !utilizator.activ) return null;

  return {
    fel: "cont",
    rol: utilizator.rol,
    nume: utilizator.nume,
    utilizator,
  };
});

/** Cât de proaspătă trebuie să fie confirmarea pentru datele sensibile. */
const PROASPAT_S = 12 * 60 * 60;

/**
 * A confirmat omul, cu parola sau cu codul, în ultimele 12 ore?
 *
 * Sesiunea de 30 de zile („Ține-mă minte”) e comodă pentru munca de zi cu
 * zi, dar un telefon găsit deblocat n-are voie să ajungă și la datele
 * sensibile — Formularele 230, cererile, listele descărcate pentru Excel.
 * Acolo se cere iar codul sau parola, dacă au trecut 12 ore.
 *
 * Fără coloană nouă și fără alt cookie: o sesiune scurtă ține 12 ore, deci e
 * mereu proaspătă; una lungă a fost dată acum `30 de zile − rămas`, iar asta
 * se citește din expirarea semnată.
 */
export async function sesiuneProaspata(): Promise<boolean> {
  const brut = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!brut) return false;
  if (cookieCheieValid(brut)) return true;
  if (!cititSesiuneaUtilizator(brut)) return false;
  const ramas = Number(brut.split(":")[2]) - Math.floor(Date.now() / 1000);
  return ramas <= VIATA_S || ramas >= VIATA_LUNGA_S - PROASPAT_S;
}

export async function esteAutentificat(): Promise<boolean> {
  return (await cineEsteConectat()) !== null;
}

/** Rolul celui conectat, sau `null` dacă nu e nimeni. */
export async function rolulConectat(): Promise<Rol | null> {
  return (await cineEsteConectat())?.rol ?? null;
}

/**
 * Are cel conectat voie pe pagina asta?
 *
 * Întrebarea e una singură, pusă din trei locuri: pagina, meniul și ruta din
 * `/api/admin`. Dacă fiecare ar hotărî singur, un drept uitat într-unul din
 * ele ar lăsa o pagină ascunsă în meniu, dar deschisă pentru cine îi știe
 * adresa.
 */
export async function arePermisiune(cale: string): Promise<boolean> {
  const cine = await cineEsteConectat();
  return cine ? poateVedea(cine.rol, cale) : false;
}

/** Numele celui conectat, pentru rândurile de jurnal. */
export async function numeleConectat(): Promise<string | null> {
  return (await cineEsteConectat())?.nume ?? null;
}
