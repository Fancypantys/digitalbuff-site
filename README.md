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
