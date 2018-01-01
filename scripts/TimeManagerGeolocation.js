class TimeManagerGeolocation {
    constructor() {
        if (!navigator.geolocation) {
            this.handleLocationError(false);
        }
    }
    ;
    getPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((position) => {
                this.currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                resolve(this.currentPosition);
            }, () => {
                this.handleLocationError(true);
            });
        });
    }
    initMap(mapElement) {
        const gmap = new google.maps.Map(mapElement, {
            zoom: 16,
            center: this.currentPosition,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        this.map = gmap;
        this.createMarker("現在地", this.currentPosition);
        this.map.setCenter(this.currentPosition);
        this.requestPlaces(this.currentPosition);
    }
    requestPlaces(position) {
        const request = {
            location: position,
            radius: 1000,
            query: "コンビニ",
        };
        const service = new google.maps.places.PlacesService(this.map);
        service.textSearch(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    // this.createMarker(results[i].name, results[i].geometry.location);
                    console.log(results[i]);
                }
            }
        });
    }
    createMarker(name, location) {
        var marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: name
        });
    }
    ;
    handleLocationError(browserHasGeolocation) {
        window.alert(browserHasGeolocation ? 'エラー: 現在地の取得に失敗しました.' : 'エラー: ブラウザが現在地の取得に対応していません.');
    }
}
const geo = new TimeManagerGeolocation();
geo.getPosition()
    .then((position) => {
    var mapDiv = document.getElementById("map_div");
    geo.initMap(mapDiv);
    // geo.requestPositions();
})
    .catch((reason) => console.error(reason));
