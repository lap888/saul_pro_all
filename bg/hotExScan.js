/* 策略说明 
   hotcoin HotCoinEx高频 扫码
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-02-27 14:59:15
 */
const express = require('express')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Future, XhSpot, TA, _G, _N, LogProfit, Log, DateFormat, Sleep } = require('binance-futures-connector')
const process = require('process');
const port = '30015'
let mk = {};


let data = require('./constant')
let ExKey = data.ExKey
ExKey.sort((m, n) => m['id'] - n['id'])


const { subscribe } = require('./hotWs')
const { BuyByQ, BuyClose, SellByQ, SellClose, Assets } = require('./hotOrderScan')


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
const WSS_HOST = 'wss-ct.hotcoin.fit'
const WSS_URL = 'wss://' + WSS_HOST
let openPos = {}
let symbolDatas = []
let symbolAction = {}
let interValTime = 0.9;//清洗时间

let sDt = {}
let sDtTime = 180;
let sDt2 = {}
let sDt3 = {}


let isClose = {}

let btRate = { 'ETHUSDT': 2.95, 'BTCUSDT': 30 }

symbolDatas = Object.keys(btRate)

//处理bg数据
let bgP = {}
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
let wsRef = subscribe(WSS_URL, {
    open: () => {
        console.log('策略启动...')
        symbolDatas.map(v => {
            wsRef.ws.send(`{"event":"subscribe","params":{"biz":"perpetual","type":"candles","contractCode": "${v}","granularity": "5min","zip":false,"serialize":false}}`)
        })
    },
    close: () => console.log('策略关闭...'),
    message: (msg) => {
        msg = JSON.parse(msg)
        try {
            if (!msg.data.result) {
                let symbol = msg.contractCode.toUpperCase()
                bgP[symbol] = Number(msg.data[0][4])
            }
        } catch (error) {
            console.log(`${JSON.stringify(msg)}`)
        }
    }
});
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://stream.binance.com:9443' })

sclient.createListenKey().then(response => {
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient.renewListenKey(listenKey).then(res => {
            console.log(`延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);
    setInterval(() => {
        //刷新资产
        ExKey.map(v => {
            Assets(v.name, v.rToken)
        })

    }, 5 * 60 * 1000);
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
            if (mk[symbol] == undefined || Date.now() - mk[symbol] > 120 * 1000) {
                mk[symbol] = Date.now()
                console.log('接收到推流|监听数据打印', symbol, 'BN', price, 'HOT', bgP[symbol], btRate[symbol])
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
                let d = new Date()
                let ms = d.getMilliseconds()
                let ms1 = d.getSeconds()
                //平仓 收盘平
                if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1.5 * 1000 && ms1 > 58 && ms > 900) {
                    if (symbolAction[`${symbol}`].action == 'S') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) < symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        sDt3[symbol] = Date.now();
                        pLog(`定时清仓 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平空 | 币安价格:${price} Hot价格:${bgP[symbol]}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                SellClose(symbol, amount, v.rToken).then(res => {
                                    if (res != '' && res.code == 200) {
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
                        pLog(`定时清仓 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平多 | 币安价格:${price} Hot价格:${bgP[symbol]}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                BuyClose(symbol, amount, v.rToken).then(res => {
                                    if (res != '' && res.code == 200) {
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
                    if (sDt3[symbol] == null || Date.now() - sDt3[symbol] > 0.1 * 1000) {
                        sDt3[symbol] = Date.now();
                        let btPrice2 = btRate[`${symbol}`]
                        let oneP = btPrice2 / 10;
                        let btPrice3 = oneP * 3.1;
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                if (symbolAction[`${symbol}`].action == 'S') {
                                    if (Number(price) > symbolAction[`${symbol}`].price + btPrice3) {
                                        if (Date.now() - sDt[`${symbol}`] > 0.5 * 1000) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平空 | 币安价格:${price} hot价格:${bgP[symbol]}  | 持仓均价:${symbolAction[`${symbol}`].price}`)
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
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第七段止盈 | 平空 | 币安价格:${price} hot价格:${bgP[symbol]} | 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 11 && Number(price) > symbolAction[`${symbol}`].price - oneP * 10) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第六段止盈 | 平空 | 币安价格:${price} hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 10 && Number(price) > symbolAction[`${symbol}`].price - oneP * 9) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第五段止盈 | 平空 | 币安价格:${price} hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 8 && Number(price) > symbolAction[`${symbol}`].price - oneP * 7) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第四段止盈 | 平空 | 币安价格:${price} hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 6 && Number(price) > symbolAction[`${symbol}`].price - oneP * 5) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第三段止盈 | 平空 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].min < symbolAction[`${symbol}`].price - oneP * 4.5 && Number(price) > symbolAction[`${symbol}`].price - oneP * 3.5) {
                                            sDt2[`${symbol}`] = -1;
                                            SellClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第二段止盈 | 平空 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
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
                                        if (Date.now() - sDt[`${symbol}`] > 0.5 * 1000) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
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
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第七段止盈 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 11 && Number(price) < symbolAction[`${symbol}`].price + oneP * 10) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第六段止盈 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 10 && Number(price) < symbolAction[`${symbol}`].price + oneP * 9) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第五段止盈 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 8 && Number(price) < symbolAction[`${symbol}`].price + oneP * 7) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第四段止盈 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 6 && Number(price) < symbolAction[`${symbol}`].price + oneP * 5) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第三段止盈 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
                                                    isClose[`${v.name}_${symbol}`] = -1
                                                } else {
                                                    console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                                }
                                            }).catch(err => {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                            })
                                        } else if (threeSymbolData[symbol].max > symbolAction[`${symbol}`].price + oneP * 4 && Number(price) < symbolAction[`${symbol}`].price + oneP * 3.5) {
                                            sDt2[`${symbol}`] = -1;
                                            BuyClose(symbol, amount, v.rToken).then(res => {
                                                if (res != '' && res.code == 200) {
                                                    pLog(`${v.name} | 纯秒K | ${symbol} | 第二段止盈 | 平多 | 币安价格:${price}  hot价格:${bgP[symbol]}| 持仓均价:${symbolAction[`${symbol}`].price}`)
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
                        symbolAction[`${symbol}`] = { symbol: symbol, action: flag, price: Number(price), hotPrice: bgP[symbol], time: new Date().getTime(), flag: -1, rToken: '', btSession: '', btNewSession: '' };
                        sDt3[symbol] = Date.now();
                        pLog(`纯秒K | ${symbol} | 开仓:${flag} | 币安价格:${price} HOT价格:${bgP[symbol]} | 当时均价:${symbolAction[`${symbol}`].price} | ${interValTime} | ${btPrice1} | ${sDtTime}秒`)
                        if (flag == 'L') {
                            threeSymbolData[symbol].min = -1
                            threeSymbolData[symbol].max = -1
                            ExKey.map(v => {
                                let amount = v[symbol]
                                if (openPos[v.name] < 1 && amount != undefined) {
                                    BuyByQ(symbol, amount, v.rToken).then(res => {
                                        if (res != '' && res.code == 200) {
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
                                    SellByQ(symbol, amount, v.rToken).then(res => {
                                        if (res != '' && res.code == 200) {
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
