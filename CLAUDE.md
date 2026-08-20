# Registro

App personale di Beniamino: diario alimentare a cinque voci al giorno e peso settimanale.
Serve a preparare le visite con la dietologa (Dott.ssa Bertelli) e con la psicoterapeuta.
Non è un prodotto, non ha utenti, non deve piacere a nessun altro.

## Vincoli di merito, non negoziabili

Questi vincoli vengono dal percorso clinico. Non aggirarli nemmeno se sembrano
migliorare l'app, e se una richiesta li contraddice, dillo invece di eseguire.

- **Mai calorie, mai grammi di macronutrienti, mai punteggi nutrizionali.** Lo schema
  della dietologa ragiona per porzioni ed equivalenze, non per aritmetica.
- **Mai un peso obiettivo**, né come numero, né come linea sul grafico, né come
  percentuale di avanzamento.
- **Mai gamification**: niente serie di giorni consecutivi, niente coriandoli, niente
  complimenti, niente rossi e verdi di merito o demerito. Il verde è usato solo per
  dire "compilato", mai per dire "bravo".
- **Il grafico del peso non deve drammatizzare le oscillazioni**: la scala verticale
  non scende mai sotto i 6 kg di ampiezza ed è calcolata su tutta la serie, non
  sulla finestra visibile.
- **Le annotazioni BED e VAI** (abbuffata, vomito autoindotto) stanno sul giorno, sono
  un tocco solo, la nota è suggerita ma mai obbligatoria, e l'app non le commenta
  né le conteggia in vista. Servono a lui e alla psicoterapeuta, non a giudicarlo.
- **Mai dati personali nel sorgente.** Questo repository è pubblico. Pesi, date,
  nomi e note si inseriscono solo dall'app, dal pannello "Dati e backup".

## Struttura

```
src/App.jsx               tutto il componente, CSS compreso (stringa CSS in cima)
src/main.jsx              montaggio + registrazione del service worker
src/index.template.html   guscio HTML, il bundle finisce in /*__BUNDLE__*/
build.mjs                 compila e aggiorna la versione in sw.js
index.html                GENERATO: non modificarlo a mano, va comunque committato
sw.js                     la riga VERSIONE viene riscritta dal build
```

## Come si compila

```
npm install     # solo la prima volta
npm run build   # rigenera index.html e aggiorna la versione in sw.js
```

Poi commit e push: GitHub Pages serve la radice del repository.
`index.html` è generato ma **va committato**, altrimenti il sito non si aggiorna.

## Modello dei dati

Tutto in `localStorage`, con prefisso `registro:`. L'accesso passa dall'oggetto
`store` (get / set / del / list): non usare `localStorage` direttamente altrove.

- `registro:pesate` → `[{ data:"AAAA-MM-GG", peso:Number, note:String }]`
- `registro:settimana:AAAA-MM-GG` (il lunedì) → `{ giorni: { "AAAA-MM-GG": Giorno } }`

```
Giorno = { camminata:true|false|null, minuti, note, bed, vai, notaEpisodio, voci:{ slotId: Voce } }
Voce   = { ora, carbo:{tipo,testo}, prot:{tipo,testo},
           vf:{verdura,frutta,testo}, dove, conChi, conChiNome, voto, note }
```

Gli slotId sono `colazione, pasto1, spomeriggio, pasto2, ssera` e **non vanno
rinominati** anche se le etichette a schermo dicono Pranzo e Cena: i dati già
salvati usano queste chiavi.

**Se cambi la forma dei dati, scrivi la conversione** in `migraSettimana` o
`migraVoce` e verificala, perché ci sono mesi di diario nel telefono e nessun
modo di recuperarli se li rompi.

## Regole dello schema alimentare

Frequenze settimanali del secondo piatto, usate dal riepilogo (`FONTI`):
carne 4-5, pesce 2-3, legumi 1-2, formaggio 2-3, affettati 2-3, uova 1-2.
Pizza al massimo 1. Verdura e frutta 2-3 porzioni al giorno.
`EXTRA` (burger vegetale, latte o yogurt) si contano ma **non hanno un obiettivo**,
perché la dietologa non ne ha fissato uno: non inventarne.

## Trappole già pagate

- **Specificità CSS.** L'azzeramento dei bottoni è scritto `:where(.rg button)`
  apposta, per avere specificità zero. Se lo riscrivi come `.rg button`, vince su
  tutte le classi dei componenti e sparisce ogni padding e ogni bordo: il testo
  finisce tagliato dagli angoli arrotondati. È già successo.
- **Campi di testo a 16px.** Sotto quella soglia iOS ingrandisce la pagina da solo
  quando ci entri dentro. Non abbassarli.
- **Nel bundle possono esserci `$&` e simili**: in `build.mjs` la sostituzione usa
  una funzione, non una stringa. Non semplificarla.
- Niente `<form>`, niente dipendenze nuove: React ed esbuild bastano.

## Lingua e tono dell'interfaccia

Italiano, informale ma asciutto. Niente entusiasmo, niente motivazionalismo,
niente punti esclamativi. Nei testi non usare mai trattini lunghi (– o —):
solo il trattino normale, i due punti o le parentesi.
