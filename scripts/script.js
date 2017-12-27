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
    if(!status) status = "active";
    status == "active" ? stateText.textContent = ACTIVE_STR : stateText.textContent = REST_STR;
});
})
.catch(error => console.error(error));

stateBtn.addEventListener("click", () => {
    //todo momentインスタンスの作成をDB内の処理として行う
    let clicked = moment().locale("ja").format('YYYY-MM-DDTHH:mm:ss');

    if (status == "active") {
        stateText.textContent = REST_STR;
        status = "rest";
        idb.addStateOfStatus(status);

        const startTime = clicked;
        idb.addStartTimeOfTimes(startTime); // startTimeを保存
    } else if (status == "rest") {
        stateText.textContent = ACTIVE_STR;
        status = "active";
        idb.addStateOfStatus(status);

        //todo test
        // clicked = moment().add(1, "d").format('YYYY-MM-DDTHH:mm:ss');

        const endTime = clicked;
        idb.getLastIdOfTimes()
            .then((id) => idb.editColumnOfTimes(id, endTime))
            .catch((reason) => console.error(reason));
    }

    const now = moment().format('YYYY-MM-DD');
    console.log(now);
    idb.getRestTimeOfDate(now)
    .then((data) => console.log(data))
    .catch((reason) => console.log(reason));
});

goalBtn.addEventListener("click", () => {
    const goal = goalText.value;
    idb.addGoalOfSettings(goal);
    targetElement.innerHTML = goal;
});
