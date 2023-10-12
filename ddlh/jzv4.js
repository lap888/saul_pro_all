/* 接针策略 1秒上涨1%开空 1秒下跌1% 开多+ 微信提示
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-23 15:46:09 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-06-28 15:27:56
 */
const express = require('express')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

let AsyncLock = require('async-lock');
let lock = new AsyncLock();
//BN
const { Future, XhSpot, axios, TA, _G, _N, LogProfit, records_xh, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const process = require('process');
const dev = true
const port = '30019'
const apiKey = 'vvXRVrPKg20KgwVMpmHeUtojzyEtruUKyel2SqHIMejUBAmP5T2FxkQY1dcB2ezn'
const apiSecret = 'sAIEaprrhTXMtprVTGANjA35xJg1Wa1SeJIJmRvngbgY7WNWxFISm9mtPJZ8Oi0x'

let symbolDatas = []
let dt = {}
let symbolPrice = {}
let symbolAction = {}
let interValTime = 1;//清洗时间
let posNow = 0
let quantityPrecision = {}
let rPrice = {}
let errorCountL = {}
let errorCountS = {}
let symbolflag = {}

let minBdRate = 0.0042
let maxBdRate = 0.0082

let allCoinNotice = {}
let zfRate = {}
let hjRate = {}

// { 'rate': 1, 'doType': 1, 'action': 'N','amount':0 } rate=> 对应币种1s内波动百分比 1 指的是1%； doType=> 1 正向 2 反向； action=> N 多空都做 L 做多 S做空； amount=> 开单数量 单位u
let symbolSetting = {
    'BNBUSDT': { 'rate': 0.62, 'osc': 0, 'doType': 2, 'action': 'N', 'amount': 0, 'doAmount': 10, 'isSet': 0 },
    'KEYUSDT': { 'rate': 0.62, 'osc': 0, 'doType': 2, 'action': 'N', 'amount': 0, 'doAmount': 10, 'isSet': 0 },
}

symbolDatas = Object.keys(symbolSetting);

let doRecord = _G('doRecord')
if (doRecord == undefined || doRecord == null) {
    doRecord = {}
} else {
    doRecord = JSON.parse(doRecord)
}
let exInfo = []
let sDt = {}
let sDtTime = 160;//休息时间
let sDt2 = {}
let proxyIp = ''
let proxy = ''

if (dev) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })

process.on('uncaughtException', (error, source) => {
    console.log('未捕获异常=>', error, source)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}

function tjOrder(symbol, type) {
    let r1 = doRecord[`${symbol}_${type}`]
    if (r1 == null || r1 == undefined) {
        r1 = 1
    } else {
        r1 += 1
    }
    doRecord[`${symbol}_${type}`] = r1
    _G('doRecord', JSON.stringify(doRecord))
}

function getAmount(symbol, amount, price) {
    symbolSetting[`${symbol}`]['amount'] = _N(amount / price, quantityPrecision[symbol]);
    return amount;
}

function sendmsg(msg, fromid = '23342514255@chatroom') {
    axios.post(`http://49.233.134.249:30099/api/sendmsg`, {
        msg: msg,
        fromid: fromid
    }).then(r => {
        console.log(r)
    }).catch(e => {
        console.log(e)
    })
}
/**
 * 
 * @param {*} symbol 
 * @param {*} price 
 */
function calNotice(symbol) {
    let d1 = new Date()
    let caltime = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '7d']
    //提示1m,5m,15m,30m,1h,4h,1d,7d 高低点提示 已经当前实时价位处于黄金分割位置
    if (allCoinNotice[symbol] == undefined) {
        allCoinNotice[symbol] = {}
    }
    //
    caltime.map(t => {
        if (allCoinNotice[symbol][t] == undefined) {
            allCoinNotice[symbol][t] = {}
        }
        {
            if (allCoinNotice[symbol][t]['min'] == undefined || allCoinNotice[symbol][t]['min'] == 0) {
                allCoinNotice[symbol][t]['min'] = rPrice[symbol]
                let d2 = d1
                if (t == '1m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)
                }
                if (t == '5m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 5)
                }
                if (t == '15m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 15)
                }
                if (t == '30m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 30)
                }
                if (t == '1h') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours() + 1)
                }
                if (t == '4h') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours() + 4)
                }
                if (t == '1d') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 1)
                } if (t == '7d') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 7)
                }
                allCoinNotice[symbol][t]['time'] = d2.getTime()
                allCoinNotice[symbol][t]['rate'] = 0
                allCoinNotice[symbol][t]['flag'] = '-'
            }
            if (allCoinNotice[symbol][t]['max'] == undefined || allCoinNotice[symbol][t]['max'] == 0) {
                allCoinNotice[symbol][t]['max'] = rPrice[symbol]
            }
        }
        {
            if (rPrice[symbol] > allCoinNotice[symbol][t]['max']) {
                allCoinNotice[symbol][t]['max'] = rPrice[symbol]
            }
            if (rPrice[symbol] < allCoinNotice[symbol][t]['min']) {
                allCoinNotice[symbol][t]['min'] = rPrice[symbol]
            }
            let bprice = (allCoinNotice[symbol][t]['max'] + allCoinNotice[symbol][t]['min']) / 2
            if (rPrice[symbol] > bprice) {
                allCoinNotice[symbol][t]['flag'] = t + ' | 多头回调| 合适位置做多'
                allCoinNotice[symbol][t]['rate'] = (allCoinNotice[symbol][t]['max'] - rPrice[symbol]) / (allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min'])
            }
            if (rPrice[symbol] < bprice) {
                allCoinNotice[symbol][t]['flag'] = t + ' | 空头反弹 | 合适位置做空'
                allCoinNotice[symbol][t]['rate'] = (rPrice[symbol] - allCoinNotice[symbol][t]['min']) / (allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min'])
            }
            if (Date.now() > allCoinNotice[symbol][t]['time']) {
                allCoinNotice[symbol][t]['min'] = 0
                allCoinNotice[symbol][t]['max'] = 0
            }
        }
    })

}
//接针策略
client.exchangeInfo().then(ex => {
    exInfo = ex.data.symbols
    let isDoFlag = exInfo.length;
    let isDoNum = 0
    exInfo.forEach(e => {
        quantityPrecision[e.symbol] = e.quantityPrecision;
        isDoNum++
        let index = symbolDatas.findIndex(v => e.symbol == v)
        if (index == -1 && e.symbol.includes('USDT') && !e.symbol.includes('BUSD') && !e.symbol.includes('_') && !e.symbol.includes('1') && !e.symbol.includes('10') && !e.symbol.includes('100') && !e.symbol.includes('1000')) {
            symbolDatas.push(e.symbol)
            symbolSetting[`${e.symbol}`] = symbolSetting[symbolDatas[0]]
        }
        if (isDoFlag == isDoNum) {
            client.listenKeyPost().then(async response => {
                let listenKey = response.data.listenKey;
                setInterval(async () => {
                    client.listenKeyPut().then(res => {
                        console.log(`延长listenkey`)
                    })
                }, 10 * 60 * 1000);
                //更新一次
                console.log('=== osc 初始化 开始===')
                for (let i = 0; i < symbolDatas.length; i++) {
                    client.records(symbolDatas[i], '5m', 500).then(k => {
                        let atr = TA.ATR(k, 60)
                        let total = 0
                        atr.map(v => {
                            total += v
                        })
                        symbolSetting[`${symbolDatas[i]}`]['osc'] = _N(total / k.length, 6)
                    }).catch(err => {
                        console.log(symbolDatas[i], '5m', err)
                    })
                    await Sleep(350)
                }
                console.log('=== osc 初始化 完成===')
                // ['ethusdt@bookTicker','ethusdt@markPrice','ethusdt@ticker']
                let SymbolDataArrys = []
                symbolDatas.map(v => {
                    SymbolDataArrys.push(`${v.toLowerCase()}@bookTicker`)
                })
                //更新持仓信息
                let wsRef = client.userData(listenKey, {
                    open: () => {
                        pLog('策略启动完成...')
                        setInterval(() => {
                            wsRef.ws.send(JSON.stringify({ "ping": "1" }));
                        }, 10 * 60 * 1000);
                    },
                    close: () => pLog('closed'),
                    message: (msg) => {
                        let res = JSON.parse(msg)
                        //判断是否是心跳包返回的数据
                        if (res.e == 'ACCOUNT_UPDATE') {
                            if (res.a.P[0] != undefined) {
                                let eprice = Number(res.a.P[0]?.ep == undefined ? 0 : res.a.P[0].ep)
                                let esymbol = res.a.P[0]?.s
                                // console.log('ACCOUNT_UPDATE', esymbol, eprice, res.a.P[0])
                                // console.log(symbolAction[esymbol])
                                if (eprice > 0) {
                                    if (symbolAction[esymbol] == undefined) {
                                        symbolAction[esymbol] = {}
                                    }
                                    symbolAction[esymbol]['price'] = eprice
                                    console.log('ACCOUNT_UPDATE', esymbol, eprice)
                                }
                            }
                        }
                    }
                });
                client.combinedStreams(SymbolDataArrys, {
                    open: () => {
                        console.log('策略启动...')
                    },
                    close: () => console.log('策略关闭...'),
                    message: (msg) => {
                        msg = JSON.parse(msg.toString());
                        let symbol = msg.data.s;
                        let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
                        rPrice[symbol] = price = Number(price)
                        // calNotice(symbol)
                        //时间处理
                        let d1 = new Date()
                        let d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)
                        let d3 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes(), d1.getSeconds() + 1)
                        {
                            if (symbolPrice[`${symbol}_min`] == 0 || symbolPrice[`${symbol}_min`] == undefined) {
                                symbolPrice[`${symbol}_min`] = rPrice[symbol]
                            }
                            if (symbolPrice[`${symbol}_max`] == 0 || symbolPrice[`${symbol}_max`] == undefined) {
                                symbolPrice[`${symbol}_max`] = rPrice[symbol]
                            }
                            if (rPrice[symbol] > symbolPrice[`${symbol}_max`]) {
                                symbolPrice[`${symbol}_max`] = rPrice[symbol]
                            }
                            if (rPrice[symbol] < symbolPrice[`${symbol}_min`]) {
                                symbolPrice[`${symbol}_min`] = rPrice[symbol]
                            }
                        }
                        // 监控平仓
                        if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1 * 20 && Date.now() > symbolAction[`${symbol}`].cancloseTime) {
                            if (symbolAction[`${symbol}`].action == 'S' && errorCountS[symbol] <= 5) {
                                if (rPrice[symbol] < symbolAction[`${symbol}`].price && Date.now() > symbolAction[`${symbol}`].openTime) {
                                    // symbolAction[`${symbol}`].openTime = symbolAction[`${symbol}`].openTime + 1000 * 60
                                    if (rPrice[symbol] < symbolAction[`${symbol}`].price * (1 - 0.01 * 0.08)) {
                                        let amount = symbolSetting[`${symbol}`]['amount']
                                        sDt2[`${symbol}`] = -1;
                                        symbolPrice[`${symbol}_min`] = 0
                                        symbolPrice[`${symbol}_max`] = 0
                                        pLog(`${symbol}=>分钟线收k | 平空 | 平仓价格:${rPrice[symbol]},开仓价格:${symbolAction[`${symbol}`].price} | posNow:${posNow}`)
                                        sell_close(client, symbol, amount).then(r => {
                                            symbolflag[symbol] = ''
                                            symbolSetting[`${symbol}`]['canOrderTime'] = 0
                                            tjOrder(symbol, 1)
                                            posNow--
                                        }).catch(e => {
                                            sDt2[`${symbol}`] = 1;
                                            sDt[`${symbol}`] = Date.now()
                                            errorCountS[symbol] = errorCountS[symbol] + 1
                                        })
                                        return
                                    }
                                }
                                if (rPrice[symbol] < symbolAction[`${symbol}`].price - symbolSetting[`${symbol}`]['osc'] * 1.3) {
                                    // if (rPrice[symbol] < symbolAction[`${symbol}`].price * (1 - 0.01 * 6 * 0.08)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止盈|平空|平仓价格:${rPrice[symbol]},开仓价格:${symbolAction[`${symbol}`].price} | posNow:${posNow}`)
                                    sell_close(client, symbol, amount).then(r => {
                                        symbolflag[symbol] = ''
                                        symbolSetting[`${symbol}`]['canOrderTime'] = 0
                                        tjOrder(symbol, 1)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountS[symbol] = errorCountS[symbol] + 1
                                    })
                                    return
                                }
                                if (rPrice[symbol] > symbolAction[`${symbol}`].price + symbolSetting[`${symbol}`]['osc']) {
                                    // if (rPrice[symbol] > symbolAction[`${symbol}`].price * (1 + 0.01 * 4 * 0.08)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止损|平空|平仓价格:${rPrice[symbol]},开仓价格:${symbolAction[`${symbol}`].price} | posNow:${posNow}`)
                                    sell_close(client, symbol, amount).then(r => {
                                        symbolflag[symbol] = ''
                                        symbolSetting[`${symbol}`]['canOrderTime'] = 0
                                        tjOrder(symbol, 2)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountS[symbol] = errorCountS[symbol] + 1
                                    })
                                    return
                                }
                            }
                            if (symbolAction[`${symbol}`].action == 'L' && errorCountL[symbol] <= 5) {
                                if (rPrice[symbol] > symbolAction[`${symbol}`].price && Date.now() > symbolAction[`${symbol}`].openTime) {
                                    // symbolAction[`${symbol}`].openTime = symbolAction[`${symbol}`].openTime + 1000 * 60
                                    if (rPrice[symbol] > symbolAction[`${symbol}`].price * (1 + 0.01 * 0.08)) {
                                        let amount = symbolSetting[`${symbol}`]['amount']
                                        sDt2[`${symbol}`] = -1;
                                        symbolPrice[`${symbol}_min`] = 0
                                        symbolPrice[`${symbol}_max`] = 0
                                        pLog(`${symbol}=>分钟线收k|平多|平仓价格:${rPrice[symbol]},开仓价格:${symbolAction[`${symbol}`].price} | posNow:${posNow}`)
                                        buy_close(client, symbol, amount).then(r => {
                                            symbolflag[symbol] = ''
                                            symbolSetting[`${symbol}`]['canOrderTime'] = 0
                                            tjOrder(symbol, 1)
                                            posNow--
                                        }).catch(e => {
                                            sDt2[`${symbol}`] = 1;
                                            sDt[`${symbol}`] = Date.now()
                                            errorCountL[symbol] = errorCountL[symbol] + 1
                                        })
                                        return
                                    }
                                }
                                if (rPrice[symbol] > symbolAction[`${symbol}`].price + symbolSetting[`${symbol}`]['osc'] * 1.3) {
                                    // if (rPrice[symbol] > symbolAction[`${symbol}`].price * (1 + 0.01 * 6 * 0.08)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止盈|平多|平仓价格:${rPrice[symbol]},开仓价格:${symbolAction[`${symbol}`].price} | posNow:${posNow}`)
                                    buy_close(client, symbol, amount).then(r => {
                                        symbolflag[symbol] = ''
                                        symbolSetting[`${symbol}`]['canOrderTime'] = 0
                                        tjOrder(symbol, 1)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountL[symbol] = errorCountL[symbol] + 1
                                    })
                                    return
                                }
                                if (rPrice[symbol] < symbolAction[`${symbol}`].price - symbolSetting[`${symbol}`]['osc']) {
                                    // if (rPrice[symbol] < symbolAction[`${symbol}`].price * (1 - 0.01 * 4 * 0.08)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止损|平多|平仓价格:${rPrice[symbol]},开仓价格:${symbolAction[`${symbol}`].price} | posNow:${posNow}`)
                                    buy_close(client, symbol, amount).then(r => {
                                        symbolflag[symbol] = ''
                                        symbolSetting[`${symbol}`]['canOrderTime'] = 0
                                        tjOrder(symbol, 2)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountL[symbol] = errorCountL[symbol] + 1
                                    })
                                    return
                                }
                            }
                        }
                        // 监控开仓
                        if (dt[`${symbol}`] == undefined || Date.now() - dt[`${symbol}`] >= 0) {
                            symbolSetting[`${symbol}`]['openPrice'] = price
                            dt[`${symbol}`] = d3.getTime()
                            let d5 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)
                            if (symbolSetting[`${symbol}`]['canOrderTime'] == undefined || symbolSetting[`${symbol}`]['canOrderTime'] == 0) {
                                symbolSetting[`${symbol}`]['canOrderTime'] = d5.getTime()
                            }
                            //清洗
                            if (sDt2[`${symbol}`] == -1 || sDt2[`${symbol}`] == undefined) {
                                symbolPrice[`${symbol}_min`] = 0
                                symbolPrice[`${symbol}_max`] = 0
                            }
                        } else {
                            let btPrice1 = symbolSetting[`${symbol}`]['osc']
                            let btprice2 = maxBdRate * rPrice[symbol]
                            let btPrice = Math.min(btPrice1, btprice2)
                            symbolSetting[`${symbol}`]['osc'] = btPrice
                            if ((symbolPrice[`${symbol}_max`] - symbolPrice[`${symbol}_min`] > btPrice && btPrice > minBdRate * rPrice[symbol]) || (symbolflag[symbol] != '' && symbolflag[symbol] != undefined)) {
                                let mPrice = (symbolPrice[`${symbol}_max`] + symbolPrice[`${symbol}_min`]) / 2;
                                if (symbolSetting[`${symbol}`]['doType'] == 1) {
                                    if (rPrice[symbol] > mPrice) {
                                        symbolflag[symbol] = "L"
                                    }
                                    if (rPrice[symbol] < mPrice) {
                                        symbolflag[symbol] = "S"
                                    }
                                }
                                if (symbolSetting[`${symbol}`]['doType'] == 2) {
                                    if (rPrice[symbol] > mPrice) {
                                        symbolflag[symbol] = "S"
                                    }
                                    if (rPrice[symbol] < mPrice) {
                                        symbolflag[symbol] = "L"
                                    }
                                }
                                //发送开单信号 休息N分钟
                                if ((symbolSetting[`${symbol}`]['action'] == symbolflag[symbol] || symbolSetting[`${symbol}`]['action'] == 'N')) {
                                    if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                                        getAmount(symbol, symbolSetting[`${symbol}`]['doAmount'], rPrice[symbol]);
                                        if (symbolSetting[`${symbol}`]['amount'] > 0 && symbolSetting[`${symbol}`]['osc'] > 0) {
                                            let amount = symbolSetting[`${symbol}`]['amount']
                                            lock.acquire('lock-m-order', function () {
                                                // && Date.now() >= symbolSetting[`${symbol}`]['canOrderTime']&& rPrice[symbol] > symbolPrice[`${symbol}_min`] * (1 + 0.0001)
                                                if (symbolflag[symbol] == 'L' && Date.now() >= symbolSetting[`${symbol}`]['canOrderTime'] && posNow <= 1) {
                                                    pLog(`${posNow} | ${symbol}=>开仓${symbolflag[symbol]} | 价格${rPrice[symbol]} | 数量${symbolSetting[`${symbol}`]['amount']} | ${interValTime}秒内,价格波动:${symbolSetting[`${symbol}`]['osc'] * 100 / price}% | ${btPrice}U | doType:${symbolSetting[`${symbol}`]['doType']} | doAction:${symbolSetting[`${symbol}`]['action']} 休息${sDtTime}秒`)
                                                    posNow++
                                                    sDt[`${symbol}`] = Date.now()//开仓
                                                    sDt2[`${symbol}`] = Date.now()//平仓
                                                    symbolAction[`${symbol}`] = { action: symbolflag[symbol], price: rPrice[symbol], cancloseTime: d3.getTime(), openTime: d2.getTime() };
                                                    errorCountL[symbol] = 0
                                                    buy(client, symbol, amount).catch(e => {
                                                        posNow--
                                                        symbolflag[symbol] = ''
                                                        sDt2[`${symbol}`] = 1;
                                                    })
                                                    symbolPrice[`${symbol}_min`] = 0
                                                    symbolPrice[`${symbol}_max`] = 0
                                                    console.log('symbolAction[`${symbol}`]', symbolAction[`${symbol}`])
                                                }
                                                // && Date.now() >= symbolSetting[`${symbol}`]['canOrderTime']&& rPrice[symbol] < symbolPrice[`${symbol}_max`] * (1 - 0.0001)
                                                if (symbolflag[symbol] == 'S' && Date.now() >= symbolSetting[`${symbol}`]['canOrderTime'] && posNow <= 1) {
                                                    pLog(`${posNow} | ${symbol}=>开仓${symbolflag[symbol]} | 价格${rPrice[symbol]} | 数量${symbolSetting[`${symbol}`]['amount']} | ${interValTime}秒内,价格波动:${symbolSetting[`${symbol}`]['osc'] * 100 / price}% | ${btPrice}U | doType:${symbolSetting[`${symbol}`]['doType']} | doAction:${symbolSetting[`${symbol}`]['action']} 休息${sDtTime}秒`)
                                                    posNow++
                                                    sDt[`${symbol}`] = Date.now()//开仓
                                                    sDt2[`${symbol}`] = Date.now()//平仓
                                                    symbolAction[`${symbol}`] = { action: symbolflag[symbol], price: rPrice[symbol], cancloseTime: d3.getTime(), openTime: d2.getTime() };
                                                    errorCountS[symbol] = 0
                                                    sell(client, symbol, amount).catch(e => {
                                                        posNow--
                                                        symbolflag[symbol] = ''
                                                        sDt2[`${symbol}`] = 1;
                                                    })
                                                    symbolPrice[`${symbol}_min`] = 0
                                                    symbolPrice[`${symbol}_max`] = 0
                                                    console.log('symbolAction[`${symbol}`]', symbolAction[`${symbol}`])
                                                }
                                            }).catch(function (err) {
                                                console.log(err.message) // output: error
                                            });

                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            })
        }
    });
});

app.get('/api/allCoinNotice', (req, res) => {
    let r = req.query;
    let data = { code: 200, message: 'ok' }
    data.list = allCoinNotice
    res.json(data)
})

app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})