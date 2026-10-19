import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areEmail } from "@/lib/email/trimite";
import { exemple } from "@/lib/email/exemple";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mesajele trimise",
  robots: { index: false, follow: false },
};

/**
 * Toate mesajele pe care le trimite site-ul, de văzut.
 *
 * **De ce există.** Mesajele astea pleacă automat, în numele asociației, la
 * oameni care tocmai au donat sau tocmai au cerut ceva. Până acum singurul fel
 * de a vedea ce primește un donator era să donezi — iar o greșeală într-unul
 * dintre ele (un telefon vechi, o frază neterminată, un buton care duce
 * nicăieri) ar fi stat acolo luni de zile, fără ca nimeni din asociație să
 * afle.
 *
 * Nu se trimite nimic de aici. Se deschid, se citesc, atât.
 */

export default function PaginaEmailuri({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Mesajele trimise">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

function Rand({
  titlu,
  cand,
  id,
}: {
  titlu: string;
  cand: string;
  id: string;
}) {
  return (
    /*
      Titlul sus, butoanele dedesubt, întotdeauna.

      Pe un rând cu `justify-between`, cele cu titlu scurt își trăgeau
      butoanele lângă text, iar cele cu titlu lung le lăsau pe rândul
      următor. Două coloane de lățimi diferite scoteau așezarea la zaruri:
      lista arăta ca și cum fiecare rând ar fi fost pus de altcineva.
    */
    <li className="border-b border-hartie-umbra py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-titlu text-mic font-bold text-cerneala">{titlu}</p>
        <p className="mt-0.5 text-nota text-cerneala-moale">{cand}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <a
          href={`/api/admin/email?ce=${id}`}
          target="_blank"
          rel="noreferrer"
          className="colt-mic-a border border-hartie-umbra bg-hartie px-3.5 py-1.5 font-titlu text-nota font-bold text-cerneala transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
        >
          Vezi mesajul
        </a>
        <a
          href={`/api/admin/email?ce=${id}&fel=text`}
          target="_blank"
          rel="noreferrer"
          className="colt-mic-a border border-hartie-umbra bg-hartie px-3.5 py-1.5 font-titlu text-nota font-semibold text-cerneala-moale transition-colors hover:border-caramiziu-700 hover:text-caramiziu-800"
        >
          Text simplu
        </a>
      </div>
    </li>
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
      <Cadru titlu="Mesajele trimise" activ="/admin/emailuri">
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
      <Cadru titlu="Mesajele trimise" activ="/admin/emailuri">
        <Intrare gresit={Boolean(gresit)} unde="/admin/emailuri" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/emailuri"))) {
    return <FaraDrept titlu="Mesajele trimise" activ="/admin/emailuri" />;
  }

  const toate = exemple();
  const grupuri = [
    {
      titlu: "Ce primesc oamenii",
      nota: "Mesaje automate, trimise în numele asociației.",
      lista: toate.filter((e) => e.catre === "om"),
    },
    {
      titlu: "Ce primiți voi",
      nota: `Anunțuri către asociație, pe adresa de contact.`,
      lista: toate.filter((e) => e.catre === "asociatie"),
    },
  ];

  return (
    <Cadru
      titlu="Mesajele trimise"
      descriere="Toate e-mailurile pe care le trimite site-ul, cu date de probă."
      activ="/admin/emailuri"
    >
      <p className="mb-6 max-w-3xl text-amplu text-cerneala-moale">
        Mesajele astea pleacă singure, în numele asociației. Deschide-le din
        când în când: un telefon schimbat sau o frază care nu mai e adevărată se
        vede doar dacă se uită cineva. Nu se trimite nimic de aici, iar numele
        din ele sunt de probă.
      </p>

      {!areEmail() && (
        <p
          role="status"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          Lipsește RESEND_API_KEY din Railway, deci acum nu pleacă niciun mesaj.
          Se văd oricum aici, așa cum vor arăta.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {grupuri.map((g) => (
          <section
            key={g.titlu}
            className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6"
          >
            <h2 className="font-titlu text-amplu font-bold text-cerneala">
              {g.titlu}
            </h2>
            <p className="mt-1 text-nota text-cerneala-slab">{g.nota}</p>
            <ul className="mt-3">
              {g.lista.map((e) => (
                <Rand key={e.id} titlu={e.titlu} cand={e.cand} id={e.id} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/*
        Ce nu pleacă de la sine.

        Nu e o listă de lipsuri, e o hotărâre scrisă. Trei locuri în care
        tăcerea e dinadins, ca să nu caute nimeni din asociație un buton care
        nu există — și ca să nu-l adauge cineva peste un an, crezând c-a fost
        uitat.
      */}
      <section className="mt-8 colt-a border border-hartie-umbra bg-hartie-calda p-5 sm:p-6">
        <h2 className="font-titlu text-amplu font-bold text-cerneala">
          Ce nu pleacă de la sine, dinadins
        </h2>
        <ul className="mt-3 grid gap-2.5 text-mic text-cerneala-moale">
          <li>
            <strong className="text-cerneala">
              Buletinele și campaniile de e-mail.
            </strong>{" "}
            Se trimit din MailerLite, de un om. Aici sunt doar mesajele care
            răspund la un gest al cuiva. Șabloanele de campanie sunt la{" "}
            <Link
              href="/admin/sabloane"
              className="font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Șabloane de e-mail
            </Link>
            .
          </li>
          <li>
            <strong className="text-cerneala">
              Mulțumirea când transferul nu se găsește.
            </strong>{" "}
            La „N-am găsit-o în extras” nu pleacă nimic: n-avem ce să mulțumim,
            iar un mesaj automat care spune „nu i-am găsit banii” e o
            conversație de purtat la telefon, nu de trimis de un server.
          </li>
          <li>
            <strong className="text-cerneala">
              Confirmarea că formularul 230 a fost depus la ANAF.
            </strong>{" "}
            Site-ul nu știe când depuneți dosarul — hârtiile și depunerea se fac
            în afara lui. Mesajul de după completare promite că scriem atunci,
            deci rămâne un e-mail scris de mână.
          </li>
        </ul>
      </section>
    </Cadru>
  );
}
