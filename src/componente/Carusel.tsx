"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * O listă de carduri care, sub 768 px, devine un rând derulabil orizontal.
 *
 * Pe ecran lat lista rămâne exact grila pe care o primește în `className`
 * (nu se schimbă nimic pe desktop). Pe telefon cinci carduri unul sub altul
 * făceau din prima pagină 19 ecrane; acum stau pe un rând, fiecare cât 85%
 * din lățime, ca să se vadă că urmează altul, și se opresc pe loc (CSS
 * scroll-snap, fără bibliotecă). Punctele de sub ele spun unde ești și duc
 * la cardul respectiv.
 *
 * Copiii trebuie să fie `<li>`: lista rămâne o listă, și pentru cititoarele
 * de ecran.
 */
export default function Carusel({
  children,
  className = "",
  eticheta,
  ordonata = false,
}: {
  children: ReactNode;
  /** Clasele grilei de pe ecran lat (ex. `md:grid md:grid-cols-3 gap-5`). */
  className?: string;
  /** Pentru punctele de navigare: „Cum poți să ne susții”. */
  eticheta: string;
  ordonata?: boolean;
}) {
  const lista = useRef<HTMLOListElement & HTMLUListElement>(null);
  const cate = Children.count(children);
  const [activ, setActiv] = useState(0);

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const laDerulare = () => {
      const copii = Array.from(el.children) as HTMLElement[];
      const stanga = el.getBoundingClientRect().left;
      let cel = 0;
      let distanta = Infinity;
      copii.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - stanga - 16);
        if (d < distanta) {
          distanta = d;
          cel = i;
        }
      });
      setActiv(cel);
    };
    el.addEventListener("scroll", laDerulare, { passive: true });
    return () => el.removeEventListener("scroll", laDerulare);
  }, []);

  function mergiLa(i: number) {
    const el = lista.current;
    const tinta = el?.children[i] as HTMLElement | undefined;
    if (!el || !tinta) return;
    el.scrollTo({
      left: tinta.offsetLeft - el.offsetLeft - 16,
      behavior: "smooth",
    });
  }

  const Lista = ordonata ? "ol" : "ul";
  return (
    <>
      <Lista
        ref={lista}
        className={`max-md:-mx-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:overflow-x-auto max-md:px-4 max-md:pb-6 max-md:[scrollbar-width:none] max-md:*:w-[85%] max-md:*:shrink-0 max-md:*:snap-start ${className}`}
      >
        {children}
      </Lista>
      {cate > 1 && (
        <div
          className="-mt-2 flex justify-center gap-1 md:hidden"
          role="group"
          aria-label={`${eticheta}: alege cardul`}
        >
          {Array.from({ length: cate }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => mergiLa(i)}
              aria-label={`Cardul ${i + 1} din ${cate}`}
              aria-current={i === activ}
              className="grid size-11 place-items-center"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === activ ? "w-6 bg-caramiziu-700" : "w-2 bg-cerneala/20"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
