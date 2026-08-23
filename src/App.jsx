import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat } from "@zxing/library";

/* ============================================================
   REGISTRO
   Diario alimentare (5 voci al giorno) + peso settimanale.
   Niente calorie, niente grammi, niente peso obiettivo.
   ============================================================ */

const CSS = `
.rg {
  --bg:#111A2B; --card:#1B2539; --sunk:#22304A; --ink:#EAEDF2; --ink2:#8E9CB2;
  --line:#2A3650; --acc:#D9A441; --acc-soft:#2E2A1E; --mark:#D9877A; --mark-soft:#2E2124;
  --ok:#63BE8A; --on-acc:#141C2B;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
  background:var(--bg); color:var(--ink); font-family:var(--sans); min-height:100%;
  -webkit-font-smoothing:antialiased;
}
.rg *, .rg *::before, .rg *::after { box-sizing:border-box; }
:where(.rg button) { font:inherit; color:inherit; background:none; border:none; cursor:pointer;
  padding:0; margin:0; text-align:left; }
:where(.rg input, .rg textarea) { font:inherit; color:inherit; }
.rg :focus-visible { outline:2px solid var(--acc); outline-offset:2px; border-radius:4px; }
.rg-wrap { max-width:520px; margin:0 auto; padding:0 14px calc(60px + env(safe-area-inset-bottom)); }

.rg-top { position:sticky; top:0; z-index:20; background:var(--bg); padding:calc(14px + env(safe-area-inset-top)) 0 0; }
.rg-eyebrow { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.rg-mark { font-family:var(--mono); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--ink2); }
.rg-tool { font-family:var(--mono); font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--acc); }
.rg-tabs { display:flex; gap:20px; margin-top:10px; border-bottom:1px solid var(--line); }
.rg-tab { padding:8px 0 10px; font-size:15px; color:var(--ink2); position:relative; }
.rg-tab.on { color:var(--ink); }
.rg-tab.on::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--acc); border-radius:2px; }
.rg-save { font-family:var(--mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); }

.rg-card { background:var(--card); border:1px solid var(--line); border-radius:18px; }
.rg-card.pad { padding:17px 20px; }
.rg-card.rg-macro { background:var(--sunk); }
.rg-lab { font-family:var(--mono); font-size:9.5px; letter-spacing:.13em; text-transform:uppercase; color:var(--ink2); }
.rg-lab em { font-style:normal; letter-spacing:.02em; text-transform:none; opacity:.85; }
.rg-week { padding:15px 16px 13px; margin-top:14px; }
.rg-weekhead { width:100%; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.rg-days { display:flex; justify-content:space-between; }
.rg-day { width:40px; text-align:center; }
.rg-dcircle { width:33px; height:33px; border-radius:50%; margin:0 auto; display:grid; place-items:center;
  font-size:13.5px; color:var(--ink2); border:1px solid var(--line); }
.rg-day.pieno .rg-dcircle { background:var(--ok); color:var(--on-acc); border-color:var(--ok); }
.rg-day.sel .rg-dcircle { background:var(--ink); color:var(--bg); border-color:var(--ink); font-weight:500; }
.rg-day.futuro { opacity:.32; }
.rg-bar { height:2px; border-radius:2px; background:var(--line); margin:5px auto 0; width:22px; overflow:hidden; }
.rg-bar i { display:block; height:100%; background:var(--acc); border-radius:2px; }
.rg-kgmini { display:block; font-family:var(--mono); font-size:9px; color:var(--acc); margin-top:3px; height:12px; }
.rg-kgmini.vuoto { color:transparent; }

.rg-daytitle { display:flex; align-items:baseline; justify-content:space-between; margin:20px 4px 10px; }
.rg-daytitle h2 { margin:0; font-size:20px; font-weight:500; letter-spacing:-.01em; }

.rg-slots { display:flex; flex-direction:column; gap:10px; }
.rg-slot { background:var(--card); border:1px solid var(--line); border-radius:18px; overflow:hidden; }
.rg-slot.vuota { background:transparent; border-style:dashed; }
.rg-slothead { width:100%; padding:17px 20px; display:block; }
.rg-slothead.corta { padding:16px 20px; }
.rg-sh1 { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.rg-slotname { font-size:17px; font-weight:500; letter-spacing:-.01em; color:var(--ink); }
.rg-slot.vuota .rg-slotname { color:var(--ink2); }
.rg-hr { display:flex; align-items:center; gap:9px; }
.rg-ora { font-family:var(--mono); font-size:12px; color:var(--ink2); }
.rg-tick { color:var(--ok); font-size:14px; line-height:1; }
.rg-tre { margin-top:12px; display:flex; flex-direction:column; gap:6px; }
.rg-tr { display:flex; gap:10px; align-items:baseline; }
.rg-tr .k { font-family:var(--mono); font-size:9.5px; letter-spacing:.13em; text-transform:uppercase;
  color:var(--ink2); width:76px; flex:none; padding-top:2px; }
.rg-tr .v { font-size:14px; line-height:1.35; }
.rg-tr .v.no { color:var(--ink2); }
.rg-foot1 { margin-top:13px; padding-top:11px; border-top:1px solid var(--line);
  display:flex; align-items:center; justify-content:space-between; gap:10px; }
.rg-meta { font-size:12.5px; color:var(--ink2); }
.rg-voto { font-family:var(--mono); font-size:12px; padding:3px 10px; border-radius:20px;
  background:var(--acc-soft); color:var(--acc); flex:none; }

.rg-ed { border-top:1px solid var(--line); padding:17px 20px 20px; display:flex; flex-direction:column; gap:17px;
  animation:rgin .16s ease-out; }
@keyframes rgin { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:none; } }
@media (prefers-reduced-motion: reduce) { .rg-ed { animation:none; } }
.rg-field { display:flex; flex-direction:column; gap:9px; }
.rg-in, .rg-ta { background:var(--sunk); border:1px solid var(--line); border-radius:12px;
  padding:11px 13px; font-size:16px; width:100%; }
.rg-ta { resize:vertical; min-height:44px; line-height:1.4; }
.rg-in:focus, .rg-ta:focus { outline:none; border-color:var(--acc); }
.rg-in.ora { font-family:var(--mono); width:130px; }

.rg-scanrow { display:flex; gap:8px; }
.rg-scanrow .rg-in { flex:1; }
.rg-scanbtn { flex:none; width:44px; height:44px; border:1px solid var(--line); border-radius:12px;
  background:var(--sunk); font-family:var(--mono); font-size:10px; letter-spacing:.05em; color:var(--ink2);
  display:grid; place-items:center; }
.rg-scanbox { border-radius:14px; overflow:hidden; background:#000; }
.rg-video { width:100%; display:block; max-height:60vh; object-fit:cover; }

.rg-pick { display:inline-flex; align-items:center; gap:9px; align-self:flex-start;
  background:var(--sunk); border:1px solid var(--line); border-radius:22px; padding:9px 16px; font-size:14.5px; }
.rg-pick.on { border-color:var(--acc); color:var(--acc); background:var(--acc-soft); }
.rg-pick .ch { font-family:var(--mono); font-size:11px; color:var(--ink2); }
.rg-pick.on .ch { color:var(--acc); }
.rg-sheetov { position:fixed; inset:0; background:rgba(6,10,18,.72); z-index:60; display:flex;
  align-items:flex-end; justify-content:center; }
@media (min-width:600px){ .rg-sheetov { align-items:center; padding:24px; } }
.rg-sheet { background:var(--card); border:1px solid var(--line); border-radius:22px 22px 0 0; width:100%;
  max-width:520px; max-height:82vh; overflow:auto; padding:6px 0 18px; }
@media (min-width:600px){ .rg-sheet { border-radius:20px; } }
.rg-handle { width:38px; height:4px; border-radius:4px; background:var(--line); margin:8px auto 14px; }
.rg-sheethead { padding:0 22px 12px; }
.rg-srow { width:100%; padding:16px 22px; font-size:16px; display:flex; align-items:center;
  justify-content:space-between; gap:12px; border-top:1px solid var(--line); }
.rg-srow.on { color:var(--acc); }
.rg-srow .tick { font-family:var(--mono); font-size:13px; }

.rg-chips { display:flex; gap:7px; flex-wrap:wrap; }
.rg-chip { padding:8px 15px; border:1px solid var(--line); border-radius:22px; font-size:14px; color:var(--ink2); }
.rg-chip.on { border-color:var(--acc); color:var(--acc); background:var(--acc-soft); }
.rg-scale { display:flex; gap:4px; }
.rg-sc { flex:1; min-width:0; height:38px; border:1px solid var(--line); border-radius:10px; font-family:var(--mono);
  font-size:12.5px; color:var(--ink2); display:grid; place-items:center; }
.rg-sc.on { background:var(--acc); border-color:var(--acc); color:var(--on-acc); }
.rg-anchors { display:flex; justify-content:space-between; font-family:var(--mono); font-size:9.5px; color:var(--ink2); }
.rg-flags { display:flex; gap:9px; }
.rg-fl { flex:1; padding:13px 0; border:1px solid var(--line); border-radius:14px; font-family:var(--mono);
  font-size:12.5px; letter-spacing:.12em; text-align:center; color:var(--ink2); }
.rg-fl.on { border-color:var(--mark); color:var(--mark); background:var(--mark-soft); }
.rg-hint { font-size:12.5px; color:var(--ink2); line-height:1.45; }
.rg-porz { display:flex; gap:20px; flex-wrap:wrap; }
.rg-porzuno { display:flex; align-items:center; gap:10px; }
.rg-porzuno span.n { font-family:var(--mono); font-size:15px; min-width:12px; text-align:center; }
.rg-porzuno span.t { font-size:13.5px; color:var(--ink2); width:54px; }
.rg-step { width:31px; height:31px; border:1px solid var(--line); border-radius:50%; display:grid; place-items:center;
  font-family:var(--mono); font-size:15px; line-height:1; color:var(--ink2); background:var(--sunk); }
.rg-edfoot { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.rg-btn { padding:12px 18px; border-radius:13px; font-size:14px; background:var(--acc); color:var(--on-acc);
  border:1px solid var(--acc); text-align:center; }
.rg-btn[disabled] { opacity:.3; cursor:default; }
.rg-btn.ghost { background:transparent; color:var(--ink2); border-color:var(--line); }
.rg-btn.danger { background:transparent; color:var(--mark); border-color:var(--mark); }
.rg-warn { font-size:12.5px; color:var(--ink2); }

.rg-nav { display:flex; align-items:center; justify-content:space-between; margin:16px 4px 12px; }
.rg-arrow { width:34px; height:34px; display:grid; place-items:center; color:var(--ink2); font-family:var(--mono); }
.rg-arrow[disabled] { opacity:.25; cursor:default; }
.rg-bigkg { font-family:var(--mono); font-size:30px; color:var(--acc); letter-spacing:-.01em; }
.rg-sect { margin-top:18px; }
.rg-secthead { font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
  color:var(--ink2); margin:0 6px 8px; }
.rg-riga { display:flex; align-items:center; gap:10px; padding:12px 20px; border-bottom:1px solid var(--line); }
.rg-riga:last-child { border-bottom:none; }
.rg-riga .nm { flex:1; font-size:14.5px; }
.rg-riga .nm.fuori { color:var(--ink2); }
.rg-dots { display:flex; gap:3px; }
.rg-dot { width:8px; height:8px; border-radius:50%; border:1px solid var(--line); }
.rg-dot.f { background:var(--acc); border-color:var(--acc); }
.rg-dot.x { background:var(--mark); border-color:var(--mark); }
.rg-fq { font-family:var(--mono); font-size:11.5px; color:var(--ink2); width:54px; text-align:right; }
.rg-grow { width:100%; display:flex; align-items:center; gap:10px; padding:13px 20px; border-bottom:1px solid var(--line); }
.rg-grow:last-child { border-bottom:none; }
.rg-gd { font-family:var(--mono); font-size:11.5px; color:var(--ink2); width:64px; flex:none; }
.rg-gd.oggi { color:var(--acc); }
.rg-pips { display:flex; gap:3px; flex:1; }
.rg-pip { width:9px; height:9px; border-radius:3px; border:1px solid var(--line); }
.rg-pip.f { background:var(--ok); border-color:var(--ok); }
.rg-gm { font-family:var(--mono); font-size:11px; color:var(--ink2); }
.rg-ep { font-family:var(--mono); font-size:9.5px; letter-spacing:.1em; color:var(--mark);
  border:1px solid var(--mark); border-radius:20px; padding:2px 8px; }

.rg-form { padding:18px 20px; display:flex; flex-direction:column; gap:15px; }
.rg-due { display:flex; gap:12px; }
.rg-due > * { flex:1; }
.rg-kg { font-family:var(--mono); font-size:18px; }
.rg-chartbox { margin-top:14px; padding:0; overflow:hidden; }
.rg-chartwrap { position:relative; }
.rg-scroll { overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; }
.rg-scroll::-webkit-scrollbar { height:0; }
.rg-yaxis { position:absolute; left:0; top:0; background:var(--card); pointer-events:none; }
.rg-empty { padding:30px 16px; text-align:center; color:var(--ink2); font-size:14px; line-height:1.5; }
.rg-prow { width:100%; display:flex; gap:12px; align-items:baseline; padding:14px 20px; border-bottom:1px solid var(--line); }
.rg-prow:last-child { border-bottom:none; }
.rg-prow.on { background:var(--sunk); }
.rg-pdate { font-family:var(--mono); font-size:11.5px; color:var(--ink2); width:58px; flex:none; }
.rg-pkg { font-family:var(--mono); font-size:14.5px; width:78px; flex:none; }
.rg-pnote { flex:1; font-size:13px; color:var(--ink2); line-height:1.35; }
.rg-delta { font-family:var(--mono); font-size:12px; color:var(--ink2); margin-top:6px; }

.rg-ov { position:fixed; inset:0; background:rgba(6,10,18,.7); z-index:50; display:flex;
  align-items:flex-end; justify-content:center; }
@media (min-width:600px){ .rg-ov { align-items:center; padding:24px; } }
.rg-modal { background:var(--bg); border:1px solid var(--line); width:100%; max-width:600px; max-height:88vh;
  border-radius:20px 20px 0 0; display:flex; flex-direction:column; padding:18px; gap:12px; }
@media (min-width:600px){ .rg-modal { border-radius:18px; } }
.rg-out { flex:1; min-height:200px; background:var(--card); border:1px solid var(--line); border-radius:12px;
  padding:13px; font-family:var(--mono); font-size:11.5px; line-height:1.55; white-space:pre-wrap; overflow:auto; }
.rg-check { display:flex; align-items:center; gap:8px; font-size:13.5px; color:var(--ink2); }
.rg-footlink { display:block; margin:26px auto 0; font-family:var(--mono); font-size:10.5px;\n  letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); text-align:center; }\n.rg-foot { margin-top:14px; font-size:12px; color:var(--ink2); line-height:1.5; text-align:center; }
`;

/* ---------------- schema ---------------- */

const SLOTS = [
  { id: "colazione", label: "Colazione", t: "08:00" },
  { id: "pasto1", label: "Pranzo", t: "13:00" },
  { id: "spomeriggio", label: "Snack pomeriggio", t: "17:00" },
  { id: "pasto2", label: "Cena", t: "20:00" },
  { id: "ssera", label: "Snack sera", t: "22:00" },
];

const CARBO = [
  { id: "pastariso", label: "Pasta o riso" },
  { id: "pane", label: "Pane" },
  { id: "sostituti", label: "Fette, crackers, grissini" },
  { id: "biscotti", label: "Biscotti secchi" },
  { id: "cereali", label: "Cornflakes o avena" },
  { id: "patate", label: "Patate o mais" },
  { id: "pizza", label: "Pizza" },
  { id: "barrettalight", label: "Barretta di cereali light" },
  { id: "altro", label: "Altro" },
  { id: "niente", label: "Niente" },
];

const FONTI = [
  { id: "carne", label: "Carne", min: 4, max: 5 },
  { id: "pesce", label: "Pesce", min: 2, max: 3 },
  { id: "legumi", label: "Legumi", min: 1, max: 2 },
  { id: "formaggio", label: "Formaggio", min: 2, max: 3 },
  { id: "affettati", label: "Affettati", min: 2, max: 3 },
  { id: "uova", label: "Uova", min: 1, max: 2 },
];
const EXTRA = [
  { id: "vegetale", label: "Burger vegetale" },
  { id: "latticini", label: "Latte o yogurt" },
];
const PROT = [...FONTI.map((f) => ({ id: f.id, label: f.label })), ...EXTRA, { id: "niente", label: "Niente" }];

const DOVE = [{ id: "casa", label: "Casa" }, { id: "fuori", label: "Fuori" },
  { id: "lavoro", label: "Lavoro" }, { id: "altro", label: "Altro" }];
const CONCHI = [{ id: "solo", label: "Solo" }, { id: "altri", label: "Con altri" }];
const GG1 = ["L", "M", "M", "G", "V", "S", "D"];
const GG3 = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];



/* ---------------- date ---------------- */

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };
const lunedi = (s) => { const d = fromIso(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const oggiIso = () => iso(new Date());
const ultimoMercoledi = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() - 3 + 7) % 7)); return iso(d); };
const fmtLungo = (s) => fromIso(s).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
const fmtBreve = (s) => fromIso(s).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
const fmtNum = (s) => fromIso(s).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
const kg = (n) => {
  const x = Number(n);
  const centesimi = Math.round(Math.abs(x) * 100) % 10;
  return (centesimi === 0 ? x.toFixed(1) : x.toFixed(2)).replace(".", ",");
};
const oraOra = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
function labelSettimana(lun) {
  const a = fromIso(lun), b = fromIso(addDays(lun, 6));
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} / ${b.getDate()} ${MESI[a.getMonth()]}`;
  return `${a.getDate()} ${MESI[a.getMonth()].slice(0, 3)} / ${b.getDate()} ${MESI[b.getMonth()].slice(0, 3)}`;
}

/* ---------------- storage ---------------- */

const PRE = "registro:";
const store = {
  async get(k) {
    const v = localStorage.getItem(PRE + k);
    if (v === null) throw new Error("assente");
    return { key: k, value: v };
  },
  async set(k, v) { localStorage.setItem(PRE + k, v); return { key: k, value: v }; },
  async del(k) { localStorage.removeItem(PRE + k); },
  async list(p = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const kk = localStorage.key(i);
      if (kk && kk.startsWith(PRE + p)) keys.push(kk.slice(PRE.length));
    }
    return { keys };
  },
};

const vuotaVoce = (t) => ({
  ora: t,
  carbo: { tipo: null, testo: "" },
  prot: { tipo: null, testo: "" },
  vf: { verdura: 0, frutta: 0, testo: "" },
  dove: null, conChi: null, conChiNome: "",
  voto: null, note: "",
});
const vuotoGiorno = () => ({ camminata: null, minuti: null, note: "", bed: false, vai: false, notaEpisodio: "", voci: {} });

function migraVoce(v) {
  if (!v) return v;
  if (v.carbo) { const { bed, vai, notaEpisodio, ...resto } = v; return resto; }
  return {
    ora: v.ora || "12:00",
    carbo: { tipo: v.opzione === "pizza" ? "pizza" : null, testo: v.cosa || "" },
    prot: { tipo: v.fonte && v.fonte !== "nessuna" ? v.fonte : null, testo: "" },
    vf: { verdura: 0, frutta: 0, testo: "" },
    dove: v.dove || null, conChi: v.conChi || null, conChiNome: v.conChiNome || "",
    voto: v.voto ?? null, note: v.note || "",
  };
}

function migraSettimana(s) {
  if (!s || !s.giorni) return { giorni: {} };
  const g = {};
  for (const [d, gg] of Object.entries(s.giorni)) {
    const voci = {};
    let bed = !!gg.bed, vai = !!gg.vai;
    const note = [gg.notaEpisodio].filter(Boolean);
    for (const [k, v] of Object.entries(gg.voci || {})) {
      if (v && (v.bed || v.vai)) {
        bed = bed || !!v.bed; vai = vai || !!v.vai;
        if (v.notaEpisodio) note.push(v.notaEpisodio);
      }
      voci[k] = migraVoce(v);
    }
    g[d] = {
      camminata: gg.camminata ?? null, minuti: gg.minuti ?? null, note: gg.note || "",
      bed, vai, notaEpisodio: note.join(" · "), voci,
    };
  }
  return { giorni: g };
}

const totVF = (giorno) => {
  let v = 0, f = 0;
  for (const x of Object.values(giorno?.voci || {})) { v += x.vf?.verdura || 0; f += x.vf?.frutta || 0; }
  return { v, f };
};
const compilate = (g) => Object.keys(g?.voci || {}).length;
const PASTI_BASE = ["colazione", "pasto1", "pasto2"];
const giornoPieno = (g) => PASTI_BASE.every((id) => g?.voci?.[id]);
const label = (id, lista) => lista.find((x) => x.id === id)?.label || id;

/* ---------------- utilità ---------------- */

function useLarghezza() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setW(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((es) => { for (const e of es) setW(e.contentRect.width); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function Chips({ options, value, onChange }) {
  return (
    <div className="rg-chips">
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id}
          className={"rg-chip" + (value === o.id ? " on" : "")}
          onClick={() => onChange(value === o.id ? null : o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

function Scelta({ titolo, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const scelto = options.find((o) => o.id === value);
  return (
    <>
      <button type="button" className={"rg-pick" + (scelto ? " on" : "")} onClick={() => setOpen(true)}>
        <span>{scelto ? scelto.label : "Scegli"}</span>
        <span className="ch">▾</span>
      </button>
      {open && (
        <div className="rg-sheetov" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="rg-sheet">
            <div className="rg-handle" />
            <div className="rg-sheethead"><span className="rg-lab">{titolo}</span></div>
            {options.map((o) => (
              <button key={o.id} className={"rg-srow" + (value === o.id ? " on" : "")}
                onClick={() => { onChange(value === o.id ? null : o.id); setOpen(false); }}>
                <span>{o.label}</span>
                {value === o.id && <span className="tick">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Passo({ n, onSet, testo }) {
  return (
    <div className="rg-porzuno">
      <span className="t">{testo}</span>
      <button className="rg-step" aria-label={"meno " + testo} onClick={() => onSet(Math.max(0, n - 1))}>-</button>
      <span className="n">{n}</span>
      <button className="rg-step" aria-label={"più " + testo} onClick={() => onSet(Math.min(6, n + 1))}>+</button>
    </div>
  );
}

/* unica chiamata di rete dell'app: traduce un codice a barre nel nome del prodotto via Open Food Facts,
   inviando solo il codice, niente dati personali. Se fallisce o non trova nulla, resta il codice grezzo. */
async function cercaProdotto(codice) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codice}.json?fields=product_name,product_name_it,brands`);
    const j = await r.json();
    if (j.status !== 1 || !j.product) return null;
    const nome = j.product.product_name_it || j.product.product_name || "";
    return [j.product.brands, nome].filter(Boolean).join(" ").trim() || null;
  } catch (e) { return null; }
}

/* ---------------- scanner ---------------- */

function Scanner({ onFound, onClose }) {
  const videoRef = useRef(null);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    let attivo = true, controlli = null;
    const reader = new BrowserMultiFormatReader();
    reader.decodeFromConstraints(
      { video: { facingMode: "environment" } },
      videoRef.current,
      (risultato, _errore, c) => {
        controlli = c;
        if (risultato && attivo) { attivo = false; c.stop(); onFound(risultato.getText(), risultato.getBarcodeFormat()); }
      }
    ).catch(() => setErrore("Non riesco ad accedere alla fotocamera."));
    return () => { attivo = false; if (controlli) controlli.stop(); };
  }, [onFound]);

  return (
    <div className="rg-ov" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rg-modal">
        <div className="rg-eyebrow">
          <span className="rg-mark">Scansiona</span>
          <button className="rg-tool" onClick={onClose}>Chiudi</button>
        </div>
        {errore ? <span className="rg-hint">{errore}</span> : (
          <>
            <div className="rg-scanbox">
              <video ref={videoRef} className="rg-video" playsInline muted />
            </div>
            <span className="rg-hint">Inquadra il codice a barre o il QR del prodotto.</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- editor ---------------- */

function Editor({ slot, b, setB, salva, elimina, esiste, chiudi }) {
  const set = (p) => setB({ ...b, ...p });
  const puo = b.voto != null;
  const [scanCampo, setScanCampo] = useState(null);
  const [cercoProdotto, setCercoProdotto] = useState(false);

  const gestisciScan = async (testo, formato) => {
    const campo = scanCampo;
    setScanCampo(null);
    if (!campo) return;
    let valore = testo;
    if (formato !== BarcodeFormat.QR_CODE) {
      setCercoProdotto(true);
      const nome = await cercaProdotto(testo);
      setCercoProdotto(false);
      if (nome) valore = nome;
    }
    setB((bb) => {
      const attuale = bb[campo].testo;
      return { ...bb, [campo]: { ...bb[campo], testo: attuale ? attuale + " · " + valore : valore } };
    });
  };

  return (
    <div className="rg-ed">
      <div className="rg-field">
        <label className="rg-lab" htmlFor={"o" + slot.id}>Ora</label>
        <input id={"o" + slot.id} className="rg-in ora" type="time" value={b.ora}
          onChange={(e) => set({ ora: e.target.value })} />
      </div>

      <div className="rg-field">
        <span className="rg-lab">Carboidrati</span>
        <Scelta titolo="Carboidrati" options={CARBO} value={b.carbo.tipo}
          onChange={(x) => set({ carbo: { ...b.carbo, tipo: x } })} />
        <div className="rg-scanrow">
          <input className="rg-in" value={b.carbo.testo} placeholder="Quanto: 4 mestoli, 2 michette, 4 fette"
            onChange={(e) => set({ carbo: { ...b.carbo, testo: e.target.value } })} />
          <button type="button" className="rg-scanbtn" aria-label="Scansiona codice a barre o QR per i carboidrati"
            onClick={() => setScanCampo("carbo")}>SCAN</button>
        </div>
      </div>

      <div className="rg-field">
        <span className="rg-lab">Proteine</span>
        <Scelta titolo="Proteine" options={PROT} value={b.prot.tipo}
          onChange={(x) => set({ prot: { ...b.prot, tipo: x } })} />
        <div className="rg-scanrow">
          <input className="rg-in" value={b.prot.testo} placeholder="Cosa e quanto"
            onChange={(e) => set({ prot: { ...b.prot, testo: e.target.value } })} />
          <button type="button" className="rg-scanbtn" aria-label="Scansiona codice a barre o QR per le proteine"
            onClick={() => setScanCampo("prot")}>SCAN</button>
        </div>
      </div>

      {scanCampo && <Scanner onFound={gestisciScan} onClose={() => setScanCampo(null)} />}
      {cercoProdotto && <span className="rg-hint">Cerco il prodotto…</span>}

      <div className="rg-field">
        <span className="rg-lab">Verdura e frutta <em>(porzioni)</em></span>
        <div className="rg-porz">
          <Passo testo="Verdura" n={b.vf.verdura} onSet={(n) => set({ vf: { ...b.vf, verdura: n } })} />
          <Passo testo="Frutta" n={b.vf.frutta} onSet={(n) => set({ vf: { ...b.vf, frutta: n } })} />
        </div>
        <input className="rg-in" value={b.vf.testo} placeholder="Quale"
          onChange={(e) => set({ vf: { ...b.vf, testo: e.target.value } })} />
      </div>

      <div className="rg-field">
        <span className="rg-lab">Dove</span>
        <Chips options={DOVE} value={b.dove} onChange={(x) => set({ dove: x })} />
      </div>

      <div className="rg-field">
        <span className="rg-lab">Con chi</span>
        <Chips options={CONCHI} value={b.conChi} onChange={(x) => set({ conChi: x })} />
        {b.conChi === "altri" && (
          <input className="rg-in" value={b.conChiNome} placeholder="Chi (facoltativo)"
            onChange={(e) => set({ conChiNome: e.target.value })} />
        )}
      </div>

      <div className="rg-field">
        <span className="rg-lab">Come stavo <em>(serve per salvare)</em></span>
        <div className="rg-scale">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button key={n} type="button" aria-pressed={b.voto === n}
              className={"rg-sc" + (b.voto === n ? " on" : "")} onClick={() => set({ voto: n })}>{n}</button>
          ))}
        </div>
        <div className="rg-anchors"><span>1 peggio</span><span>10 meglio</span></div>
      </div>

      <div className="rg-field">
        <label className="rg-lab" htmlFor={"n" + slot.id}>Nota <em>(facoltativa)</em></label>
        <textarea id={"n" + slot.id} className="rg-ta" rows={2} value={b.note}
          onChange={(e) => set({ note: e.target.value })} />
      </div>

      <div className="rg-edfoot">
        <span className="rg-warn">{puo ? "" : "Manca il voto."}</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {esiste && <button className="rg-btn danger" onClick={elimina}>Elimina</button>}
          <button className="rg-btn ghost" onClick={chiudi}>Chiudi</button>
          <button className="rg-btn" disabled={!puo} onClick={salva}>Salva</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- grafico ---------------- */

function Grafico({ pesate, sel, onSel }) {
  const [ref, w] = useLarghezza();
  const scrollRef = useRef(null);
  const pts = useMemo(() => [...pesate].sort((a, b) => a.data.localeCompare(b.data)), [pesate]);
  const n = pts.length;
  const W = Math.max(260, w || 320);

  /* all'apertura si posiziona sull'ultima pesata */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [n, W]);

  if (!n) {
    return (
      <div ref={ref} className="rg-card rg-chartbox">
        <div className="rg-empty">Il grafico compare qui<br />dalla prima pesata.</div>
      </div>
    );
  }

  const H = W < 420 ? 240 : 270;
  const GUT = 42, PT = 22, PB = 30, ML = 24, MR = 24;

  const t0 = fromIso(pts[0].data).getTime();
  const t1 = fromIso(pts[n - 1].data).getTime();
  const giorni = (t1 - t0) / 864e5;
  const visW = Math.max(140, W - GUT);
  const pxDie = visW / 30;                                  /* finestra: un mese */
  const plotW = Math.max(visW, ML + giorni * pxDie + MR);
  const X = (t) => ML + ((t - t0) / 864e5) * pxDie;

  const ys = pts.map((p) => p.peso);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (y1 - y0 < 6) { const c = (y0 + y1) / 2; y0 = c - 3; y1 = c + 3; }
  else { const m = (y1 - y0) * 0.18; y0 -= m; y1 += m; }
  const passo = [0.5, 1, 2, 5, 10].find((s) => (y1 - y0) / s <= 6) || 10;
  y0 = Math.floor(y0 / passo) * passo; y1 = Math.ceil(y1 / passo) * passo;
  const Y = (v) => PT + (1 - (v - y0) / (y1 - y0)) * (H - PT - PB);

  const righe = [];
  for (let v = y0; v <= y1 + 1e-9; v += passo) righe.push(Number(v.toFixed(2)));
  const fmtRiga = (v) => v.toFixed(passo < 1 ? 1 : 0).replace(".", ",");

  /* inizi di mese, per orientarsi mentre si scorre */
  const mesi = [];
  {
    const d = fromIso(pts[0].data); d.setDate(1);
    while (d.getTime() <= t1) {
      if (d.getTime() >= t0) mesi.push({ t: d.getTime(), nome: MESI[d.getMonth()].slice(0, 3) });
      d.setMonth(d.getMonth() + 1);
    }
  }

  /* etichette sotto i punti, saltate quando si accavallerebbero */
  let ultima = -999;
  const etichetta = pts.map((p) => {
    const x = X(fromIso(p.data).getTime());
    const ok = x - ultima > 46;
    if (ok) ultima = x;
    return ok;
  });

  return (
    <div ref={ref} className="rg-card rg-chartbox">
      <div className="rg-chartwrap">
        <div className="rg-scroll" ref={scrollRef} style={{ paddingLeft: GUT }}>
          <svg width={plotW} height={H} role="img"
            aria-label="Andamento del peso, una pesata a settimana, scorrevole">
            {righe.map((v) => (
              <line key={v} x1={0} x2={plotW} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeWidth="1" />
            ))}
            {mesi.map((m) => (
              <g key={m.t}>
                <line x1={X(m.t)} x2={X(m.t)} y1={PT - 10} y2={H - PB} stroke="var(--line)" strokeWidth="1" />
                <text x={X(m.t) + 5} y={PT - 11} fontSize="9" fontFamily="var(--mono)" fill="var(--ink2)">{m.nome}</text>
              </g>
            ))}
            {pts.slice(1).map((b, i) => (
              <line key={"l" + b.data}
                x1={X(fromIso(pts[i].data).getTime())} y1={Y(pts[i].peso)}
                x2={X(fromIso(b.data).getTime())} y2={Y(b.peso)}
                stroke="var(--acc)" strokeWidth="1.6" strokeOpacity=".55" strokeLinecap="round" />
            ))}
            {pts.map((p, i) => {
              const cx = X(fromIso(p.data).getTime());
              const on = sel === p.data;
              return (
                <g key={p.data}>
                  {etichetta[i] && (
                    <text x={cx} y={H - PB + 18} textAnchor="middle" fontSize="9.5"
                      fontFamily="var(--mono)" fill="var(--ink2)">{fmtBreve(p.data)}</text>
                  )}
                  {on && <circle cx={cx} cy={Y(p.peso)} r="10" fill="none" stroke="var(--acc)" strokeWidth="1" opacity=".6" />}
                  <circle cx={cx} cy={Y(p.peso)} r={on ? 5.5 : 4.5} fill="var(--acc)" stroke="var(--card)" strokeWidth="1.5" />
                  <circle cx={cx} cy={Y(p.peso)} r="16" fill="transparent" style={{ cursor: "pointer" }}
                    onClick={() => onSel(on ? null : p.data)} />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="rg-yaxis" style={{ width: GUT, height: H }}>
          <svg width={GUT} height={H}>
            {righe.map((v) => (
              <text key={v} x={GUT - 8} y={Y(v) + 3.5} textAnchor="end" fontSize="10"
                fontFamily="var(--mono)" fill="var(--ink2)">{fmtRiga(v)}</text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */

export default function Registro() {
  const [tab, setTab] = useState("diario");
  const [vista, setVista] = useState("giorno");
  const [giorno, setGiorno] = useState(oggiIso());
  const [settimane, setSettimane] = useState({});
  const [pesate, setPesate] = useState([]);
  const [pronto, setPronto] = useState(false);
  const [aperta, setAperta] = useState(null);
  const [bozze, setBozze] = useState({});
  const [salvaMsg, setSalvaMsg] = useState("");
  const [selPesata, setSelPesata] = useState(null);
  const [espOpen, setEspOpen] = useState(false);
  const [datiOpen, setDatiOpen] = useState(false);
  const [datiTesto, setDatiTesto] = useState("");
  const [datiMsg, setDatiMsg] = useState("");

  const sRef = useRef({});
  const pRef = useRef([]);
  const timers = useRef({});
  const lun = lunedi(giorno);
  const oggi = oggiIso();

  useEffect(() => { sRef.current = settimane; }, [settimane]);
  useEffect(() => { pRef.current = pesate; }, [pesate]);

  const segnala = (s) => { setSalvaMsg(s); if (s) setTimeout(() => setSalvaMsg(""), 1400); };

  const scrivi = useCallback(async (k, v) => {
    setSalvaMsg("salvo");
    try { await store.set(k, JSON.stringify(v)); segnala("salvato"); }
    catch (e) { setSalvaMsg("non salvato"); console.error(e); }
  }, []);

  const rimanda = (k, fn, ms = 450) => { clearTimeout(timers.current[k]); timers.current[k] = setTimeout(fn, ms); };

  const caricaSettimana = useCallback(async (wk) => {
    if (sRef.current[wk]) return;
    let d = { giorni: {} };
    try { const r = await store.get("settimana:" + wk); d = migraSettimana(JSON.parse(r.value)); } catch (e) { /* nuova */ }
    sRef.current = { ...sRef.current, [wk]: d };
    setSettimane(sRef.current);
  }, []);

  useEffect(() => {
    (async () => {
      let lista = [];
      try { const r = await store.get("pesate"); const p = JSON.parse(r.value); if (Array.isArray(p)) lista = p; }
      catch (e) { /* niente */ }

      pRef.current = lista; setPesate(lista);
      await caricaSettimana(lunedi(oggiIso()));
      setPronto(true);
    })();
  }, [caricaSettimana]);

  useEffect(() => { if (pronto) caricaSettimana(lun); }, [lun, pronto, caricaSettimana]);

  const sett = settimane[lun] || { giorni: {} };
  const dati = sett.giorni?.[giorno] || vuotoGiorno();

  const aggiorna = (dIso, fn) => {
    const wk = lunedi(dIso);
    const s = sRef.current[wk] || { giorni: {} };
    const g = s.giorni?.[dIso] || vuotoGiorno();
    const next = { ...s, giorni: { ...s.giorni, [dIso]: fn(g) } };
    sRef.current = { ...sRef.current, [wk]: next };
    setSettimane(sRef.current);
    rimanda("w" + wk, () => scrivi("settimana:" + wk, next));
  };

  const apri = (dIso, slotId) => {
    if (dIso > oggi) return;
    if (dIso !== giorno) setGiorno(dIso);
    const k = dIso + "|" + slotId;
    if (aperta === k) { setAperta(null); return; }
    if (!bozze[k]) {
      const es = sRef.current[lunedi(dIso)]?.giorni?.[dIso]?.voci?.[slotId];
      const slot = SLOTS.find((s) => s.id === slotId);
      setBozze((b) => ({ ...b, [k]: es ? JSON.parse(JSON.stringify(es)) : vuotaVoce(dIso === oggi ? oraOra() : slot.t) }));
    }
    setAperta(k);
  };

  const salvaVoce = (dIso, slotId) => {
    const k = dIso + "|" + slotId, v = bozze[k];
    if (!v || v.voto == null) return;
    aggiorna(dIso, (g) => ({ ...g, voci: { ...g.voci, [slotId]: v } }));
    setAperta(null);
    setBozze((b) => { const n = { ...b }; delete n[k]; return n; });
  };

  const eliminaVoce = (dIso, slotId) => {
    aggiorna(dIso, (g) => { const v = { ...g.voci }; delete v[slotId]; return { ...g, voci: v }; });
    setAperta(null);
    setBozze((b) => { const n = { ...b }; delete n[dIso + "|" + slotId]; return n; });
  };

  /* --- pesate --- */
  const [pData, setPData] = useState(ultimoMercoledi());
  const [pPeso, setPPeso] = useState("");
  const [pNota, setPNota] = useState("");

  const salvaPesata = () => {
    const n = parseFloat(String(pPeso).replace(",", "."));
    if (!isFinite(n) || n < 30 || n > 300) return;
    const nuova = { data: pData, peso: Math.round(n * 100) / 100, note: pNota.trim() };
    const lista = [...pRef.current.filter((p) => p.data !== pData), nuova].sort((a, b) => a.data.localeCompare(b.data));
    pRef.current = lista; setPesate(lista); scrivi("pesate", lista);
    setPPeso(""); setPNota(""); setSelPesata(nuova.data);
    const dopo = addDays(pData, 7);
    if (dopo <= oggi) setPData(dopo);
  };

  const eliminaPesata = (d) => {
    const lista = pRef.current.filter((p) => p.data !== d);
    pRef.current = lista; setPesate(lista); scrivi("pesate", lista); setSelPesata(null);
  };

  /* --- conteggi --- */
  const conteggi = useMemo(() => {
    const c = {}; FONTI.forEach((f) => (c[f.id] = 0));
    const e = {}; EXTRA.forEach((f) => (e[f.id] = 0));
    let pizza = 0, verdura = 0, frutta = 0, camminate = 0, minuti = 0, completi = 0;
    for (let i = 0; i < 7; i++) {
      const d = sett.giorni?.[addDays(lun, i)];
      if (!d) continue;
      if (d.camminata === true) { camminate++; minuti += d.minuti || 0; }
      if (compilate(d) === SLOTS.length) completi++;
      for (const v of Object.values(d.voci || {})) {
        const t = v.prot?.tipo;
        if (t && c[t] !== undefined) c[t]++;
        if (t && e[t] !== undefined) e[t]++;
        if (v.carbo?.tipo === "pizza") pizza++;
        verdura += v.vf?.verdura || 0; frutta += v.vf?.frutta || 0;
      }
    }
    return { c, e, pizza, verdura, frutta, camminate, minuti, completi };
  }, [sett, lun]);

  const pesataSett = useMemo(
    () => pesate.find((p) => p.data >= lun && p.data <= addDays(lun, 6)) || null, [pesate, lun]);

  /* --- esporta --- */
  const [espTesto, setEspTesto] = useState("");
  const [espFlag, setEspFlag] = useState(true);
  const [espTutto, setEspTutto] = useState(false);
  const [espCarico, setEspCarico] = useState(false);

  const rigaVoce = (slot, v) => {
    let t = `  ${v.ora}  ${slot.label}\n`;
    t += `     carboidrati: ${[v.carbo?.tipo && label(v.carbo.tipo, CARBO), v.carbo?.testo].filter(Boolean).join(", ") || "niente"}\n`;
    t += `     proteine: ${[v.prot?.tipo && label(v.prot.tipo, PROT), v.prot?.testo].filter(Boolean).join(", ") || "niente"}\n`;
    const vf = [];
    if (v.vf?.verdura) vf.push(`verdura ${v.vf.verdura}`);
    if (v.vf?.frutta) vf.push(`frutta ${v.vf.frutta}`);
    if (v.vf?.testo) vf.push(v.vf.testo);
    t += `     verdura e frutta: ${vf.join(", ") || "niente"}\n`;
    const m = [];
    if (v.dove) m.push(v.dove);
    if (v.conChi) m.push(v.conChi === "solo" ? "solo" : "con altri" + (v.conChiNome ? " (" + v.conChiNome + ")" : ""));
    m.push(v.voto + "/10");
    t += `     ${m.join(" · ")}\n`;
    if (v.note) t += `     nota: ${v.note}\n`;
    return t;
  };

  const testoSettimana = (L, dati_, flags) => {
    let t = `SETTIMANA ${fmtNum(L)} / ${fmtNum(addDays(L, 6))}\n`;
    const c = {}; FONTI.forEach((f) => (c[f.id] = 0));
    const e = {}; EXTRA.forEach((f) => (e[f.id] = 0));
    let pizza = 0;
    for (let i = 0; i < 7; i++) {
      const d = dati_.giorni?.[addDays(L, i)]; if (!d) continue;
      for (const v of Object.values(d.voci || {})) {
        const tp = v.prot?.tipo;
        if (tp && c[tp] !== undefined) c[tp]++;
        if (tp && e[tp] !== undefined) e[tp]++;
        if (v.carbo?.tipo === "pizza") pizza++;
      }
    }
    t += "Fonti proteiche: " + FONTI.map((f) => `${f.label.toLowerCase()} ${c[f.id]} (${f.min}-${f.max})`).join(" · ")
      + ` · pizza ${pizza} (max 1)\n`;
    t += "Fuori dalle frequenze dello schema: "
      + EXTRA.map((f) => `${f.label.toLowerCase()} ${e[f.id]}`).join(" · ") + "\n";
    const pw = pRef.current.find((p) => p.data >= L && p.data <= addDays(L, 6));
    t += pw ? `Peso: ${kg(pw.peso)} kg il ${fmtNum(pw.data)}${pw.note ? " - " + pw.note : ""}\n` : "Peso: non registrato\n";
    for (let i = 0; i < 7; i++) {
      const dI = addDays(L, i), d = dati_.giorni?.[dI];
      if (!d) continue;
      const voci = SLOTS.filter((s) => d.voci?.[s.id]);
      if (!voci.length && !d.note && d.camminata == null && !d.bed && !d.vai) continue;
      const tot = totVF(d);
      const m = [];
      if (d.camminata === true) m.push(`camminata sì${d.minuti ? " " + d.minuti + " min" : ""}`);
      if (d.camminata === false) m.push("camminata no");
      m.push(`verdura ${tot.v}`, `frutta ${tot.f}`);
      t += `\n${GG3[i]} ${fmtNum(dI)}\n  ${m.join(" · ")}\n`;
      voci.forEach((s) => { t += rigaVoce(s, d.voci[s.id]); });
      if (d.note) t += `  Note del giorno: ${d.note}\n`;
      if (flags && (d.bed || d.vai)) {
        t += `  Annotazione: ${[d.bed && "BED", d.vai && "VAI"].filter(Boolean).join(" + ")}`;
        t += d.notaEpisodio ? ` - ${d.notaEpisodio}\n` : "\n";
      }
    }
    return t;
  };

  const genera = async (tutto, flags) => {
    setEspCarico(true);
    let testa = `REGISTRO - diario alimentare e peso\nGenerato il ${fmtNum(oggiIso())}\n`;
    let corpo = "";
    if (!tutto) {
      corpo = testoSettimana(lun, sRef.current[lun] || { giorni: {} }, flags);
    } else {
      let chiavi = [];
      try { const r = await store.list("settimana:"); chiavi = (r?.keys || []).slice(); } catch (e) { /* niente */ }
      const luns = chiavi.map((k) => k.replace("settimana:", "")).sort();
      if (!luns.length) luns.push(lun);
      if (pRef.current.length) {
        corpo += "PESO (bilancia di casa)\n";
        pRef.current.forEach((p) => { corpo += `  ${fmtNum(p.data)}   ${kg(p.peso)} kg${p.note ? "   " + p.note : ""}\n`; });
        corpo += "\n";
      }
      for (const L of luns) {
        let d = sRef.current[L];
        if (!d) { try { const r = await store.get("settimana:" + L); d = migraSettimana(JSON.parse(r.value)); } catch (e) { d = { giorni: {} }; } }
        corpo += testoSettimana(L, d, flags) + "\n";
      }
    }
    setEspTesto(testa + "\n" + corpo);
    setEspCarico(false);
  };

  /* --- importazione, backup, ripristino --- */

  const leggiRighe = (t) => {
    const out = [];
    for (const riga of t.split("\n")) {
      const r = riga.trim();
      if (!r) continue;
      const m = r.match(/^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})[\s,;]+([\d.,]+)\s*(.*)$/);
      if (!m) continue;
      let d = m[1];
      if (!/^\d{4}-/.test(d)) {
        const [gg, mm, aa] = d.split(/[\/.-]/).map(Number);
        d = `${aa < 100 ? aa + 2000 : aa}-${pad(mm)}-${pad(gg)}`;
      } else {
        const [aa, mm, gg] = d.split("-").map(Number);
        d = `${aa}-${pad(mm)}-${pad(gg)}`;
      }
      const peso = parseFloat(m[2].replace(",", "."));
      if (!isFinite(peso) || peso < 30 || peso > 300) continue;
      out.push({ data: d, peso: Math.round(peso * 100) / 100, note: (m[3] || "").trim() });
    }
    return out;
  };

  const importaPesate = () => {
    const nuove = leggiRighe(datiTesto);
    if (!nuove.length) { setDatiMsg("Non ho riconosciuto nessuna riga."); return; }
    const date = new Set(nuove.map((p) => p.data));
    const lista = [...pRef.current.filter((p) => !date.has(p.data)), ...nuove]
      .sort((a, b) => a.data.localeCompare(b.data));
    pRef.current = lista; setPesate(lista); scrivi("pesate", lista);
    setDatiTesto(""); setDatiMsg(`${nuove.length} pesate importate.`);
  };

  const faiBackup = async () => {
    const tutto = {};
    const r = await store.list("");
    for (const k of r.keys) { try { tutto[k] = (await store.get(k)).value; } catch (e) { /* salta */ } }
    setDatiTesto(JSON.stringify(tutto));
    setDatiMsg("Backup pronto qui sotto. Copialo e mettilo al sicuro.");
    try { await navigator.clipboard.writeText(JSON.stringify(tutto)); setDatiMsg("Backup copiato negli appunti."); }
    catch (e) { /* resta da copiare a mano */ }
  };

  const ripristina = async () => {
    let dati;
    try { dati = JSON.parse(datiTesto); } catch (e) { setDatiMsg("Questo non è un backup valido."); return; }
    if (!dati || typeof dati !== "object") { setDatiMsg("Questo non è un backup valido."); return; }
    for (const [k, v] of Object.entries(dati)) { try { await store.set(k, String(v)); } catch (e) { /* salta */ } }
    setDatiMsg("Ripristinato. Riapro.");
    setTimeout(() => window.location.reload(), 700);
  };

  const copia = async () => {
    try { await navigator.clipboard.writeText(espTesto); segnala("copiato"); }
    catch (e) { segnala("copia a mano"); }
  };

  /* ---------------- render ---------------- */

  if (!pronto) return <div className="rg"><style>{CSS}</style><div className="rg-wrap"><div className="rg-empty" style={{ marginTop: 60 }}>Apro il registro.</div></div></div>;

  const giorniSett = Array.from({ length: 7 }, (_, i) => addDays(lun, i));

  return (
    <div className="rg">
      <style>{CSS}</style>
      <div className="rg-wrap">

        <div className="rg-top">
          <div className="rg-eyebrow" style={{ justifyContent: "flex-end" }}>
            <div style={{ display: "flex", gap: 14 }}>
              {salvaMsg && <span className="rg-save">{salvaMsg}</span>}
              <button className="rg-tool" onClick={() => { setEspOpen(true); setEspTutto(false); genera(false, espFlag); }}>Esporta</button>
            </div>
          </div>
          <div className="rg-tabs">
            <button className={"rg-tab" + (tab === "diario" ? " on" : "")}
              onClick={() => { setTab("diario"); setVista("giorno"); }}>Diario</button>
            <button className={"rg-tab" + (tab === "peso" ? " on" : "")} onClick={() => setTab("peso")}>Peso</button>
          </div>
        </div>

        {tab === "diario" && vista === "giorno" && (
          <>
            <div className="rg-card rg-week">
              <button className="rg-weekhead" onClick={() => setVista("riepilogo")}>
                <span className="rg-lab">{labelSettimana(lun)}</span>
                <span className="rg-lab" style={{ color: "var(--acc)" }}>Riepilogo ›</span>
              </button>
              <div className="rg-days">
                {giorniSett.map((d, i) => {
                  const g = sett.giorni?.[d];
                  const n = compilate(g);
                  const pieno = giornoPieno(g);
                  const pw = pesate.find((p) => p.data === d);
                  const futuro = d > oggi;
                  return (
                    <button key={d} className={"rg-day" + (d === giorno ? " sel" : "") + (futuro ? " futuro" : "") + (pieno ? " pieno" : "")}
                      disabled={futuro} onClick={() => setGiorno(d)} aria-label={fmtLungo(d)}>
                      <span className="rg-dcircle">{GG1[i]}</span>
                      <span className="rg-bar"><i style={{ width: (pieno ? 100 : (n / 5) * 100) + "%" }} /></span>
                      <span className={"rg-kgmini" + (pw ? "" : " vuoto")}>{pw ? kg(pw.peso) : "."}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rg-daytitle">
              <h2>{fmtLungo(giorno)}</h2>
              {giorno === oggi ? <span className="rg-lab" style={{ color: "var(--acc)" }}>oggi</span>
                : <button className="rg-tool" onClick={() => setGiorno(oggi)}>torna a oggi</button>}
            </div>

            <div className="rg-card pad" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span className="rg-lab">Camminata</span>
                <div className="rg-chips">
                  <button className={"rg-chip" + (dati.camminata === true ? " on" : "")}
                    onClick={() => aggiorna(giorno, (g) => ({ ...g, camminata: g.camminata === true ? null : true }))}>Sì</button>
                  <button className={"rg-chip" + (dati.camminata === false ? " on" : "")}
                    onClick={() => aggiorna(giorno, (g) => ({ ...g, camminata: g.camminata === false ? null : false, minuti: null }))}>No</button>
                </div>
              </div>
              {dati.camminata === true && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 9 }}>
                  <input className="rg-in ora" type="number" inputMode="numeric" min="0" step="1"
                    placeholder="minuti" value={dati.minuti ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      aggiorna(giorno, (g) => ({ ...g, minuti: v === "" ? null : Math.max(0, parseInt(v, 10) || 0) }));
                    }} style={{ width: 90 }} />
                  <span className="rg-lab">min</span>
                </div>
              )}
            </div>

            <div className="rg-card pad rg-macro" style={{ marginTop: 12 }}>
            <div className="rg-slots">
              {SLOTS.map((s) => {
                const v = dati.voci?.[s.id];
                const k = giorno + "|" + s.id;
                const ap = aperta === k;
                const tre = v ? [
                  ["Carbo", [v.carbo?.tipo && label(v.carbo.tipo, CARBO), v.carbo?.testo].filter(Boolean).join(" · ")],
                  ["Proteine", [v.prot?.tipo && label(v.prot.tipo, PROT), v.prot?.testo].filter(Boolean).join(" · ")],
                  ["Verd. frutta", [v.vf?.verdura ? "verdura " + v.vf.verdura : null, v.vf?.frutta ? "frutta " + v.vf.frutta : null, v.vf?.testo].filter(Boolean).join(" · ")],
                ] : [];
                return (
                  <div key={s.id} className={"rg-slot" + (!v && !ap ? " vuota" : "")}>
                    <button className={"rg-slothead" + (v ? "" : " corta")} onClick={() => apri(giorno, s.id)} aria-expanded={ap}>
                      <span className="rg-sh1">
                        <span className="rg-slotname">{s.label}</span>
                        {v && (
                          <span className="rg-hr">
                            <span className="rg-tick" aria-label="compilata">✓</span>
                            <span className="rg-ora">{v.ora}</span>
                          </span>
                        )}
                      </span>
                      {v && (
                        <>
                          <span className="rg-tre">
                            {tre.map(([k2, val]) => (
                              <span className="rg-tr" key={k2}>
                                <span className="k">{k2}</span>
                                <span className={"v" + (val ? "" : " no")}>{val || "niente"}</span>
                              </span>
                            ))}
                          </span>
                          <span className="rg-foot1">
                            <span className="rg-meta">
                              {[v.dove, v.conChi === "solo" ? "solo" : v.conChi === "altri" ? "con altri" : null].filter(Boolean).join(" · ")}
                            </span>
                            <span className="rg-voto">{v.voto}/10</span>
                          </span>
                        </>
                      )}
                    </button>
                    {ap && bozze[k] && (
                      <Editor slot={s} b={bozze[k]} esiste={!!v}
                        setB={(nv) => setBozze((bb) => ({ ...bb, [k]: nv }))}
                        salva={() => salvaVoce(giorno, s.id)}
                        elimina={() => eliminaVoce(giorno, s.id)}
                        chiudi={() => setAperta(null)} />
                    )}
                  </div>
                );
              })}
            </div>
              <div style={{ marginTop: 15, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(() => { const t = totVF(dati); return [["verdura", t.v], ["frutta", t.f]].map(([n, x]) => (
                  <span key={n} className="rg-voto" style={{ fontSize: 12 }}>{n} {x} / 2-3</span>
                )); })()}
              </div>
            </div>

            <div className="rg-card pad" style={{ marginTop: 12 }}>
              <div className="rg-flags">
                <button className={"rg-fl" + (dati.bed ? " on" : "")} aria-pressed={!!dati.bed}
                  onClick={() => aggiorna(giorno, (g) => ({ ...g, bed: !g.bed }))}>BED</button>
                <button className={"rg-fl" + (dati.vai ? " on" : "")} aria-pressed={!!dati.vai}
                  onClick={() => aggiorna(giorno, (g) => ({ ...g, vai: !g.vai }))}>VAI</button>
              </div>
              {(dati.bed || dati.vai) && (
                <div className="rg-field" style={{ marginTop: 13 }}>
                  <textarea className="rg-ta" rows={2} value={dati.notaEpisodio || ""}
                    placeholder="Cosa è successo, se te la senti."
                    onChange={(e) => { const t = e.target.value; aggiorna(giorno, (g) => ({ ...g, notaEpisodio: t })); }} />
                  <span className="rg-hint">Consigliata, non obbligatoria.</span>
                </div>
              )}
            </div>

            <div className="rg-card pad" style={{ marginTop: 12 }}>
              <div className="rg-field">
                <label className="rg-lab" htmlFor="ng">Note del giorno</label>
                <textarea id="ng" className="rg-ta" rows={2} value={dati.note || ""}
                  onChange={(e) => { const t = e.target.value; aggiorna(giorno, (g) => ({ ...g, note: t })); }} />
              </div>
            </div>
          </>
        )}

        {tab === "diario" && vista === "riepilogo" && (
          <>
            <div className="rg-nav">
              <button className="rg-arrow" onClick={() => setGiorno(addDays(giorno, -7))} aria-label="Settimana precedente">‹</button>
              <span style={{ fontSize: 16 }}>{labelSettimana(lun)}</span>
              <button className="rg-arrow" disabled={addDays(lun, 7) > oggi}
                onClick={() => setGiorno(addDays(giorno, 7) > oggi ? oggi : addDays(giorno, 7))}
                aria-label="Settimana successiva">›</button>
            </div>

            <div className="rg-card pad">
              <span className="rg-lab">Peso della settimana</span>
              <div style={{ marginTop: 9, display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="rg-bigkg">{pesataSett ? kg(pesataSett.peso) : "-"}</span>
                <span className="rg-lab">{pesataSett ? "kg · " + fmtBreve(pesataSett.data) : "non registrato"}</span>
              </div>
              {pesataSett?.note && <div className="rg-hint" style={{ marginTop: 9 }}>{pesataSett.note}</div>}
            </div>

            <div className="rg-sect">
              <div className="rg-secthead">Fonti proteiche</div>
              <div className="rg-card">
                {FONTI.map((f) => {
                  const n = conteggi.c[f.id];
                  return (
                    <div className="rg-riga" key={f.id}>
                      <span className="nm">{f.label}</span>
                      <span className="rg-dots">
                        {Array.from({ length: Math.max(f.max, n) }, (_, i) => (
                          <span key={i} className={"rg-dot" + (i < n ? (i >= f.max ? " x" : " f") : "")} />
                        ))}
                      </span>
                      <span className="rg-fq">{n} / {f.min}-{f.max}</span>
                    </div>
                  );
                })}
                <div className="rg-riga">
                  <span className="nm">Pizza</span>
                  <span className="rg-dots">
                    {Array.from({ length: Math.max(1, conteggi.pizza) }, (_, i) => (
                      <span key={i} className={"rg-dot" + (i < conteggi.pizza ? (i >= 1 ? " x" : " f") : "")} />
                    ))}
                  </span>
                  <span className="rg-fq">{conteggi.pizza} / 1</span>
                </div>
                {EXTRA.map((f) => (
                  <div className="rg-riga" key={f.id}>
                    <span className="nm fuori">{f.label}</span>
                    <span className="rg-fq">{conteggi.e[f.id]}</span>
                  </div>
                ))}
              </div>
              <div className="rg-hint" style={{ margin: "10px 6px 0" }}>
                Le ultime due voci non hanno una frequenza nello schema, quindi le conto e basta.
              </div>
            </div>

            <div className="rg-sect">
              <div className="rg-secthead">Giorno per giorno</div>
              <div className="rg-card">
                {giorniSett.map((d, i) => {
                  const g = sett.giorni?.[d];
                  const t = totVF(g);
                  const ann = !!(g?.bed || g?.vai);
                  return (
                    <button key={d} className="rg-grow" disabled={d > oggi}
                      style={d > oggi ? { opacity: .35 } : undefined}
                      onClick={() => { setGiorno(d); setVista("giorno"); }}>
                      <span className={"rg-gd" + (d === oggi ? " oggi" : "")}>{GG3[i]} {fmtBreve(d)}</span>
                      <span className="rg-pips">
                        {SLOTS.map((s) => <span key={s.id} className={"rg-pip" + (g?.voci?.[s.id] ? " f" : "")} />)}
                      </span>
                      {ann && <span className="rg-ep">{[g.bed && "BED", g.vai && "VAI"].filter(Boolean).join(" ")}</span>}
                      <span className="rg-gm">v{t.v} f{t.f}</span>
                    </button>
                  );
                })}
              </div>
              <div className="rg-hint" style={{ margin: "10px 6px 0" }}>
                Camminate: {conteggi.camminate} su 7{conteggi.minuti ? `, ${conteggi.minuti} minuti in tutto` : ""}.
                Verdura {conteggi.verdura}, frutta {conteggi.frutta} nella settimana.
                Giorni con tutte e cinque le voci: {conteggi.completi} su 7.
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <button className="rg-btn ghost" style={{ width: "100%" }} onClick={() => setVista("giorno")}>Torna al giorno</button>
            </div>
          </>
        )}

        {tab === "peso" && (
          <>
            <div className="rg-card" style={{ marginTop: 16 }}>
              <div className="rg-form">
                <div className="rg-due">
                  <div className="rg-field">
                    <label className="rg-lab" htmlFor="pd">Giorno</label>
                    <input id="pd" className="rg-in ora" type="date" value={pData} max={oggi}
                      onChange={(e) => setPData(e.target.value)} />
                  </div>
                  <div className="rg-field">
                    <label className="rg-lab" htmlFor="pp">Peso, bilancia di casa</label>
                    <input id="pp" className="rg-in rg-kg" inputMode="decimal" placeholder="000,0"
                      value={pPeso} onChange={(e) => setPPeso(e.target.value)} />
                  </div>
                </div>
                <div className="rg-field">
                  <label className="rg-lab" htmlFor="pn">Contesto <em>(facoltativo)</em></label>
                  <textarea id="pn" className="rg-ta" rows={2} value={pNota}
                    placeholder="Deviazioni, alcol, sale, regolarità, attività."
                    onChange={(e) => setPNota(e.target.value)} />
                </div>
                <button className="rg-btn" disabled={!pPeso} onClick={salvaPesata}>Salva la pesata</button>
              </div>
            </div>

            <Grafico pesate={pesate} sel={selPesata} onSel={setSelPesata} />

            {selPesata && (() => {
              const ord = [...pesate].sort((a, b) => a.data.localeCompare(b.data));
              const i = ord.findIndex((p) => p.data === selPesata);
              const p = ord[i], prec = i > 0 ? ord[i - 1] : null;
              const d = prec ? p.peso - prec.peso : null;
              return (
                <div className="rg-card pad" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="rg-bigkg" style={{ fontSize: 24 }}>{kg(p.peso)} kg</span>
                    <span className="rg-lab">{fmtNum(p.data)}</span>
                  </div>
                  {d != null && (
                    <div className="rg-delta">{(d > 0 ? "+" : d < 0 ? "-" : "=") + kg(Math.abs(d))} kg dal {fmtBreve(prec.data)}</div>
                  )}
                  {p.note && <div className="rg-hint" style={{ marginTop: 9 }}>{p.note}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button className="rg-btn ghost" onClick={() => { setGiorno(p.data); setTab("diario"); setVista("riepilogo"); }}>Vai alla settimana</button>
                    <button className="rg-btn ghost" onClick={() => { setPData(p.data); setPPeso(kg(p.peso)); setPNota(p.note || ""); }}>Modifica</button>
                    <button className="rg-btn danger" onClick={() => eliminaPesata(p.data)}>Elimina</button>
                  </div>
                </div>
              );
            })()}

            <div className="rg-sect">
              <div className="rg-secthead">Tutte le pesate</div>
              <div className="rg-card">
                {[...pesate].sort((a, b) => b.data.localeCompare(a.data)).map((p) => (
                  <button key={p.data} className={"rg-prow" + (selPesata === p.data ? " on" : "")}
                    onClick={() => setSelPesata(selPesata === p.data ? null : p.data)}>
                    <span className="rg-pdate">{fmtBreve(p.data)}</span>
                    <span className="rg-pkg">{kg(p.peso)} kg</span>
                    <span className="rg-pnote">{p.note}</span>
                  </button>
                ))}
                {!pesate.length && <div className="rg-empty">Ancora niente.</div>}
              </div>
            </div>
          </>
        )}

        <button className="rg-footlink" onClick={() => { setDatiOpen(true); setDatiTesto(""); setDatiMsg(""); }}>
          Dati e backup
        </button>
        <div className="rg-foot">I dati restano su questo telefono.<br />Fai un backup ogni tanto.</div>
      </div>

      {datiOpen && (
        <div className="rg-ov" onClick={(e) => { if (e.target === e.currentTarget) setDatiOpen(false); }}>
          <div className="rg-modal">
            <div className="rg-eyebrow">
              <span className="rg-mark">Dati</span>
              <button className="rg-tool" onClick={() => setDatiOpen(false)}>Chiudi</button>
            </div>
            <span className="rg-hint">
              Per importare le pesate: una per riga, data e peso.
              Vanno bene sia 19/08/2026 124 sia 2026-08-19 124,0.
              Se una data c'è già, viene sostituita.
            </span>
            <textarea className="rg-ta" style={{ minHeight: 150, fontFamily: "var(--mono)", fontSize: 12.5 }}
              value={datiTesto} placeholder={"19/08/2026 124\n12/08/2026 121,45"}
              onChange={(e) => { setDatiTesto(e.target.value); setDatiMsg(""); }} />
            {datiMsg && <span className="rg-hint" style={{ color: "var(--acc)" }}>{datiMsg}</span>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="rg-btn" onClick={importaPesate}>Importa pesate</button>
              <button className="rg-btn ghost" onClick={faiBackup}>Fai un backup</button>
              <button className="rg-btn ghost" onClick={ripristina}>Ripristina</button>
            </div>
          </div>
        </div>
      )}

      {espOpen && (
        <div className="rg-ov" onClick={(e) => { if (e.target === e.currentTarget) setEspOpen(false); }}>
          <div className="rg-modal">
            <div className="rg-eyebrow">
              <span className="rg-mark">Esporta</span>
              <button className="rg-tool" onClick={() => setEspOpen(false)}>Chiudi</button>
            </div>
            <div className="rg-chips">
              <button className={"rg-chip" + (espTutto ? "" : " on")}
                onClick={() => { setEspTutto(false); genera(false, espFlag); }}>Questa settimana</button>
              <button className={"rg-chip" + (espTutto ? " on" : "")}
                onClick={() => { setEspTutto(true); genera(true, espFlag); }}>Tutto</button>
            </div>
            <label className="rg-check">
              <input type="checkbox" checked={espFlag}
                onChange={(e) => { setEspFlag(e.target.checked); genera(espTutto, e.target.checked); }} />
              Includi le annotazioni BED e VAI
            </label>
            <div className="rg-out">{espCarico ? "Raccolgo i dati." : espTesto}</div>
            <button className="rg-btn" onClick={copia}>Copia il testo</button>
          </div>
        </div>
      )}
    </div>
  );
}
