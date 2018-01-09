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
        this.service = new google.maps.places.PlacesService(this.map);
        this.requestActPlaces(this.currentPosition);
        this.requestRestPlaces(this.currentPosition);
    }
    requestActPlaces(position) {
        const cafeRequest = {
            location: position,
            radius: 1000,
            query: "カフェ",
        };
        this.service.textSearch(cafeRequest, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                localStorage.setItem("actCafeLength", results.length.toString());
                for (let i = 0; i < results.length; i++) {
                    console.log(results[i]);
                    const nameStr = `actCafeName${i}`;
                    const latStr = `actCafeLat${i}`;
                    const lngStr = `actCafeLng${i}`;
                    const placeIdStr = `actCafePlaceId${i}`;
                    localStorage.setItem(nameStr, results[i].name);
                    localStorage.setItem(latStr, results[i].geometry.location.lat().toString());
                    localStorage.setItem(lngStr, results[i].geometry.location.lng().toString());
                    localStorage.setItem(placeIdStr, results[i].place_id);
                }
            }
        });
        const libRequest = {
            location: position,
            radius: 1000,
            query: "図書館",
        };
        this.service.textSearch(libRequest, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                localStorage.setItem("actLibLength", results.length.toString());
                for (let i = 0; i < results.length; i++) {
                    console.log(results[i]);
                    const nameStr = `actLibName${i}`;
                    const latStr = `actLibLat${i}`;
                    const lngStr = `actLibLng${i}`;
                    const placeIdStr = `actLibPlaceId${i}`;
                    localStorage.setItem(nameStr, results[i].name);
                    localStorage.setItem(latStr, results[i].geometry.location.lat().toString());
                    localStorage.setItem(lngStr, results[i].geometry.location.lng().toString());
                    localStorage.setItem(placeIdStr, results[i].place_id);
                }
            }
        });
    }
    requestRestPlaces(position) {
        const request = {
            location: position,
            radius: 1000,
            query: "飲食店",
        };
        this.service.textSearch(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                localStorage.setItem("restLength", results.length.toString());
                for (let i = 0; i < results.length; i++) {
                    console.log(results[i]);
                    const nameStr = `restName${i}`;
                    const latStr = `restLat${i}`;
                    const lngStr = `restLng${i}`;
                    const placeIdStr = `restPlaceId${i}`;
                    localStorage.setItem(nameStr, results[i].name);
                    localStorage.setItem(latStr, results[i].geometry.location.lat().toString());
                    localStorage.setItem(lngStr, results[i].geometry.location.lng().toString());
                    localStorage.setItem(placeIdStr, results[i].place_id);
                }
            }
        });
    }
    createMarker(name, location) {
        const marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: name,
            icon: {
                url: "images/icon.png",
                scaledSize: new google.maps.Size(40, 40)
            }
        });
        const infowindow = new google.maps.InfoWindow({
            content: "現在地を取得しました"
        });
        infowindow.open(this.map, marker);
    }
    ;
    handleLocationError(browserHasGeolocation) {
        window.alert(browserHasGeolocation ? 'エラー: 現在地の取得に失敗しました.' : 'エラー: ブラウザが現在地の取得に対応していません.');
    }
}
