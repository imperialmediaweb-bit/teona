import type { Metadata } from "next";
import Link from "next/link";
import { metadate } from "@/app/seo";
import { EMAIL, RUTE, TELEFON_PRINCIPAL } from "@/date/asociatie";

export const metadata: Metadata = {
  ...metadate({
    titlu: "Donația lunară s-a oprit",
    descriere: "Donația lunară către Asociația Teona Ariana Suceava s-a oprit.",
    cale: "/oprit",
  }),
  robots: { index: false, follow: false },
};

/**
 * După oprire.
 *
 * **Mulțumire, nu reproș și nici recuperare.** Tentația e să pui aici „ești
 * sigur?", un formular de motive sau o ofertă cu o sumă mai mică. Omul tocmai
 * a apăsat butonul; orice i se mai cere acum e o rugăminte neplăcută la
 * sfârșitul unui lucru pe care l-a făcut de bunăvoie luni de zile. Cine vrea
 * să revină găsește linkul; cine nu, pleacă cu bine și poate dona iar peste
 * un an.
 */
export default function PaginaOprit() {
  return (
    <section className="bg-hartie-calda py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="colt-a border border-hartie-umbra bg-hartie p-7 sm:p-9">
          <h1 className="text-h2 text-cerneala">Gata, am oprit-o.</h1>
          <p className="mt-4 text-amplu text-cerneala-moale">
            Nu se mai ia nimic de pe cardul tău. Îți mulțumim pentru fiecare
            lună în care ne-ai fost alături — copiii au avut tabere și
            activități și din banii tăi.
          </p>
          <p className="mt-4 text-amplu text-cerneala-moale">
            Dacă s-a oprit din greșeală sau voiai doar altă sumă, poți porni
            oricând una nouă.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={RUTE.doneaza}
              className="min-h-11 rounded-full border-2 border-cerneala px-6 py-3 font-titlu font-bold text-cerneala transition-colors hover:bg-cerneala hover:text-hartie"
            >
              Pornește o donație nouă
            </Link>
            <Link
              href={RUTE.acasa}
              className="min-h-11 font-titlu text-mic font-bold text-cerneala-moale underline underline-offset-4 hover:text-cerneala"
            >
              Mergi pe prima pagină
            </Link>
          </div>
          <p className="mt-7 border-t border-hartie-umbra pt-5 text-mic text-cerneala-moale">
            Dacă vezi totuși o sumă luată după ziua de azi, spune-ne la{" "}
            <a
              href={`mailto:${EMAIL.contact}`}
              className="font-semibold break-all text-caramiziu-700 underline underline-offset-2"
            >
              {EMAIL.contact}
            </a>{" "}
            sau la{" "}
            <a
              href={`tel:${TELEFON_PRINCIPAL.apel}`}
              className="font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              {TELEFON_PRINCIPAL.afisat}
            </a>{" "}
            și o întoarcem.
          </p>
        </div>
      </div>
    </section>
  );
}
