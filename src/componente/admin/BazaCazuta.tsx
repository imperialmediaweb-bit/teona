/**
 * Ce vede omul din panou când baza de date nu răspunde.
 *
 * Până pe 4 noiembrie 2026, `.catch(() => [])` pe lista unei pagini lăsa
 * pagina goală: „Conturile — niciunul încă”, patru câmpuri goale la cifre,
 * nicio siglă. Adică o minciună: omul credea că s-a șters ceva, nu că n-a
 * putut fi citit. Degradarea e bună; a tăcea despre ea nu.
 */
export default function BazaCazuta({ ce = "lista" }: { ce?: string }) {
  return (
    <p
      role="alert"
      className="colt-mic-b border-t-4 border-caramiziu-600 bg-caramiziu-50 p-4 text-mic text-caramiziu-900"
    >
      <strong className="font-titlu font-bold text-caramiziu-800">
        Baza de date nu răspunde acum
      </strong>
      , deci {ce} nu se poate citi. Nu s-a pierdut nimic. Reîncarcă pagina
      peste un minut; dacă se repetă, spune-i dezvoltatorului.
    </p>
  );
}
