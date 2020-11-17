import './stylesheets/main.css';
import './stylesheets/bulma.min.css';
import settings from 'electron-settings';
const {remote} = require('electron');
const {Menu, MenuItem} = remote;

let rightClickPosition = null;

/** The object that holds user properties */
class UserOptions {
  /**
   * @param {string} apiKey Open Weather Map API Key
   * @param {string} tempUnits Units of temperature measurement
   * @param {string} bingMarkets Bing regional market
   * @param {string} latitude User's latitude
   * @param {string} longitude User's longitude
   */
  constructor(apiKey, tempUnits, bingMarkets, latitude, longitude) {
    this.apiKey = apiKey;
    this.tempUnits = tempUnits;
    this.bingMarkets = bingMarkets;
    this.latitude = latitude;
    this.longitude = longitude;
  }
  /** Gets UTF-8 Letterlike Symbols*/
  get unit() {
    switch (this.tempUnits) {
      case 'metric':
        return '&#x2103;';
      case 'imperial':
        return '&#x2109;';
      case 'default':
        return '&#xb0;K';
    }
  }
};

const menu = new Menu();
menu.append(new MenuItem({
  label: 'Close Program',
  click: () => {
    remote.getCurrentWindow().close();
  },
}));

/** Right click menue */
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  // eslint-disable-next-line no-unused-vars
  rightClickPosition = {x: e.x, y: e.y};
  menu.popup(remote.getCurrentWindow());
}, false);

const timeFormat = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
};

let userOptions = new UserOptions();

getTime();

getSettings();

/** Gets user settings if they exist and then calls main() */
function getSettings() {
  const temp = settings.getSync();
  if (Object.getOwnPropertyNames(temp).length !== 5) {
    initSettings();
  } else {
    document.getElementById('settings').style = 'display: none;';

    menu.insert(0, new MenuItem({
      label: 'Update Settings',
      click: () => {
        initSettings();
      },
    }));
    menu.insert(1, new MenuItem({type: 'separator'}));

    userOptions = new UserOptions(temp.apiKey, temp.tempUnits, temp.bingMarkets, temp.latitude, temp.longitude);

    main();
  }
}

/** Main starter function that calls all the others */
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
  document.getElementById('sunrise').innerHTML = '';
  document.getElementById('currentTemp').innerHTML = '';
  document.getElementById('5day').innerHTML = '';
  document.getElementById('alerts').innerHTML = '';
  document.getElementById('settings').style = 'display: block;background-color: #ffffffcf';

  document.getElementById('apiKey').value = userOptions.apiKey;
  document.getElementById('tempUnits').value = userOptions.tempUnits || '';
  document.getElementById('bingMarkets').value = userOptions.bingMarkets || '';
  document.getElementById('latitude').value = userOptions.latitude;
  document.getElementById('longitude').value = userOptions.longitude;

  document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const tempUnits = document.getElementById('tempUnits').value;
    const bingMarkets = document.getElementById('bingMarkets').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    // eslint-disable-next-line max-len
    if (apiKey == '' || tempUnits == '' || bingMarkets == '' || latitude == '' || longitude == '') {
      document.getElementById('error').style = 'display: block;';
    } else {
      document.getElementById('error').style = 'display: none;';
      settings.setSync({apiKey, tempUnits, bingMarkets, latitude, longitude});
      getSettings();
    }
  });
}

/** Gets the bing daily wallpaper and sets the document background */
async function setBackground() {
  const results = await fetch(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${userOptions.bingMarkets}`)
      .then((resp) => {
        return resp.json();
      });

  if (results.images) {
    document.body.style.backgroundImage = `url("https://www.bing.com/${results.images[0].url}")`;

    document.getElementById('backgroundTitle').textContent = results.images[0].title;
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
  const url = new URL('https://api.openweathermap.org/data/2.5/onecall');
  const params = {
    'lat': userOptions.latitude,
    'lon': userOptions.longitude,
    'exclude': 'minutely',
    'units': userOptions.tempUnits,
    'appid': userOptions.apiKey,
  };
  url.search = new URLSearchParams(params).toString();
  const results = await fetch(url)
      .then((resp) => {
        return resp.json();
      });
  setCurrent(results.current);
  setForecast(results.daily);
  if (results.alerts) {
    setAlert(results.alerts);
  }
}
/**
 * Sets the first row of weather data
 * @param {Object} current The current weather data object
 */
function setCurrent(current) {
  document.getElementById('sunrise').innerHTML = '';
  document.getElementById('currentTemp').innerHTML = '';

  // Sets sunrise and sunset on left side
  const div = document.createElement('div');
  const sunrise = new Date(current.sunrise * 1000);
  const sunset = new Date(current.sunset * 1000);
  const now = new Date(current.dt * 1000);
  div.innerHTML = `<strong>Sunrise: </strong> ${sunrise.toLocaleString(navigator.language || 'en-US', timeFormat)}`;
  div.innerHTML += '<br/>';
  div.innerHTML += `<strong>Sunset: </strong> ${sunset.toLocaleString(navigator.language || 'en-US', timeFormat)}`;
  div.innerHTML += '<br/>';
  div.innerHTML += `<strong>Daylight: </strong> ${timeConvert(Math.abs(sunset - sunrise))}`;
  div.innerHTML += '<br/>';
  div.innerHTML += `<small><strong>Updated: </strong> ${now.toLocaleString(navigator.language || 'en-US', timeFormat)}</small>`;
  div.setAttribute('class', 'background');
  document.getElementById('sunrise').appendChild(div);

  // sets current weather on right side
  const div1 = document.createElement('div');
  div1.innerHTML = `<strong>Temp: </strong> ${current.temp}${userOptions.unit} `;
  if (current.weather) {
    const img = document.createElement('img');
    img.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
    img.alt = current.weather[0].description;
    img.className = 'weatherIcon';
    div1.appendChild(img);
  }
  div1.innerHTML += '<br/>';
  div1.innerHTML += `<strong>Feels Like: </strong> ${current.feels_like}${userOptions.unit}`;
  div1.innerHTML += '<br/>';
  div1.innerHTML += `<strong>Humidity: </strong> ${current.humidity}%`;
  div1.innerHTML += '<br/>';
  div1.innerHTML += `<strong>Wind: </strong> ${getCardinalDirection(current.wind_deg)} @ ${current.wind_speed} mph`;
  div1.setAttribute('class', 'background');
  document.getElementById('currentTemp').appendChild(div1);
}

/**
 * Sets the second row of weather data
 * @param {Array<object>} daily The list of dail forecasts
 */
function setForecast(daily) {
  const forecast = document.getElementById('5day');
  forecast.innerHTML = '';
  const n = 5;

  for (let index = 0; index < n; index++) {
    const element = daily[index];

    // sets named ay of week
    const div = document.createElement('div');
    const day = getDayOfWeek(new Date(), index);
    const title = document.createElement('div');
    title.setAttribute('class', 'forecastTitle');
    title.innerText = day;
    div.appendChild(title);

    // sets body of forecast
    const body = document.createElement('div');
    body.innerHTML = `${element.temp.min.toFixed(1)}&#xb0;/${element.temp.max.toFixed(1)} ${userOptions.unit} `;
    if (element.weather) {
      const img = document.createElement('img');
      img.src = `https://openweathermap.org/img/wn/${element.weather[0].icon}@2x.png`;
      img.alt = element.weather[0].description;
      // img.className = "weatherIcon";
      body.appendChild(img);
    }
    body.innerHTML += '<br/>';
    body.innerHTML += `${Math.round(element.pop * 100)}%`;
    div.appendChild(body);

    div.setAttribute('class', 'column background seperator has-text-centered');
    forecast.appendChild(div);
  }
}

/**
 * Sets the allerts to the bottom of the page
 * @param {Array<object>} alerts List of Alerts
 */
function setAlert(alerts) {
  const div = document.getElementById('alerts');

  alerts.forEach((element) => {
    console.log(element.event);
    const title = document.createElement('div');
    const alert = document.createElement('div');

    title.setAttribute('class', 'forecastTitle');
    title.innerText = element.event;
    alert.appendChild(title);

    const body = document.createElement('div');
    body.innerHTML = element.description;
    body.setAttribute('class', 'is-size-6');
    alert.appendChild(body);

    alert.setAttribute('class', 'column background seperator');
    div.appendChild(alert);
  });
}

/**
 * Converts milliseconds to readable hours and minutes
 * @param {number} data Time in millisconds
 * @return {string} Time in hours and minutes
 */
function timeConvert(data) {
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

/**
 * Returns relative direction of Wind angle
 * @param {number} angle Directional Angle
 * @return {string}
 */
function getCardinalDirection(angle) {
  const directions = ['↑ N', '↗ NE', '→ E', '↘ SE', '↓ S', '↙ SW', '← W', '↖ NW'];
  return directions[Math.round(angle / 45) % 8];
}

/**
 * Gets the day of the week
 * @param {Date} date Today's date
 * @param {number} offset The number of days it is from today
 * @return {string}
 */
function getDayOfWeek(date, offset) {
  const weekday = new Array(7);
  weekday[0] = 'Sunday';
  weekday[1] = 'Monday';
  weekday[2] = 'Tuesday';
  weekday[3] = 'Wednesday';
  weekday[4] = 'Thursday';
  weekday[5] = 'Friday';
  weekday[6] = 'Saturday';
  if (offset === 0) {
    return 'Today';
  }
  return weekday[date.getDay() + offset];
}
