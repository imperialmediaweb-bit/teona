import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import Buton from "@/componente/Buton";

export const metadata: Metadata = {
  title: "Pagina nu a fost găsită",
  robots: { index: false, follow: true },
};

/** Pagina 404 (12.7). */
export default function PaginaNegasita() {
  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <p className="scris text-h2 text-miere-400">404</p>
        <h1 className="mt-3 text-h1 text-cerneala">Pagina nu a fost găsită</h1>
        <p className="mt-5 text-amplu text-cerneala-moale">
          Se pare că ai ajuns într-un loc care nu există. Hai înapoi la început.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Buton href={RUTE.acasa} varianta="contur">
            Mergi la Home
          </Buton>
          <Buton href={RUTE.doneaza}>Donează</Buton>
        </div>
      </div>
    </section>
  );
}
