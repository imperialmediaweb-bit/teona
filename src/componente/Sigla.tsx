import Image from "next/image";
import { ASOCIATIA } from "@/date/asociatie";

/** Semnul grafic, curat, cu fundal transparent. 512×512, fără franjuri. */
const ARIPA =
  "/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1.png";

/**
 * Sigla asociației: aripa și numele, ca un singur obiect.
 *
 * Fișierul folosit la început (`WhatsApp_Image_…-removebg-preview.png`, 436×161)
 * e o poză de WhatsApp căreia i s-a scos fundalul automat: franjuri albe, text
 * pixelat, culori spălate (#D07030 în loc de #F74F22). De aceea numele e text
 * adevărat, în Nunito: clar la orice mărime, zero octeți în plus, iar
 * cititoarele de ecran îl citesc ca nume, nu ca „imagine”.
 *
 * Toate dimensiunile pornesc de la una singură: mărimea aripii, dată prin
 * `font-size` pe înveliș (`className="text-[56px]"`). Aripa are `1em`, spațiul
 * dintre ea și nume `0.2em`, rândurile numelui 0.27em și 0.4em. Așa
 * proporțiile rămân aceleași în antet, în subsol și pe un ecran de 320 px —
 * ca să se micșoreze sigla, se schimbă un singur număr.
 *
 * Numele nu mai e scris pe două rânduri egale. „Asociația” e mai mic și
 * puțin răsfirat, „Teona Ariana” e gros și strâns: un rând explică, celălalt
 * e numele. Înainte, două rânduri la fel de mari se citeau ca două lucruri
 * puse alături; acum numele are o ierarhie și se ancorează de aripă.
 */
export default function Sigla({
  className = "",
  /** Doar semnul grafic, fără nume — pentru spații înguste. */
  doarSemnul = false,
  /**
   * Pe fundalul închis al subsolului, portocaliul și galbenul de brand se
   * pierd în roșul-brun. Aceleași culori, din aceeași scară, dar o treaptă
   * mai deschise.
   */
  peFundalInchis = false,
}: {
  className?: string;
  doarSemnul?: boolean;
  peFundalInchis?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[0.2em] leading-none ${className}`}
    >
      <Image
        src={ARIPA}
        alt={doarSemnul ? ASOCIATIA.denumire : ""}
        aria-hidden={doarSemnul ? undefined : true}
        width={512}
        height={512}
        // Cel mult 64 px pe ecran, deci ~128 px pe ecrane dense: ajunge o
        // variantă mică, nu fișierul de 512.
        sizes="80px"
        priority
        className="size-[1em] shrink-0"
      />

      {!doarSemnul && (
        <span className="flex flex-col font-titlu whitespace-nowrap">
          <span
            className={`text-[0.27em] leading-[1.15] font-bold tracking-[0.03em] ${
              peFundalInchis ? "text-caramiziu-300" : "text-caramiziu-500"
            }`}
          >
            Asociația
          </span>
          <span
            className={`text-[0.4em] leading-[1.05] font-extrabold tracking-[-0.025em] ${
              peFundalInchis ? "text-miere-300" : "text-miere-400"
            }`}
          >
            Teona Ariana
          </span>
        </span>
      )}
    </span>
  );
}
