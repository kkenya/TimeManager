function initModalWindow(destPlace) {
    const modalOpen = document.getElementById("openModalWindow");
    modalOpen.value = destPlace.name;

    // モーダルウィンドウの背景
    const overlayElement = document.createElement("div");
    overlayElement.setAttribute("class", "fadeIn");
    overlayElement.setAttribute("id", "modal-overlay");

    // モーダルウィンドウ本体
    const modalWindow = document.createElement("div");
    modalWindow.setAttribute("class", "fadeIn");
    modalWindow.setAttribute("id", "modal-contents");

    const embedApiKey = "AIzaSyAdRpHDB85FpmdyLlcH5sMCifv84yiBP9U";
    const uri = `https://maps.google.co.jp/maps/embed/v1/place?key=${embedApiKey}&q=place_id:${destPlace.placeId}&center=${destPlace.latLng.lat},${destPlace.latLng.lng}`
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.frameBorder = "0";
    iframe.marginheight = "0";
    iframe.marginwidth = "0";
    iframe.src = uri;
    modalWindow.appendChild(iframe);

    modalOpen.addEventListener("click", function () {
        document.body.appendChild(overlayElement);
        document.body.appendChild(modalWindow);
    });

    overlayElement.addEventListener("click", function () {
        document.body.removeChild(overlayElement);
        document.body.removeChild(modalWindow);
    });
}

function setUpdateGeolocation() {
    const modalOpen = document.getElementById("location_update");

    // モーダルウィンドウの背景
    const overlayElement = document.createElement("div");
    overlayElement.setAttribute("class", "fadeIn");
    overlayElement.setAttribute("id", "modal-overlay2");

    // モーダルウィンドウ本体
    const modalWindow = document.createElement("div");
    modalWindow.setAttribute("class", "fadeIn");
    modalWindow.setAttribute("id", "modal-contents2");

    const uri = `https://frontier10.kanazawa-it.ac.jp/~a1519640/TimeManager/GoogleMap.html`
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.frameBorder = "0";
    iframe.marginheight = "0";
    iframe.marginwidth = "0";
    iframe.src = uri;
    modalWindow.appendChild(iframe);

    modalOpen.addEventListener("click", function () {
        document.body.appendChild(overlayElement);
        document.body.appendChild(modalWindow);
    });

    overlayElement.addEventListener("click", function () {
        document.body.removeChild(overlayElement);
        document.body.removeChild(modalWindow);
    });
}