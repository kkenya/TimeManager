const idb = new TimeManagerDB();
const targetElement = document.getElementById("target");
const adviceElement = document.getElementById("advice");
const stateBtn = document.getElementById("state_btn");
const stateText = document.getElementById("btn_text");
const goalText = document.getElementById("todo_text");
const goalBtn = document.getElementById("set_todo");
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
    })
    .catch(error => console.error(error));

stateBtn.addEventListener("click", () => {
    //todo momentインスタンスの作成をDB内の処理として行う
    const now = moment().locale("ja").add(30, 'days').format('YYYY-MM-DDTHH:mm:ss');

    if (status == "active") {
        stateText.textContent = REST_STR;
        status = "rest";
        idb.addStateOfStatus(status);

        idb.addStartTimeOfTimes(now); // startTimeを保存

    } else if (status == "rest") {
        stateText.textContent = ACTIVE_STR;
        status = "active";
        idb.addStateOfStatus(status);

        //todo わかりにくいので2つの処理をDB内で完結させる
        idb.getLastIdOfTimes()
            .then((id) => idb.editColumnOfTimes(id, now))
            .catch((reason) => console.error(reason));
    }

    /**
     *test
     *
     */
    // 指定した日にちのrestTimeを取得する
    const today = moment().format('YYYY-MM-DD');
    idb.getRestTimeOfDate(today)
        .then((data) => console.log(data))
        .catch((reason) => console.log(reason));
    //1週間の休憩時間を取得する
    // const after = moment().add(30, 'days').format('YYYY-MM-DD');
    const after = moment().format('YYYY-MM-DD');
    idb.getWeekRecordOfDate(after)
    .then((week) => console.log(week))
    .catch((reason) => console.log(reason));
    /**
     *
     *
     */
});

goalBtn.addEventListener("click", () => {
    const goal = goalText.value;
    idb.addGoalOfSettings(goal);
    targetElement.innerHTML = goal;
});
