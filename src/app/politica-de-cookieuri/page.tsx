import type { Metadata } from "next";
import { RUTE } from "@/date/asociatie";
import CadruLegal from "@/componente/pagina/CadruLegal";
import { JsonLd, jsonLdFir, metadate } from "@/app/seo";

export const metadata: Metadata = metadate({
  titlu: "Politica de cookie-uri",
  descriere:
    "Ce cookie-uri folosește site-ul Asociației Teona Ariana Suceava, la ce servesc și cum le poți accepta sau refuza.",
  cale: "/politica-de-cookieuri",
});

export default function Pagina() {
  return (
    <>
      <JsonLd date={jsonLdFir([{ nume: "Politica de cookie-uri", cale: RUTE.cookieuri }])} />
      <CadruLegal titlu="Politica de cookie-uri" slugVechi="cookies" />
    </>
  );
}
