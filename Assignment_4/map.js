mapboxgl.accessToken = 'pk.eyJ1Ijoiemhhbmd5dWMyMSIsImEiOiJjbTZmYXQ4MHEwMzZ5Mm1vdDF3ZzJ1dG0xIn0.C5cWrhKHt5BdYRDPF0YIqQ';

function fetchAndDecompressGeoJSON(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${url}, status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            try {
                const decompressed = pako.inflate(new Uint8Array(buffer), { to: "string" });
                return JSON.parse(decompressed);
            } catch (err) {
                throw new Error("Gzip decompression failed: " + err.message);
            }
        });
}

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-98, 38.88],
    minZoom: 2,
    zoom: 3
});

// 确保 `map.load` 事件完成后再执行 `fetchAndDecompressGeoJSON`
map.on('load', function () {
    console.log("Map loaded successfully!");

    // 加载 states 数据（无压缩，直接可用）
    map.addSource('states', {
        'type': 'geojson',
        'data': './data/merged_states.geojson'
    });

    map.addLayer({
        'id': 'states-layer',
        'type': 'fill',
        'source': 'states',
        'paint': {
    'fill-color': ['interpolate', ['linear'],
        ['coalesce', ['get', 'same_sex_ratio'], 0], // 处理 null 值
        0.0025, '#ffebee',
        0.0075, '#ffbbca',
        0.015, '#fc7899',
        0.03, '#f13f80',
        0.05, '#b0003a'
    ],
            'fill-opacity': 0.7
        },
        'maxzoom': 6
    });

    map.addLayer({
        'id': 'highlight-border',
        'type': 'line',
        'source': 'states',
        'paint': {
            'line-color': '#000',
            'line-width': 1
        },
        'filter': ['==', 'GEOID', '']
    });

    // **等待 counties 数据解压后再添加到 map**
    fetchAndDecompressGeoJSON('./data/merged_counties.geojson.gz')
        .then(geojsonData => {
            console.log("Counties data loaded successfully!");
            map.addSource('counties', {
                'type': 'geojson',
                'data': geojsonData
            });

            map.addLayer({
                'id': 'counties-layer',
                'type': 'fill',
                'source': 'counties',
                'paint': {
                    'fill-color': ['interpolate', ['linear'],
                        ['coalesce', ['get', 'same_sex_ratio'], 0], // 处理 null 值
                        0.0025, '#ffebee', // 非常低
                        0.0075, '#ffbbca', // 低
                        0.015, '#fc7899',  // 中等
                        0.03, '#f13f80',   // 偏高
                        0.05, '#b0003a'    // 最高
                    ],
                    'fill-opacity': 0.7
                },
                'minzoom': 6
            });

            map.addLayer({
                'id': 'highlight-border-counties',
                'type': 'line',
                'source': 'counties',
                'paint': {
                    'line-color': '#000',
                    'line-width': 1
                },
                'filter': ['==', 'GEOID', '']
            });

        })
        .catch(error => console.error("Error loading counties data:", error.message));


    // Add hover effect (black border for both states and counties)
    map.addLayer({
        'id': 'highlight-border',
        'type': 'line',
        'source': 'states',
        'paint': {
            'line-color': '#000',
            'line-width': 1
        },
        'filter': ['==', 'GEOID', ''] // Start with no highlight
    });

    map.addLayer({
        'id': 'highlight-border-counties',
        'type': 'line',
        'source': 'counties',
        'paint': {
            'line-color': '#000',
            'line-width': 1
        },
        'filter': ['==', 'GEOID', '']
    });

    let hoveredFeatureId = null;

    map.on('mousemove', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['states-layer', 'counties-layer']
        });
        
        if (features.length) {
            var props = features[0].properties;
            var layerId = features[0].layer.id === 'states-layer' ? 'highlight-border' : 'highlight-border-counties';
            map.setFilter(layerId, ['==', 'GEOID', props.GEOID]); // Highlight border
        } else {
            map.setFilter('highlight-border', ['==', 'GEOID', '']); // Remove highlight
            map.setFilter('highlight-border-counties', ['==', 'GEOID', '']); // Remove highlight
        }
    });

    // Create legend
 // 创建 legend 并初始化
var legend = document.createElement('div');
legend.id = 'legend';
legend.style.position = 'absolute';
legend.style.bottom = '10px';
legend.style.left = '10px';
legend.style.background = 'white';
legend.style.padding = '5px';
legend.style.fontSize = '10px'; // 调小字体
legend.style.textAlign = 'left';
document.body.appendChild(legend);

// 更新 legend 的函数
function updateLegend(zoomLevel) {
    let levelLabel = zoomLevel < 6 ? "(State)" : "(County)";
    
    legend.innerHTML = `<strong style='font-size:12px;'>Same-Sex Ratio ${levelLabel}</strong><br>
        <div style='background:#ffebee; width:15px; height:15px; display:inline-block;'></div> 0.25%-0.75%<br>
        <div style='background:#ffbbca; width:15px; height:15px; display:inline-block;'></div> 0.75%-1.5%<br>
        <div style='background:#fc7899; width:15px; height:15px; display:inline-block;'></div> 1.5%-3.0%<br>
        <div style='background:#f13f80; width:15px; height:15px; display:inline-block;'></div> 3.0%-5.0%<br>
        <div style='background:#b0003a; width:15px; height:15px; display:inline-block;'></div> 5.0%+<br>`;
}

// 监听地图缩放事件，动态更新 legend
map.on('zoom', function () {
    updateLegend(map.getZoom());
});

// 初始化 legend
updateLegend(map.getZoom());


// Tooltip 创建
var tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.style.position = 'absolute';
tooltip.style.background = 'white';
tooltip.style.padding = '5px';
tooltip.style.border = '1px solid black';
tooltip.style.display = 'none';
tooltip.style.fontSize = '10px';
tooltip.style.textAlign = 'left';
tooltip.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
tooltip.style.borderRadius = '5px';

// 关闭按钮
var closeButton = document.createElement('span');
closeButton.innerHTML = '&times;';
closeButton.style.position = 'absolute';
closeButton.style.top = '3px';
closeButton.style.right = '5px';
closeButton.style.cursor = 'pointer';
closeButton.style.fontSize = '14px';
closeButton.onclick = function () {
    tooltip.style.display = 'none';
};

tooltip.appendChild(closeButton);
document.body.appendChild(tooltip);

map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point, {
        layers: ['states-layer', 'counties-layer']
    });

    if (features.length) {
        var props = features[0].properties;

        function formatNumber(num) {
            return num ? parseInt(num).toLocaleString() : "No Data";
        }

        function formatPercentage(num) {
            return num ? (parseFloat(num) * 100).toFixed(2) + "%" : "No Data";
        }

        tooltip.innerHTML = `<strong style='font-size:14px;'>${props.NAME_x}</strong><br>
            Opposite-Sex Spouse: ${formatNumber(props.B09019_010E)}<br>
            Same-Sex Spouse: ${formatNumber(props.B09019_011E)}<br>
            Opposite-Sex Partner: ${formatNumber(props.B09019_012E)}<br>
            Same-Sex Partner: ${formatNumber(props.B09019_013E)}<br>
            <strong>Same-Sex Ratio:</strong> ${formatPercentage(props.same_sex_ratio)}`;
        
        tooltip.appendChild(closeButton); // 重新附加关闭按钮
        
        tooltip.style.left = e.originalEvent.pageX + 10 + 'px';
        tooltip.style.top = e.originalEvent.pageY + 10 + 'px';
        tooltip.style.display = 'block';
    }
});
});

