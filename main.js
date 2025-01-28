const map = L.map('map').setView([48.5, 37.5], 8);

var CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 13,
    minZoom: 7
}).addTo(map);



const viewboxes = {
    "Донецкая": "37.0,47.0,40.0,48.7",
    "Луганская": "38.0,48.0,41.0,49.5",
    "Запорожская": "35.5,46.5,38.5,48.0",
    "Херсонская": "32.0,44.0,35.5,46.5",
    "Сумская": "32.0,50.0,35.5,51.5"
};

let geojsonLayer = null;
let geojsonLayer1 = null;

fetch('./data/rus_.geojson')  // Укажите путь к вашему GeoJSON файлу
    .then(response => response.json())
    .then(geojsonData => {
        // Добавляем данные GeoJSON на карту с заданием стиля
        geojsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
                return {
                    weight: 0,  // Убираем обводку
                    color: 'transparent',  // Линия прозрачная
                    fillColor: '#bf324c',  // Заливка синим цветом
                    fillOpacity: 0.5  // Прозрачность заливки
                };
            }
        }).addTo(map);
    })
    .catch(error => console.error('Ошибка загрузки GeoJSON:', error));

    fetch('./data/ua_.geojson')  // Укажите путь к вашему GeoJSON файлу
    .then(response => response.json())
    .then(geojsonData1 => {
        // Добавляем данные GeoJSON на карту с заданием стиля
        geojsonLayer1 = L.geoJSON(geojsonData1, {
            style: function (feature) {
                return {
                    weight: 0,  // Убираем обводку
                    color: 'transparent',  // Линия прозрачная
                    fillColor: '#3352ff',  // Заливка синим цветом
                    fillOpacity: 0.5  // Прозрачность заливки
                };
            }
        }).addTo(map);
    })
    .catch(error => console.error('Ошибка загрузки GeoJSON:', error));

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function geocodeLocation(location, countryCode = 'UA', viewbox = '') {
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=${countryCode}&viewbox=${viewbox}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    resolve([lat, lon]);
                } else {
                    reject(`Не удалось найти координаты для ${location}`);
                }
            })
            .catch(error => reject(error));
    });
}

async function loadLocations() {
    try {
        const response = await fetch('./data/locations.json');
        if (!response.ok) {
            throw new Error('Ошибка загрузки файла locations.json');
        }
        const locations = await response.json();
        addMarkers(locations);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

async function addMarkers(locations) {
    const locationsList = document.getElementById('locations');
    for (let location of locations) {
        try {
            if (location && location.name) {
                const viewbox = viewboxes["Донецкая"];
                const coords = await geocodeLocation(location.name, 'UA', viewbox);
                if (coords && coords.length > 0) {
                    // Создаём кастомную иконку с кружком и картинкой
                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background-color: #7e0001; border-radius: 50%; width: 18px; height: 18px; display: flex; justify-content: center; align-items: center; background-image: url('./crs/image.png'); background-size: cover;"></div>`,
                        iconSize: [12, 12],    // Размер кружка
                        iconAnchor: [8, 8],  // Центр иконки
                        popupAnchor: [0, -8]  // Позиция попапа
                    });

                    const marker = L.marker(coords, { icon: customIcon }).addTo(map);
                    marker.bindPopup(`<b>${location.name}</b>`);

                    location.marker = marker;

                    const listItem = document.createElement('li');
                    const formattedDate = formatDate(location.date);
                    listItem.innerHTML = `${location.name} <small>(${formattedDate})</small>`;
                    listItem.onclick = () => {
                        map.setView(coords, 10);
                        marker.openPopup();
                    };
                    listItem.onmouseover = () => {
                        listItem.style.backgroundColor = '#e0e0e0';
                    };
                    listItem.onmouseout = () => {
                        listItem.style.backgroundColor = '';
                    };
                    locationsList.appendChild(listItem);

                    // Обработчик клика на маркер (для попапа)
                    marker.on('click', () => {
                        marker.openPopup();
                    });
                }
            }
        } catch (error) {
            console.error(`Ошибка с локацией ${location.name}:`, error);
        }
    }
}

loadLocations();

// Обработчик для переключения видимости слоя GeoJSON
document.getElementById('toggle-geojson').addEventListener('click', () => {
    if (geojsonLayer) {
        if (map.hasLayer(geojsonLayer)) {
            map.removeLayer(geojsonLayer);
            document.getElementById('toggle-geojson').textContent = 'Включить фронт';
        } else {
            map.addLayer(geojsonLayer);
            document.getElementById('toggle-geojson').textContent = 'Выключить фронт';
        }
    }
});

document.getElementById('toggle-geojson').addEventListener('click', () => {
    if (geojsonLayer1) {
        if (map.hasLayer(geojsonLayer1)) {
            map.removeLayer(geojsonLayer1);
            document.getElementById('toggle-geojson').textContent = 'Включить фронт  ';
        } else {
            map.addLayer(geojsonLayer1);
            document.getElementById('toggle-geojson').textContent = 'Выключить фронт';
        }
    }
});

var citiesGeojsonUrl = './data/city_test.geojson';

// Переменная для хранения данных GeoJSON
var cityData = null;

// Слой для отображения найденных маркеров
var searchLayer = L.layerGroup().addTo(map);

// Загрузка данных GeoJSON
fetch(citiesGeojsonUrl)
    .then(response => response.json())
    .then(data => {
        cityData = data; // Сохраняем данные в переменную
    })
    .catch(error => {
        console.error('Ошибка загрузки GeoJSON с городами:', error);
    });

// Функция поиска
function searchPlace() {
    var searchTerm = document.getElementById('search-input').value;
    if (searchTerm && cityData) {
        searchLayer.clearLayers(); // Очищаем предыдущие результаты поиска
        var found = false;

        // Поиск по данным
        cityData.features.forEach(function(feature) {
            if (feature.properties.name.toLowerCase() === searchTerm.toLowerCase()) {
                var latLng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                var marker = L.marker(latLng)
                    .bindPopup(feature.properties.name)
                    .addTo(searchLayer); // Добавляем маркер в searchLayer

                // Подлет к найденному месту
                map.setView(latLng, 10);

                // Добавляем обработчик правого клика для удаления маркера
                marker.on('contextmenu', function(e) {
                    searchLayer.removeLayer(marker); // Удаляем маркер
                });

                found = true;
            }
        });

        if (!found) {
            alert("Населенный пункт не найден");
        }
    }
}

// Обработчик события для кнопки поиска
document.getElementById('search-button').addEventListener('click', searchPlace);

// Обработчик события для нажатия Enter в поле ввода
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchPlace();
    }
});

