"use client";

import { useEffect, useRef, useState } from "react";

/**
 * E-mailul, desenat lângă formular, cât scrii.
 *
 * Înainte, ca să vezi cum arată, apăsai „Vezi cum arată” și se deschidea o
 * filă nouă — omul scria orb și verifica la sfârșit. Acum formularul trimite,
 * la o jumătate de secundă după ultima tastă, aceleași câmpuri la ruta
 * șablonului (`?previzualizare=1`, fără să urce poza nicăieri), iar HTML-ul
 * primit se pune în cadru cu `srcdoc`.
 *
 * `srcdoc`, nu `src`: site-ul trimite `frame-ancestors 'none'`, deci o adresă
 * de-a lui pusă în cadru rămâne albă. Un document scris direct în cadru nu
 * trece prin regula aia. `sandbox` fără scripturi: e-mailul n-are ce rula.
 *
 * Poza aleasă de pe calculator se arată din browser (`blob:`), fără s-o urce:
 * urcarea se face abia la trimitere.
 *
 * Tot aici: când schimbi „Pentru cine”, lista potrivită se bifează singură și
 * cealaltă se debifează. Un e-mail pentru firme plecat la persoane fizice e
 * greșeala cea mai ușor de făcut pe pagina asta.
 */
export default function PrevizualizareEmail({
  formular,
  grupuri,
}: {
  /** `id`-ul formularului din care se citesc câmpurile. */
  formular: string;
  /** Grupul MailerLite potrivit fiecărui fel de șablon, dacă e configurat. */
  grupuri: { persoane?: string; firme?: string };
}) {
  const [html, setHtml] = useState<string>("");
  const [incarc, setIncarc] = useState(false);
  const blob = useRef<string | null>(null);
  const ultima = useRef(0);

  useEffect(() => {
    const f = document.getElementById(formular) as HTMLFormElement | null;
    if (!f) return;
    let ceas: ReturnType<typeof setTimeout> | undefined;

    const deseneaza = async () => {
      const date = new FormData(f);
      const fisier = date.get("poza_fisier");
      date.delete("poza_fisier");
      if (fisier instanceof File && fisier.size > 0) {
        if (blob.current) URL.revokeObjectURL(blob.current);
        blob.current = URL.createObjectURL(fisier);
        date.set("poza_locala", blob.current);
      } else if (blob.current) {
        URL.revokeObjectURL(blob.current);
        blob.current = null;
      }
      date.set("fac", "vezi");
      const nr = ++ultima.current;
      setIncarc(true);
      try {
        const r = await fetch("/api/admin/sablon?previzualizare=1", {
          method: "POST",
          body: date,
          credentials: "same-origin",
        });
        const text = await r.text();
        // Un răspuns venit târziu nu suprascrie unul mai nou.
        if (nr !== ultima.current) return;
        if (r.ok) {
          // Linkurile din e-mail se deschid în altă filă, nu în cadru.
          setHtml(
            text
              .replace(/<head>/i, '<head><base target="_blank">')
              /*
                Pozele din e-mail au adresa întreagă, cu `www.` — în inbox
                așa trebuie. Aici, regula de securitate a panoului lasă poze
                numai de pe adresa exactă a paginii, iar `www.` e alta; se
                scriu deci relativ, din același site.
              */
              .replace(/https?:\/\/(www\.)?teona-ariana\.ro\//g, "/"),
          );
        }
      } catch {
        // Fără rețea, rămâne ultima variantă desenată.
      } finally {
        if (nr === ultima.current) setIncarc(false);
      }
    };

    const programeaza = () => {
      clearTimeout(ceas);
      ceas = setTimeout(deseneaza, 450);
    };

    const laSchimbare = (e: Event) => {
      const tinta = e.target as HTMLInputElement;
      if (tinta?.name === "fel" && tinta.checked) {
        const potrivit =
          tinta.value === "firme" ? grupuri.firme : grupuri.persoane;
        const celalalt =
          tinta.value === "firme" ? grupuri.persoane : grupuri.firme;
        for (const c of f.querySelectorAll<HTMLInputElement>(
          'input[name="grup"]',
        )) {
          if (potrivit && c.value === potrivit) c.checked = true;
          if (celalalt && c.value === celalalt) c.checked = false;
        }
      }
      programeaza();
    };

    f.addEventListener("input", programeaza);
    f.addEventListener("change", laSchimbare);
    deseneaza();
    return () => {
      clearTimeout(ceas);
      f.removeEventListener("input", programeaza);
      f.removeEventListener("change", laSchimbare);
    };
  }, [formular, grupuri.firme, grupuri.persoane]);

  useEffect(
    () => () => {
      if (blob.current) URL.revokeObjectURL(blob.current);
    },
    [],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-hartie-umbra bg-hartie">
      <div className="flex items-center justify-between gap-3 border-b border-hartie-umbra px-4 py-2.5">
        <p className="font-titlu text-mic font-bold text-cerneala">
          Așa arată e-mailul
        </p>
        <p className="text-nota text-cerneala-slab" aria-live="polite">
          {incarc ? "se desenează…" : "se schimbă cât scrii"}
        </p>
      </div>
      <iframe
        title="Previzualizarea e-mailului"
        srcDoc={html}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="block h-[70vh] min-h-[520px] w-full bg-[#f4f1ee] lg:h-[calc(100vh-7rem)]"
      />
    </div>
  );
}
