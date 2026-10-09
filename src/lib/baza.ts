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

function ia(): Pool {
  if (!rezervor) {
    rezervor = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Railway pune Postgres în rețeaua privată a proiectului, cu un
      // certificat propriu. Verificarea lanțului ar pica pe el, iar
      // traficul oricum nu iese din rețeaua privată.
      ssl: process.env.DATABASE_URL?.includes("railway.internal")
        ? false
        : { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return rezervor;
}

/*
  Schema se creează la prima folosire, nu dintr-un pas separat de migrare.

  Pentru un singur tabel, într-un proiect fără echipă de întreținere, un
  fișier de migrări ar fi mai mult de administrat decât de câștigat. Dacă
  tabelele se înmulțesc, aici se schimbă — nu peste tot prin cod.
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

  CREATE TABLE IF NOT EXISTS evenimente_plati (
    procesator  text NOT NULL,
    eveniment   text NOT NULL,
    primit_la   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (procesator, eveniment)
  );
`;

async function pregateste(): Promise<void> {
  schema ??= ia()
    .query(DEFINITIE)
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
