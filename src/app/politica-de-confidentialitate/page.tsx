import type { Metadata } from "next";
import CadruLegal from "@/componente/pagina/CadruLegal";

export const metadata: Metadata = { title: "Politica de confidențialitate" };

export default function Pagina() {
  return <CadruLegal titlu="Politica de confidențialitate" slugVechi="politica-de-confidentialitate" />;
}
