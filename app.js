(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORE_KEY = 'atmos-worldwide-preferences-v2';
  const DEFAULT_ACCENT = '#8ce0c2';
  const THEMES = ['midnight', 'storm', 'glacier', 'daylight', 'radar', 'ember', 'aurora', 'paper'];
  const REGION_PRESETS = {
    'north-america': { center: [39, -98], zoom: 3, label: 'North America' },
    europe: { center: [51, 13], zoom: 4, label: 'Europe' },
    asia: { center: [33, 105], zoom: 3, label: 'Asia' },
    oceania: { center: [-25, 145], zoom: 3, label: 'Oceania' },
  };
  const OFFICIAL_SOURCES = [
    { region: 'North America', name: 'US National Weather Service', description: 'Official forecasts, watches, warnings and advisories for supported US points.', url: 'https://www.weather.gov/', country: 'US' },
    { region: 'North America', name: 'Environment and Climate Change Canada', description: 'Official Canadian forecasts, alerts, radar and local weather warnings.', url: 'https://weather.gc.ca/warnings/index_e.html', country: 'CA' },
    { region: 'North America', name: 'Mexico SMN / CONAGUA', description: 'Official Mexican forecasts and meteorological bulletins.', url: 'https://smn.conagua.gob.mx/', country: 'MX' },
    { region: 'Europe', name: 'MeteoAlarm', description: 'Regional warning overview from participating European weather services.', url: 'https://www.meteoalarm.org/en/live/', country: 'EU' },
    { region: 'Europe', name: 'UK Met Office', description: 'Official UK weather warnings, including rain, wind, snow and thunderstorms.', url: 'https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings', country: 'GB' },
    { region: 'Europe', name: 'Met Éireann', description: 'Official Ireland weather warnings and forecast information.', url: 'https://www.met.ie/warnings', country: 'IE' },
    { region: 'Asia', name: 'Japan Meteorological Agency', description: 'Official Japanese warnings, typhoon information and hazard maps.', url: 'https://www.jma.go.jp/bosai/map.html#contents=warning', country: 'JP' },
    { region: 'Asia', name: 'India Meteorological Department', description: 'Official Indian weather warnings, rainfall and cyclone information.', url: 'https://mausam.imd.gov.in/', country: 'IN' },
    { region: 'Asia', name: 'Korea Meteorological Administration', description: 'Official South Korean weather forecasts and severe-weather information.', url: 'https://www.weather.go.kr/w/index.do', country: 'KR' },
    { region: 'Asia', name: 'China National Meteorological Centre', description: 'Official Chinese national weather warnings and forecasts.', url: 'http://www.nmc.cn/publish/weather-warning.html', country: 'CN' },
    { region: 'Oceania', name: 'Australian Bureau of Meteorology', description: 'Official Australian weather, marine, flood and severe-weather warnings.', url: 'https://www.bom.gov.au/weather-and-climate/warnings-and-alerts', country: 'AU' },
    { region: 'Oceania', name: 'MetService New Zealand', description: 'Official New Zealand weather warnings and forecasts.', url: 'https://www.metservice.com/warnings/home', country: 'NZ' },
    { region: 'Oceania', name: 'Fiji Meteorological Service', description: 'Official Fiji tropical cyclone, severe-weather and marine updates.', url: 'https://www.met.gov.fj/', country: 'FJ' },
    { region: 'Global', name: 'WMO Severe Weather Information Centre', description: 'Global CAP warning hub; completeness depends on each national service.', url: 'https://severeweather.wmo.int/', country: 'WORLD' },
  ];

  const CHANNELS = [
    { name: "Ryan Hall, Y'all", initials: 'RH', type: 'meteorologist', label: 'Meteorologist / live coverage', description: 'Severe-weather briefings and live storm coverage focused largely on the United States.', url: 'https://www.youtube.com/@RyanHallYall' },
    { name: 'Reed Timmer', initials: 'RT', type: 'chaser', label: 'Extreme storm chasing', description: 'Field footage, tornado intercepts, and storm-science content.', url: 'https://www.youtube.com/@ReedTimmerWx' },
    { name: 'Storm of Passion', initials: 'SP', type: 'chaser', label: 'Storm chasing / live weather', description: 'Storm footage and severe-weather livestreams.', url: 'https://www.youtube.com/results?search_query=Storm+Of+Passion+weather' },
    { name: 'Pecos Hank', initials: 'PH', type: 'chaser', label: 'Storm cinematography', description: 'Storm and tornado cinematography with educational context.', url: 'https://www.youtube.com/@pecoshank' },
    { name: 'Max Velocity', initials: 'MV', type: 'meteorologist', label: 'Weather forecasts / live updates', description: 'Severe-weather outlooks, forecast breakdowns, and live updates.', url: 'https://www.youtube.com/@MaxVelocityWX' },
    { name: 'Convective Chronicles', initials: 'CC', type: 'meteorologist', label: 'Severe-weather education', description: 'Convective forecasting, storm modes, and severe-weather analysis.', url: 'https://www.youtube.com/@ConvectiveChronicles' },
    { name: 'The Weather Channel', initials: 'TWC', type: 'official', label: 'Weather network', description: 'Forecast coverage, weather explainers, and major event reporting.', url: 'https://www.youtube.com/@TheWeatherChannel' },
    { name: 'NOAA / NWS', initials: 'NWS', type: 'official', label: 'Official US weather agency', description: 'Official forecast, warning, safety and education resources.', url: 'https://www.youtube.com/@NOAA' },
    { name: 'Met Office', initials: 'MO', type: 'official', label: 'Official UK weather agency', description: 'UK forecasts, weather science, warnings, and public safety guidance.', url: 'https://www.youtube.com/@metoffice' },
    { name: 'Environment Canada', initials: 'EC', type: 'official', label: 'Official Canadian weather agency', description: 'Canadian weather science, climate, forecast and severe-weather updates.', url: 'https://www.youtube.com/user/EnvironmentCanada' },
    { name: 'Bureau of Meteorology', initials: 'BOM', type: 'official', label: 'Official Australian weather agency', description: 'Australian warnings, cyclone outlooks, and forecast explanations.', url: 'https://www.youtube.com/user/BureauOfMeteorology' },
    { name: 'MetService New Zealand', initials: 'MS', type: 'official', label: 'Official New Zealand weather agency', description: 'New Zealand forecasts, severe weather and public safety information.', url: 'https://www.youtube.com/@MetService' },
  ];

  const WMO_CODES = {
    0: ['Clear sky', '☀'], 1: ['Mainly clear', '🌤'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁'],
    45: ['Fog', '≋'], 48: ['Freezing fog', '≋'], 51: ['Light drizzle', '☂'], 53: ['Drizzle', '☂'], 55: ['Dense drizzle', '☂'],
    56: ['Freezing drizzle', '❄'], 57: ['Heavy freezing drizzle', '❄'], 61: ['Light rain', '🌧'], 63: ['Rain', '🌧'], 65: ['Heavy rain', '🌧'],
    66: ['Freezing rain', '❄'], 67: ['Heavy freezing rain', '❄'], 71: ['Light snow', '❄'], 73: ['Snow', '❄'], 75: ['Heavy snow', '❄'], 77: ['Snow grains', '❄'],
    80: ['Rain showers', '🌦'], 81: ['Showers', '🌦'], 82: ['Heavy showers', '🌧'], 85: ['Snow showers', '🌨'], 86: ['Heavy snow showers', '🌨'],
    95: ['Thunderstorm', '⛈'], 96: ['Thunderstorm with hail', '⛈'], 99: ['Severe thunderstorm with hail', '⛈'],
  };

  const app = {
    preferences: loadPreferences(),
    maps: {},
    radarFrames: [],
    radarLayer: null,
    radarIndex: 0,
    radarPlaying: false,
    radarTimer: null,
    alertTimer: null,
    currentAlerts: [],
    knownAlertIds: new Set(),
    channelFilter: 'all',
    channelSearch: '',
    selectedRegion: 'World',
    radarBase: true,
  };

  function loadPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return {
        location: stored.location || null,
        theme: THEMES.includes(stored.theme) ? stored.theme : 'midnight',
        accent: /^#[0-9a-f]{6}$/i.test(stored.accent || '') ? stored.accent : DEFAULT_ACCENT,
        units: stored.units === 'fahrenheit' ? 'fahrenheit' : 'celsius',
        notify: { tornado: true, thunderstorm: true, flood: true, severe: true, ...(stored.notify || {}) },
        polling: [120000, 300000, 600000].includes(stored.polling) ? stored.polling : 120000,
      };
    } catch { return { location: null, theme: 'midnight', accent: DEFAULT_ACCENT, units: 'celsius', notify: { tornado: true, thunderstorm: true, flood: true, severe: true }, polling: 120000 }; }
  }

  function savePreferences() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(app.preferences)); } catch { /* private browsing can disable storage */ }
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function toast(title, message, type = 'info') {
    const region = $('#toast-region');
    if (!region) return;
    const node = document.createElement('div');
    node.className = 'toast';
    node.dataset.type = type;
    node.innerHTML = `<b>${escapeHTML(title)}</b><span>${escapeHTML(message)}</span>`;
    region.append(node);
    window.setTimeout(() => node.remove(), 6000);
  }

  async function api(route, query = {}) {
    const url = new URL(`/api/${route}`, window.location.origin);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    let data;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) throw new Error(data.detail || data.error || `Request failed (${response.status})`);
    return data;
  }

  function applyTheme() {
    const theme = THEMES.includes(app.preferences.theme) ? app.preferences.theme : 'midnight';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty('--accent', app.preferences.accent || DEFAULT_ACCENT);
    document.documentElement.style.setProperty('--accent-strong', app.preferences.accent || DEFAULT_ACCENT);
    const accent = app.preferences.accent || DEFAULT_ACCENT;
    const rgb = hexToRgb(accent);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .12)`);
    if ($('#theme-select')) $('#theme-select').value = theme;
    if ($('#accent-color')) $('#accent-color').value = accent;
    if ($('#units-select')) $('#units-select').value = app.preferences.units;
    if ($('#polling-select')) $('#polling-select').value = String(app.preferences.polling);
    for (const [key, el] of [['tornado', $('#notify-tornado')], ['thunderstorm', $('#notify-thunderstorm')], ['flood', $('#notify-flood')], ['severe', $('#notify-severe')]]) if (el) el.checked = !!app.preferences.notify[key];
  }

  function hexToRgb(hex) {
    const clean = (hex || DEFAULT_ACCENT).replace('#', '');
    const n = parseInt(clean, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function renderClock() {
    const now = new Date();
    $('#clock-label').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    $('#today-date').textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  }

  function setView(viewName) {
    const known = ['overview', 'radar', 'alerts', 'outlooks', 'lightning', 'reports', 'channels', 'status', 'settings'];
    if (!known.includes(viewName)) viewName = 'overview';
    for (const button of $$('.nav-item')) button.classList.toggle('active', button.dataset.view === viewName);
    for (const panel of $$('[data-panel]')) panel.classList.toggle('hidden', panel.dataset.panel !== viewName);
    const labels = { overview: 'Overview', radar: 'Radar & satellite', alerts: 'Warning desk', outlooks: 'Outlooks', lightning: 'Lightning detector', reports: 'Spotter reports', channels: 'Weather channels', status: 'Service status', settings: 'Preferences' };
    $('#page-crumb').textContent = labels[viewName];
    $('#sidebar').classList.remove('open');
    if (viewName === 'status') loadStatus();
    if (viewName === 'reports') loadReports();
    window.setTimeout(() => Object.values(app.maps).forEach(map => { try { map.invalidateSize(); } catch {} }), 80);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goTo(viewName) { setView(viewName); }

  function showLocationModal(show = true) { $('#location-modal')?.classList.toggle('hidden', !show); }

  function updateLocationUI() {
    const loc = app.preferences.location;
    const label = loc ? [loc.name, loc.admin1].filter(Boolean).join(', ') : 'Choose location';
    $('#location-pill-label').textContent = label;
    $('#weather-place').textContent = loc ? [loc.name, loc.admin1].filter(Boolean).join(', ') : 'Choose a location';
    $('#settings-location-name').textContent = loc ? [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ') : 'World view';
    $('#settings-location-coords').textContent = loc ? `${Number(loc.latitude).toFixed(3)}, ${Number(loc.longitude).toFixed(3)} · ${loc.country_code || 'Country unknown'}` : 'No personal location stored';
    if (!loc) {
      $('#current-temperature').innerHTML = '—<span>°</span>';
      $('#current-description').textContent = 'Location needed for local weather';
      $('#weather-symbol').textContent = '☁';
      $('#feels-like').textContent = '—';
      $('#wind-value').textContent = '—'; $('#humidity-value').textContent = '—'; $('#precip-value').textContent = '—';
      $('#weather-updated').textContent = 'Weather data is not loaded yet.';
      $('#alert-count').textContent = '—'; $('#sidebar-alert-count').textContent = '—';
      $('#watch-latest').innerHTML = '<span class="soft-status-dot"></span><span>Select a location to check nearby warning coverage.</span>';
      $('#alerts-status-banner').innerHTML = '<span class="alert-banner-icon">△</span><div><b>Location not set</b><span>Choose your location to check local warning coverage.</span></div><button class="button button-ghost" id="alerts-set-location">Set location</button>';
      $('#alerts-set-location')?.addEventListener('click', () => showLocationModal(true));
      $('#alerts-feed-tag').textContent = 'NO LOCATION';
      $('#alerts-list').innerHTML = '<div class="empty-state"><span>△</span><b>No location selected</b><p>Set a location to query compatible official alert feeds.</p></div>';
      return;
    }
    loadForecast();
    loadAlerts({ initial: true });
    centerMaps([Number(loc.latitude), Number(loc.longitude)], 6);
    startAlertPolling();
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) { toast('Location unavailable', 'This browser does not provide geolocation. Search for a city instead.'); return; }
    const buttons = [$('#use-location-main'), $('#settings-use-location'), $('#modal-use-location'), $('#radar-locate')].filter(Boolean);
    buttons.forEach(button => { button.disabled = true; });
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude; const longitude = position.coords.longitude;
      try {
        let place;
        try { place = await api('reverse', { lat: latitude, lon: longitude }); }
        catch { place = { name: 'My location', country_code: '', latitude, longitude }; }
        place.latitude = latitude; place.longitude = longitude;
        saveLocation(place);
        showLocationModal(false);
        toast('Location set', 'Atmos is now loading local weather and supported official warnings.');
      } finally { buttons.forEach(button => { button.disabled = false; }); }
    }, (error) => {
      buttons.forEach(button => { button.disabled = false; });
      const message = error.code === 1 ? 'Location permission was denied. You can search for a place instead.' : error.code === 3 ? 'The location request timed out. Try again or search for a place.' : 'Your location could not be determined. Search for a place instead.';
      toast('Could not get location', message, 'error');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  }

  function saveLocation(place) {
    app.preferences.location = {
      name: place.name || place.city || 'Selected location', admin1: place.admin1 || '', country: place.country || '',
      country_code: (place.country_code || place.countryCode || '').toUpperCase(), latitude: Number(place.latitude), longitude: Number(place.longitude), timezone: place.timezone || '',
    };
    if (!Number.isFinite(app.preferences.location.latitude) || !Number.isFinite(app.preferences.location.longitude)) {
      app.preferences.location = null;
      toast('Location was not saved', 'The selected place did not return valid coordinates.', 'error');
      return;
    }
    savePreferences();
    updateLocationUI();
  }

  async function searchPlaces(inputSelector, resultsSelector) {
    const input = $(inputSelector); const resultsNode = $(resultsSelector);
    const query = input?.value.trim();
    if (!query || query.length < 2) { toast('Enter a place', 'Search for at least two characters.'); return; }
    resultsNode.innerHTML = '<div class="loading-row"><span class="loader"></span>Searching worldwide places…</div>';
    try {
      const data = await api('geocode', { q: query });
      const results = data.results || [];
      if (!results.length) { resultsNode.innerHTML = '<div class="subtle-line">No matches found. Try a city, town or region name.</div>'; return; }
      resultsNode.innerHTML = results.map((place, index) => `<button class="search-result" type="button" data-place-index="${index}"><span>${escapeHTML([place.name, place.admin1].filter(Boolean).join(', '))}</span><small>${escapeHTML(place.country || place.country_code || '')}</small></button>`).join('');
      $$('.search-result', resultsNode).forEach(button => button.addEventListener('click', () => {
        const place = results[Number(button.dataset.placeIndex)];
        saveLocation(place); showLocationModal(false); resultsNode.innerHTML = '';
        if (input) input.value = '';
        toast('Location set', `Weather desk centered on ${place.name}${place.country ? `, ${place.country}` : ''}.`);
      }));
    } catch (error) {
      resultsNode.innerHTML = `<div class="subtle-line">Place search failed: ${escapeHTML(error.message)}. Check your connection and try again.</div>`;
    }
  }

  async function loadForecast() {
    const loc = app.preferences.location;
    if (!loc) return;
    $('#current-description').textContent = 'Loading current conditions…';
    try {
      const data = await api('forecast', { lat: loc.latitude, lon: loc.longitude, units: app.preferences.units });
      const current = data.current || {};
      const [description, symbol] = WMO_CODES[current.weather_code] || ['Conditions available', '☁'];
      const temp = Math.round(current.temperature_2m);
      const feels = Math.round(current.apparent_temperature);
      $('#current-temperature').innerHTML = `${temp}<span>°${app.preferences.units === 'fahrenheit' ? 'F' : 'C'}</span>`;
      $('#current-description').textContent = description;
      $('#weather-symbol').textContent = symbol;
      $('#feels-like').textContent = `${feels}°`;
      const windSpeedUnit = data.current_units?.wind_speed_10m || (app.preferences.units === 'fahrenheit' ? 'mph' : 'km/h');
      $('#wind-value').textContent = `${Math.round(current.wind_speed_10m ?? 0)} ${windSpeedUnit}`;
      $('#humidity-value').textContent = `${Math.round(current.relative_humidity_2m ?? 0)}%`;
      const precip = Number(current.precipitation ?? 0);
      $('#precip-value').textContent = `${precip.toFixed(1)} mm`;
      const measuredAt = current.time ? new Date(current.time) : new Date();
      $('#weather-updated').textContent = `Updated ${measuredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} local time`;
      renderForecastStrip(data);
    } catch (error) {
      $('#current-description').textContent = 'Weather provider is temporarily unavailable';
      $('#weather-updated').textContent = `Forecast request failed: ${error.message}`;
      toast('Weather data unavailable', 'The forecast service could not be reached. You can retry after checking service status.');
    }
  }

  function renderForecastStrip(data) {
    // Keep the main card compact; the seven-day summary lives in its own small tray below the weather panel.
    let strip = $('#forecast-strip');
    if (!strip) {
      strip = document.createElement('div'); strip.id = 'forecast-strip'; strip.className = 'forecast-strip';
      const anchor = $('.weather-source-line');
      anchor?.parentElement?.insertBefore(strip, anchor);
    }
    const days = data.daily?.time || [];
    const max = data.daily?.temperature_2m_max || [];
    const min = data.daily?.temperature_2m_min || [];
    const codes = data.daily?.weather_code || [];
    const unit = app.preferences.units === 'fahrenheit' ? '°F' : '°C';
    strip.innerHTML = days.slice(0, 5).map((day, i) => {
      const code = WMO_CODES[codes[i]] || ['Forecast', '·'];
      const date = new Date(`${day}T12:00:00`);
      return `<div class="forecast-day"><small>${i === 0 ? 'TODAY' : escapeHTML(date.toLocaleDateString([], { weekday: 'short' }).toUpperCase())}</small><span>${code[1]}</span><b>${Math.round(max[i])}°</b><small class="forecast-low">${Math.round(min[i])}${unit}</small></div>`;
    }).join('');
  }

  function classifyAlert(alert) {
    const text = `${alert.event || ''} ${alert.headline || ''} ${alert.description || ''}`.toLowerCase();
    if (text.includes('tornado')) return 'tornado';
    if (/(flash flood|flood warning|flood watch|flood advisory)/.test(text)) return 'flood';
    if (/(severe thunderstorm|thunderstorm warning|convective storm)/.test(text)) return 'thunderstorm';
    return alert.severity === 'Extreme' || alert.severity === 'Severe' ? 'severe' : 'other';
  }

  function alertMatchesPreferences(alert) {
    const category = classifyAlert(alert);
    if (category === 'tornado') return !!app.preferences.notify.tornado;
    if (category === 'thunderstorm') return !!app.preferences.notify.thunderstorm;
    if (category === 'flood') return !!app.preferences.notify.flood;
    if (category === 'severe') return !!app.preferences.notify.severe;
    return false;
  }

  async function loadAlerts({ initial = false, fromPoll = false } = {}) {
    const loc = app.preferences.location;
    if (!loc) return;
    if (!fromPoll) $('#alerts-list').innerHTML = '<div class="loading-row"><span class="loader"></span>Querying the official warning source…</div>';
    try {
      const data = await api('alerts', { lat: loc.latitude, lon: loc.longitude, country: loc.country_code });
      app.currentAlerts = data.alerts || [];
      $('#alert-count').textContent = String(app.currentAlerts.length);
      $('#sidebar-alert-count').textContent = String(app.currentAlerts.length);
      $('#alerts-feed-tag').textContent = data.supported ? data.provider : 'OFFICIAL PORTAL';
      $('#alerts-status-banner').innerHTML = `<span class="alert-banner-icon">△</span><div><b>${escapeHTML(data.supported ? `${app.currentAlerts.length} active alert${app.currentAlerts.length === 1 ? '' : 's'} found` : 'Local official portal required')}</b><span>${escapeHTML(data.supported ? `${data.provider} checked at ${new Date(data.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : data.message || 'Open the official warning portal for your region.')}</span></div><a class="button button-ghost" href="${escapeHTML(data.sourceUrl || 'https://severeweather.wmo.int/')}" target="_blank" rel="noopener">Official source ↗</a>`;
      if (data.supported) {
        renderAlertCards(app.currentAlerts);
        const newest = app.currentAlerts[0];
        $('#watch-latest').innerHTML = newest ? `<span class="soft-status-dot" style="background:var(--red)"></span><span><b>${escapeHTML(newest.event)}</b><br>${escapeHTML(newest.area)}</span>` : '<span class="soft-status-dot" style="background:var(--accent)"></span><span>No active alerts returned by this feed at the latest check.</span>';
        if (!initial) notifyNewAlerts(app.currentAlerts);
        else app.currentAlerts.forEach(alert => app.knownAlertIds.add(alert.id));
        updateNotificationHint(data.supported);
      } else {
        $('#alerts-list').innerHTML = `<div class="empty-state"><span>↗</span><b>Use the official ${escapeHTML(data.provider)} portal</b><p>${escapeHTML(data.message || 'This country does not expose an integrated point-based alert feed in Atmos yet.')}</p><a href="${escapeHTML(data.sourceUrl || 'https://severeweather.wmo.int/')}" target="_blank" rel="noopener">Open official source ↗</a></div>`;
        $('#watch-latest').innerHTML = `<span class="soft-status-dot"></span><span>${escapeHTML(data.provider)} is the official source for this location.</span>`;
        updateNotificationHint(false);
      }
    } catch (error) {
      $('#alerts-feed-tag').textContent = 'FEED ERROR';
      $('#alert-count').textContent = '—';
      $('#sidebar-alert-count').textContent = '—';
      $('#alerts-list').innerHTML = `<div class="empty-state"><span>!</span><b>Could not query alert data</b><p>${escapeHTML(error.message)}. No warning status can be inferred from this failed request.</p><a href="https://severeweather.wmo.int/" target="_blank" rel="noopener">Open the WMO global warning hub ↗</a></div>`;
      $('#watch-latest').innerHTML = '<span class="soft-status-dot"></span><span>Warning status unavailable. Check official sources directly.</span>';
      if (!fromPoll) toast('Warning feed unavailable', 'No warning status has been inferred from a failed request.');
    }
  }

  function renderAlertCards(alerts) {
    const node = $('#alerts-list');
    if (!alerts.length) {
      node.innerHTML = '<div class="empty-state"><span>✓</span><b>No active alerts returned</b><p>The NWS feed did not return any active alerts for this point at the latest check. Keep following local official guidance.</p></div>';
      return;
    }
    node.innerHTML = alerts.map(alert => {
      const severity = String(alert.severity || 'unknown').toLowerCase();
      const category = classifyAlert(alert);
      const expires = alert.expires ? `Expires ${new Date(alert.expires).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Expiry not provided';
      const description = (alert.description || '').trim().slice(0, 360);
      return `<article class="alert-card severity-${escapeHTML(severity)}"><div class="alert-card-head"><h3>${escapeHTML(alert.headline || alert.event)}</h3><span class="tag ${category === 'tornado' ? 'tag-red' : category === 'thunderstorm' ? 'tag-purple' : 'tag-subtle'}">${escapeHTML(alert.severity || 'Unknown')}</span></div><div class="alert-meta">${escapeHTML(alert.event)} · ${escapeHTML(expires)}</div><p>${escapeHTML(description || alert.area)}</p><div class="alert-meta">Area: ${escapeHTML(alert.area)}</div><a class="alert-link" href="${escapeHTML(alert.url)}" target="_blank" rel="noopener">Read official alert ↗</a></article>`;
    }).join('');
  }

  function notifyNewAlerts(alerts) {
    const fresh = alerts.filter(alert => alert.id && !app.knownAlertIds.has(alert.id));
    // Store the new IDs even when the browser has no permission, to avoid a blast of old alerts later.
    fresh.forEach(alert => app.knownAlertIds.add(alert.id));
    const eligible = fresh.filter(alertMatchesPreferences);
    if (!eligible.length || Notification.permission !== 'granted') return;
    for (const alert of eligible.slice(0, 3)) {
      try {
        const notification = new Notification(`Atmos · ${alert.event}`, { body: `${alert.area}\n${alert.headline}`, tag: alert.id, icon: '/icon.svg', renotify: false });
        notification.onclick = () => { window.focus(); goTo('alerts'); notification.close(); };
      } catch { /* Notifications may be disabled by the browser or OS. */ }
    }
  }

  function updateNotificationHint(liveSupported) {
    const title = $('#notification-permission-title'); const copy = $('#notification-permission-copy');
    if (!title || !copy) return;
    if (!('Notification' in window)) { title.textContent = 'Notifications unsupported'; copy.textContent = 'This browser does not support web notifications.'; }
    else if (Notification.permission === 'granted') { title.textContent = 'Notifications enabled'; copy.textContent = liveSupported ? 'NWS location alert checks will run while this page remains active.' : 'Permission is enabled, but location-based automatic checks are not integrated for this region.'; }
    else if (Notification.permission === 'denied') { title.textContent = 'Notifications blocked'; copy.textContent = 'Change the site notification permission in your browser settings to enable them.'; }
    else { title.textContent = 'Permission not requested'; copy.textContent = 'Your browser will ask before desktop notifications can be sent.'; }
    $('#notification-dot')?.classList.toggle('on', 'Notification' in window && Notification.permission === 'granted');
  }

  async function enableNotifications() {
    if (!('Notification' in window)) { toast('Not supported', 'This browser does not support desktop web notifications.'); return; }
    try {
      const permission = await Notification.requestPermission();
      updateNotificationHint(!!app.preferences.location && app.preferences.location.country_code === 'US');
      if (permission === 'granted') {
        toast('Notifications enabled', 'Atmos can show new alerts from the live feeds it supports while the page is open.');
        if (app.preferences.location) await loadAlerts({ initial: true });
        startAlertPolling();
      } else toast('Notifications not enabled', 'You can change permission in your browser settings.');
    } catch { toast('Could not request permission', 'Try enabling notifications in your browser settings.'); }
  }

  function startAlertPolling() {
    if (app.alertTimer) window.clearInterval(app.alertTimer);
    const loc = app.preferences.location;
    // Official point-query polling is integrated for US NWS locations only. International sources stay linked to their official portals.
    if (!loc || loc.country_code !== 'US' || !('Notification' in window) || Notification.permission !== 'granted') return;
    app.alertTimer = window.setInterval(() => loadAlerts({ fromPoll: true }), app.preferences.polling);
  }

  function setupMaps() {
    if (!window.L) {
      $('#radar-status').textContent = 'Map library unavailable';
      $('#radar-status-large').textContent = 'Map library unavailable';
      $('#overview-map').innerHTML = '<div class="map-fallback">The map library did not load. Check your internet connection, then refresh the page.</div>';
      $('#radar-map').innerHTML = '<div class="map-fallback">The map library did not load. Check your internet connection, then refresh the page.</div>';
      return;
    }
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    for (const id of ['overview-map', 'radar-map']) {
      const map = L.map(id, { zoomControl: true, worldCopyJump: true, minZoom: 2, maxZoom: 15 }).setView([20, 0], 2);
      const base = L.tileLayer(tileUrl, { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' });
      base.addTo(map);
      map._atmosBaseLayer = base;
      map._atmosRadarLayer = null;
      app.maps[id] = map;
    }
    loadRadarFrames();
  }

  async function loadRadarFrames() {
    try {
      const data = await api('radar');
      app._radarData = data;
      const past = data.radar?.past || [];
      const nowcast = data.radar?.nowcast || [];
      app.radarFrames = [...past, ...nowcast].filter((frame, index, arr) => arr.findIndex(x => x.time === frame.time) === index).sort((a, b) => a.time - b.time);
      if (!app.radarFrames.length) throw new Error('No radar frames were supplied by the provider.');
      app.radarIndex = Math.max(0, past.length - 1);
      const timeline = $('#radar-timeline');
      timeline.max = String(Math.max(0, app.radarFrames.length - 1));
      timeline.value = String(app.radarIndex);
      showRadarFrame(app.radarIndex);
      $('#radar-status').textContent = 'Radar frames available';
      $('#radar-status-large').textContent = `RainViewer · ${past.length} recent frames`;
    } catch (error) {
      $('#radar-status').textContent = 'Radar feed unavailable';
      $('#radar-status-large').textContent = 'Radar feed unavailable';
      toast('Radar feed unavailable', 'The global mosaic could not be loaded. The map remains available without radar overlay.');
    }
  }

  function showRadarFrame(index) {
    if (!app.radarFrames.length) return;
    app.radarIndex = Math.min(Math.max(0, Number(index) || 0), app.radarFrames.length - 1);
    const frame = app.radarFrames[app.radarIndex];
    const time = new Date(frame.time * 1000);
    $('#radar-frame-time').textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    $('#radar-timeline').value = String(app.radarIndex);
    const data = app._radarData;
    const path = frame.path;
    for (const map of Object.values(app.maps)) {
      if (map._atmosRadarLayer) map.removeLayer(map._atmosRadarLayer);
      if (!app.radarBase) continue;
      const host = data?.host || 'https://tilecache.rainviewer.com';
      map._atmosRadarLayer = L.tileLayer(`${host}${path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: .68, maxZoom: 7, tileSize: 256, attribution: '<a href="https://www.rainviewer.com/">Weather data by RainViewer</a>' });
      map._atmosRadarLayer.addTo(map);
      if (map._atmosRadarLayer.bringToFront) map._atmosRadarLayer.bringToFront();
    }
  }

  function centerMaps(center, zoom = 5) {
    for (const map of Object.values(app.maps)) { try { map.setView(center, zoom, { animate: true }); } catch {} }
  }

  function setMapLayer(layer) {
    app.radarBase = layer === 'radar';
    $$('[data-map-layer]').forEach(button => button.classList.toggle('active', (button.dataset.mapLayer === 'radar') === app.radarBase));
    if (app.radarFrames.length) showRadarFrame(app.radarIndex);
  }

  function toggleRadarAnimation() {
    app.radarPlaying = !app.radarPlaying;
    $('#radar-play').textContent = app.radarPlaying ? 'Ⅱ' : '▶';
    if (app.radarTimer) window.clearInterval(app.radarTimer);
    if (app.radarPlaying) app.radarTimer = window.setInterval(() => showRadarFrame((app.radarIndex + 1) % app.radarFrames.length), 750);
  }

  async function loadStatus() {
    $('#status-summary-title').textContent = 'Checking upstream services…';
    $('#status-summary-copy').textContent = 'A fresh availability check is running.';
    $('#status-summary-icon').textContent = '◌';
    $('#service-status-grid').innerHTML = '<div class="panel loading-card"><span class="loader"></span>Checking providers…</div>';
    try {
      const data = await api('status');
      const overall = data.overall || 'partial';
      const title = overall === 'operational' ? 'Providers responding' : overall === 'outage' ? 'Provider checks failed' : 'Partial availability';
      $('#status-summary-title').textContent = title;
      $('#status-summary-copy').textContent = `${data.tally?.up || 0} of ${(data.services || []).length} upstream checks returned a successful response. This is a reachability snapshot, not a forecast-quality guarantee.`;
      $('#status-summary-icon').textContent = overall === 'operational' ? '✓' : overall === 'outage' ? '!' : '◌';
      $('#status-summary-time').textContent = `Checked ${new Date(data.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const services = data.services || [];
      $('#service-status-grid').innerHTML = services.map(service => {
        const statusText = service.status === 'up' ? 'REACHABLE' : service.status === 'unreachable' ? 'UNREACHABLE' : service.status.toUpperCase();
        const pill = service.status === 'up' ? 'up' : service.status === 'unreachable' ? 'down' : 'degraded';
        return `<article class="service-card"><div class="service-card-head"><div class="service-ident"><span class="service-icon">${escapeHTML(service.id.slice(0, 3).toUpperCase())}</span><span><b>${escapeHTML(service.name)}</b><small>${escapeHTML(service.category)}</small></span></div><span class="service-pill ${pill}">${statusText}</span></div><p>${escapeHTML(service.note || '')}${service.httpStatus ? ` HTTP ${service.httpStatus}.` : service.error ? ` ${escapeHTML(service.error)}.` : ''}</p><div class="service-response-time">${service.latencyMs != null ? `${service.latencyMs} ms response` : 'No timing available'} · <a href="${escapeHTML(service.url)}" target="_blank" rel="noopener">Open source ↗</a></div></article>`;
      }).join('') + `<article class="service-card"><div class="service-card-head"><div class="service-ident"><span class="service-icon">ATM</span><span><b>Atmos frontend</b><small>Vercel static hosting</small></span></div><span class="service-pill up">UP</span></div><p>The dashboard is loaded and the shared API dispatcher responded.</p><div class="service-response-time">Checked with the same request</div></article>`;
      $('#system-status-label').textContent = overall === 'operational' ? 'DATA LINKS RESPONDING' : 'CHECK PROVIDER STATUS';
    } catch (error) {
      $('#status-summary-title').textContent = 'Status check unavailable';
      $('#status-summary-copy').textContent = `${error.message}. The dashboard can still use official sources directly.`;
      $('#service-status-grid').innerHTML = '<div class="panel loading-card">Could not reach the shared status endpoint. Try again later and check the official provider status pages.</div>';
    }
  }

  async function loadReports() {
    const node = $('#reports-content');
    if (!node) return;
    node.innerHTML = '<div class="loading-row"><span class="loader"></span>Checking the public report product…</div>';
    try {
      const data = await api('reports');
      if (!data.available) {
        node.innerHTML = `<b>Automated report retrieval unavailable</b><p class="small-help">${escapeHTML(data.message)}</p><a href="${escapeHTML(data.sourceUrl)}" target="_blank" rel="noopener">Open live SPC reports ↗</a>`;
        return;
      }
      node.innerHTML = `<div class="report-data-head"><b>SPC report page reached</b><small>${new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div><p class="report-excerpt">${escapeHTML(data.excerpt || 'The official report source returned an empty summary.')}</p><a href="${escapeHTML(data.sourceUrl)}" target="_blank" rel="noopener">Read the complete official report list ↗</a>`;
    } catch (error) {
      node.innerHTML = `<b>Could not fetch the automated report snippet</b><p class="small-help">${escapeHTML(error.message)}</p><a href="https://www.spc.noaa.gov/climo/reports/today.html" target="_blank" rel="noopener">Open live SPC reports ↗</a>`;
    }
  }

  function renderOfficialSources() {
    $('#official-grid').innerHTML = OFFICIAL_SOURCES.map(source => `<article class="official-card"><span class="official-region">${escapeHTML(source.region)}</span><h3>${escapeHTML(source.name)}</h3><p>${escapeHTML(source.description)}</p><a href="${escapeHTML(source.url)}" target="_blank" rel="noopener">Open official source ↗</a></article>`).join('');
  }

  function renderChannels() {
    const query = (app.channelSearch || '').trim().toLowerCase();
    const items = CHANNELS.filter(channel => (app.channelFilter === 'all' || channel.type === app.channelFilter) && (!query || `${channel.name} ${channel.description} ${channel.label}`.toLowerCase().includes(query)));
    $('#channels-grid').innerHTML = items.length ? items.map(channel => `<article class="channel-card"><span class="channel-avatar">${escapeHTML(channel.initials)}</span><div class="channel-content"><span class="channel-tag">${escapeHTML(channel.label)}</span><h3>${escapeHTML(channel.name)}</h3><p>${escapeHTML(channel.description)}</p><a href="${escapeHTML(channel.url)}" target="_blank" rel="noopener">Watch on YouTube ↗</a></div></article>`).join('') : '<div class="panel empty-state">No channels match that search.</div>';
  }

  function regionalView(regionKey) {
    const region = REGION_PRESETS[regionKey];
    if (!region) return;
    app.selectedRegion = region.label;
    centerMaps(region.center, region.zoom);
    const mapPanel = regionKey === 'north-america' ? 'alerts' : 'alerts';
    goTo(mapPanel);
    toast(`${region.label} selected`, 'Choose a city in Preferences to load weather and nearby official warnings.');
  }

  function bindEvents() {
    $$('.nav-item').forEach(button => button.addEventListener('click', () => goTo(button.dataset.view)));
    $$('[data-go]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.go)));
    $('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#location-pill').addEventListener('click', () => showLocationModal(true));
    $('#quick-notifications').addEventListener('click', () => goTo('settings'));
    $('#use-location-main').addEventListener('click', useDeviceLocation);
    $('#settings-use-location').addEventListener('click', useDeviceLocation);
    $('#modal-use-location').addEventListener('click', useDeviceLocation);
    $('#radar-locate').addEventListener('click', () => app.preferences.location ? centerMaps([app.preferences.location.latitude, app.preferences.location.longitude], 6) : useDeviceLocation());
    $('#close-location-modal').addEventListener('click', () => showLocationModal(false));
    $('#keep-world-view').addEventListener('click', () => showLocationModal(false));
    $('#place-search-button').addEventListener('click', () => searchPlaces('#place-search', '#place-results'));
    $('#modal-place-search-button').addEventListener('click', () => searchPlaces('#modal-place-search', '#modal-place-results'));
    $('#place-search').addEventListener('keydown', e => { if (e.key === 'Enter') searchPlaces('#place-search', '#place-results'); });
    $('#modal-place-search').addEventListener('keydown', e => { if (e.key === 'Enter') searchPlaces('#modal-place-search', '#modal-place-results'); });
    $('#clear-location').addEventListener('click', () => {
      app.preferences.location = null; savePreferences(); if (app.alertTimer) clearInterval(app.alertTimer); app.alertTimer = null;
      updateLocationUI(); centerMaps([20, 0], 2); toast('Location cleared', 'Your saved location was removed from this browser.');
    });
    $$('[data-map-layer]').forEach(button => button.addEventListener('click', () => setMapLayer(button.dataset.mapLayer)));
    $('#map-home').addEventListener('click', () => centerMaps([20, 0], 2));
    $('#radar-refresh').addEventListener('click', loadRadarFrames);
    $('#radar-timeline').addEventListener('input', event => { if (app.radarPlaying) toggleRadarAnimation(); showRadarFrame(event.target.value); });
    $('#radar-play').addEventListener('click', toggleRadarAnimation);
    $('#alerts-refresh').addEventListener('click', () => loadAlerts({ initial: true }));
    $('#alerts-set-location').addEventListener('click', () => showLocationModal(true));
    $('#reports-refresh').addEventListener('click', loadReports);
    $('#status-refresh').addEventListener('click', loadStatus);
    $('#enable-notifications').addEventListener('click', enableNotifications);
    $('#theme-select').addEventListener('change', event => { app.preferences.theme = event.target.value; savePreferences(); applyTheme(); });
    $('#accent-color').addEventListener('input', event => { app.preferences.accent = event.target.value; savePreferences(); applyTheme(); });
    $('#reset-accent').addEventListener('click', () => { app.preferences.accent = DEFAULT_ACCENT; savePreferences(); applyTheme(); });
    $('#units-select').addEventListener('change', event => { app.preferences.units = event.target.value; savePreferences(); applyTheme(); loadForecast(); });
    $('#polling-select').addEventListener('change', event => { app.preferences.polling = Number(event.target.value); savePreferences(); startAlertPolling(); });
    const notifyPairs = [['notify-tornado', 'tornado'], ['notify-thunderstorm', 'thunderstorm'], ['notify-flood', 'flood'], ['notify-severe', 'severe']];
    notifyPairs.forEach(([id, key]) => $(`#${id}`).addEventListener('change', event => { app.preferences.notify[key] = event.target.checked; savePreferences(); }));
    $('#reset-preferences').addEventListener('click', () => {
      if (!window.confirm('Reset Atmos theme, units, location, and notification preferences in this browser?')) return;
      localStorage.removeItem(STORE_KEY); app.preferences = loadPreferences(); applyTheme(); updateLocationUI(); centerMaps([20, 0], 2); showLocationModal(true); toast('Preferences reset', 'Atmos settings have been reset in this browser.');
    });
    $$('.theme-swatch').forEach(button => button.addEventListener('click', () => { app.preferences.theme = button.dataset.preset; savePreferences(); applyTheme(); }));
    $$('.chip[data-channel-filter]').forEach(button => button.addEventListener('click', () => { app.channelFilter = button.dataset.channelFilter; $$('.chip[data-channel-filter]').forEach(x => x.classList.toggle('active', x === button)); renderChannels(); }));
    $('#channel-search').addEventListener('input', event => { app.channelSearch = event.target.value; renderChannels(); });
    $$('.region-card').forEach(button => button.addEventListener('click', () => regionalView(button.dataset.region)));
    $('#location-modal').addEventListener('click', event => { if (event.target === $('#location-modal')) showLocationModal(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { showLocationModal(false); $('#sidebar').classList.remove('open'); } });
  }

  function boot() {
    applyTheme(); renderClock(); window.setInterval(renderClock, 30000);
    renderOfficialSources(); renderChannels(); bindEvents(); setupMaps(); updateNotificationHint(false);
    if (app.preferences.location) updateLocationUI();
    else window.setTimeout(() => showLocationModal(true), 400);
    // Load the service panel on demand; don't waste provider requests on every visit.
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
