import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cate, forma } from "@/lib/numere-ro";
import { STADII_FIRMA, esteStadiuFirma } from "@/lib/crm";
import {
  cifreleFirmelor,
  FILE_FIRME,
  listaFirmelor,
  marcheazaNelegateCitite,
  mesajeNelegate,
  NU_RASPUNDE_DUPA,
  type FilaFirme,
  type RandListaFirme,
} from "@/lib/mesaje-firme";
import Cadru from "@/componente/admin/Cadru";
import Pictograma, { type NumePictograma } from "@/componente/Pictograma";
import Descarca from "@/componente/admin/Descarca";
import MesajFirma from "@/componente/admin/firme/MesajFirma";
import Stadiu from "@/componente/admin/firme/Stadiu";
import { poarta } from "@/componente/admin/firme/Poarta";

/**
 * Firme / Sponsori: o singură pagină pentru fișele firmelor și e-mailurile cu
 * ele (până în noiembrie 2026 erau două, „Firme” și „Mesaje cu firmele”, și
 * omul nu știa în care să caute). Un rând = o firmă; clic pe el = pagina
 * firmei, cu discuția, formularul de răspuns, stadiul, notițele și contractul.
 */

export const metadata: Metadata = {
  title: "Firme / Sponsori",
  robots: { index: false, follow: false },
};

type Cautare = {
  fila?: string;
  cauta?: string;
  necitite?: string;
  stadiu?: string;
  uitate?: string;
  gresit?: string;
  trimise?: string;
  ratate?: string;
  refuza?: string;
  stearsa?: string;
  arhivata?: string;
  deschis?: string;
};

export default function PaginaFirme({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="Firme / Sponsori">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const ZI = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" });
const ORA = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
function cand(iso: string): string {
  const d = new Date(iso);
  const azi = ZI.format(new Date());
  return ZI.format(d) === azi ? `azi, ${ORA.format(d)}` : ZI.format(d);
}

const FILE_VALIDE: readonly FilaFirme[] = ["toate", "asteapta", "raspuns", "semnat", "contactate"];

/** Adresa listei cu filtrele de acum, schimbate. Căutarea rămâne când schimbi fila. */
function adresa(c: { fila: FilaFirme; cauta: string; necitite?: boolean; stadiu?: string }): string {
  const p = new URLSearchParams();
  if (c.fila !== "toate") p.set("fila", c.fila);
  if (c.necitite) p.set("necitite", "1");
  if (c.stadiu) p.set("stadiu", c.stadiu);
  if (c.cauta) p.set("cauta", c.cauta);
  const s = p.toString();
  return s ? `/admin/firme?${s}` : "/admin/firme";
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const q = await searchParams;
  const oprit = await poarta("Firme / Sponsori", "/admin/firme", q.gresit);
  if (oprit) return oprit;
  // Linkurile vechi spre fișa deschisă în listă (`?deschis=<id>`) duc acum la pagina firmei.
  if (/^[0-9a-f-]{36}$/i.test(q.deschis ?? "")) redirect(`/admin/firme/${q.deschis}/mesaje`);

  const fila: FilaFirme = FILE_VALIDE.includes(q.fila as FilaFirme) ? (q.fila as FilaFirme) : "toate";
  const cauta = (q.cauta ?? "").slice(0, 100);
  const necitite = q.necitite === "1";
  const stadiu = esteStadiuFirma(q.stadiu) ? q.stadiu : undefined;
  const uitate = q.uitate === "1";

  const [lista, cifre] = await Promise.all([
    listaFirmelor({ fila, cauta, necitite, stadiu, uitate }),
    cifreleFirmelor(),
  ]);
  // Răspunsurile care n-au putut fi legate de o firmă se văd la „Toate” și „Au răspuns”.
  const arataNelegate = (fila === "toate" || fila === "raspuns") && !cauta && !stadiu && !uitate;
  const nelegate = arataNelegate ? await mesajeNelegate() : [];
  if (nelegate.some((m) => !m.citit))
    await marcheazaNelegateCitite(nelegate.filter((m) => !m.citit).map((m) => String(m.id))).catch(() => undefined);

  const numarPeFila: Record<string, number> = {
    toate: cifre.toate,
    asteapta: cifre.asteapta,
    raspuns: cifre.raspuns,
    semnat: cifre.semnat,
  };

  return (
    <Cadru
      titlu="Firme / Sponsori"
      descriere="Firmele cu care vorbiți și e-mailurile cu ele. Clic pe o firmă ca să vezi discuția și să răspunzi."
      activ="/admin/firme"
      actiuni={
        <span className="flex flex-wrap items-center gap-2">
          <Descarca ce="firme" />
          <Link
            href="/admin/firme/scrie"
            data-email-nou
            className="inline-flex items-center gap-2 rounded-full bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie shadow-sm hover:bg-caramiziu-800"
          >
            <Pictograma nume="plus" className="size-4" strokeWidth={2.5} />
            E-mail nou
          </Link>
        </span>
      }
    >
      {q.stearsa && <Anunt>Firma a fost ștearsă, cu discuția și atașamentele ei.</Anunt>}
      {q.arhivata && (
        <Anunt ton="neutru">
          Firma are contracte sau donații, deci n-am șters-o: e arhivată. Nu mai apare în liste, dar rămâne în registru și în
          rapoarte.
        </Anunt>
      )}
      {q.trimise !== undefined && (
        <Anunt ton={Number(q.trimise) === 0 ? "rau" : "bun"}>
          {Number(q.trimise) === 1
            ? "A plecat 1 e-mail."
            : Number(q.trimise) === 0
              ? "N-a plecat niciun e-mail."
              : `Au plecat ${cate(Number(q.trimise), "e-mail", "e-mailuri")}, fiecare la firma lui.`}
          {q.ratate && <span className="block font-normal text-caramiziu-900">N-au plecat: {q.ratate}.</span>}
          {q.refuza && <span className="block font-normal">Sărite, fiindcă nu mai vor e-mailuri: {q.refuza}.</span>}
        </Anunt>
      )}

      {/* Trei cifre; fiecare e și un filtru. */}
      <ul data-cifre-mesaje className="mb-6 grid max-w-4xl grid-cols-3 gap-2 sm:gap-3">
        {(
          [
            { k: "contactate", e: forma(cifre.contactate, "contactată", "contactate"), n: cifre.contactate, p: "trimis", ton: "bg-cerneala/5 text-cerneala" },
            { k: "raspuns", e: forma(cifre.raspuns, "a răspuns", "au răspuns"), n: cifre.raspuns, p: "raspuns", ton: "bg-miere-100 text-cerneala" },
            { k: "semnat", e: forma(cifre.semnat, "contract semnat", "contracte semnate"), n: cifre.semnat, p: "bifa", ton: "bg-turcoaz-100 text-turcoaz-900" },
          ] as const
        ).map((c) => {
          const aici = fila === c.k && !necitite;
          return (
            <li key={c.k} data-cifra={c.k} data-n={c.n}>
              <Link
                href={aici ? adresa({ fila: "toate", cauta }) : adresa({ fila: c.k, cauta })}
                aria-current={aici ? "page" : undefined}
                title={aici ? "Arată toate firmele" : `Arată numai firmele: ${c.e}`}
                className={`flex h-full items-center gap-3 rounded-card border p-3 transition-colors hover:border-caramiziu-400 sm:p-4 ${
                  aici ? "border-caramiziu-700 bg-caramiziu-50 ring-1 ring-caramiziu-700" : "border-hartie-umbra bg-hartie"
                }`}
              >
                <span className={`hidden size-10 shrink-0 place-items-center rounded-full sm:grid ${c.ton}`}>
                  <Pictograma nume={c.p} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2 font-titlu text-2xl leading-none font-bold text-cerneala">
                    {c.n}
                    {/* Procentul numai la „au răspuns”: semnatele pot fi și firme cărora nu le-am scris din panou. */}
                    {c.k === "raspuns" && c.n > 0 && cifre.contactate > 0 && (
                      <span className="text-mic font-semibold text-cerneala-slab">{Math.round((c.n / cifre.contactate) * 100)}%</span>
                    )}
                  </span>
                  <span className="mt-1 block text-nota leading-tight text-cerneala-moale">{c.e}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Filele și căutarea, într-un singur bloc. */}
      <div className="max-w-4xl rounded-card border border-hartie-umbra bg-hartie p-2 sm:p-3">
        <nav aria-label="Ce firme arăt" className="flex gap-1 overflow-x-auto pb-1">
          {FILE_FIRME.map((x) => {
            const aici = fila === x.id && !necitite;
            return (
              <Link
                key={x.id}
                href={adresa({ fila: x.id, cauta })}
                aria-current={aici ? "page" : undefined}
                data-fila={x.id}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-titlu text-mic font-bold whitespace-nowrap transition-colors ${
                  aici ? "bg-cerneala text-hartie" : "text-cerneala-moale hover:bg-hartie-calda hover:text-cerneala"
                }`}
              >
                {x.eticheta}
                <span
                  className={`rounded-full px-1.5 text-nota font-semibold ${aici ? "bg-hartie/20 text-hartie" : "bg-hartie-umbra/70 text-cerneala-slab"}`}
                >
                  {numarPeFila[x.id]}
                </span>
              </Link>
            );
          })}
          {cifre.necitite > 0 && (
            <Link
              href={adresa({ fila: "raspuns", cauta, necitite: true })}
              aria-current={necitite ? "page" : undefined}
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-titlu text-mic font-bold whitespace-nowrap ${
                necitite ? "bg-caramiziu-700 text-hartie" : "bg-caramiziu-50 text-caramiziu-900 hover:bg-caramiziu-100"
              }`}
            >
              <span aria-hidden="true" className={`size-2 rounded-full ${necitite ? "bg-hartie" : "bg-caramiziu-600"}`} />
              {cate(cifre.necitite, "răspuns necitit", "răspunsuri necitite")}
            </Link>
          )}
        </nav>
        <form method="get" action="/admin/firme" className="mt-2 flex flex-wrap gap-2 border-t border-hartie-umbra pt-3">
          {fila !== "toate" && <input type="hidden" name="fila" value={fila} />}
          {necitite && <input type="hidden" name="necitite" value="1" />}
          <label className="relative min-w-0 flex-1 basis-56">
            <Pictograma nume="lupa" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cerneala-slab" />
            <input
              name="cauta"
              type="search"
              defaultValue={cauta}
              placeholder="Caută după nume, e-mail sau CUI"
              aria-label="Caută după nume, e-mail sau CUI"
              className="w-full rounded-moale border border-hartie-umbra bg-hartie-calda/60 py-2.5 pr-3 pl-9 text-mic focus:bg-hartie"
            />
          </label>
          <select
            name="stadiu"
            defaultValue={stadiu ?? ""}
            aria-label="Stadiul"
            className="rounded-moale border border-hartie-umbra bg-hartie px-3 py-2.5 text-mic"
          >
            <option value="">Orice stadiu</option>
            {STADII_FIRMA.map((s) => (
              <option key={s.id} value={s.id}>
                {s.eticheta}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-cerneala px-5 py-2.5 font-titlu text-mic font-bold text-hartie hover:bg-cerneala-moale">
            Caută
          </button>
        </form>
      </div>

      {(necitite || uitate || stadiu || cauta) && (
        <p className="mt-4 max-w-4xl text-mic text-cerneala-moale">
          {necitite && "Numai firmele cu răspunsuri necitite. "}
          {uitate && "Numai firmele fără răspuns de două săptămâni (fără nicio notiță scrisă între timp). "}
          {stadiu && `Numai stadiul „${STADII_FIRMA.find((s) => s.id === stadiu)?.eticheta}”. `}
          {cauta && `Căutare: „${cauta}”. `}
          <Link href="/admin/firme" className="font-semibold text-caramiziu-700 underline underline-offset-2">
            Arată toate firmele
          </Link>
        </p>
      )}

      {lista.length === 0 ? (
        <div className="mt-6 grid max-w-4xl place-items-center gap-3 rounded-card border border-dashed border-hartie-umbra bg-hartie px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-hartie-calda text-cerneala-slab">
            <Pictograma nume="cladire" className="size-6" />
          </span>
          <p className="max-w-md text-mic text-cerneala-moale">
            {cauta || stadiu || uitate || necitite || fila !== "toate"
              ? "Nicio firmă aici."
              : "Nicio firmă încă. Apasă „E-mail nou” ca să scrii uneia; firmele care completează formularul de pe site apar și ele aici."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid max-w-4xl overflow-hidden rounded-card border border-hartie-umbra bg-hartie">
          {lista.map((f) => (
            <RandFirma key={f.id} f={f} />
          ))}
        </ul>
      )}

      {nelegate.length > 0 && (
        <section className="mt-10 grid max-w-4xl gap-4">
          <h2 className="font-titlu text-amplu font-bold text-cerneala">Răspunsuri pe care nu le-am putut lega de o firmă</h2>
          <p className="text-mic text-cerneala-moale">
            Au venit de la o adresă care nu e în nicio fișă de firmă. Dacă e o firmă de-a voastră, puneți adresa asta în fișa ei.
          </p>
          {nelegate.map((m) => (
            <MesajFirma key={m.id} m={m} />
          ))}
        </section>
      )}
    </Cadru>
  );
}

function Anunt({ ton = "bun", children }: { ton?: "bun" | "neutru" | "rau"; children: React.ReactNode }) {
  const c = { bun: "bg-turcoaz-50 text-turcoaz-900", neutru: "bg-hartie-umbra/70 text-cerneala", rau: "bg-caramiziu-50 text-caramiziu-900" }[ton];
  return (
    <p role="status" className={`mb-6 max-w-4xl colt-mic-a px-4 py-3 text-mic font-semibold ${c}`}>
      {children}
    </p>
  );
}

/** Inițialele firmei, fără „SRL”, „SA” și altele asemenea. */
function initiale(nume: string): string {
  const cuvinte = nume
    .replace(/\b(S\.?R\.?L\.?|S\.?A\.?|S\.?C\.?|P\.?F\.?A\.?|I\.?I\.?|SRL-D)\b/gi, "")
    .split(/[\s\-.&]+/)
    .filter((x) => /\p{L}|\d/u.test(x));
  return ((cuvinte[0]?.[0] ?? "?") + (cuvinte[1]?.[0] ?? "")).toUpperCase();
}

const FONDURI = ["bg-caramiziu-100 text-caramiziu-900", "bg-turcoaz-100 text-turcoaz-900", "bg-miere-100 text-cerneala", "bg-sky-100 text-sky-900", "bg-hartie-umbra text-cerneala"];
function fond(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FONDURI[h % FONDURI.length];
}

function RandFirma({ f }: { f: RandListaFirme }) {
  /*
    „Nu răspunde” numai cât nu există niciun răspuns după ultimul e-mail
    trimis (`faraRaspuns` numără numai e-mailurile de după ultimul răspuns), și
    numai pe drum: o firmă cu contract semnat nu mai e „care nu răspunde”.
  */
  const nuRaspunde = f.faraRaspuns >= NU_RASPUNDE_DUPA && !["semnat", "incasat", "renuntat"].includes(f.stadiu) && !f.faraEmailuri;
  const u = f.ultimul;
  const icoana: NumePictograma = u?.directie === "primit" ? "raspuns" : "trimis";
  return (
    <li className="border-b border-hartie-umbra last:border-b-0">
      <Link
        href={`/admin/firme/${f.id}/mesaje${u ? "#jos" : ""}`}
        data-discutie
        data-firma={f.id}
        className={`group flex items-start gap-3 px-3 py-3.5 transition-colors hover:bg-hartie-calda sm:px-4 ${f.necitite ? "bg-caramiziu-50/40" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`relative grid size-10 shrink-0 place-items-center rounded-full font-titlu text-mic font-bold ${fond(f.id)}`}
        >
          {initiale(f.denumire)}
          {f.necitite > 0 && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-hartie bg-caramiziu-600" />}
        </span>
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`font-titlu text-mic text-cerneala [overflow-wrap:anywhere] ${f.necitite ? "font-extrabold" : "font-bold"}`}>
              {f.denumire}
            </span>
            <Stadiu stadiu={f.stadiu} />
            {f.necitite > 0 && (
              <span data-nou className="rounded-full bg-caramiziu-700 px-2 py-0.5 font-titlu text-nota font-bold text-hartie">
                {f.necitite === 1 ? "nou" : `${f.necitite} noi`}
              </span>
            )}
            {nuRaspunde && (
              <span data-nu-raspunde className="inline-flex items-center gap-1 rounded-full bg-hartie-umbra/70 px-2 py-0.5 text-nota font-semibold text-cerneala-moale">
                <Pictograma nume="ceas" className="size-3.5" />
                Nu răspunde: {cate(f.faraRaspuns, "e-mail", "e-mailuri")} fără răspuns
              </span>
            )}
            {f.faraEmailuri && (
              <span className="rounded-full bg-caramiziu-50 px-2 py-0.5 text-nota font-semibold text-caramiziu-900">nu vrea e-mailuri</span>
            )}
          </span>
          {u ? (
            <span className="flex min-w-0 items-center gap-1.5 text-nota text-cerneala-moale">
              <Pictograma
                nume={icoana}
                role="img"
                aria-hidden={false}
                aria-label={u.directie === "primit" ? "a răspuns" : "trimis de noi"}
                className={`size-3.5 shrink-0 ${u.directie === "primit" ? "text-caramiziu-700" : "text-cerneala-slab"}`}
              />
              <span className="min-w-0 truncate">
                <span className={u.directie === "primit" ? "font-semibold text-cerneala" : "text-cerneala"}>{u.cine}:</span>{" "}
                {u.inceput || u.subiect}
              </span>
            </span>
          ) : (
            <span className="truncate text-nota text-cerneala-slab">
              {f.persoana} · {f.email} · niciun e-mail încă
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 pl-1 text-nota text-cerneala-slab">
          {u && <span className="whitespace-nowrap">{cand(u.cand)}</span>}
          <Pictograma nume="sageata" className="size-4 text-cerneala-slab/60 transition-transform group-hover:translate-x-0.5 group-hover:text-caramiziu-700" />
        </span>
      </Link>
    </li>
  );
}
