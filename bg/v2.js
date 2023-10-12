/* 策略说明 
 秒k统计
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2022-12-14 14:23:18
 */

//引入BG
const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
const bgapiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
const passphrase = 'toptoptop';

//websocket
let bgEthPrice = 0;
let lockPrice = []
const bitgetWsClient = new BitgetWsClient({
    reveice: (message) => {
        // console.log('>>>' + message, typeof (message), message.startsWith('{'));
        if (message.startsWith('{')) {
            message = JSON.parse(message)
            if (message.action != undefined) {
                bgEthPrice = Number(message.data[0].markPrice)
                // console.log('>>>' + Number(message.data[0].markPrice));
            }
        }


    }
}, bgapiKey, secretKey, passphrase);

const subArr = new Array();

const subscribeOne = new SubscribeReq('mc', 'ticker', 'ETHUSDT');


subArr.push(subscribeOne);

bitgetWsClient.subscribe(subArr)

//
// const proxyIp = '127.0.0.1'
// const proxy = '1087'
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

let symbolDatas = ['BTCUSDT', 'ETHUSDT', 'APTUSDT', 'DOGEUSDT']
let dtRun = null;
let dtRun2 = null;
let dt = {}
let mk = null
let symbolPrice = {}
let symbolPrice2 = {}
let symbolAction = {}
let interValTime = 10;//清洗时间
let _btr = 0.002;//波动率

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
let sDtTime = 300;
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
// sclient.exchangeInfo({symbol:'ETHUSDT'}).then(response => {
//     console.log('权重:',response.headers['x-mbx-used-weight-1m'],response.data)
// })

// const callbacks = {
//     open: () => console.log('sopen'),
//     close: () => console.log('sclosed'),
//     message: msg => {
//         msg = JSON.parse(msg.toString());
//         console.log(msg)
//     }
// }
// const combinedStreams = sclient.combinedStreams(['ethusdt@ticker'], callbacks)

sclient.createListenKey().then(response => {
    // console.log('key',response.data.listenKey)
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient.renewListenKey(listenKey).then(res => {
            console.log(`延长listenkey,25分钟`, res)
        })
    }, 25 * 60 * 1000);
    let SymbolDataArrys = []
    symbolDatas.map(v => {
        // SymbolDataArrys.push(`${v.toLowerCase()}@markPrice@1s`)
        SymbolDataArrys.push(`${v.toLowerCase()}@ticker`)
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
            // console.log(symbol, price)
            lockPrice.push({ '币安ETH当前价格': price, 'bgETH当前价格': bgEthPrice, '统计时间': DateFormat(Date.now()) })
            //秒K
            if (twoSymbolData[symbol].t == null || Date.now() - twoSymbolData[symbol].t <= 1000) {
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
            // if
            if (mk == null || Date.now() - mk > 60 * 1000) {
                mk = Date.now()
                _G('1sKine7', JSON.stringify(twoSymbolData))
                _G('priceDB1', JSON.stringify(lockPrice))
            }

        }
    });

})

