// Created by Deekay1085
// Uses Open-Meteo: free public API, no API key required.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather codes -> [description, emoji]
const CODES = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌦️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"], 82: ["Violent showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const button = form.querySelector("button");
const message = document.getElementById("message");
const result = document.getElementById("result");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function getWeather(city) {
  const geo = await fetchJSON(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en`);
  if (!geo.results || geo.results.length === 0) {
    const err = new Error("City not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  const { latitude, longitude, name, country } = geo.results[0];
  const params = new URLSearchParams({
    latitude, longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
  });
  const data = await fetchJSON(`${WEATHER_URL}?${params}`);
  return { name, country, current: data.current };
}

function render({ name, country, current }) {
  const [desc, icon] = CODES[current.weather_code] || ["Unknown conditions", "🌡️"];
  document.getElementById("place").textContent = `${name}, ${country}`;
  document.getElementById("icon").textContent = icon;
  document.getElementById("temp").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("condition").textContent = desc;
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${current.wind_speed_10m} km/h`;
  document.getElementById("feels").textContent = `${Math.round(current.apparent_temperature)}°C`;
  result.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return showMessage("Please enter a city name.", true);

  button.disabled = true;
  result.hidden = true;
  showMessage("Loading…");
  try {
    render(await getWeather(city));
    showMessage("");
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      showMessage(`Couldn't find "${city}". Check the spelling and try again.`, true);
    } else if (!navigator.onLine || err instanceof TypeError) {
      showMessage("Network problem. Check your connection and try again.", true);
    } else {
      showMessage("The weather service had a problem. Please try again later.", true);
    }
  } finally {
    button.disabled = false;
  }
});