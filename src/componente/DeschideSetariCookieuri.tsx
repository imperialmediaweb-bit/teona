"use client";

import type { ReactNode } from "react";
import { EVENIMENT_REDESCHIDE } from "@/lib/cookieuri";

/**
 * „Alegerea se poate schimba oricând din subsol” (12.5).
 *
 * Stă în două locuri cu înfățișări diferite — în subsol, între linkurile
 * legale, și în mijlocul unei fraze din politica de cookie-uri — deci își
 * primește clasele din afară. Culoarea de trecere cu mouse-ul era miere, de
 * pe vremea subsolului închis; pe hârtie nu se mai vedea.
 */
export default function DeschideSetariCookieuri({
  children = "Setări cookie-uri",
  className = "inline-flex min-h-11 items-center underline underline-offset-2 transition hover:text-caramiziu-700",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENIMENT_REDESCHIDE))}
      className={className}
    >
      {children}
    </button>
  );
}
