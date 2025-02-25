mapboxgl.accessToken = 'pk.eyJ1Ijoiemhhbmd5dWMyMSIsImEiOiJjbTZmYXQ4MHEwMzZ5Mm1vdDF3ZzJ1dG0xIn0.C5cWrhKHt5BdYRDPF0YIqQ';

// ✅ 初始化 Neighborhood 地图
const map1 = new mapboxgl.Map({
    container: 'map1',
    style: 'mapbox://styles/zhangyuc21/cm6jjlkvs00wy01qmalfx31aa',
    zoom: 10,
    center: [-74, 40.725],
    maxZoom: 15,
    minZoom: 8
});

map1.on('load', function () {
    map1.addSource('neighborhoods', {
        type: 'geojson',
        data: './data/neighborhoods_updated.geojson'
    });

    map1.addLayer({
        id: 'neighborhoods-layer',
        type: 'fill',
        source: 'neighborhoods',
        paint: {
            'fill-color': "#808080",
            'fill-opacity': [
                'interpolate',
                ['linear'], ['get', 'normalized_homo_percentage'],
                0, 0,   
                0.07, 1    
            ]
        }
    });

    map1.addLayer({
        id: 'neighborhoods-boundary',
        type: 'line',
        source: 'neighborhoods',
        paint: {
            'line-color': '#ffffff',
            'line-width': [
                'interpolate', ['linear'], ['zoom'],
                8, 0.3,  
                10, 0.8,  
                12, 1.2,  
                15, 1.5  
            ],
            'line-opacity': 1
        }
    });

    // ✅ 交互
    const popup1 = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    map1.on('mousemove', 'neighborhoods-layer', (e) => {
        map1.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const neighborhood = feature.properties["ntaname"];
        const homoPercentage = feature.properties["homo_percentage"];
        popup1.setLngLat(e.lngLat)
            .setHTML(`<strong>${neighborhood}</strong><br>Homo Percentage: ${(homoPercentage).toFixed(2)}%`)
            .addTo(map1);
    });

    map1.on('mouseleave', 'neighborhoods-layer', () => {
        map1.getCanvas().style.cursor = '';
        popup1.remove();
    });
    const legend1 = document.getElementById('legend1');
legend1.innerHTML = `<strong>Neighborhood (Homo Percentage)</strong>`;

});

// 初始化 LGBTQ 设施地图
const map2 = new mapboxgl.Map({
    container: 'map2',
    style: 'mapbox://styles/zhangyuc21/cm6jjlkvs00wy01qmalfx31aa', 
    zoom: 10,
    center: [-74, 40.725],
    maxZoom: 15,
    minZoom: 8
});

const categoryColors = {
    "Cultural & Educational": "#1f77b4",
    "Public Spaces": "#ff7f0e",
    "Community Centers": "#2ca02c",
    "Medical Facilities": "#d62728",
    "Bars, Clubs & Restaurants": "#9467bd",
    "Restaurants & Cafes": "#8c564b",
    "Stores & Businesses": "#e377c2",
    "Performance Venues": "#7f7f7f",
    "Organizations & Community Spaces": "#bcbd22",
    "Other": "#17becf"
};

map2.on('load', function () {
    fetch('./data/LGBTQ_facilities.geojson')
        .then(response => response.json())
        .then(data => {
            let coordinateMap = {};
            let offsetMap = {};

            data.features.forEach(feature => {
                let coordKey = feature.geometry.coordinates.join(",");
                coordinateMap[coordKey] = (coordinateMap[coordKey] || 0) + 1;
            });

            Object.keys(coordinateMap).forEach(coordKey => {
                let count = coordinateMap[coordKey];
                if (count > 1) {
                    let baseOffset = 0.0003; 
                    offsetMap[coordKey] = [];
                    for (let i = 0; i < count; i++) {
                        let angle = (i / count) * 2 * Math.PI;
                        offsetMap[coordKey].push([
                            baseOffset * Math.cos(angle), 
                            baseOffset * Math.sin(angle)
                        ]);
                    }
                }
            });

            data.features = data.features.map(feature => {
                let coordKey = feature.geometry.coordinates.join(",");
                if (offsetMap[coordKey]) {
                    let offset = offsetMap[coordKey].pop();
                    feature.geometry.coordinates[0] += offset[0];
                    feature.geometry.coordinates[1] += offset[1];
                }
                return feature;
            });

            map2.addSource('lgbtq-facilities', {
                type: 'geojson',
                data: data
            });

            map2.addLayer({
                id: 'lgbtq-points',
                type: 'circle',
                source: 'lgbtq-facilities',
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 2,
                        12, 4,
                        15, 10
                    ],
                    'circle-color': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(categoryColors).flat(),
                        categoryColors["Other"]
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.8
                }
            });
            //高亮放大悬停点
            map2.addLayer({
                id:'highlited-point',
                type:'circle',
                source :'lgbtq-facilities',
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 4,    
                        12, 8,  
                        15, 14   
                    ],
                    'circle-color': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(categoryColors).flat(),
                        categoryColors["Other"]
                    ],
                    'circle-opacity': 0
                }
            });
                // ✅ 添加交互逻辑（鼠标悬停时显示设施信息 + 点放大）
                const popup2 = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
                map2.on('mousemove', 'lgbtq-points', (e) => {
                    map2.getCanvas().style.cursor = 'pointer';
                    const feature = e.features[0];
                    const facilityName = feature.properties["name"];
        const address = feature.properties["address"];

        popup2.setLngLat(e.lngLat)
            .setHTML(`<strong>${facilityName}</strong><br>${address}`)
            .addTo(map2);

            //放大悬停点
            map2.setPaintProperty('highlited-point', 'circle-opacity', 1);
            map2.setFilter('highlited-point', ['==', ['get', 'name'], facilityName]);
                });
                map2.on('mouseleave', 'lgbtq-points', () => {
                    map2.getCanvas().style.cursor = '';
                    popup2.remove();
                    map2.setPaintProperty('highlited-point', 'circle-opacity', 0);
                });

                        // ✅ 添加 LGBTQ 设施图例
                        const legend2 = document.createElement('div');
                        legend2.id = 'legend2';
                        legend2.innerHTML = `<strong>LGBTQ Facilities</strong>`;
                        for (const category in categoryColors) {
                            const item = document.createElement('div');
                            item.className = 'legend-item';
                            const key = document.createElement('span');
                            key.className = 'legend-key';
                            key.style.backgroundColor = categoryColors[category];
                            item.appendChild(key);
                            item.appendChild(document.createTextNode(category));
                            legend2.appendChild(item);
                        }
            
                        document.getElementById('map2').appendChild(legend2);
            
                        const style = document.createElement('style');
                        style.innerHTML = `
                            #legend2 {
                                position: absolute;
                                top: 10px;
                                right: 10px;
                                background: white;
                                padding: 10px;
                                border-radius: 5px;
                                box-shadow: 0 0 5px rgba(0,0,0,0.3);
                                font-size: 12px;
                                font-family: Arial, sans-serif;
                            }
                            .legend-item {
                                display: flex;
                                align-items: center;
                                margin: 5px 0;
                            }
                            .legend-key {
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                margin-right: 5px;
                            }
                        `;
                        document.head.appendChild(style);
        })
        .catch(error => console.error('加载 LGBTQ 设施数据失败:', error));
});
