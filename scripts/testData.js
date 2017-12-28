let testDate = [];
let numId = 1;
let numRest = 50000;
for (i = 0; i < 15; i++) {
    testDate.push({ id: numId++, date: moment(), restTime: numRest += 10000 });
};