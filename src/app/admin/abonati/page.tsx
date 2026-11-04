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
import { NUMELE_SURSEI, type SursaAbonare, abonati, areBuletin } from "@/lib/buletin";
import { grupuri } from "@/lib/email/mailerlite";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Abonați la buletin",
  robots: { index: false, follow: false },
};

/**
 * Câți abonați are asociația și de unde au venit.
 *
 * **Lista adevărată e în MailerLite**, și de acolo vin cifrele mari de sus, la
 * fiecare deschidere a paginii: persoane fizice, firme, total. Site-ul nu ține
 * o copie a listei; ține doar un rând pe fiecare abonare făcută prin el (de
 * unde, când, în ce listă, și acordul pentru cei puși de mână), ca să se poată
 * spune de unde vin oamenii. Cei de dinainte de 4 noiembrie 2026 sunt numai
 * în MailerLite și apar ca „de dinainte”.
 */

type Lista = "persoane" | "firme";
type Cautare = { sursa?: string; lista?: string; gresit?: string };

const SURSE: SursaAbonare[] = ["panou", "donatie", "formular", "cont"];

export default function PaginaAbonati({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="Abonați la buletin">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { sursa, lista: listaCeruta, gresit } = await searchParams;
  const activ = "/admin/abonati";

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Abonați la buletin" activ={activ}>
        <p className="text-amplu text-cerneala-moale">Panoul nu e configurat.</p>
      </Cadru>
    );
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ={activ} faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde={activ} />
      </Cadru>
    );
  }
  if (!(await arePermisiune(activ))) return <FaraDrept titlu="Abonați la buletin" activ={activ} />;
  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Abonați la buletin" activ={activ}>
        <p className="text-amplu text-cerneala-moale">Lipsește baza de date.</p>
      </Cadru>
    );
  }

  const [toti, deLaMailerLite] = await Promise.all([abonati(5000), grupuri().catch(() => [])]);

  // Cifrele adevărate, din MailerLite: grupul fiecărei liste, după identificatorul din Railway.
  const grupPersoane = deLaMailerLite.find((g) => g.id === process.env.MAILERLITE_GROUP_ID);
  const grupFirme = deLaMailerLite.find((g) => g.id === process.env.MAILERLITE_GROUP_FIRME);
  const inMailerLite: Record<Lista, number | null> = {
    persoane: grupPersoane?.activi ?? null,
    firme: grupFirme?.activi ?? null,
  };

  const activi = toti.filter((a) => !a.dezabonatLa);
  const cati = (s: SursaAbonare | null, l: Lista) =>
    activi.filter((a) => (s === null || a.sursa === s) && (a.lista === "firme" ? "firme" : "persoane") === l).length;
  const deDinainte = (l: Lista) => {
    const ml = inMailerLite[l];
    return ml === null ? null : Math.max(0, ml - cati(null, l));
  };

  const sursaAleasa = sursa && sursa in NUMELE_SURSEI ? (sursa as SursaAbonare) : null;
  const listaAleasa: Lista | null = listaCeruta === "firme" || listaCeruta === "persoane" ? listaCeruta : null;
  const lista = toti.filter(
    (a) =>
      (!sursaAleasa || a.sursa === sursaAleasa) &&
      (!listaAleasa || (a.lista === "firme" ? "firme" : "persoane") === listaAleasa),
  );
  const leg = (s: SursaAbonare | null, l: Lista | null) => {
    const q = new URLSearchParams();
    if (s) q.set("sursa", s);
    if (l) q.set("lista", l);
    return `${activ}${q.size ? `?${q}` : ""}#lista`;
  };

  const nr = (n: number | null) => (n === null ? "—" : n.toLocaleString("ro-RO"));

  return (
    <Cadru
      titlu="Abonați la buletin"
      activ={activ}
      actiuni={
        <Link
          href="/admin/abonati/incarca"
          className="inline-flex min-h-10 items-center rounded-full bg-caramiziu-700 px-4 font-titlu text-mic font-bold text-hartie hover:bg-caramiziu-600"
        >
          Încarcă abonați
        </Link>
      }
    >
      {/* Cifrele mari: din MailerLite, la fiecare deschidere. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Cifra eticheta="Persoane fizice" valoare={nr(inMailerLite.persoane)} />
        <Cifra eticheta="Firme" valoare={nr(inMailerLite.firme)} />
        <Cifra
          eticheta="Total"
          valoare={
            inMailerLite.persoane === null && inMailerLite.firme === null
              ? "—"
              : nr((inMailerLite.persoane ?? 0) + (inMailerLite.firme ?? 0))
          }
        />
      </div>
      <p className="mt-2 text-nota text-cerneala-slab">
        {inMailerLite.persoane !== null || inMailerLite.firme !== null
          ? "Abonați activi în MailerLite, acum. Dezabonații nu se numără."
          : areBuletin()
            ? "MailerLite n-a răspuns acum, sau grupurile din Railway (MAILERLITE_GROUP_ID, MAILERLITE_GROUP_FIRME) nu se potrivesc."
            : "MailerLite nu e legat (MAILERLITE_API_KEY)."}
      </p>

      {/* De unde au venit: rânduri pe sursă, coloane pe listă. */}
      <section className="mt-8">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">De unde au venit</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-mic">
            <thead>
              <tr className="border-b border-hartie-umbra text-left text-cerneala-slab">
                <th className="py-2 pr-4 font-semibold">Cum</th>
                <th className="py-2 pr-4 text-right font-semibold">Persoane fizice</th>
                <th className="py-2 pr-4 text-right font-semibold">Firme</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {SURSE.map((s) => (
                <tr key={s} className="border-b border-hartie-umbra">
                  <td className="py-2 pr-4">
                    <a href={leg(s, null)} className="font-semibold text-cerneala underline-offset-2 hover:underline">
                      {s === "panou" ? "Încărcați manual" : NUMELE_SURSEI[s]}
                    </a>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <a href={leg(s, "persoane")} className="hover:underline">{cati(s, "persoane")}</a>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <a href={leg(s, "firme")} className="hover:underline">{cati(s, "firme")}</a>
                  </td>
                  <td className="py-2 text-right font-semibold">{cati(s, "persoane") + cati(s, "firme")}</td>
                </tr>
              ))}
              <tr className="border-b border-hartie-umbra text-cerneala-moale">
                <td className="py-2 pr-4">De dinainte de 4 noiembrie 2026 (numai în MailerLite)</td>
                <td className="py-2 pr-4 text-right">{nr(deDinainte("persoane"))}</td>
                <td className="py-2 pr-4 text-right">{nr(deDinainte("firme"))}</td>
                <td className="py-2 text-right">
                  {deDinainte("persoane") === null && deDinainte("firme") === null
                    ? "—"
                    : nr((deDinainte("persoane") ?? 0) + (deDinainte("firme") ?? 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 max-w-3xl text-nota text-cerneala-slab">
          La fiecare abonare de pe site (newsletter, donație, cont) primiți un e-mail și, dacă v-ați
          pornit notificările, o notificare pe telefon. La cele încărcate manual, nu.
        </p>
      </section>

      {/* Lista, cu filtre pe sursă și pe listă. */}
      <section id="lista" className="mt-10">
        <div className="flex flex-wrap items-center gap-2">
          <Filtru href={leg(null, null)} activ={!sursaAleasa && !listaAleasa}>Toți</Filtru>
          <Filtru href={leg(sursaAleasa, "persoane")} activ={listaAleasa === "persoane"}>Persoane fizice</Filtru>
          <Filtru href={leg(sursaAleasa, "firme")} activ={listaAleasa === "firme"}>Firme</Filtru>
          <span aria-hidden className="mx-1 text-cerneala-slab">|</span>
          {SURSE.map((s) => (
            <Filtru key={s} href={leg(s, listaAleasa)} activ={sursaAleasa === s}>
              {s === "panou" ? "Manual" : s === "donatie" ? "Donații" : s === "formular" ? "Newsletter" : "Cont"}
            </Filtru>
          ))}
        </div>

        {lista.length === 0 ? (
          <p className="mt-6 text-amplu text-cerneala-moale">Nicio abonare aici.</p>
        ) : (
          <ul className="mt-5 grid gap-2">
            {lista.slice(0, 500).map((a) => (
              <li
                key={a.email}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 colt-a border border-hartie-umbra p-4 ${
                  a.dezabonatLa ? "bg-hartie-calda text-cerneala-slab" : "bg-hartie"
                }`}
              >
                <span className="font-titlu font-bold text-cerneala">{a.nume || a.email}</span>
                {a.nume && (
                  <a href={`mailto:${a.email}`} className="text-mic text-caramiziu-700 underline underline-offset-2">
                    {a.email}
                  </a>
                )}
                <span className="text-nota text-cerneala-moale">
                  {a.lista === "firme" ? "Firmă" : "Persoană fizică"} ·{" "}
                  {a.sursa === "panou" ? "încărcat manual" : NUMELE_SURSEI[a.sursa].toLowerCase()} ·{" "}
                  {new Date(a.creatLa).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                  {a.dezabonatLa && " · s-a dezabonat"}
                </span>
                {a.sursa === "panou" && (
                  <span className="basis-full text-nota text-cerneala-slab">
                    Încărcat de {a.adaugatDe ?? "parola asociației"}
                    {a.acordNota ? ` · acordul: ${a.acordNota}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {lista.length > 500 && (
          <p className="mt-3 text-nota text-cerneala-slab">Se văd primii 500. Restul sunt în MailerLite.</p>
        )}
      </section>
    </Cadru>
  );
}

function Cifra({ eticheta, valoare }: { eticheta: string; valoare: string }) {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-4">
      <p className="text-nota text-cerneala-slab">{eticheta}</p>
      <p className="font-titlu text-h3 font-extrabold text-cerneala">{valoare}</p>
    </div>
  );
}

function Filtru({ href, activ, children }: { href: string; activ: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={activ ? "page" : undefined}
      className={`rounded-full px-4 py-2 font-titlu text-mic font-bold ${
        activ ? "bg-cerneala text-hartie" : "border border-hartie-umbra bg-hartie text-cerneala"
      }`}
    >
      {children}
    </a>
  );
}
