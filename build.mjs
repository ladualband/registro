/* Compila src/App.jsx dentro index.html e aggiorna la versione del service worker.
   Uso: npm run build                                                             */
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";

const out = await esbuild.build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2018",
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  logLevel: "warning",
});

const bundle = out.outputFiles[0].text;
if (bundle.toLowerCase().includes("</script")) throw new Error("il bundle chiuderebbe il tag script");

const d = new Date();
const p = (n) => String(n).padStart(2, "0");
const versione = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;

/* la funzione di sostituzione evita che i $ del codice minificato vengano interpretati */
const html = readFileSync("src/index.template.html", "utf8").replace("/*__BUNDLE__*/", () => bundle);
writeFileSync("index.html", html);

const sw = readFileSync("sw.js", "utf8")
  .replace(/const VERSIONE = "[^"]*";/, () => `const VERSIONE = "registro-${versione}";`);
writeFileSync("sw.js", sw);

console.log(`fatto. versione ${versione}, index.html ${(html.length / 1024).toFixed(0)} KB`);
