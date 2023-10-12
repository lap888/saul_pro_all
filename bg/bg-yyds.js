/* 策略说明 
   bg vvds
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2022-12-23 16:16:20
 */
const express = require('express')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Future, XhSpot, TA, _G, _N, LogProfit, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const process = require('process');
const port = '30015'

//引入BG
const ExKey = [
    {
        id: 1,
        name: 'ZY',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        amount: 3,
        isLoss: true
    },
    // {
    //     id: 2,
    //     name: 'MirLiu',
    //     apiKey: 'bg_8a8063afa063183cdf8973eddb932399',
    //     secretKey: '31a8ea93cccd5993273bff0ae7ea4a9ebbcf98fc62551238af8618e6188c7c1b',
    //     passphrase: 'Ay888888',
    //     amount: 5,
    //     isLoss: true
    // },
    {
        id: 3,
        name: 'Qee',
        apiKey: 'bg_ca1ffdca50e1ac4c74411c584c2d4cea',
        secretKey: '6a1a36b6a197ba83936ab0c2662633414c505f967975e18a8210086ad152044a',
        passphrase: 'ww123456',
        amount: 5,
        isLoss: true
    }
]

const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
// const bgapiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
// const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
// const passphrase = 'toptoptop';
const bgapiKey = 'bg_bd1bff02d35c721c1b667a84ae4bda1a';
const secretKey = '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b';
const passphrase = 'xh18819513042';

const { Buy, BuyClose, BuyByQ, BuyCloseAll, Sell, SellByQ, SellClose, SellCloseAll } = require('./bgApi')

let bgEthPrice = 0;
let lockPrice = []

process.on('uncaughtException', (error, source) => {
    console.error('未捕获异常=>', error, source)
})


// binance
const prod = true;
let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}

//BN

// const apiKey = '6HBfkhKbXMY26knOZBN948NXUMK4Wx4OHtdIVUrWjDjXIGtAZge2XlnlWHRA3g3y'
// const apiSecret = 'DoeGWvvW56cNB1reMkh520hMSSKiaQHfeAH0rTKuJoAhkl7VjWZ5wi7F3ytPVoiL'

const apiKey = 'KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00'
const apiSecret = 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO'

let symbolDatas = []
let mk = null
let symbolAction = {}
let interValTime = 0.96;//清洗时间
let _btr = 0.0017;//波动率
let _btr2 = 0.001;//波动率

let sDt = {}
let sDtTime = 60;
let sDt2 = {}
let sDt3 = {}

let isClose = {}

let sKey = 'ETHUSDT'
// let btRate = { 'SUSHIUSDT': _btr, 'ZILUSDT': _btr, 'ATOMUSDT': _btr, 'MATICUSDT': _btr, 'ETCUSDT': _btr, 'XRPUSDT': _btr, 'ETHUSDT': _btr, 'BTCUSDT': _btr, 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
let btRate = { 'ETHUSDT': _btr }
// let btRate = { 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
symbolDatas = Object.keys(btRate)
let symbolAmount = Object.keys(btRate);

//初始化维护二分化数据
// let twoSymbolData = { ETHUSDT: { n: { open: 1, close: 2, high: 2.5, low: 1, time: null }, o: {}, t: null } };
let twoSymbolData = {};
let kLine = _G('MkLine')
if (kLine != null && kLine.startsWith('{')) {
    kLine = JSON.parse(kLine)
} else {
    kLine = null;
}
symbolAmount.map(v => {
    let h = null;
    if (kLine != null) {
        h = kLine[v].history
    }
    twoSymbolData[v] = { n: null, o: null, history: h, min: null, max: null, t: null }
})
// console.log(twoSymbolData)
let doRecord = _G('doRecord')
if (doRecord == undefined || doRecord == null) {
    doRecord = {}
} else {
    doRecord = JSON.parse(doRecord)
}




const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://stream.binance.com:9443' })

const bitgetApi = require('bitget-openapi');
let httpsAgent = new HttpsProxyAgent({ host: proxyIp, port: proxy })
// const mixAccountApi = new bitgetApi.MixAccountApi(bgapiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
// const mixPositionApi = new bitgetApi.MixPositionApi(bgapiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
// const mixMarketApi = new bitgetApi.MixMarketApi(bgapiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
// const mixOrderApi = new bitgetApi.MixOrderApi(bgapiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });

const mixOrderApi = new bitgetApi.MixOrderApi(bgapiKey, secretKey, passphrase);
const mixMarketApi = new bitgetApi.MixMarketApi(apiKey, secretKey, passphrase);


function pLog(msg) {
    Log(msg)
    console.log(msg)
}


sclient.createListenKey().then(response => {
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient.renewListenKey(listenKey).then(res => {
            console.log(`延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);
    let SymbolDataArrys = []
    symbolDatas.map(v => {
        SymbolDataArrys.push(`${v.toLowerCase()}@bookTicker`)
    })
    sclient.combinedStreams(SymbolDataArrys, {
        open: () => {
            console.log('策略启动...')
            // setInterval(() => {
            //     let d = new Date()
            //     let ms = d.getMilliseconds()
            //     //清洗数据
            //     if (ms >= 0 && ms <= 1) {
            //         twoSymbolData[sKey].n = null
            //         twoSymbolData[sKey].t = null
            //         // console.log(ms, '清洗数据', DateFormat(Date.now()))
            //     }
            // }, 1);
        },
        close: () => console.log('策略关闭...'),
        message: (msg) => {
            msg = JSON.parse(msg.toString());
            let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
            let symbol = msg.data.s;
            price = Number(price)
            // if (mk == null || Date.now() - mk > 1 * 1000) {
            //     mk = Date.now()
            //     mixMarketApi.ticker('ETHUSDT_UMCBL').then(res => {
            //         bgEthPrice = res.data.last
            //     })
            // }
            // lockPrice.push({ '币安ETH当前价格': price, 'bgETH当前价格': bgEthPrice, '统计时间': DateFormat(Date.now()) })
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
                if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1.5 * 1000) {
                    if (symbolAction[`${symbol}`].action == 'S') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) < symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        sDt3 = Date.now();
                        pLog(`纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平空 | 币安价格:${price} | bg价格:${bgEthPrice} | K数据:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        ExKey.map(v => {
                            if (isClose[v.name] == 1) {
                                let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                SellClose(mixOrderApi, symbol, v.amount).then(res => {
                                    if (res.code == "00000") {
                                        console.log(v.name, '空单平空成功', v.isLoss)
                                        isClose[v.name] = -1
                                    } else {
                                        console.log(v.name, '空单平空失败', res)
                                    }

                                }).catch(err => {
                                    console.log(v.name, '空单平空失败', err)
                                })
                            }

                        })
                        return;
                    }
                    if (symbolAction[`${symbol}`].action == 'L') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) > symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        pLog(`定时爆破 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平多 | 币安价格:${price} | bg价格:${bgEthPrice} | K数据:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        ExKey.map(v => {
                            if (isClose[v.name] == 1) {
                                let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                BuyClose(mixOrderApi, symbol, v.amount).then(res => {
                                    if (res.code == "00000") {
                                        console.log(v.name, '多单平多成功', v.isLoss)
                                        isClose[v.name] = -1
                                    } else {
                                        console.log(v.name, '多单平多失败', res)
                                    }
                                }).catch(err => {
                                    console.log(v.name, '多单平多失败', err)
                                })
                            }
                        })
                        return;
                    }
                } else {
                    //止损&止盈
                    if (sDt3 == null || Date.now() - sDt3 > 0.3 * 1000) {
                        sDt3 = Date.now();
                        let btPrice2 = _N(btRate[`${symbol}`] * Number(price), 8);
                        let btPrice3 = _N(_btr2 * Number(price), 8);
                        ExKey.map(v => {
                            if (isClose[v.name] == 1) {
                                if (symbolAction[`${symbol}`].action == 'S') {
                                    if (Number(price) > symbolAction[`${symbol}`].price + btPrice3) {
                                        if (v.isLoss) {
                                            let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                            SellClose(mixOrderApi, symbol, v.amount).then(res => {
                                                if (res.code == "00000") {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平空 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                    console.log(v.name, '空单平空成功', v.isLoss)
                                                    isClose[v.name] = -1
                                                } else {
                                                    console.log(v.name, '止损|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(v.name, '止损|空单平空失败|2', err)
                                            })
                                        }
                                    } else if (Number(price) < symbolAction[`${symbol}`].price - btPrice2) {
                                        let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                        SellClose(mixOrderApi, symbol, v.amount).then(res => {
                                            if (res.code == "00000") {
                                                pLog(`${v.name} | 纯秒K | ${symbol} | 止盈 | 平空 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                console.log(v.name, '空单平空成功')
                                                isClose[v.name] = -1
                                            } else {
                                                console.log(v.name, '止盈|空单平空失败|1', res)
                                            }
                                        }).catch(err => {
                                            console.log(v.name, '止盈|空单平空失败|2', err)
                                        })
                                    }
                                }
                                if (symbolAction[`${symbol}`].action == 'L') {
                                    if (Number(price) < symbolAction[`${symbol}`].price - btPrice3) {
                                        if (v.isLoss) {
                                            let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                            BuyClose(mixOrderApi, symbol, v.amount).then(res => {
                                                if (res.code == "00000") {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平多 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                    console.log(v.name, '多单平多成功', v.isLoss)
                                                    isClose[v.name] = -1
                                                } else {
                                                    console.log(v.name, '止损|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(v.name, '止损|多单平多失败|2', err)
                                            })
                                        }
                                    } else if (Number(price) > symbolAction[`${symbol}`].price + btPrice2) {
                                        let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                        BuyClose(mixOrderApi, symbol, v.amount).then(res => {
                                            if (res.code == "00000") {
                                                pLog(`${v.name} | 纯秒K | ${symbol} | 止盈 | 平多 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                console.log(v.name, '多单平多成功')
                                                isClose[v.name] = -1
                                            } else {
                                                console.log(v.name, '止盈|多单平多失败|1', res)
                                            }
                                        }).catch(err => {
                                            console.log(v.name, '止盈|多单平多失败|2', err)
                                        })
                                    }
                                }
                            }
                        })
                    }
                }
                //开单
                let high = twoSymbolData[symbol].n['heigh'];
                let low = twoSymbolData[symbol].n['low']
                // let avgPrice = (high + low) / 2
                // let doL = price > avgPrice && twoSymbolData[symbol].n['open'] < twoSymbolData[symbol].n['close'];
                // let doS = price < avgPrice && twoSymbolData[symbol].n['open'] > twoSymbolData[symbol].n['close'];
                let doL = twoSymbolData[symbol].n['open'] < twoSymbolData[symbol].n['close'];
                let doS = twoSymbolData[symbol].n['open'] > twoSymbolData[symbol].n['close'];
                let diffPrice = high - low;
                let btPrice1 = _N(btRate[`${symbol}`] * Number(price), 8);
                //做多 or 做空 //发送开单信号 休息N分钟
                if (diffPrice > btPrice1) {
                    if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
                        let flag = doL == true ? 'L' : doS == true ? 'S' : ''
                        symbolAction[`${symbol}`] = { action: flag, price: Number(price) };
                        sDt3 = Date.now();
                        sDt4 = Date.now();
                        pLog(`纯秒K | ${symbol} | 开仓:${flag} | 币安价格:${price} | bg价格:${bgEthPrice} | ${interValTime}秒内 | 价格波动:${btRate[`${symbol}`]} | ${btPrice1}U | 休息${sDtTime}秒 | K数据:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        if (flag == 'L') {
                            ExKey.map(v => {
                                let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                BuyByQ(mixOrderApi, symbol, v.amount).then(res => {
                                    console.log(v.name, '多单开单成功')
                                    if (res.code == "00000") {
                                        isClose[v.name] = 1
                                    }
                                }).catch(err => {
                                    console.log(v.name, '多单开单失败', err)
                                })
                            })

                        }
                        if (flag == 'S') {
                            ExKey.map(v => {
                                let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase);
                                SellByQ(mixOrderApi, symbol, v.amount).then(res => {
                                    console.log(v.name, '空单开单成功')
                                    if (res.code == "00000") {
                                        isClose[v.name] = 1
                                    }
                                }).catch(err => {
                                    console.log(v.name, '空单开单失败', err)
                                })
                            })
                        }
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
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
        }
    });

})


app.get("/api/getKline", function (req, res) {
    let skline1 = _G('MkLine')
    skline1 = JSON.parse(skline1)
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let startTime = r.t1
        let endTime = r.t2
        let _sk = []
        skline1[`ETHUSDT`].history.map(v => {
            if (new Date(v.time).getTime() > new Date(startTime).getTime() && new Date(v.time).getTime() < new Date(endTime).getTime()) {
                _sk.push(v)
            }
        });
        data.kline = _sk
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
app.get("/api/getBgEthP", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        data['ethPrice'] = bgEthPrice;
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

app.get("/api/getLog", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        data['log'] = Log();
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

app.listen(port, () => {
    console.log(`本地服务监听:http://127.0.0.1:${port}`)
})