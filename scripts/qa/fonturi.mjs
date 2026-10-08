import { browser, BAZA } from "./comun.mjs";
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 1280, height: 300 } });
await ctx.addInitScript(() => localStorage.setItem("teona:acord-cookieuri", JSON.stringify({ necesare: true, statistici: false, marketing: false, laData: new Date().toISOString() })));
const page = await ctx.newPage();
const fonturi = [];
page.on("response", (r) => { if (r.url().includes(".woff2")) fonturi.push(`${r.status()} ${r.url().split("/").pop()}`); });
await page.goto(BAZA + "/casa-teona", { waitUntil: "networkidle" });
const r = await page.evaluate(async () => {
  await document.fonts.ready;
  const incarcate = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`);
  const nav = document.querySelector("header nav");
  const intrari = [...nav.querySelectorAll(":scope > a, :scope > div > button")].map((e) => `${e.innerText.trim()}=${Math.round(e.getBoundingClientRect().width)}`);
  const a = nav.querySelector("a");
  const s = getComputedStyle(a);
  // lățimea aceluiași text cu Nunito vs. fallback
  const c = document.createElement("canvas").getContext("2d");
  c.font = `${s.fontWeight} ${s.fontSize} Nunito`;
  const wN = c.measureText("Sponsori și parteneri").width;
  c.font = `${s.fontWeight} ${s.fontSize} "Nunito Fallback"`;
  const wF = c.measureText("Sponsori și parteneri").width;
  c.font = `${s.fontWeight} ${s.fontSize} sans-serif`;
  const wS = c.measureText("Sponsori și parteneri").width;
  return { nunitoCheck: document.fonts.check(`${s.fontWeight} ${s.fontSize} Nunito`), incarcate: [...new Set(incarcate)], fontSize: s.fontSize, fontWeight: s.fontWeight, intrari, navW: Math.round(nav.getBoundingClientRect().width), latimeText: { nunito: Math.round(wN), fallback: Math.round(wF), sans: Math.round(wS) }, sigla: Math.round(document.querySelector("header a[aria-label]").getBoundingClientRect().width), doneaza: Math.round(document.querySelector('header a[aria-label="Donează"]').getBoundingClientRect().width) };
});
console.log("fonturi cerute:", fonturi.join(", "));
console.log(JSON.stringify(r, null, 1));
await b.close();
