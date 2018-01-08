/* グラフのクラス(７日分) */
class WeeklyChart {
    constructor(ctx, data, labels, sleepingTime) {
        this.activeData = new Array(7); // 活動時間
        this.restData = new Array(7); // 休憩時間
        // ２４時間から睡眠時間を引いた時間
        // 86400000 = 24h * 60min * 60sec * 1000millsec
        this.remainingTime = [86400000, 86400000, 86400000, 86400000, 86400000, 86400000, 86400000];

        this.option = {
            responsive: false,
            title: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: true,
                    stacked: true,
                    categoryPercentage: 0.3,
                    ticks: {
                        fontSize: 10
                    }
                }],
                yAxes: [{
                    display: true,
                    stacked: true,
                    ticks: {
                        min: 0,
                        max: 100,
                        fontSize: 10
                    }
                }]
            },
            legend: {
                labels: {
                    boxWidth: 20,
                },
                display: true
            },
            tooltips: {
                mode: 'label',
                position: 'nearest',
                titleFontSize: 18,
                bodyFontSize: 14,
                callbacks: {
                    label: function (tooltipItem, data) {
                        return data.labels[tooltipItem.index] +
                            ": " +
                            data.datasets[0].data[tooltipItem.index] +
                            " %";
                    }
                }
            }
        };

        const chartPrimise = new Promise((resolve, reject) => {
            // 引数の数の確認
            if (arguments.length > 4 || arguments.length < 4) {
                reject("引数の数が正しくない");
            }
            // 引数の型の確認
            else if (ctx && Array.isArray(data) && Array.isArray(labels) && Array.isArray(sleepingTime)) {
                for (let i = 0; i < 7; i++) {
                    data[i] ? resolve() : reject();
                    labels[i] ? resolve() : reject();
                }
                resolve();
            } else {
                reject("引数の型が正しくない");
            }
        });
        chartPrimise.then(() => {
            this.setRemainingTime(this.remainingTime, sleepingTime);
            this.chartLabels = labels; // x軸のラベル

            this.calculateTimesRate(data);
            this.data = this.setChartData(this.activeData, this.restData);
            new Chart(ctx, {
                type: "bar",
                data: this.data,
                options: this.option
            });
        }).catch((reason) => {
            console.error(reason);
        });
    }
    // 時間を割合に直す
    calculateTimesRate(restData) {
        for (let i = 0; i < restData.length; i++) {
            this.restData[i] = restData[i] / this.remainingTime[i] * 100;
            this.restData[i] = Math.round(this.restData[i] * 10) / 10;
            this.activeData[i] = 100 - this.restData[i];
        }
    }
    // 残り時間の準備
    setRemainingTime(remainingTime, sleepingTime) {
        for (let i = 0; i < remainingTime.length; i++) {
            remainingTime[i] = remainingTime[i] - sleepingTime[i];
        }
    }
    // データの設定
    setChartData(activeData, restData) {
        return {
            labels: this.chartLabels,
            datasets: [{
                label: '休憩時間',
                data: restData,
                backgroundColor: 'rgb(54, 162, 235)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }, {
                label: '活動時間',
                data: activeData,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
            }]
        };
    }
}

// グラフのクラス(１日分)
class DailyChart {
    constructor(ctx, data, sleepingTime) {
        this.activeData; // 活動時間
        this.restData = new Array(2);
        this.remainingTime = 86400000; // 24 * 60 * 60 * 1000

        this.option = {
            title: {
                display: false
            },
            responsive: false,
            animation: {
                animateRotate: true,
                animateScale: true
            },
            legend: {
                labels: {
                    boxWidth: 20,
                },
                display: true
            },
            tooltips: {
                mode: 'label',
                position: 'nearest',
                titleFontSize: 18,
                bodyFontSize: 14,
                callbacks: {
                    label: function (tooltipItem, data) {
                        return data.labels[tooltipItem.index] +
                            ": " +
                            data.datasets[0].data[tooltipItem.index] +
                            " %";
                    }
                }
            }
        };

        const chartPromise = new Promise((resolve, reject) => {
            // 引数の数の確認
            if (arguments.length > 3 || arguments.length < 3) {
                reject("引数の数が正しくない");
            }
            // 引数の型の確認
            else if (ctx && typeof data == "number" && typeof sleepingTime == "number") {
                resolve();
            } else {
                reject("引数の型が正しくない");
            }
        });
        chartPromise.then(() => {
            this.remainingTime = this.remainingTime - sleepingTime;
            this.calculateTimesRate(data);
            this.data = this.setChartData(this.restData);
            new Chart(ctx, {
                type: 'doughnut',
                data: this.data,
                options: this.option
            });
        }).catch((reason) => {
            console.log(reason);
        });
    }
    // 時間を割合に直す
    calculateTimesRate(restData) {
        this.restData[0] = restData / this.remainingTime * 100;
        this.restData[0] = Math.round(this.restData[0] * 10) / 10;
        this.restData[1] = 100 - this.restData[0];
    }
    // データの取得
    getChartData() {
        if (this.restData) {
            return {
                active: this.restData[1],
                rest: this.restData[0]
            }
        } else {
            console.log("休憩時間と活動時間が設定されていません");
        }
    }
    // データの設定
    setChartData(restData) {
        return {
            labels: ["休憩時間", "活動時間"],
            datasets: [{
                data: restData,
                backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 99, 132)', ]
            }]
        };
    }
}