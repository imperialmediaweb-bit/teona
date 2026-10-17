import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Varianta = "principal" | "secundar" | "contur" | "discret";

/*
  `sclipire` e pe variantele pline, nu pe toate: dâra de lumină e albă, deci
  pe un buton de hârtie n-ar avea pe ce să treacă. Vezi `globals.css`.
*/
const variante: Record<Varianta, string> = {
  principal:
    "sclipire bg-caramiziu-700 text-hartie hover:bg-caramiziu-800 shadow-[0_2px_0_0_var(--color-caramiziu-900)] hover:shadow-[0_1px_0_0_var(--color-caramiziu-900)] hover:translate-y-px",
  secundar:
    "sclipire bg-miere-400 text-cerneala hover:bg-miere-300 shadow-[0_2px_0_0_var(--color-miere-600)] hover:shadow-[0_1px_0_0_var(--color-miere-600)] hover:translate-y-px",
  contur:
    "border-2 border-cerneala/15 text-cerneala hover:border-caramiziu-500 hover:text-caramiziu-700 bg-hartie",
  discret:
    "text-caramiziu-700 hover:text-caramiziu-700 underline-offset-4 hover:underline",
};

const marimi = {
  normal: "px-6 py-3 text-corp",
  mare: "px-8 py-4 text-amplu",
  mic: "px-4 py-2 text-mic",
} as const;

type Proprietati = {
  /** Textul butonului. Obligatoriu: un buton fără text nu se publică. */
  children: ReactNode;
  /** Destinația. Obligatorie: caietul cere ca niciun buton să nu ducă nicăieri. */
  href: string;
  varianta?: Varianta;
  marime?: keyof typeof marimi;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

/**
 * Butonul site-ului.
 *
 * `href` și `children` sunt obligatorii prin tipuri, nu prin convenție: regula
 * „niciun buton sau link nu rămâne fără destinație” din caietul de sarcini
 * devine astfel o eroare de compilare, nu ceva de verificat cu ochiul.
 *
 * Linkurile externe primesc automat `target` și `rel` corecte.
 */
export default function Buton({
  children,
  href,
  varianta = "principal",
  marime = "normal",
  className = "",
  ...rest
}: Proprietati) {
  const extern = /^https?:\/\//.test(href);
  const posta = href.startsWith("mailto:") || href.startsWith("tel:");

  const clase = [
    "inline-flex items-center justify-center gap-2 rounded-full font-titlu font-semibold",
    // Apăsarea se simte: butonul coboară un pixel sub deget, apoi revine.
    // Pe telefon e singurul răspuns pe care îl primește omul înainte ca
    // pagina să se schimbe.
    "transition-all duration-200 ease-cald active:translate-y-0.5",
    variante[varianta],
    marimi[marime],
    className,
  ].join(" ");

  if (extern || posta) {
    return (
      <a
        href={href}
        className={clase}
        {...(extern ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
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
