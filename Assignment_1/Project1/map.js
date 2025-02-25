mapboxgl.accessToken = 'pk.eyJ1Ijoiemhhbmd5dWMyMSIsImEiOiJjbTZmYXQ4MHEwMzZ5Mm1vdDF3ZzJ1dG0xIn0.C5cWrhKHt5BdYRDPF0YIqQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/zhangyuc21/cm6jjlkvs00wy01qmalfx31aa', 
    zoom: 12,
    minZoom: 10, // 最小缩放级别
    maxZoom: 14, // 最大缩放级别
    center: [-74, 40.725],
});
