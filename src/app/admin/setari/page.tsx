import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { mediu } from "@/lib/mediu";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { domeniuRaspuns } from "@/lib/mesaje-firme";
import { ADRESA_SITE } from "@/app/seo";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import InstaleazaAplicatia from "@/componente/admin/InstaleazaAplicatia";
import Link from "next/link";
import { KeyRound, ShieldBan, Smartphone, Users } from "lucide-react";
import { listaBlocati, mesajeOprite } from "@/lib/spam";

/**
 * Setări: ce trebuie pornit o dată, în afara panoului (Resend, Railway,
 * Cloudflare), ca să meargă ce e în panou. Stăteau jos pe pagina de mesaje cu
 * firmele, unde încurcau lista de zi cu zi.
 */

export const metadata: Metadata = {
  title: "Setări",
  robots: { index: false, follow: false },
};

export default function PaginaSetari({ searchParams }: { searchParams: Promise<{ gresit?: string }> }) {
  return (
    <Suspense fallback={<Cadru titlu="Setări">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const Cod = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-hartie-umbra px-1 [overflow-wrap:anywhere]">{children}</code>
);

function Stare({ pornit }: { pornit: boolean }) {
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-nota font-bold ${
        pornit ? "bg-turcoaz-50 text-turcoaz-900" : "bg-caramiziu-50 text-caramiziu-900"
      }`}
    >
      {pornit ? "pornit" : "de pornit"}
    </span>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<{ gresit?: string }> }) {
  await connection();
  const { gresit } = await searchParams;
  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Setări" activ="/admin/setari">
        <p className="max-w-2xl text-amplu text-cerneala-moale">Panoul nu e configurat. Setează PAROLA_ADMIN în Railway.</p>
      </Cadru>
    );
  }
  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/setari" faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde="/admin/setari" />
      </Cadru>
    );
  }
  if (!(await arePermisiune("/admin/setari"))) return <FaraDrept titlu="Setări" activ="/admin/setari" />;

  const poateUtilizatori = await arePermisiune("/admin/utilizatori");
  const primeste = Boolean(domeniuRaspuns());
  const urmareste = Boolean(mediu("RESEND_WEBHOOK_SECRET"));
  const [blocati, oprite] = await Promise.all([listaBlocati().catch(() => []), mesajeOprite().catch(() => [])]);
  const trimite = Boolean(mediu("RESEND_API_KEY"));

  return (
    <Cadru titlu="Setări" descriere="Contul tău, utilizatorii și setările care se fac o singură dată." activ="/admin/setari">
      <div className="mb-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        <Link href="/admin/parola" prefetch={false} className="flex items-start gap-3 rounded-2xl bg-hartie p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_rgb(0_0_0/0.04)] transition hover:-translate-y-0.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><KeyRound className="size-5" aria-hidden="true" /></span>
          <span>
            <span className="block font-titlu text-mic font-bold text-cerneala">Contul meu</span>
            <span className="block text-nota text-cerneala-moale">Parola și codul de intrare rapidă</span>
          </span>
        </Link>
        {poateUtilizatori && (
          <Link href="/admin/utilizatori" prefetch={false} className="flex items-start gap-3 rounded-2xl bg-hartie p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_rgb(0_0_0/0.04)] transition hover:-translate-y-0.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><Users className="size-5" aria-hidden="true" /></span>
            <span>
              <span className="block font-titlu text-mic font-bold text-cerneala">Utilizatori</span>
              <span className="block text-nota text-cerneala-moale">Cine intră în panou și ce vede</span>
            </span>
          </Link>
        )}
        <div className="flex items-start gap-3 rounded-2xl bg-hartie p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_rgb(0_0_0/0.04)] sm:col-span-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><Smartphone className="size-5" aria-hidden="true" /></span>
          <span className="grid gap-2">
            <span className="block font-titlu text-mic font-bold text-cerneala">Panoul ca aplicație</span>
            <span className="block text-nota text-cerneala-moale">Pe telefon sau pe calculator, se deschide ca o aplicație și te ține minte.</span>
            <InstaleazaAplicatia luminos />
          </span>
        </div>
      </div>
      <section id="spam" className="mb-8 max-w-3xl scroll-mt-24 rounded-2xl bg-hartie p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_rgb(0_0_0/0.04)]">
        <h2 className="flex items-center gap-2 font-titlu text-amplu font-bold text-cerneala">
          <ShieldBan className="size-5 text-caramiziu-700" aria-hidden="true" />
          Spam și oferte
        </h2>
        <p className="mt-1 text-mic text-cerneala-moale">
          Ofertele comerciale (preț + TVA, „valabil doar azi”, audituri, servicii de marketing) și adresele blocate din Cereri
          nu mai ajung în panou și nu vă anunță. Cine le trimite vede „Mulțumim”.
        </p>
        <h3 className="mt-5 font-titlu text-mic font-bold text-cerneala">Adrese blocate ({blocati.length})</h3>
        {blocati.length === 0 ? (
          <p className="mt-1 text-mic text-cerneala-slab">Niciuna. Se blochează din Cereri, cu „Spam: șterge și blochează”.</p>
        ) : (
          <ul className="mt-2 divide-y divide-hartie-umbra/70">
            {blocati.map((b) => (
              <li key={b.valoare} className="flex flex-wrap items-center gap-3 py-2 text-mic">
                <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere] text-cerneala">
                  {b.valoare.startsWith("@") ? `tot domeniul ${b.valoare}` : b.valoare}
                </span>
                <span className="text-nota text-cerneala-slab">
                  {new Date(b.la).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short" })}
                  {b.adaugatDe ? ` · ${b.adaugatDe}` : ""}
                </span>
                <form action="/api/admin/cereri" method="post">
                  <input type="hidden" name="actiune" value="deblocheaza" />
                  <input type="hidden" name="valoare" value={b.valoare} />
                  <button type="submit" className="rounded-full border border-hartie-umbra px-3 py-1 font-titlu text-nota font-bold text-cerneala-moale hover:text-cerneala">
                    Deblochează
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-5">
          <summary className="cursor-pointer font-titlu text-mic font-bold text-cerneala">
            Mesaje oprite în ultimele 30 de zile ({oprite.length})
          </summary>
          <p className="mt-1 text-nota text-cerneala-slab">Dacă vezi aici un mesaj bun, răspunde-i direct persoanei și, dacă adresa e blocată, deblocheaz-o.</p>
          <ul className="mt-2 divide-y divide-hartie-umbra/70">
            {oprite.map((m, i) => (
              <li key={i} className="py-2 text-nota text-cerneala-moale">
                <span className="font-semibold text-cerneala">{m.nume || "—"}</span> · {m.email} ·{" "}
                {m.motiv === "blocat" ? "adresă blocată" : "ofertă"} ·{" "}
                {new Date(m.la).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest", day: "numeric", month: "short" })}
                <span className="mt-0.5 block line-clamp-2 [overflow-wrap:anywhere]">{m.inceput}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section id="email-firme" className="max-w-3xl scroll-mt-24 colt-a border border-hartie-umbra bg-hartie p-5">
        <h2 className="font-titlu text-amplu font-bold text-cerneala">E-mailurile cu firmele</h2>
        <ol className="mt-4 grid list-decimal gap-3 pl-5 text-mic text-cerneala-moale">
          <li>
            <strong className="text-cerneala">Trimiterea</strong>
            <Stare pornit={trimite} />
            <span className="block">Pleacă prin Resend, ca mulțumirile către donatori.</span>
          </li>
          <li>
            <strong className="text-cerneala">„Deschis” și „a apăsat pe link”</strong>
            <Stare pornit={urmareste} />
            <span className="block">
              În Resend, la Domains → teona-ariana.ro → Configuration, pornește „open tracking” și „click tracking” și pune în
              Cloudflare înregistrarea CNAME pe care o arată. Apoi la Webhooks → Add endpoint:{" "}
              <Cod>{ADRESA_SITE}/api/email/resend/webhook</Cod>, cu evenimentele email.received, email.delivered, email.opened,
              email.clicked, email.bounced, email.complained. Secretul („Signing secret”) se pune în Railway ca{" "}
              <Cod>RESEND_WEBHOOK_SECRET</Cod>.
            </span>
          </li>
          <li>
            <strong className="text-cerneala">Răspunsurile în panou</strong>
            <Stare pornit={primeste} />
            <span className="block">
              {primeste ? `Vin pe ${domeniuRaspuns()}. ` : ""}În Resend, la Receiving, se adaugă subdomeniul{" "}
              <Cod>raspuns.teona-ariana.ro</Cod> și se pune în Cloudflare înregistrarea MX pe care o arată (numai pe subdomeniu —
              căsuțele de pe teona-ariana.ro nu se ating). Apoi în Railway <Cod>RASPUNS_DOMENIU=raspuns.teona-ariana.ro</Cod>.
              Până atunci, răspunsurile ajung în căsuța celui care a scris.
            </span>
          </li>
        </ol>
        <p className="mt-4 text-nota text-cerneala-slab">
          „Deschis” nu e sigur: iPhone-ul deschide singur pozele (arată deschis și când nu l-a citit), Outlook le blochează (arată
          nedeschis deși l-a citit). „A apăsat pe link” e un semn mai bun, dar nici el sigur: la unele firme, programul de
          securitate deschide singur linkurile din e-mail. Sigur e numai un răspuns.
        </p>
      </section>
    </Cadru>
  );
}
