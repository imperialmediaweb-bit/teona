"use client";

import { EVENIMENT_REDESCHIDE } from "@/lib/cookieuri";

/** „Alegerea se poate schimba oricând din subsol” (12.5). */
export default function DeschideSetariCookieuri() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENIMENT_REDESCHIDE))}
      className="underline underline-offset-2 transition hover:text-miere-300"
    >
      Setări cookie-uri
    </button>
  );
}
