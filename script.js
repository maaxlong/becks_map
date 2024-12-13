document.addEventListener('DOMContentLoaded', function() {
  // Define latitude, longitude, and zoom level
  var latitude = (53.7808253 + 53.804090352) / 2;      // Approximately 53.792457826
  var longitude = (-1.7708349 + -1.726866479) / 2;     // Approximately -1.7488506895
  var zoomLevel = 14; // Adjust as needed

  // Initialize the map
  var map = L.map('map').setView([latitude, longitude], zoomLevel);

  // Define the bounds of the map
  var bounds = [
    [53.7808253, -1.7708349],      // Southwest corner
    [53.804090352, -1.726866479]   // Northeast corner
  ];

  // Set the maximum bounds of the map
  map.setMaxBounds(bounds);
  
  // Create length control
  var lengthControl = L.control({ position: 'bottomright' });

  lengthControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'length-control');
    this.update();
    return this._div;
  };

  lengthControl.update = function(totalLength) {
    var formattedLength = totalLength ? totalLength.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0;
    this._div.innerHTML = '<h4>Exposed waterways: ' + formattedLength + ' metres</h4>';
  };

  lengthControl.addTo(map);

  // Initialize variables
  var geojsonLayer1, geojsonLayer2, geojsonLayer3;
  var totalLength1 = 0, totalLength2 = 0, totalLength3 = 0;
  var layerGroup1, layerGroup2, layerGroup3;

  // Initialize a counter for loaded layers
  var layersLoaded = 0;
  var totalLayers = 3; // Total number of layers to load

  // Define the custom LayersControlWithTitle
  var LayersControlWithTitle = L.Control.Layers.extend({
    onAdd: function(map) {
      var container = L.Control.Layers.prototype.onAdd.call(this, map);
      var title = L.DomUtil.create('div', 'layers-control-title');
      title.innerHTML = '<strong>Select Year</strong>';
      container.insertBefore(title, container.firstChild);
      return container;
    }
  });

  var visibleBounds = L.latLngBounds(
    [53.7808253, -1.7708349],  // Southwest corner
    [53.804090352, -1.726866479]  // Northeast corner
  );

  // Create a larger polygon covering the entire map area
  var outerBounds = [
    [-90, -180],
    [90, -180],
    [90, 180],
    [-90, 180]
  ];

  // Convert bounds to a polygon for the visible area
  var innerBounds = [
    [53.7808253, -1.7708349],
    [53.804090352, -1.7708349],
    [53.804090352, -1.726866479],
    [53.7808253, -1.726866479],
    [53.7808253, -1.7708349]
  ];

  // Create a mask using the outer polygon with a hole for the visible area
  var mask = L.polygon([outerBounds, innerBounds], {
    color: 'black',
    fillColor: 'black',
    fillOpacity: 0.7, // Adjust opacity to block tiles
    stroke: false
  }).addTo(map);

  // Function to check if all layers are loaded
  function checkLayersLoaded() {
    layersLoaded++;
    if (layersLoaded === totalLayers) {
      // All layers are loaded, add the custom layer control with title
      var baseMaps = {
        "1852": layerGroup1,
        "1873": layerGroup2,
        "1908": layerGroup3
      };
      var layersControl = new LayersControlWithTitle(baseMaps, null, { position: 'topright' });
      layersControl.addTo(map);

      // Update length control for initial map
      lengthControl.update(totalLength1);

      // Add event listener for baselayerchange
      map.on('baselayerchange', function(e) {
        var totalLength = 0;
        switch (e.name) {
          case '1852':
            totalLength = totalLength1;
            break;
          case '1873':
            totalLength = totalLength2;
            break;
          case '1908':
            totalLength = totalLength3;
            break;
        }
        lengthControl.update(totalLength);
      });
    }
  }

  // Function to calculate total length
  function calculateTotalLength(geojsonData) {
    let totalLength = 0;
    geojsonData.features.forEach(feature => {
      if (feature.properties.length) {
        totalLength += feature.properties.length;
      } else {
        console.warn('Feature without length property:', feature);
      }
    });
    return totalLength;
  }

  // Function to load GeoJSON files
  function loadGeoJSON(url, basemap, callback) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        var totalLength = calculateTotalLength(data);
        var geojsonLayer = L.geoJSON(data);
        var layerGroup = L.layerGroup([basemap, geojsonLayer]);
        callback(geojsonLayer, layerGroup, totalLength);
      })
      .catch(error => console.error('Error loading GeoJSON:', error));
  }

  // Define basemaps
  var basemap1 = L.tileLayer('https://mapseries-tilesets.s3.amazonaws.com/os/town-england/Bradford/{z}/{x}/{y}.png', {
    bounds: bounds, 
    minZoom: 14,
  	maxZoom: 20,
    attribution: 'National Library of Scotland'
  }); // 1852
  var basemap2 = L.tileLayer('https://allmaps.xyz/maps/682c0c5a6a17c868/{z}/{x}/{y}.png', {
    bounds: bounds, 
    minZoom: 14,
  	maxZoom: 20,
    attribution: 'National Library of Scotland'
  }); // 1873
  var basemap3 = L.tileLayer('https://mapseries-tilesets.s3.amazonaws.com/25_inch/yorkshire/{z}/{x}/{y}.png', {
    bounds: bounds,
    minZoom: 14,
  	maxZoom: 20,
    attribution: 'National Library of Scotland'
  }); // 1908


  // Load each GeoJSON and set up layers
  loadGeoJSON('1852.geojson', basemap1, function(layer, group, length) {
    geojsonLayer1 = layer;
    layerGroup1 = group;
    totalLength1 = length;
    layerGroup1.addTo(map); // Add the first layer to the map
    checkLayersLoaded();
  });

  loadGeoJSON('1873.geojson', basemap2, function(layer, group, length) {
    geojsonLayer2 = layer;
    layerGroup2 = group;
    totalLength2 = length;
    checkLayersLoaded();
  });

  loadGeoJSON('1908.geojson', basemap3, function(layer, group, length) {
    geojsonLayer3 = layer;
    layerGroup3 = group;
    totalLength3 = length;
    checkLayersLoaded();
  });
})
