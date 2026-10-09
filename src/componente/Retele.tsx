import type { SVGProps } from "react";

const CAI: Record<string, string> = {
  Facebook:
    "M14 8.5V6.9c0-.7.2-1.1 1.2-1.1h1.4V3.1c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2H9v3h2.2v7.5h3V11.5h2.2l.3-3H14z",
  Instagram:
    "M10 2.6c2.4 0 2.7 0 3.6.05.9.04 1.4.2 1.7.33.43.17.74.37 1.06.69.32.32.52.63.69 1.06.13.3.29.8.33 1.7.05.9.05 1.2.05 3.6s0 2.7-.05 3.6c-.04.9-.2 1.4-.33 1.7-.17.43-.37.74-.69 1.06-.32.32-.63.52-1.06.69-.3.13-.8.29-1.7.33-.9.05-1.2.05-3.6.05s-2.7 0-3.6-.05c-.9-.04-1.4-.2-1.7-.33a2.9 2.9 0 0 1-1.06-.69 2.9 2.9 0 0 1-.69-1.06c-.13-.3-.29-.8-.33-1.7C2.6 12.7 2.6 12.4 2.6 10s0-2.7.05-3.6c.04-.9.2-1.4.33-1.7.17-.43.37-.74.69-1.06.32-.32.63-.52 1.06-.69.3-.13.8-.29 1.7-.33C7.3 2.6 7.6 2.6 10 2.6zm0 2.2a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4zm0 8.58a3.38 3.38 0 1 1 0-6.76 3.38 3.38 0 0 1 0 6.76zm6.62-8.8a1.22 1.22 0 1 1-2.44 0 1.22 1.22 0 0 1 2.44 0z",
  TikTok:
    "M13.1 2h2.5c.15 1.3.87 2.42 1.9 3.07.63.4 1.37.63 2.15.66v2.52a6.9 6.9 0 0 1-3.97-1.3v5.73a5.24 5.24 0 1 1-4.5-5.19v2.6a2.67 2.67 0 1 0 1.92 2.56V2z",
};

/** Pictogramele rețelelor. Căile sunt desenate aici, nu aduse dintr-o librărie. */
export function PictogramaRetea({
  nume,
  ...rest
}: { nume: string } & SVGProps<SVGSVGElement>) {
  const cale = CAI[nume];
  if (!cale) return null;
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...rest}>
      <path d={cale} />
    </svg>
  );
}

type Proprietati = {
  retele: ReadonlyArray<{ nume: string; url: string }>;
  /** Spus cu voce tare de cititoarele de ecran: „Facebook, Asociația…”. */
  context: string;
  className?: string;
};

export default function Retele({
  retele,
  context,
  className = "",
}: Proprietati) {
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {retele.map((retea) => (
        <li key={retea.nume}>
          <a
            href={retea.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${retea.nume}, ${context} (se deschide într-o filă nouă)`}
            className="flex size-10 items-center justify-center rounded-full border border-current/15 text-current transition hover:border-caramiziu-500 hover:bg-caramiziu-500 hover:text-hartie"
          >
            <PictogramaRetea nume={retea.nume} className="size-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
