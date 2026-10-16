/**
 * De unde a venit omul: un singur vocabular pentru vizite și pentru donații.
 *
 * Panoul pune două cifre una lângă alta — câte vizite a adus un canal
 * (numărate de Google Analytics) și câte donații a adus (numărate de baza
 * noastră). Cifrele vin din două locuri care nu se cunosc între ele, deci
 * singurul fel în care rândurile se pot citi împreună e să numească canalele
 * la fel. Fișierul ăsta ține numele acelea, și traducerea spre ele din
 * amândouă părțile: din adresa pe care a apăsat omul (`utm_*`, `fbclid`) și
 * din perechea „sursă / mediu" cu care răspunde Analytics.
 *
 * **Nu se ghicește nimic.** O vizită fără nicio urmă rămâne „direct", nu se
 * împarte pe canale după aproximații. Un canal necunoscut rămâne „alt site",
 * ca să se vadă că a apărut ceva nou, nu să dispară într-o rubrică largă.
 */

export const CANALE = [
  {
    id: "email",
    nume: "E-mail",
    lamurire:
      "Buletinele și campaniile trimise din MailerLite. Linkurile lor poartă etichete, deci se recunosc singure.",
  },
  {
    id: "facebook-plata",
    nume: "Reclame Facebook și Instagram",
    lamurire: "Vizite din reclame plătite pe Meta.",
  },
  {
    id: "facebook",
    nume: "Facebook, neplătit",
    lamurire: "Postări pe pagină, distribuiri, comentarii — fără bani în spate.",
  },
  {
    id: "instagram",
    nume: "Instagram, neplătit",
    lamurire: "Postări și story-uri, link din descrierea contului.",
  },
  {
    id: "google-plata",
    nume: "Reclame Google",
    lamurire: "Inclusiv Ad Grants, dacă asociația primește grantul.",
  },
  {
    id: "google-organic",
    nume: "Căutare Google",
    lamurire:
      "Omul a căutat ceva și a dat pe site fără să plătim nimic pentru asta.",
  },
  {
    id: "alta-cautare",
    nume: "Altă căutare",
    lamurire: "Bing, Yahoo, DuckDuckGo.",
  },
  {
    id: "qr",
    nume: "Cod QR tipărit",
    lamurire:
      "Afiș, fluturaș, cutie de donații, banner la un eveniment — orice link tipărit.",
  },
  { id: "sms", nume: "SMS", lamurire: "Linkuri trimise prin mesaj." },
  {
    id: "alt-site",
    nume: "Alt site",
    lamurire: "Un articol de presă, un blog, un partener care ne-a pus link.",
  },
  {
    id: "direct",
    nume: "Direct",
    lamurire:
      "Adresa scrisă de mână, un favorit, un link dintr-o aplicație care nu spune de unde vine (WhatsApp, Messenger, un PDF).",
  },
] as const;

export type Canal = (typeof CANALE)[number]["id"];

const DUPA_ID = new Map(CANALE.map((c) => [c.id as string, c]));

export function esteCanal(ceva: unknown): ceva is Canal {
  return typeof ceva === "string" && DUPA_ID.has(ceva);
}

/** Numele pe înțelesul cuiva care n-a deschis niciodată Analytics. */
export function numeCanal(id: string): string {
  return DUPA_ID.get(id)?.nume ?? id;
}

export function lamurireCanal(id: string): string {
  return DUPA_ID.get(id)?.lamurire ?? "";
}

/** Etichetele cu care se marchează linkurile noastre, ca să se recunoască. */
export const ETICHETE = {
  qr: { utm_source: "qr", utm_medium: "offline" },
  email: { utm_source: "mailerlite", utm_medium: "email" },
} as const;

function curata(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/** Gazda unui referrer, fără „www.". Șir gol dacă nu e o adresă întreagă. */
function gazdaDin(adresa: string): string {
  try {
    return new URL(adresa).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const CAUTARI = [
  "bing.com",
  "yahoo.com",
  "search.yahoo.com",
  "duckduckgo.com",
  "ecosia.org",
  "yandex.ru",
  "startpage.com",
  "qwant.com",
];

const FACEBOOK = ["facebook.com", "m.facebook.com", "l.facebook.com", "lm.facebook.com", "fb.me", "fb.com"];
const INSTAGRAM = ["instagram.com", "l.instagram.com"];

function platita(mediu: string): boolean {
  return [
    "cpc",
    "ppc",
    "paid",
    "paid_social",
    "paidsocial",
    "paid-social",
    "ads",
    "reclama",
    "reclame",
  ].includes(mediu);
}

export type Urma = {
  /** `utm_source`, sau sursa cum o scrie Analytics („google", „facebook.com"). */
  sursa?: string | null;
  /** `utm_medium`, sau mediul cum îl scrie Analytics („organic", „(none)"). */
  mediu?: string | null;
  /** Adresa completă de pe care s-a venit, când o știm (numai în browser). */
  referinta?: string | null;
  /** Gazda site-ului nostru, ca să nu numărăm navigarea internă ca sursă. */
  gazdaProprie?: string | null;
  /** Identificatorii pe care îi adaugă Meta și Google la linkurile din reclame. */
  fbclid?: string | null;
  gclid?: string | null;
};

/**
 * Canalul și urma brută, din ce se știe despre o vizită.
 *
 * `bruta` e perechea „sursă / mediu" nealterată, sau gazda de pe care s-a
 * venit. Se păstrează lângă canal fiindcă traducerea pierde amănuntul: din
 * „Reclame Facebook și Instagram" nu se mai vede care campanie, iar dintr-un
 * canal nou, nerecunoscut, nu s-ar vedea nimic.
 */
export function canalDin(u: Urma): { canal: Canal; bruta: string } {
  const sursa = curata(u.sursa);
  const mediu = curata(u.mediu);
  const gazdaRef = u.referinta ? gazdaDin(u.referinta) : "";
  const proprie = curata(u.gazdaProprie);

  // Analytics scrie sursa fie ca nume („google"), fie ca gazdă
  // („l.facebook.com"); în al doilea caz o tratăm ca referrer.
  const gazda = gazdaRef && gazdaRef !== proprie ? gazdaRef : sursa.includes(".") ? sursa : "";

  const bruta =
    sursa || mediu
      ? `${sursa || "(fără sursă)"} / ${mediu || "(fără mediu)"}`
      : gazda || "";

  if (mediu === "email" || ["mailerlite", "email", "buletin", "newsletter"].includes(sursa)) {
    return { canal: "email", bruta };
  }

  if (sursa === "qr" || ["qr", "offline", "afis", "print", "tiparit"].includes(mediu)) {
    return { canal: "qr", bruta };
  }

  if (sursa === "sms" || mediu === "sms") return { canal: "sms", bruta };

  const eFacebook =
    FACEBOOK.includes(gazda) || ["facebook", "fb", "meta"].includes(sursa);
  const eInstagram = INSTAGRAM.includes(gazda) || ["instagram", "ig"].includes(sursa);

  if (u.fbclid || ((eFacebook || eInstagram) && platita(mediu))) {
    return { canal: "facebook-plata", bruta: bruta || gazda };
  }
  if (eFacebook) return { canal: "facebook", bruta: bruta || gazda };
  if (eInstagram) return { canal: "instagram", bruta: bruta || gazda };

  const eGoogle = sursa === "google" || gazda.startsWith("google.");
  if (u.gclid || (eGoogle && platita(mediu))) {
    return { canal: "google-plata", bruta: bruta || gazda };
  }
  if (eGoogle) return { canal: "google-organic", bruta: bruta || gazda };

  if (CAUTARI.includes(gazda) || CAUTARI.some((c) => sursa === c.split(".")[0])) {
    return { canal: "alta-cautare", bruta: bruta || gazda };
  }

  // „(direct) / (none)", cum scrie Analytics, sau nimic deloc.
  const gol =
    !gazda &&
    (!sursa || sursa === "(direct)" || sursa === "(not set)") &&
    (!mediu || mediu === "(none)" || mediu === "(not set)");
  if (gol) return { canal: "direct", bruta: "" };

  return { canal: "alt-site", bruta: bruta || gazda };
}

/** Numele canalelor în ordinea în care se citesc în panou. */
export const ORDINE_CANALE: Canal[] = CANALE.map((c) => c.id);
