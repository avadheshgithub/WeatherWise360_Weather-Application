const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const themeToggle = document.getElementById("themeToggle");
const time = document.getElementById("time");
const dateTime = document.getElementById("dateTime");
const tempChartCanvas = document.getElementById("tempChart").getContext("2d");
const localClock = document.getElementById("localClock");

const API_KEY = "1ff99d3a2ccba62a0185ed656304beaf"; 

let tempChart;

const createWeatherCard = (cityName, weatherItem, index) => {
    const description = weatherItem.weather[0].description.toLowerCase();
    let cardClass = "";
    if (index !== 0 && !description.includes("shower")) {
        cardClass = description.includes("rain") ? "rain" : description.includes("wind") ? "wind" : "";
    }
    if(index === 0) { 
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6 id="temp">Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6 id="wind">Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6 id="humidity">Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon text-center">
                    <img id="weatherIcon" src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon" class="w-32">
                    <h6 id="weatherDesc">${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { 
        return `<li class="card p-4 flex flex-col items-center justify-center ${cardClass}">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon" class="w-16">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";
        const temperatures = [];
        const labels = [];
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
            temperatures.push((weatherItem.main.temp - 273.15).toFixed(2));
            labels.push(weatherItem.dt_txt.split(" ")[0]);
        });
        updateTempChart(labels, temperatures);
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; 
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    themeToggle.textContent = document.body.classList.contains("dark-theme") ? "Toggle Light" : "Toggle Theme";
    if (tempChart) tempChart.destroy();
    updateTempChart(); // Recreate chart with new theme
});

function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' };
    time.textContent = now.toLocaleTimeString('en-US', options);
    dateTime.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    localClock.textContent = now.toLocaleTimeString('en-US', options); // Update local clock
}
setInterval(updateClock, 1000);
updateClock();

function updateTempChart(labels = [], temperatures = []) {
    if (tempChart) tempChart.destroy();
    tempChart = new Chart(tempChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Temperature (°C)' },
                    ticks: { color: document.body.classList.contains('dark-theme') ? '#ffffff' : '#000000' }
                },
                x: {
                    title: { display: true, text: 'Date' },
                    ticks: { color: document.body.classList.contains('dark-theme') ? '#ffffff' : '#000000' }
                }
            },
            plugins: {
                legend: { labels: { color: document.body.classList.contains('dark-theme') ? '#ffffff' : '#000000' } }
            }
        }
    });
}