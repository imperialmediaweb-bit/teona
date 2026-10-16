/**
 * Redacțiile din Suceava, cu datele lor publice de contact.
 *
 * **De unde vin.** Fiecare adresă e luată de pe pagina de contact a
 * publicației, nu din memorie și nu ghicită — o adresă inventată trimite
 * comunicatul în gol, iar asociația crede că l-a trimis. Unde site-ul n-a
 * răspuns (Cloudflare blochează cititul automat) sau n-are pagină de contact,
 * rândul rămâne fără adresă, dinadins: se vede în panou ce lipsește și se
 * completează de mână, după un telefon.
 *
 * Lista asta e doar sămânța: ce se scrie în panou rămâne în baza de date, iar
 * fișierul ăsta nu mai are niciun cuvânt de spus după prima pornire. Așa
 * poate asociația să adauge ziariștii cu care chiar vorbește — ăia sunt cei
 * care publică, nu adresele generale de redacție.
 *
 * Verificat pe 16 octombrie 2026.
 */

export type FelPresa = "ziar" | "online" | "tv" | "radio";

export type ContactPresaSamanta = {
  publicatie: string;
  fel: FelPresa;
  email: string | null;
  telefon: string | null;
  site: string | null;
  notite: string | null;
};

export const PRESA_SUCEAVA: ReadonlyArray<ContactPresaSamanta> = [
  {
    publicatie: "Monitorul de Suceava",
    fel: "ziar",
    email: "redactie@monitorulsv.ro",
    telefon: "0230 522 993",
    site: "https://www.monitorulsv.ro",
    notite:
      "A scris deja despre asociație. Publicitate: publicitate@monitorulsv.ro. Al doilea telefon: 0733 123 000.",
  },
  {
    publicatie: "NewsBucovina",
    fel: "online",
    email: "redactie@newsbucovina.ro",
    telefon: "0722 620 012",
    site: "https://newsbucovina.ro",
    notite: null,
  },
  {
    publicatie: "Bucovina TV",
    fel: "tv",
    email: "office@bucovinatv.ro",
    telefon: "0753 222 727",
    site: "https://www.bucovinatv.ro",
    notite: "Televiziune locală — bună pentru tabere și evenimente filmabile.",
  },
  {
    publicatie: "Radio Top Suceava",
    fel: "radio",
    email: "productie@radiotop.ro",
    telefon: null,
    site: "https://radiotop.ro",
    notite: null,
  },
  {
    publicatie: "suceava.online",
    fel: "online",
    email: "contact@suceava.online",
    telefon: null,
    site: "https://suceava.online",
    notite: "A scris deja despre asociație.",
  },
  {
    publicatie: "Obiectiv de Suceava",
    fel: "ziar",
    email: null,
    telefon: null,
    site: "https://www.obiectivdesuceava.ro",
    notite:
      "A scris deja despre asociație. Adresa redacției n-a putut fi citită de pe site — de completat după un telefon.",
  },
  {
    publicatie: "Suceava News",
    fel: "online",
    email: null,
    telefon: null,
    site: "https://suceavanews.ro",
    notite:
      "A scris deja despre asociație. Site-ul n-are pagină de contact — de completat de mână.",
  },
  {
    publicatie: "Crai Nou",
    fel: "ziar",
    email: null,
    telefon: null,
    site: "https://crainou.ro",
    notite: "Adresa n-a putut fi citită de pe site — de completat de mână.",
  },
];
