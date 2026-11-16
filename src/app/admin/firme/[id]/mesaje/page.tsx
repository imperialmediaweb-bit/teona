import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { firma as iaFirma, STADII_FIRMA } from "@/lib/crm";
import { domeniuRaspuns, marcheazaCitite, mesajeleFirmei, NU_RASPUNDE_DUPA, trimiseFaraRaspuns } from "@/lib/mesaje-firme";
import Cadru from "@/componente/admin/Cadru";
import ScrieFirmei from "@/componente/admin/ScrieFirmei";
import MesajFirma from "@/componente/admin/firme/MesajFirma";
import { poarta } from "@/componente/admin/firme/Poarta";

export const metadata: Metadata = {
  title: "E-mailuri cu firma",
  robots: { index: false, follow: false },
};

export default function PaginaDiscutie({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gresit?: string; trimis?: string; ratat?: string; nou?: string; era?: string; refuza?: string }>;
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
  searchParams: Promise<{ gresit?: string; trimis?: string; ratat?: string; nou?: string; era?: string; refuza?: string }>;
}) {
  await connection();
  const { id } = await params;
  const { gresit, trimis, ratat, nou, era, refuza } = await searchParams;
  const oprit = await poarta("E-mailuri cu firma", "/admin/firme/mesaje", gresit);
  if (oprit) return oprit;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const f = await iaFirma(id);
  if (!f) notFound();

  const mesaje = await mesajeleFirmei(f.id);
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
      descriere={`E-mailurile cu ${f.persoana} · ${f.email} · ${stadiu}`}
      activ="/admin/firme/mesaje"
    >
      <p className="mb-6 flex flex-wrap gap-4 text-mic">
        <Link href="/admin/firme/mesaje" className="font-semibold text-caramiziu-700 underline underline-offset-2">
          ← Toate mesajele cu firmele
        </Link>
        <Link href={`/admin/firme?deschis=${f.id}#${f.id}`} className="font-semibold text-caramiziu-700 underline underline-offset-2">
          Fișa firmei
        </Link>
      </p>

      {!domeniuRaspuns() && (
        <p className="mb-6 max-w-3xl colt-mic-a bg-hartie-calda px-4 py-3 text-mic text-cerneala-moale">
          Răspunsurile firmelor încă nu vin aici: ajung în căsuța ta de e-mail. Pașii de pornit sunt pe pagina{" "}
          <Link href="/admin/firme/mesaje#pornire" className="font-semibold text-caramiziu-700 underline">
            Mesaje cu firmele
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
            Firma e adăugată ca lead. Scrie-i primul e-mail.
          </p>
        )}
        {era && (
          <p role="status" className="mb-4 colt-mic-a bg-hartie-umbra/60 px-4 py-3 text-mic font-semibold text-cerneala">
            Firma cu CUI-ul ăsta era deja în listă; n-am schimbat nimic la ea. Iată discuția ei.
          </p>
        )}
        {!f.faraEmailuri && trimiseFaraRaspuns(mesaje) >= NU_RASPUNDE_DUPA && (
          <p data-nu-raspunde className="mb-4 colt-mic-a bg-hartie-umbra/70 px-4 py-3 text-mic font-semibold text-cerneala">
            Nu răspunde: i-ai scris de {trimiseFaraRaspuns(mesaje)} ori fără niciun răspuns. Mai bine o lași în pace sau o suni.
          </p>
        )}
        {refuza && !f.faraEmailuri && (
          <p role="alert" className="mb-4 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
            N-a plecat nimic: una dintre adresele scrise la „Către” a cerut să nu mai primească e-mailuri de la noi.
          </p>
        )}
        {trimis && (
          <p role="status" className="mb-4 colt-mic-a bg-turcoaz-50 px-4 py-3 text-mic font-semibold text-turcoaz-900">
            A plecat. Îl vezi mai sus; când îl deschide, scrie „Deschis”.
          </p>
        )}
        {ratat && (
          <p role="alert" className="mb-4 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
            N-a plecat: serverul de e-mail n-a răspuns. Ce ai scris e tot în caseta de mai jos; încearcă din nou peste câteva minute.
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
            <ScrieFirmei firmaId={f.id} catre={catreImplicit} subiect={subiect} />
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
    </Cadru>
  );
}
