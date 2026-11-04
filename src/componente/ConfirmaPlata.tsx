"use client";

import { useEffect, useState } from "react";

/**
 * Pe pagina de mulțumire: trimite identificatorul plății (Stripe `sesiune`,
 * PayPal `token`) la server, care întreabă procesatorul dacă plata s-a făcut.
 *
 * La PayPal asta e încasarea însăși: fără ea, comanda aprobată de om expiră și
 * banii nu se iau. La Stripe e a doua cale, pe lângă anunțul procesatorului,
 * ca donația să apară în panou chiar dacă anunțul întârzie sau se pierde.
 */
export default function ConfirmaPlata() {
  const [stare, setStare] = useState<"" | "lucreaza" | "platita" | "eroare">("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const sesiune = q.get("sesiune");
    const paypal = q.get("paypal") ? q.get("token") : null;
    if (!sesiune && !paypal) return;
    setStare("lucreaza");
    fetch("/api/donatii/confirma", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sesiune ? { sesiune } : { paypal }),
    })
      .then((r) => r.json())
      .then((d: { stare?: string }) => setStare(d.stare === "platita" ? "platita" : "eroare"))
      .catch(() => setStare("eroare"));
  }, []);

  if (!stare) return null;
  return (
    <p role="status" className="mx-auto mt-4 max-w-xl text-mic text-cerneala-moale">
      {stare === "lucreaza" && "Confirmăm plata…"}
      {stare === "platita" && "Plata e confirmată. Îți trimitem mulțumirea pe e-mail."}
      {stare === "eroare" &&
        "Nu am putut confirma plata pe loc. Dacă banii au fost luați, o vedem în câteva minute; dacă nu, scrie-ne."}
    </p>
  );
}
