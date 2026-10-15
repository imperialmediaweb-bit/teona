import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import CadruLegal from "@/componente/pagina/CadruLegal";
import DeschideSetariCookieuri from "@/componente/DeschideSetariCookieuri";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";

export const metadata: Metadata = metadate({
  titlu: "Politica de cookie-uri",
  descriere:
    "Ce cookie-uri folosește site-ul Asociației Teona Ariana Suceava, la ce servesc și cum le poți accepta sau refuza.",
  cale: "/politica-de-cookieuri",
});

export default function Pagina() {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          { nume: "Politica de cookie-uri", cale: RUTE.cookieuri },
        ])}
      />
      <CadruLegal titlu="Politica de cookie-uri" slugVechi="cookies">
        {/*
          Textul de mai sus e cel de pe site-ul vechi și rămâne neatins — e un
          document juridic. Dar site-ul nou chiar încarcă Google Analytics, iar
          o politică de cookie-uri care nu-l numește nu e o politică. Ce
          folosim azi scrie aici, separat, cu numele cookie-urilor și cu
          durata lor.
        */}
        <div className="mt-14 border-t border-hartie-umbra pt-10">
          <h2 className="text-h3 text-cerneala">
            Ce folosim pe site-ul acesta
          </h2>

          <h3 className="mt-7 text-h4 text-cerneala">Strict necesare</h3>
          <p className="mt-2 text-amplu text-cerneala-moale">
            Site-ul ține minte în browserul tău ce ai ales în bannerul de
            cookie-uri, ca să nu te întrebe la fiecare pagină. Nu e un cookie
            trimis spre server, ci o valoare păstrată local, pe dispozitivul
            tău. Nu poate fi refuzată: fără ea, alegerea ta nu s-ar ține minte.
          </p>

          <h3 className="mt-7 text-h4 text-cerneala">Statistici</h3>
          <p className="mt-2 text-amplu text-cerneala-moale">
            Folosim Google Analytics 4, ca să știm câți oameni ajung pe site și
            ce pagini citesc. Pune două cookie-uri —{" "}
            <code className="rounded bg-hartie-umbra px-1.5">_ga</code> și{" "}
            <code className="rounded bg-hartie-umbra px-1.5">_ga_…</code> — care
            rămân în browser până la doi ani (durata stabilită de Google) și
            care deosebesc vizitatorii între ei, fără să-i identifice cu numele.
            Adresa IP e anonimizată.
          </p>
          <p className="mt-3 text-amplu text-cerneala-moale">
            <strong className="font-titlu font-bold text-cerneala">
              Nu se încarcă nimic până nu bifezi „Statistici”.
            </strong>{" "}
            Dacă refuzi, scriptul Google nu intră deloc în pagină și niciun
            cookie al lor nu se scrie.
          </p>

          <h3 className="mt-7 text-h4 text-cerneala">Marketing</h3>
          <p className="mt-2 text-amplu text-cerneala-moale">
            Nu folosim niciunul. Categoria rămâne în banner pentru ziua în care
            asociația ar porni o campanie de reclame; până atunci, bifată sau
            nu, nu se încarcă nimic.
          </p>

          <h3 className="mt-7 text-h4 text-cerneala">Formularul 230</h3>
          <p className="mt-2 text-amplu text-cerneala-moale">
            Pagina de redirecționare 3,5% încarcă formularul celor de la
            formular230.ro, într-un cadru al lor. Ce cookie-uri pune acolo țin
            de politica lor, nu de a noastră.
          </p>

          <p className="mt-7 text-amplu text-cerneala-moale">
            Îți poți schimba alegerea oricând, din{" "}
            <DeschideSetariCookieuri className="font-titlu font-bold text-caramiziu-700 underline underline-offset-4">
              setările de cookie-uri
            </DeschideSetariCookieuri>
            , din subsolul oricărei pagini.
          </p>
        </div>
      </CadruLegal>
    </>
  );
}
