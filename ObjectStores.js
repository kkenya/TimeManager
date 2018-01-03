//生成するオブジェクトストアのプロパティを示す

var Status = {
    state: "string" //["active", "rest"]
};

var Times = {
    startTime: "string", //YYYY-MM-DD-THH:mm:ss
    endTime: "string", //YYYY-MM-DD-THH:mm:ss
    restTimeMs: "number"　//ms
};

var Date = {
    date: "string", //YYYY-MM-DD
    restTimeMs: "number", //ms
    sleepTimeMs: "number" //ms
};

var Settings = {
    goal: "string",
    latLng: {lat: "number", lng: "number"},
    defaultSleepMs: "number" //ms
};

var Advices = {
    id: "number",
    places: "array<string>"
}
