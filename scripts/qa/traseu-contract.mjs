/*
  Drumul întreg al contractului de sponsorizare, ca o firmă și ca Mihaela.

    BAZA=… PAROLA_ADMIN=… node scripts/qa/traseu-contract.mjs

  Firma: deschide formularul cu CUI și sumă (cum vine din calculator),
  completează cine semnează și e-mailul, descarcă PDF-ul. Panoul: firma e la
  Firme, „Contract trimis”, cu omul și adresa; contractul e în registru cu
  număr și sumă; notița spune ce a completat firma. Numărul e tipărit și pe
  PDF și pe Word, iar a doua descărcare nu face alt număr.

  Scris după ce un contract a ieșit de pe site fără e-mail și n-a ajuns în
  panou (octombrie 2026). Atinge ANAF (CUI-ul public al unei firme mari),
  deci cere internet. Scrie o firmă de probă în baza de date: NU se rulează
  pe site-ul public, ar intra în registrul de contracte adevărat.
*/
import { browser } from "./comun.mjs";
import { readFileSync } from "node:fs";
const B = process.env.BAZA ?? "http://localhost:3000";
if (/teona-ariana\.ro/.test(B)) throw new Error("Nu pe site-ul public: ar scrie în registrul de contracte adevărat."); let picate=0; const v=(n,c,x="")=>{ if(!c) picate++; console.log((c?"ok ":"✗  ")+n+(x?" — "+x:"")); };
const b = await browser();
const ip=()=>"10.70."+Math.floor(Math.random()*250)+"."+Math.floor(Math.random()*250);
// 1. FIRMA pe site
const cf = await b.newContext({ acceptDownloads:true, extraHTTPHeaders:{"x-forwarded-for":ip()} }); const p=await cf.newPage();
await p.goto(B+"/directioneaza-20/contract?cui=14399840&valoare=7.500",{waitUntil:"load"}); await p.waitForTimeout(5000);
const den = await p.inputValue('input[name="denumire"]'); v("ANAF completează denumirea din CUI", den.length>3, den);
await p.fill('input[name="reprezentant"]',"Maria Ionescu"); await p.fill('input[name="calitate"]',"Administrator");
await p.fill('input[name="email"]',"traseu-contract@firma-proba.ro"); await p.fill('input[name="telefon"]',"0744 111 222");
v("suma vine din calculator", (await p.inputValue('input[name="valoare"]')).replace(/\D/g,"")==="7500");
const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button",{name:/PDF/}).first().click()]);
const cale = await dl.path(); const pdf = readFileSync(cale);
v("firma descarcă PDF-ul", pdf.slice(0,4).toString()==="%PDF", dl.suggestedFilename());
await p.waitForTimeout(2500);
// 2. MIHAELA în panou (cont de fundraising)
const ca = await b.newContext({ extraHTTPHeaders:{"x-forwarded-for":ip()} }); const a=await ca.newPage();
await a.goto(B+"/admin"); await a.fill('input[name="parola"]', process.env.PAROLA_ADMIN ?? "");
await Promise.all([a.waitForURL(/\/admin(\?|$)/), a.click('button:has-text("Intră")')]); await a.waitForTimeout(800);
await a.goto(B+"/admin/firme?cauta=14399840"); await a.waitForTimeout(1500);
const lista = await a.locator("body").innerText();
v("firma apare la Firme", lista.includes(den), den);
v("cu stadiul „Contract trimis”", /Contract trimis/.test(lista));
v("cu cine semnează și e-mailul", lista.includes("Maria Ionescu") && lista.includes("traseu-contract@firma-proba.ro"));
await a.goto(B+"/admin/contracte"); await a.waitForTimeout(1500);
const reg = await a.locator("body").innerText(); const m = reg.match(new RegExp("(\\d+/\\d{4}) · "+den.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
v("contractul e în registru, cu număr", !!m, m && m[1]);
v("registrul are suma de 7.500 lei", reg.includes("7.500 lei"));
// notița din fișa firmei
await a.goto(B+"/admin/firme?cauta=14399840"); await a.waitForTimeout(1000);
const href = await a.getByRole("link",{name:"Discuții și notițe"}).first().getAttribute("href");
await a.goto(B+href); await a.waitForTimeout(1500);
const fisa = await a.locator("body").innerText();
v("notița spune ce a completat firma", /Și-a generat de pe site contractul/.test(fisa) && fisa.includes("Administrator") && fisa.includes("0744 111 222"));
console.log(picate? "PICATE: "+picate : "TOT DRUMUL OK");
process.exitCode = picate ? 1 : 0;
await b.close();
