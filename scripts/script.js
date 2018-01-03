const idb = new TimeManagerDB();
const geo = new TimeManagerGeolocation();
const targetElement = document.getElementById("target");
const adviceElement = document.getElementById("advice");
const stateText = document.getElementById("btn_text");
const goalText = document.getElementById("todo_text");
const goalBtn = document.getElementById("set_todo");
const locationBtn = document.getElementById("location_update");
const ACTIVE_STR = "ACT";
const REST_STR = "REST";
let status;
idb.open()
.then(() => {
    // todo do promise
    idb.getGoalOfSettings((goal) => {
        targetElement.innerHTML = goal;
        });
        idb.getStateOfStatus((state) => {
            status = state;
            if (!status) status = "active";
            status == "active" ? stateText.textContent = ACTIVE_STR : stateText.textContent = REST_STR;
        });
        const ration = { active: 40, rest: 60 };
        if (ration.active > ration.rest) {
            idb.getActPlacesOfAdvices((places) => {
                console.log(places);
                adviceElement.innerHTML = "気分転換しませんか？";
                const randomNum = Math.floor(Math.random() * places.name.length); //0~places.name.lenght-1
                const destPlace = {
                    latLng: places.latLng[randomNum],
                    name: places.name[randomNum],
                    placeId: places.placeId[randomNum]
                };
                initModalWindow(destPlace);
            });
        } else {
            idb.getRestPlacesOfAdvices((places) => {
                console.log(places);
                adviceElement.innerHTML = "休憩しませんか？";
                const randomNum = Math.floor(Math.random() * places.name.length); //0~places.name.lenght-1
                const destPlace = {
                    latLng: places.latLng[randomNum],
                    name: places.name[randomNum],
                    placeId: places.placeId[randomNum]
                };
                initModalWindow(destPlace);
            });
        }
        initChat();
    })
    .catch(error => console.error(error));

const stateBtn = document.getElementById("state_btn");
stateBtn.addEventListener("click", () => {
    const now = moment().locale("ja").format('YYYY-MM-DDTHH:mm:ss');

    if (status == "active") {
        status = "rest";
        stateText.textContent = REST_STR;
        idb.addStateOfStatus(status);

        idb.addStartTimeOfTimes(now);

    } else if (status == "rest") {
        status = "active";
        stateText.textContent = ACTIVE_STR;
        idb.addStateOfStatus(status);

        //todo わかりにくいので2つの処理をDB内で完結させる
        idb.getLastIdOfTimes()
            .then((id) => idb.editColumnOfTimes(id, now))
            .catch((reason) => console.error(reason));
    }
});

locationBtn.addEventListener("click", () => {
    //todo CROSにより現状不可能 window.open(gmaps.html)
    window.setTimeout(() => {
        //localStrageからactの割合が多いときに表示する場所を取得する
        const actPlaces = { name: [], latLng: [], placeId: [] };
        const actLength = localStorage.getItem("actLength");
        for (i = 0; i < parseInt(actLength); i++) {
            const nameStr = `actName${i}`;
            const latStr = `actLat${i}`;
            const lngStr = `actLng${i}`;
            const placeIdStr = `actPlaceId${i}`
            const name = localStorage.getItem(nameStr);
            const lat = parseFloat(localStorage.getItem(latStr));
            const lng = parseFloat(localStorage.getItem(lngStr));
            const placeId = localStorage.getItem(placeIdStr);
            actPlaces.name.push(name);
            actPlaces.latLng.push({ lat: lat, lng: lng });
            actPlaces.placeId.push(placeId);
        };
        //localStrageからrestの割合が多いときに表示する場所を取得する
        const restPlaces = { name: [], latLng: [], placeId: [] };
        const restLength = localStorage.getItem("restLength");
        for (i = 0; i < parseInt(actLength); i++) {
            const nameStr = `restName${i}`;
            const latStr = `restLat${i}`;
            const lngStr = `restLng${i}`;
            const placeIdStr = `restPlaceId${i}`
            const name = localStorage.getItem(nameStr);
            const lat = parseFloat(localStorage.getItem(latStr));
            const lng = parseFloat(localStorage.getItem(lngStr));
            const placeId = localStorage.getItem(placeIdStr);
            restPlaces.name.push(name);
            restPlaces.latLng.push({ lat: lat, lng: lng });
            restPlaces.placeId.push(placeId);
        };
        idb.addActPlacesOfAdvices(actPlaces);
        idb.addRestPlacesOfAdvices(restPlaces);
    }, 5000);
});

goalBtn.addEventListener("click", () => {
    const goal = goalText.value;
    idb.addGoalOfSettings(goal);
    targetElement.innerHTML = goal;
});

/* 睡眠時間の設定に関するDOM操作 */
// 睡眠時間の表示
const hourOutput = document.getElementById("sleep_hour_output"),
    minOutput = document.getElementById("sleep_min_output");
// レンジ入力欄のエレメント
const hourRange = document.getElementById("sleep_hour"),
    minRange = document.getElementById("sleep_min");
// 睡眠時間の設定に使用するボタン
const setSleepTime = document.getElementById("submit_sleep_time");
// 入力欄のラベル
const hourLabel = document.getElementById("sleep_hour_label");
const minLabel = document.getElementById("sleep_min_label");

let sleepTime = 0;   // 睡眠時間

hourRange.addEventListener("change", function (e) {
    //分・秒を2桁にそろえる
    hourOutput.innerHTML = ("0" + this.value).slice(-2);
    hourLabel.innerHTML = ("0" + this.value).slice(-2)
}, true);

minRange.addEventListener("change", function (e) {
    if (this.value == "60") {
        minOutput.innerHTML = "59";
        minLabel.innerHTML = "59";
    } else {
        minOutput.innerHTML = this.value;
        minLabel.innerHTML = this.value;
    }
}, true);

setSleepTime.addEventListener("click", () => {
    sleepTime = 0;
    if (minRange.value == "60") {
        sleepTime += 59 * 60 * 1000;
    } else {
        sleepTime += parseInt(minRange.value) * 60 * 1000;
    }
    sleepTime += parseInt(hourRange.value) * 60 * 60 * 1000;
    idb.addSleepTimeMsOfDate(sleepTime);
    // todo 睡眠時間の初期値を設定する
    // todo ページ先頭に遷移する
}, true);

// 睡眠時間(時間)の目盛りを設定する
const hourScaleDataList = document.getElementById("hour_scale");
const hourScaleOption = document.createElement("option");
for (let i = 0; i < 13; i++) {
    hourScaleDataList.insertAdjacentHTML('beforeend',
        `<option>${i}</option>`);
}

// 睡眠時間(分)の目盛りを設定する
const minScaleDataList = document.getElementById("min_scale");
const minScaleOption = document.createElement("option");
for (let i = 0; i < 7; i++) {
    minScaleDataList.insertAdjacentHTML('beforeend',
        `<option>${i * 10}</option>`);
}

function initChat() {
    const ctx1 = document.getElementById("weekly_data_canvas").getContext("2d");
    const ctx2 = document.getElementById("daily_data_canvas").getContext("2d");
    const today = moment().add(8, "weeks").format('YYYY-MM-DD');
    let todaySleepMs = 0;

    idb.getSleepTimeMsOfDate((sleepTimeMs) => {
        todaySleepMs = sleepTimeMs;
    });

    idb.getRestTimeMsOfDate(today)
        .then((restTimeMs) => {
            // 一日分のグラフ    DailyChart(2Dcontext, number, , number)
            let dailyChart = new DailyChart(ctx2, restTimeMs, todaySleepMs);
            console.log(dailyChart.restData[1])
            // console.log(dailyChart.getChartData());
        })
        .catch((reason) => console.error(reason));

    idb.getWeekRecordOfDate(today)
        .then((weekData) => {
            console.log(weekData);
            // 一週間のグラフ    WeeklyChart(2Dcontext, array(7)[num], array(7)[string], number)
            const weeklyChart = new WeeklyChart(ctx1, weekData.restTimes, weekData.dates, weekData.sleepTimes);
        })
        .catch((reason) => console.error(reason));
}
