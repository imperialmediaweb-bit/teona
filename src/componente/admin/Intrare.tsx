/** Formularul de intrare în panou. Parola merge prin POST, nu prin adresă. */
export default function Intrare({ gresit }: { gresit?: boolean }) {
  return (
    <form action="/api/admin/intrare" method="post" className="max-w-sm">
      <label
        htmlFor="parola"
        className="mb-2 block font-titlu text-mic font-bold text-cerneala"
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
        <p
          role="alert"
          className="mt-3 font-titlu font-semibold text-caramiziu-700"
        >
          Parolă greșită.
        </p>
      )}
      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie"
      >
        Intră
      </button>
    </form>
  );
}
