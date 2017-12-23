// getStatus();
let status = "active";

const stateBtn = document.getElementById("state_btn");
const stateText = document.getElementById("btn_text");
const ACTIVE_STR = "ACT";
const REST_STR = "REST";

const idb = new TimeManagerDB();
idb.open();

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
        idb.addStartTimeForTimesStore(startTime); // startTimeを保存
    } else if (status == "rest") {
        stateText.textContent = ACTIVE_STR;
        status = "active";

        //todo test
        // clicked = moment().add(1, "d").format('YYYY-MM-DDTHH:mm:ss');

        const endTime = clicked;
        idb.getLastTimesId()
            .then((id) => idb.editColumnForTimesStore(id, endTime))
            .catch((reason) => console.error(reason));
    }
});