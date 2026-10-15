"use client";

import { useId, useState } from "react";
import { RUTE } from "@/date/asociatie";
import Link from "next/link";
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
  /*
    Datele firmei, așa cum le-a dat ANAF. Din ele iese contractul, aici, pe
    loc: cine și-a calculat suma n-are de ce să mai treacă printr-o pagină în
    care scrie a doua oară același CUI.
  */
  const [firma, setFirma] = useState<Firma | null>(null);
  const [descarc, setDescarc] = useState<"pdf" | "word" | null>(null);
  const [eroareDescarcare, setEroareDescarcare] = useState("");

  /** Completează cele două câmpuri din ultimul bilanț depus. */
  function completeaza(gasita: Firma) {
    setFirma(gasita);
    const firma = gasita;
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

  /**
   * Scoate contractul completat cu datele firmei și suma calculată.
   *
   * Nu trimite nimic și nu salvează nimic: firma ia documentul, îl semnează
   * cum vrea și ni-l trimite pe e-mail. Câmpurile pe care nu le avem — cine
   * semnează, în ce calitate — rămân punctate, de completat.
   */
  async function descarcaContractul(fel: "pdf" | "word") {
    if (!firma || !rezultat) return;
    setDescarc(fel);
    setEroareDescarcare("");
    try {
      const date = new URLSearchParams({
        fel,
        denumire: firma.denumire,
        cui: String(firma.cui),
        sediu: firma.adresa ?? "",
        regCom: firma.nrRegCom ?? "",
        valoare: scrieCifre(rezultat.maxim),
      });
      const raspuns = await fetch("/api/contract/descarca", {
        method: "POST",
        body: date,
      });
      if (!raspuns.ok) {
        const corp = (await raspuns.json().catch(() => ({}))) as {
          mesaj?: string;
        };
        setEroareDescarcare(corp.mesaj ?? "Nu am putut scrie contractul.");
        return;
      }
      const antet = raspuns.headers.get("content-disposition") ?? "";
      const nume =
        /filename="([^"]+)"/.exec(antet)?.[1] ??
        (fel === "word" ? "Contract.docx" : "Contract.pdf");
      const adresa = URL.createObjectURL(await raspuns.blob());
      const legatura = document.createElement("a");
      legatura.href = adresa;
      legatura.download = nume;
      document.body.append(legatura);
      legatura.click();
      legatura.remove();
      URL.revokeObjectURL(adresa);
    } catch {
      setEroareDescarcare("Nu am putut descărca. Verifică-ți conexiunea.");
    } finally {
      setDescarc(null);
    }
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
        className="granulatie relative flex flex-col overflow-hidden colt-b border-2 border-caramiziu-200 bg-caramiziu-50 p-6 text-cerneala shadow-[0_28px_56px_-30px_rgba(247,79,34,0.45)] sm:p-8"
      >
        <span
          aria-hidden="true"
          className="absolute -right-16 -bottom-20 size-56 rounded-full border-2 border-caramiziu-200"
        />

        <p className="relative font-titlu text-nota font-bold tracking-wider text-caramiziu-700 uppercase">
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
        <p className="relative mt-3 font-titlu text-[2.4rem] leading-none font-extrabold tracking-tight text-caramiziu-800 break-words sm:text-[3rem]">
          {rezultat ? scrieSuma(rezultat.maxim) : "—"}
        </p>
        <p className="relative mt-2 text-mic text-cerneala-moale">
          {rezultat
            ? "Cea mai mică dintre cele două praguri de mai jos."
            : "Scrie cifra de afaceri și impozitul pe profit, în stânga."}
        </p>

        <ul className="relative mt-7 grid gap-5">
          {praguri.map((prag) => (
            <li key={prag.eticheta}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-mic font-semibold text-cerneala-moale">
                  {prag.eticheta}
                </span>
                <span className="font-titlu text-corp font-bold text-cerneala">
                  {prag.suma === null ? "—" : scrieSuma(prag.suma)}
                </span>
              </div>
              {/* Bara e decor pentru cifra de deasupra, nu o informație nouă:
                  cititorul de ecran o sare și citește suma. */}
              <div
                aria-hidden="true"
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-caramiziu-100"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-cald ${
                    prag.limita ? "bg-caramiziu-600" : "bg-caramiziu-300"
                  }`}
                  style={{ width: `${prag.parte}%` }}
                />
              </div>
              {prag.limita && (
                <p className="mt-2 text-nota font-semibold text-caramiziu-700">
                  Pragul ăsta limitează suma.
                </p>
              )}
            </li>
          ))}
        </ul>

        {/* Mențiunea obligatorie din caiet, sub rezultat, nu în subsolul paginii. */}
        <p className="relative mt-auto flex items-start gap-2.5 pt-8 text-mic text-cerneala-moale">
          <Pictograma nume="document" className="mt-0.5 size-5 shrink-0" />
          <span>
            <strong className="font-titlu font-bold text-cerneala">
              Calculul este orientativ.
            </strong>{" "}
            Suma finală se stabilește împreună cu contabilitatea firmei.
          </span>
        </p>

        {/*
          Contractul se ia de aici, pe loc.

          Butonul ducea la un e-mail gol, în care firma trebuia să scrie
          singură ce vrea — după ce tocmai îi calculaserăm suma și îi știam
          CUI-ul. Acum, dacă firma a venit din CUI, documentul se scoate din
          panoul ăsta, cu datele ei și cu suma calculată în el. Cine a bătut
          cifrele de mână n-are denumirea firmei, deci pentru el rămâne
          legătura spre pagina unde o scrie.
        */}
        {firma && rezultat ? (
          <div className="relative mt-6">
            <p className="font-titlu text-mic font-bold text-cerneala">
              Ia contractul, completat cu datele firmei
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => descarcaContractul("word")}
                disabled={descarc !== null}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-caramiziu-700 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-600 disabled:opacity-60"
              >
                {descarc === "word" ? "Se pregătește…" : "Descarcă în Word"}
              </button>
              <button
                type="button"
                onClick={() => descarcaContractul("pdf")}
                disabled={descarc !== null}
                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-caramiziu-300 bg-hartie px-6 py-3 font-titlu font-bold text-caramiziu-800 transition-colors hover:border-caramiziu-500 disabled:opacity-60"
              >
                {descarc === "pdf" ? "Se pregătește…" : "Descarcă în PDF"}
              </button>
            </div>
            <p className="mt-3 text-nota text-cerneala-moale">
              Cine semnează și în ce calitate rămân de completat în document.
              Îl semnezi și ni-l trimiți pe e-mail; îl contrasemnăm și ți-l
              trimitem înapoi.{" "}
              <Link
                href={`${RUTE.directionare20}/contract?cui=${encodeURIComponent(
                  cuiText.trim(),
                )}&valoare=${encodeURIComponent(scrieCifre(rezultat.maxim))}`}
                className="font-titlu font-semibold text-caramiziu-700 underline underline-offset-2"
              >
                Sau completează tot acum
              </Link>
              .
            </p>
            {eroareDescarcare && (
              <p
                role="alert"
                className="mt-3 font-titlu text-mic font-semibold text-caramiziu-800"
              >
                {eroareDescarcare}
              </p>
            )}
          </div>
        ) : (
          <div className="relative mt-6">
            <Buton
              href={`${RUTE.directionare20}/contract${
                rezultat && cuiText.trim()
                  ? `?cui=${encodeURIComponent(cuiText.trim())}&valoare=${encodeURIComponent(
                      scrieCifre(rezultat.maxim),
                    )}`
                  : ""
              }`}
              varianta="principal"
            >
              Ia contractul de sponsorizare
              <Pictograma nume="sageata" className="size-4" />
            </Buton>
          </div>
        )}
      </div>
    </div>
  );
}
