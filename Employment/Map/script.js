const geoJsonURL = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
let regionsData = []; // This will hold the data for each region

let map, geoJsonLayer; // Declares map and geoJsonLayer variables

let jsonQuery = { // JSON object for the query
    "query": [
        {
            "code": "Alue",
            "selection": {
                "filter": "item",
                "values": [
                    "SSS"
                ]
            }
        },
        {
            "code": "Pääasiallinen toiminta",
            "selection": {
                "filter": "item",
                "values": [
                    "11",
                    "12"
                ]
            }
        },
        {
            "code": "Sukupuoli",
            "selection": {
                "filter": "item",
                "values": [
                    "SSS"
                ]
            }
        },
        {
            "code": "Ikä",
            "selection": {
                "filter": "item",
                "values": [
                    "SSS",
                ]
            }
        },
        {
            "code": "Vuosi",
            "selection": {
                "filter": "item",
                "values": [
                    "2010",
                    "2011",
                    "2012",
                    "2013",
                    "2014",
                    "2015",
                    "2016",
                    "2017",
                    "2018",
                    "2019",
                    "2020",
                    "2021",
                    "2022"
                ]
            }
        }
    ],
    "response": {
        "format": "json-stat2"
    }
};

const fetchGeoJsonData = async () => { // Fetches GeoJSON data
    let response = await fetch(geoJsonURL);
    let data = await response.json();
    if (!map) {
        initMap(data);
    } else {
        updateMap(data);
    }
};

const initMap = function(data) { // Initializes the map
    map = L.map('map', {
        minZoom: -3
    });

    geoJsonLayer = L.geoJSON(data, {
        weight: 2,
        onEachFeature: getFeature,
        style: getStyle
    }).addTo(map);

    let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }).addTo(map);

    let google = L.tileLayer("https://{s}.google.com/vt/lyrs=s@221097413,traffic&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        minZoom: 2,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    let baseMaps = {
        "OpenStreetMap": osm,
        "GoogleMaps": google
    };

    let overlayMaps = {
        "Show Regions": geoJsonLayer
    };

    L.control.layers(baseMaps, overlayMaps, addLegend()).addTo(map);
    map.fitBounds(geoJsonLayer.getBounds());
};

const updateMap = function(data) { // Updates the map
    map.removeLayer(geoJsonLayer);

    geoJsonLayer = L.geoJSON(data, {
        weight: 2,
        onEachFeature: getFeature,
        style: getStyle
    }).addTo(map);

    map.fitBounds(geoJsonLayer.getBounds());
};

const addLegend = () => { // Adds a legend to the map
    // Define the legend
    const legend = L.control({ position: 'topleft' });

    // Utilizes leaflet's onAdd method to add the legend to the map
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend'); // Create a div with class "legend"
        div.innerHTML += '<div style="background: hsl(120,75%,50%)";></div><span>High</span><br>';
        div.innerHTML += '<div style="background: hsl(60,75%,50%)";></div><span>Medium</span><br>';
        div.innerHTML += '<div style="background: hsl(0,75%,50%)";></div><span>Low</span><br>';
        return div;
    };
    legend.addTo(map);
};

const fetchRegion = async () => { // Fetches region/municipality data
    const url = "../../Data/regions.json";
    const res = await fetch(url);
    const data = await res.json();
    return data;
};

const getData = async () => { // Updates the jsonQuery and makes a POST request to the API
    const regions = await fetchRegion();

    jsonQuery.query[0].selection.values = Object.keys(regions); // Updates the region
    jsonQuery.query[4].selection.values = [document.getElementById('year').value]; // Updates the year from the select element

    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115b.px";
    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(jsonQuery)
    });
    if (!res.ok) {
        return;
    }
    const data = await res.json();
    return data;
};

const populateData = async () => { // Populates the data array with the fetched data
    const data = await getData();

    const sortingCriteria = data.dimension.Alue.category.index; // Shows which region is in which index
    let dataValues = data.value;

    dataValues.forEach((value, index) => {
        const region = Object.keys(sortingCriteria).find(key => sortingCriteria[key] === index);
        regionsData[region] = value;
    });
        
    fetchGeoJsonData(); // Calls the fetchGeoJsonData since we now have the necessary data
};

const getFeature = (features, layer) => { // Gets the feature and layer
    const municipality = features.properties.kunta;

    // To show the name of the municipality when hovering over it
    layer.bindTooltip(features.properties.name);

    // Gets the name in the checked radio button
    const radioDiv = document.getElementById('radioDiv');
    const checkedRadio = radioDiv.querySelector('input[type="radio"]:checked');

    // To show the data of the municipality when clicking on it
    layer.bindPopup(
        `<ul>
            <li>Name: ${features.properties.name}</li>
            <li>${checkedRadio.textContent}: ${regionsData[`KU${municipality}`]}</li>
            <li><button onclick="window.location.href='../../Employment/Chart/index.html?KU${municipality}?${checkedRadio.id}'">Chart description</button></li>
        </ul>`
    );
    // The button above will redirect to the chart page with extra information in the URL
};

const getStyle = (features) => { // Returns the style based on the data
    return {
        fillColor: `hsl(${getHue(features)}, 75%, 50%)`,
        color: `hsl(${getHue(features)}, 75%, 50%)`,
        fillOpacity: 0.8
    };
};

const getHue = (features) => { // Returns the hue based on the data
    const data = regionsData[`KU${features.properties.kunta}`];
    if (data > 100000) return 120;
    if (data > 50000) return 100;
    if (data > 10000) return 80;
    if (data > 1000) return 60;
    if (data > 500) return 50;
    if (data > 100) return 20;
    if (data <= 100) return 0;
};

document.addEventListener('DOMContentLoaded', () => { // When the DOM is loaded
    /* NECESSARY ELEMENTS */
    let yearSelect = document.getElementById('year');
    let container = document.querySelector('.dragDropContainer'); // Contains all the drag-and-drop elements and divs
    let dropArea = document.getElementById('dropArea'); // Where the cards are dropped
    let dragArea = document.getElementById('dragArea'); // Where the cards are dragged from
    let cards = document.querySelectorAll('.card'); // The cards that can be dragged
    let top = document.getElementById('top');
    let bottom = document.getElementById('bottom');
    let download = document.getElementById('downloadMap');
    let arrowDown = document.getElementById('arrowDown');


    download.addEventListener("click", () => { // Downloads the map as a PNG
        html2canvas(document.getElementById("map")).then(canvas => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "map.png";
            link.click();
        });
    });

    let years = [2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];
    years.forEach(year => { // Populates the select element with the years
        let option = document.createElement('option');
        option.value = year;
        option.text = year;
        yearSelect.add(option);
    });

    yearSelect.addEventListener('change', () => { // Updates the year when the select element is changed
        populateData();
    });

    /* DRAG AND DROP FUNCTIONALITY */
    cards.forEach(card => {
        card.addEventListener('dragstart', () => { // When the card is dragged
            card.classList.add('dragging'); // Adds the card to a class called 'dragging'
        });
    
        card.addEventListener('dragend', () => { // When the card is dropped
            card.classList.remove('dragging'); // Removes the card from the class 'dragging'
        });
    });
    
    dropArea.addEventListener('dragover', (e) => { // When the card is dragged over the drop area
        e.preventDefault();
    });
    
    dropArea.addEventListener('drop', (e) => { // When the card is dropped in the drop area
        e.preventDefault();
        const card = document.querySelector('.dragging');
        if (card) { // If there is a card being dragged
            dropArea.appendChild(card); // Append the card to the drop area
            card.classList.remove('dragging'); // Remove the card from the class 'dragging'
        }
        getRadioButtons();
    });

    const getRadioButtons = () => { //Creates radio buttons for the cards in the drop area
        const radioDiv = document.getElementById('radioDiv');
    
        let cardsInDropArea = dropArea.querySelectorAll('.card'); // Get all the cards in the drop area

        if (cardsInDropArea.length === 1) { // If there is only one card in the drop area
            jsonQuery.query[1].selection.values = [cardsInDropArea[0].id];
            populateData();
        }
        radioDiv.innerHTML = ''; // Clear any existing content
        const p = document.createElement('p');
        p.textContent = 'Which to show?';
        radioDiv.appendChild(p);

        cardsInDropArea.forEach((card, index) => {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'radio';
            radio.id = card.id;
    
            const cardName = card.querySelector('p').textContent;
    
            const label = document.createElement('label');
            label.textContent = cardName;
            radio.textContent = cardName;
            label.htmlFor = radio.id;

            if (index === 0) { // If it's the first card, check it by default, so there is always a checked radio button
                radio.checked = true;
            }

            const radioContainer = document.createElement('div');
            radioContainer.classList.add('radio-container');
            radioContainer.appendChild(radio);
            radioContainer.appendChild(label);
    
            radioDiv.appendChild(radioContainer);
        });

        radioDiv.querySelectorAll('input[type="radio"]').forEach(radio => { // When a radio button is changed
            radio.addEventListener('change', (event) => {
                jsonQuery.query[1].selection.values = [event.target.id];
                populateData();
            });
        });
    };    

    dragArea.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    dragArea.addEventListener('drop', (e) => { // To allow returning the card to the card container
        e.preventDefault();
        if (dropArea.querySelectorAll('.card').length === 1) {
            getRadioButtons();
            return;
        } 
        const card = document.querySelector('.dragging');
        if (card) {
            dragArea.appendChild(card);
            card.classList.remove('dragging');
        }
        getRadioButtons();
    });

    top.addEventListener('click', () => { // Scrolls to the top of the page
        document.getElementById('topDiv').scrollIntoView({ behavior: 'smooth' });
    });

    bottom.addEventListener('click', () => { // Scrolls to the bottom of the page
        container.scrollIntoView({ behavior: 'smooth' });
    });

    arrowDown.addEventListener("click", () => {
        document.getElementById('topDiv').scrollIntoView({behavior: "smooth"});
    });

    getRadioButtons();
    populateData();
});