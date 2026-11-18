import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { donatori, rezumat, type Filtru } from "@/lib/plati/donatori";
import { scrieSuma } from "@/lib/suma";
import { cate } from "@/lib/numere-ro";
import { ButonPrincipal, CARD_ACTIV, CardCifra, Eticheta, File, StareGoala } from "@/componente/admin/ui";
import { Building2, CalendarDays, Repeat, Search, Users, Wallet } from "lucide-react";
import Cadru from "@/componente/admin/Cadru";
import Descarca from "@/componente/admin/Descarca";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import Jurnal from "@/componente/admin/Jurnal";
import { interactiuni } from "@/lib/crm";

export const metadata: Metadata = {
  title: "Donatori",
  robots: { index: false, follow: false },
};

const FILTRE: Array<{ id: Filtru; eticheta: string }> = [
  { id: "toti", eticheta: "Toți" },
  { id: "lunari", eticheta: "Donatori lunari" },
  // Primele două liste cu care se începe săptămâna: cine a tăcut și cine dă
  // mult. Stau înaintea filtrelor de buletin, care sunt treabă de MailerLite.
  { id: "opriti", eticheta: "S-au oprit" },
  { id: "mari", eticheta: "Donatori mari" },
  { id: "cu-acord", eticheta: "Cu acord de buletin" },
  { id: "fara-acord", eticheta: "Fără acord" },
  { id: "neduși", eticheta: "Cu acord, neurcați în listă" },
];

type Cautare = {
  cine?: string;
  filtru?: string;
  cauta?: string;
  gresit?: string;
  deschis?: string;
};

export default function PaginaDonatori({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Donatori">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { filtru: cerut, cauta = "", gresit, deschis, cine } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Donatori" activ="/admin/donatori">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Zona asta nu e configurată. Setează variabila{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere, și reîncarcă pagina.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/donatori" faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde="/admin/donatori" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/donatori"))) {
    return <FaraDrept titlu="Donatori" activ="/admin/donatori" />;
  }
  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Donatori" activ="/admin/donatori">
        <p>Baza de date nu e legată la site.</p>
      </Cadru>
    );
  }

  const filtru = (FILTRE.find((f) => f.id === cerut)?.id ?? "toti") as Filtru;
  const [toti, cifre] = await Promise.all([
    donatori(filtru, cauta),
    rezumat(),
  ]);
  const tip = cine === "firme" || cine === "pf" ? cine : null;
  const lista = toti.filter((d) => (tip === "firme" ? d.deLaFirma : tip === "pf" ? !d.deLaFirma : true));
  const nrFirme = toti.filter((d) => d.deLaFirma).length;

  // Jurnalul se citește doar pentru donatorul deschis. O listă de 200 de
  // oameni ar face altfel 200 de interogări ca să arate 200 de liste goale.
  const jurnal = deschis ? await interactiuni({ email: deschis }) : [];

  // „Închide" și salvarea se întorc la aceeași listă, cu filtrele ei.
  const parametri = new URLSearchParams();
  if (filtru !== "toti") parametri.set("filtru", filtru);
  if (cauta) parametri.set("cauta", cauta);
  if (tip) parametri.set("cine", tip);
  const inapoiLa = `/admin/donatori${parametri.size ? `?${parametri}` : ""}`;

  return (
    <Cadru
      titlu="Donatori"
      activ="/admin/donatori"
      actiuni={
        <>
          <Descarca ce="donatori" />
          <ButonPrincipal href="/admin/donatii?de-mana=1">Adaugă donație</ButonPrincipal>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardCifra eticheta="Total strâns" valoare={scrieSuma(cifre.totalBani / 100)} sectiune="bani" I={Wallet} />
        <CardCifra eticheta="Luna aceasta" valoare={scrieSuma(cifre.lunaAsta / 100)} sectiune="bani" I={CalendarDays} />
        <CardCifra eticheta="Donatori" valoare={String(cifre.donatori)} sectiune="oameni" I={Users} />
        <CardCifra eticheta="Donatori lunari" valoare={String(cifre.lunari)} sectiune="oameni" I={Repeat} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <File
          file={[
            { eticheta: "Toți", href: cuParam(filtru, cauta, null), numar: toti.length, activ: !tip },
            { eticheta: "Persoane fizice", href: cuParam(filtru, cauta, "pf"), numar: toti.length - nrFirme, activ: tip === "pf" },
            { eticheta: "Firme", href: cuParam(filtru, cauta, "firme"), numar: nrFirme, activ: tip === "firme" },
          ]}
        />
        {/* Segmentele de lucru: „Apeși pe unul și lista se strânge la ei”. */}
        <nav aria-label="Segmente" className="flex flex-wrap items-center gap-2">
          {[
            { id: "opriti", eticheta: "S-au oprit" },
            { id: "mari", eticheta: "Donatori mari" },
            { id: "toti", eticheta: "Toți" },
          ].map((sg) => (
            <a
              key={sg.id}
              href={cuParam(sg.id as Filtru, cauta, tip)}
              aria-current={filtru === sg.id ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 font-titlu text-[13px] font-bold transition-colors duration-150 ${
                filtru === sg.id
                  ? "border-caramiziu-700 bg-caramiziu-700 text-hartie"
                  : "border-hartie-umbra bg-hartie text-cerneala-moale hover:border-caramiziu-400 hover:text-cerneala"
              }`}
            >
              {sg.eticheta}
            </a>
          ))}
        </nav>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        {tip && <input type="hidden" name="cine" value={tip} />}
        <label className="relative min-w-0 basis-full sm:basis-auto sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-cerneala-slab" aria-hidden="true" />
          <input
            name="cauta"
            defaultValue={cauta}
            placeholder="Caută după nume sau e-mail"
            aria-label="Caută"
            className="h-11 w-full rounded-full border border-hartie-umbra bg-hartie pr-4 pl-10 text-[14px] focus:border-caramiziu-400 focus:outline-none"
          />
        </label>
        <select
          name="filtru"
          defaultValue={filtru}
          aria-label="Filtru"
          className="h-11 rounded-full border border-hartie-umbra bg-hartie px-4 text-[14px]"
        >
          {FILTRE.map((f) => (
            <option key={f.id} value={f.id}>
              {f.eticheta}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-full bg-cerneala px-6 font-titlu text-[14px] font-bold text-hartie hover:bg-cerneala/85">
          Arată
        </button>
      </form>

      {lista.length === 0 ? (
        <div className="mt-6">
          <StareGoala I={Users} text="Niciun donator care să se potrivească." />
        </div>
      ) : (
        <ul data-lista-donatori className="mt-6 grid gap-2.5">
          {lista.map((d) => {
            const fisa = `${inapoiLa}${inapoiLa.includes("?") ? "&" : "?"}deschis=${encodeURIComponent(d.email)}`;
            return (
              <li
                key={d.email}
                data-donator={d.deLaFirma ? "firma" : "pf"}
                className={`${CARD_ACTIV} relative overflow-hidden py-4 pr-4 pl-5`}
              >
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${d.deLaFirma ? "bg-orange-400" : "bg-sky-400"}`} />
                <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
                  <span
                    aria-hidden="true"
                    className={`grid size-11 shrink-0 place-items-center rounded-full font-titlu text-[14px] font-bold ${d.deLaFirma ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"}`}
                  >
                    {d.deLaFirma ? <Building2 className="size-5" strokeWidth={1.9} /> : initiale(d.nume || d.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      {/* Numele deschide fișa: jurnalul și notițele. */}
                      <a href={fisa} className="truncate font-titlu text-[15px] font-bold text-cerneala hover:text-caramiziu-700">
                        {d.nume || "(fără nume)"}
                      </a>
                      {d.deLaFirma && <Eticheta ton="nou">Firmă</Eticheta>}
                      {d.lunare > 0 && <Eticheta ton="asteptam">lunar</Eticheta>}
                    </span>
                    <span className="block truncate text-[13px] text-cerneala-moale">
                      {d.email}
                      {d.telefon && (
                        <>
                          {" · "}
                          <a href={`tel:${d.telefon.replace(/\s/g, "")}`} className="font-semibold text-caramiziu-700 hover:underline">
                            {d.telefon}
                          </a>
                        </>
                      )}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-cerneala-slab">
                      <span>{cate(d.donatii, "donație", "donații")}</span>
                      <span>ultima {d.ultimaLa ? ZI.format(new Date(d.ultimaLa)) : "—"}</span>
                      <Eticheta ton={d.acordBuletin ? (d.dusLaBuletin ? "bani" : "deFacut") : "gri"}>
                        {d.acordBuletin ? (d.dusLaBuletin ? "în buletin" : "acord, neurcat") : "fără acord buletin"}
                      </Eticheta>
                    </span>
                  </span>
                  <span className="flex basis-full items-center justify-between gap-3 border-t border-hartie-umbra/60 pt-2.5 sm:basis-auto sm:shrink-0 sm:flex-col sm:items-end sm:justify-start sm:gap-1.5 sm:border-0 sm:pt-0">
                    <span className="font-titlu text-[18px] font-bold whitespace-nowrap text-emerald-700 tabular-nums">
                      {scrieSuma(d.totalBani / 100)}
                    </span>
                    <span className="flex items-center gap-1.5">

                      <form action="/api/admin/donatori" method="post">
                        <input type="hidden" name="email" value={d.email} />
                        <input type="hidden" name="fapta" value="uita" />
                        <button
                          type="submit"
                          className="rounded-full border border-hartie-umbra px-3 py-1 font-titlu text-[12.5px] font-bold text-cerneala-slab hover:border-caramiziu-400 hover:text-caramiziu-700"
                        >
                          Uită-l
                        </button>
                      </form>
                    </span>
                  </span>
                </div>
                <Jurnal
                  email={d.email}
                  deschis={deschis === d.email}
                  intrari={deschis === d.email ? jurnal : []}
                  inapoiLa={inapoiLa}
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 max-w-3xl text-mic text-cerneala-moale">
        <strong>„Uită-l”</strong> șterge numele, e-mailul și telefonul din toate
        donațiile omului, dar păstrează suma, data și destinația: asociația are
        obligația legală să țină evidența contabilă. Omul dispare din listă;
        banii rămân în contabilitate. Operația nu se poate anula.
      </p>
    </Cadru>
  );
}

function cuParam(filtru: Filtru, cauta: string, cine: string | null): string {
  const q = new URLSearchParams();
  if (filtru !== "toti") q.set("filtru", filtru);
  if (cauta) q.set("cauta", cauta);
  if (cine) q.set("cine", cine);
  return `/admin/donatori${q.size ? `?${q}` : ""}`;
}

function initiale(t: string): string {
  const c = t.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((c[0]?.[0] ?? "") + (c[1]?.[0] ?? "")).toUpperCase() || "?";
}

const ZI = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Bucharest" });
