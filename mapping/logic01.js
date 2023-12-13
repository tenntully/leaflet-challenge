// access the URL endpoint
// URLendpt = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson"
URLendpt = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
d3.json(URLendpt).then(function(data){
    //console.log(data);
    // call the createFeatures function
    createFeatures(data.features); // send the features property over
});

var limits
var colors

// make functions to process the data
function createFeatures(earthquakeData)
{
    // console.log(earthquakeData); 
    
    // create popup
    function onEachFeature(feature, layer){
        layer.bindPopup(
            `<b>${feature.properties.place}</b><hr>
            <i>Time: </i>${new Date(feature.properties.time)}<br>
            <i>Magnitude: </i>${feature.properties.mag}<br>
            <i>Depth: </i>${feature.geometry.coordinates[2]}`
        );
    }

    // Define limits and colors using earthquake depth and chroma
    const fillColorValue = earthquakeData.map(feature => feature.geometry.coordinates[2]);
    limits = chroma.limits(fillColorValue, 'q', 5);
    // console.log(limits);

    // use L.geoJSON to make the geoJSON marker layer
    var earthquakes = L.geoJSON(earthquakeData, {
        onEachFeature: onEachFeature, 
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
              radius: feature.properties.mag * 2,
              color: "grey",
              fillColor: getColor(feature.geometry.coordinates[2], limits),
              weight: 1,
              opacity: 1,
              fillOpacity: 0.75
          });
        }
    });
    createMap(earthquakes, limits);
}

function getColor(value, limits) {
  // Use the chroma scale to interpolate a color based on the value
  const scale = chroma.scale(['white', 'blue']).domain(limits);
  return scale(value).hex();
}

function createMap(earthquakes, limits)
{
    // add the tile layer
    var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });
    
    // make a tileLayer object
    var tiles = {
        "Street Map": street,
        "Topography Map": topo
    };
    
    // make overlay that uses the earthquake geoJSON marker layer
    var overlays = {
        "Earthquake Data": earthquakes
    };

    // make the map with the defaults
    var myMap = L.map("map",
        {
            center: [45, -115],
            zoom: 3.5,
            layers: [street, earthquakes]
        }
    );

    // layer control
    L.control.layers(tiles, overlays, {
       collapsed: false
    }).addTo(myMap);

    // add the legend
    var legend = addLegend(earthquakes, limits);
    // console.log(legend);
    legend.addTo(myMap);
}

// Create legend using earthquake data and limits
function addLegend(earthquakes, limits) { 
  let legend = L.control({position: 'bottomright'});

  legend.onAdd = function () {
      let div = L.DomUtil.create('div', 'info legend');
      div.innerHTML += '<h4>Earthquake Depth</h4>';
      let labels = [];

      // loop through limits and generate a label with a colored square for each interval
      for (var i = 0; i < limits.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(limits[i], limits) + '"></i> ' +
              limits[i].toFixed(0) + (limits[i + 1] ? '&ndash;' + limits[i + 1].toFixed(0) + '<br>' : '+');
      }
      return div;
  };
  return legend;
}
