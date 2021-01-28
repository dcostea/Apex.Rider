var tickerChart = null;
var tickerValues = [];
var tickerLabels = [];
var tickerCharts = [];

var candlestickChart = null;
var candlestickValues = [];
var candlestickLabels = [];
var candlestickCharts = [];
var candlestickValue = 0;

var cnt = 0;
var sum = 0;
var timing = 6250; //ms
var wsUri = "wss://stream.crypto.com/v2/market";
var websocket = {};
var sell_fee = 0.0009;
var buy_fee = 0.0015;
var previous_trend = "&nbsp;&nbsp;";
var previous_price = 0;
var heartbeatId = 40751365019;
var period;
var candlestick;
var projection = 2; // percentage, sell price = buy price + 2%
var min_revenue;

var tickerEndpoint;
var candlestickEndpoint;
var tickerInterval;

document.addEventListener('DOMContentLoaded', (event) => {

    let coin = document.querySelector('#crypto').innerHTML;
    min_revenue = parseFloat(document.querySelector("#min_revenue").value);
    document.querySelector('#crypto_url').href = `https://crypto.com/exchange/trade/spot/${coin}_USDT`;
    document.querySelector('#crypto_url').innerHTML = `Go to ${coin}_USDT market...`;
    startWebsocket();
    tickerEndpoint = getTickerEndpoint(coin);
    connectTo(tickerEndpoint);

    document.querySelector("#crypto_menu").onclick = function (e) {

        let coin = e.target.innerText;
        document.querySelector('#crypto').innerHTML = coin;
        document.querySelector('#crypto_url').href = `https://crypto.com/exchange/trade/spot/${coin}_USDT`;
        document.querySelector('#crypto_url').innerHTML = `Go to ${coin}_USDT market...`;
        document.querySelector("#balance").innerHTML = 0;
        document.querySelector("#revenue").innerHTML = 0;
        document.querySelector("#buy_price").value = 0;
        document.querySelector("#sell_price").value = 0;
        document.querySelector("#coins").value = 0;

        tickerChart.destroy();
        tickerChart = null;
        sum = 0;
        cnt = 0;
        clearInterval(tickerInterval);

        startWebsocket();
        tickerEndpoint = getTickerEndpoint(coin);
        connectTo(tickerEndpoint);
    };

    document.querySelector("#buy_price").onfocus = function () {
        document.querySelector("#buy_price").select();
    };

    document.querySelector("#sell_price").onfocus = function () {
        document.querySelector("#sell_price").select();
    };

    document.querySelector("#coins").onfocus = function () {
        document.querySelector("#coins").select();
    };
    
    document.querySelector("#min_revenue").onfocus = function () {
        document.querySelector("#min_revenue").select();
    };

    document.querySelector("#buy_price").onblur = function () {
        let coins = parseFloat(document.querySelector("#coins").value);
        let buy_price = parseFloat(document.querySelector("#buy_price").value);
        let amount = buy_price * coins;
        let fee = amount * buy_fee + (amount + min_revenue) * sell_fee;
        let sell_price = (amount + min_revenue + fee) / coins;
        let precision = sell_price <= 100 ? 2 : 0;
        document.querySelector("#sell_price").value = sell_price.toFixed(precision);
    };

    document.querySelector("#min_revenue").onblur = function () {
        min_revenue = parseFloat(document.querySelector("#min_revenue").value);
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

    tickerChart = null;
    tickerValues = [];
    tickerLabels = [];
    tickerValues.length = 100;
    tickerLabels.length = 100;
    tickerValues.fill(previous_price);
    tickerLabels.fill("");

    let ctx = document.querySelector("#ticker_chart").getContext('2d');

    tickerChart = new Chart(ctx, {
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
                    pointRadius: 4,
                    hoverRadius: 7,
                    backgroundColor: "transparent"
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
                    tension: 0.2
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
                duration: 100,
                easing: 'easeInCubic'
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: true,
                        //drawOnChartArea: true,
                        drawTicks: true,
                    },
                    ticks: {
                        display: false,
                    },
                }],
                yAxes: [{
                    gridLines: {
                        display: true,
                        //drawOnChartArea: true,
                        drawTicks: true,
                    },
                    ticks: {
                        display: false,
                    },
                }],
            },
            tooltips: {
                intersect: false,
                backgroundColor: "rgba(0,0,0,0.5)",
                titleFontSize: 48,
                titleSpacing: 4,
                titleMarginBottom: 4,
                titleMargin: 4,
                bodyFontSize: 48,
                xPadding: 8,
                yPadding: 8,
                bodyFontColor: "orange",
                cornerRadius: 2,
                displayColors: false,
                callbacks: {
                    //title: function (t, d) {
                    //    const o = d.datasets.map((ds) => ds.data[t[0].index].toFixed(2))
                    //    return o.join(', ');
                    //},
                    label: function (t, d) {
                        let price = parseFloat(t.value);
                        return `Price: ${price.toFixed(2)}`;
                    }
                }
            },
        }
    });
}

function drawTickerChart(data) {

    if (tickerChart == null) {
        createTickerChart();

        clearInterval(tickerInterval);

        tickerInterval = setInterval(() => {
            tickerValues.push(sum / cnt);
            tickerValues.shift();

            let d = new Date();
            tickerLabels.push(`Time: ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`);
            tickerLabels.shift();

            tickerChart.update();
            sum = 0;
            cnt = 0;
        }, timing);

    } else {
        sum += data.a;
        cnt++;
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

    let coins = parseFloat(document.querySelector('#coins').value);
    let buy_price = parseFloat(document.querySelector('#buy_price').value);

    let balance = coins * buy_price;
    document.querySelector('#balance').innerHTML = balance.toFixed(0);

    let revenue = (data.a - buy_price - data.a * sell_fee - buy_price * buy_fee) * coins;
    document.querySelector('#revenue').innerHTML = revenue.toFixed(0);

    if (buy_price === 0 || coins === 0) {
        document.querySelector('#latest').style.color = "white";
    } else {
        if (revenue < 0) {
            document.querySelector('#latest').style.color = "red";
            document.querySelector('#revenue').style.color = "red";
        }
        else if (revenue <= min_revenue) {
            document.querySelector('#latest').style.color = "blue";
            document.querySelector('#revenue').style.color = "blue";
        } else {
            document.querySelector('#latest').style.color = "yellow";
            document.querySelector('#revenue').style.color = "yellow";
        }
    }

    previous_price = parseFloat(data.a);
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
    connectTo(tickerEndpoint);
    console.log("RECONNECTED");
}

function onError(evt) {
    console.log(`ERROR: ${evt.data}`);
}

function respondHeartbeat(id) {
    var message = {
        "id": id,
        "method": "public/respond-heartbeat"
    };

    switch (websocket.readyState) {
        case 0:
            console.log("CONNECTING. Socket has been created. The connection is not yet open.");
            break;
        case 1:
            websocket.send(JSON.stringify(message));
            console.log(`HEARTBEAT: ${id}`);
            break;
        case 2:
            console.log("CLOSING. The connection is in the process of closing.");
            break;
        case 3:
            console.log("CLOSED. The connection is closed or couldn't be opened.");
            console.log("RECONNECTING...");

            startWebsocket();
            connectTo(tickerEndpoint);

            break;
    }
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
