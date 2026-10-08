import type { Metadata } from "next";
import CadruLegal from "@/componente/pagina/CadruLegal";

export const metadata: Metadata = { title: "Termeni și condiții" };

export default function Pagina() {
  return <CadruLegal titlu="Termeni și condiții" slugVechi="termeni-si-conditii" />;
}
