const idb = new TimeManagerDB();
const targetElement = document.getElementById("target");
const adviceElement = document.getElementById("advice");
const stateBtn = document.getElementById("state_btn");
const stateText = document.getElementById("btn_text");
const goalText = document.getElementById("target_text");
const goalBtn = document.getElementById("set_target");
idb.open()
.then(() => {
    idb.getGoal((goal) => {
        targetElement.innerHTML = goal;
    });
})
.catch(error => console.error(error));


let status = "active";
const ACTIVE_STR = "ACT";
const REST_STR = "REST";

if (status == "active") {
    stateText.textContent = ACTIVE_STR;
}
if (status == "rest") {
    stateText.textContent = REST_STR;
}

stateBtn.addEventListener("click", function () {
    // const clicked = moment().locale("ja").format('YYYY-MM-DDTHH:mm:ss');
    let clicked = moment().locale("ja").format('YYYY-MM-DDTHH:mm:ss');

    if (status == "active") {
        stateText.textContent = REST_STR;
        status = "rest";

        const startTime = clicked;
        idb.addStartTimeForTimes(startTime); // startTimeを保存
    } else if (status == "rest") {
        stateText.textContent = ACTIVE_STR;
        status = "active";

        //todo test
        // clicked = moment().add(1, "d").format('YYYY-MM-DDTHH:mm:ss');

        const endTime = clicked;
        idb.getLastTimesId()
            .then((id) => idb.editColumnForTimes(id, endTime))
            .catch((reason) => console.error(reason));
    }
});

goalBtn.addEventListener("click", () => {
    const goal = goalText.value;
    console.log(goal);
    idb.addGoalForSettings(goal);
});
