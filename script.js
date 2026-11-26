// SkyCast uses the free Open-Meteo APIs; no API key is required.
const form = document.querySelector('#searchForm');
const cityInput = document.querySelector('#cityInput');
const statusEl = document.querySelector('#status');
const panel = document.querySelector('#weatherPanel');

const $ = (id) => document.getElementById(id);

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff9b9b' : '';
}

function weatherDescription(code) {
  const map = {
    0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
    3: ['Overcast', '☁️'], 45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Dense drizzle', '🌧️'],
    61: ['Slight rain', '🌧️'], 63: ['Moderate rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    71: ['Slight snow', '🌨️'], 73: ['Moderate snow', '🌨️'], 75: ['Heavy snow', '❄️'],
    80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Heavy showers', '⛈️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Thunderstorm with hail', '⛈️']
  };
  return map[code] || ['Weather unavailable', '🌡️'];
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather service is unavailable. Please try again.');
  return response.json();
}

async function loadWeather(city) {
  if (!city.trim()) {
    setStatus('Please enter a city name.', true);
    return;
  }
  panel.classList.add('hidden');
  setStatus('Finding your city and checking the forecast…');
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geo = await getJson(geoUrl);
    if (!geo.results?.length) throw new Error('City not found. Check the spelling and try again.');

    const place = geo.results[0];
    const params = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto', forecast_days: '1'
    });
    const weather = await getJson(`https://api.open-meteo.com/v1/forecast?${params}`);
    const current = weather.current;
    const [description, icon] = weatherDescription(current.weather_code);

    $('cityName').textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
    $('localDate').textContent = new Intl.DateTimeFormat('en', {
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
      timeZone: weather.timezone
    }).format(new Date(current.time));
    $('weatherIcon').textContent = icon;
    $('temperature').textContent = Math.round(current.temperature_2m);
    $('condition').textContent = description;
    $('feelsLike').textContent = Math.round(current.apparent_temperature);
    $('tempMax').textContent = Math.round(weather.daily.temperature_2m_max[0]);
    $('tempMin').textContent = Math.round(weather.daily.temperature_2m_min[0]);
    $('humidity').textContent = current.relative_humidity_2m;
    $('wind').textContent = Math.round(current.wind_speed_10m);
    $('pressure').textContent = Math.round(current.pressure_msl);
    $('cloud').textContent = current.cloud_cover;

    panel.classList.remove('hidden');
    setStatus('Showing live conditions for your selected city.');
  } catch (error) {
    setStatus(error.message || 'Something went wrong. Please try again.', true);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  loadWeather(cityInput.value);
});

cityInput.value = 'Karachi';
loadWeather('Karachi');
