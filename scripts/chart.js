
let restDatas = [50, 50, 50, 50, 50, 50, 50],
    activeDatas = [50, 50, 50, 50, 50, 50, 50];
let dailyRestData = [50, 50];

// コンテキストの取得
const weeklyCtx = document.getElementById("weekly_data_canvas").getContext("2d");
const dailyCtx = document.getElementById("daily_data_canvas").getContext("2d");

// 週刊データの設定
const weeklyData = {
    labels: ["月", "火", "水", "木", "金", "土", "日"],
    datasets: [{
            label: '活動時間',
            data: activeDatas,
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
        },
        {
            label: '休憩時間',
            data: restDatas,
            backgroundColor: 'rgb(54, 162, 235)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
        }
    ]
}
// 週刊データのグラフオプション
const barOption = {
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
                fontSize: 14
            }
        }],
        yAxes: [{
            display: true,
            stacked: true,
            ticks: {
                fontSize: 12
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
}

// 週刊データの棒グラフ
const barChart = new Chart(weeklyCtx, {
    type: "bar",
    data: weeklyData,
    options: barOption
});

// 日刊データの設定
const dailyData = {
    labels: ["活動時間", "休憩時間"],
    datasets: [{
        data: dailyRestData,
        backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)']
    }]
}
// 日刊データのグラフオプション
const doughnutOption = {
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
}

// 週刊データの円グラフ
const doughnutChart = new Chart(dailyCtx, {
    type: 'doughnut',
    data: dailyData,
    options: doughnutOption
});