import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { numeleMetodei, rezumat } from "@/lib/plati/donatori";
import {
  apasariPeLuna,
  cereriDeLucru,
  deFacutAcum,
  palniaFirmelor,
  peDestinatii,
  peFrecventa,
  peLuni,
  peMetode,
  peMonede,
  progresulCampaniilor,
  ultimeleDonatii,
  venitLunarRecurent,
} from "@/lib/statistici";
import { FELURI_CERERE, STADII_FIRMA } from "@/lib/crm";
import { DESTINATII_DONATIE } from "@/date/asociatie";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import {
  Card,
  Cifra,
  Coloane,
  DonatoriNoi,
  Felii,
  Palnie,
} from "@/componente/admin/Grafice";

export const metadata: Metadata = {
  title: "Tabloul de bord",
  robots: { index: false, follow: false },
};

const CAND_SCURT = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Numele citibil al unei destinații; dacă apare una nouă, se arată ca atare. */
function numeleDestinatiei(id: string): string {
  return DESTINATII_DONATIE.find((d) => d.id === id)?.eticheta ?? id;
}

/**
 * O secțiune a tabloului, cu titlu propriu.
 *
 * Până acum cele nouă cartonașe stăteau într-o singură grilă, unul după
 * altul: graficul lunilor lângă pâlnia firmelor, donatorii noi lângă cererile
 * nerezolvate. Nimic nu era greșit, dar nimic nu spunea ce ține de ce, iar
 * ochiul trebuia să citească fiecare titlu ca să-și dea seama unde a ajuns.
 * Trei titluri mari — banii, donatorii, ce așteaptă — împart pagina în trei
 * lucruri despre care te poți întreba separat.
 */
function Sectiune({
  titlu,
  nota,
  children,
}: {
  titlu: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
          {titlu}
        </h2>
        {nota && <p className="text-nota text-cerneala-slab">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

export default function PaginaTablou({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Tabloul de bord">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  await connection();
  const { gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Tabloul de bord" activ="/admin">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Tabloul de bord" activ="/admin">
        <Intrare gresit={Boolean(gresit)} unde="/admin" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Tabloul de bord" activ="/admin">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
          Fără baza de date nu există nici donații, nici firme, nici cereri de
          arătat.
        </p>
      </Cadru>
    );
  }

  const [
    cifre,
    luni,
    destinatii,
    metode,
    frecvente,
    palnie,
    deLucru,
    apasari,
    monede,
    deFacut,
    recurent,
    ultimele,
    campanii,
  ] = await Promise.all([
    rezumat(),
    peLuni(12),
    peDestinatii(),
    peMetode(),
    peFrecventa(),
    palniaFirmelor(),
    cereriDeLucru(),
    apasariPeLuna(6),
    peMonede(),
    deFacutAcum(),
    venitLunarRecurent(),
    ultimeleDonatii(8),
    progresulCampaniilor(),
  ]);

  // Tot ce nu e în lei se arată separat, nu se adună.
  const alteMonede = monede.filter((m) => m.moneda !== "RON");
  const nrPalnie = new Map(palnie.map((p) => [p.stadiu, p.nr]));
  const nrDeLucru = new Map(deLucru.map((c) => [c.fel, c.nr]));
  const totalDeLucru = deLucru.reduce((s, c) => s + c.nr, 0);
  const lunar = frecvente.find((f) => f.eticheta === "Lunar")?.bani ?? 0;
  const totalFrecvente = frecvente.reduce((s, f) => s + f.bani, 0);

  /* Luna trecută, pentru comparație: penultima din cele douăsprezece. */
  const lunaTrecuta = luni.at(-2)?.bani ?? 0;
  const fataDeLunaTrecuta =
    lunaTrecuta > 0
      ? Math.round(((cifre.lunaAsta - lunaTrecuta) / lunaTrecuta) * 100)
      : null;

  return (
    <Cadru
      titlu="Tabloul de bord"
      descriere="Cum stă asociația cu banii și ce așteaptă un răspuns."
      activ="/admin"
    >
      {/*
        Ce așteaptă un răspuns, înaintea oricărei cifre.

        Panoul începea cu totalul strâns — o cifră frumoasă, dar din care nu
        rezultă nimic de făcut. Cineva care deschide panoul dimineața vrea
        întâi să vadă unde să apese.
      */}
      <section
        aria-label="De făcut acum"
        className="mb-6 colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6"
      >
        {deFacut.length === 0 ? (
          <p className="text-amplu text-cerneala-moale">
            Nimic nu așteaptă un răspuns. Toate cererile sunt rezolvate,
            aniversările aprobate și nu e nicio ciornă nepublicată.
          </p>
        ) : (
          <>
            <h2 className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
              De făcut acum
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {deFacut.map((lucru) => (
                <li key={lucru.unde + lucru.eticheta}>
                  <Link
                    href={lucru.unde}
                    className="inline-flex items-center gap-2.5 colt-mic-a bg-caramiziu-50 px-4 py-2.5 font-titlu text-mic font-semibold text-caramiziu-900 transition-colors hover:bg-caramiziu-100"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-caramiziu-700 text-nota font-bold text-hartie">
                      {lucru.nr}
                    </span>
                    {lucru.eticheta}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/*
          Totalul e în lei, și numai în lei.

          `suma_bani` ține bani sau cenți, după monedă. Adunate la grămadă,
          25 € s-ar fi numărat ca 25 de lei — iar cifra din raportul anual ar
          fi fost greșită fără ca nimic s-o arate. Donațiile în altă monedă
          apar în nota de dedesubt, neconvertite: cursul care contează e al
          băncii, în ziua încasării, nu unul ales de noi.
        */}
        <Cifra
          eticheta="Total strâns"
          valoare={scrieSuma(cifre.totalBani / 100)}
          nota={
            alteMonede.length > 0
              ? `Plus ${alteMonede.map((m) => scrieSuma(m.bani / 100, m.moneda)).join(" și ")}, neconvertiți`
              : "Toate donațiile încasate"
          }
        />
        <Cifra
          eticheta="Luna asta"
          valoare={scrieSuma(cifre.lunaAsta / 100)}
          nota={
            fataDeLunaTrecuta === null
              ? "Luna trecută n-a intrat nimic"
              : `${fataDeLunaTrecuta >= 0 ? "+" : ""}${fataDeLunaTrecuta}% față de luna trecută`
          }
          culoare="turcoaz"
        />
        {/*
          Venitul recurent, nu numărul de donatori.

          E cifra pe care un fundraiser o urmărește înaintea totalului: din ea
          se poate plăti o lună fără să se strângă nimic nou. Totalul spune ce
          s-a întâmplat; asta spune pe ce te poți baza luna viitoare.
        */}
        <Cifra
          eticheta="Vine lunar"
          valoare={scrieSuma(recurent.bani / 100)}
          nota={`${recurent.donatori} ${recurent.donatori === 1 ? "donator" : "donatori"} cu plată recurentă activă`}
          culoare="miere"
        />
        <Cifra
          eticheta="Donatori"
          valoare={String(cifre.donatori)}
          nota={`${totalDeLucru} ${totalDeLucru === 1 ? "cerere așteaptă" : "cereri așteaptă"} un răspuns`}
          culoare="cerneala"
        />
      </div>

      <Sectiune
        titlu="Banii"
        nota="Cât a intrat, de unde vine și pe ce se duce."
      >
        <div className="grid gap-6">
          <div className="min-w-0">
            <Card
              titlu="Cât a intrat, lună de lună"
              nota="Ultimele 12 luni, inclusiv cele în care n-a intrat nimic."
            >
              <Coloane date={luni} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card
              titlu="Venit previzibil"
              nota={
                totalFrecvente > 0
                  ? `${Math.round((lunar / totalFrecvente) * 100)}% din bani vin din donații lunare.`
                  : undefined
              }
            >
              <Felii date={frecvente} titlu="O dată față de lunar" />
            </Card>

            <Card
              titlu="Pe ce cale intră"
              nota="Inclusiv ce s-a trecut de mână. Numai donațiile în lei."
            >
              <Felii
                date={metode}
                titlu="Donații pe metode de plată"
                nume={numeleMetodei}
              />
            </Card>

            <Card
              titlu="Pe ce se duc banii"
              nota="Destinația aleasă de donator."
            >
              <Felii
                date={destinatii}
                titlu="Donații pe destinații"
                nume={numeleDestinatiei}
              />
            </Card>
          </div>
        </div>
      </Sectiune>

      <Sectiune
        titlu="Donatorii"
        nota="Cine a dat în ultima vreme și dacă vin oameni noi."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/*
            Ultimele donații, cu nume.

            Nu e o statistică, e o listă de oameni cărora li se poate mulțumi
            azi. Adresa de e-mail nu se arată întreagă: panoul se deschide și
            într-un birou prin care trec oameni.
          */}
          <Card titlu="Ultimele donații" nota="Cele mai recente opt, încasate.">
            {ultimele.length === 0 ? (
              <p className="text-mic text-cerneala-moale">
                Nicio donație încasată încă.
              </p>
            ) : (
              <ul className="grid gap-2.5">
                {ultimele.map((d, i) => (
                  <li
                    key={`${d.cand}-${i}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hartie-umbra pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-titlu text-mic font-semibold text-cerneala">
                      {d.cine}
                      {d.frecventa === "lunar" && (
                        <span className="ml-2 rounded-full bg-miere-100 px-2 py-0.5 text-nota font-bold text-miere-900">
                          lunar
                        </span>
                      )}
                    </span>
                    <span className="font-titlu text-mic font-bold text-cerneala">
                      {scrieSuma(d.bani / 100, d.moneda)}
                    </span>
                    <span className="basis-full text-nota text-cerneala-slab">
                      {CAND_SCURT.format(new Date(d.cand))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            titlu="Donatori noi"
            nota="Oameni la prima lor donație. Arată dacă asociația crește sau se bazează pe aceiași."
          >
            <DonatoriNoi date={luni} />
          </Card>
        </div>
      </Sectiune>

      <Sectiune
        titlu="Campanii, firme și cereri"
        nota="Ce e pornit și ce așteaptă un răspuns de la noi."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/*
            Campaniile scrise din panou, cu cât s-a strâns pe fiecare.

            Legătura se face prin `campanie_slug` de pe donație — câmpul pe care
            îl pune butonul „Donează pentru campania asta”. O campanie fără
            țintă apare și ea: faptul că nu s-a anunțat o sumă nu înseamnă că nu
            vrei să știi cât a intrat.
          */}
          <Card
            titlu="Campanii"
            nota="Cât s-a strâns pe fiecare campanie publicată."
          >
            {campanii.length === 0 ? (
              <p className="text-mic text-cerneala-moale">
                Nicio campanie publicată.{" "}
                <Link
                  href="/admin/scrie?fel=campanie"
                  className="font-semibold text-caramiziu-700 hover:underline"
                >
                  Scrie una
                </Link>
                .
              </p>
            ) : (
              <ul className="grid gap-4">
                {campanii.map((c) => {
                  const procent =
                    c.tintaBani && c.tintaBani > 0
                      ? Math.min(100, Math.round((c.bani / c.tintaBani) * 100))
                      : null;
                  return (
                    <li key={c.slug}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <Link
                          href={`/campanii/${c.slug}`}
                          className="font-titlu text-mic font-semibold text-cerneala hover:text-caramiziu-700"
                        >
                          {c.titlu}
                        </Link>
                        <span className="font-titlu text-mic font-bold text-cerneala">
                          {scrieSuma(c.bani / 100)}
                          {c.tintaBani !== null && (
                            <span className="font-semibold text-cerneala-slab">
                              {" "}
                              din {scrieSuma(c.tintaBani / 100)}
                            </span>
                          )}
                        </span>
                      </div>
                      {procent !== null && (
                        <div
                          className="mt-1.5 h-2 overflow-hidden rounded-full bg-hartie-umbra"
                          role="img"
                          aria-label={`${procent}% din țintă`}
                        >
                          <div
                            className="h-full rounded-full bg-caramiziu-600"
                            style={{ width: `${procent}%` }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            titlu="Sponsorizări de la firme"
            nota="Unde a ajuns fiecare firmă."
          >
            {/*
              Culoarea nu mai vine de aici: stadiile au ordine, iar pâlnia le
              colorează singură cu o rampă, de la deschis la închis. Înainte
              fiecare stadiu își purta culoarea lui, aleasă pe gust, iar
              ordinea nu se vedea deloc.
            */}
            <Palnie
              date={STADII_FIRMA.map((s) => ({
                eticheta: s.eticheta,
                nr: nrPalnie.get(s.id) ?? 0,
              }))}
            />
            <Link
              href="/admin/firme"
              className="mt-4 inline-block font-titlu text-mic font-bold text-caramiziu-700 underline underline-offset-4"
            >
              Vezi firmele
            </Link>
          </Card>

          <Card titlu="Cereri care așteaptă" nota="Nerezolvate, pe fel.">
            <ul className="grid gap-2">
              {FELURI_CERERE.map((f) => (
                <li
                  key={f.id}
                  className="flex items-baseline justify-between gap-3 border-b border-hartie-umbra pb-2 last:border-0"
                >
                  <span className="text-mic text-cerneala-moale">
                    {f.eticheta}
                  </span>
                  <span className="font-titlu text-amplu font-bold text-cerneala">
                    {nrDeLucru.get(f.id) ?? 0}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/admin/cereri"
              className="mt-4 inline-block font-titlu text-mic font-bold text-caramiziu-700 underline underline-offset-4"
            >
              Vezi cererile
            </Link>
          </Card>

          {apasari.length > 0 && (
            <Card
              titlu="Apăsări pe linkurile din afară"
              nota="Revolut și Galantom nu trec prin site, deci asta e intenția, nu donația. Nu se adună la total."
            >
              <ul className="grid gap-2">
                {apasari.map((a) => (
                  <li
                    key={a.ce}
                    className="flex items-baseline justify-between gap-3 border-b border-hartie-umbra pb-2 last:border-0"
                  >
                    <span className="text-mic text-cerneala-moale">{a.ce}</span>
                    <span className="font-titlu text-amplu font-bold text-cerneala">
                      {a.nr}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </Sectiune>
    </Cadru>
  );
}
