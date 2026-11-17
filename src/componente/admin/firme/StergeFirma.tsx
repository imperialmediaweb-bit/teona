"use client";

/**
 * „Șterge firma”, numai pentru administrator. Cere confirmare: ștergerea ia
 * cu ea discuția și atașamentele și nu se poate anula. Dacă firma are
 * contracte sau donații, serverul o arhivează în loc s-o șteargă.
 */
export default function StergeFirma({ id, denumire }: { id: string; denumire: string }) {
  return (
    <form
      action="/api/admin/firme/sterge"
      method="post"
      onSubmit={(e) => {
        if (!window.confirm(`Sigur ștergi ${denumire} și toate mesajele ei? Nu se poate anula.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="firma" value={id} />
      <button type="submit" className="text-nota font-semibold text-caramiziu-800 underline underline-offset-2 hover:text-caramiziu-900">
        Șterge firma, cu discuția și atașamentele ei
      </button>
      <p className="mt-1 text-nota text-cerneala-slab">
        Dacă are contracte sau donații, nu se șterge: se arhivează (dispare din liste, rămâne în registru).
      </p>
    </form>
  );
}
