const map = L.map('map', { attributionControl: false }).setView([48.5, 37.5], 8);


// Слой Light (CartoDB) — белая подложка
var CartoDB_PositronNoLabels = L.tileLayer('https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png', {
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


// Добавление Mapbox GL слоя
var mapboxGL = L.mapboxGL({
    accessToken: 'pk.eyJ1IjoiZGVuaXNhdmNoZW5rbyIsImEiOiJjbTJkcW9haXgxZ3ZsMmpyMnJvNWtiajk0In0.9VQSet50FTEZ0qMkQCMcsQ',
    style: 'mapbox://styles/denisavchenko/cm6sfy24f016101qxflrp6s2l'
});

// Добавление белой подложки по умолчанию
CartoDB_PositronNoLabels.addTo(map);

// Объединение всех слоев
var baseMaps = {
    "Светлая тема": CartoDB_PositronNoLabels,
    "OCM": OpenStreetMap_Mapnik,
    "Спутник": Esri_WorldImagery,
    "СВО РИК": mapboxGL
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

fetch('./data/rus_front.geojson')  // Укажите путь к вашему GeoJSON файлу
    .then(response => response.json())
    .then(geojsonData => {
        // Добавляем данные GeoJSON на карту с заданием стиля
        geojsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
                return {
                    weight: 0,  // Убираем обводку
                    color: 'transparent',  // Линия прозрачная
                    fillColor: '#b41010',  // Заливка синим цветом
                    fillOpacity: 0.3  // Прозрачность заливки
                };
            }
        }).addTo(map);
    })
    .catch(error => console.error('Ошибка загрузки GeoJSON:', error));

    fetch('./data/ua_front.geojson')  // Укажите путь к вашему GeoJSON файлу
    .then(response => response.json())
    .then(geojsonData1 => {
        // Добавляем данные GeoJSON на карту с заданием стиля
        geojsonLayer1 = L.geoJSON(geojsonData1, {
            style: function (feature) {
                return {
                    weight: 0,  // Убираем обводку
                    color: 'transparent',  // Линия прозрачная
                    fillColor: '#15557e',  // Заливка синим цветом
                    fillOpacity: 0.3  // Прозрачность заливки
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
    const hideAllButton = document.getElementById('hide-all');

    locationsList.classList.add('hidden');

    toggleButton.addEventListener('click', function() {
        if (locationsList.classList.contains('hidden')) {
            locationsList.classList.remove('hidden');
            toggleButton.textContent = '▼';
        } else {
            locationsList.classList.add('hidden');
            toggleButton.textContent = '▲';
        }
    });

    hideAllButton.addEventListener('click', toggleMarkersVisibility);

    loadLocations();
});

let markerzahvat = [];
let markersHidden = false;

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
                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background-color: #7e0001; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; background-image: url('./crs/image.png'); background-size: cover; border: 2.5px solid white;"></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [14, 14],
                        popupAnchor: [0, -8]
                    });

                    const marker = L.marker(coords, { icon: customIcon });

                    if (!markersHidden) {
                        marker.addTo(map);
                    }

                    marker.bindPopup(`<b>${location.name}</b>`);
                    markerzahvat.push(marker);

                    const listItem = document.createElement('li');
                    const formattedDate = formatDate(location.date);
                    listItem.innerHTML = `${location.name} <small>(${formattedDate})</small>`;
                    
                    listItem.onclick = () => {
                        map.setView(coords, 10);

                        if (markersHidden) {
                            marker.addTo(map);
                        }

                        marker.openPopup();

                        marker.on('popupclose', () => {
                            if (markersHidden) {
                                map.removeLayer(marker);
                            }
                        });
                    };

                    listItem.onmouseover = () => {
                        listItem.style.backgroundColor = '#e0e0e0';
                    };
                    listItem.onmouseout = () => {
                        listItem.style.backgroundColor = '';
                    };
                    
                    locationsList.appendChild(listItem);
                }
            }
        } catch (error) {
            console.error(`Ошибка с локацией ${location.name}:`, error);
        }
    }
}

function toggleMarkersVisibility() {
    markersHidden = !markersHidden;

    if (markersHidden) {
        markerzahvat.forEach(marker => map.removeLayer(marker));
        document.getElementById('hide-all').textContent = 'Показать все';
    } else {
        markerzahvat.forEach(marker => marker.addTo(map));
        document.getElementById('hide-all').textContent = 'Скрыть все';
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









var citiesGeojsonUrl = './data/city_all.geojson';

// Переменная для хранения данных GeoJSON
var cityData = null;

// Слой для отображения найденных маркеров
var searchLayer = L.layerGroup().addTo(map);

// Флаг, указывающий, загружены ли данные
var dataLoaded = false;

// Загрузка данных GeoJSON
fetch(citiesGeojsonUrl)
    .then(response => response.json())
    .then(data => {
        cityData = data; // Сохраняем данные в переменную
        dataLoaded = true; // Отмечаем, что данные загружены
    })
    .catch(error => {
        console.error('Ошибка загрузки GeoJSON с городами:', error);
    });

    let searchMarkersCity = []; // Массив для хранения маркеров

    function searchPlace() {
        var searchTerm = document.getElementById('search-input').value.trim();
    
        if (!dataLoaded) {
            alert("Данные о городах еще загружаются. Подождите немного.");
            return;
        }
    
        if (searchTerm) {
            var found = false;
    
            cityData.features.forEach(function(feature) {
                if (feature.properties && feature.properties.namerus) {
                    if (feature.properties.namerus.toLowerCase() === searchTerm.toLowerCase()) {
                        var latLng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
    
                        // Проверяем, есть ли уже маркер на этом месте
                        var existingMarker = null;
                        searchMarkersCity.forEach(function(marker) {
                            if (marker.getLatLng().equals(latLng)) {
                                existingMarker = marker;
                            }
                        });
    
                        if (!existingMarker) {
                            var marker = L.marker(latLng)
                                .bindPopup(feature.properties.namerus, { autoClose: false }) // отключаем autoClose
                                .addTo(searchLayer);
    
                            // Добавляем маркер в массив
                            searchMarkersCity.push(marker);
    
                            // Открываем попап для нового маркера
                            marker.openPopup();
    
                            marker.on('click', function() {
                                marker.openPopup(); // открываем попап при клике
                            });
    
                            marker.on('contextmenu', function() {
                                searchLayer.removeLayer(marker); // удаляем маркер по правому клику
                                searchMarkersCity = searchMarkersCity.filter(m => m !== marker); // удаляем маркер из массива
                            });
                        } else {
                            existingMarker.openPopup(); // открываем попап у существующего маркера
                        }
    
                        map.setView(latLng, 10);
                        found = true;
                    }
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
            var customIcon = L.divIcon({
                className: 'marker-with-border', // Новый класс для стилизации
                html: `<div class="marker-wrapper"><img src="${iconUrl}" class="marker-icon"></div>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19]
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