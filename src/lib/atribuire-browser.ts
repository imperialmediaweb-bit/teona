"use client";

import { canalDin, esteCanal, type Canal } from "./atribuire";

/**
 * Urma arrivalului, ținută cât ține fila.
 *
 * De ce e nevoie de ea: omul vine din reclamă pe pagina de început, citește,
 * și abia după două apăsări ajunge la formularul de donație. În clipa aceea
 * adresa nu mai are nicio etichetă în ea — `?utm_source=facebook` a rămas pe
 * prima pagină. Fără ce scrie aici, orice donație ar fi „direct", iar
 * întrebarea „ce au adus reclamele" n-ar avea răspuns.
 *
 * **Ce se păstrează:** două șiruri — canalul („facebook-plata") și perechea
 * brută („facebook / cpc"). Niciun identificator, nicio adresă de pagină,
 * nicio dată și nicio oră; `fbclid`-ul din adresă se citește, se traduce în
 * canal și **nu se scrie**. Stă în `sessionStorage`, deci se șterge când se
 * închide fila, nu trece în altă filă și nu pleacă nicăieri de la sine: ajunge
 * pe server numai atașat unei donații pe care omul a apăsat-o el.
 *
 * De aceea nu atârnă de bannerul de cookie-uri, pe care atârnă Google
 * Analytics: acolo e un script străin care urmărește omul între site-uri, aici
 * e un cuvânt despre o donație în curs.
 */
const CHEIE = "teona:de-unde";

export type Atribuire = { canal: Canal; bruta: string };

function scrie(a: Atribuire) {
  try {
    sessionStorage.setItem(CHEIE, `${a.canal}|${a.bruta}`);
  } catch {
    // Fila privată sau depozitarea blocată. Atunci canalul se vede numai
    // pentru donațiile începute pe pagina pe care a aterizat omul.
  }
}

function citeste(): Atribuire | null {
  try {
    const brut = sessionStorage.getItem(CHEIE);
    if (!brut) return null;
    const [canal, ...rest] = brut.split("|");
    return esteCanal(canal) ? { canal, bruta: rest.join("|") } : null;
  } catch {
    return null;
  }
}

/** Ce spune adresa de acum și de pe ce pagină s-a venit. */
function dinPaginaCurenta(): Atribuire {
  const p = new URLSearchParams(window.location.search);
  return canalDin({
    sursa: p.get("utm_source"),
    mediu: p.get("utm_medium"),
    referinta: document.referrer || null,
    gazdaProprie: window.location.hostname,
    fbclid: p.get("fbclid"),
    gclid: p.get("gclid"),
  });
}

/**
 * Se cheamă o dată, la fiecare pagină deschisă.
 *
 * Prima urmă care nu e „direct" se păstrează și nu se mai schimbă: dacă omul
 * a venit din reclamă, a plecat pe Facebook să întrebe un prieten și s-a
 * întors, donația rămâne a reclamei, nu a Facebookului neplătit. E alegerea
 * uzuală („first touch") și e cea sinceră aici: pe ea se judecă dacă banii
 * dați pe reclame s-au întors.
 */
export function tineMinteUrma(): void {
  if (citeste()) return;
  const acum = dinPaginaCurenta();
  if (acum.canal !== "direct") scrie(acum);
}

/** Canalul de trimis cu o donație. Întoarce `null` dacă nu se știe nimic. */
export function atribuireaCurenta(): Atribuire | null {
  const pastrata = citeste();
  if (pastrata) return pastrata;
  const acum = dinPaginaCurenta();
  return acum.canal === "direct" ? null : acum;
}
