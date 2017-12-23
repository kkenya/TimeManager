// アンカーに移動
const navForm = document.getElementById("nav_form");
navForm.addEventListener("change", function () {
    location.hash = checkHash(this.nav);
});

// ハッシュ値の取得
function checkHash(radio) {
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
            return radio[i].value;
        }
    }
}

navForm.nav[2].checked;


const pageHeight = document.querySelector(".box").clientHeight;

let scrollPosition = 0;
window.addEventListener("scroll", function (eve) {
    scrollPosition = window.scrollY;
    window.requestAnimationFrame(function () {
        if (scrollPosition > pageHeight && scrollPosition < pageHeight * 2) {
            navForm.nav[1].checked = true;
            location.hash = checkHash(navForm.nav)
        } else if (scrollPosition > pageHeight && scrollPosition > pageHeight * 2) {
            navForm.nav[2].checked = true;
            location.hash = checkHash(navForm.nav)
        } else {
            navForm.nav[0].checked = true;
        }
    });
});