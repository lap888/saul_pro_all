/* 策略说明 
   bg vvds
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2022-12-14 17:21:14
 */

//引入BG
const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
const bgapiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
const passphrase = 'toptoptop';


let bgEthPrice = 0;
let lockPrice = []

// bg-websocket
const bitgetWsClient = new BitgetWsClient({
    reveice: (message) => {
        if (message.startsWith('{')) {
            message = JSON.parse(message)
            if (message.action != undefined) {
                bgEthPrice = Number(message.data[0].markPrice)
            }
        }


    }
}, bgapiKey, secretKey, passphrase);

const subArr = new Array();

const subscribeOne = new SubscribeReq('mc', 'ticker', 'ETHUSDT');


subArr.push(subscribeOne);

bitgetWsClient.subscribe(subArr);

// binance
const prod = false;
let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const action = ''
const doType = 1

//BN
const { Future, XhSpot, TA, _G, _N, LogProfit, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const process = require('process');
// const apiKey = '6HBfkhKbXMY26knOZBN948NXUMK4Wx4OHtdIVUrWjDjXIGtAZge2XlnlWHRA3g3y'
// const apiSecret = 'DoeGWvvW56cNB1reMkh520hMSSKiaQHfeAH0rTKuJoAhkl7VjWZ5wi7F3ytPVoiL'

const apiKey = 'KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00'
const apiSecret = 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO'

let symbolDatas = []
let dtRun = null;
let dtRun2 = null;
let dt = {}
let mk = null
let symbolPrice = {}
let symbolPrice2 = {}
let symbolAction = {}
let interValTime = 0.5;//清洗时间
let _btr = 0.00186;//波动率

// let btRate = { 'SUSHIUSDT': _btr, 'ZILUSDT': _btr, 'ATOMUSDT': _btr, 'MATICUSDT': _btr, 'ETCUSDT': _btr, 'XRPUSDT': _btr, 'ETHUSDT': _btr, 'BTCUSDT': _btr, 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
let btRate = { 'ETHUSDT': _btr }
// let btRate = { 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
symbolDatas = Object.keys(btRate)
let symbolAmount = Object.keys(btRate);

//初始化维护二分化数据
// let twoSymbolData = { ETHUSDT: { n: { open: 1, close: 2, high: 2.5, low: 1, time: null }, o: {}, t: null } };
let twoSymbolData = {};
symbolAmount.map(v => {
    twoSymbolData[v] = { n: null, o: null, history: null, min: null, max: null, t: null }
})
// console.log(twoSymbolData)
let doRecord = _G('doRecord')
if (doRecord == undefined || doRecord == null) {
    doRecord = {}
} else {
    doRecord = JSON.parse(doRecord)
}
let exInfo = [];
let exDt = null;
let sDt = {}
let sDtTime = 60;
let sDt2 = {}
let cDt = {}
let cDo = {}
let lossDt = {}
let incomeDt = {}
let winRate = 0.1;

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })

const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://stream.binance.com:9443' })

process.on('uncaughtException', (error, source) => {
    console.log('未捕获异常=>', error, source)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}


sclient.createListenKey().then(response => {
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient.renewListenKey(listenKey).then(res => {
            console.log(`延长listenkey,25分钟`, res)
        })
    }, 25 * 60 * 1000);
    let SymbolDataArrys = []
    symbolDatas.map(v => {
        SymbolDataArrys.push(`${v.toLowerCase()}@bookTicker`)
    })
    sclient.combinedStreams(SymbolDataArrys, {
        open: () => {
            console.log('策略启动...')
        },
        close: () => console.log('策略关闭...'),
        message: (msg) => {
            msg = JSON.parse(msg.toString());
            let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
            let symbol = msg.data.s;
            price = Number(price)
            lockPrice.push({ '币安ETH当前价格': price, 'bgETH当前价格': bgEthPrice, '统计时间': DateFormat(Date.now()) })
            //秒K
            if (twoSymbolData[symbol].t == null || Date.now() - twoSymbolData[symbol].t <= interValTime * 1000) {
                if (twoSymbolData[symbol].n == null) {
                    twoSymbolData[symbol].n = {}
                    twoSymbolData[symbol].t = Date.now()
                    twoSymbolData[symbol].n['open'] = price;
                    twoSymbolData[symbol].n['close'] = price;
                    twoSymbolData[symbol].n['heigh'] = price;
                    twoSymbolData[symbol].n['low'] = price;
                    twoSymbolData[symbol].n['time'] = DateFormat(Date.now());
                    twoSymbolData[symbol].n['timeSpan'] = Date.now();

                    twoSymbolData[symbol].n['bgopen'] = bgEthPrice;
                    twoSymbolData[symbol].n['bgclose'] = bgEthPrice;
                    twoSymbolData[symbol].n['bgheigh'] = bgEthPrice;
                    twoSymbolData[symbol].n['bglow'] = bgEthPrice;
                } else {
                    twoSymbolData[symbol].n['close'] = price;
                    twoSymbolData[symbol].n['bgclose'] = bgEthPrice;
                    if (price > twoSymbolData[symbol].n['heigh']) {
                        twoSymbolData[symbol].n['heigh'] = price;
                    }
                    if (price < twoSymbolData[symbol].n['low']) {
                        twoSymbolData[symbol].n['low'] = price;
                    }

                    if (bgEthPrice > twoSymbolData[symbol].n['bgheigh']) {
                        twoSymbolData[symbol].n['bgheigh'] = bgEthPrice;
                    }
                    if (bgEthPrice < twoSymbolData[symbol].n['bglow']) {
                        twoSymbolData[symbol].n['bglow'] = bgEthPrice;
                    }
                }
                if (twoSymbolData[symbol].min == null || twoSymbolData[symbol].max == null) {
                    twoSymbolData[symbol].min = price;
                    twoSymbolData[symbol].max = price;
                } else {
                    if (price < twoSymbolData[symbol].min) {
                        twoSymbolData[symbol].min = price
                    }
                    if (price > twoSymbolData[symbol].max) {
                        twoSymbolData[symbol].max = price
                    }
                }
                //平仓
                if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1 * 1000) {
                    if (symbolAction[`${symbol}`].action == 'S') {
                        let isIncome = Number(bgEthPrice) < symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        pLog(`回调 | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平空 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                        // SellCloseAll(mixOrderApi, mixPositionApi, symbol, -1)
                    }
                    if (symbolAction[`${symbol}`].action == 'L') {
                        let isIncome = Number(bgEthPrice) > symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        pLog(`回调 | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平多 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                        // BuyCloseAll(mixOrderApi, mixPositionApi, symbol, -1)
                    }
                }
                //开单
                let avgPrice = (twoSymbolData[symbol].min + twoSymbolData[symbol].max) / 2
                let doL = price > avgPrice;
                let doS = price < avgPrice;
                let diffPrice = twoSymbolData[symbol].max - twoSymbolData[symbol].min;
                let btPrice1 = _N(btRate[`${symbol}`] * Number(price), 8);
                //做多 or 做空 //发送开单信号 休息N分钟
                if (diffPrice > btPrice1) {
                    if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
                        let flag = doL == true ? 'L' : doS == true ? 'S' : ''
                        symbolAction[`${symbol}`] = { action: flag, price: Number(bgEthPrice) };
                        pLog(`回调 | ${symbol} | 开仓:${flag} | 币安价格:${price} | bg价格:${bgEthPrice} | ${interValTime}秒内 | 价格波动:${btRate[`${symbol}`]} | ${btPrice1}U | 休息${sDtTime}秒`)
                        if (flag == 'L') {
                            // Buy(mixOrderApi, mixMarketApi, symbol, 53, Number(price))
                        }
                        if (flag == 'S') {
                            // Sell(mixOrderApi, mixMarketApi, symbol, 53, Number(price))
                        }
                    }
                }
            } else {
                //超过K周期清洗数据
                twoSymbolData[symbol].o = twoSymbolData[symbol].n
                if (twoSymbolData[symbol].history == null) {
                    twoSymbolData[symbol].history = []
                }
                if (twoSymbolData[symbol].n != null) {
                    twoSymbolData[symbol].history.push(twoSymbolData[symbol].n)
                }
                twoSymbolData[symbol].n = null
                twoSymbolData[symbol].t = null
            }
            // 1分钟保存一次秒K
            if (mk == null || Date.now() - mk > 60 * 1000) {
                mk = Date.now()
                _G('MKline1', JSON.stringify(twoSymbolData))
                _G('priceDB1', JSON.stringify(lockPrice))
            }

        }
    });

})

