# Telza AI website

The Telza navy website: a 3D scroll homepage with the five specialists, a Book a meeting page and a Live demo page.

## Run locally

Install Node.js 20 or newer, then:

```sh
cd telza-navy-homepage
npm start
```

Open **http://127.0.0.1:4879**. There are no npm dependencies or build steps.

| Page | URL |
| --- | --- |
| Homepage | `/` (`index.html`) |
| Book a meeting | `/book` or `/book.html` |
| Live demo | `/demo` or `/demo.html` |

## Run with Docker

```sh
docker compose up -d --build
```

Open **http://localhost:4879**. Form submissions persist in the `telza-data` volume. Use another host port with `TELZA_PORT=8080 docker compose up -d`, and forward submissions with `TELZA_WEBHOOK_URL=https://… docker compose up -d`. Logs: `docker compose logs -f`. Stop: `docker compose down`.

## Deploying

`server.cjs` serves the site and receives the two forms. Settings are environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4879` | Port to listen on. |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` on a server or in a container. |
| `TELZA_DATA_DIR` | `./data` | Where submissions are stored (`submissions.ndjson`, one JSON object per line). |
| `TELZA_WEBHOOK_URL` | empty | Every submission is also POSTed here as JSON. Use it to email the team or create CRM leads (Zapier, Make, n8n, Slack, HubSpot…). |

Example: `HOST=0.0.0.0 PORT=8080 TELZA_WEBHOOK_URL=https://hooks.example.com/telza npm start`

Put it behind HTTPS (Nginx, Caddy or your platform's proxy). The forms accept JSON on `POST /api/booking` and `POST /api/demo-request`, validate every field, ignore bots that fill a hidden field and allow 8 submissions per visitor every 10 minutes.

If the site is hosted as static files with no `server.cjs`, everything still works except form sending: the forms then offer to send the same details by email (info@telza.ai) or WhatsApp instead.

## Live demo setup

Edit `demo-config.js` only:

- `voiceInbound.number`: the number visitors call to talk to the inbound Voice Agent. Empty shows "Demo line opening soon".
- `voiceOutbound.enabled` / `live`: the "Get a call from the agent" form. Requests arrive like bookings.
- `whatsapp.number`, `message`, `live`: the WhatsApp demo (currently +1 401 678 3367).
- `fillo.sandboxUrl`: a Fillo sandbox or recorded walkthrough. Empty links to booking.
- `embedUrl`: any https page to embed (web chat widget, recorded demo).

## Homepage structure

1. Hero and the five specialists.
2. **Voice Agent** (`#voice`): scroll story with an Outbound/Inbound switch; then **Voice Agent in detail** (`#voice-agent`): integrations, voices, dispositions, portal, compliance.
3. **Fillo AI** (`#fillo`): the original Fillo story.
4. **WhatsApp Bot** (`#whatsapp`): scroll story of a full conversation.
5. E-commerce AI and Custom AI chapters.
6. **Other services** (`#services`): portals, CRM, web apps, mobile apps, websites and stores, integrations.
7. Approach, FAQ, closing call to action, footer. A WhatsApp button is on every page.

## Source

- `index.html`, `book.html`, `demo.html`: the pages.
- `journey.css`, `brand.css`, `responsive-refinement.css`, `fillo-story.css`: original homepage styling.
- `stories.css`: Voice Agent and WhatsApp stories. `site.css`: navigation, services, footer, WhatsApp button, booking and demo pages.
- `journey.js` and the motion/geometry scripts, `sculpture.js`: the shared 3D canvas and scroll choreography.
- `story.js`: the stage engine for the Voice Agent and WhatsApp stories. Each `.chapter[data-story]` docks its sphere in `[data-dock]` sockets; elements with `data-from`/`data-to` appear by stage.
- `fillo-story.js`, `fillo-story-motion.js`, `fillo-handoff.js`: Fillo's story and its handoff to the WhatsApp Bot.
- `journey-dialogs.js`: product detail dialogs. `site.js`: menu and form sending. `book.js`, `demo.js`, `demo-config.js`: the two pages.
- `assets/`: logo, icon, favicon, the Inter font and its license.

Product experiences on the homepage (names, numbers, conversations) are illustrative.
