/**
 * O firmă nouă, adăugată de mână ca lead: găsită de asociație, căreia vrea
 * să-i scrie. După salvare se deschide discuția ei, cu caseta de scris.
 */
const camp = "w-full rounded-moale border border-hartie-umbra bg-hartie px-3 py-2 text-mic text-cerneala";

export default function AdaugaLead({ deschis = false }: { deschis?: boolean }) {
  return (
    <details open={deschis} className="max-w-3xl colt-a border border-hartie-umbra bg-hartie p-4">
      <summary className="cursor-pointer font-titlu text-mic font-bold text-cerneala">＋ Adaugă o firmă (lead)</summary>
      <form action="/api/admin/firme/lead" method="post" className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-nota text-cerneala-moale sm:col-span-2">
          Numele firmei *
          <input name="denumire" required maxLength={200} className={camp} placeholder="Alfa Construct SRL" />
        </label>
        <label className="grid gap-1 text-nota text-cerneala-moale">
          E-mail *
          <input name="email" type="email" required className={camp} placeholder="office@firma.ro" />
        </label>
        <label className="grid gap-1 text-nota text-cerneala-moale">
          Persoana de contact
          <input name="persoana" maxLength={150} className={camp} placeholder="Ion Popescu (dacă știi)" />
        </label>
        <label className="grid gap-1 text-nota text-cerneala-moale">
          CUI (dacă îl știi)
          <input name="cui" maxLength={20} className={camp} placeholder="RO12345678" />
        </label>
        <label className="grid gap-1 text-nota text-cerneala-moale">
          Telefon
          <input name="telefon" maxLength={40} className={camp} />
        </label>
        <label className="grid gap-1 text-nota text-cerneala-moale sm:col-span-2">
          De unde o știi / notiță
          <input name="nota" maxLength={2000} className={camp} placeholder="Recomandată de…, a sponsorizat altă asociație…" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-full bg-cerneala px-5 py-2 font-titlu text-mic font-bold text-hartie">
            Adaugă și scrie-i
          </button>
        </div>
      </form>
    </details>
  );
}
