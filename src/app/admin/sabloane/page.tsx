import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { campaniileDeRaportat } from "@/lib/rapoarte/date";
import { areCampanii, grupuri } from "@/lib/email/mailerlite";
import { areEmail } from "@/lib/email/trimite";
import {
  CUPRINS,
  FELURI_SABLON,
  esteFelSablon,
  type FelSablon,
} from "@/lib/email/campanie-sabloane";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import CumScriem from "@/componente/admin/CumScriem";

export const metadata: Metadata = {
  title: "Șabloane de e-mail",
  robots: { index: false, follow: false },
};

/**
 * Cele două șabloane de campanie, de umplut și de dus în MailerLite.
 *
 * **De ce există, dacă e-mailurile se fac în MailerLite.** Pentru că
 * butoanele nu se fac în MailerLite. Un e-mail de campanie are nevoie de
 * zece-douăsprezece căi de a ajuta — card, lunar, 3,5%, SMS, transfer, ziua
 * ta, voluntariat — fiecare cu linkul ei, iar o firmă are nevoie de alte
 * patru. Construite de mână în editorul lui MailerLite, la fiecare campanie,
 * ies de fiecare dată altfel și mai lipsește câte unul. Aici se scriu titlul,
 * textul și poza; restul e deja făcut și verificat.
 *
 * **Pagina nu trimite nimic către listă.** Face cel mult o ciornă, pe care
 * omul o deschide în MailerLite, o probează pe propria adresă și o trimite de
 * acolo. Un e-mail plecat spre mii de oameni nu se mai poate retrage.
 */

const RATAT: Record<string, string> = {
  poza: "Poza are nevoie de o descriere. Fără ea, cine nu vede imaginea nu află ce era în ea.",
  adresa: "Adresa de e-mail pentru probă nu e scrisă corect.",
  "fara-resend":
    "Lipsește RESEND_API_KEY din Railway, deci proba nu poate pleca. Descarcă HTML-ul și încarcă-l direct în MailerLite.",
  mailerlite: "MailerLite n-a primit campania.",
  "fara-lista": "Alege cel puțin o listă din MailerLite, altfel campania n-are cui să plece.",
  neconfirmat: "Bifează confirmarea de sub buton. Fără ea nu pleacă nimic.",
  fel: "Alege pentru cine e e-mailul.",
  "poza-mare":
    "Fotografia e prea mare. Alege una mai mică de 6 MB sau micșoreaz-o întâi.",
  "poza-tip":
    "Fișierul ăla nu e o fotografie. Merg JPG, PNG și WebP — nu și PDF sau document.",
  "poza-urcare":
    "Fotografia n-a ajuns în depozit. Mai încearcă o dată; dacă nici a doua oară nu merge, spune-i dezvoltatorului.",
  "fara-cloudinary":
    "Urcarea fotografiilor nu e configurată. Până se rezolvă, poți folosi identificatorul unei fotografii care e deja pe site.",
};

const FACUT: Record<string, string> = {
  proba: "Proba a plecat. Uită-te la ea în inbox, pe telefon și pe calculator.",
  "proba-nu": "Proba n-a putut pleca. Verifică adresa și cheia Resend.",
  ciorna:
    "Ciorna e în MailerLite. Deschide-o acolo, trimite-ți o probă de la ei și abia apoi apasă pe trimitere.",
  trimisa:
    "Campania a plecat. O trimite MailerLite, de pe serverele lor; cine a deschis-o și cine a apăsat se vede acolo, la statistici.",
};

export default function PaginaSabloane({
  searchParams,
}: {
  searchParams: Promise<{
    gresit?: string;
    fel?: string;
    ratat?: string;
    facut?: string;
    mesaj?: string;
  }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Șabloane de e-mail">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const CLASA_CAMP =
  "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2.5 font-titlu text-mic text-cerneala";

function Eticheta({
  htmlFor,
  copii,
  nota,
}: {
  htmlFor: string;
  copii: string;
  nota?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="font-titlu text-mic font-bold text-cerneala">
        {copii}
      </span>
      {nota && (
        <span className="mt-0.5 block text-nota text-cerneala-slab">
          {nota}
        </span>
      )}
    </label>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{
    gresit?: string;
    fel?: string;
    ratat?: string;
    facut?: string;
    mesaj?: string;
  }>;
}) {
  await connection();
  const { gresit, fel, ratat, facut, mesaj } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Șabloane de e-mail" activ="/admin/sabloane">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/sabloane" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/sabloane" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/sabloane"))) {
    return <FaraDrept titlu="Șabloane de e-mail" activ="/admin/sabloane" />;
  }

  const ales: FelSablon = esteFelSablon(fel) ? fel : "persoane";
  const [liste, campanii] = await Promise.all([
    areCampanii() ? grupuri().catch(() => []) : Promise.resolve([]),
    areBazaDeDate()
      ? campaniileDeRaportat().catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <Cadru
      titlu="Șabloane de e-mail"
      descriere="Două șabloane gata făcute, cu toate butoanele în ele. Tu scrii titlul, textul și pui poza."
      activ="/admin/sabloane"
    >
      {ratat && (
        <p
          role="alert"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {RATAT[ratat] ?? "Ceva n-a mers."} {mesaj}
        </p>
      )}
      {facut && FACUT[facut] && (
        <p
          role="status"
          className="mb-6 colt-mic-a bg-turcoaz-50 px-4 py-3 text-mic font-semibold text-turcoaz-900"
        >
          {FACUT[facut]}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)] lg:items-start">
        <form
          action="/api/admin/sablon"
          method="post"
          encType="multipart/form-data"
          target="_blank"
          className="grid gap-5"
        >
          {/*
            Pentru cine e e-mailul.

            Nu un detaliu de stil: schimbă toate butoanele de dedesubt. Un om
            donează cu cardul sau prin SMS; o firmă semnează un contract de
            sponsorizare. Lista aleasă în MailerLite trebuie să fie aceeași cu
            șablonul — un e-mail despre contracte de sponsorizare trimis
            donatorilor persoane fizice e o campanie pierdută.
          */}
          <fieldset className="grid gap-3">
            <legend className="font-titlu text-mic font-bold text-cerneala">
              Pentru cine
            </legend>
            {FELURI_SABLON.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-start gap-3 colt-mic-a border border-hartie-umbra bg-hartie p-4 has-checked:border-caramiziu-700 has-checked:bg-caramiziu-50"
              >
                <input
                  type="radio"
                  name="fel"
                  value={f.id}
                  defaultChecked={f.id === ales}
                  className="mt-1 size-4 accent-caramiziu-700"
                />
                <span>
                  <span className="block font-titlu text-mic font-bold text-cerneala">
                    {f.eticheta}
                  </span>
                  <span className="mt-0.5 block text-nota text-cerneala-moale">
                    {f.descriere}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <CumScriem />

          <div className="grid gap-2">
            <Eticheta htmlFor="titlu" copii="Titlul" />
            <input
              id="titlu"
              name="titlu"
              type="text"
              maxLength={160}
              placeholder="Tabăra de iarnă are nevoie de 30 de locuri"
              className={CLASA_CAMP}
            />
          </div>

          <div className="grid gap-2">
            <Eticheta
              htmlFor="text"
              copii="Textul"
              nota="Un rând gol desparte paragrafele. Fără titluri și fără liste — restul e deja în șablon."
            />
            <textarea
              id="text"
              name="text"
              rows={9}
              placeholder={
                "Dragi prieteni,\n\nÎn fiecare iarnă ducem copiii la…"
              }
              className={`${CLASA_CAMP} font-sans leading-relaxed`}
            />
          </div>

          {/*
            Poza se alege de aici, ca la scrisul pe site.

            Înainte, câmpul cerea identificatorul din Cloudinary, copiat de la
            Poze. Adică: deschide altă pagină, caută fotografia, copiază un șir
            de semne, întoarce-te. Pentru o campanie pe lună, pasul ăla e tot
            ce trebuie ca să nu se mai pună poză deloc — iar un e-mail fără
            fotografie, despre copii, e un e-mail mai slab.

            Identificatorul rămâne dedesubt, pentru o fotografie care e deja în
            Cloudinary și n-are rost urcată a doua oară.
          */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Eticheta
                htmlFor="poza_fisier"
                copii="Poza"
                nota="O alegi de pe calculator sau de pe telefon."
              />
              <input
                id="poza_fisier"
                name="poza_fisier"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={CLASA_CAMP}
              />
            </div>
            <div className="grid gap-2">
              <Eticheta
                htmlFor="poza_alt"
                copii="Ce se vede în poză"
                nota="Obligatoriu dacă pui poză."
              />
              <input
                id="poza_alt"
                name="poza_alt"
                type="text"
                maxLength={200}
                placeholder="Copii la tabăra de la Vatra Dornei"
                className={CLASA_CAMP}
              />
            </div>
          </div>
          <details className="-mt-2">
            <summary className="cursor-pointer font-titlu text-nota font-bold text-cerneala-moale">
              Sau o fotografie care e deja pe site
            </summary>
            <div className="mt-3 grid gap-2">
              <Eticheta
                htmlFor="poza"
                copii="Identificatorul din Cloudinary"
                nota="Se folosește numai dacă n-ai ales un fișier mai sus."
              />
              <input
                id="poza"
                name="poza"
                type="text"
                placeholder="Teona/2025/TABĂRĂ…/poza-1"
                className={CLASA_CAMP}
              />
              <p className="text-nota text-cerneala-slab">
                Se ia de la{" "}
                <Link
                  href="/admin/poze"
                  className="font-semibold text-caramiziu-700 underline underline-offset-2"
                >
                  Poze
                </Link>
                , unde e un buton de copiat sub fiecare fotografie.
              </p>
            </div>
          </details>

          {campanii.length > 0 && (
            <div className="grid gap-2">
              <Eticheta
                htmlFor="campanie"
                copii="Campania de pe site (dacă e una)"
                nota="Donațiile venite din e-mail se numără atunci pe campania asta."
              />
              <select id="campanie" name="campanie" className={CLASA_CAMP}>
                <option value="">— fără campanie —</option>
                {campanii.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.titlu}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/*
            Butoanele, în ordinea în care se folosesc: te uiți, îți trimiți o
            probă, și abia la urmă faci ciorna. `formTarget` le desparte —
            previzualizarea și descărcarea deschid o filă nouă, celelalte se
            întorc pe pagină cu un mesaj.
          */}
          <div className="flex flex-wrap gap-2.5 border-t border-hartie-umbra pt-5">
            <button
              type="submit"
              name="fac"
              value="vezi"
              className="rounded-full bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800"
            >
              Vezi cum arată
            </button>
            <button
              type="submit"
              name="fac"
              value="descarca"
              className="colt-mic-a border border-hartie-umbra bg-hartie px-5 py-2.5 font-titlu text-mic font-semibold text-cerneala transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
            >
              Descarcă HTML-ul
            </button>
          </div>

          <div className="grid gap-3 colt-a border border-hartie-umbra bg-hartie p-5">
            <Eticheta
              htmlFor="catre"
              copii="Trimite-ți o probă"
              nota="Uită-te la ea pe telefon, nu doar pe calculator."
            />
            <div className="flex flex-wrap gap-2.5">
              <input
                id="catre"
                name="catre"
                type="email"
                placeholder="adresa ta"
                className={`${CLASA_CAMP} sm:max-w-xs`}
              />
              <button
                type="submit"
                name="fac"
                value="proba"
                formTarget="_self"
                disabled={!areEmail()}
                className="rounded-full bg-cerneala px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-cerneala-slab"
              >
                Trimite proba
              </button>
            </div>
            {!areEmail() && (
              <p className="text-nota text-cerneala-slab">
                Are nevoie de RESEND_API_KEY în Railway.
              </p>
            )}
          </div>

          <div className="grid gap-3 colt-a border border-hartie-umbra bg-hartie p-5">
            <Eticheta
              htmlFor="subiect"
              copii="Trimite-l prin MailerLite"
              nota="Pleacă de pe serverele MailerLite, la lista aleasă. Sau fă doar ciorna și trimite-o de acolo."
            />
            <input
              id="subiect"
              name="subiect"
              type="text"
              maxLength={160}
              placeholder="Subiectul din inbox (dacă e altul decât titlul)"
              className={CLASA_CAMP}
            />
            {liste.length > 0 ? (
              <fieldset className="grid gap-2">
                <legend className="text-nota text-cerneala-slab">
                  Grupurile din MailerLite
                </legend>
                {liste.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2.5 text-mic text-cerneala-moale"
                  >
                    <input
                      type="checkbox"
                      name="grup"
                      value={g.id}
                      /*
                        Lista potrivită șablonului vine bifată: firmele pentru
                        șablonul de firme, persoanele pentru celălalt. Un
                        e-mail către firme plecat la persoane fizice (sau
                        invers) e greșeala cea mai ușor de făcut aici.
                      */
                      defaultChecked={
                        g.id ===
                        (ales === "firme"
                          ? process.env.MAILERLITE_GROUP_FIRME
                          : process.env.MAILERLITE_GROUP_ID)
                      }
                      className="size-4 accent-caramiziu-700"
                    />
                    {g.nume}
                    <span className="text-cerneala-slab tabular-nums">
                      · {g.activi.toLocaleString("ro-RO")} abonați
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="text-nota text-cerneala-slab">
                {areCampanii()
                  ? "Nu s-a putut citi lista de grupuri din MailerLite. Ciorna se face oricum, fără grup, și i se alege lista acolo."
                  : "Lipsește MAILERLITE_API_KEY din Railway. Până atunci, descarcă HTML-ul și fă campania direct în MailerLite, cu editorul de cod."}
              </p>
            )}
            <div>
              <button
                type="submit"
                name="fac"
                value="ciorna"
                formTarget="_self"
                disabled={!areCampanii()}
                className="rounded-full border-2 border-cerneala/15 px-5 py-2 font-titlu text-mic font-bold text-cerneala transition-colors hover:border-caramiziu-400 disabled:cursor-not-allowed disabled:text-cerneala-slab"
              >
                Fă doar ciorna
              </button>
            </div>
            {/*
              Trimiterea, despărțită de ciornă printr-o linie și o bifă. Bifa
              e verificată și pe server: fără ea nu pleacă nimic, oricum ar
              fi trimis formularul.
            */}
            <div className="mt-2 grid gap-3 border-t border-hartie-umbra pt-4">
              <label className="flex items-start gap-2.5 text-mic text-cerneala">
                <input
                  type="checkbox"
                  name="confirm"
                  value="da"
                  className="mt-0.5 size-4 shrink-0 accent-caramiziu-700"
                />
                Mi-am trimis proba și am citit-o. Știu că mesajul pleacă acum la
                toți abonații listelor bifate și nu se mai poate opri.
              </label>
              <div>
                <button
                  type="submit"
                  name="fac"
                  value="trimite"
                  formTarget="_self"
                  disabled={!areCampanii() || liste.length === 0}
                  className="rounded-full bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800 disabled:cursor-not-allowed disabled:bg-cerneala-slab"
                >
                  Trimite campania acum
                </button>
              </div>
            </div>
          </div>
        </form>

        {/*
          Ce e în șablon, scris pe pagină.

          Aici stătea un cadru cu previzualizarea. Nu se putea: site-ul trimite
          `frame-ancestors \'none\'` pe toate răspunsurile, deci nu se poate
          încadra nici pe el însuși — cadrul rămânea alb, fără nicio eroare
          vizibilă. Lista e oricum mai de folos: se vede dintr-o privire ce
          butoane pleacă odată cu șablonul, fără să derulezi un e-mail întreg.
        */}
        <div className="lg:sticky lg:top-6">
          <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
            <h2 className="font-titlu text-amplu font-bold text-cerneala">
              Ce e deja în șablonul pentru{" "}
              {ales === "firme" ? "firme" : "persoane fizice"}
            </h2>
            <p className="mt-1 text-mic text-cerneala-moale">
              Toate astea vin odată cu el. Tu scrii doar titlul, textul și pui
              poza.
            </p>
            <ul className="mt-4 grid gap-2.5">
              {CUPRINS[ales].map((punct) => (
                <li
                  key={punct}
                  className="relative pl-6 text-mic text-cerneala-moale"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-[0.55em] left-0 size-1.5 rounded-full bg-caramiziu-600"
                  />
                  {punct}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a
                href={`/api/admin/sablon?fel=${ales}`}
                target="_blank"
                rel="noreferrer"
                className="colt-mic-a border border-hartie-umbra bg-hartie px-4 py-2 font-titlu text-mic font-semibold text-cerneala transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
              >
                Deschide șablonul gol
              </a>
              <Link
                href={`/admin/sabloane?fel=${ales === "firme" ? "persoane" : "firme"}`}
                className="colt-mic-a border border-hartie-umbra bg-hartie px-4 py-2 font-titlu text-mic font-semibold text-cerneala transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
              >
                Vezi-l pe celălalt
              </Link>
            </div>
          </div>

          <div className="mt-5 colt-a border border-hartie-umbra bg-hartie-calda p-5">
            <h2 className="font-titlu text-mic font-bold text-cerneala">
              Dacă MailerLite nu e legat
            </h2>
            <p className="mt-1 text-nota text-cerneala-moale">
              Apeși „Descarcă HTML-ul”, apoi în MailerLite faci o campanie nouă
              și alegi editorul de cod (custom HTML). Lipești fișierul acolo.
              Linkul de dezabonare e deja pus cu variabila lor,{" "}
              <code className="rounded bg-hartie-umbra px-1">
                {"{$unsubscribe}"}
              </code>
              , deci îl completează singur.
            </p>
          </div>
        </div>
      </div>
    </Cadru>
  );
}
