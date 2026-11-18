import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  METODE_MANUALE,
  donatii,
  numeleMetodei,
  totaluriPeTip,
  transferuriAnuntate,
} from "@/lib/plati/donatori";
import { DESTINATII_DONATIE } from "@/date/asociatie";
import { scrieSuma } from "@/lib/suma";
import { cate } from "@/lib/numere-ro";
import { platiEsuate } from "@/lib/plati/esuate";
import Cadru from "@/componente/admin/Cadru";
import { Sertar } from "@/componente/admin/ui-client";
import { CardCifra, CARD_ACTIV, Eticheta, File } from "@/componente/admin/ui";
import { Building2, CreditCard, Landmark, User, Users } from "lucide-react";
import TextCuAdrese from "@/componente/admin/TextCuAdrese";
import { verificaInainte } from "@/lib/plati/confirmare";
import Descarca from "@/componente/admin/Descarca";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Donații",
  robots: { index: false, follow: false },
};

type Cautare = {
  gata?: string;
  cine?: string;
  respins?: string;
  eroare?: string;
  gresit?: string; "de-mana"?: string };

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function PaginaDonatii({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Donații">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { gata, respins, eroare, gresit, "de-mana": deMana, cine } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Donații" activ="/admin/donatii">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5">PAROLA_ADMIN</code>{" "}
          în Railway.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/donatii" faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde="/admin/donatii" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/donatii"))) {
    return <FaraDrept titlu="Donații" activ="/admin/donatii" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Donații" activ="/admin/donatii">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  await verificaInainte();
  const toate = await donatii(200);
  const tip = cine === "firme" || cine === "pf" ? cine : null;
  const lista = toate.filter((d) => (tip === "firme" ? d.deLaFirma : tip === "pf" ? !d.deLaFirma : true)).slice(0, 100);
  const pe = await totaluriPeTip().catch(() => null);
  const anuntate = await transferuriAnuntate();
  const esuate = await platiEsuate().catch(() => []);
  const camp =
    "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic";
  const azi = new Date().toISOString().slice(0, 10);

  return (
    <Cadru
      titlu="Donații"
      activ="/admin/donatii"
      actiuni={
        <>
          <Descarca ce="donatii" />
          {/* Acțiunea principală a paginii: formularul se deschide în sertar, nu într-o secțiune pliată jos. */}
          <Sertar eticheta="Adaugă donație" titlu="Adaugă o donație" deschisLaInceput={deMana === "1"}>
        <p className="mb-5 text-mic text-cerneala-moale">
          Pentru banii primiți în afara site-ului: transfer bancar, numerar, SMS sau Galantom. Intră în aceleași totaluri ca donațiile cu cardul.
        </p>

        <form
          action="/api/admin/donatii"
          method="post"
          className="grid gap-4"
        >
          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Pe ce cale
            </span>
            <select name="metoda" className={camp}>
              {METODE_MANUALE.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.eticheta}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Suma (lei)
            </span>
            <input name="suma" inputMode="decimal" required className={camp} />
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Data
            </span>
            <input
              name="data"
              type="date"
              required
              defaultValue={azi}
              max={azi}
              className={camp}
            />
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Pentru ce
            </span>
            <select name="destinatie" className={camp}>
              {DESTINATII_DONATIE.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.eticheta}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block font-titlu text-mic font-bold">
              Referința
            </span>
            <input
              name="referinta"
              required
              maxLength={120}
              placeholder="Nr. extrasului, al chitanței, data transferului"
              className={camp}
            />
            <span className="mt-1 block text-nota text-cerneala-slab">
              Ceva care o identifică sigur, de exemplu numărul extrasului. Aceeași referință nu se poate folosi de două ori pe aceeași cale, ca să nu treci o donație de două ori.
            </span>
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Numele donatorului{" "}
              <span className="font-normal text-cerneala-slab">(opțional)</span>
            </span>
            <input name="nume" maxLength={120} className={camp} />
          </label>

          <label className="flex items-center gap-2 text-mic text-cerneala">
            <input type="checkbox" name="firma" value="1" className="size-4" />
            De la o firmă (persoană juridică)
          </label>

          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              E-mail{" "}
              <span className="font-normal text-cerneala-slab">(opțional)</span>
            </span>
            <input name="email" type="email" className={camp} />
            <span className="mt-1 block text-nota text-cerneala-slab">
              Cu e-mail, donația apare la donatorul respectiv. Fără e-mail, intră doar în totaluri.
            </span>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block font-titlu text-mic font-bold">
              Observații{" "}
              <span className="font-normal text-cerneala-slab">(opțional)</span>
            </span>
            <input name="observatii" maxLength={1000} className={camp} />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-caramiziu-600 px-6 py-2.5 font-titlu font-bold text-hartie"
            >
              Trece donația
            </button>
          </div>
        </form>
          </Sertar>
        </>
      }
    >
      {gata && (
        <p
          role="status"
          className="mb-6 rounded-card border border-turcoaz-200 bg-turcoaz-50 p-4 text-mic text-turcoaz-900"
        >
          <strong className="font-titlu font-bold">Donația e trecută.</strong>{" "}
          Apare în listă și pe pagina Acasă.
        </p>
      )}
      {respins && (
        <p
          role="status"
          className="mb-6 rounded-card border border-hartie-umbra bg-hartie-calda p-4 text-mic text-cerneala-moale"
        >
          <strong className="font-titlu font-bold">Transferul e scos.</strong>{" "}
          Nu intră în totaluri. Dacă banii apar mai târziu în extras, adaug-o
          cu „Adaugă donație”.
        </p>
      )}
      {eroare && (
        <p
          role="alert"
          className="mb-6 rounded-card border border-caramiziu-200 bg-caramiziu-50 p-4 text-mic text-caramiziu-900"
        >
          {eroare}
        </p>
      )}

      {/*
        Transferurile anunțate de donatori, primul lucru de pe pagină.

        Sunt singura listă de aici care cere o faptă: cineva se uită în extras
        și apasă. Până atunci nu se numără nicăieri — nici în totaluri, nici
        în tabelul de mai jos — pentru că anunțul vine dintr-un formular
        public, iar un total în care intră ce scrie oricine nu e un total.
      */}
      {/*
        Donațiile lunare care n-au trecut — oamenii de sunat.

        Stau deasupra transferurilor dinadins: un transfer anunțat așteaptă o
        verificare și nu se pierde dacă se face mâine. Un card căzut se pierde
        de tot — Stripe mai încearcă de câteva ori, apoi oprește abonamentul,
        iar donatorul nici nu știe.
      */}
      {esuate.length > 0 && (
        <section className="mb-8 rounded-card border-2 border-caramiziu-300 bg-caramiziu-50 p-5">
          <h2 className="font-titlu text-amplu font-bold text-caramiziu-900">
            Donații lunare care n-au trecut ({esuate.length})
          </h2>
          <p className="mt-1 max-w-2xl text-mic text-caramiziu-900/80">
            Acești donatori vor să doneze, dar plata n-a trecut, de obicei pentru că le-a expirat cardul. Fiecare a primit un e-mail cu linkul pentru schimbarea cardului, dar mulți nu-l deschid. Un telefon săptămâna asta recuperează donația. Rândul dispare singur când plata trece.
          </p>

          <ul className="mt-5 grid gap-3">
            {esuate.map((e) => (
              <li
                key={e.id}
                className="rounded-moale border border-caramiziu-200 bg-hartie p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-titlu font-bold text-cerneala">
                    {/* Adresa în nodul ei: Cloudflare o ascunde în HTML și o
                        pune la loc ca nod separat, iar un text lipit de ea
                        nu se mai potrivește la hidratare (eroarea React #418). */}
                    {e.prenume}
                    {e.prenume && e.email && " · "}
                    {e.email && <span>{e.email}</span>}
                    {!e.prenume && !e.email && "fără nume"}
                  </p>
                  <p className="font-titlu font-bold whitespace-nowrap text-caramiziu-800">
                    {scrieSuma(e.sumaBani / 100, e.moneda)} pe lună
                  </p>
                </div>
                <p className="mt-1 text-nota text-cerneala-moale">
                  {CAND.format(new Date(e.creatLa))}
                  {e.incercari > 1 && ` · ${e.incercari} încercări`}
                  {e.motiv && ` · ${e.motiv}`}
                </p>
                {e.email && (
                  <p className="mt-2 text-mic">
                    <a
                      href={`mailto:${e.email}`}
                      className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-2"
                    >
                      Scrie-i
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {anuntate.length > 0 && (
        <section className="mb-8 rounded-card border-2 border-turcoaz-300 bg-turcoaz-50 p-5">
          <h2 className="font-titlu text-amplu font-bold text-turcoaz-900">
            Transferuri anunțate de donatori ({anuntate.length})
          </h2>
          <p className="mt-1 max-w-2xl text-mic text-turcoaz-900/80">
            Acești donatori spun că au făcut transferul. Caută suma în extrasul de cont: dacă o găsești, apasă „Am găsit-o în extras” și donația intră în totaluri, cu data de mai jos. Dacă nu, apasă „N-am găsit-o”.
          </p>

          <ul className="mt-5 grid gap-4">
            {anuntate.map((t) => (
              <li
                key={t.id}
                className="rounded-card border border-turcoaz-200 bg-hartie p-4"
              >
                <p className="font-titlu text-amplu font-bold text-cerneala">
                  {scrieSuma(t.sumaBani / 100, t.moneda)}
                  <span className="ml-2 font-normal text-cerneala-moale">
                    {t.nume}
                  </span>
                </p>
                <p className="mt-1 text-mic text-cerneala-moale">
                  Transfer făcut pe {CAND.format(new Date(t.cand))} · pentru{" "}
                  {DESTINATII_DONATIE.find((x) => x.id === t.destinatie)
                    ?.eticheta ?? t.destinatie}{" "}
                  · anunțat pe {CAND.format(new Date(t.anuntatLa))}
                </p>
                {(t.email || t.telefon) && (
                  <p className="mt-1 text-mic break-all text-cerneala-moale">
                    {t.email && <span>{t.email}</span>}
                    {t.email && t.telefon && " · "}
                    {t.telefon}
                  </p>
                )}
                {t.observatii && (
                  <p className="mt-1 text-mic text-cerneala-moale">
                    La detaliile plății: <TextCuAdrese>{t.observatii}</TextCuAdrese>
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action="/api/admin/donatii/confirma" method="post">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="hotarare" value="confirma" />
                    <button
                      type="submit"
                      className="rounded-full bg-turcoaz-600 px-5 py-2.5 font-titlu font-bold text-hartie"
                    >
                      Am găsit-o în extras
                    </button>
                  </form>
                  <form action="/api/admin/donatii/confirma" method="post">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="hotarare" value="respinge" />
                    <button
                      type="submit"
                      className="rounded-full border border-hartie-umbra px-5 py-2.5 font-titlu font-bold text-cerneala"
                    >
                      N-am găsit-o
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}


      <h2 className="mt-10 mb-4 font-titlu text-amplu font-bold text-cerneala">
        Ultimele donații
      </h2>

      {pe && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4">
          <CardCifra
            eticheta={`Persoane fizice, în ${new Date().getFullYear()}`}
            valoare={scrieSuma(pe.pf.bani / 100, "RON")}
            context={cate(pe.pf.nr, "donație", "donații")}
            sectiune="oameni"
            I={Users}
            href={tip === "pf" ? "/admin/donatii" : "/admin/donatii?cine=pf"}
            activ={tip === "pf"}
          />
          <CardCifra
            eticheta={`Firme, în ${new Date().getFullYear()}`}
            valoare={scrieSuma(pe.firme.bani / 100, "RON")}
            context={cate(pe.firme.nr, "donație", "donații")}
            sectiune="sponsori"
            I={Building2}
            href={tip === "firme" ? "/admin/donatii" : "/admin/donatii?cine=firme"}
            activ={tip === "firme"}
          />
        </div>
      )}

      <File
        file={[
          { eticheta: "Toate", href: "/admin/donatii", activ: !tip },
          { eticheta: "Persoane fizice", href: "/admin/donatii?cine=pf", activ: tip === "pf" },
          { eticheta: "Firme", href: "/admin/donatii?cine=firme", activ: tip === "firme" },
        ]}
      />

      {lista.length === 0 ? (
        <p className="mt-4 text-amplu text-cerneala-moale">
          {tip ? "Nicio donație aici încă." : "Nicio donație încasată încă."}
        </p>
      ) : (
        <ul data-lista-donatii className="mt-3 grid gap-2.5">
          {lista.map((d) => {
            const Semn = d.deLaFirma ? Building2 : d.procesator.startsWith("manual") ? Landmark : d.nume ? User : CreditCard;
            const pentru = DESTINATII_DONATIE.find((x) => x.id === d.destinatie)?.eticheta ?? d.destinatie;
            return (
              <li
                key={d.id}
                data-donatie={d.deLaFirma ? "firma" : "pf"}
                className={`${CARD_ACTIV} relative flex items-center gap-3 overflow-hidden py-3.5 pr-4 pl-5 sm:gap-4`}
              >
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${d.deLaFirma ? "bg-orange-400" : "bg-sky-400"}`} />
                <span
                  aria-hidden="true"
                  className={`grid size-11 shrink-0 place-items-center rounded-full ${d.deLaFirma ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"}`}
                >
                  <Semn className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-titlu text-[15px] font-bold text-cerneala">
                      {d.nume ?? d.email ?? "Donator anonim"}
                    </span>
                    {d.deLaFirma && <Eticheta ton="nou">Firmă</Eticheta>}
                    {d.frecventa === "lunar" && <Eticheta ton="asteptam">lunar</Eticheta>}
                  </span>
                  <span className="block truncate text-[13px] text-cerneala-moale">
                    {[d.nume ? d.email : null, pentru, numeleMetodei(d.procesator)].filter(Boolean).join(" · ")}
                  </span>
                  {(d.referinta || d.observatii) && (
                    <span className="block truncate text-[12px] text-cerneala-slab" title={[d.referinta, d.observatii].filter(Boolean).join(" · ")}>
                      {[d.referinta, d.observatii].filter(Boolean).join(" · ").replace(/\s+/g, " ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-titlu text-[17px] font-bold whitespace-nowrap text-emerald-700 tabular-nums">
                    {scrieSuma(d.sumaBani / 100, d.moneda)}
                  </span>
                  <span className="block text-[12.5px] whitespace-nowrap text-cerneala-slab">
                    {d.platitaLa ? CAND.format(new Date(d.platitaLa)) : "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Cadru>
  );
}
