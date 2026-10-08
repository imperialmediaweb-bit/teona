import Image from "next/image";
import { ASOCIATIA } from "@/date/asociatie";

/** Semnul grafic, curat, cu fundal transparent. 512×512, fără franjuri. */
const ARIPA = "/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1.png";

/**
 * Sigla asociației, refăcută.
 *
 * Fișierul folosit până acum (`WhatsApp_Image_…-removebg-preview.png`, 436×161)
 * e o poză de WhatsApp căreia i s-a scos fundalul automat: are franjuri albe pe
 * margini, textul e deja pixelat la mărimea lui naturală și culorile sunt
 * spălate de compresie — am măsurat #D07030 în loc de portocaliul real #F74F22.
 * `continut/brand.md` cerea de la început refacerea vectorială.
 *
 * Aici sigla e compusă din două bucăți:
 *
 *   · **aripa** — semnul grafic curat de 512×512, cu fundal transparent;
 *   · **numele** — text adevărat, în Nunito, culorile reale de brand.
 *
 * Avantajul nu e estetic, e practic: textul rămâne clar la orice mărime și pe
 * orice ecran, cântărește zero octeți în plus, se poate selecta și căuta, iar
 * cititoarele de ecran îl citesc ca nume, nu ca „imagine”.
 */
export default function Sigla({
  className = "",
  /** Doar semnul grafic, fără nume — pentru spații înguste. */
  doarSemnul = false,
}: {
  className?: string;
  doarSemnul?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={ARIPA}
        alt={doarSemnul ? ASOCIATIA.denumire : ""}
        aria-hidden={doarSemnul ? undefined : true}
        width={512}
        height={512}
        priority
        className="h-[2.6em] w-auto shrink-0"
      />

      {!doarSemnul && (
        <span className="font-titlu leading-[1.05] font-extrabold tracking-[-0.02em] whitespace-nowrap">
          <span className="block text-caramiziu-500">Asociația</span>
          <span className="block text-miere-400">Teona Ariana</span>
        </span>
      )}
    </span>
  );
}
