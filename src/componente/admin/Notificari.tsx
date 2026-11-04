"use client";

import { useEffect, useState } from "react";

/**
 * „Primește notificări pe acest telefon”: abonează browserul (sau aplicația
 * panoului instalată) la notificările de donație nouă și transfer anunțat.
 *
 * Pe iPhone merge numai din aplicația instalată pe ecranul principal; în
 * Safari obișnuit browserul nu oferă notificări, iar butonul spune asta în loc
 * să nu facă nimic.
 */
type Stare =
  | "se-verifica"
  | "nesuportat"
  | "iphone-neinstalat"
  | "oprite-de-om"
  | "neabonat"
  | "abonat"
  | "se-lucreaza";

function cheieInOcteti(cheie: string): Uint8Array {
  const pad = "=".repeat((4 - (cheie.length % 4)) % 4);
  const b64 = (cheie + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function trimite(corp: object): Promise<boolean> {
  const r = await fetch("/api/admin/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corp),
  }).catch(() => null);
  return Boolean(r?.ok);
}

export default function Notificari({ cheiePublica }: { cheiePublica: string | null }) {
  const [stare, setStare] = useState<Stare>("se-verifica");
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    (async () => {
      const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const instalat = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setStare(iphone && !instalat ? "iphone-neinstalat" : "nesuportat");
        return;
      }
      if (Notification.permission === "denied") return setStare("oprite-de-om");
      const reg = await navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin" });
      const ab = await reg.pushManager.getSubscription();
      setStare(ab ? "abonat" : "neabonat");
    })().catch(() => setStare("nesuportat"));
  }, []);

  if (!cheiePublica) return null;

  async function porneste() {
    setStare("se-lucreaza");
    setMesaj("");
    try {
      const permis = await Notification.requestPermission();
      if (permis !== "granted") {
        setStare(permis === "denied" ? "oprite-de-om" : "neabonat");
        return;
      }
      const reg = await navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin" });
      // Nu `serviceWorker.ready`: pe o pagină din afara razei nu se rezolvă
      // niciodată, iar butonul rămânea pe „Se pornește…” pentru totdeauna.
      // Se așteaptă chiar înregistrarea asta, cel mult zece secunde.
      await new Promise<void>((r) => {
        if (reg.active) return r();
        const w = reg.installing ?? reg.waiting;
        if (!w) return r();
        const ceas = setTimeout(r, 10_000);
        w.addEventListener("statechange", () => {
          if (w.state === "activated") {
            clearTimeout(ceas);
            r();
          }
        });
      });
      const ab =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: cheieInOcteti(cheiePublica!) as BufferSource,
        }));
      const ok = await trimite({ fac: "aboneaza", abonament: ab.toJSON() });
      if (!ok) throw new Error();
      setStare("abonat");
      await trimite({ fac: "proba" });
      setMesaj("Gata. Ți-am trimis o notificare de probă.");
    } catch {
      setStare("neabonat");
      setMesaj("N-a mers. Încearcă din nou sau din aplicația instalată.");
    }
  }

  async function opreste() {
    setStare("se-lucreaza");
    const reg = await navigator.serviceWorker.getRegistration("/admin");
    const ab = await reg?.pushManager.getSubscription();
    if (ab) {
      await trimite({ fac: "dezaboneaza", abonament: ab.toJSON() });
      await ab.unsubscribe().catch(() => undefined);
    }
    setStare("neabonat");
    setMesaj("Notificările sunt oprite pe acest dispozitiv.");
  }

  const text: Record<Stare, string> = {
    "se-verifica": "",
    nesuportat: "Browserul ăsta nu primește notificări.",
    "iphone-neinstalat":
      "Pe iPhone, notificările merg numai din aplicația panoului: Safari → Distribuie → „Adaugă pe ecranul principal”, apoi deschide-o de acolo.",
    "oprite-de-om":
      "Notificările sunt blocate pentru panou în setările telefonului. Pornește-le de acolo (Setări → Notificări).",
    neabonat: "Află pe telefon de fiecare donație nouă și de fiecare transfer anunțat.",
    abonat: "Primești notificări pe acest dispozitiv: donații noi și transferuri anunțate.",
    "se-lucreaza": "Se pornește…",
  };

  return (
    <div className="rounded-2xl border border-hartie-umbra bg-hartie p-4">
      <p className="font-titlu text-mic font-bold text-cerneala">Notificări pe telefon</p>
      <p className="mt-1 text-nota text-cerneala-moale">{text[stare]}</p>
      {stare === "neabonat" && (
        <button
          type="button"
          onClick={porneste}
          className="mt-3 rounded-full bg-caramiziu-700 px-4 py-2 font-titlu text-mic font-bold text-hartie"
        >
          Primește notificări aici
        </button>
      )}
      {stare === "abonat" && (
        <button
          type="button"
          onClick={opreste}
          className="mt-3 rounded-full border border-hartie-umbra px-4 py-2 font-titlu text-mic font-bold text-cerneala"
        >
          Oprește pe acest dispozitiv
        </button>
      )}
      {mesaj && (
        <p role="status" className="mt-2 text-nota text-cerneala-moale">
          {mesaj}
        </p>
      )}
    </div>
  );
}
