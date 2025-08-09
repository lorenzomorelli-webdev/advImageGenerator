Adv Image Generator (local)
===========================

Strumento locale per generare immagini in batch partendo da:
- un background (immagine intera),
- più layer di testo posizionati/ruotati via UI,
- varianti testuali (CSV) per produrre N immagini.

Stack: Next 15, React 19, Tailwind, shadcn/ui, Puppeteer (render HTML ➜ PNG su disco).

Cartelle chiave
- `app/editor`: UI editor (preview, upload font, posizionamento testi, varianti CSV)
- `app/api/generate/batch-html`: API batch che salva PNG in `./output`

Requisiti
- Node 18+
- pnpm 8+ (consigliato 10+)

Installazione
1) Installa dipendenze
   ```bash
   pnpm i
   ```
2) Approva gli script di installazione (necessario per Puppeteer)
   ```bash
   pnpm approve-builds
   # seleziona "puppeteer" quando richiesto
   ```
   In alternativa (o se Chromium non viene scaricato), installa il browser per Puppeteer:
   ```bash
   pnpm dlx puppeteer browsers install chrome
   # oppure
   pnpm dlx puppeteer browsers install chromium
   ```

Avvio in locale
```bash
pnpm dev --port 3030
```
Apri `http://localhost:3030/editor`.

Come si usa (UI)
1) Background: carica un’immagine (copre l’intera canvas).
2) Font custom: carica TTF/OTF/WOFF/WOFF2. Per usare un font in un layer imposta `Font family` (usa il nome file senza estensione, es. `Inter`).
3) Layer di testo: aggiungi/posiziona/ruota ogni layer. Il campo “Text Preview” è solo anteprima.
4) Varianti: incolla CSV nella sezione “Varianti stile CSV”.
   - La prima riga sono gli header con gli `id` dei layer (es. `headline,text2`).
   - Ogni riga successiva è una variante; i valori verranno inseriti nei rispettivi layer.
5) Genera: clicca “Genera su disco (N)”. I file saranno salvati in `./output`.

Esempio CSV
```
headline,text2
Ciao mondo,Salve Mondo
Offerta imperdibile,Offertona
```

API batch (opzionale)
- Endpoint: `POST /api/generate/batch-html`
- Input (estratto):
  ```json
  {
    "template": {
      "width": 1200,
      "height": 630,
      "backgroundDataUrl": "data:image/png;base64,...",
      "texts": [
        { "id": "headline", "x": 80, "y": 180, "size": 80, "color": "#fff", "fontFamily": "Inter", "maxWidth": 900 }
      ]
    },
    "variants": [
      { "overrideTexts": { "headline": "Ciao" }, "filename": "1.png" },
      { "overrideTexts": { "headline": "Mondo" }, "filename": "2.png" }
    ],
    "fonts": [
      { "name": "Inter.ttf", "dataB64": "<base64>", "weight": 400, "style": "normal" }
    ],
    "outputDir": "output"
  }
  ```
  - Nota: in generazione vengono usate solo le varianti; i testi nei layer sono solo anteprima.

Output
- PNG salvati in `./output` (configurabile via `outputDir` nella richiesta API).

Troubleshooting
- Porta occupata (EADDRINUSE 3030):
  - Chiudi il dev server precedente o usa un’altra porta: `pnpm dev --port 3001`.
- Puppeteer errore su browser mancante o download bloccato:
  - Esegui `pnpm approve-builds` e consenti puppeteer.
  - Oppure installa manualmente: `pnpm dlx puppeteer browsers install chrome` (o `chromium`).
  - In ambienti aziendali con proxy/firewall, potrebbe servire configurare variabili proxy o impostare `PUPPETEER_EXECUTABLE_PATH` verso un Chrome/Chromium già presente.

Note
- Nessuna variabile d’ambiente necessaria per l’uso locale.
- I font caricati in UI sono incorporati nella preview e passati anche all’API per la resa PNG.
