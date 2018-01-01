const geo = new TimeManagerGeolocation();
geo.getPosition()
    .then((position) => {
        var mapDiv = document.getElementById("map_div");
        geo.initMap(mapDiv);
    })
    .catch((reason) => console.error(reason));