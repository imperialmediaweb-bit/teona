"use client";

import { useId, useState } from "react";
import { EMAIL } from "@/date/asociatie";
import Buton from "../Buton";
import Pictograma from "../Pictograma";
import Camp, { claseControl, claseControlGresit } from "../formular/Camp";
import CampCui, { type Firma } from "../formular/CampCui";
import { citesteSuma, laBan, scrieCifre, scrieSuma } from "@/lib/suma";

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
 *
 * **Cele două cifre se completează singure, din CUI.** Firma scrie CUI-ul,
 * iar cifra de afaceri și impozitul vin din ultimul bilanț depus la ANAF.
 * Rămân editabile, și sub ele scrie din ce an sunt: un contabil care vede
 * anul își dă seama singur dacă vrea să pună cifrele anului curent.
 *
 * **Impozitul e o propunere, nu o certitudine.** Bilanțul nu conține
 * „impozit pe profit”; conține profitul brut și pe cel net, iar diferența
 * dintre ele e impozitul plătit. Pentru o firmă pe impozit pe profit asta e
 * chiar cifra căutată, pentru una pe impozit pe venit nu e. De aceea scrie
 * negru pe alb de unde vine cifra, și de aceea mențiunea „Calculul este
 * orientativ” rămâne unde era.
 */

export default function CalculatorSponsorizare() {
  const id = useId();
  const [cuiText, setCuiText] = useState("");
  const [cifraText, setCifraText] = useState("");
  const [impozitText, setImpozitText] = useState("");
  const [dinBilant, setDinBilant] = useState<{
    denumire: string;
    an: number;
    cifra: boolean;
    impozit: boolean;
  } | null>(null);

  /** Completează cele două câmpuri din ultimul bilanț depus. */
  function completeaza(firma: Firma) {
    const bilant = firma.bilant;
    if (!bilant) {
      setDinBilant(null);
      return;
    }
    if (bilant.cifraDeAfaceri !== null) {
      setCifraText(scrieCifre(bilant.cifraDeAfaceri));
    }
    if (bilant.impozitEstimat !== null) {
      setImpozitText(scrieCifre(bilant.impozitEstimat));
    }
    setDinBilant({
      denumire: firma.denumire,
      an: bilant.an,
      cifra: bilant.cifraDeAfaceri !== null,
      impozit: bilant.impozitEstimat !== null,
    });
  }

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
            /*
              Când sunt egale, niciunul nu limitează, deci nu se marchează
              niciunul. Înainte se marcau amândouă, iar panoul scria de două
              ori „pragul ăsta limitează suma” — două praguri egale se văd
              oricum, barele ies la fel de lungi.
            */
            limitaImpozit: dinImpozit < dinCifra,
            limitaCifra: dinCifra < dinImpozit,
          };
        })()
      : null;

  /*
    Cele două praguri, ca bare pe aceeași scară.

    Regula legii e „cea mai mică dintre două sume”, iar două sume scrise una
    sub alta cer de la om să le compare singur. Barele o arată: a cui e mai
    scurtă, aceea limitează. Scara e lungimea celei mari, deci amândouă se
    citesc una față de alta — o singură axă, nu două.

    Care limitează nu se spune doar prin culoare: bara plină are și eticheta
    „asta limitează”, pentru cine nu distinge nuanțele sau citește cu
    cititorul de ecran.
  */
  const scara = rezultat ? Math.max(rezultat.dinImpozit, rezultat.dinCifra) : 0;

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
      ].map((prag) => ({
        ...prag,
        // Sub 1,5% bara n-ar mai fi o bară, ci o linie; dar zero rămâne zero.
        parte:
          scara > 0 && prag.suma > 0
            ? Math.max(1.5, (prag.suma / scara) * 100)
            : 0,
      }))
    : [
        {
          eticheta: "20% din impozitul pe profit",
          suma: null,
          limita: false,
          parte: 0,
        },
        {
          eticheta: "0,75% din cifra de afaceri",
          suma: null,
          limita: false,
          parte: 0,
        },
      ];

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
          {/*
            Titlul secțiunii scrie deja „Cât poate direcționa firma ta”.
            Cardul îl repeta cuvânt cu cuvânt, la trei centimetri dedesubt.
            Aici se spune ce are omul de făcut, nu încă o dată unde a ajuns.
          */}
          <h3 id={`${id}-titlu`} className="text-h4 text-cerneala">
            Cifrele firmei
          </h3>
          <p className="mt-2 text-mic text-cerneala-moale">
            Scrie CUI-ul și luăm cifrele din ultimul bilanț depus la ANAF. Poți
            să le și scrii de mână — rezultatul apare pe loc.
          </p>
        </div>

        <CampCui
          id={`${id}-cui`}
          // Nume propriu: pe aceeași pagină e și formularul de sponsorizare,
          // cu câmpul lui de CUI. Două câmpuri cu același `name` pe o pagină
          // încurcă și completarea automată a browserului, și probele.
          name="cui-calculator"
          eticheta="CUI-ul firmei"
          nota="Opțional. Completează singur cifra de afaceri și impozitul."
          valoare={cuiText}
          onValoare={setCuiText}
          onFirma={completeaza}
        />

        {/*
          Cele două cifre stau una lângă alta: sunt o pereche, se citesc de pe
          același bilanț și se completează deodată din CUI. Una sub alta,
          cardul creștea cu un ecran și lăsa panoul de rezultat gol pe dreapta.
        */}
        <div className="grid gap-5 sm:grid-cols-2">
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
              /*
                Punctele de mii se pun când omul pleacă din câmp, nu pe măsură
                ce scrie: altfel cursorul sare peste separatorul apărut sub
                degete. „2500000" rămâne corect oricum — asta doar îl face de
                citit, ca un zero în plus să se vadă.
              */
              onBlur={() => {
                const scris = citesteSuma(cifraText);
                if (scris.suma !== null) setCifraText(scrieCifre(scris.suma));
              }}
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
              onBlur={() => {
                const scris = citesteSuma(impozitText);
                if (scris.suma !== null) setImpozitText(scrieCifre(scris.suma));
              }}
              aria-invalid={Boolean(impozit.eroare)}
              aria-describedby={
                impozit.eroare ? `${id}-impozit-eroare` : `${id}-impozit-nota`
              }
              className={impozit.eroare ? claseControlGresit : claseControl}
            />
          </Camp>
        </div>

        {/* De unde vin cifrele. Fără asta, două sume apărute singure într-un
            formular sunt doar două sume apărute singure. */}
        {dinBilant && (
          <p className="text-mic text-cerneala-moale">
            Completat pentru <strong>{dinBilant.denumire}</strong>, din bilanțul
            depus la ANAF pe <strong>{dinBilant.an}</strong>.
            {dinBilant.impozit && (
              <>
                {" "}
                Impozitul e diferența dintre profitul brut și cel net din acel
                bilanț — e cifra plătită ca impozit, dar verific-o cu
                contabilitatea.
              </>
            )}
            {!dinBilant.cifra && !dinBilant.impozit && (
              <> Bilanțul nu conține cifrele astea; scrie-le de mână.</>
            )}{" "}
            Poți schimba orice.
          </p>
        )}
      </form>

      {/* Rezultatul, pe câmp de culoare: e lucrul pentru care a venit firma. */}
      <div
        aria-live="polite"
        className="granulatie relative flex flex-col overflow-hidden colt-b bg-gradient-to-b from-caramiziu-700 via-caramiziu-800 to-caramiziu-900 p-6 text-hartie shadow-[0_36px_70px_-28px_rgba(247,79,34,0.85)] sm:p-8"
      >
        <span
          aria-hidden="true"
          className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-hartie/20"
        />

        <p className="relative font-titlu text-nota font-bold tracking-wider uppercase opacity-85">
          Suma maximă pe care o poți direcționa
        </p>

        {/*
          Cifra mare stă pe loc, plină sau goală.

          Până să scrie cineva ceva, panoul era un câmp roșu cât pagina cu un
          paragraf care cerea să completezi câmpurile de alături — un sfert de
          ecran de culoare tare, pentru o propoziție. Acum are aceeași formă de
          la început: cifra, cele două bare, mențiunea. Fără date scrie „—" și
          barele stau goale, deci nimic nu sare pe ecran când apare rezultatul.
        */}
        <p className="relative mt-3 font-titlu text-[2.4rem] leading-none font-extrabold tracking-tight break-words sm:text-[3rem]">
          {rezultat ? scrieSuma(rezultat.maxim) : "—"}
        </p>
        <p className="relative mt-2 text-mic text-hartie/85">
          {rezultat
            ? "Cea mai mică dintre cele două praguri de mai jos."
            : "Scrie cifra de afaceri și impozitul pe profit, în stânga."}
        </p>

        <ul className="relative mt-7 grid gap-5">
          {praguri.map((prag) => (
            <li key={prag.eticheta}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-mic font-semibold text-hartie/90">
                  {prag.eticheta}
                </span>
                <span className="font-titlu text-corp font-bold text-hartie">
                  {prag.suma === null ? "—" : scrieSuma(prag.suma)}
                </span>
              </div>
              {/* Bara e decor pentru cifra de deasupra, nu o informație nouă:
                  cititorul de ecran o sare și citește suma. */}
              <div
                aria-hidden="true"
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-hartie/15"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-cald ${
                    prag.limita ? "bg-hartie" : "bg-hartie/55"
                  }`}
                  style={{ width: `${prag.parte}%` }}
                />
              </div>
              {prag.limita && (
                <p className="mt-2 text-nota font-semibold text-hartie">
                  Pragul ăsta limitează suma.
                </p>
              )}
            </li>
          ))}
        </ul>

        {/* Mențiunea obligatorie din caiet, sub rezultat, nu în subsolul paginii. */}
        <p className="relative mt-auto flex items-start gap-2.5 pt-8 text-mic text-hartie/90">
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
            className="border-hartie bg-hartie text-caramiziu-700 hover:border-hartie hover:text-caramiziu-700"
          >
            Vreau contract de sponsorizare
            <Pictograma nume="sageata" className="size-4" />
          </Buton>
        </div>
      </div>
    </div>
  );
}
