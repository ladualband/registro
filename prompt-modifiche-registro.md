# Prompt per le modifiche a "Registro"

Salva questo file nella cartella del progetto, accanto a `index.html`, e in Claude Code scrivi: *leggi ./prompt-modifiche-registro.md ed eseguilo, modificando index.html sul posto*.

---

## Contesto

`index.html` è un'app in file unico: React compilato e incorporato, CSS in un blocco `<style>` dentro lo stesso file, persistenza in `localStorage` con prefisso `registro:` attraverso il wrapper asincrono `Da`. Funziona come PWA installata sulla schermata home di un iPhone 17 Pro Max, quindi la larghezza di riferimento è **440 punti CSS**.

Modifica `index.html` sul posto, mantenendolo un file unico. Niente refactor, niente build system, niente librerie nuove, niente file aggiuntivi. Conserva la migrazione degli schemi vecchi già presente nel codice: i backup fatti finora devono continuare a caricarsi.

## Vincoli: cose che NON vanno toccate

Sono decisioni deliberate, non dimenticanze. Se ti sembrano problemi, lasciali stare.

1. La pesata è **settimanale** e ancorata al mercoledì. Non aggiungere pesate giornaliere né promemoria di pesata.
2. Si contano **porzioni**, non grammi. Nessuna caloria, nessun valore nutrizionale, nessun obiettivo numerico, nessuna percentuale di aderenza, nessuna serie di giorni consecutivi, nessun elemento di gioco o di premio.
3. La nota sull'episodio resta **facoltativa** e conserva il testo attuale.
4. Il voto da 1 a 10 resta **obbligatorio** per salvare una voce.
5. Le voci del giorno restano **cinque fisse**. Non aggiungere voci libere né uno stato "pasto saltato".
6. La bozza di una voce non compilata **non** va salvata automaticamente.
7. Il cambio settimana resta affidato allo scorrimento del dito sulla striscia dei giorni. Non aggiungere frecce nella schermata del giorno.
8. Il peso fuori dall'intervallo 30-300 continua a non produrre messaggi.
9. Il tag `<meta name="viewport">` resta **invariato**, zoom bloccato compreso.
10. I campi di testo restano a `font-size:16px`, altrimenti iOS ingrandisce la pagina al tocco.
11. Il backup resta manuale via appunti. Nessun promemoria, nessun salvataggio automatico su file.

## Modifiche richieste

### 1. Conferma prima di eliminare

Il tasto `Elimina` (classe `rg-btn danger`) cancella al primo tocco, sia sulla voce del pasto sia sulla pesata. Rendilo a due tempi, senza finestre di dialogo native: al primo tocco l'etichetta diventa `Confermi?` e il tasto resta in quello stato per 4 secondi, poi torna da solo a `Elimina`. Solo il secondo tocco cancella. Vale per entrambi i punti.

### 2. Separare il ripristino dall'importazione

Oggi la stessa area di testo serve sia per `Importa pesate` sia per `Ripristina`, e il ripristino sovrascrive tutte le chiavi senza avvisare. Dividi in due blocchi distinti dentro le impostazioni:

- **Importa pesate**: area di testo dedicata, con il tasto `Importa pesate`. Comportamento invariato.
- **Backup e ripristino**: area di testo separata, con `Crea backup` e `Ripristina`. Prima di ripristinare, controlla che il contenuto sia un oggetto con almeno una chiave riconoscibile dello schema e mostra sotto l'area un riepilogo di cosa stai per applicare (numero di chiavi e numero di settimane trovate). Il tasto `Ripristina` è a due tempi come al punto 1, con etichetta intermedia `Sovrascrivo tutto?`. Se il contenuto non è un backup valido, il messaggio d'errore attuale va bene.

### 3. Scala 1-10 utilizzabile con il pollice

`.rg-sc` oggi è `flex:1; height:38px` dentro `.rg-scale { gap:4px }`: su 440 punti di larghezza ogni bottone risulta largo circa 29 punti, contro i 44 raccomandati.

Trasforma `.rg-scale` in una griglia di **5 colonne per 2 righe** (`display:grid; grid-template-columns:repeat(5,1fr); gap:8px`), con 1-5 sulla prima riga e 6-10 sulla seconda. `.rg-sc` passa a `height:44px` e `font-size:15px`, perde `flex:1`. Gli ancoraggi `1 peggio` / `10 meglio` restano sotto la griglia, invariati come testo.

### 4. Contatori porzioni con tasti da 44

`.rg-step` passa da 31 a **44 punti** di lato, `font-size:17px`, cerchio pieno come adesso.

Con tasti da 44 i contatori Verdura e Frutta non entrano più affiancati: servirebbero 368 punti e ce ne sono 328. Quindi passa a **una riga piena per contatore**: `.rg-porz { flex-direction:column; gap:14px }`, e ogni `.rg-porzuno { width:100%; justify-content:space-between }` con l'etichetta a sinistra e il gruppo `[-] [numero] [+]` allineato a destra. L'etichetta perde la larghezza fissa di 54 punti.

Alza a 44 anche `.rg-arrow` (oggi 34), mantenendo però lo stesso ingombro visivo del glifo.

### 5. Testi minimi più leggibili

Lo zoom resta bloccato, quindi le scritte devono bastare così come sono. Applica:

| selettore | da | a |
|---|---|---|
| `.rg-lab` | 9.5px, letter-spacing .13em | 11px, letter-spacing .1em |
| `.rg-tr .k` | 9.5px, width 76px | 11px, width 100px |
| `.rg-secthead` | 9.5px, letter-spacing .16em | 11px, letter-spacing .12em |
| `.rg-anchors` | 9.5px | 11px |
| `.rg-kgmini` | 9px | 10.5px |
| `.rg-mark` | 11px | 12px |
| `.rg-tool` | 10.5px | 12px |
| `.rg-out` | 11.5px | 12.5px |
| testi SVG del grafico | 9 e 10 | 11 |

La colonna a 100 punti serve perché l'etichetta `Verd. frutta`, che resta con questo nome, a 11px andrebbe a capo nei 76 attuali. Verifica che la colonna dei valori accanto non risulti stretta.

### 6. Pallini e quadratini vuoti visibili

`.rg-dot` e `.rg-pip`, quando sono vuoti, usano `border:1px solid var(--line)` con `--line:#2A3650`: su fondo card il contrasto è 1,27 a 1, cioè praticamente invisibili, e sono proprio l'indicazione di cosa manca.

Aggiungi una variabile `--line2:#657899` (3,4 a 1 su card) e usala **solo** per il bordo di `.rg-dot` e `.rg-pip` allo stato vuoto. Non cambiare `--line`, che continua a servire per bordi e separatori delle card.

### 7. Condivisione iOS per l'export

Sotto l'area di export c'è solo `Copia il testo`. Aggiungi accanto un tasto `Condividi` che chiami `navigator.share({ title: "Registro", text: <testo generato> })`. Se `navigator.share` non esiste, il tasto non va mostrato affatto. Gestisci il rifiuto dell'utente (`AbortError`) senza mostrare errori.

Aggiungi inoltre `user-select:text; -webkit-user-select:text` a `.rg-out`, così il testo resta selezionabile a mano se entrambe le strade falliscono.

## Verifica prima di consegnare

- A 440 punti di larghezza: nessun elemento interattivo sotto i 44 punti, tranne le linguette `Diario` / `Riepilogo` e i giorni della striscia settimanale, che restano come sono.
- Un backup creato con la versione precedente si carica ancora.
- I dati già in `localStorage` con prefisso `registro:` restano leggibili.
- Nessuna modifica al meta viewport e nessun campo di input sotto i 16px.
