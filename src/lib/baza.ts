import { Pool } from "pg";

/**
 * Legătura cu Postgres.
 *
 * Până la modulul de campanii aniversare, tot conținutul site-ului venea din
 * fișiere din depozit. Campaniile nu pot: le scriu oamenii, după ce site-ul a
 * fost construit, iar discul containerului de pe Railway dispare la fiecare
 * redeploy.
 *
 * `DATABASE_URL` vine din Railway. Dacă lipsește — pe calculatorul cuiva care
 * doar se uită la site — modulul se poartă ca și cum ar fi oprit, în loc să
 * arunce erori: `areBazaDeDate()` spune nu, iar paginile care au nevoie de el
 * răspund cinstit că nu e disponibil.
 */

let rezervor: Pool | null = null;
let schema: Promise<void> | null = null;

export function areBazaDeDate(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Dacă legătura are nevoie de TLS.
 *
 * Două cazuri nu au: Postgres-ul din rețeaua privată Railway (traficul nu
 * iese din ea, iar certificatul lui propriu ar pica la verificarea lanțului)
 * și o bază locală, de pe calculatorul cuiva, care de obicei n-are TLS
 * pornit deloc. Fără excepția a doua, o rulare locală cu Postgres pe
 * localhost cade cu „The server does not support SSL connections”, iar
 * mesajul nu spune nicăieri că vinovat e codul nostru.
 *
 * Pentru orice altă gazdă cerem TLS, dar fără verificarea lanțului: bazele
 * administrate vin aproape toate cu certificat propriu.
 */
function cereSsl(adresa: string | undefined) {
  if (!adresa) return false;
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(adresa);
  if (local || adresa.includes("railway.internal")) return false;
  return { rejectUnauthorized: false };
}

function ia(): Pool {
  if (!rezervor) {
    rezervor = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: cereSsl(process.env.DATABASE_URL),
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return rezervor;
}

/*
  Schema se creează la prima folosire, nu dintr-un pas separat de migrare.

  Într-un proiect fără echipă de întreținere, un sistem de migrări ar fi mai
  mult de administrat decât de câștigat, iar `CREATE TABLE IF NOT EXISTS` e
  de ajuns cât timp schimbările doar *adaugă*: un tabel nou, un index nou.

  **Ce nu acoperă:** o coloană adăugată la un tabel care există deja, o
  coloană redenumită, un tip schimbat. Astea nu se întâmplă de la sine și
  trebuie rulate o dată, de mână, pe baza de date din Railway. De aceea
  coloanele noi se adaugă mai jos, cu `ALTER TABLE … ADD COLUMN IF NOT
  EXISTS`, care e sigur de rulat de câte ori vrei.
*/
const DEFINITIE = `
  CREATE TABLE IF NOT EXISTS campanii_aniversare (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              text UNIQUE NOT NULL,
    ocazie            text NOT NULL,
    titlu             text NOT NULL,
    mesaj             text NOT NULL,
    nume_public       text NOT NULL,
    email             text NOT NULL,
    data_evenimentului date,
    poza_id           text,
    poza_latime       integer,
    poza_inaltime     integer,
    link_galantom     text,
    stare             text NOT NULL DEFAULT 'in_asteptare',
    jeton             text NOT NULL,
    motiv             text,
    creat_la          timestamptz NOT NULL DEFAULT now(),
    hotarat_la        timestamptz
  );
  CREATE INDEX IF NOT EXISTS campanii_dupa_stare
    ON campanii_aniversare (stare, creat_la DESC);

  CREATE TABLE IF NOT EXISTS donatii (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    procesator      text NOT NULL,
    referinta       text NOT NULL,
    suma_bani       bigint NOT NULL,
    moneda          text NOT NULL,
    frecventa       text NOT NULL,
    destinatie      text NOT NULL,
    email           text,
    prenume         text,
    nume            text,
    telefon         text,
    acord_buletin   boolean NOT NULL DEFAULT false,
    dus_la_buletin  boolean NOT NULL DEFAULT false,
    stare           text NOT NULL DEFAULT 'initiata',
    campanie_slug   text,
    creat_la        timestamptz NOT NULL DEFAULT now(),
    platita_la      timestamptz,
    UNIQUE (procesator, referinta)
  );
  CREATE INDEX IF NOT EXISTS donatii_dupa_stare
    ON donatii (stare, creat_la DESC);

  /*
    Evenimentele deja prelucrate.

    Procesatoarele retrimit același eveniment până primesc 200, iar o rețea
    proastă poate face ca al doilea să sosească înainte ca primul să se
    termine. Fără tabelul ăsta, o donație s-ar putea număra de două ori.
  */
  /*
    Apăsările pe linkurile care duc în afara site-ului — Revolut, Galantom.

    Pentru metodele care nu trec prin site, asta e tot ce se poate număra:
    intenția, nu donația. Caietul (12.8) cere oricum urmărirea click-urilor
    către Galantom și a copierii IBAN-ului, deci tabelul servește la amândouă.
  */
  CREATE TABLE IF NOT EXISTS apasari (
    id    bigserial PRIMARY KEY,
    ce    text NOT NULL,
    cand  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS apasari_dupa_ce ON apasari (ce, cand DESC);

  /* Notițele asociației despre un donator. Restul se calculează din donații. */
  CREATE TABLE IF NOT EXISTS note_donatori (
    email     text PRIMARY KEY,
    text      text NOT NULL,
    scris_la  timestamptz NOT NULL DEFAULT now()
  );

  /*
    Firmele care vor să sponsorizeze (8).

    Un rând pe firmă, nu pe cerere: identificatorul e CUI-ul, normalizat
    (fără RO, fără spații). Dacă aceeași firmă trimite a doua oară
    formularul, se actualizează datele de contact și se adaugă o interacțiune
    — nu apare încă un card în lista de urmărit, cu alt stadiu decât primul.
  */
  CREATE TABLE IF NOT EXISTS firme (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cui            text UNIQUE NOT NULL,
    denumire       text NOT NULL,
    persoana       text NOT NULL,
    email          text NOT NULL,
    telefon        text,
    cale           text NOT NULL,
    suma_estimata  text,
    mesaj          text,
    /* cerere → contract_trimis → semnat → incasat, sau renuntat. */
    stadiu         text NOT NULL DEFAULT 'cerere',
    suma_bani      bigint,
    creat_la       timestamptz NOT NULL DEFAULT now(),
    schimbat_la    timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS firme_dupa_stadiu
    ON firme (stadiu, schimbat_la DESC);

  /*
    Restul cererilor care vin de pe site: pașii pentru 3,5%, voluntariat,
    mesajele din formularul de contact.

    Toate au aceeași formă — cine, cum îl găsim, ce a cerut — deci stau
    într-un tabel, cu „fel” ca etichetă și „detalii” pentru ce diferă. Un
    tabel per formular ar însemna trei pagini de admin aproape identice.
  */
  CREATE TABLE IF NOT EXISTS cereri (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fel          text NOT NULL,
    nume         text NOT NULL,
    email        text NOT NULL,
    telefon      text,
    detalii      jsonb NOT NULL DEFAULT '{}'::jsonb,
    /* nou → in_lucru → rezolvat */
    stadiu       text NOT NULL DEFAULT 'nou',
    creat_la     timestamptz NOT NULL DEFAULT now(),
    schimbat_la  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS cereri_dupa_fel
    ON cereri (fel, stadiu, creat_la DESC);
  CREATE INDEX IF NOT EXISTS cereri_dupa_email ON cereri (email);

  /*
    Jurnalul discuțiilor: ce s-a vorbit la telefon, ce s-a trimis, ce s-a
    hotărât.

    Fără el, „l-am sunat" trăiește în capul unei singure persoane. Un rând e
    legat ori de un om (prin e-mail), ori de o firmă (prin firma_id) —
    niciodată de amândouă.
  */
  CREATE TABLE IF NOT EXISTS interactiuni (
    id        bigserial PRIMARY KEY,
    email     text,
    firma_id  uuid REFERENCES firme(id) ON DELETE CASCADE,
    /* telefon | email | intalnire | notita */
    fel       text NOT NULL,
    rezumat   text NOT NULL,
    cand      timestamptz NOT NULL DEFAULT now(),
    CHECK (email IS NOT NULL OR firma_id IS NOT NULL)
  );
  CREATE INDEX IF NOT EXISTS interactiuni_dupa_email
    ON interactiuni (email, cand DESC);
  CREATE INDEX IF NOT EXISTS interactiuni_dupa_firma
    ON interactiuni (firma_id, cand DESC);

  /*
    Intrarea donatorului în contul lui, fără parolă.

    Nu ținem parole. Un donator intră de două ori pe an și oricum ar uita-o,
    iar o bază de parole e o răspundere pe care o asociație mică n-are cum s-o
    poarte: scurgerea ei ar da acces la conturile oamenilor de pe alte site-uri,
    unde refolosesc aceeași parolă. În loc de asta, primește pe e-mail un link
    care merge o singură dată și expiră repede.

    Se păstrează doar amprenta jetonului, nu jetonul. Cine ar citi tabelul n-ar
    putea intra în niciun cont — exact cum se ține o parolă.
  */
  CREATE TABLE IF NOT EXISTS jetoane_cont (
    amprenta    text PRIMARY KEY,
    email       text NOT NULL,
    creat_la    timestamptz NOT NULL DEFAULT now(),
    expira_la   timestamptz NOT NULL,
    folosit_la  timestamptz
  );
  CREATE INDEX IF NOT EXISTS jetoane_dupa_expirare
    ON jetoane_cont (expira_la);

  CREATE TABLE IF NOT EXISTS evenimente_plati (
    procesator  text NOT NULL,
    eveniment   text NOT NULL,
    primit_la   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (procesator, eveniment)
  );
`;

/*
  Coloane apărute după ce tabelul exista deja pe baza de date din Railway.

  `CREATE TABLE IF NOT EXISTS` nu le-ar adăuga niciodată: tabelul există, deci
  definiția lui e sărită în întregime. Rulează separat, și sunt scrise ca să
  poată fi rulate de oricâte ori.
*/
const ADAOSURI = `
  /* Cine a scris donația de mână, pentru cele care nu vin de la un procesator. */
  ALTER TABLE donatii ADD COLUMN IF NOT EXISTS adaugat_de text;
  /* Ce a scris omul la adăugarea manuală: „transfer BCR 12 mart", chitanța etc. */
  ALTER TABLE donatii ADD COLUMN IF NOT EXISTS observatii text;
`;

async function pregateste(): Promise<void> {
  schema ??= ia()
    .query(DEFINITIE)
    .then(() => ia().query(ADAOSURI))
    .then(() => undefined)
    .catch((eroare) => {
      // Dacă n-a mers, următoarea cerere încearcă din nou: altfel o pană de
      // o secundă la pornire ar ține modulul oprit până la redeploy.
      schema = null;
      throw eroare;
    });
  return schema;
}

/** O interogare, cu schema garantat creată înainte. */
export async function intreaba<R extends Record<string, unknown>>(
  text: string,
  valori: unknown[] = [],
): Promise<R[]> {
  await pregateste();
  const rezultat = await ia().query(text, valori);
  return rezultat.rows as R[];
}
