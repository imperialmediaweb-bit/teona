"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Locul în care se semnează cu degetul sau cu mouse-ul.
 *
 * **Ce e și ce nu e.** E o semnătură electronică simplă: un desen. Prin lege,
 * doar semnătura calificată (cu certificat) are puterea celei cu pixul. Ce o
 * susține pe asta sunt împrejurările — ora, adresa IP, browserul, amprenta
 * documentului și copia trimisă pe loc pe e-mailul firmei. Pagina scrie asta
 * deschis, lângă casetă; o semnătură despre care omul crede altceva decât e
 * nu ajută pe nimeni.
 *
 * Desenul se face cu evenimente de „pointer”, nu separat pentru mouse și
 * atingere: un singur set de evenimente acoperă degetul, creionul și mouse-ul.
 * `touch-action: none` oprește pagina din a se mișca sub deget cât timp omul
 * semnează — fără el, pe telefon trasul cu degetul derulează pagina și linia
 * iese ruptă.
 *
 * Pânza se desenează la rezoluția ecranului (`devicePixelRatio`), altfel pe
 * telefon semnătura iese neclară, ca o poză mărită.
 */
export default function SemnaturaPeEcran({
  name,
  eroare,
  onSemnat,
}: {
  name: string;
  eroare?: string;
  /** Anunță formularul că există sau nu există un desen. */
  onSemnat?: (areSemnatura: boolean) => void;
}) {
  const panza = useRef<HTMLCanvasElement | null>(null);
  const deseneaza = useRef(false);
  const [areDesen, setAreDesen] = useState(false);
  const [valoare, setValoare] = useState("");

  /* Pânza se potrivește pe lățimea ei reală abia după ce intră în pagină. */
  useEffect(() => {
    const el = panza.current;
    if (!el) return;

    function masoara() {
      const canvas = panza.current;
      if (!canvas) return;
      const lat = canvas.clientWidth;
      const inalt = canvas.clientHeight;
      const raport = window.devicePixelRatio || 1;
      // Redimensionarea golește pânza, deci se face doar când chiar s-a
      // schimbat ceva: altfel un derulaj pe telefon ar șterge semnătura.
      if (canvas.width === Math.round(lat * raport)) return;
      canvas.width = Math.round(lat * raport);
      canvas.height = Math.round(inalt * raport);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(raport, raport);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#232323";
    }

    masoara();
    window.addEventListener("resize", masoara);
    return () => window.removeEventListener("resize", masoara);
  }, []);

  function punct(ev: React.PointerEvent<HTMLCanvasElement>) {
    const el = panza.current!;
    const chenar = el.getBoundingClientRect();
    return { x: ev.clientX - chenar.left, y: ev.clientY - chenar.top };
  }

  function incepe(ev: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = panza.current?.getContext("2d");
    if (!ctx) return;
    /*
      Prinderea pointerului ține desenul legat de pânză chiar dacă degetul
      iese din ea. Nu peste tot merge: pe un eveniment sintetic (sau pe un
      browser mai vechi) aruncă, iar fără try/catch ar opri desenul de tot.
    */
    try {
      panza.current?.setPointerCapture(ev.pointerId);
    } catch {
      // Desenăm și fără ea; doar că ieșirea din casetă oprește linia.
    }
    deseneaza.current = true;
    const p = punct(ev);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    // Un punct singur (o atingere scurtă) trebuie să lase urmă, nu nimic.
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
  }

  function trage(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (!deseneaza.current) return;
    const ctx = panza.current?.getContext("2d");
    if (!ctx) return;
    const p = punct(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function termina() {
    if (!deseneaza.current) return;
    deseneaza.current = false;
    const el = panza.current;
    if (!el) return;
    setValoare(el.toDataURL("image/png"));
    setAreDesen(true);
    onSemnat?.(true);
  }

  function sterge() {
    const el = panza.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    setValoare("");
    setAreDesen(false);
    onSemnat?.(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-titlu text-mic font-bold text-cerneala">
          Semnătura ta{" "}
          <span className="text-caramiziu-700" aria-hidden="true">
            *
          </span>
        </span>
        {areDesen && (
          <button
            type="button"
            onClick={sterge}
            className="font-titlu text-mic font-semibold text-caramiziu-700 underline underline-offset-4"
          >
            Șterge și semnează din nou
          </button>
        )}
      </div>

      <canvas
        ref={panza}
        onPointerDown={incepe}
        onPointerMove={trage}
        onPointerUp={termina}
        onPointerLeave={termina}
        onPointerCancel={termina}
        aria-label="Semnează cu degetul sau cu mouse-ul în caseta aceasta"
        className={`mt-2 h-44 w-full cursor-crosshair touch-none rounded-moale border-2 bg-hartie ${
          eroare ? "border-caramiziu-500 bg-caramiziu-50" : "border-hartie-umbra"
        }`}
      />

      <input type="hidden" name={name} value={valoare} />

      <p className="mt-2 text-nota text-cerneala-slab">
        {areDesen
          ? "Semnătura e aplicată. Dacă nu-ți place, șterge-o și semnează din nou."
          : "Trage cu degetul pe telefon sau ține apăsat butonul mouse-ului pe calculator."}
      </p>

      {eroare && (
        <p
          role="alert"
          className="mt-2 font-titlu text-mic font-semibold text-caramiziu-700"
        >
          {eroare}
        </p>
      )}
    </div>
  );
}
