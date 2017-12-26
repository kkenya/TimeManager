const idb = new TimeManagerDB();
const targetElement = document.getElementById("target");
const adviceElement = document.getElementById("advice");
const stateBtn = document.getElementById("state_btn");
const stateText = document.getElementById("btn_text");
const goalText = document.getElementById("todo_text");
const goalBtn = document.getElementById("set_todo");
const ACTIVE_STR = "ACT";
const REST_STR = "REST";
let status
idb.open()
.then(() => {
    idb.getGoal((goal) => {
        targetElement.innerHTML = goal;
    });
    idb.getState((state) => {
        status = state;
        if(!status) status = "active";
        status == "active" ? stateText.textContent = ACTIVE_STR : stateText.textContent = REST_STR;
    });
})
.catch(error => console.error(error));

// if (status == "active") {
//     stateText.textContent = ACTIVE_STR;
// }
// if (status == "rest") {
//     stateText.textContent = REST_STR;
// }

stateBtn.addEventListener("click", function () {
    // const clicked = moment().locale("ja").format('YYYY-MM-DDTHH:mm:ss');
    let clicked = moment().locale("ja").format('YYYY-MM-DDTHH:mm:ss');

    if (status == "active") {
        stateText.textContent = REST_STR;
        status = "rest";
        idb.addStateForStatus(status);

        const startTime = clicked;
        idb.addStartTimeForTimes(startTime); // startTimeを保存
    } else if (status == "rest") {
        stateText.textContent = ACTIVE_STR;
        status = "active";
        idb.addStateForStatus(status);

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
    idb.addGoalForSettings(goal);
    targetElement.innerHTML = goal;
});
