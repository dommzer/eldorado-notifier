# Eldorado Notifier — Setup Guide

## Struttura file
```
eldorado-app/
├── server.js                  ← Server Node.js
├── package.json
├── public/
│   ├── index.html             ← App PWA
│   ├── sw.js                  ← Service worker (notifiche)
│   └── manifest.json          ← PWA manifest
└── eldorado_notifier_v2.gs    ← Script Google Apps Script aggiornato
```

---

## STEP 1 — Deploy su Railway

1. Vai su **railway.app** e crea un account gratuito
2. Clicca **"New Project" → "Deploy from GitHub repo"**
   - Oppure usa **"Deploy from local"** e carica la cartella `eldorado-app`
3. Una volta deployato, vai su **Variables** e aggiungi queste 3 variabili:

```
VAPID_PUBLIC   = (vedi step 2)
VAPID_PRIVATE  = (vedi step 2)
VAPID_EMAIL    = mailto:tua@email.com
```

---

## STEP 2 — Genera le chiavi VAPID (per le notifiche push)

Sul tuo PC, apri il terminale e lancia:

```bash
npx web-push generate-vapid-keys
```

Copia i valori `Public Key` e `Private Key` e mettili nelle variabili Railway dello step 1.

---

## STEP 3 — Aggiorna Google Apps Script

1. Apri il tuo progetto su **script.google.com**
2. Sostituisci tutto il codice con il contenuto di `eldorado_notifier_v2.gs`
3. Aggiorna riga 2: metti il tuo nuovo Discord webhook
4. Aggiorna riga 3: metti l'URL del tuo progetto Railway (es. `https://eldorado-notifier.up.railway.app`)
5. Salva con Ctrl+S

---

## STEP 4 — Installa l'app sul telefono (Android)

1. Apri Chrome sul telefono Android
2. Vai all'URL del tuo progetto Railway
3. Clicca i 3 puntini in alto → **"Aggiungi a schermata Home"**
4. L'app appare come icona sul telefono
5. Aprila e clicca **"Attiva notifiche"**

---

## STEP 5 — Aggiungi icona app (opzionale)

Metti due file PNG nella cartella `public/`:
- `icon-192.png` (192x192 px)
- `icon-512.png` (512x512 px)

Puoi usare il logo Eldorado o una tua icona custom.

---

## Come funziona

```
Email Eldorado
     ↓
Google Apps Script (ogni 1 min)
     ↓
     ├── Discord webhook → notifica Discord
     └── Server Railway → salva ordine + push notification → App sul telefono
```
