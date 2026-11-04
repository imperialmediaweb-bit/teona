import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
  sesiuneProaspata,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areEmail } from "@/lib/email/trimite";
import {
  CAI_CONTACT,
  type FiltreVoluntari,
  apeluri,
  filtreaza,
  linkRaspuns,
  linkTelefon,
  linkWhatsApp,
  localitati,
  raspunsuri,
  textWhatsApp,
  totiVoluntarii,
} from "@/lib/voluntari";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import BazaVoluntari, { type VoluntarInLista } from "@/componente/admin/BazaVoluntari";

export const metadata: Metadata = {
  title: "Voluntari",
  robots: { index: false, follow: false },
};

/**
 * Baza de voluntari: cine s-a înscris pe site, filtrat după ce e nevoie.
 *
 * Filtrele stau sus și sunt cele după care se caută de obicei un om pentru o
 * zi anume: localitatea, cât timp are, permisul (pentru drumurile la
 * tabere), experiența cu copii, limba, vârsta (18+ pentru ce cere un adult).
 * Fiecare om are căile de contact gata de apăsat, iar cea aleasă de el în
 * formular e prima, plină.
 */

type Cautare = {
  q?: string;
  loc?: string;
  disp?: string;
  permis?: string;
  copii?: string;
  limba?: string;
  majori?: string;
  contact?: string;
  apel?: string;
  intrebati?: string;
  emailuri?: string;
  gresit?: string;
};

export default function PaginaVoluntari({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Voluntari">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const CAMP =
  "w-full rounded-lg border border-hartie-umbra bg-hartie px-3 py-2 text-mic text-cerneala focus:border-caramiziu-600";

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const cauta = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Voluntari" activ="/admin/voluntari">
        <p className="text-amplu text-cerneala-moale">Panoul nu e configurat.</p>
      </Cadru>
    );
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/voluntari" faraMeniu>
        <Intrare gresit={Boolean(cauta.gresit)} unde="/admin/voluntari" />
      </Cadru>
    );
  }
  if (!(await arePermisiune("/admin/voluntari"))) {
    return <FaraDrept titlu="Voluntari" activ="/admin/voluntari" />;
  }
  // Telefoane și date de naștere: după 12 ore se cere iar codul sau parola.
  if (!(await sesiuneProaspata())) {
    return (
      <Cadru titlu="Voluntari" activ="/admin/voluntari">
        <Intrare confirmare gresit={Boolean(cauta.gresit)} unde="/admin/voluntari" />
      </Cadru>
    );
  }
  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Voluntari" activ="/admin/voluntari">
        <p className="text-amplu text-cerneala-moale">Lipsește baza de date.</p>
      </Cadru>
    );
  }

  const filtre: FiltreVoluntari = {
    q: cauta.q,
    localitate: cauta.loc,
    disponibilitate: cauta.disp,
    permis: cauta.permis === "da",
    copii: cauta.copii === "da",
    limba: cauta.limba,
    majori: cauta.majori === "da",
    contact: cauta.contact,
  };
  const [toti, listaApeluri, toateRaspunsurile] = await Promise.all([
    totiVoluntarii(),
    apeluri(),
    raspunsuri(),
  ]);
  const gasiti = filtreaza(toti, filtre);
  const filtrat = Boolean(
    cauta.q || cauta.loc || cauta.disp || cauta.permis || cauta.copii || cauta.limba || cauta.majori || cauta.contact,
  );
  const apelDupaId = new Map(listaApeluri.map((a) => [a.id, a]));
  const voluntarDupaId = new Map(toti.map((v) => [v.id, v]));

  const lista: VoluntarInLista[] = gasiti.map((v) => ({
    id: v.id,
    nume: v.nume,
    email: v.email,
    telefon: v.telefon,
    localitate: v.localitate,
    disponibilitate: v.disponibilitate,
    permis: v.permis,
    copii: v.copii,
    limbi: v.limbi,
    varsta: v.varsta,
    contact: v.contact,
    stadiu: v.stadiu,
    creatLa: v.creatLa,
    linkTel: linkTelefon(v.telefon),
    linkWhatsApp: linkWhatsApp(v.telefon),
    raspunsuri: toateRaspunsurile
      .filter((r) => r.cerereId === v.id && apelDupaId.has(r.apelId))
      .map((r) => ({
        titlu: apelDupaId.get(r.apelId)!.titlu,
        cand: apelDupaId.get(r.apelId)!.cand,
        raspuns: r.raspuns,
      })),
  }));

  const locuri = localitati(toti);

  return (
    <Cadru titlu="Voluntari" activ="/admin/voluntari">
      {cauta.apel && (
        <p role="status" className="mb-6 colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-turcoaz-900">
          Apelul a fost trimis la {cauta.intrebati} {cauta.intrebati === "1" ? "voluntar" : "voluntari"}
          {cauta.emailuri !== undefined && `, ${cauta.emailuri} pe e-mail`}. Pentru ceilalți ai
          linkurile de WhatsApp la „Apelurile trimise”.
        </p>
      )}

      {/* Filtrele: GET, ca o căutare să se poată trimite cuiva ca link. */}
      <form method="get" className="grid gap-3 colt-a border border-hartie-umbra bg-hartie p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 sm:col-span-2">
          <span className="font-titlu text-nota font-bold">Caută</span>
          <input name="q" defaultValue={cauta.q} placeholder="nume, telefon, e-mail…" className={CAMP} />
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold">Localitatea</span>
          <select name="loc" defaultValue={cauta.loc ?? ""} className={CAMP}>
            <option value="">Oricare</option>
            {locuri.map((l) => (
              <option key={l.nume} value={l.nume}>
                {l.nume} ({l.cati})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold">Cât timp are</span>
          <select name="disp" defaultValue={cauta.disp ?? ""} className={CAMP}>
            <option value="">Oricât</option>
            <option value="Zilnic">Zilnic</option>
            <option value="Săptămânal">Săptămânal</option>
            <option value="Ocazional">Ocazional</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold">Limba</span>
          <input name="limba" defaultValue={cauta.limba} placeholder="engleză" className={CAMP} />
        </label>
        <label className="grid gap-1">
          <span className="font-titlu text-nota font-bold">Preferă să fie contactat pe</span>
          <select name="contact" defaultValue={cauta.contact ?? ""} className={CAMP}>
            <option value="">Oricum</option>
            {CAI_CONTACT.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-wrap items-end gap-x-5 gap-y-2 sm:col-span-2">
          <legend className="sr-only">Condiții</legend>
          <label className="flex items-center gap-2 text-mic">
            <input type="checkbox" name="permis" value="da" defaultChecked={cauta.permis === "da"} />
            Are permis
          </label>
          <label className="flex items-center gap-2 text-mic">
            <input type="checkbox" name="copii" value="da" defaultChecked={cauta.copii === "da"} />
            Experiență cu copii
          </label>
          <label className="flex items-center gap-2 text-mic">
            <input type="checkbox" name="majori" value="da" defaultChecked={cauta.majori === "da"} />
            Numai 18+
          </label>
        </fieldset>
        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="inline-flex min-h-10 items-center rounded-full bg-cerneala px-5 font-titlu font-bold text-hartie">
            Caută
          </button>
          {filtrat && (
            <Link href="/admin/voluntari" className="text-mic font-semibold text-caramiziu-700 underline underline-offset-2">
              Toți voluntarii
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6">
        {toti.length === 0 ? (
          <p className="text-amplu text-cerneala-moale">
            Încă nu s-a înscris nimeni de pe site. Formularul e la{" "}
            <Link href="/devino-voluntar" className="font-semibold text-caramiziu-700 underline">
              /devino-voluntar
            </Link>
            .
          </p>
        ) : gasiti.length === 0 ? (
          <p className="text-amplu text-cerneala-moale">Niciun voluntar nu se potrivește cu filtrele astea.</p>
        ) : (
          // Cheia se schimbă cu filtrul, ca bifele să pornească iar „toți”.
          <BazaVoluntari key={gasiti.map((v) => v.id).join(",")} voluntari={lista} areEmail={areEmail()} />
        )}
      </div>

      {listaApeluri.length > 0 && (
        <section className="mt-12">
          <h2 className="border-b border-hartie-umbra pb-2 font-titlu text-amplu font-extrabold text-cerneala">
            Apelurile trimise
          </h2>
          <ul className="mt-4 grid gap-4">
            {listaApeluri.map((a) => {
              const ai = toateRaspunsurile.filter((r) => r.apelId === a.id);
              return (
                <li key={a.id} id={`apel-${a.id}`} className="colt-a border border-hartie-umbra bg-hartie p-5">
                  <p className="font-titlu text-amplu font-bold text-cerneala">{a.titlu}</p>
                  <p className="text-mic text-cerneala-moale">
                    {a.cand}
                    {a.unde ? ` · ${a.unde}` : ""} · trimis de {a.creatDe ?? "parola asociației"},{" "}
                    {new Date(a.creatLa).toLocaleDateString("ro-RO", { day: "numeric", month: "long" })}
                  </p>
                  <p className="mt-2 text-mic font-semibold text-cerneala">
                    {a.pot} pot · {a.nuPot} nu pot · {a.intrebati - a.pot - a.nuPot} n-au răspuns
                  </p>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-mic font-semibold text-caramiziu-700">
                      Cine a răspuns, și WhatsApp pentru ceilalți
                    </summary>
                    <ul className="mt-3 grid gap-2">
                      {ai
                        .map((r) => ({ r, v: voluntarDupaId.get(r.cerereId) }))
                        .filter((x) => x.v)
                        .sort((x, y) => ordine(x.r.raspuns) - ordine(y.r.raspuns))
                        .map(({ r, v }) => {
                          const link = linkRaspuns(a.id, v!.id);
                          const wa = linkWhatsApp(
                            v!.telefon,
                            textWhatsApp(a, link, v!.nume.trim().split(/\s+/)[0] ?? ""),
                          );
                          return (
                            <li key={v!.id} className="flex flex-wrap items-center gap-2 text-mic">
                              <span className="font-semibold text-cerneala">{v!.nume}</span>
                              <span className="text-cerneala-moale">
                                {r.raspuns === "pot" ? "poate" : r.raspuns === "nu-pot" ? "nu poate" : "n-a răspuns"}
                                {r.peEmail ? " · întrebat pe e-mail" : ""}
                              </span>
                              {wa && (
                                <a
                                  href={wa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-full border border-hartie-umbra px-3 py-1 font-titlu text-nota font-bold text-cerneala hover:border-caramiziu-400"
                                >
                                  WhatsApp cu textul gata scris
                                </a>
                              )}
                              {linkTelefon(v!.telefon) && (
                                <a
                                  href={linkTelefon(v!.telefon)!}
                                  className="rounded-full border border-hartie-umbra px-3 py-1 font-titlu text-nota font-bold text-cerneala hover:border-caramiziu-400"
                                >
                                  Sună
                                </a>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </Cadru>
  );
}

function ordine(r: "pot" | "nu-pot" | null): number {
  return r === "pot" ? 0 : r === null ? 1 : 2;
}
