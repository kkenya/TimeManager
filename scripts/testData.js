let testDate = [];
let numId = 1;
let numRest = 1000; //fix 休憩時間が0だとエラー
for (i = 0; i < 15; i++) {
    testDate.push({
        id: numId++,
        date: moment().startOf('week').add(i, 'days').format('YYYY-MM-DD'), //データベースを初期化した週の始め
        restTimeMs: numRest,
        sleepTimeMs: 90720000 //7時間
    });
};