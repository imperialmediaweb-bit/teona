import { LISTE, type ListaExport } from "@/lib/export-csv";

/**
 * Butonul care descarcă lista ca fișier pentru Excel.
 *
 * Scrie limpede că fișierul conține date personale. Nu e o formalitate: un
 * export de donatori ajunge într-un folder Descărcări, de unde pleacă pe
 * WhatsApp fără să se mai gândească cineva ce e în el.
 */
export default function Descarca({ ce }: { ce: ListaExport }) {
  const eticheta = LISTE.find((l) => l.id === ce)?.eticheta ?? ce;
  return (
    <a
      href={`/api/admin/export?ce=${ce}`}
      download
      title={`Descarcă ${eticheta.toLowerCase()} ca fișier pentru Excel. Conține date personale.`}
      className="inline-flex items-center gap-2 colt-mic-a border-2 border-cerneala/15 bg-hartie px-4 py-2.5 font-titlu text-mic font-bold text-cerneala transition-colors hover:border-caramiziu-500 hover:text-caramiziu-700"
    >
      Descarcă pentru Excel
    </a>
  );
}
