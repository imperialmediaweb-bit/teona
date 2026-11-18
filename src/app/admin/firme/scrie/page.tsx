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

/**
 * „+ E-mail nou”: un singur loc din care se scrie unei firme din listă, mai
 * multora deodată (fiecare cu e-mailul ei) sau uneia noi, adăugate pe loc.
 */

export const metadata: Metadata = {
  title: "E-mail nou către firme",
  robots: { index: false, follow: false },
};

type Cautare = { gresit?: string; firma?: string };

export default function PaginaEmailNou({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="E-mail nou">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { gresit, firma } = await searchParams;
  const oprit = await poarta("E-mail nou", "/admin/firme", gresit);
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
  const aleasa = lista.find((f) => f.id === firma && !f.faraEmailuri);
  return (
    <Cadru
      titlu="E-mail nou"
      descriere={`Unei firme sau mai multora (cel mult ${LIMITA_LOT} o dată). Fiecare primește e-mailul ei, cu numele ei.`}
      activ="/admin/firme"
    >
      <p className="mb-6 max-w-3xl text-mic text-cerneala-moale">
        <Link href="/admin/firme" className="font-semibold text-caramiziu-700 underline underline-offset-2">
          ← Firme / Sponsori
        </Link>
        {" · "}E-mailul apare apoi pe pagina fiecărei firme, cu „Deschis” și „A apăsat pe link”. Pentru o listă mare (sute de
        adrese) se folosește MailerLite.
      </p>
      <div className="max-w-4xl">
        <ScrieFirmei firme={lista} limita={LIMITA_LOT} campanii={campanii} aleseLaInceput={aleasa ? [aleasa.id] : []} />
      </div>
    </Cadru>
  );
}
