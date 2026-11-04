"use client";

import { useEffect } from "react";

/**
 * Pozele mari se micșorează în browser, înainte să plece spre server.
 *
 * O poză de pe telefon are 8–15 MB, iar pe site ajunge la cel mult 1.600 px.
 * Trimisă întreagă, lovea limita cererii și omul vedea „Cerere invalidă” (4
 * noiembrie 2026, la un șablon de e-mail). Acum, la alegerea fișierului, orice
 * fotografie peste 1,5 MB se redesenează la cel mult 2.000 px pe latura mare
 * și pleacă ca JPEG — de obicei sub 500 KB — fără ca omul să facă nimic.
 *
 * Stă o dată, în aranjamentul panoului, și ascultă toate câmpurile de fișier
 * de acolo: șabloane, noutăți, sigle. Ce nu e fotografie (PDF, SVG) trece
 * neatins. Orientarea din EXIF se păstrează: o poză făcută pe verticală
 * rămâne pe verticală.
 */

const LATURA_MAXIMA = 2000;
const PESTE = 1.5 * 1024 * 1024;

function mb(n: number): string {
  return (n / 1024 / 1024).toFixed(1).replace(".", ",");
}

async function micsoreaza(f: File): Promise<File | null> {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size <= PESTE) return null;
  const bitmap = await createImageBitmap(f, { imageOrientation: "from-image" });
  const scara = Math.min(1, LATURA_MAXIMA / Math.max(bitmap.width, bitmap.height));
  const latime = Math.max(1, Math.round(bitmap.width * scara));
  const inaltime = Math.max(1, Math.round(bitmap.height * scara));
  const panza = document.createElement("canvas");
  panza.width = latime;
  panza.height = inaltime;
  const ctx = panza.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, latime, inaltime);
  bitmap.close();
  // PNG rămâne PNG (poate avea transparență); restul pleacă JPEG.
  const tip = f.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((r) => panza.toBlob(r, tip, 0.86));
  if (!blob || blob.size >= f.size) return null;
  const nume = f.name.replace(/\.\w+$/, "") + (tip === "image/png" ? ".png" : ".jpg");
  return new File([blob], nume, { type: tip, lastModified: Date.now() });
}

export default function MicsoreazaPoza() {
  useEffect(() => {
    async function laSchimbare(e: Event) {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files?.length) return;
      if (input.dataset.faraMicsorare !== undefined) return;

      const initiale = Array.from(input.files);
      const noi: File[] = [];
      let dinainte = 0;
      let dupa = 0;
      for (const f of initiale) {
        const mic = await micsoreaza(f).catch(() => null);
        if (mic) {
          dinainte += f.size;
          dupa += mic.size;
        }
        noi.push(mic ?? f);
      }
      if (!dinainte) return;

      const dt = new DataTransfer();
      for (const f of noi) dt.items.add(f);
      input.files = dt.files;

      let nota = input.parentElement?.querySelector<HTMLElement>("[data-nota-poza]") ?? null;
      if (!nota) {
        nota = document.createElement("p");
        nota.dataset.notaPoza = "";
        nota.className = "mt-1 text-nota text-cerneala-slab";
        input.insertAdjacentElement("afterend", nota);
      }
      nota.textContent = `Poza a fost micșorată de la ${mb(dinainte)} MB la ${mb(dupa)} MB, ca să urce repede.`;
    }
    document.addEventListener("change", laSchimbare, true);
    return () => document.removeEventListener("change", laSchimbare, true);
  }, []);
  return null;
}
