# Atmos — Worldwide Weather Desk

Atmos is a fresh standalone weather-awareness dashboard. It does not reuse pages, components, styling, API handlers, or project dependencies from any other website; **Atmos** is the product name only.

## Features

- Worldwide base map and RainViewer radar mosaic with playback when frames are available.
- Region shortcuts for North America, Europe, Asia, and Oceania.
- World-capable current conditions and forecasts through Open-Meteo.
- Location search and optional browser geolocation; location and preferences stay in this browser.
- Live NWS point alerts for supported locations in the United States. For other countries, the warning desk clearly links to official national warning services rather than making up a unified global warning feed.
- U.S. Storm Prediction Center Day 1 outlook and preliminary reports, plus links to Canadian national forecasts and warning products, MeteoAlarm, JMA, BOM, MetService, and the WMO Severe Weather Information Centre.
- LightningMaps.org embed with an external-open fallback.
- Skywarn information and a list of weather meteorologists, storm chasers, and official weather channels including Ryan Hall, Reed Timmer, and Storm of Passion.
- Browser notification options for tornado, severe-thunderstorm, flood, and other severe alerts. The automated polling implementation currently works with live NWS point alerts in the U.S. and only while the page is open and browser notifications are allowed.
- Service status checks for upstream providers.
- Eight visual themes, a custom accent color, and Celsius/Fahrenheit preferences.
- The requested notice: “This website was made with ChatGPT. Expect errors.”

## Deploy on Vercel Hobby

Vercel Project Settings:

- **Framework Preset:** Other
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** leave at the default (there are no npm package dependencies)
- **Root Directory:** `.`

Node.js 20.19 or newer is specified in `package.json`.

### Why there is only one API function

The `api/` directory deliberately contains only `api/[route].js`. It dispatches the supported one-segment endpoints (`/api/health`, `/api/forecast`, `/api/geocode`, `/api/reverse`, `/api/radar`, `/api/alerts`, `/api/reports`, and `/api/status`) from one Vercel serverless function, keeping the deployment below the Hobby plan's serverless-function limit.

## Local checks

```bash
npm run check
npm run build
```

The static output is generated in `dist/`. For API calls to work locally, use Vercel's development server (`npx vercel dev`) after authenticating with the Vercel CLI, or deploy the project to Vercel.

## Data coverage and safety notes

Atmos is an unofficial awareness dashboard, not an emergency alert service. Data availability, radar coverage, warning formats, and refresh timing vary by provider and country. The status page checks reachability, not scientific accuracy or completeness. LightningMaps is a community detection network. The NWS alert feed is the only direct location-based warning feed currently integrated; international warning links are explicit portal links and do not imply equivalent live integrations. Always follow your national weather agency and emergency authorities for life-safety decisions.

Main providers: Open-Meteo, RainViewer, OpenStreetMap, U.S. National Weather Service / Storm Prediction Center, WMO Severe Weather Information Centre, MeteoAlarm, Environment and Climate Change Canada, UK Met Office, Met Éireann, JMA, BOM, MetService, and LightningMaps.org. Their own terms, quotas, and service availability apply.
