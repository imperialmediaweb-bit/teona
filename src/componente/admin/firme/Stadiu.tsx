import { STADII_FIRMA } from "@/lib/crm";

/** Culoarea fiecărui stadiu, aceeași peste tot: un punct și eticheta. */
export const CULOARE_STADIU: Record<string, { pastila: string; punct: string }> = {
  prospect: { pastila: "bg-hartie-umbra/70 text-cerneala-moale", punct: "bg-cerneala-slab" },
  cerere: { pastila: "bg-miere-100 text-cerneala", punct: "bg-miere-500" },
  contactat: { pastila: "bg-sky-50 text-sky-900", punct: "bg-sky-500" },
  a_raspuns: { pastila: "bg-miere-100 text-cerneala", punct: "bg-miere-500" },
  contract_trimis: { pastila: "bg-turcoaz-50 text-turcoaz-900", punct: "bg-turcoaz-400" },
  semnat: { pastila: "bg-turcoaz-100 text-turcoaz-900", punct: "bg-turcoaz-600" },
  incasat: { pastila: "bg-caramiziu-100 text-caramiziu-900", punct: "bg-caramiziu-600" },
  renuntat: { pastila: "bg-hartie-umbra/70 text-cerneala-slab line-through", punct: "bg-cerneala-slab" },
};

export default function Stadiu({ stadiu }: { stadiu: string }) {
  const s = STADII_FIRMA.find((x) => x.id === stadiu);
  const c = CULOARE_STADIU[stadiu] ?? CULOARE_STADIU.prospect;
  return (
    <span data-stadiu className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-titlu text-nota font-bold ${c.pastila}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${c.punct}`} />
      {s?.eticheta ?? stadiu}
    </span>
  );
}

