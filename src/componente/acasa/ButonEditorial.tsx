import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Varianta = "principal" | "contur" | "pe-portocaliu";

/**
 * Butonul primei pagini, cu colțuri drepte.
 *
 * Copie locală a lui `Buton`, cu o singură diferență de fond: nu e pastilă.
 * Pe o pagină ținută de linii drepte și de grilă, butonul rotund arată ca
 * venit din altă parte. Forma dreaptă îl pune în aceeași familie cu
 * chenarele subțiri și cu fotografiile tăiate drept. Restul paginilor își
 * păstrează butonul lor.
 */
const variante: Record<Varianta, string> = {
  principal:
    "bg-caramiziu-500 text-hartie hover:bg-caramiziu-600 border-2 border-caramiziu-500 hover:border-caramiziu-600",
  contur:
    "border-2 border-cerneala text-cerneala hover:bg-cerneala hover:text-hartie",
  // Pe fundal portocaliu, portocaliul dispare: aici contrastul e albul plin.
  "pe-portocaliu":
    "border-2 border-hartie bg-hartie text-caramiziu-600 hover:bg-transparent hover:text-hartie",
};

const marimi = {
  normal: "px-6 py-3 text-corp",
  mare: "px-8 py-4 text-amplu",
  mic: "px-5 py-2.5 text-mic",
} as const;

type Proprietati = {
  children: ReactNode;
  /** Obligatorie: niciun buton nu rămâne fără destinație. */
  href: string;
  varianta?: Varianta;
  marime?: keyof typeof marimi;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

export default function ButonEditorial({
  children,
  href,
  varianta = "principal",
  marime = "normal",
  className = "",
  ...rest
}: Proprietati) {
  const extern = /^https?:\/\//.test(href);

  const clase = [
    "inline-flex items-center justify-center gap-3 font-titlu font-bold",
    "transition-colors duration-200 ease-cald",
    variante[varianta],
    marimi[marime],
    className,
  ].join(" ");

  if (extern) {
    return (
      <a href={href} className={clase} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={clase} {...rest}>
      {children}
    </Link>
  );
}
