import type { Metadata } from "next";
import { lamurireCanal, numeCanal } from "@/lib/atribuire";
import { cate, forma } from "@/lib/numere-ro";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { firma as iaFirma, interactiuni, STADII_FIRMA } from "@/lib/crm";
import { scrieSuma } from "@/lib/suma";
import Jurnal from "@/componente/admin/Jurnal";
import TextCuAdrese from "@/componente/admin/TextCuAdrese";
import Stadiu from "@/componente/admin/firme/Stadiu";
import Pictograma from "@/componente/Pictograma";
import { domeniuRaspuns, marcheazaCitite, mesajeleFirmei, NU_RASPUNDE_DUPA, trimiseFaraRaspuns } from "@/lib/mesaje-firme";
import Cadru from "@/componente/admin/Cadru";
import ScrieFirmei from "@/componente/admin/ScrieFirmei";
import { textePublicate } from "@/lib/texte";
import MesajFirma from "@/componente/admin/firme/MesajFirma";
import { poarta } from "@/componente/admin/firme/Poarta";
import { arePermisiune } from "@/lib/admin";
import StergeFirma from "@/componente/admin/firme/StergeFirma";

export const metadata: Metadata = {
  title: "E-mailuri cu firma",
  robots: { index: false, follow: false },
};

type Cautare = { gresit?: string; trimis?: string; ratat?: string; nou?: string; era?: string; refuza?: string; stadiu?: string; eroare?: string; salvat?: string };

export default function PaginaDiscutie({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="E-mailuri cu firma">Se încarcă…</Cadru>}>
      <Continut params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Cautare>;
}) {
  await connection();
  const { id } = await params;
  const { gresit, trimis, ratat, nou, era, refuza, stadiu: stadiuSchimbatParam, eroare } = await searchParams;
  const stadiuSchimbat = stadiuSchimbatParam === "schimbat";
  const oprit = await poarta("Firma", "/admin/firme", gresit);
  if (oprit) return oprit;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const f = await iaFirma(id);
  if (!f) notFound();

  const [mesaje, jurnal] = await Promise.all([mesajeleFirmei(f.id), interactiuni({ firmaId: f.id })]);
  const poateSterge = await arePermisiune("/admin/firme/sterge");
  const campanii = (await textePublicate("campanie", 30).catch(() => [])).map((c) => ({ id: c.id, titlu: c.titlu }));
  await marcheazaCitite(f.id).catch(() => undefined);
  const ultimul = [...mesaje].reverse()[0];
  /*
    Răspunsul merge la cine a scris ultimul (de pildă contabila, nu omul din
    fișă); dacă e altcineva decât adresa din fișă, le primesc pe amândouă.
  */
  const ultimulPrimit = [...mesaje].reverse().find((m) => m.directie === "primit");
  const dinRaspuns = ultimulPrimit ? (ultimulPrimit.deLa.match(/<([^>]+)>/)?.[1] ?? ultimulPrimit.deLa).trim().toLowerCase() : "";
  const catreImplicit =
    dinRaspuns && dinRaspuns !== f.email.toLowerCase() && dinRaspuns.includes("@") ? `${f.email}, ${dinRaspuns}` : f.email;
  const subiect = ultimul ? `Re: ${ultimul.subiect.replace(/^(re|fw|fwd|răs)\s*:\s*/i, "")}` : "";
  const stadiu = STADII_FIRMA.find((s) => s.id === f.stadiu)?.eticheta ?? f.stadiu;

  return (
    <Cadru
      titlu={f.denumire}
      descriere={`${f.persoana} · ${f.email} · ${stadiu}`}
      activ="/admin/firme"
    >
      <p className="mb-5 text-mic">
        <Link href="/admin/firme" className="font-semibold text-caramiziu-700 underline underline-offset-2">
          ← Toate firmele
        </Link>
      </p>
      {/* Fișa firmei: ce știm despre ea, fără să plece omul din discuție. */}
      <section data-fisa className="mb-4 max-w-4xl rounded-card border border-hartie-umbra bg-hartie p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Stadiu stadiu={f.stadiu} />
          <span className="text-nota text-cerneala-slab">
            {f.cui.startsWith("fara-cui-") ? "fără CUI" : `CUI ${f.cui}`} · {f.cale}
          </span>
          {f.canal && (
            <span
              data-canal
              title={lamurireCanal(f.canal)}
              className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 font-titlu text-[12.5px] font-bold text-violet-800"
            >
              A venit din: {numeCanal(f.canal)}
            </span>
          )}
          <Link
            href={`/admin/firme/${f.id}/contract`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-hartie-umbra px-3.5 py-1.5 font-titlu text-nota font-bold text-cerneala hover:border-caramiziu-700 hover:text-caramiziu-800"
          >
            <Pictograma nume="document" className="size-4" />
            Generează contractul
          </Link>
        </div>
        <div className="mt-3 grid gap-x-8 gap-y-2 text-mic sm:grid-cols-2">
          <p className="flex min-w-0 items-center gap-2 text-cerneala">
            <Pictograma nume="familie" className="size-4 shrink-0 text-cerneala-slab" />
            {f.persoana}
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <Pictograma nume="plic" className="size-4 shrink-0 text-cerneala-slab" />
            <a href={`mailto:${f.email}`} className="min-w-0 break-all text-caramiziu-700 underline underline-offset-2">
              {f.email}
            </a>
          </p>
          {f.telefon && (
            <p className="flex items-center gap-2">
              <Pictograma nume="telefon" className="size-4 shrink-0 text-cerneala-slab" />
              <a href={`tel:${f.telefon.replace(/\s/g, "")}`} className="font-titlu font-bold text-caramiziu-700 underline underline-offset-2">
                {f.telefon}
              </a>
            </p>
          )}
          {f.sumaEstimata && (
            <p className="flex items-center gap-2 text-cerneala-moale">
              <Pictograma nume="grafic" className="size-4 shrink-0 text-cerneala-slab" />
              Estimat: {f.sumaEstimata}
            </p>
          )}
          {f.sumaBani !== null && (
            <p className="flex items-center gap-2 font-titlu font-bold text-turcoaz-800">
              <Pictograma nume="bifa" className="size-4 shrink-0" />
              Încasat: {scrieSuma(f.sumaBani / 100)}
            </p>
          )}
        </div>
        {f.mesaj && (
          <p className="mt-3 rounded-moale bg-hartie-calda p-3 text-mic text-cerneala-moale">
            <TextCuAdrese>{f.mesaj}</TextCuAdrese>
          </p>
        )}
      </section>
      {/*
        Stadiul în CRM, mutat de aici: cine a primit răspunsul „trimiteți-ne
        contractul” n-are de ce să plece din discuție ca s-o mute.
      */}
      <form id="crm" action="/api/admin/firme" method="post" className="mb-6 flex max-w-4xl scroll-mt-24 flex-wrap items-center gap-2 rounded-card border border-hartie-umbra bg-hartie px-4 py-3">
        <input type="hidden" name="id" value={f.id} />
        <input type="hidden" name="inapoi" value={`/admin/firme/${f.id}/mesaje`} />
        <label className="text-mic text-cerneala-moale">
          Stadiul:
          <select name="stadiu" defaultValue={f.stadiu} className="ml-2 rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 font-titlu text-mic text-cerneala">
            {STADII_FIRMA.map((s) => (
              <option key={s.id} value={s.id}>
                {s.eticheta}
              </option>
            ))}
          </select>
        </label>
        <input
          name="suma"
          inputMode="decimal"
          aria-label="Suma încasată (lei)"
          defaultValue={f.sumaBani === null ? "" : String(f.sumaBani / 100)}
          placeholder="Suma încasată (lei)"
          className="w-44 rounded-moale border border-hartie-umbra bg-hartie px-3 py-1.5 text-mic"
        />
        <button type="submit" className="rounded-full bg-cerneala px-4 py-1.5 font-titlu text-nota font-bold text-hartie hover:bg-cerneala-moale">
          Salvează
        </button>
        {stadiuSchimbat && <span role="status" className="text-nota font-semibold text-turcoaz-900">Salvat: „{stadiu}”.</span>}
        {eroare && <span role="alert" className="text-nota font-semibold text-caramiziu-800">{eroare}</span>}
        <span className="basis-full text-nota text-cerneala-slab">
          „Contactat” și „A răspuns” se pun singure, după e-mailuri. Contractul se mută de aici: „Contract trimis”, apoi „Contract semnat”, apoi „Bani încasați”, cu suma.
        </span>
      </form>
      {f.arhivataLa && (
        <p role="status" className="mb-6 max-w-3xl colt-mic-a bg-hartie-umbra/70 px-4 py-3 text-mic font-semibold text-cerneala">
          Firma e arhivată: nu mai apare în liste, dar contractele și donațiile ei rămân în registru și în rapoarte.
        </p>
      )}

      {!domeniuRaspuns() && (
        <p className="mb-6 max-w-3xl colt-mic-a bg-hartie-calda px-4 py-3 text-mic text-cerneala-moale">
          Răspunsurile firmelor încă nu vin aici: ajung în căsuța ta de e-mail. Pașii de pornit sunt la{" "}
          <Link href="/admin/setari#email-firme" className="font-semibold text-caramiziu-700 underline">
            Setări
          </Link>
          .
        </p>
      )}

      <section className="grid max-w-4xl gap-4">
        {mesaje.length === 0 && (
          <p className="text-amplu text-cerneala-moale">Niciun e-mail încă. Scrie primul mai jos.</p>
        )}
        {mesaje.map((m) => (
          <MesajFirma key={m.id} m={m} />
        ))}
      </section>

      <section id="jos" className="mt-10 max-w-4xl scroll-mt-24 rounded-card border border-hartie-umbra bg-hartie-calda p-5 sm:p-6">
        <h2 className="mb-4 font-titlu text-amplu font-bold text-cerneala">
          {mesaje.length ? "Răspunde" : "Scrie un e-mail"}
        </h2>
        {nou && (
          <p role="status" className="mb-4 colt-mic-a bg-turcoaz-50 px-4 py-3 text-mic font-semibold text-turcoaz-900">
            Firma a fost adăugată. Scrie-i primul e-mail.
          </p>
        )}
        {era && (
          <p role="status" className="mb-4 colt-mic-a bg-hartie-umbra/60 px-4 py-3 text-mic font-semibold text-cerneala">
            Firma era deja în listă (același CUI sau aceeași adresă de e-mail). Iată discuția ei.
          </p>
        )}
        {!f.faraEmailuri && !["semnat", "incasat", "renuntat"].includes(f.stadiu) && trimiseFaraRaspuns(mesaje) >= NU_RASPUNDE_DUPA && (
          <p data-nu-raspunde className="mb-4 colt-mic-a bg-hartie-umbra/70 px-4 py-3 text-mic font-semibold text-cerneala">
            Nu răspunde: i-ai scris de {cate(trimiseFaraRaspuns(mesaje), "dată", "ori")} fără niciun răspuns. Mai bine o suni decât să-i mai scrii.
          </p>
        )}
        {refuza && !f.faraEmailuri && (
          <p role="alert" className="mb-4 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
            N-a plecat nimic: una dintre adresele scrise la „Către” a cerut să nu mai primească e-mailuri de la noi.
          </p>
        )}
        {trimis && (
          <p role="status" className="mb-4 colt-mic-a bg-turcoaz-50 px-4 py-3 text-mic font-semibold text-turcoaz-900">
            E-mailul a plecat. Îl vezi mai sus; când firma îl deschide, apare „Deschis”.
          </p>
        )}
        {ratat && (
          <p role="alert" className="mb-4 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
            E-mailul n-a putut pleca. Textul tău e tot în caseta de mai jos; încearcă din nou peste câteva minute.
          </p>
        )}
        {f.faraEmailuri ? (
          <div className="grid gap-3" data-refuza>
            <p role="status" className="colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
              {refuza ? "N-a plecat nimic. " : ""}Adresa asta a cerut să nu mai primească e-mailuri de la noi (din{" "}
              {new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(f.faraEmailuri))}
              ). Panoul nu-i mai trimite nimic.
            </p>
            <form action="/api/admin/firme/refuz" method="post">
              <input type="hidden" name="firma" value={f.id} />
              <input type="hidden" name="fac" value="porneste" />
              <button type="submit" className="text-mic font-semibold text-cerneala-moale underline underline-offset-2">
                Am vorbit cu ei și vor iar e-mailuri
              </button>
            </form>
          </div>
        ) : (
          <>
            <ScrieFirmei firmaId={f.id} catre={catreImplicit} subiect={subiect} campanii={campanii} />
            <form action="/api/admin/firme/refuz" method="post" className="mt-6 border-t border-hartie-umbra pt-4">
              <input type="hidden" name="firma" value={f.id} />
              <input type="hidden" name="fac" value="opreste" />
              <button type="submit" className="text-nota font-semibold text-cerneala-moale underline underline-offset-2 hover:text-caramiziu-800">
                Firma a răspuns „NU”: nu-i mai scrie
              </button>
            </form>
          </>
        )}
      </section>
      <section id={f.id} className="mt-10 max-w-4xl scroll-mt-24">
        <Jurnal firmaId={f.id} deschis inchide={false} intrari={jurnal} inapoiLa={`/admin/firme/${f.id}/mesaje`} />
      </section>
      {poateSterge && !f.arhivataLa && (
        <div className="mt-10 max-w-4xl border-t border-hartie-umbra pt-5">
          <StergeFirma id={f.id} denumire={f.denumire} />
        </div>
      )}
    </Cadru>
  );
}
