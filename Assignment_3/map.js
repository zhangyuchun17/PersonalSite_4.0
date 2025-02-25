mapboxgl.accessToken = 'pk.eyJ1Ijoiemhhbmd5dWMyMSIsImEiOiJjbTZmYXQ4MHEwMzZ5Mm1vdDF3ZzJ1dG0xIn0.C5cWrhKHt5BdYRDPF0YIqQ';
const geojsonUrl = './data/merged_world_lgbt.geojson.gz'; // Compressed file

function fetchAndDecompressGeoJSON(url) {
    return fetch(url)
        .then(response => response.arrayBuffer()) // Get GZIP binary data
        .then(buffer => {
            const decompressed = pako.inflate(new Uint8Array(buffer), { to: "string" }); // Decompress GZIP
            return JSON.parse(decompressed); // Convert to JSON
        });
}

function createMap(container, projection, colorScale, classification, legendHTML) {
    const map = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [0, 20],
        zoom: 1.5,
        maxZoom: 6,
        minZoom: 1,
        projection: projection
    });

    map.on('load', () => {
        fetchAndDecompressGeoJSON(geojsonUrl).then(data => {
                // Filter out countries with null index values
                data.features = data.features.filter(feature => feature.properties.index !== null);

                map.addSource('lgbt-rights-' + container, {
                    type: 'geojson',
                    data: data
                });

                let colorExpression = ['interpolate', ['linear'], ['get', 'index']];
                if (classification === 'equalInterval') {
                    colorExpression.push(
                        -3.73, '#d73027',
                        2.5, '#fc8d59',
                        6.5, '#ffffbf',
                        10, '#91cf60',
                        13, '#1a9850'
                    );
                } else if (classification === 'quantile') {
                    colorExpression = ['step', ['get', 'index'],
                        '#d73027', -2,
                        '#fc8d59', 1,
                        '#ffffbf', 5,
                        '#91cf60', 9,
                        '#1a9850' 
                    ];
                } else if (classification === 'naturalBreaks') {
                    colorExpression.push(
                        -3.73, '#67001f',
                        0, '#d6604d',
                        4, '#f7f7f7',
                        8, '#92c5de',
                        13, '#053061'
                    );
                }

                map.addLayer({
                    id: 'lgbt-rights-layer-' + container,
                    type: 'fill',
                    source: 'lgbt-rights-' + container,
                    paint: {
                        'fill-color': colorExpression,
                        'fill-opacity': 0.7,
                        'fill-outline-color': '#000'
                    }
                });

                map.on('click', 'lgbt-rights-layer-' + container, (e) => {
                    const NAME = e.features[0].properties.NAME || 'Unknown';
                    const index = e.features[0].properties.index;
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`<strong>${NAME}</strong><br>Rights Index: ${index}`)
                        .addTo(map);
                });
            });
    });

    // Add a unique legend for each map
    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = legendHTML;
    document.getElementById(container).appendChild(legend);
}

createMap('map-mercator', 'mercator', ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'], 'equalInterval', `
    <strong>Equal Interval Classification</strong><br>
    <span style="background:#d73027;width:10px;height:10px;display:inline-block;"></span> -3.73 to 2.5<br>
    <span style="background:#fc8d59;width:10px;height:10px;display:inline-block;"></span> 2.5 to 6.5<br>
    <span style="background:#ffffbf;width:10px;height:10px;display:inline-block;"></span> 6.5 to 10<br>
    <span style="background:#91cf60;width:10px;height:10px;display:inline-block;"></span> 10 to 13<br>
`);

createMap('map-equalearth', 'equalEarth', ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'], 'quantile', `
    <strong>Quantile Classification</strong><br>
    <span style="background:#d73027;width:10px;height:10px;display:inline-block;"></span> -3.73 to -2<br>
    <span style="background:#fc8d59;width:10px;height:10px;display:inline-block;"></span> -2 to 1<br>
    <span style="background:#ffffbf;width:10px;height:10px;display:inline-block;"></span> 1 to 5<br>
    <span style="background:#91cf60;width:10px;height:10px;display:inline-block;"></span> 5 to 9<br>
    <span style="background:#1a9850;width:10px;height:10px;display:inline-block;"></span> 9 to 13<br>
`);

createMap('map-winkeltripel', 'winkelTripel', ['#67001f', '#d6604d', '#f7f7f7', '#92c5de', '#053061'], 'naturalBreaks', `
    <strong>Natural Breaks Classification</strong><br>
    <span style="background:#67001f;width:10px;height:10px;display:inline-block;"></span> -3.73 to 0<br>
    <span style="background:#d6604d;width:10px;height:10px;display:inline-block;"></span> 0 to 4<br>
    <span style="background:#f7f7f7;width:10px;height:10px;display:inline-block;"></span> 4 to 8<br>
    <span style="background:#92c5de;width:10px;height:10px;display:inline-block;"></span> 8 to 13<br>
`);