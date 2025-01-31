const map = L.map('map').setView([48.5, 37.5], 8);

// Слой Light (CartoDB) — белая подложка
var CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 13,
    minZoom: 7
});

// Слой OSM (OpenStreetMap)
var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
});

// Новый слой Esri World Imagery
var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Новый слой Stadia Alidade Satellite
var Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ext: 'jpg'
});

// Добавление белой подложки по умолчанию
CartoDB_PositronNoLabels.addTo(map);

// Объединение всех слоев без спутникового слоя
var baseMaps = {
    "Светлая": CartoDB_PositronNoLabels,
    "OSM": OpenStreetMap_Mapnik,
    "Esri World Imagery": Esri_WorldImagery,
    "Stadia Satellite": Stadia_AlidadeSatellite
};

// Добавление панели выбора слоев
L.control.layers(baseMaps).addTo(map);











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

document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggle-list');
    const locationsList = document.getElementById('locations');

    // Убедиться, что список скрыт при загрузке страницы
    locationsList.classList.add('hidden');

    // Обработчик для кнопки раскрытия/скрытия списка
    toggleButton.addEventListener('click', function() {
        if (locationsList.classList.contains('hidden')) {
            locationsList.classList.remove('hidden');
            toggleButton.textContent = '▼';
        } else {
            locationsList.classList.add('hidden');
            toggleButton.textContent = '▲';
        }
    });

    // Загрузка локаций (например, сюда добавить функцию, которая наполняет список)
    loadLocations();
});


async function loadLocations() {
    try {
        const response = await fetch('./locations.json');
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

var locationsOblast = {
    dpr: { lat: 48.2, lon: 37.0, zoom: 10 },
    lpr: { lat: 49.5, lon: 38.0, zoom: 9 },
    kherson: { lat: 46.8, lon: 34.0, zoom: 8 },
    zaporizhzhia: { lat: 47.7, lon: 36.1, zoom: 9 },
    kursk: { lat: 51.3, lon: 35.2, zoom: 10 }
  };

  // Функция для перемещения на выбранную область
  function moveToArea(area) {
    var location = locationsOblast[area];
    if (location) {
      map.setView([location.lat, location.lon], location.zoom);
    }
  }

  // Обработчики событий для кнопок
  document.getElementById('dpr').addEventListener('click', function() {
    moveToArea('dpr');
  });

  document.getElementById('lpr').addEventListener('click', function() {
    moveToArea('lpr');
  });

  document.getElementById('kherson').addEventListener('click', function() {
    moveToArea('kherson');
  });

  document.getElementById('zaporizhzhia').addEventListener('click', function() {
    moveToArea('zaporizhzhia');
  });

  document.getElementById('kursk').addEventListener('click', function() {
    moveToArea('kursk');
  });






  function toggleMenu() {
    var menu = document.getElementById('menu');
    var toggleButton = document.getElementById('menu-toggle');
    var body = document.body;
    
    menu.classList.toggle('open');
    if (menu.classList.contains('open')) {
        toggleButton.style.right = '310px';
        body.classList.add('menu-open'); // Блокируем прокрутку
    } else {
        toggleButton.style.right = '20px';
        body.classList.remove('menu-open'); // Разблокируем прокрутку
    }
}





         // Обработчик для начала перетаскивания (для всех иконок)
         document.querySelectorAll('.draggable').forEach(item => {
            item.addEventListener('dragstart', function(event) {
                // Запоминаем, какой маркер был выбран
                event.dataTransfer.setData('markerType', event.target.id);
            });
        });

        var mapContainer = document.getElementById('map');
        mapContainer.addEventListener('dragover', function(event) {
            event.preventDefault(); // Необходимо для разрешения drop-события
        });

        var markers = []; // Массив для хранения маркеров

        // Обработчик события "drop" для размещения маркера на карте
        mapContainer.addEventListener('drop', function(event) {
            event.preventDefault();
            // Получаем тип маркера (например, marker1, marker2 и т.д.)
            var markerType = event.dataTransfer.getData('markerType');
            var latlng = map.mouseEventToLatLng(event); // Получаем координаты точки на карте

            // Устанавливаем иконку для маркера в зависимости от выбранного элемента
            var iconUrl = '';
            if (markerType === 'marker1') {
                iconUrl = './crs/boi.png';
            } else if (markerType === 'marker2') {
                iconUrl = './crs/udar.png';
            } else if (markerType === 'marker3') {
                iconUrl = './crs/vzat.png';
            } else if (markerType === 'marker4') {
                iconUrl = './crs/vsu.png';
            } else if (markerType === 'marker5') {
                iconUrl = './crs/fsrf.png';
            }

            // Создаем иконку маркера
            var customIcon = L.icon({
                iconUrl: iconUrl,
                iconSize: [30, 30], // Размер иконки
                iconAnchor: [15, 15] // Якорь иконки (позиция, где маркер будет прикреплен)
            });

            // Создаем маркер и добавляем его на карту
            var marker = L.marker(latlng, { icon: customIcon }).addTo(map);
            
            // Включаем возможность перетаскивания маркера
            marker.dragging.enable();

            // Слушаем событие правой кнопкой мыши для удаления маркера
            marker.on('contextmenu', function() {
                map.removeLayer(marker);
                markers = markers.filter(m => m !== marker); // Удаляем маркер из массива
            });

            // Добавляем маркер в массив
            markers.push(marker);
        });