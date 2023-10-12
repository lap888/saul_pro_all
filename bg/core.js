//引入BG
const proxyIp = '127.0.0.1'
const proxy = '1087'

const action = ''//''全做 Buy 做多 Sell 做空
const doType = 1 // 正向 2 反向

const bitgetApi = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
const bgApiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
const passphrase = 'toptoptop';

let httpsAgent = new HttpsProxyAgent({ host: proxyIp, port: proxy })
const mixAccountApi = new bitgetApi.MixAccountApi(bgApiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixPositionApi = new bitgetApi.MixPositionApi(bgApiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixMarketApi = new bitgetApi.MixMarketApi(bgApiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixOrderApi = new bitgetApi.MixOrderApi(bgApiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const { Buy, BuyClose, BuyCloseAll, Sell, SellClose, SellCloseAll } = require('./bgApi')

//BN
const { Future, TA, _G, _N, LogProfit, Log, DateFormat, Sleep } = require('binance-futures-connector')
const process = require('process');
// const apiKey = '6HBfkhKbXMY26knOZBN948NXUMK4Wx4OHtdIVUrWjDjXIGtAZge2XlnlWHRA3g3y'
// const apiSecret = 'DoeGWvvW56cNB1reMkh520hMSSKiaQHfeAH0rTKuJoAhkl7VjWZ5wi7F3ytPVoiL'

const apiKey = 'KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00'
const apiSecret = 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO'





let symbolDatas = ['BTCUSDT', 'ETHUSDT', 'APTUSDT', 'DOGEUSDT']

let dt = {}
let symbolPrice = {}
let symbolAction = {}
let interValTime = 2;//清洗时间
let _btr = 0.005;//波动率

let btRate = { 'SUSHIUSDT': _btr, 'ZILUSDT': _btr, 'ATOMUSDT': _btr, 'MATICUSDT': _btr, 'SOLUSDT': _btr, 'ETCUSDT': _btr, 'XRPUSDT': _btr, 'ETHUSDT': _btr, 'BTCUSDT': _btr, 'APTUSDT': _btr, 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
// let btRate = { 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
symbolDatas = Object.keys(btRate)
let sDt = {}
let sDtTime = 166;
let sDt2 = {}
let cDt = {}
let cDo = {}
let lossDt = {}
let incomeDt = {}
let winRate = 0.12;

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })

process.on('uncaughtException', (error, source) => {
    console.log('未捕获异常=>', error, source)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}

client.listenKeyPost().then(response => {
    setInterval(() => {
        client.listenKeyPut().then(res => {
            console.log(`延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);
    let SymbolDataArrys = []
    symbolDatas.map(v => {
        // SymbolDataArrys.push(`${v.toLowerCase()}@markPrice@1s`)
        SymbolDataArrys.push(`${v.toLowerCase()}@bookTicker`)
    })
    client.combinedStreams(SymbolDataArrys, {
        open: () => {
            console.log('策略启动...')
        },
        close: () => console.log('策略关闭...'),
        message: (msg) => {
            msg = JSON.parse(msg.toString());
            let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
            let symbol = msg.data.s;
            // let ms = `${msg.data.e} | ${msg.data.s} | ${price} | ${DateFormat(msg.data.E)}`
            // console.log(ms)
            //秒单4
            if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1 * 1000) {
                if (symbolAction[`${symbol}`].action == 'S') {
                    if (Number(price) < symbolAction[`${symbol}`].price * (1 - winRate * 0.01 * 2)) {
                        sDt2[`${symbol}`] = -1;
                        pLog(`${symbol}=>止盈|平空|价格${price}`)
                        SellCloseAll(mixOrderApi, mixPositionApi, symbol, -1)
                    }
                    //1
                    if (Number(price) > symbolAction[`${symbol}`].price * (1 + winRate * 0.01)) {
                        if (lossDt[`${symbol}`] != undefined && lossDt[`${symbol}`] != -1 && Date.now() - lossDt[`${symbol}`] > 10 * 1000) {
                            sDt2[`${symbol}`] = -1;
                            lossDt[`${symbol}`] = -1
                            pLog(`${symbol}=>止损|平空|价格${price}`)
                            SellCloseAll(mixOrderApi, mixPositionApi, symbol, -1)
                        }
                    } else {
                        lossDt[`${symbol}`] = Date.now()
                    }
                }
                if (symbolAction[`${symbol}`].action == 'L') {
                    if (Number(price) > symbolAction[`${symbol}`].price * (1 + winRate * 0.01 * 2)) {
                        sDt2[`${symbol}`] = -1;
                        pLog(`${symbol}=>止盈|平多|价格${price}`)
                        BuyCloseAll(mixOrderApi, mixPositionApi, symbol, -1)
                    }
                    //1
                    if (Number(price) < symbolAction[`${symbol}`].price * (1 - winRate * 0.01)) {
                        if (lossDt[`${symbol}`] != undefined && lossDt[`${symbol}`] != -1 && Date.now() - lossDt[`${symbol}`] > 10 * 1000) {
                            sDt2[`${symbol}`] = -1;
                            lossDt[`${symbol}`] = -1
                            pLog(`${symbol}=>止损|平多|价格${price}`)
                            BuyCloseAll(mixOrderApi, mixPositionApi, symbol, -1)
                        } else {
                            lossDt[`${symbol}`] = Date.now()
                        }
                    }

                }
            }

            if (dt[`${symbol}`] == undefined || Date.now() - dt[`${symbol}`] > interValTime * 1000) {
                //清洗
                dt[`${symbol}`] = Date.now()
                symbolPrice[`${symbol}_min`] = 0
                symbolPrice[`${symbol}_max`] = 0
            } else {
                if (symbolPrice[`${symbol}_min`] == 0 || symbolPrice[`${symbol}_min`] == undefined) {
                    symbolPrice[`${symbol}_min`] = Number(price)
                }
                if (symbolPrice[`${symbol}_max`] == 0 || symbolPrice[`${symbol}_max`] == undefined) {
                    symbolPrice[`${symbol}_max`] = Number(price)
                }
                //
                if (Number(price) > symbolPrice[`${symbol}_max`]) {
                    symbolPrice[`${symbol}_max`] = Number(price)
                }
                if (Number(price) < symbolPrice[`${symbol}_min`]) {
                    symbolPrice[`${symbol}_min`] = Number(price)
                }
                //
                let btPrice1 = _N(btRate[`${symbol}`] * Number(price), 8);
                if (symbolPrice[`${symbol}_max`] - symbolPrice[`${symbol}_min`] > btPrice1) {
                    let mPrice = (symbolPrice[`${symbol}_max`] + symbolPrice[`${symbol}_min`]) / 2;
                    let flag = ""
                    if (doType == 1) {
                        if (Number(price) > mPrice) {
                            flag = "L"
                        }
                        if (Number(price) < mPrice) {
                            flag = "S"
                        }
                    }
                    if (doType == 2) {
                        if (Number(price) > mPrice) {
                            flag = "S"
                        }
                        if (Number(price) < mPrice) {
                            flag = "L"
                        }
                    }

                    //发送开单信号 休息N分钟
                    if (action == flag || action == '') {
                        if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                            sDt[`${symbol}`] = Date.now()
                            sDt2[`${symbol}`] = Date.now()
                            symbolAction[`${symbol}`] = { action: flag, price: Number(price) };
                            pLog(`${symbol}=>开仓|价格${price} | ${interValTime}秒内,价格波动:${btRate[`${symbol}`]} | ${btPrice1}U,趋势DO:${flag} | 趋势DO2:${cDo[`${symbol}`] == undefined ? ' ' : cDo[`${symbol}`]} | 休息${sDtTime}秒`)
                            if (flag == 'L') {
                                Buy(mixOrderApi, mixMarketApi, symbol, 53, Number(price))
                            }
                            if (flag == 'S') {
                                Sell(mixOrderApi, mixMarketApi, symbol, 53, Number(price))
                            }
                        }
                    }

                }
            }
        }
    });
})