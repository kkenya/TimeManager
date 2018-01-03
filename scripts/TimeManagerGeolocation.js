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
        //ウインドウを閉じる
        setTimeout(() => {
            window.open('about:blank', '_self').close();
        }, 4000);
    }
    requestActPlaces(position) {
        const request = {
            location: position,
            radius: 1000,
            query: "カフェ　図書館",
        };
        this.service.textSearch(request, (results, status) => {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                localStorage.setItem("actLength", results.length.toString());
                for (var i = 0; i < results.length; i++) {
                    console.log(results[i]);
                    const nameStr = `actName${i}`;
                    const latStr = `actLat${i}`;
                    const lngStr = `actLng${i}`;
                    const placeIdStr = `actPlaceId${i}`;
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
                for (var i = 0; i < results.length; i++) {
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
            title: name
        });
        const infowindow = new google.maps.InfoWindow({
            content: "現在地を取得しました"
        });
        infowindow.open(this.map, marker);
        setTimeout((() => {
            const closeInfo = new google.maps.InfoWindow({
                content: "</br></br><h1>ウインドウを閉じます</h1></br></br>",
            });
            infowindow.close();
            closeInfo.open(this.map, marker);
        }), 2000);
    }
    ;
    handleLocationError(browserHasGeolocation) {
        window.alert(browserHasGeolocation ? 'エラー: 現在地の取得に失敗しました.' : 'エラー: ブラウザが現在地の取得に対応していません.');
    }
}
