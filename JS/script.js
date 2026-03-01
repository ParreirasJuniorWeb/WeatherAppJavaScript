const apiKey = "af8c58c9e90be8487a19b917722da820"; // Substitua por sua chave real

const elements = {
    form: document.querySelector("#search-form"),
    input: document.querySelector("#city-input"),
    cityName: document.querySelector(".city-name"),
    currentDate: document.querySelector("#current-date"),
    temp: document.querySelector(".main-temp"),
    desc: document.querySelector(".weather-desc"),
    icon: document.querySelector(".big-icon"),
    humidity: document.querySelector("#humidity"),
    humShort: document.querySelector("#hum-short"),
    wind: document.querySelector("#wind"),
    windShort: document.querySelector("#wind-short"),
    maxMin: document.querySelector("#max-min"),
    loader: document.querySelector("#loader"),
    unitToggle: document.querySelector("#unit-toggle"),
    forecastGrid: document.querySelector(".forecast-grid"),
    msg: document.querySelector(".msg")
};

let currentUnit = "C";
let lastTempC = 0;
let weatherChart;

// --- UTILITÁRIOS ---
const toggleLoader = () => elements.loader.classList.toggle("hide");

const convert = (t) => currentUnit === "C" ? Math.round(t) : Math.round((t * 9/5) + 32);

const notify = (msg, color) => {
    Toastify({ text: msg, duration: 4500, gravity: "top", position: "right", style: { background: color, borderRadius: "12px" } }).showToast();
};

const formatDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    elements.currentDate.textContent = new Date().toLocaleDateString('pt-BR', options);
};

// --- CHART.JS ---
const renderChart = (days) => {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if (weatherChart) weatherChart.destroy();

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days.map(d => new Date(d.dt * 1000).toLocaleDateString("pt-BR", { weekday: 'short' })),
            datasets: [{
                label: `Temp (°${currentUnit})`,
                data: days.map(d => convert(d.main.temp)),
                borderColor: '#ff1e42',
                backgroundColor: 'rgba(255, 30, 66, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#fff' }, grid: { display: false } }
            }
        }
    });
};

// --- CORE ---
const showWeatherData = async (city) => {
    if(!city) return;
    toggleLoader();
    elements.msg.style.display = "none";

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}&lang=pt_br`);
        const data = await res.json();

        if (data.cod === "404") {
            elements.msg.style.display = "block";
            notify("Cidade não encontrada!", "#e74c3c");
            toggleLoader(); return;
        }

        localStorage.setItem("lastCity", data.name);
        lastTempC = data.main.temp;
        
        // Atualização DOM
        elements.cityName.textContent = data.name;
        elements.temp.textContent = `${convert(lastTempC)}°${currentUnit}`;
        elements.desc.textContent = data.weather[0].description;
        elements.humidity.textContent = `${data.main.humidity}%`;
        elements.humShort.textContent = `${data.main.humidity}%`;
        elements.wind.textContent = `${data.wind.speed}km/h`;
        elements.windShort.textContent = `${Math.round(data.wind.speed)}km/h`;
        elements.maxMin.textContent = `${convert(data.main.temp_max)}° / ${convert(data.main.temp_min)}°`;
        elements.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

        formatDate();

        // Busca Previsão
        const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}&lang=pt_br`);
        const fData = await fRes.json();
        const daily = fData.list.filter(f => f.dt_txt.includes("12:00:00"));

        renderChart(daily);
        elements.forecastGrid.innerHTML = daily.map(d => `
            <div class="forecast-card">
                <p style="font-size:0.8rem; opacity:0.7">${new Date(d.dt * 1000).toLocaleDateString("pt-BR", {weekday: 'short'}).toUpperCase()}</p>
                <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png">
                <p style="font-weight:bold">${convert(d.main.temp)}°${currentUnit}</p>
            </div>`).join('');

        if(lastTempC > 35) notify("🔥 Alerta de Calor Extremo!", "#e67e22");

    } catch (err) {
        notify("Erro de conexão.", "#c0392b");
    } finally { toggleLoader(); }
};

// --- EVENTOS ---
elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
    showWeatherData(elements.input.value);
});

elements.unitToggle.addEventListener("change", () => {
    currentUnit = elements.unitToggle.checked ? "F" : "C";
    elements.temp.textContent = `${convert(lastTempC)}°${currentUnit}`;
    // Atualiza o gráfico se houver dados
    const lastCity = localStorage.getItem("lastCity");
    if(lastCity) showWeatherData(lastCity); 
});

window.addEventListener("load", () => {
    const saved = localStorage.getItem("lastCity") || "Belo Horizonte";
    showWeatherData(saved);
});