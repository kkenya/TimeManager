const modalOpen = document.getElementById("openModalWindow");

// モーダルウィンドウに表示する内容
let contens =
    `<h1>モーダルウィンドウ</h1>
<p>
modalWindowmodalWindowmodal
modalWindowmodalWindowmodal
modalWindowmodalWindowmodal
modalWindowmodalWindowmodal
</p>`
    ;

// モーダルウィンドウの背景
const overlayElement = document.createElement("div");
overlayElement.setAttribute("class", "fadeIn");
overlayElement.setAttribute("id", "modal-overlay");

// モーダルウィンドウ本体
const modalWindow = document.createElement("div");
modalWindow.setAttribute("class", "fadeIn");
modalWindow.setAttribute("id", "modal-contents");
modalWindow.innerHTML = contens;

modalOpen.addEventListener("click", function () {
    document.body.appendChild(overlayElement);
    document.body.appendChild(modalWindow);
});

overlayElement.addEventListener("click", function () {
    document.body.removeChild(overlayElement);
    document.body.removeChild(modalWindow);
});