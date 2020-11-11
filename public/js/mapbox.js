export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZ2NydW5rIiwiYSI6ImNrZ3JpMTk3czBxbGcyc2xxampxeG4wbW4ifQ.lO3skggQVY3ifmku0KlTWQ';

  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-112.987418, 37.198125],
        },
        properties: {
          description: 'Zion Canyon National Park',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-111.376161, 36.86438],
        },
        properties: {
          description: 'Antelope Canyon',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-112.115763, 36.058973],
        },
        properties: {
          description: 'Grand Canyon National Park',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-116.107963, 34.011646],
        },
        properties: {
          description: 'Joshua Tree National Park',
        },
      },
    ],
  };

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/gcrunk/ckgribvn50c6g19mf03lp104x',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(function (marker) {
    var el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(marker.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
      closeOnClick: false,
    })
      .setLngLat(marker.coordinates)
      .setHTML('<p>' + marker.description + '</p>')
      .addTo(map);

    bounds.extend(marker.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 50,
      right: 50,
    },
  });

  map.on('load', function () {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: locations.map((loc) => loc.coordinates),
          },
        },
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#55c57a',
        'line-opacity': 0.6,
        'line-width': 3,
      },
    });
  });
};
