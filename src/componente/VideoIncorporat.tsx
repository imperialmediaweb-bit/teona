"use client";

import { useState } from "react";

/**
 * Triunghiul de redare, desenat aici.
 *
 * Setul comun de pictograme n-are unul, iar o pictogramă nouă adăugată acolo
 * pentru un singur loc o plimbă prin toate paginile. Săgeata, care există, ar
 * fi spus „mergi altundeva”, nu „pornește”.
 */
function Redare({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/**
 * O filmare de pe Facebook, încorporată în pagină — dar abia la apăsare.
 *
 * **De ce nu se încarcă din start.** Iframe-ul Facebook aduce scripturile lor
 * și pune cookie-uri fiecărui om care deschide pagina, fie că se uită la
 * filmare, fie că nu. Pe un site care ține bannerul de cookie-uri tocmai ca să
 * nu pornească Google Analytics fără acord, un player care urmărește oamenii
 * din prima secundă ar fi aceeași faptă pe ușa din dos.
 *
 * Așa că întâi se arată o placă: titlul apariției și un buton. Nimic nu pleacă
 * spre Facebook până nu apasă omul — iar apăsarea *este* acordul, pentru
 * filmarea aia, atunci. Cine nu apasă n-a fost urmărit.
 *
 * Linkul către postare rămâne oricum pe card, deci cine nu vrea player are
 * unde să se ducă.
 *
 * Mărimea: `aspect-video` ține locul dinainte de încărcare, deci pagina nu
 * sare când apare iframe-ul — aceeași grijă ca la bara de anunț.
 */
export default function VideoIncorporat({
  adresa,
  titlu,
}: {
  /** Adresa postării de pe Facebook, așa cum a trimis-o asociația. */
  adresa: string;
  /** Ce se vede pe placă, înainte de încărcare. */
  titlu: string;
}) {
  const [pornit, setPornit] = useState(false);

  const player = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    adresa,
  )}&show_text=false&autoplay=true`;

  if (!pornit) {
    return (
      <button
        type="button"
        onClick={() => setPornit(true)}
        className="group relative grid aspect-video w-full max-w-2xl place-items-center overflow-hidden colt-mic-a border-t-4 border-turcoaz-600 bg-cerneala text-hartie transition-colors hover:bg-cerneala-moale"
      >
        <span className="flex flex-col items-center gap-3 px-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-hartie/15 transition-transform duration-500 ease-cald group-hover:scale-110 motion-reduce:group-hover:scale-100">
            <Redare className="size-6 translate-x-0.5 text-hartie" />
          </span>
          <span className="font-titlu text-corp font-bold">
            Vezi filmarea pe Facebook
          </span>
          <span className="text-nota text-hartie/70">
            {titlu}
          </span>
          <span className="text-nota text-hartie/50">
            Se încarcă de la Facebook, care poate pune cookie-uri.
          </span>
        </span>
      </button>
    );
  }

  return (
    <iframe
      src={player}
      title={titlu}
      className="aspect-video w-full max-w-2xl colt-mic-a border-t-4 border-turcoaz-600"
      style={{ border: "none", overflow: "hidden" }}
      scrolling="no"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
    />
  );
}
