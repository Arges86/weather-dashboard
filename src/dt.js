/** @typedef {object} Forecast
 * @property {string} cod
 * @property {number} message
 * @property {number} cnt
 * @property {WeatherList[]} list
 */

/** @typedef {object} Main
 * @property {number} temp
 * @property {number} feels_like
 * @property {number} temp_min
 * @property {number} temp_max
 * @property {number} pressure
 * @property {number} sea_level
 * @property {number} grnd_level
 * @property {number} humidity
 * @property {number} temp_kf
 */


/** @typedef {object} WeatherList
 * @property {number} dt
 * @property {number} sunrise
 * @property {number} sunset
 * @property {object} temp
 * @property {number} temp.day
 * @property {number} temp.min
 * @property {number} temp.max
 * @property {number} temp.night
 * @property {number} temp.eve
 * @property {number} temp.morn
 * @property {object} feels_like
 * @property {number} feels_like.day
 * @property {number} feels_like.night
 * @property {number} feels_like.eve
 * @property {number} feels_like.morn
 * @property {number} pressure
 * @property {number} humidity
 * @property {object[]} weather
 * @property {number} weather.id
 * @property {string} weather.main
 * @property {string} weather.description
 * @property {string} weather.icon
 * @property {number} speed
 * @property {number} deg
 * @property {number} gust
 * @property {number} clouds
 * @property {number} pop
 * @property {number} rain
 * @property {number} snow
 */


/** @typedef {object} CurrentWeather
 * @property {object} coord
 * @property {number} coord.lon
 * @property {number} coord.lat
 * @property {object[]} weather
 * @property {number} weather.id
 * @property {string} weather.main
 * @property {string} weather.description
 * @property {string} weather.icon
 * @property {string} base
 * @property {object} main
 * @property {number} main.temp
 * @property {number} main.feels_like
 * @property {number} main.temp_min
 * @property {number} main.temp_max
 * @property {number} main.pressure
 * @property {number} main.humidity
 * @property {number} main.sea_level
 * @property {number} main.grnd_level
 * @property {number} visibility
 * @property {object} wind
 * @property {number} wind.speed
 * @property {number} wind.deg
 * @property {number} wind.gust
 * @property {object} clouds
 * @property {number} clouds.all
 * @property {number} dt
 * @property {object} sys
 * @property {number} sys.type
 * @property {number} sys.id
 * @property {string} sys.country
 * @property {number} sys.sunrise
 * @property {number} sys.sunset
 * @property {number} timezone
 * @property {number} id
 * @property {string} name
 * @property {number} cod
 */
