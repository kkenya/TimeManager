class Pages {
    constructor(querys) {
        this.pageDatas = [];
        for (let i = 0; i < querys.length; i++) {
            this.pageDatas.push(querys[i].getBoundingClientRect());
        }
    }
    getAbsPosition(key) {
        return this.pageDatas[key].top;
    }
    getPageHeight(key) {
        return this.pageDatas[key].height;
    }
}

let page = new Pages(document.querySelectorAll(".page"));
const pageHeight = page.getPageHeight(0); // ページの高さ

// ページの移動
const navForm = document.getElementById("nav_form");
navForm.addEventListener("change", function () {
    if (checkSlected(this.nav) == "top") {
        smoothScroll(0);
    } else if (checkSlected(this.nav) == "graph") {
        smoothScroll(1);
    } else if (checkSlected(this.nav) == "setting") {
        smoothScroll(2);
    }
});

// 目標（見出し）をクリックで設定に移動
document.getElementById("to_setting").addEventListener("click", eve => {
    smoothScroll(2);
}, true);
// 目標を設定するとトップへ
document.getElementById("set_todo").addEventListener("click", eve => {
    smoothScroll(0);
}, true);
// 睡眠時間を設定するとグラフへ
document.getElementById("submit_sleep_time").addEventListener("click", eve => {
    smoothScroll(1);
});

let scrPos = 0;
// スクロール位置の監視
window.addEventListener("wheel", function (e) {
    window.requestAnimationFrame(function () {
        if (window.scrollY < pageHeight) {
            navForm.nav[0].checked = true;
        } else if (window.scrollY < pageHeight * 2) {
            navForm.nav[1].checked = true;
        } else if (window.scrollY < pageHeight * 3) {
            navForm.nav[2].checked = true;
        }
    });
}, true);

// ラジオボタンの監視
const checkSlected = radio => {
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
            return radio[i].value;
        }
    }
}

// スクロールアニメーション
const smoothScroll = (key) => {
    let counter = 0;
    const scroll = page.getAbsPosition(key) / 50;
    const adjust = page.getAbsPosition(key) % 50;

    function smoothScrollTailCall() {
        let timeoutID = setTimeout(() => {
            if (counter > 50) {
                clearTimeout(timeoutID);
                scrollBy(0, adjust);
                counter = 0;
                page = new Pages(document.querySelectorAll(".page"));
            } else {
                counter++;
                window.scrollBy(0, scroll);
                smoothScrollTailCall() // 再帰呼び出し
            }
        }, 10);
    }
    // 末尾呼び出し
    smoothScrollTailCall();
}