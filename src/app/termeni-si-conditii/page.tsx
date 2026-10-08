import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import CadruLegal from "@/componente/pagina/CadruLegal";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";

export const metadata: Metadata = metadate({
  titlu: "Termeni și condiții",
  descriere:
    "Condițiile de utilizare a site-ului teona-ariana.ro și a serviciilor Asociației Teona Ariana Suceava.",
  cale: "/termeni-si-conditii",
});

export default function Pagina() {
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Termeni și condiții", cale: RUTE.termeni }])} />
      <CadruLegal titlu="Termeni și condiții" slugVechi="termeni-si-conditii" />
    </>
  );
}
