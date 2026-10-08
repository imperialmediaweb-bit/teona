import type { Metadata } from "next";
import CadruLegal from "@/componente/pagina/CadruLegal";

export const metadata: Metadata = { title: "Politica de cookie-uri" };

export default function Pagina() {
  return <CadruLegal titlu="Politica de cookie-uri" slugVechi="cookies" />;
}
