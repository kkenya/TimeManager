let testDate = [];
let numId = 1;
let numRest = 116640000;
for (i = 0; i < 15; i++) {
    testDate.push(
        {
            id: numId++,
            date: moment().startOf('week').add(i, 'days').format('YYYY-MM-DD'),
            restTimeMs: numRest,
            sleepTimeMs: 77760000 //6時間
        }
    );
};