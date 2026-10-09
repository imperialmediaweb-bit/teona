"use client";

import { useId, useState } from "react";
import { EMAIL } from "@/date/asociatie";
import Buton from "../Buton";
import Pictograma from "../Pictograma";
import Camp, { claseControl, claseControlGresit } from "../formular/Camp";
import { citesteSuma, laBan, scrieSuma } from "@/lib/suma";

/**
 * Calculatorul fiscal pentru firme (8.4).
 *
 * Caietul: „Firma introduce cifra de afaceri și impozitul pe profit (în lei)
 * și primește suma maximă care poate fi direcționată. Sub calculator,
 * mențiunea obligatorie: «Calculul este orientativ.»”
 *
 * Regula: suma maximă e **cea mai mică** dintre 20% din impozitul pe profit și
 * 0,75% din cifra de afaceri. Arătăm amândouă pragurile, nu doar rezultatul,
 * și spunem care dintre ele a fost limita: o firmă care vede de unde vine
 * cifra o poate verifica cu contabilul ei. Un singur număr scos dintr-o cutie
 * neagră n-ar convinge pe nimeni să semneze un contract.
 *
 * Nu scriem aici nimic despre lege dincolo de regula de mai sus și nu dăm
 * termene de depunere: caietul le lasă „[de confirmat]”.
 */

export default function CalculatorSponsorizare() {
  const id = useId();
  const [cifraText, setCifraText] = useState("");
  const [impozitText, setImpozitText] = useState("");

  const cifra = citesteSuma(cifraText);
  const impozit = citesteSuma(impozitText);

  // Rezultatul există doar când amândouă câmpurile au o sumă bună. Un singur
  // câmp completat nu produce „NaN” și nici o sumă pe jumătate.
  const rezultat =
    cifra.suma !== null && impozit.suma !== null
      ? (() => {
          const dinImpozit = laBan((impozit.suma * 20) / 100);
          const dinCifra = laBan((cifra.suma * 75) / 10_000);
          return {
            dinImpozit,
            dinCifra,
            maxim: Math.min(dinImpozit, dinCifra),
            // Când sunt egale, niciunul n-a „limitat”: le marcăm pe amândouă.
            limitaImpozit: dinImpozit <= dinCifra,
            limitaCifra: dinCifra <= dinImpozit,
          };
        })()
      : null;

  const praguri = rezultat
    ? [
        {
          eticheta: "20% din impozitul pe profit",
          suma: rezultat.dinImpozit,
          limita: rezultat.limitaImpozit,
        },
        {
          eticheta: "0,75% din cifra de afaceri",
          suma: rezultat.dinCifra,
          limita: rezultat.limitaCifra,
        },
      ]
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-stretch">
      {/* Cele două câmpuri, pe hârtie. */}
      <form
        onSubmit={(ev) => ev.preventDefault()}
        noValidate
        aria-labelledby={`${id}-titlu`}
        className="colt-a grid content-start gap-5 border border-hartie-umbra bg-hartie p-6 shadow-[0_24px_50px_-26px_rgba(35,35,35,0.45)] sm:p-8"
      >
        <div>
          <h3 id={`${id}-titlu`} className="text-h4 text-cerneala">
            Cât poate direcționa firma ta?
          </h3>
          <p className="mt-2 text-mic text-cerneala-moale">
            Scrie cele două cifre din bilanțul anului, în lei. Rezultatul apare
            pe loc.
          </p>
        </div>

        <Camp
          id={`${id}-cifra`}
          eticheta="Cifra de afaceri (lei)"
          obligatoriu
          nota="Totalul veniturilor firmei pe anul fiscal."
          eroare={cifra.eroare}
        >
          <input
            id={`${id}-cifra`}
            name="cifra-de-afaceri"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="de exemplu 2.500.000"
            value={cifraText}
            onChange={(ev) => setCifraText(ev.target.value)}
            aria-invalid={Boolean(cifra.eroare)}
            aria-describedby={
              cifra.eroare ? `${id}-cifra-eroare` : `${id}-cifra-nota`
            }
            className={cifra.eroare ? claseControlGresit : claseControl}
          />
        </Camp>

        <Camp
          id={`${id}-impozit`}
          eticheta="Impozitul pe profit (lei)"
          obligatoriu
          nota="Impozitul datorat pe același an."
          eroare={impozit.eroare}
        >
          <input
            id={`${id}-impozit`}
            name="impozit-pe-profit"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="de exemplu 120.000"
            value={impozitText}
            onChange={(ev) => setImpozitText(ev.target.value)}
            aria-invalid={Boolean(impozit.eroare)}
            aria-describedby={
              impozit.eroare ? `${id}-impozit-eroare` : `${id}-impozit-nota`
            }
            className={impozit.eroare ? claseControlGresit : claseControl}
          />
        </Camp>
      </form>

      {/* Rezultatul, pe câmp de culoare: e lucrul pentru care a venit firma. */}
      <div
        aria-live="polite"
        className="granulatie relative flex flex-col overflow-hidden colt-b bg-gradient-to-b from-caramiziu-400 via-caramiziu-500 to-caramiziu-600 p-6 text-hartie shadow-[0_36px_70px_-28px_rgba(247,79,34,0.85)] sm:p-8"
      >
        <span
          aria-hidden="true"
          className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-hartie/20"
        />

        <p className="relative font-titlu text-nota font-bold tracking-wider uppercase opacity-85">
          Suma maximă pe care o poți direcționa
        </p>

        {rezultat ? (
          <>
            <p className="relative mt-3 font-titlu text-[2.4rem] leading-none font-extrabold tracking-tight break-words sm:text-[3rem]">
              {scrieSuma(rezultat.maxim)}
            </p>

            <ul className="relative mt-6 grid gap-2.5">
              {praguri.map((prag) => (
                <li
                  key={prag.eticheta}
                  className={`colt-mic-a flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 ${
                    prag.limita
                      ? "bg-hartie text-cerneala"
                      : "bg-hartie/15 text-hartie"
                  }`}
                >
                  <span className="text-mic font-semibold">
                    {prag.eticheta}
                  </span>
                  <span className="font-titlu text-corp font-bold">
                    {scrieSuma(prag.suma)}
                  </span>
                  {prag.limita && (
                    <span className="basis-full text-nota font-semibold text-caramiziu-700">
                      Acesta e pragul care limitează suma.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="relative mt-3 flex-1 text-amplu text-hartie/90">
            Completează cifra de afaceri și impozitul pe profit, iar suma apare
            aici, împreună cu cele două praguri din care e calculată.
          </p>
        )}

        {/* Mențiunea obligatorie din caiet, sub rezultat, nu în subsolul paginii. */}
        <p className="relative mt-6 flex items-start gap-2.5 text-mic text-hartie/90">
          <Pictograma nume="document" className="mt-0.5 size-5 shrink-0" />
          <span>
            <strong className="font-titlu font-bold text-hartie">
              Calculul este orientativ.
            </strong>{" "}
            Suma finală se stabilește împreună cu contabilitatea firmei.
          </span>
        </p>

        <div className="relative mt-6">
          <Buton
            href={`mailto:${EMAIL.contact}?subject=${encodeURIComponent("Contract de sponsorizare")}`}
            varianta="contur"
            className="border-hartie bg-hartie text-caramiziu-600 hover:border-hartie hover:text-caramiziu-700"
          >
            Vreau contract de sponsorizare
            <Pictograma nume="sageata" className="size-4" />
          </Buton>
        </div>
      </div>
    </div>
  );
}
