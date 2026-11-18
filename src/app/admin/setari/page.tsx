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

  const primeste = Boolean(domeniuRaspuns());
  const urmareste = Boolean(mediu("RESEND_WEBHOOK_SECRET"));
  const trimite = Boolean(mediu("RESEND_API_KEY"));

  return (
    <Cadru titlu="Setări" descriere="Ce se pornește o dată, în afara panoului, ca să meargă ce e în panou." activ="/admin/setari">
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
