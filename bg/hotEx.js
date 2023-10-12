/* 策略说明 
   hotcoin HotCoinEx高频
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-02-20 15:39:19
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
let mk = {};
let orderList = []
let isFinishOrder = {}

let data = require('./constant')
let ExKey = data.ExKey
ExKey.sort((m, n) => m['id'] - n['id'])

const { SubscribeReq, BitgetWsClient } = require('bitget-openapi-top');
const bitgetApi = require('bitget-openapi-top');
const HttpsProxyAgent = require('https-proxy-agent');
const bgapiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
const passphrase = 'toptoptop';


const { Buy, BuyClose, Sell, SellClose, Pos } = require('./hotOrder')

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
const apiKey = 'F9Y0my3rqbO6wj6zb6NMWOVM0fFRwcrBXVQp2xaIigoffvxMChPK534kMwDesEfo'
const apiSecret = 'TWkfAjk8bAuCa7VgxBqy08USDh1E97HQjq7xK6MERrN3nZWRYtrAK0cxPKIQVIOo'
let bitgetHyBaseUrl = 'wss://ws.bitget.com/mix/v1/stream'
let openPos = {}
let symbolDatas = []
let symbolAction = {}
let interValTime = 0.9;//清洗时间
let _btr = 0.0017;//波动率

let sDt = {}
let sDtTime = 180;
let sDt2 = {}
let sDt3 = {}
let sDt4 = null

let isClose = {}

let btRate = { 'ETHUSDT': 2.6, 'BTCUSDT': 35, 'LTCUSDT': 0.3, 'XRPUSDT': 0.0014 }

symbolDatas = Object.keys(btRate)


//处理bg数据
let ek0 = ExKey[0];

let bgP = {}
let timer = null;
let bitgetWsClient = null;
// connectBgWs()

function connectBgWs() {
    bitgetWsClient = new BitgetWsClient({
        reveice: (message) => {
            if (message.startsWith('{')) {
                message = JSON.parse(message)
                if (message.action != undefined) {
                    bgP[message.data[0].instId] = Number(message.data[0].last)
                }
            }
        },
    }, bgapiKey, secretKey, passphrase, bitgetHyBaseUrl);

    let subArr = new Array();

    symbolDatas.map(v => {
        let s = new SubscribeReq('mc', 'ticker', v);
        subArr.push(s);
    })

    bitgetWsClient.subscribe(subArr);
    bitgetWsClient.on('open', () => {
        console.log('1.open==')
        timer = setInterval(() => {
            bitgetWsClient.send("ping")
            console.log('bg价格打印:', Object.entries(bgP)[0])
        }, 20 * 1000);
    })
    bitgetWsClient.on('close', () => {
        console.error('close==', '断线重连')
        if (timer) {
            clearInterval(timer)
        }
        connectBgWs()
    })
}

//处理bg数据完毕

//初始化维护二分化数据
// let twoSymbolData = { ETHUSDT: { n: { open: 1, close: 2, high: 2.5, low: 1, time: null }, o: {}, t: null } };

let twoSymbolData = {};
let threeSymbolData = {};
let kLine = _G('MkLine')
if (kLine != null && kLine.startsWith('{')) {
    kLine = JSON.parse(kLine)
} else {
    kLine = null;
}
symbolDatas.map(v => {
    let h = null;
    if (kLine != null) {
        h = kLine[v].history
    }
    twoSymbolData[v] = { n: null, o: null, history: h, min: null, max: null, t: null }
    threeSymbolData[v] = { min: null, max: null }
})


function pLog(msg) {
    Log(msg)
    console.log(msg)
}

const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://stream.binance.com:9443' })

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
            setInterval(() => {
                let d = new Date()
                let ms = d.getMilliseconds()
                //清洗数据
                if (ms < 1 || ms >= 999) {
                    symbolDatas.map(v => {
                        twoSymbolData[v].n = null
                        twoSymbolData[v].t = null
                    })
                    let name = ExKey[0].name;
                    if (openPos[name] > 0) {
                        console.log('当前持仓打印', 'name=', name, 'openPos=', openPos)
                    }
                }
            }, 1);
        },
        close: () => console.log('策略关闭...'),
        message: (msg) => {
            msg = JSON.parse(msg.toString());
            let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
            let symbol = msg.data.s;
            price = Number(price)
            ExKey.map(e => {
                openPos[e.name] = 0;
                symbolDatas.map(v => {
                    if (isClose[`${e.name}_${v}`] == 1) {
                        openPos[e.name] = openPos[e.name] + 1
                    }
                })
            })
            if (mk[symbol] == undefined) {
                mk[symbol] = Date.now()
                console.log('接收到推流|监听数据打印', symbol, 'BN', price, btRate[symbol])
            }
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

                    twoSymbolData[symbol].n['bgopen'] = bgP[symbol];
                    twoSymbolData[symbol].n['bgclose'] = bgP[symbol];
                    twoSymbolData[symbol].n['bgheigh'] = bgP[symbol];
                    twoSymbolData[symbol].n['bglow'] = bgP[symbol];
                } else {
                    twoSymbolData[symbol].n['close'] = price;
                    twoSymbolData[symbol].n['bgclose'] = bgP[symbol];
                    if (price > twoSymbolData[symbol].n['heigh']) {
                        twoSymbolData[symbol].n['heigh'] = price;
                    }
                    if (price < twoSymbolData[symbol].n['low']) {
                        twoSymbolData[symbol].n['low'] = price;
                    }

                    if (bgP[symbol] > twoSymbolData[symbol].n['bgheigh']) {
                        twoSymbolData[symbol].n['bgheigh'] = bgP[symbol];
                    }
                    if (bgP[symbol] < twoSymbolData[symbol].n['bglow']) {
                        twoSymbolData[symbol].n['bglow'] = bgP[symbol];
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
                //统计开仓后的最高价最低价
                {
                    if (threeSymbolData[symbol].min == null || threeSymbolData[symbol].min == -1) {
                        threeSymbolData[symbol].min = Number(price)
                    }
                    if (threeSymbolData[symbol].max == null || threeSymbolData[symbol].max == -1) {
                        threeSymbolData[symbol].max = Number(price)
                    }
                    if (Number(price) > threeSymbolData[symbol].max) {
                        threeSymbolData[symbol].max = Number(price)
                    }
                    if (Number(price) < threeSymbolData[symbol].min) {
                        threeSymbolData[symbol].min = Number(price)
                    }
                }
                //重新查询持仓赋值
                // if (sDt2[`${symbol}`] == -1 || sDt2[`${symbol}`] == undefined) {
                //     if (Date.now() - sDt4 > 10 * 1000 || sDt4 == null) {
                //         sDt4 = Date.now();
                //         symbolDatas.map(v => {
                //             Pos(ek0.apiKey, ek0.secretKey, v.toLowerCase()).then(res => {
                //                 let lPos = res.find(v => v.side == 'long')
                //                 let sPos = res.find(v => v.side == 'short')
                //                 console.log(v, '持仓检查', 'lPos=', lPos.price, lPos.amount,'sPos=', sPos.price, sPos.amount,)
                //             })
                //         })
                //     }
                // }
                let d = new Date()
                let ms = d.getMilliseconds()
                //平仓 收盘平
                if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 45 * 1000 && ms > 950) {
                    if (symbolAction[`${symbol}`].action == 'S') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) < symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        sDt3[symbol] = Date.now();
                        pLog(`定时清仓 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平空 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                    if (res != '') {
                                        console.log(`${v.name}_${symbol}`, '空单平空成功')
                                        isClose[`${v.name}_${symbol}`] = -1
                                    } else {
                                        console.log(`${v.name}_${symbol}`, '空单平空失败', res)
                                    }
                                }).catch(err => {
                                    console.log(`${v.name}_${symbol}`, '空单平空失败', err)
                                })
                            }
                        })
                        return;
                    }
                    if (symbolAction[`${symbol}`].action == 'L') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) > symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        pLog(`定时清仓 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                    if (res != '') {
                                        console.log(`${v.name}_${symbol}`, '多单平多成功')
                                        isClose[`${v.name}_${symbol}`] = -1
                                    } else {
                                        console.log(`${v.name}_${symbol}`, '多单平多失败', res)
                                    }
                                }).catch(err => {
                                    console.log(`${v.name}_${symbol}`, '多单平多失败', err)
                                })
                            }
                        })
                        return;
                    }
                } else {
                    //止损&止盈
                    if (sDt3[symbol] == null || Date.now() - sDt3[symbol] > 0.5 * 1000) {
                        sDt3[symbol] = Date.now();
                        let btPrice2 = btRate[`${symbol}`]
                        let oneP = btPrice2 / 10;
                        let btPrice3 = oneP * 2.8;
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                if (symbolAction[`${symbol}`].action == 'S') {
                                    if (Number(price) > symbolAction[`${symbol}`].price + btPrice3) {
                                        if (Date.now() - sDt[`${symbol}`] > 1.4 * 1000) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平空 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止损|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止损|空单平空失败|2', err)
                                            })
                                        }

                                    } else if (threeSymbolData[symbol].min != null && threeSymbolData[symbol].min != -1) {
                                        //分段止盈
                                        if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 12) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第七段止盈 | 平空 | 币安价格:${price} | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 11) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第六段止盈 | 平空 | 币安价格:${price} | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 10 && Number(price) > symbolAction[`${symbol}`].price - oneP * 9.7) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第五段止盈 | 平空 | 币安价格:${price} | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 8 && Number(price) > symbolAction[`${symbol}`].price - oneP * 7.7) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第四段止盈 | 平空 | 币安价格:${price} | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 6 && Number(price) > symbolAction[`${symbol}`].price - oneP * 5.7) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第三段止盈 | 平空 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 5 && Number(price) > symbolAction[`${symbol}`].price - oneP * 4.5) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第二段止盈 | 平空 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        }
                                    }
                                }
                                if (symbolAction[`${symbol}`].action == 'L') {
                                    if (Number(price) < symbolAction[`${symbol}`].price - btPrice3) {
                                        if (Date.now() - sDt[`${symbol}`] > 1.4 * 1000) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止损|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止损|多单平多失败|2', err)
                                            })
                                        }

                                    } else if (threeSymbolData[symbol].max != null && threeSymbolData[symbol].max != -1) {
                                        if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 12) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第七段止盈 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 11) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第六段止盈 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 10 && Number(price) < symbolAction[`${symbol}`].price + oneP * 9.7) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第五段止盈 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 8 && Number(price) < symbolAction[`${symbol}`].price + oneP * 7.7) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第四段止盈 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 6 && Number(price) < symbolAction[`${symbol}`].price + oneP * 5.7) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第三段止盈 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 5 && Number(price) < symbolAction[`${symbol}`].price + oneP * 4.5) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                                if (res != '') {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第二段止盈 | 平多 | 币安价格:${price}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
                //开单
                let high = twoSymbolData[symbol].n['heigh'];
                let low = twoSymbolData[symbol].n['low']
                let doL = twoSymbolData[symbol].n['open'] < twoSymbolData[symbol].n['close'];
                let doS = twoSymbolData[symbol].n['open'] > twoSymbolData[symbol].n['close'];
                let diffPrice = high - low;
                let btPrice1 = btRate[`${symbol}`];
                //做多 or 做空 //发送开单信号 休息N分钟
                if (diffPrice > btPrice1 && ms <= interValTime * 1000 + 10) {
                    if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
                        let flag = doL == true ? 'L' : doS == true ? 'S' : ''
                        symbolAction[`${symbol}`] = { symbol: symbol, action: flag, price: Number(price), time: new Date().getTime(), flag: -1, rToken: '', btSession: '', btNewSession: '' };
                        sDt3[symbol] = Date.now();
                        pLog(`纯秒K | ${symbol} | 开仓:${flag} | 币安价格:${price}  | ${interValTime} | ${btRate[`${symbol}`]} | ${btPrice1} | ${sDtTime}秒 | K:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        sDt4 = Date.now();
                        if (flag == 'L') {
                            threeSymbolData[symbol].min = -1
                            threeSymbolData[symbol].max = -1
                            ExKey.map(v => {
                                let amount = v[symbol]
                                if (openPos[v.name] < 1 && amount != undefined) {
                                    Buy(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                        if (res != '') {
                                            sDt3[symbol] = Date.now();
                                            console.log(`${v.name}_${symbol}`, '多单开单成功')
                                            isClose[`${v.name}_${symbol}`] = 1
                                        } else {
                                            console.log(`${v.name}_${symbol}`, '多单开单失败', res)
                                        }

                                    }).catch(err => {
                                        console.log(`${v.name}_${symbol}`, '多单开单失败', err)
                                    })
                                } else {
                                    console.log(`${v.name}`, '当前持仓', openPos[v.name], '单', symbol, '多单暂不开单')
                                }
                            })
                            threeSymbolData[symbol].min = -1
                            threeSymbolData[symbol].max = -1
                        }
                        if (flag == 'S') {
                            threeSymbolData[symbol].min = -1
                            threeSymbolData[symbol].max = -1
                            ExKey.map(v => {
                                let amount = v[symbol]
                                if (openPos[v.name] < 1 && amount != undefined) {
                                    Sell(v.apiKey, v.secretKey, symbol, amount).then(res => {
                                        if (res != '') {
                                            sDt3[symbol] = Date.now();
                                            console.log(`${v.name}_${symbol}`, '空单开单成功')
                                            isClose[`${v.name}_${symbol}`] = 1
                                        } else {
                                            console.log(`${v.name}_${symbol}`, '空单开单失败', res)
                                        }
                                    }).catch(err => {
                                        console.log(`${v.name}_${symbol}`, '多单开单失败', err)
                                    })
                                } else {
                                    console.log(`${v.name}`, '当前持仓', openPos[v.name], '单', symbol, '空单暂不开单')
                                }
                            })
                            threeSymbolData[symbol].min = -1
                            threeSymbolData[symbol].max = -1
                        }
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
                    }
                }
            } else {
                //超过K周期清洗数据
                twoSymbolData[symbol].o = twoSymbolData[symbol].n
                twoSymbolData[symbol].n = null
                twoSymbolData[symbol].t = null
            }
        }
    });
})
