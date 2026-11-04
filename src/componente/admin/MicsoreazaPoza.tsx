"use client";

import { useEffect } from "react";
import { type TipPoza, tipulPozei } from "@/lib/poza-browser";

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
/** Peste atât, un PNG micșorat pleacă totuși JPEG: ruta primește cel mult 6 MB. */
const PNG_MAXIM = 4 * 1024 * 1024;

/** HEIC/HEIF (iPhone): „ftyp” la octetul 4, apoi „heic”/„heix”/„mif1”… */
function pareHeic(cap: Uint8Array): boolean {
  const marca = String.fromCharCode(...cap.slice(4, 12));
  return marca.startsWith("ftyp") && /^(heic|heix|hevc|mif1|msf1|heif)/.test(marca.slice(4));
}

function mb(n: number): string {
  return (n / 1024 / 1024).toFixed(1).replace(".", ",");
}

/** Desenul pozei, cu orientarea din EXIF; dacă browserul nu știe calea rapidă, pe cea veche. */
async function deseneaza(f: File, tip: TipPoza): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(f, { imageOrientation: "from-image" });
  } catch {
    const adresa = URL.createObjectURL(new Blob([f], { type: tip }));
    try {
      return await new Promise<HTMLImageElement>((r, nu) => {
        const img = new Image();
        img.onload = () => r(img);
        img.onerror = () => nu(new Error("poza nu se poate decoda"));
        img.src = adresa;
      });
    } finally {
      URL.revokeObjectURL(adresa);
    }
  }
}

/** Întoarce poza micșorată, `null` dacă nu e nevoie, sau aruncă dacă nu poate. */
async function micsoreaza(f: File): Promise<File | null> {
  if (f.size <= PESTE) return null;
  // Tipul din conținut, nu din eticheta sistemului: pe Windows poate fi gol.
  const tip = await tipulPozei(f);
  if (!tip) {
    // Nu se tace: un HEIC de pe iPhone ar ajunge la server și ar primi
    // „prea mare” sau „nu e o fotografie”, fără ca omul să afle ce să facă.
    const cap = new Uint8Array(await f.slice(0, 16).arrayBuffer());
    if (pareHeic(cap)) {
      throw new Error("e un HEIC de pe iPhone; trimite-ți poza pe WhatsApp sau alege „Cel mai compatibil” în setările camerei, apoi urc-o ca JPEG");
    }
    if (/\.(heic|heif)$/i.test(f.name)) {
      throw new Error("e un HEIC de pe iPhone; alege un JPEG");
    }
    return null;
  }
  const bitmap = await deseneaza(f, tip);
  const scara = Math.min(1, LATURA_MAXIMA / Math.max(bitmap.width, bitmap.height));
  const latime = Math.max(1, Math.round(bitmap.width * scara));
  const inaltime = Math.max(1, Math.round(bitmap.height * scara));
  const panza = document.createElement("canvas");
  panza.width = latime;
  panza.height = inaltime;
  const ctx = panza.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, latime, inaltime);
  if ("close" in bitmap) bitmap.close();
  // PNG rămâne PNG (poate avea transparență); restul pleacă JPEG.
  let tipNou: "image/png" | "image/jpeg" = tip === "image/png" ? "image/png" : "image/jpeg";
  let blob = await new Promise<Blob | null>((r) => panza.toBlob(r, tipNou, 0.86));
  if (blob && tipNou === "image/png" && blob.size > PNG_MAXIM) {
    // O captură de ecran PNG de 4.000 px rămâne uriașă și micșorată; ca JPEG trece.
    tipNou = "image/jpeg";
    blob = await new Promise<Blob | null>((r) => panza.toBlob(r, tipNou, 0.86));
  }
  if (!blob) throw new Error("browserul n-a putut scrie poza");
  if (blob.size >= f.size) return null;
  const nume = f.name.replace(/\.\w+$/, "") + (tipNou === "image/png" ? ".png" : ".jpg");
  return new File([blob], nume, { type: tipNou, lastModified: Date.now() });
}

export default function MicsoreazaPoza() {
  useEffect(() => {
    /** Pozele scrise de noi: schimbarea pe care o trimitem după înlocuire nu e a omului. */
    const produse = new WeakSet<File>();
    async function laSchimbare(e: Event) {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files?.length) return;
      if (input.dataset.faraMicsorare !== undefined) return;

      const initiale = Array.from(input.files);
      if (initiale.every((f) => produse.has(f))) return;
      const noi: File[] = [];
      let dinainte = 0;
      let dupa = 0;
      let nuAmPutut: string | null = null;
      for (const f of initiale) {
        let mic: File | null = null;
        try {
          mic = await micsoreaza(f);
        } catch (e) {
          // Se spune pe față, nu se tace: altfel omul vede o poză ruptă și nimic.
          nuAmPutut = (e as Error).message || "poza nu se poate citi";
          console.error("[poza] n-am putut micșora", f.name, e);
        }
        if (mic) {
          dinainte += f.size;
          dupa += mic.size;
        }
        noi.push(mic ?? f);
      }
      const notaVeche = input.parentElement?.querySelector<HTMLElement>("[data-nota-poza]") ?? null;
      if (!dinainte && !nuAmPutut) {
        // Poza nouă n-a avut nevoie de nimic: nota de la cea dinainte nu mai e adevărată.
        if (notaVeche) notaVeche.textContent = "";
        return;
      }

      if (dinainte) {
        const dt = new DataTransfer();
        for (const f of noi) {
          dt.items.add(f);
          produse.add(f);
        }
        input.files = dt.files;
        // Cine ascultă câmpul (previzualizarea) află că poza s-a schimbat.
        // Poza mică nu mai trece de prag, deci schimbarea asta nu o ia de la capăt.
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      let nota = notaVeche;
      if (!nota) {
        nota = document.createElement("p");
        nota.dataset.notaPoza = "";
        nota.className = "mt-1 text-nota text-cerneala-slab";
        input.insertAdjacentElement("afterend", nota);
      }
      nota.textContent = dinainte
        ? `Poza a fost micșorată de la ${mb(dinainte)} MB la ${mb(dupa)} MB, ca să urce repede.`
        : `N-am putut micșora poza (${nuAmPutut}). Dacă e peste 6 MB, alege una mai mică.`;
    }
    document.addEventListener("change", laSchimbare, true);
    return () => document.removeEventListener("change", laSchimbare, true);
  }, []);
  return null;
}
