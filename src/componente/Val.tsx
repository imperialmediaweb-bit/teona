/**
 * Trecerea curbă dintre două secțiuni.
 *
 * Secțiunile despărțite de linii drepte se citesc ca benzi stivuite — e
 * așezarea oricărui șablon. O margine curbă leagă secțiunile în loc să le
 * taie, și e singurul loc din pagină unde forma face toată treaba: fără
 * chenar, fără umbră, fără titlu.
 *
 * Curba e aceeași peste tot, întoarsă după nevoie, ca să nu pară desenată
 * de fiecare dată altfel.
 */
export default function Val({
  /** Culoarea secțiunii **de dedesubt**: valul o aduce peste cea de deasupra. */
  culoare = "text-hartie",
  /** Întoarce curba, pentru trecerea inversă. */
  intors = false,
  className = "",
}: {
  culoare?: string;
  intors?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none -mb-px w-full ${culoare} ${className}`}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className={`block h-10 w-full sm:h-14 lg:h-20 ${intors ? "rotate-180" : ""}`}
      >
        <path
          d="M0 80V34c180-28 360-40 540-28 150 10 230 34 390 38 160 4 330-16 510-44v80H0z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
