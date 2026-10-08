import type { ReactNode } from "react";

/**
 * Apariție discretă la derulare: câțiva pixeli în sus și opacitate.
 *
 * Făcută în CSS, nu în JavaScript, și dintr-un motiv de fond: varianta cu
 * `IntersectionObserver` pornește de la `opacity: 0` și aduce conținutul la
 * vedere abia după ce se execută codul. Dacă JavaScriptul nu rulează — rețea
 * proastă, un script căzut, un cititor de ecran mai vechi — textul rămâne
 * invizibil. Pe site-ul unei asociații, conținutul nu are voie să depindă de
 * asta.
 *
 * Aici conținutul e vizibil din start și **rămâne vizibil**: animația mișcă
 * doar poziția, nu și opacitatea. În cel mai rău caz un bloc stă cu
 * paisprezece pixeli mai jos decât ar trebui — nimic nu dispare.
 *
 * Efectul se adaugă doar în browserele care știu `animation-timeline: view()`;
 * celelalte arată pagina normal. Și `prefers-reduced-motion` îl oprește.
 *
 * Fiind doar CSS, componenta rămâne pe server: nu trimite niciun kilooctet de
 * JavaScript în browser.
 */
export default function Aparitie({
  children,
  /** Ordinea în care apar elementele dintr-un grup, de la 0 la 5. */
  intarziere = 0,
  className = "",
}: {
  children: ReactNode;
  intarziere?: number;
  className?: string;
}) {
  const treapta = Math.min(5, Math.max(0, Math.round(intarziere * 12)));

  return (
    <div
      className={`aparitie ${className}`}
      style={{ "--treapta": treapta } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
