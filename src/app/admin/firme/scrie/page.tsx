import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { firme, STADII_FIRMA } from "@/lib/crm";
import { LIMITA_LOT } from "@/lib/mesaje-firme";
import Cadru from "@/componente/admin/Cadru";
import ScrieFirmei from "@/componente/admin/ScrieFirmei";
import { textePublicate } from "@/lib/texte";
import { poarta } from "@/componente/admin/firme/Poarta";

export const metadata: Metadata = {
  title: "Scrie la mai multe firme",
  robots: { index: false, follow: false },
};

export default function PaginaScrieFirmelor({ searchParams }: { searchParams: Promise<{ gresit?: string }> }) {
  return (
    <Suspense fallback={<Cadru titlu="Scrie la mai multe firme">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<{ gresit?: string }> }) {
  await connection();
  const { gresit } = await searchParams;
  const oprit = await poarta("Scrie la mai multe firme", "/admin/firme/mesaje", gresit);
  if (oprit) return oprit;
  const campanii = (await textePublicate("campanie", 30).catch(() => [])).map((c) => ({ id: c.id, titlu: c.titlu }));
  const lista = (await firme(undefined, "", 1000)).map((f) => ({
    id: f.id,
    denumire: f.denumire,
    persoana: f.persoana,
    email: f.email,
    stadiu: f.stadiu,
    eticheta: STADII_FIRMA.find((s) => s.id === f.stadiu)?.eticheta ?? f.stadiu,
    faraEmailuri: Boolean(f.faraEmailuri),
  }));
  return (
    <Cadru
      titlu="Scrie la mai multe firme"
      descriere={`Același text, dar fiecare firmă primește e-mailul ei, cu numele ei. Cel mult ${LIMITA_LOT} o dată.`}
      activ="/admin/firme/mesaje"
    >
      <p className="mb-6 max-w-3xl text-mic text-cerneala-moale">
        <Link href="/admin/firme/mesaje" className="font-semibold text-caramiziu-700 underline underline-offset-2">
          ← Mesaje cu firmele
        </Link>
        {" · "}Fiecare e-mail apare apoi în discuția firmei, cu „Deschis” și „A apăsat pe link”. Pentru o listă mare (sute de
        adrese) se folosește MailerLite, nu pagina asta.
      </p>
      <div className="max-w-4xl">
        <ScrieFirmei firme={lista} limita={LIMITA_LOT} campanii={campanii} />
      </div>
    </Cadru>
  );
}
