import { FELURI_INTERACTIUNE, type Interactiune } from "@/lib/crm";

/**
 * Jurnalul discuțiilor cu un om sau cu o firmă.
 *
 * Se deschide dintr-un link, nu dintr-un buton de JavaScript: panoul e o
 * pagină randată pe server, iar un `<details>` deschis s-ar închide la
 * fiecare salvare. Linkul pune `?deschis=<id>` în adresă, deci starea
 * supraviețuiește reîncărcării și poate fi trimisă cuiva.
 *
 * Interogarea jurnalului se face doar pentru rândul deschis. Altfel o listă
 * de 200 de firme ar face 200 de interogări ca să afișeze, în cel mai bun
 * caz, 200 de liste goale.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Jurnal({
  email,
  firmaId,
  deschis,
  intrari,
  inapoiLa,
}: {
  email?: string;
  firmaId?: string;
  deschis: boolean;
  intrari: Interactiune[];
  /** Unde duce „închide” — aceeași listă, cu aceleași filtre. */
  inapoiLa: string;
}) {
  const cheie = firmaId ?? email ?? "";
  const separator = inapoiLa.includes("?") ? "&" : "?";
  const ancora = firmaId ? `#${firmaId}` : "";

  if (!deschis) {
    return (
      <a
        href={`${inapoiLa}${separator}deschis=${encodeURIComponent(cheie)}${ancora}`}
        className="mt-3 inline-block font-titlu text-nota font-bold text-caramiziu-700 underline underline-offset-4"
      >
        Discuții și notițe
      </a>
    );
  }

  return (
    <div className="mt-4 rounded-moale bg-hartie-calda p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-titlu text-mic font-bold text-cerneala">
          Discuții și notițe
        </h3>
        <a
          href={`${inapoiLa}${ancora}`}
          className="text-nota text-cerneala-slab underline underline-offset-2"
        >
          Închide
        </a>
      </div>

      <form
        action="/api/admin/jurnal"
        method="post"
        className="mt-3 flex flex-wrap items-start gap-2"
      >
        {email && <input type="hidden" name="email" value={email} />}
        {firmaId && <input type="hidden" name="firma_id" value={firmaId} />}
        <input type="hidden" name="inapoi" value={inapoiLa} />
        <select
          name="fel"
          className="rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 font-titlu text-mic"
        >
          {FELURI_INTERACTIUNE.map((f) => (
            <option key={f.id} value={f.id}>
              {f.eticheta}
            </option>
          ))}
        </select>
        <input
          name="rezumat"
          required
          maxLength={2000}
          placeholder="Ce s-a vorbit, ce rămâne de făcut"
          className="min-w-0 flex-1 rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic"
        />
        <button
          type="submit"
          className="rounded-full bg-turcoaz-600 px-4 py-2 font-titlu text-mic font-bold text-hartie"
        >
          Adaugă
        </button>
      </form>

      {intrari.length === 0 ? (
        <p className="mt-4 text-nota text-cerneala-slab">
          Nimic scris încă. Primul rând de aici e de obicei „l-am sunat”.
        </p>
      ) : (
        <ol className="mt-4 grid gap-2.5">
          {intrari.map((i) => (
            <li
              key={i.id}
              className="border-l-2 border-turcoaz-300 pl-3 text-mic"
            >
              <p className="text-nota text-cerneala-slab">
                {FELURI_INTERACTIUNE.find((f) => f.id === i.fel)?.eticheta ??
                  i.fel}{" "}
                · {CAND.format(new Date(i.cand))}
              </p>
              <p className="text-cerneala-moale">{i.rezumat}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
