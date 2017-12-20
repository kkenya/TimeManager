let state = true;

const stateBtn = document.getElementById("state_btn"),
      stateText = document.getElementById("state_text");

stateBtn.addEventListener("click", function() {
    if (state == false) {
        stateText.textContent = "ACT";
        state = true;
    }
    else {
        stateText.textContent = "REST";
        state = false;        
    }
});