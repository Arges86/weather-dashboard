import "./stylesheets/main.css";
import "./stylesheets/bulma.min.css";
import settings from 'electron-settings';
const { remote } = require('electron')
const { Menu, MenuItem } = remote

let rightClickPosition = null

const menu = new Menu()
const menuItem = new MenuItem({
  label: 'Clear Settings',
  click: () => {
    settings.unsetSync();
    start();
  }
})
menu.append(menuItem)

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  rightClickPosition = {x: e.x, y: e.y}
  menu.popup(remote.getCurrentWindow())
}, false)

const timeFormat = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true
}

let apiKey = null;
let tempUnits = null;
let bingMarkets = null;
let latitude = null;
let longitude = null;
let unit = null;

getTime();

start();

function start() {
  const userSettings = settings.getSync();
  if (Object.getOwnPropertyNames(userSettings).length !== 5) {

    initSettings();
    
  } else {

    document.getElementById("settings").style = "display: none;"
  
    bingMarkets = userSettings.bingMarkets;
    tempUnits = userSettings.tempUnits;
    apiKey = userSettings.apiKey;
    latitude = userSettings.latitude;
    longitude = userSettings.longitude;
  
    switch(tempUnits) {
      case "metric":
        unit = "&#x2103;";
        break;
      case "imperial":
        unit = "&#x2109;";
        break;
      case "default":
        unit = "&#xb0;K";
        break;
    }
  
    main()
  
  }
  
}

function main() {
  setBackground();

  // refreshes background at midnight
  setInterval(refreshBackground, 1000 * 60);

  setInterval(getTime, 1000);

  getWeather();

  // refreshes weather every hour
  setInterval(getWeather, 1000 * 60 * 60);
}

/** Sets the 'settings' to visible and creates event listener */
function initSettings() {
  document.getElementById("sunrise").innerHTML = "";
  document.getElementById("currentTemp").innerHTML = "";
  document.getElementById("5day").innerHTML = "";
  document.getElementById("alerts").innerHTML = "";
  document.getElementById("settings").style = "display: block;"

  document.getElementById("saveSettings").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    const tempUnits = document.getElementById("tempUnits").value;
    const bingMarkets = document.getElementById("bingMarkets").value;
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;

    if (apiKey == "" || tempUnits == "" || bingMarkets == "" || latitude == "" || longitude == "") {
      document.getElementById("error").style = "display: block;"
    } else {
      document.getElementById("error").style = "display: none;"
      settings.setSync({apiKey,tempUnits,bingMarkets, latitude, longitude});
      start()
    }
  });
}

/** Gets the bing daily wallpaper and sets the document background */
async function setBackground() {
  const results = await fetch(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${bingMarkets}`)
    .then(resp => {
      return resp.json();
    });

  if (results.images) {
    document.body.style.backgroundImage = `url("https://www.bing.com/${results.images[0].url}")`;

    document.getElementById("backgroundTitle").textContent = results.images[0].title;
  }
}

/** Checks if its midnight, and if it is, re-queries Bing */
function refreshBackground() {
  const hour = new Date().getHours();
  if (hour === 0) {
    console.log('Setting new background for the day');
    setBackground();
  }
}

/** Queries open weather map for weather results */
async function getWeather() {

  const url = new URL("https://api.openweathermap.org/data/2.5/onecall");
  const params = {
    "lat": latitude,
    "lon": longitude,
    "exclude": "minutely",
    "units": tempUnits,
    "appid": apiKey
  };
  url.search = new URLSearchParams(params).toString();
  const results = await fetch(url)
    .then(resp => {
      return resp.json();
    });
  setCurrent(results.current);
  setForecast(results.daily);
  if (results.alerts) {
    setAlert(results.alerts);
  }
}

/** Sets the first row of weather data */
function setCurrent(current) {

  document.getElementById("sunrise").innerHTML = "";
  document.getElementById("currentTemp").innerHTML = "";

  //Sets sunrise and sunset on left side
  const div = document.createElement("div");
  const sunrise = new Date(current.sunrise * 1000);
  const sunset = new Date(current.sunset * 1000);
  const now = new Date(current.dt * 1000);
  div.innerHTML = `<strong>Sunrise: </strong> ${sunrise.toLocaleString(navigator.language || 'en-US', timeFormat)}`;
  div.innerHTML += "<br/>";
  div.innerHTML += `<strong>Sunset: </strong> ${sunset.toLocaleString(navigator.language || 'en-US', timeFormat)}`;
  div.innerHTML += "<br/>";
  div.innerHTML += `<strong>Daylight: </strong> ${time_convert(Math.abs(sunset - sunrise))}`;
  div.innerHTML += "<br/>";
  div.innerHTML += `<small><strong>Updated: </strong> ${now.toLocaleString(navigator.language || 'en-US', timeFormat)}</small>`;
  div.setAttribute("class", 'background');
  document.getElementById("sunrise").appendChild(div);

  // sets current weather on right side
  const div1 = document.createElement("div");
  div1.innerHTML = `<strong>Temp: </strong> ${current.temp}${unit} `;
  if (current.weather) {
    const img = document.createElement("img");
    img.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
    img.alt = current.weather[0].description;
    img.className = "weatherIcon";
    div1.appendChild(img);
  }
  div1.innerHTML += "<br/>";
  div1.innerHTML += `<strong>Feels Like: </strong> ${current.feels_like}${unit}`;
  div1.innerHTML += "<br/>";
  div1.innerHTML += `<strong>Humidity: </strong> ${current.humidity}%`;
  div1.innerHTML += "<br/>";
  div1.innerHTML += `<strong>Wind: </strong> ${getCardinalDirection(current.wind_deg)} @ ${current.wind_speed} mph`;
  div1.setAttribute("class", 'background');
  document.getElementById("currentTemp").appendChild(div1);
}

/** Sets the second row of weather data */
function setForecast(daily) {

  const forecast = document.getElementById("5day");
  forecast.innerHTML = "";
  const n = 5;

  for (let index = 0; index < n; index++) {
    const element = daily[index];

    // sets named ay of week
    const div = document.createElement("div");
    const day = getDayOfWeek(new Date(), index);
    const title = document.createElement("div");
    title.setAttribute("class", "forecastTitle");
    title.innerText = day;
    div.appendChild(title);

    // sets body of forecast
    const body = document.createElement("div");
    body.innerHTML = `${element.temp.min.toFixed(1)}&#xb0;/${element.temp.max.toFixed(1)} ${unit} `;
    if (element.weather) {
      const img = document.createElement("img");
      img.src = `https://openweathermap.org/img/wn/${element.weather[0].icon}@2x.png`;
      img.alt = element.weather[0].description;
      // img.className = "weatherIcon";
      body.appendChild(img);
    }
    body.innerHTML += "<br/>";
    body.innerHTML += `${element.pop * 100}%`;
    div.appendChild(body);

    div.setAttribute("class", "column background seperator has-text-centered");
    forecast.appendChild(div);
  }
}

function setAlert(alerts) {

  console.log(alerts);
  
  const div = document.getElementById("alerts");

  alerts.forEach(element => {
    console.log(element.event);
    const title = document.createElement("div");
    const alert = document.createElement("div");

    title.setAttribute("class", "forecastTitle");
    title.innerText = element.event;
    alert.appendChild(title);

    const body = document.createElement("div");
    body.innerHTML = element.description;
    body.setAttribute("class", "is-size-6");
    alert.appendChild(body);

    alert.setAttribute("class", "column background seperator");
    document.getElementById("alerts").appendChild(alert);
  });
}

/** Converts milliseconds to readable hours and minutes */
function time_convert(data) {
  const num = data / 1000;
  const hours = Math.floor(num / 60 / 60);
  const minutes = num % 60;
  return `${hours} hrs ${minutes} min`;
}

/** Gets the current time and updates the #clock */
function getTime() {
  const clock = document.querySelector('#clock');
  const time = new Date();
  clock.textContent = time.toLocaleString(navigator.language || 'en-US', timeFormat);
}

function getCardinalDirection(angle) {
  const directions = ['↑ N', '↗ NE', '→ E', '↘ SE', '↓ S', '↙ SW', '← W', '↖ NW'];
  return directions[Math.round(angle / 45) % 8];
}

function getDayOfWeek(date, offset) {
  const weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";
  if (offset === 0) {
    return "Today";
  }
  return weekday[date.getDay() + offset];
}