var chart = null;
var values = [];
var labels = [];
var charts = [];
var value = 0;

var previous_trend = "&nbsp;&nbsp;";
var previous_price = 0;
var fee = 0.0024; // 0.00090 + 0.0015

document.addEventListener('DOMContentLoaded', (event) => {

    GetTickerData();

    document.querySelector("#crypto_currency").onclick = function (e) {
        document.querySelector('#crypto').innerHTML = e.target.innerText;

        previous_trend = "&nbsp;&nbsp;";
        previous_price = 0;

        GetTickerData();
    }
})

function DrawChart(chart) {

    var samples = 1000;
    var speed = 300;

    values = [];
    labels = [];
    charts = [];
    value = 0;

    values.length = samples;
    labels.length = samples;
    //values.fill(16);
    //labels.fill("none");

    return new Chart(document.querySelector(chart),
        {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Price",
                        data: values,
                        fill: false,
                        borderWidth: 3,
                        borderColor: "#AA8900",
                        lineTension: 0.5,
                        pointRadius: 0,
                        hoverRadius: 3,
                        //backgroundColor: "#FFBC00"
                    }
                ]
            },
            options: {
                showLine: true,
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                title: {
                    display: false
                },
                animation: {
                    duration: speed,
                    easing: 'linear'
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            display: true,
                            //drawBorder: true,
                            drawOnChartArea: false,
                            drawTicks: false,
                        },
                        ticks: {
                            display: false,
                        },
                    }],
                    yAxes: [{
                        gridLines: {
                            display: true,
                            //drawBorder: true,
                            drawOnChartArea: false,
                            drawTicks: true,
                        },
                        ticks: {
                            display: true,
                        },
                        //beginAtZero: false,
                        //min: 0,
                        //max: 100
                    }],
                }
            }
        });
}

function sleep(milliseconds) {
    let timeStart = new Date().getTime();
    while (true) {
        let elapsedTime = new Date().getTime() - timeStart;
        if (elapsedTime > milliseconds) {
            break;
        }
    }
} 

function GetTickerData() {
    let crypto = document.querySelector('#crypto').innerHTML;
    var url = `/api/v2/crypto/price/${crypto}`;

    sleep(500);

    fetch(url, {
        method: 'GET',
        mode: 'cors'
    })
        .then((response) => response.json())
        .then(function (data) {
            if (data !== undefined) {

                console.log(` ${crypto}: ${data.latestTradePrice}`);

                if (chart == null) {
                    chart = DrawChart("#chart");
                }

                let trend;
                let precision = data.latestTradePrice <= 100 ? 4 : 2;

                if (data.latestTradePrice == previous_price) {
                    trend = previous_trend;
                }
                if (data.latestTradePrice > previous_price) {
                    trend = "&#8599;";
                }
                if (data.latestTradePrice < previous_price) {
                    trend = "&#8600;";
                }

                values.push(data.latestTradePrice);
                values.shift();
                let dateTime = new Date(data.timeStamp);
                labels.push(dateTime.toLocaleTimeString());
                labels.shift();
                chart.update();

                document.querySelector('#latest').innerHTML = trend + data.latestTradePrice.toFixed(precision);

                let fee = 1 - 0.0024;
                let coins = parseFloat(document.querySelector('#coins').value);
                let buy_price = parseFloat(document.querySelector('#buy_price').value);
                let sell_price = parseFloat(document.querySelector('#sell_price').value);

                let balance = coins * buy_price;
                document.querySelector('#balance').innerHTML = balance.toFixed(0);

                let profit = (data.latestTradePrice - buy_price) * coins * fee;
                document.querySelector('#profit').innerHTML = profit.toFixed(0);

                if (buy_price === 0 || coins === 0) {
                    document.querySelector('#latest').style.color = "white";
                } else {
                    if (data.latestTradePrice < buy_price) {
                        document.querySelector('#latest').style.color = "red";
                    }
                    else if (data.latestTradePrice > buy_price && data.latestTradePrice <= sell_price) {
                        document.querySelector('#latest').style.color = "blue";
                    } else {
                        document.querySelector('#latest').style.color = "yellow";
                    }
                }

                previous_price = data.latestTradePrice;
                previous_trend = trend;

                GetTickerData();
            }
        })
        .catch(function (err) {
            console.log(err.message);
            console.log('error reading api. retrying...');
            sleep(500);
            GetTickerData();
        });
}

function getDeci(price) {
    if (isNaN(price)) return 0;
    return price / (price - 0.1) - 1;
}

function getProfit(deci, fee, amount) {
    if (isNaN(amount)) return 0;
    return (1 - fee) * amount * deci;
}
