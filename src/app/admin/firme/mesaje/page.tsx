import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { mediu } from "@/lib/mediu";
import { discutii, domeniuRaspuns, marcheazaNelegateCitite, mesajeNelegate } from "@/lib/mesaje-firme";
import { ADRESA_SITE } from "@/app/seo";
import Cadru from "@/componente/admin/Cadru";
import MesajFirma from "@/componente/admin/firme/MesajFirma";
import AdaugaLead from "@/componente/admin/firme/AdaugaLead";
import { poarta } from "@/componente/admin/firme/Poarta";

export const metadata: Metadata = {
  title: "Mesaje cu firmele",
  robots: { index: false, follow: false },
};

type Cautare = { gresit?: string; trimise?: string; ratate?: string };

export default function PaginaMesajeFirme({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="Mesaje cu firmele">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const cand = (iso: string) =>
  new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }).format(new Date(iso));

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { gresit, trimise, ratate } = await searchParams;
  const oprit = await poarta("Mesaje cu firmele", "/admin/firme/mesaje", gresit);
  if (oprit) return oprit;

  const [lista, nelegate] = await Promise.all([discutii(), mesajeNelegate()]);
  if (nelegate.some((m) => !m.citit)) await marcheazaNelegateCitite().catch(() => undefined);
  const cuDiscutie = lista.filter((d) => d.firmaId);
  const primeste = Boolean(domeniuRaspuns());
  const urmareste = Boolean(mediu("RESEND_WEBHOOK_SECRET"));

  return (
    <Cadru
      titlu="Mesaje cu firmele"
      descriere="E-mailurile scrise fiecărei firme, cu atașamente, și răspunsurile lor. Vezi cine a deschis și cine a apăsat pe link."
      activ="/admin/firme/mesaje"
    >
      {trimise !== undefined && (
        <p role="status" className="mb-6 colt-mic-a bg-turcoaz-50 px-4 py-3 text-mic font-semibold text-turcoaz-900">
          {trimise === "1" ? "A plecat 1 e-mail." : `Au plecat ${trimise} e-mailuri, fiecare la firma lui.`}
          {ratate && <span className="block text-caramiziu-900">N-au plecat: {ratate}.</span>}
        </p>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/admin/firme/scrie"
          className="rounded-full bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie hover:bg-caramiziu-800"
        >
          ✉ Scrie la mai multe firme
        </Link>
        <Link
          href="/admin/firme"
          className="colt-mic-a border border-hartie-umbra bg-hartie px-5 py-2.5 font-titlu text-mic font-semibold text-cerneala hover:border-caramiziu-700"
        >
          Scrie unei singure firme: alege-o din Firme
        </Link>
      </div>

      <div className="mb-8">
        <AdaugaLead />
      </div>

      {cuDiscutie.length === 0 ? (
        <p className="text-amplu text-cerneala-moale">
          Niciun e-mail încă. Deschide o firmă din <Link href="/admin/firme" className="underline">Firme</Link> și apasă „✉ E-mailuri”, sau scrie la mai multe deodată.
        </p>
      ) : (
        <ul className="grid max-w-4xl gap-2.5">
          {cuDiscutie.map((d) => (
            <li key={d.firmaId}>
              <Link
                href={`/admin/firme/${d.firmaId}/mesaje#jos`}
                data-discutie
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border bg-hartie p-4 hover:border-caramiziu-400 ${
                  d.necitite ? "border-caramiziu-400" : "border-hartie-umbra"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-titlu text-mic font-bold text-cerneala">
                    {d.denumire}
                    {d.necitite > 0 && (
                      <span className="ml-2 rounded-full bg-caramiziu-700 px-2 py-0.5 text-nota font-bold text-hartie">
                        {d.necitite} {d.necitite === 1 ? "răspuns nou" : "răspunsuri noi"}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-nota text-cerneala-moale">
                    {d.ultimul.directie === "primit" ? "↩ " : "→ "}
                    {d.ultimul.subiect}
                  </span>
                </span>
                <span className="text-nota text-cerneala-slab">
                  {d.trimise} trimise · {d.deschise} deschise · {cand(d.ultimul.cand)}
                </span>
              </Link>
            </li>
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

      <details id="pornire" className="mt-12 max-w-3xl colt-a border border-hartie-umbra bg-hartie p-5" open={!primeste || !urmareste}>
        <summary className="cursor-pointer font-titlu text-mic font-bold text-cerneala">
          Cum se pornește {primeste && urmareste ? "(pornit)" : "— mai sunt pași de făcut"}
        </summary>
        <ol className="mt-4 grid list-decimal gap-3 pl-5 text-mic text-cerneala-moale">
          <li>
            <strong className="text-cerneala">Trimiterea</strong> merge deja: pleacă prin Resend, ca mulțumirile.
          </li>
          <li>
            <strong className="text-cerneala">„Deschis” și „a apăsat pe link”</strong>
            {urmareste ? " — pornit." : ":"} în Resend, la Domains → teona-ariana.ro → Configuration, pornește „open tracking” și
            „click tracking” și pune în Cloudflare înregistrarea CNAME pe care o arată. Apoi la Webhooks → Add endpoint:{" "}
            <code className="rounded bg-hartie-umbra px-1">{ADRESA_SITE}/api/email/resend/webhook</code>, cu evenimentele email.received,
            email.delivered, email.opened, email.clicked, email.bounced, email.complained. Secretul („Signing secret”) se pune în Railway
            ca <code className="rounded bg-hartie-umbra px-1">RESEND_WEBHOOK_SECRET</code>.
          </li>
          <li>
            <strong className="text-cerneala">Răspunsurile în panou</strong>
            {primeste ? ` — pornit, pe ${domeniuRaspuns()}.` : ":"} în Resend, la Receiving, adaugă subdomeniul{" "}
            <code className="rounded bg-hartie-umbra px-1">raspuns.teona-ariana.ro</code> și pune în Cloudflare înregistrarea MX pe
            care o arată (numai pe subdomeniu — căsuțele de pe teona-ariana.ro nu se ating). Apoi în Railway{" "}
            <code className="rounded bg-hartie-umbra px-1">RASPUNS_DOMENIU=raspuns.teona-ariana.ro</code>. Până atunci, răspunsurile
            ajung în căsuța celui care a scris.
          </li>
        </ol>
        <p className="mt-4 text-nota text-cerneala-slab">
          „Deschis” nu e sigur: iPhone-ul deschide singur pozele (arată deschis și când nu l-a citit), Outlook le blochează (arată
          nedeschis deși l-a citit). „A apăsat pe link” e semnul sigur.
        </p>
      </details>
    </Cadru>
  );
}
