import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import { toateTextele, felul, type Text } from "@/lib/texte";
import { MOMENTE, RITM_LUNAR, type Moment } from "@/date/calendar-fundraising";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

/**
 * Calendarul de publicare: ce iese și când.
 *
 * **De ce.** Comunicarea unui ONG mic se face în rafale — trei postări
 * într-o săptămână, apoi șase săptămâni de tăcere, și campania de Crăciun
 * începută pe 20 decembrie, după ce toată lumea a dat deja. Calendarul nu
 * scrie în locul nimănui; arată săptămânile goale cât mai e timp de umplut.
 *
 * **Ce se vede pe el:** ce s-a publicat deja, ce e plănuit (o ciornă cu zi
 * pusă) și momentele care se repetă an de an — 25 mai, începutul școlii,
 * taberele, sărbătorile. Alea din urmă sunt scrise o dată, în
 * `src/date/calendar-fundraising.ts`, și apar singure în fiecare an.
 *
 * **Nimic nu se publică singur.** Ziua pusă pe o ciornă e o intenție, nu un
 * ceas: un text bun azi poate fi nepotrivit în ziua în care l-ai plănuit —
 * un copil bolnav, o înmormântare, o știre proastă în oraș.
 */

const LUNI = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

const ZILE = ["L", "Ma", "Mi", "J", "V", "S", "D"];

function lunaDinAdresa(scris: string | undefined): { an: number; luna: number } {
  const acum = new Date();
  if (scris && /^\d{4}-\d{2}$/.test(scris)) {
    const [an, luna] = scris.split("-").map(Number);
    if (an >= 2020 && an <= 2100 && luna >= 1 && luna <= 12) return { an, luna };
  }
  return { an: acum.getFullYear(), luna: acum.getMonth() + 1 };
}

function cheieLuna(an: number, luna: number): string {
  return `${an}-${String(luna).padStart(2, "0")}`;
}

export default function PaginaCalendar({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; luna?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Calendar">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; luna?: string }>;
}) {
  await connection();
  const { gresit, luna: lunaScrisa } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Calendar" activ="/admin/calendar">
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
      <Cadru titlu="Calendar" activ="/admin/calendar">
        <Intrare gresit={Boolean(gresit)} unde="/admin/calendar" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/calendar"))) {
    return <FaraDrept titlu="Calendar" activ="/admin/calendar" />;
  }

  const { an, luna } = lunaDinAdresa(lunaScrisa);
  const texte = areBazaDeDate() ? await toateTextele().catch((): Text[] => []) : [];

  /*
    Ce pică în luna asta: textele publicate atunci și ciornele plănuite.
    Proiectele nu intră — ele n-au o zi de publicare, au o dată de tabără.
  */
  const inLuna = texte
    .filter((t) => t.fel !== "proiect")
    .map((t) => ({
      text: t,
      zi: (t.planificatLa ?? t.publicatLa ?? "").slice(0, 10),
    }))
    .filter((x) => x.zi.startsWith(cheieLuna(an, luna)))
    .map((x) => ({ ...x, numar: Number(x.zi.slice(8, 10)) }));

  const momenteleLunii = MOMENTE.filter((m) => m.luna === luna);
  const zileInLuna = new Date(an, luna, 0).getDate();
  // Luni = 0. `getDay()` dă duminica 0, deci se rotește.
  const inceput = (new Date(an, luna - 1, 1).getDay() + 6) % 7;
  const azi = new Date();
  const esteLunaCurenta =
    azi.getFullYear() === an && azi.getMonth() + 1 === luna;

  const inainte = luna === 1 ? cheieLuna(an - 1, 12) : cheieLuna(an, luna - 1);
  const dupa = luna === 12 ? cheieLuna(an + 1, 1) : cheieLuna(an, luna + 1);

  const ciorne = texte.filter((t) => !t.publicat && t.fel !== "proiect");

  return (
    <Cadru
      titlu="Calendar"
      descriere="Ce iese pe site și când. Ce se repetă în fiecare an e deja pe el."
      activ="/admin/calendar"
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/calendar?luna=${inainte}`}
          className="inline-flex min-h-11 items-center rounded-full border-2 border-hartie-umbra px-4 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
        >
          ← {LUNI[(luna + 10) % 12]}
        </Link>
        <h2 className="font-titlu text-h4 font-extrabold text-cerneala">
          {LUNI[luna - 1]} {an}
        </h2>
        <Link
          href={`/admin/calendar?luna=${dupa}`}
          className="inline-flex min-h-11 items-center rounded-full border-2 border-hartie-umbra px-4 font-titlu font-bold text-cerneala-moale transition-colors hover:border-caramiziu-400"
        >
          {LUNI[luna % 12]} →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-3xl grid-cols-7 gap-px bg-hartie-umbra colt-a p-px">
          {ZILE.map((z) => (
            <div
              key={z}
              className="bg-hartie px-2 py-2 text-center font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase"
            >
              {z}
            </div>
          ))}

          {Array.from({ length: inceput }).map((_, i) => (
            <div key={`gol-${i}`} className="min-h-28 bg-hartie-umbra/30" />
          ))}

          {Array.from({ length: zileInLuna }).map((_, i) => {
            const numar = i + 1;
            const aziAici = esteLunaCurenta && azi.getDate() === numar;
            const aleLui = inLuna.filter((x) => x.numar === numar);
            const momente = momenteleLunii.filter((m) => m.zi === numar);
            return (
              <div
                key={numar}
                className={`min-h-28 bg-hartie p-2 ${aziAici ? "ring-2 ring-caramiziu-500 ring-inset" : ""}`}
              >
                <p
                  className={`font-titlu text-nota font-bold ${aziAici ? "text-caramiziu-700" : "text-cerneala-slab"}`}
                >
                  {numar}
                </p>
                {momente.map((m) => (
                  <Eticheta key={m.titlu} moment={m} />
                ))}
                {aleLui.map((x) => (
                  <p
                    key={x.text.id}
                    className={`mt-1 colt-mic-a px-1.5 py-1 text-nota leading-snug ${
                      x.text.publicat
                        ? "bg-turcoaz-100 text-cerneala"
                        : "border border-dashed border-caramiziu-300 text-cerneala-moale"
                    }`}
                  >
                    <Link href={`/admin/scrie/${x.text.id}`}>
                      {x.text.publicat ? "" : "ciornă · "}
                      {x.text.titlu}
                    </Link>
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {momenteleLunii.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 border-b border-hartie-umbra pb-2 font-titlu text-amplu font-extrabold text-cerneala">
            Ce e de făcut în {LUNI[luna - 1]}
          </h2>
          <ul className="grid gap-3">
            {momenteleLunii.map((m) => (
              <li
                key={m.titlu}
                className="colt-a border border-hartie-umbra bg-hartie p-4"
              >
                <p className="font-titlu font-bold text-cerneala">
                  {m.zi ? `${m.zi} ${LUNI[luna - 1]} · ` : ""}
                  {m.titlu}
                </p>
                <p className="mt-1 text-mic text-cerneala-moale">{m.ce}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 border-b border-hartie-umbra pb-2 font-titlu text-amplu font-extrabold text-cerneala">
          În fiecare lună, oricare ar fi ea
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {RITM_LUNAR.map((r) => (
            <li
              key={r.titlu}
              className="colt-a border border-hartie-umbra bg-hartie p-4"
            >
              <p className="font-titlu font-bold text-cerneala">{r.titlu}</p>
              <p className="mt-1 text-mic text-cerneala-moale">{r.ce}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-hartie-umbra pb-2">
          <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
            Ciornele
          </h2>
          <p className="text-nota text-cerneala-slab">
            Pune-le o zi și apar în calendar. Publicarea rămâne o apăsare de om.
          </p>
        </div>
        {ciorne.length === 0 ? (
          <p className="max-w-2xl text-amplu text-cerneala-moale">
            Nicio ciornă. Se scriu la{" "}
            <Link
              href="/admin/scrie"
              className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Scrie pe site
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-3">
            {ciorne.map((t) => (
              <li
                key={t.id}
                className="colt-a border border-hartie-umbra bg-hartie p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/scrie/${t.id}`}
                      className="font-titlu font-bold text-cerneala"
                    >
                      {t.titlu}
                    </Link>
                    <p className="text-nota text-cerneala-slab">
                      {felul(t.fel).eticheta}
                      {t.planificatLa ? ` · plănuit pe ${t.planificatLa}` : ""}
                    </p>
                  </div>
                  <form
                    method="post"
                    action="/api/admin/calendar"
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <input
                      type="hidden"
                      name="luna"
                      value={cheieLuna(an, luna)}
                    />
                    <input
                      type="date"
                      name="zi"
                      defaultValue={t.planificatLa ?? ""}
                      className="min-h-11 colt-mic-a border border-hartie-umbra bg-hartie px-3 text-mic text-cerneala"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-full bg-caramiziu-700 px-4 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600"
                    >
                      Pune în calendar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Cadru>
  );
}

const CULORI_MOMENT: Record<Moment["fel"], string> = {
  termen: "bg-caramiziu-100 text-caramiziu-900",
  "zi-tematica": "bg-miere-100 text-cerneala",
  sezon: "bg-hartie-umbra text-cerneala-moale",
  ritm: "bg-hartie-umbra text-cerneala-moale",
};

function Eticheta({ moment }: { moment: Moment }) {
  return (
    <p
      className={`mt-1 colt-mic-a px-1.5 py-1 text-nota leading-snug font-semibold ${CULORI_MOMENT[moment.fel]}`}
    >
      {moment.titlu}
    </p>
  );
}
