/**
 * Formularul de intrare în panou. Parola merge prin POST, nu prin adresă.
 *
 * Două căi în același formular: contul propriu (e-mail și parolă) sau parola
 * asociației, cu e-mailul lăsat gol. Un formular cu două butoane „Intră" ar
 * fi pus oamenii să aleagă înainte să știe ce aleg; aici e un singur drum, iar
 * câmpul gol spune de la sine ce face.
 *
 * `unde` spune rutei pe ce pagină se întorcea omul. Ruta nu-l crede pe
 * cuvânt — îl compară cu lista ei de pagini și cu rolul celui care intră —
 * dar așa cine deschide „Contracte" și se autentifică ajunge tot acolo.
 */
export default function Intrare({
  gresit,
  unde = "/admin",
}: {
  gresit?: boolean;
  unde?: string;
}) {
  return (
    <form action="/api/admin/intrare" method="post" className="max-w-sm">
      <input type="hidden" name="unde" value={unde} />

      <label
        htmlFor="email"
        className="mb-2 block font-titlu text-mic font-bold text-cerneala"
      >
        E-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
      />

      <label
        htmlFor="parola"
        className="mt-4 mb-2 block font-titlu text-mic font-bold text-cerneala"
      >
        Parola
      </label>
      <input
        id="parola"
        name="parola"
        type="password"
        autoComplete="current-password"
        className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
      />

      {gresit && (
        /*
          Un singur mesaj pentru orice nepotrivire. „Adresa nu există" ar face
          din formularul ăsta un instrument de aflat cine lucrează la
          asociație.
        */
        <p
          role="alert"
          className="mt-3 font-titlu font-semibold text-caramiziu-700"
        >
          E-mailul sau parola nu se potrivesc.
        </p>
      )}

      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie"
      >
        Intră
      </button>

      <p className="mt-4 text-nota text-cerneala-slab">
        Dacă folosești parola asociației, lasă e-mailul gol.
      </p>
    </form>
  );
}
