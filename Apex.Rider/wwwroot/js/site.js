// chartjs settings
var tickerChart = null;
var tickerValues = [];
var tickerLabels = [];
var tickerCharts = [];
var tickerValue = 0;

var candlestickChart = null;
var candlestickValues = [];
var candlestickLabels = [];
var candlestickCharts = [];
var candlestickValue = 0;

var cnt = 0;
var sum = 0;

var wsUri = "wss://stream.crypto.com/v2/market";
var websocket = {};
var fee = 0.0024; // 0.00090 + 0.0015
var previous_trend = "&nbsp;&nbsp;";
var previous_price = 0;
var heartbeatId = 40751365019;
var period;
var candlestick;
var projection = 2; // percentage, sell price = buy price + 2%

var tickerEndpoint;
var candlestickEndpoint;

document.addEventListener('DOMContentLoaded', (event) => {

    let coin = document.querySelector('#crypto').innerHTML;
    startWebsocket();
    tickerEndpoint = getTickerEndpoint(coin);
    connectTo(tickerEndpoint);

    document.querySelector("#crypto_menu").onclick = function (e) {

        let coin = e.target.innerText;
        document.querySelector('#crypto').innerHTML = coin;

        document.querySelector("#balance").innerHTML = 0;
        document.querySelector("#profit").innerHTML = 0;
        document.querySelector("#buy_price").value = 0;
        document.querySelector("#sell_price").value = 0;
        document.querySelector("#coins").value = 0;

        tickerValues.fill(0);

        startWebsocket();
        tickerEndpoint = getTickerEndpoint(coin);
        connectTo(tickerEndpoint);
    };

    document.querySelector("#buy_price").onblur = function () {
        document.querySelector("#sell_price").value = parseFloat(document.querySelector("#buy_price").value) * (1 + projection / 100);
    };
});

function getTickerEndpoint(coin) {
    return `ticker.${coin}_USDT`;
}

////document.querySelector("#period_menu").onclick = function (e) {

////    document.querySelector('#period').innerHTML = e.target.innerText;
////    let coin = document.querySelector('#crypto').innerHTML;
////    instrument = `${coin}_USDT`;
////    period = "5m";
////    candlestick = `candlestick.${period}.${instrument}`;

////    //startWebsocket();
////    connectTo(candlestick);
////};

///////////// UI functions /////////////////////////////////////

function createTickerChart() {

    tickerValues = [];
    tickerLabels = [];
    tickerValues.length = 100;
    tickerLabels.length = 100;
    tickerValues.fill(previous_price);
    tickerLabels.fill("");

    let ctx = document.querySelector("#ticker_chart").getContext('2d');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: tickerLabels,
            datasets: [
                {
                    label: "Price",
                    data: tickerValues,
                    fill: "start",
                    borderWidth: 2,
                    borderColor: "yellow",
                    lineTension: 0.5,
                    pointRadius: 3,
                    //color: "blue",
                    backgroundColor: "transparent",
                    hoverRadius: 5
                }
            ]
        },
        options: {
            showLine: true,
            responsive: true,
            maintainAspectRatio: false,
            spanGaps: false,
            elements: {
                line: {
                    tension: 0.3
                }
            },
            plugins: {
                filler: {
                    propagate: false
                }
            },
            legend: {
                display: false
            },
            title: {
                display: false
            },
            animation: {
                duration: 50,
                easing: 'linear'
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                        drawOnChartArea: false,
                        drawTicks: false,
                    },
                    ticks: {
                        display: false,
                    },
                }],
                yAxes: [{
                    gridLines: {
                        display: false,
                        drawOnChartArea: false,
                        drawTicks: false,
                    },
                    ticks: {
                        display: false,
                    },
                }],
            },
            tooltips: {
                intersect: false,
                backgroundColor: "black",
                titleFontSize: 48,
                titleSpacing: 4,
                titleMarginBottom: 4,
                titleMargin: 4,
                bodyFontSize: 48,
                xPadding: 8,
                yPadding: 8,
                cornerRadius: 2,
                displayColors: false,
                callbacks: {
                    //title: function (t, d) {
                    //    const o = d.datasets.map((ds) => ds.data[t[0].index].toFixed(2))
                    //    return o.join(', ');
                    //},
                    label: function (t, d) {
                        //return d.labels[t.index];
                        let price = parseFloat(t.value);
                        return `Price: ${price.toFixed(2)}`;
                    }
                }
            },
        }
    });
}

function createCandlestickChart() {

    let speed = 300;

    //candlestickValues.fill(16);
    //candlestickLabels.fill("none");
    let ctx = document.querySelector("#candlestick_chart").getContext('2d');

    return new Chart(ctx,
        {
            type: 'candlestick',
            data: {
                labels: candlestickLabels,
                datasets: [
                    {
                        label: "Price",
                        data: candlestickValues,
                        fill: false,
                        borderWidth: 1,
                        borderColors: {
                            up: 'yellow',
                            down: 'red',
                            unchanged: 'green',
                        },
                        lineTension: 0.5,
                        pointRadius: 0,
                        hoverRadius: 3,
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
                            drawOnChartArea: false,
                            drawTicks: true,
                        },
                        ticks: {
                            display: true,
                        },
                    }],
                }
            }
        });
}

function drawTickerChart(data) {

    previous_price = data.a;

    if (tickerChart == null) {
        tickerChart = createTickerChart();

        setInterval(() => {
            tickerValues.push(sum / cnt);
            tickerValues.shift();
            //let dateTime = new Date(data.t);
            //tickerLabels.push(dateTime.toLocaleTimeString());
            //tickerLabels.shift();
            tickerChart.update();
            ////tickerValues.pop();
            sum = 0;
            cnt = 0;
        }, 2000);

    } else {

        sum += data.a;
        cnt++;
    }
}

function drawCandlestickChart(data) {
    if (candlestickChart == null) {
        candlestickValues = data;
        candlestickChart = createCandlestickChart();
    } else {
        //candlestickValues.push(data[0]);
        //candlestickValues.shift();
        ////let dateTime = new Date(data.t);
        ////candlestickLabels.push(dateTime.toLocaleTimeString());
        ////candlestickLabels.shift();
        //candlestickChart.update();
    }
}

function writePrices(data) {
    let trend;
    let precision = data.a <= 100 ? 4 : 2;

    if (data.a == previous_price) {
        trend = previous_trend;
    }
    if (data.a > previous_price) {
        trend = "&#8599;";
    }
    if (data.a < previous_price) {
        trend = "&#8600;";
    }

    document.querySelector('#latest').innerHTML = trend + data.a.toFixed(precision);

    let fee = 1 - 0.0024;
    let coins = parseFloat(document.querySelector('#coins').value);
    let buy_price = parseFloat(document.querySelector('#buy_price').value);
    let sell_price = parseFloat(document.querySelector('#sell_price').value);

    let balance = coins * buy_price;
    document.querySelector('#balance').innerHTML = balance.toFixed(0);

    let profit = (data.a - buy_price) * coins * fee;
    document.querySelector('#profit').innerHTML = profit.toFixed(0);

    if (buy_price === 0 || coins === 0) {
        document.querySelector('#latest').style.color = "white";
    } else {
        if (data.a < buy_price) {
            document.querySelector('#latest').style.color = "red";
        }
        else if (data.a > buy_price && data.a <= sell_price) {
            document.querySelector('#latest').style.color = "blue";
        } else {
            document.querySelector('#latest').style.color = "yellow";
        }
    }

    previous_price = data.a;
    previous_trend = trend;
}

///////////// WebSockets functions /////////////////////////////////////

function startWebsocket() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function (evt) { onOpen(evt) };
    websocket.onclose = function (evt) { onClose(evt) };
    websocket.onmessage = function (evt) { onMessage(evt) };
    websocket.onerror = function (evt) { onError(evt) };
}

function connectTo(endpoint) {
    let channels = [];
    channels.push(endpoint);
    let message = buildMessage(heartbeatId, channels)
    setTimeout(() => { websocket.send(JSON.stringify(message)); }, 2000);
}

function onMessage(evt) {
    var data = JSON.parse(evt.data);
    if (data.method == "public/heartbeat") {
        heartbeatId = data.id;
        setTimeout(() => { respondHeartbeat(data.id); }, 2000);
    }
    if (data.method == "subscribe") {
        if (data.result != undefined) {
            if (data.result.subscription === tickerEndpoint) {
                writePrices(data.result.data[0]);
                drawTickerChart(data.result.data[0]);
            }
            if (data.result.subscription === candlestickEndpoint) {
                drawCandlestickChart(data.result.data);
            }
        }
    }
}

function onOpen(evt) {
    console.log("CONNECTED");
}

function onClose(evt) {
    console.log("DISCONNECTED");
}

function onError(evt) {
    console.log(`ERROR: ${evt.data}`);
}

function respondHeartbeat(id) {
    var message = {
        "id": id,
        "method": "public/respond-heartbeat"
    };
    websocket.send(JSON.stringify(message));
    console.log(`HEARTBEAT: ${id}`);
}

function buildMessage(id, channels) {
    var message = {
        "id": id,
        "method": "subscribe",
        "params": {
            "channels": channels
        }
    };

    return message;
}

function closeConnection() {
    websocket.close();
    websocket = null;
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

//////function GetTickerData() {
//////    let crypto = document.querySelector('#crypto').innerHTML;
//////    var url = `/api/v2/crypto/price/${coin}`;

//////    sleep(500);

//////    fetch(url, {
//////        method: 'GET',
//////        mode: 'cors'
//////    })
//////        .then((response) => response.json())
//////        .then(function (data) {
//////            if (data !== undefined) {

//////                writePrices(data);

//////                GetTickerData();
//////            }
//////        })
//////        .catch(function (err) {
//////            console.log(err.message);
//////            console.log('error reading api. retrying...');
//////            sleep(500);
//////            GetTickerData();
//////        });
//////}
