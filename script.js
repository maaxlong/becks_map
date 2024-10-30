document.addEventListener('DOMContentLoaded', function() {
  // Define latitude, longitude, and zoom level
  var latitude = (53.7808253 + 53.804090352) / 2;      // Approximately 53.792457826
  var longitude = (-1.7708349 + -1.726866479) / 2;     // Approximately -1.7488506895
  var zoomLevel = 15; // Adjust as needed

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

  // Define basemaps
  var basemap1 = L.tileLayer('https://geo.nls.uk/mapdata3/os/town_england/Bradford/{z}/{x}/{y}.png', {
    attribution: 'Attribution1'
  }); // 1848
  var basemap2 = L.tileLayer('https://mapseries-tilesets.s3.amazonaws.com/os/six-inch-yorkshire/{z}/{x}/{y}.png', {
    attribution: 'Attribution2'
  }); // 1852
  var basemap3 = L.tileLayer('https://geo.nls.uk/mapdata3/os/town_england/North/{z}/{x}/{y}.png', {
    attribution: 'Attribution3'
  }); // 1891
  var basemap4 = L.tileLayer('https://mapseries-tilesets.s3.amazonaws.com/25_inch/yorkshire/{z}/{x}/{y}.png', {
    attribution: 'Attribution4'
  }); // 1908
  var basemap5 = L.tileLayer('https://api.maptiler.com/tiles/uk-osgb10k1888/{z}/{x}/{y}.jpg?key=yTjHGySI1O0GBeIuFBYT', {
    attribution: 'Attribution5'
  }); // 1905-9

  // Initialize variables
  var geojsonLayer1, geojsonLayer2, geojsonLayer3, geojsonLayer4, geojsonLayer5;
  var totalLength1 = 0, totalLength2 = 0, totalLength3 = 0, totalLength4 = 0, totalLength5 = 0;
  var layerGroup1, layerGroup2, layerGroup3, layerGroup4, layerGroup5;

  // Initialize a counter for loaded layers
  var layersLoaded = 0;
  var totalLayers = 5; // Total number of layers to load

  // Function to check if all layers are loaded
  function checkLayersLoaded() {
    layersLoaded++;
    if (layersLoaded === totalLayers) {
      // All layers are loaded, add the layer control
      var baseMaps = {
        "1848 Map": layerGroup1,
        "1852 Map": layerGroup2,
        "1891 Map": layerGroup3,
        "1908 Map": layerGroup4,
        "1905-09 Map": layerGroup5
      };
      L.control.layers(baseMaps).addTo(map);

      // Add event listener for baselayerchange
      map.on('baselayerchange', function(e) {
        var totalLength = 0;
        switch (e.name) {
          case '1848 Map':
            totalLength = totalLength1;
            break;
          case '1852 Map':
            totalLength = totalLength2;
            break;
          case '1891 Map':
            totalLength = totalLength3;
            break;
          case '1908 Map':
            totalLength = totalLength4;
            break;
          case '1905-09 Map':
            totalLength = totalLength5;
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

  // Load GeoJSON files
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

  // Load each GeoJSON and set up layers
  loadGeoJSON('1848.geojson', basemap1, function(layer, group, length) {
    geojsonLayer1 = layer;
    layerGroup1 = group;
    totalLength1 = length;
    layerGroup1.addTo(map); // Add the first layer group to the map
    lengthControl.update(totalLength1); // Update length control
    checkLayersLoaded(); // Check if all layers are loaded
  });

  loadGeoJSON('1852.geojson', basemap2, function(layer, group, length) {
    geojsonLayer2 = layer;
    layerGroup2 = group;
    totalLength2 = length;
    // Do not add to map yet
    checkLayersLoaded();
  });

  loadGeoJSON('1891.geojson', basemap3, function(layer, group, length) {
    geojsonLayer3 = layer;
    layerGroup3 = group;
    totalLength3 = length;
    checkLayersLoaded();
  });

  loadGeoJSON('1908.geojson', basemap4, function(layer, group, length) {
    geojsonLayer4 = layer;
    layerGroup4 = group;
    totalLength4 = length;
    checkLayersLoaded();
  });

  loadGeoJSON('1905-09.geojson', basemap5, function(layer, group, length) {
    geojsonLayer5 = layer;
    layerGroup5 = group;
    totalLength5 = length;
    checkLayersLoaded();
  });
});
