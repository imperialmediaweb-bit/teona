import { esteAutentificat } from "@/lib/admin";
import { raspuns } from "@/lib/api";
import { pdfulContractului } from "@/lib/contracte";

/**
 * Descărcarea contractului semnat, din panou.
 *
 * Fișierul iese exact așa cum a fost salvat în clipa semnării — nu se
 * regenerează din date. Dacă mâine se schimbă o clauză sau o adresă a
 * asociației, documentul descărcat trebuie să rămână cel semnat.
 */
export async function GET(
  _cerere: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Contract necunoscut.", 400);

  const gasit = await pdfulContractului(id);
  if (!gasit) return raspuns("Contractul nu există.", 404);

  const nume = gasit.denumire
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return new Response(new Uint8Array(gasit.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Contract-${nume || "firma"}.pdf"`,
      // Un contract semnat nu are ce căuta în niciun cache de pe drum.
      "Cache-Control": "no-store",
    },
  });
}
