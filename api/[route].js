const MAX_COORDINATE_LAT = 90;
const MAX_COORDINATE_LON = 180;

function json(res, status, body, cache = 'public, s-maxage=30, stale-while-revalidate=60') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function numberParam(value, min, max) {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    signal: AbortSignal.timeout(options.timeout || 9000),
  });
  if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: 'text/html,application/atom+xml,application/rss+xml,*/*', 'User-Agent': 'AtmosWeatherDesk/2.0 (+https://atmos-weather.vercel.app)', ...(options.headers || {}) },
    signal: AbortSignal.timeout(options.timeout || 7000),
  });
  if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);
  return { response, text: await response.text() };
}

const METEOALARM_FEEDS = [
  ['andorra', 'Andorra'], ['austria', 'Austria'], ['belgium', 'Belgium'], ['bosnia-herzegovina', 'Bosnia and Herzegovina'],
  ['bulgaria', 'Bulgaria'], ['croatia', 'Croatia'], ['cyprus', 'Cyprus'], ['czechia', 'Czechia'], ['denmark', 'Denmark'],
  ['estonia', 'Estonia'], ['finland', 'Finland'], ['france', 'France'], ['germany', 'Germany'], ['greece', 'Greece'],
  ['hungary', 'Hungary'], ['iceland', 'Iceland'], ['ireland', 'Ireland'], ['israel', 'Israel'], ['italy', 'Italy'],
  ['latvia', 'Latvia'], ['lithuania', 'Lithuania'], ['luxembourg', 'Luxembourg'], ['malta', 'Malta'], ['moldova', 'Moldova'],
  ['montenegro', 'Montenegro'], ['netherlands', 'Netherlands'], ['republic-of-north-macedonia', 'North Macedonia'],
  ['norway', 'Norway'], ['poland', 'Poland'], ['portugal', 'Portugal'], ['romania', 'Romania'], ['serbia', 'Serbia'],
  ['slovakia', 'Slovakia'], ['slovenia', 'Slovenia'], ['spain', 'Spain'], ['sweden', 'Sweden'], ['switzerland', 'Switzerland'],
  ['ukraine', 'Ukraine'], ['united-kingdom', 'United Kingdom']
];

function decodeXmlEntities(value) {
  return String(value || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function xmlLocalTagValues(source, tagName) {
  const pattern = new RegExp(`<(?:(?:[\\w.-]+):)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${tagName}\\s*>`, 'gi');
  return [...String(source).matchAll(pattern)]
    .map(match => decodeXmlEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()))
    .filter(Boolean);
}

function firstXmlLocalTag(source, names) {
  for (const name of names) {
    const value = xmlLocalTagValues(source, name)[0];
    if (value) return value;
  }
  return '';
}

function parseMeteoPolygon(value) {
  const clean = String(value || '').trim();
  if (!clean) return null;
  const pairs = [];
  const commaPairs = clean.split(/\s+/).map(token => token.split(',').map(Number));
  if (commaPairs.length >= 3 && commaPairs.every(pair => pair.length === 2 && pair.every(Number.isFinite))) {
    for (const [lat, lon] of commaPairs) if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) pairs.push([lon, lat]);
  } else {
    const values = (clean.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    for (let i = 0; i + 1 < values.length; i += 2) {
      const lat = values[i], lon = values[i + 1];
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) pairs.push([lon, lat]);
    }
  }
  if (pairs.length < 3) return null;
  const first = pairs[0], last = pairs[pairs.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) pairs.push([...first]);
  return { type: 'Polygon', coordinates: [pairs] };
}

function parseMeteoCircle(value) {
  const match = String(value || '').trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s+([\d.]+)/);
  if (!match) return null;
  const lat = Number(match[1]), lon = Number(match[2]), radiusKm = Number(match[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radiusKm) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || radiusKm <= 0 || radiusKm > 500) return null;
  const points = [];
  for (let i = 0; i <= 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const dLat = (radiusKm / 111.32) * Math.sin(angle);
    const dLon = (radiusKm / (111.32 * Math.max(.15, Math.cos(lat * Math.PI / 180)))) * Math.cos(angle);
    points.push([lon + dLon, Math.max(-90, Math.min(90, lat + dLat))]);
  }
  return { type: 'Polygon', coordinates: [points] };
}

function parseMeteoAlarmAtom(xml, country) {
  const entries = [...String(xml).matchAll(/<(?:[\w.-]+:)?entry\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?entry\s*>/gi)].map(match => match[1]);
  const features = [];
  for (const rawEntry of entries) {
    const decodedEntry = decodeXmlEntities(rawEntry);
    const entry = xmlLocalTagValues(rawEntry, 'polygon').length || xmlLocalTagValues(rawEntry, 'circle').length ? rawEntry : decodedEntry;
    const title = firstXmlLocalTag(entry, ['headline', 'title', 'event']) || `Weather warning — ${country}`;
    const event = firstXmlLocalTag(entry, ['event']) || title;
    const severity = firstXmlLocalTag(entry, ['severity', 'awareness_level', 'awarenessLevel']) || 'Not specified';
    const area = firstXmlLocalTag(entry, ['areaDesc', 'area', 'geographicalName']) || country;
    const description = firstXmlLocalTag(entry, ['description', 'summary']) || '';
    const effective = firstXmlLocalTag(entry, ['effective', 'onset']) || '';
    const expires = firstXmlLocalTag(entry, ['expires', 'ends']) || '';
    const geometries = [
      ...xmlLocalTagValues(entry, 'polygon').map(parseMeteoPolygon).filter(Boolean),
      ...xmlLocalTagValues(entry, 'circle').map(parseMeteoCircle).filter(Boolean),
      ...xmlLocalTagValues(entry, 'posList').map(parseMeteoPolygon).filter(Boolean),
      ...xmlLocalTagValues(entry, 'point').map(value => {
        const nums = (value.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
        if (nums.length < 2) return null;
        const [lat, lon] = nums;
        return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { type: 'Point', coordinates: [lon, lat] } : null;
      }).filter(Boolean)
    ];
    let url = '';
    const href = entry.match(/<(?:(?:[\w.-]+):)?link\b[^>]*href=["']([^"']+)["']/i);
    if (href) url = decodeXmlEntities(href[1]);
    const properties = {
      title, event, severity, area, description, effective, expires, country,
      url: /^https:\/\//i.test(url) ? url : 'https://www.meteoalarm.org/en/live/'
    };
    for (const geometry of geometries) features.push({ type: 'Feature', geometry, properties });
  }
  return features;
}

function isUsPoint(lat, lon) {
  // Conservative CONUS + Alaska + Hawaii + Puerto Rico envelope. Border areas
  // may still be outside NWS coverage; the upstream response is treated safely.
  const conus = lat >= 24 && lat <= 50.5 && lon >= -125 && lon <= -66;
  const alaska = lat >= 51 && lat <= 72 && lon >= -180 && lon <= -129;
  const hawaii = lat >= 18 && lat <= 23 && lon >= -161 && lon <= -154;
  const puertoRico = lat >= 17.5 && lat <= 18.7 && lon >= -68 && lon <= -65;
  return conus || alaska || hawaii || puertoRico;
}

const PROVIDERS = [
  { id: 'forecast', name: 'Open-Meteo', category: 'Global forecast', url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74&current=temperature_2m', note: 'Worldwide weather and forecast data; attribution is required.' },
  { id: 'radar', name: 'RainViewer', category: 'Global radar mosaic', url: 'https://api.rainviewer.com/public/weather-maps.json', note: 'Community-aggregated radar tiles; coverage varies by country.' },
  { id: 'nws', name: 'US National Weather Service', category: 'US official alerts', url: 'https://api.weather.gov/alerts/active?limit=1', note: 'Official machine-readable warning feed for supported US locations.' },
  { id: 'wmo', name: 'WMO Severe Weather Information Centre', category: 'Global warning hub', url: 'https://severeweather.wmo.int/', note: 'Global warning hub; feed completeness depends on each member service.' },
  { id: 'meteoalarm', name: 'MeteoAlarm', category: 'European warnings', url: 'https://www.meteoalarm.org/en/live/', note: 'Regional warning view for participating European meteorological services.' },
  { id: 'canada', name: 'Environment and Climate Change Canada', category: 'Canadian warnings', url: 'https://weather.gc.ca/warnings/index_e.html', note: 'Official Canadian weather warning portal.' },
  { id: 'bom', name: 'Australian Bureau of Meteorology', category: 'Australian warnings', url: 'https://www.bom.gov.au/weather-and-climate/warnings-and-alerts', note: 'Official Australian weather and warning products.' },
  { id: 'lightning', name: 'LightningMaps.org', category: 'Community lightning detections', url: 'https://www.lightningmaps.org/', note: 'Community lightning network, not an official warning authority.' },
  { id: 'spc', name: 'Storm Prediction Center', category: 'US convective outlooks', url: 'https://www.spc.noaa.gov/products/outlook/', note: 'Official US convective outlooks and preliminary storm reports.' },
];

async function probe(provider) {
  const start = Date.now();
  try {
    const response = await fetch(provider.url, {
      method: provider.id === 'forecast' || provider.id === 'radar' || provider.id === 'nws' ? 'GET' : 'GET',
      headers: { Accept: provider.id === 'forecast' || provider.id === 'radar' || provider.id === 'nws' ? 'application/json,*/*' : 'text/html,*/*', 'User-Agent': 'AtmosWeatherDesk/2.0 (weather dashboard; contact via source project)' },
      signal: AbortSignal.timeout(5000),
    });
    const result = {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      url: provider.url,
      note: provider.note,
      status: response.ok ? 'up' : (response.status === 429 || response.status >= 500 ? 'degraded' : 'reachable'),
      httpStatus: response.status,
      latencyMs: Date.now() - start,
    };
    // No need to download large HTML pages simply to measure availability.
    try { response.body?.cancel(); } catch {}
    return result;
  } catch (error) {
    return {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      url: provider.url,
      note: provider.note,
      status: 'unreachable',
      httpStatus: null,
      latencyMs: Date.now() - start,
      error: error?.name === 'TimeoutError' ? 'Request timed out' : 'Provider could not be reached from the status checker',
    };
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const route = parts[0] || 'health';

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return json(res, 405, { error: 'Method not allowed' }, 'no-store');
  }

  try {
    if (route === 'health') {
      return json(res, 200, { service: 'Atmos shared API dispatcher', status: 'ok', serverTime: new Date().toISOString(), functionCount: 1 }, 'no-store');
    }

    if (route === 'forecast') {
      const lat = numberParam(url.searchParams.get('lat'), -MAX_COORDINATE_LAT, MAX_COORDINATE_LAT);
      const lon = numberParam(url.searchParams.get('lon'), -MAX_COORDINATE_LON, MAX_COORDINATE_LON);
      if (lat == null || lon == null) return json(res, 400, { error: 'Valid lat and lon are required.' }, 'no-store');
      const units = url.searchParams.get('units') === 'fahrenheit' ? 'fahrenheit' : 'celsius';
      const wind = units === 'fahrenheit' ? 'mph' : 'kmh';
      const query = new URLSearchParams({
        latitude: String(lat), longitude: String(lon), current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_gusts_10m_max',
        temperature_unit: units, wind_speed_unit: wind, timezone: 'auto', forecast_days: '7', forecast_hours: '24'
      });
      const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${query}`, { timeout: 9500 });
      return json(res, 200, data, 'public, s-maxage=300, stale-while-revalidate=600');
    }

    if (route === 'geocode') {
      const q = (url.searchParams.get('q') || '').trim();
      if (q.length < 2 || q.length > 100) return json(res, 400, { error: 'Enter at least two characters.' }, 'no-store');
      const query = new URLSearchParams({ name: q, count: '8', language: 'en', format: 'json' });
      const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${query}`, { timeout: 8000 });
      return json(res, 200, { results: (data.results || []).map((x) => ({ name: x.name, admin1: x.admin1, country: x.country, country_code: x.country_code, latitude: x.latitude, longitude: x.longitude, timezone: x.timezone })) }, 'public, s-maxage=3600, stale-while-revalidate=86400');
    }

    if (route === 'reverse') {
      const lat = numberParam(url.searchParams.get('lat'), -90, 90);
      const lon = numberParam(url.searchParams.get('lon'), -180, 180);
      if (lat == null || lon == null) return json(res, 400, { error: 'Valid lat and lon are required.' }, 'no-store');
      const reverseUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
      reverseUrl.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), localityLanguage: 'en' }).toString();
      const data = await fetchJson(reverseUrl.toString(), { timeout: 8000, headers: { Accept: 'application/json' } });
      return json(res, 200, { name: data.city || data.locality || data.principalSubdivision || 'Selected location', admin1: data.principalSubdivision, country: data.countryName, country_code: data.countryCode, latitude: lat, longitude: lon }, 'public, s-maxage=86400, stale-while-revalidate=604800');
    }

    if (route === 'radar') {
      const data = await fetchJson('https://api.rainviewer.com/public/weather-maps.json', { timeout: 8000 });
      return json(res, 200, data, 'public, s-maxage=180, stale-while-revalidate=300');
    }

    if (route === 'alerts') {
      const lat = numberParam(url.searchParams.get('lat'), -90, 90);
      const lon = numberParam(url.searchParams.get('lon'), -180, 180);
      const country = (url.searchParams.get('country') || '').trim().toUpperCase().slice(0, 2);
      if (lat == null || lon == null) return json(res, 400, { error: 'Choose a location first.' }, 'no-store');
      if (country === 'US' || (!country && isUsPoint(lat, lon))) {
        const query = new URLSearchParams({ point: `${lat},${lon}`, status: 'actual', message_type: 'alert' });
        const data = await fetchJson(`https://api.weather.gov/alerts/active?${query}`, { timeout: 9000, headers: { Accept: 'application/geo+json, application/json', 'User-Agent': 'AtmosWeatherDesk/2.0' } });
        const features = (data.features || []).map((feature) => {
          const p = feature.properties || {};
          return {
            id: feature.id || p.id || `${p.event}-${p.sent}`,
            event: p.event || 'Weather alert', headline: p.headline || p.event || 'Weather alert', description: p.description || '', instruction: p.instruction || '',
            severity: p.severity || 'Unknown', urgency: p.urgency || 'Unknown', area: p.areaDesc || 'Area not specified', onset: p.onset || p.effective || null,
            expires: p.expires || p.ends || null, sent: p.sent || p.created || null, sender: p.senderName || 'National Weather Service', url: p.web || feature.id || 'https://www.weather.gov/'
          };
        });
        return json(res, 200, { supported: true, provider: 'US National Weather Service', country: 'US', alerts: features, checkedAt: new Date().toISOString(), sourceUrl: 'https://www.weather.gov/' }, 'public, s-maxage=60, stale-while-revalidate=120');
      }
      const portalMap = {
        CA: { name: 'Environment and Climate Change Canada', url: 'https://weather.gc.ca/warnings/index_e.html', detail: 'Canadian national alerts are available from the official portal. A consistent coordinates-based public API is not integrated here.' },
        GB: { name: 'UK Met Office', url: 'https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings', detail: 'Use the Met Office for official UK weather warnings.' },
        IE: { name: 'Met Éireann', url: 'https://www.met.ie/warnings', detail: 'Use Met Éireann for official Irish weather warnings.' },
        AU: { name: 'Australian Bureau of Meteorology', url: 'https://www.bom.gov.au/weather-and-climate/warnings-and-alerts', detail: 'Use the Bureau of Meteorology for official Australian warnings.' },
        NZ: { name: 'MetService New Zealand', url: 'https://www.metservice.com/warnings/home', detail: 'Use MetService for official New Zealand weather warnings.' },
        JP: { name: 'Japan Meteorological Agency', url: 'https://www.jma.go.jp/bosai/map.html#contents=warning', detail: 'Use JMA for official Japanese warnings.' },
        IN: { name: 'India Meteorological Department', url: 'https://mausam.imd.gov.in/', detail: 'Use IMD for official Indian forecasts and warnings.' },
      };
      const portal = portalMap[country] || { name: 'WMO Severe Weather Information Centre', url: 'https://severeweather.wmo.int/', detail: 'Use the WMO global warning hub and the national meteorological authority. Direct in-app local warning feeds are not available for this country yet.' };
      return json(res, 200, { supported: false, provider: portal.name, country: country || 'Unknown', alerts: [], checkedAt: new Date().toISOString(), sourceUrl: portal.url, message: portal.detail }, 'public, s-maxage=120, stale-while-revalidate=300');
    }

    if (route === 'meteoalarm') {
      // MeteoAlarm's newer EDR location-query endpoints require a re-user token;
      // use the listed legacy Atom feeds, and preserve partial coverage when one feed fails.
      const checkedAt = new Date().toISOString();
      const results = await Promise.allSettled(METEOALARM_FEEDS.map(async ([slug, country]) => {
        const feedUrl = `https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-${slug}`;
        const { text: xml } = await fetchText(feedUrl, {
          timeout: 4500,
          headers: { Accept: 'application/atom+xml, application/xml;q=0.9, */*;q=0.7' }
        });
        return { country, features: parseMeteoAlarmAtom(xml, country) };
      }));
      const successful = results.filter(result => result.status === 'fulfilled');
      const failedFeeds = results.length - successful.length;
      const features = successful.flatMap(result => result.value.features);
      const unique = new Map();
      for (const feature of features) {
        const p = feature.properties || {};
        const key = `${p.country}|${p.title}|${p.area}|${JSON.stringify(feature.geometry)}`;
        if (!unique.has(key)) unique.set(key, feature);
      }
      const finalFeatures = [...unique.values()];
      return json(res, 200, {
        provider: 'MeteoAlarm country Atom feeds',
        attribution: 'MeteoAlarm / EUMETNET member national weather services',
        available: successful.length > 0,
        checkedAt,
        feedCount: results.length,
        successfulFeeds: successful.length,
        failedFeeds,
        features: finalFeatures,
        message: successful.length === 0
          ? 'MeteoAlarm feeds could not be reached. Open the official live map instead.'
          : finalFeatures.length === 0
            ? 'Country feeds were reachable but did not provide geographic areas that could be plotted. Open the official live map for details.'
            : ''
      }, 'public, s-maxage=240, stale-while-revalidate=480');
    }

    if (route === 'reports') {
      try {
        const { text: html } = await fetchText('https://www.spc.noaa.gov/climo/reports/today.html', { timeout: 6000 });
        const plain = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
        const index = plain.toLowerCase().indexOf('tornado');
        const excerpt = index >= 0 ? plain.slice(Math.max(0, index - 180), Math.min(plain.length, index + 1200)) : plain.slice(0, 1400);
        return json(res, 200, { available: true, source: 'Storm Prediction Center', excerpt, sourceUrl: 'https://www.spc.noaa.gov/climo/reports/today.html', fetchedAt: new Date().toISOString() }, 'public, s-maxage=300, stale-while-revalidate=600');
      } catch {
        return json(res, 200, { available: false, source: 'Storm Prediction Center', sourceUrl: 'https://www.spc.noaa.gov/climo/reports/today.html', message: 'The SPC report page could not be retrieved by the automated checker. Open the official report page for the live list.', fetchedAt: new Date().toISOString() }, 'public, s-maxage=120, stale-while-revalidate=300');
      }
    }

    if (route === 'status') {
      const checkedAt = new Date().toISOString();
      const results = await Promise.all(PROVIDERS.map(probe));
      const tally = { up: results.filter(x => x.status === 'up').length, degraded: results.filter(x => x.status === 'degraded' || x.status === 'reachable').length, unreachable: results.filter(x => x.status === 'unreachable').length };
      const overall = tally.unreachable === results.length ? 'outage' : tally.unreachable || tally.degraded ? 'partial' : 'operational';
      return json(res, 200, { checkedAt, overall, tally, services: results, application: { status: 'up', name: 'Atmos static frontend', note: 'Served by Vercel static hosting; this check validates the shared API dispatcher.' } }, 'public, s-maxage=20, stale-while-revalidate=30');
    }

    return json(res, 404, { error: `Unknown API route: ${route}` }, 'no-store');
  } catch (error) {
    const message = error?.message || 'Unexpected upstream error';
    return json(res, 502, { error: 'Upstream data request failed', detail: message, route, retryable: true }, 'no-store');
  }
}
