import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import CadruLegal from "@/componente/pagina/CadruLegal";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";

export const metadata: Metadata = metadate({
  titlu: "Politica de confidențialitate",
  descriere:
    "Ce date personale colectează Asociația Teona Ariana Suceava de la donatori, voluntari și vizitatori, cum le folosește și ce drepturi ai.",
  cale: "/politica-de-confidentialitate",
});

export default function Pagina() {
  return (
    <>
      <JsonLd
        date={jsonLdFir([
          {
            nume: "Politica de confidențialitate",
            cale: RUTE.confidentialitate,
          },
        ])}
      />
      <CadruLegal
        titlu="Politica de confidențialitate"
        slugVechi="politica-de-confidentialitate"
      />
    </>
  );
}
