"use client";

import { useEffect } from "react";

/**
 * Ce scrie omul în panou rămâne în fila lui, până la salvare.
 *
 * Scenariul din auditul din 4 noiembrie 2026: o noutate lungă scrisă într-o
 * filă deschisă de ieri; la „Salvează” sesiunea expirase, iar „Înapoi”
 * reîncărca formularul de intrare — textul nu mai era nicăieri. Paginile
 * din panou pleacă cu `no-store`, deci browserul nu le ține în memorie.
 *
 * Fiecare câmp de text din formularele POST ale panoului se scrie în
 * `sessionStorage` la fiecare literă (cheia: calea paginii și numele
 * câmpului). La încărcare, un câmp gol își primește ciorna înapoi. Se șterge
 * când pagina se deschide cu semnul unei salvări reușite (`?stare=`,
 * `?facut=`…) sau după 12 ore. Nimic nu părăsește fila: parolele și codul
 * sunt sărite, iar `sessionStorage` moare odată cu fila.
 */
const PREFIX = "ciorna:";
const VIATA_MS = 12 * 60 * 60 * 1000;
const SEMNE_DE_SALVARE = ["stare", "facut", "gata", "publicat", "salvat", "adaugati", "trimis", "apel", "schimbat"];
const SARITE = /parola|pin|cod|confirmare/i;

function cheia(camp: HTMLInputElement | HTMLTextAreaElement): string | null {
  if (!camp.name || SARITE.test(camp.name)) return null;
  if (camp instanceof HTMLInputElement && camp.type !== "text" && camp.type !== "url" && camp.type !== "email") return null;
  const formular = camp.form;
  if (!formular || formular.method.toLowerCase() !== "post") return null;
  // Un nume care apare în mai multe formulare pe aceeași pagină (notița de
  // pe fiecare rând dintr-o listă) nu se ține: ciorna ar reveni în toate.
  if (document.querySelectorAll(`[name="${CSS.escape(camp.name)}"]`).length !== 1) return null;
  return `${PREFIX}${location.pathname}:${camp.name}`;
}

export default function TineCiorna() {
  useEffect(() => {
    let memorie: Storage;
    try {
      memorie = window.sessionStorage;
      memorie.getItem("x");
    } catch {
      return;
    }
    const parametri = new URLSearchParams(location.search);
    const salvat = SEMNE_DE_SALVARE.some((s) => parametri.has(s));
    const acum = Date.now();
    /*
      Un text nou se scrie la `/admin/scrie/nou` și, salvat, ajunge la
      `/admin/scrie/<id>` — altă cale. Fără pagina de unde a venit salvarea,
      ciorna de la „nou” rămânea, iar următorul text nou se deschidea cu
      titlul și textul celui dinainte.
    */
    let deUnde = "";
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.origin === location.origin) deUnde = r.pathname;
    } catch {}
    for (const k of Object.keys(memorie)) {
      if (salvat && deUnde && k.startsWith(`${PREFIX}${deUnde}:`)) {
        memorie.removeItem(k);
        continue;
      }
      if (!k.startsWith(`${PREFIX}${location.pathname}:`)) continue;
      try {
        const { la } = JSON.parse(memorie.getItem(k) ?? "{}") as { la?: number };
        if (salvat || !la || acum - la > VIATA_MS) memorie.removeItem(k);
      } catch {
        memorie.removeItem(k);
      }
    }
    if (!salvat) {
      for (const camp of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("textarea, input")) {
        const k = cheia(camp);
        if (!k || camp.value) continue;
        try {
          const { text } = JSON.parse(memorie.getItem(k) ?? "{}") as { text?: string };
          if (text) camp.value = text;
        } catch {
          /* o ciornă stricată nu e o ciornă */
        }
      }
    }
    const laScris = (e: Event) => {
      const camp = e.target;
      if (!(camp instanceof HTMLInputElement) && !(camp instanceof HTMLTextAreaElement)) return;
      const k = cheia(camp);
      if (!k) return;
      try {
        if (camp.value) memorie.setItem(k, JSON.stringify({ text: camp.value, la: Date.now() }));
        else memorie.removeItem(k);
      } catch {
        /* memoria plină sau blocată: formularul merge oricum */
      }
    };
    document.addEventListener("input", laScris, true);
    return () => document.removeEventListener("input", laScris, true);
  }, []);
  return null;
}
