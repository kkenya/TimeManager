let testDate = [];
let numId = 1;
let numRest = 51840000;
for (i = 0; i < 15; i++) {
    testDate.push(
        {
            id: numId++,
            date: moment().startOf('week').add(i, 'days').format('YYYY-MM-DD'),
            restTime: numRest += 6480000
        }
    );
};