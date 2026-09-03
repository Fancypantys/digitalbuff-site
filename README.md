# digitalbuff.dk — landing page

Single-page lead magnet site. Static HTML, no build step.

## Stack
- Static HTML/CSS/JS, Google Fonts (Fraunces + Inter).
- Form submission → Google Apps Script Web App → Google Sheet (`Digitalbuff Leads`).
- Hosted on Cloudflare Pages, custom domain `digitalbuff.dk`.

## Deploy
Connected to this repo via Cloudflare Pages. Push to `main` → auto-deploys to `digitalbuff.dk`.

## Local development
Just open `index.html` in a browser. No server, no build.

## Updating the Sheets endpoint
The Apps Script Web App URL is hardcoded at the top of the `<script>` block in `index.html`:
```js
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/.../exec';
```
If you re-deploy the Apps Script (which gives a new URL), swap this string and push.

## Updating copy
Edit `index.html`. All copy lives in the markup. Astrid (Danish copy) reviews any change to customer-facing text before merge.

---

## Bødekassen (`/boder`) — web app til Round Table-klubben

Selvstændig, statisk web-app til at holde styr på klubbens bøder. Ingen build, ingen
server, ingen login: `boder/index.html` + `boder/app.css` + `boder/app.js`.
Åbn filen i en browser, eller gå til `digitalbuff.dk/boder/` når den er deployet.

### Funktioner
- **Ny bøde** — vælg bødetype (takst udfyldes automatisk), vælg ét eller flere medlemmer
  på én gang, ret beløb/dato/note og gem. "Fri bøde" til alt det, takstbladet ikke dækker.
- **Medlemmer** — tilføj, ret, sæt passiv eller slet. Hver linje viser antal bøder,
  samlet sum og udestående.
- **Bødetyper** — klubbens takstblad. Elleve danske standardtakster følger med og kan
  rettes, skjules eller suppleres.
- **Bøder** — søg og filtrér på medlem, type og betalingsstatus. Marker betalt enkeltvis,
  pr. medlem ("Afregn") eller for alt det viste.
- **Statistik** — samlet bødesum, gennemsnit, betalingsgrad, bødesum og antal pr. medlem,
  fordeling på bødetyper, udvikling pr. måned, betalingsdonut og kuriosa (dyreste bøde,
  dyreste måned, hvem der slap uden en eneste).
- **Sæsonfilter** øverst — alle sæsoner eller ét kalenderår.
- **Første start** — appen åbner med demo-data (8 opdigtede medlemmer og 70 bøder), så
  man kan se den i brug med det samme. Et banner øverst tømmer den med ét klik.
- **Data** — gemmes i browserens `localStorage`. Eksport/import af JSON som sikkerhedskopi,
  CSV-eksport (semikolonsepareret med BOM, så den åbner direkte i dansk Excel) og
  demo-data til at prøve appen af.

### Vigtigt om data
Alt ligger lokalt i den browser, appen bruges fra — der er ingen backend. Skal flere
personer se de samme tal, deles JSON-sikkerhedskopien fra **Indstillinger**. Ryddes
browserdata uden sikkerhedskopi, er bøderne væk.
