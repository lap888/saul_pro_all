/* 登顶量化 志在巅峰 漫步人生路 v5 + 盈利网格 + 多币种最多16个 4个一波运行
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-05 20:31:31 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-05-07 09:52:07
 */

const prod = true;

const process = require('process');
const express = require('express')
const { doDb } = require('./dbMysql')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Future, XhSpot, records_xh, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')


const apiKey = 'PIXrnMDXGnFCT8mTIZBS8bjIH9cjHGs69ckSsvG80sE2i2DB4LCo0Mptun5D4LfQ'
const apiSecret = 'Y02Uwno1xPaXBuHfiNv84oSP35I4CmAiMVHdU1uIyPaGD6gvHjcXxJzzFjcPcQzc'
const myUid = 1007


let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const port = '30021'

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
let pos = []//[{"s":"ETHUSDT","pa":"-1.613","ep":"1860.58286","cr":"-499.34214144","up":"-30.40528948","mt":"cross","iw":"0","ps":"SHORT","ma":"USDT"}]
let symbolDatas = []
let symbolHyPrice = {}
let kTimeDate = {}
let DbDate = null
let UpdatePosDate = null
let OpenOrderDate0 = {}
let OpenOrderDate1 = {}

let OpenForderDate = {}
let DodoDate = {}
let DodoDate1 = {}
let LogShowDate = null
let logShow = {}
let ma90s = {}
let ma90m = {}
let ma90s1 = {}
let ma90m1 = {}
//价格高低点
let lPriceMax = {}
let lPriceMin = {}
let lIncomeMax = {}


let sPriceMax = {}
let sPriceMin = {}
let sIncomeMax = {}

let nextOrderWait = 1000

process.on('uncaughtException', (error, source) => {
    console.log('未捕获到的异常=>', '错误信息:', error.message, '堆栈信息:', error.stack)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}

function getAccount(client) {
    client.account().then(response => {
        // let balance = `${response.data.totalWalletBalance}|${response.data.totalUnrealizedProfit}|${response.data.availableBalance}`
        logShow['totalWalletBalance'] = response.data.totalWalletBalance
        logShow['totalUnrealizedProfit'] = response.data.totalUnrealizedProfit
        logShow['availableBalance'] = response.data.availableBalance
        pos.forEach((p, i) => {
            if (p.ps == 'LONG') {
                let isposL = response.data.positions.filter(v => v.symbol == p.s && v.ps == 'LONG')
                if (isposL.length <= 0) {
                    pos[i].pa = 0
                }
            }
            if (p.ps == 'SHORT') {
                let isposS = response.data.positions.filter(v => v.symbol == p.s && v.ps == 'SHORT')
                if (isposS.length <= 0) {
                    pos[i].pa = 0
                }
            }
        })
        response.data.positions.forEach((item1) => {
            item1.positionAmt = Number(item1.positionAmt)
            item1.entryPrice = Number(item1.entryPrice)
            if (item1.positionAmt != 0) {
                if (item1.positionSide == 'LONG') {
                    let posL = pos.filter(v => v.s == item1.symbol && v.ps == 'LONG')
                    let income = (symbolHyPrice[item1.symbol] - item1.entryPrice) * item1.positionAmt
                    let pp = item1.entryPrice * item1.positionAmt
                    if (posL.length <= 0) {
                        let dInfo = { "s": item1.symbol, "pa": item1.positionAmt, "ep": item1.entryPrice, "cr": 0, "up": income, "pp": pp, "mt": "cross", "iw": "0", "ps": "LONG", "ma": "USDT" }
                        pos.push(dInfo)
                    } else {
                        let posIndex = pos.findIndex(v => v.s == item1.symbol && v.ps == 'LONG')
                        pos[posIndex].pa = item1.positionAmt
                        pos[posIndex].ep = item1.entryPrice
                        pos[posIndex].up = income
                        pos[posIndex].pp = pp
                    }
                } else if (item1.positionSide == 'SHORT') {
                    let posS = pos.filter(v => v.s == item1.symbol && v.ps == 'SHORT')
                    let income = (item1.entryPrice - symbolHyPrice[item1.symbol]) * Math.abs(item1.positionAmt)
                    let pp = item1.entryPrice * Math.abs(item1.positionAmt)
                    if (posS.length <= 0) {
                        let dInfo = { "s": item1.symbol, "pa": Math.abs(item1.positionAmt), "ep": item1.entryPrice, "cr": 0, "up": income, "pp": pp, "mt": "cross", "iw": "0", "ps": "SHORT", "ma": "USDT" }
                        pos.push(dInfo)
                    } else {
                        let posIndex = pos.findIndex(v => v.s == item1.symbol && v.ps == 'SHORT')
                        pos[posIndex].pa = Math.abs(item1.positionAmt)
                        pos[posIndex].ep = item1.entryPrice
                        pos[posIndex].up = income
                        pos[posIndex].pp = pp
                    }
                }
            }
        })
        // console.log('===pos===', pos)
    }).catch(err => {
        console.log('获取account错误', err)
    })
}

function updateIncome() {
    pos.map((v, posIndex) => {
        if (v.ps == 'LONG') {
            let income = (symbolHyPrice[v.s] - v.ep) * v.pa
            let pp = v.ep * v.pa
            pos[posIndex].up = income
            pos[posIndex].pp = pp
        }
        if (v.ps == 'SHORT') {
            let income = (v.ep - symbolHyPrice[v.s]) * v.pa
            let pp = v.ep * Math.abs(v.pa)
            pos[posIndex].up = income
            pos[posIndex].pp = pp
        }
    })
}

function getFloatNum(num) {
    let numStr = num.toString()
    let arr = numStr.split(".");
    if (arr.length > 1) {
        let decimalCount = arr[1].length;
        return decimalCount
    }
    return 0
}

function updatePosAndSymbol(symbol, action, amount, price, isJs = false, lockStatus = false, unLockIncome = 0) {
    action = action == 'L' ? 'LONG' : action == 'S' ? 'SHORT' : ''
    pos.forEach((v, i) => {
        if (v.s == symbol && v.ps == action) {
            pos[i].pa = amount
        }
    })
    symbolDatas.forEach((v, i) => {
        if (v.symbol == symbol) {
            if (action == 'LONG') {
                symbolDatas[i].lPrice = price
                if (isJs) {
                    symbolDatas[i].unLockCount = symbolDatas[i].unLockCount + 0.53
                    symbolDatas[i].gIncome = 0
                    symbolDatas[i].unLockIncome = symbolDatas[i].unLockIncome + unLockIncome
                }
                if (lockStatus) {
                    symbolDatas[i].lockStatus = 1
                    symbolDatas[i].whoLock = 'S'
                }
            }
            if (action == 'SHORT') {
                symbolDatas[i].sPrice = price
                if (isJs) {
                    symbolDatas[i].unLockCount = symbolDatas[i].unLockCount + 0.53
                    symbolDatas[i].gIncome = 0
                    symbolDatas[i].unLockIncome = symbolDatas[i].unLockIncome + unLockIncome
                }
                if (lockStatus) {
                    symbolDatas[i].lockStatus = 1
                    symbolDatas[i].whoLock = 'L'
                }
            }
        }
    })
}

function updateGridAndSymbol(symbol, action, price, gCount, amount = '', amount1 = '') {
    action = action == 'L' ? 'LONG' : action == 'S' ? 'SHORT' : ''
    if (amount != '') {
        pos.forEach((v, i) => {
            if (v.s == symbol && v.ps == 'L') {
                pos[i].pa = amount
            }
        })
    }
    if (amount1 != '') {
        pos.forEach((v, i) => {
            if (v.s == symbol && v.ps == 'S') {
                pos[i].pa = amount1
            }
        })
    }
    symbolDatas.forEach((v, i) => {
        if (v.symbol == symbol) {
            if (action == 'LONG') {
                symbolDatas[i].gPrice = price
                symbolDatas[i].gCount = symbolDatas[i].gCount + gCount
            }
            if (action == 'SHORT') {
                symbolDatas[i].gPrice = price
                symbolDatas[i].gCount = symbolDatas[i].gCount - gCount
            }
        }
    })
}

client.listenKeyPost().then(response => {
    let listenKey = response.data.listenKey;
    setInterval(() => {
        client.listenKeyPut().then(res => {
            pLog(`合约listenKey${listenKey}延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);
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
                    let index = pos.findIndex(v1 => v1.s == res.a.P[0]?.s && v1.ps == res.a.P[0]?.ps)
                    res.a.P[0]['pa'] = Math.abs(Number(res.a.P[0]?.pa == undefined ? 0 : res.a.P[0].pa))
                    res.a.P[0]['ep'] = Number(res.a.P[0]?.ep == undefined ? 0 : res.a.P[0].ep)
                    res.a.P[0]['up'] = Number(res.a.P[0]?.up == undefined ? 0 : res.a.P[0].up)
                    if (index < 0) {
                        pos.push(res.a.P[0])
                    } else {
                        pos.splice(index, 1)
                        pos.push(res.a.P[0])
                    }
                }
            }
        }
    });
    //
    // 查询 配置 全部参数 where status=1 and lockStatus=0
    let sql = `select * from ddlh_coin where uId=${myUid} order by ons desc`
    doDb(sql, []).then(dbCoin => {
        let _dbCoin = JSON.stringify(dbCoin)
        if (_dbCoin.startsWith('{')) {
            symbolDatas = []
            symbolDatas.push(dbCoin)
        } else {
            symbolDatas = dbCoin
        }
        let SymbolDataArrys = []
        symbolDatas.map(v => {
            SymbolDataArrys.push(`${v.symbol.toLowerCase()}@bookTicker`)
        })

        //更新合约价格
        client.combinedStreams(SymbolDataArrys, {
            open: () => {
                console.log('合约策略启动...')
                UpdatePosDate = Date.now()
                getAccount(client)
            },
            close: () => console.log('合约策略关闭...'),
            message: (msg) => {
                msg = JSON.parse(msg.toString());
                let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
                let symbol = msg.data.s
                price = Number(price)
                symbolHyPrice[symbol] = price
                //查询库里配置变化
                if (DbDate == null || Date.now() - DbDate > 100) {
                    DbDate = Date.now()
                    doDb(sql, []).then(dbCoin => {
                        let _dbCoin = JSON.stringify(dbCoin)
                        if (_dbCoin.startsWith('{')) {
                            symbolDatas = []
                            symbolDatas.push(dbCoin)
                        } else {
                            symbolDatas = dbCoin
                        }
                    }).catch(err => {
                        console.log(2, err)
                    })
                }
                // 实时更新计算持仓价格
                updateIncome()
                // 每5秒更新持仓
                if (UpdatePosDate == null || Date.now() - UpdatePosDate > 5000) {
                    UpdatePosDate = Date.now()
                    getAccount(client)
                    //空仓锁仓状态更新
                    symbolDatas.forEach(info => {
                        let longPos = pos.filter(v => v.s == info.symbol && v.ps == 'LONG')
                        let shortPos = pos.filter(v => v.s == info.symbol && v.ps == 'SHORT')
                        if ((shortPos.length <= 0 || shortPos[0]?.pa == 0) && (longPos.length <= 0 || longPos[0]?.pa == 0)) {
                            //空仓了 更新状态
                            let sql2 = 'update `ddlh_coin` set unLockCount=1,gCount=0,gIncome=0,gPrice=0,unLockIncome=0,lockStatus=0,utime=now() where id=?'
                            doDb(sql2, [`${info.id}`]).then(res2 => {
                                // console.log(info.symbol, '空仓锁仓状态更新, ok')
                            }).catch(e => {
                                console.error('空仓锁仓状态更新', e)
                            })
                            updatePosAndSymbol(info.symbol, 'L', 0, price, false)
                            updatePosAndSymbol(info.symbol, 'S', 0, price, false)
                        }
                    })
                }
                // 核心业务逻辑处理                         
                if (DodoDate[symbol] == undefined || Date.now() - DodoDate[symbol] > 50) {
                    DodoDate[symbol] = Date.now()
                    // =====查询排在最前面的一个未锁仓的币种=====       
                    let coinInfo = symbolDatas.filter(v => v.status == 1 && v.lockStatus == 0)
                    coinInfo = coinInfo.filter((v, i) => i < 8)
                    let curSymbol = ''
                    if (coinInfo.length > 0) {
                        coinInfo.forEach(vInfo => {
                            // 拿出当前应该运行的交易对
                            curSymbol = vInfo.symbol
                            if (symbol == curSymbol) {
                                //查询 1s kline 和 1m kline 拿 ma90
                                if (kTimeDate[symbol] == undefined || Date.now() - kTimeDate[symbol] > 26 * 1000) {
                                    kTimeDate[symbol] = Date.now()
                                    records_xh(sclient, symbol, '1s', 1500).then(k => {
                                        ma90s[symbol] = TA.EMA(k, 90)
                                        let ma90sLast = _N(ma90s[symbol][ma90s[symbol].length - 1], 4)
                                        ma90s1[symbol] = price > ma90sLast ? 'L' : 'S'
                                        logShow[`${symbol}_ma90s`] = `ma90sLast=${ma90sLast} | price=${price} | hyPrice=${symbolHyPrice[symbol]} | action=${price > ma90sLast ? 'L' : 'S'}`
                                    }).catch(err => {
                                        console.log(symbol, '1s', err)
                                    })
                                    records_xh(sclient, symbol, '1m', 1500).then(k => {
                                        ma90m[symbol] = TA.EMA(k, 90)
                                        let ma90mLast = _N(ma90m[symbol][ma90m[symbol].length - 1], 4)
                                        ma90m1[symbol] = price > ma90mLast ? 'L' : 'S'
                                        logShow[`${symbol}_ma90m`] = `ma90sLast=${ma90mLast} | price=${price} | hyPrice=${symbolHyPrice[symbol]} | action=${price > ma90mLast ? 'L' : 'S'}`
                                    }).catch(err => {
                                        console.log(symbol, '1m', err)
                                    })
                                }
                                // 多单完整处理流程
                                let longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                if (longPos.length > 0 && longPos[0].pa != 0 && (Date.now() - OpenForderDate[symbol] > 500 || OpenForderDate[symbol] == undefined)) {
                                    // 更新价格高低点 + 更新收益
                                    {
                                        if (lPriceMax[symbol] == 0 || lPriceMax[symbol] == undefined) {
                                            lPriceMax[symbol] = price
                                        } else {
                                            if (price > lPriceMax[symbol]) {
                                                lPriceMax[symbol] = price
                                            }
                                        }
                                        if (lPriceMin[symbol] == 0 || lPriceMin[symbol] == undefined) {
                                            lPriceMin[symbol] = price
                                        } else {
                                            if (price < lPriceMin[symbol]) {
                                                lPriceMin[symbol] = price
                                            }
                                        }
                                        if (lIncomeMax[symbol] == 0 || lIncomeMax[symbol] == undefined || lIncomeMax[symbol] == NaN) {
                                            lIncomeMax[symbol] = longPos[0].up
                                        } else {
                                            if (longPos[0].up > lIncomeMax[symbol]) {
                                                lIncomeMax[symbol] = longPos[0].up
                                            }
                                        }
                                    }
                                    //持仓价值限制
                                    if (longPos[0].pp < vInfo.totalAmount) {
                                        //顺势追 逆势加 回调0.1%止盈
                                        if (ma90m1[symbol] == 'L' && ma90s1[symbol] == 'L') {
                                            if (vInfo.lRightAddCount < vInfo.rightAddMax) {
                                                if (vInfo.lPrice < longPos[0].ep) {
                                                    vInfo.lPrice = longPos[0].ep
                                                }
                                                if (price > vInfo.lPrice * (1 + 0.001 * vInfo.rightAddBl * vInfo.fkRate) && (Date.now() - OpenOrderDate0[symbol] > nextOrderWait || OpenOrderDate0[symbol] == undefined)) {
                                                    OpenOrderDate0[symbol] = Date.now()
                                                    //追击
                                                    pLog(`${symbol} 多单追仓 下单记录价格:${price} 平铺下单数量:${vInfo.rightPpAmount} 平铺次数:${vInfo.lRightAddCount}`)
                                                    //更新库
                                                    let sql2 = 'update `ddlh_coin` set lPrice=?,lRightAddCount=lRightAddCount+1,utime=now() where id=?'
                                                    doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log('追击,更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error('追击,更新数据库', e)
                                                    })
                                                    buy(client, symbol, vInfo.rightPpAmount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    //更新缓存
                                                    updatePosAndSymbol(symbol, 'L', longPos[0].pa + vInfo.rightPpAmount, price, false)
                                                    return;
                                                }
                                            }
                                        } else {
                                            //逆势补仓
                                            if (vInfo.lErrorAddCount < vInfo.errorAddMax) {
                                                let rates = vInfo.errorAddBl.split(',')
                                                let rate = rates[vInfo.lErrorAddCount] * 0.001 * vInfo.fkRate
                                                if (vInfo.lPrice > longPos[0].ep) {
                                                    vInfo.lPrice = longPos[0].ep
                                                }
                                                if (price < vInfo.lPrice * (1 - rate) && price < longPos[0].ep && price > lPriceMin[symbol] * (1 + 0.001 * vInfo.backRate) && (Date.now() - OpenOrderDate0[symbol] > nextOrderWait || OpenOrderDate0[symbol] == undefined)) {
                                                    OpenOrderDate0[symbol] = Date.now()
                                                    let amount = vInfo.fristAmount * 2 ** vInfo.lErrorAddCount;
                                                    let numLength = getFloatNum(vInfo.fristAmount)
                                                    amount = _N(amount, numLength)
                                                    pLog(`${symbol} 多单逆势补仓 下单记录价格:${price} 补仓下单数量:${amount} 补仓次数:${vInfo.lErrorAddCount + 1}`)
                                                    //更新库
                                                    let sql2 = 'update `ddlh_coin` set lPrice=?,lErrorAddCount=lErrorAddCount+1,utime=now() where id=?'
                                                    doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log('逆势补仓，更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error('逆势补仓，更新数据库', e)
                                                    })
                                                    buy(client, symbol, amount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    updatePosAndSymbol(symbol, 'L', longPos[0].pa + amount, price, false)
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                    //回调止盈 且 覆盖手续费 
                                    if (longPos[0].pa > 0 && longPos[0].up < lIncomeMax[symbol] * 0.87 && price > longPos[0].ep * (1 + 0.001 * 2.65) && (Date.now() - OpenOrderDate0[symbol] > nextOrderWait || OpenOrderDate0[symbol] == undefined)) {
                                        OpenOrderDate0[symbol] = Date.now()
                                        pLog(`${symbol} 多单回调止盈 记录价格:${price} 下单数量:${longPos[0].pa} 收益:${longPos[0].up}`)
                                        let addSql = ''
                                        if (vInfo.whoLock == 'L') {
                                            addSql = 'unLockIncome=0,unLockCount=1,whoLock=0,'
                                        }
                                        let sql2 = `update ddlh_coin set lPrice=?,totalIncome=totalIncome+?,lRightAddCount=0,lErrorAddCount=0,${addSql}utime=now() where id=?`
                                        doDb(sql2, [`${price}`, longPos[0].up, `${vInfo.id}`]).then(res2 => {
                                            console.log(symbol, '多单，回调止盈，更新数据库, ok')
                                        }).catch(e => {
                                            console.error(symbol, '多单，回调止盈，更新数据库', e)
                                        })
                                        buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        updatePosAndSymbol(symbol, 'L', 0, price, false)
                                        lIncomeMax[symbol] = 0
                                        return;
                                    }
                                    //浮亏锁仓 + 解锁收益
                                    if (longPos[0].up + vInfo.unLockIncome < -vInfo.lockAmount * vInfo.unLockCount && (Date.now() - OpenOrderDate0[symbol] > nextOrderWait || OpenOrderDate0[symbol] == undefined)) {
                                        let sInfo = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                        let sAmount = 0;
                                        if (sInfo.length > 0) {
                                            sAmount = sInfo[0].pa
                                        }
                                        let numLength = getFloatNum(vInfo.fristAmount)
                                        let maxAmount = _N(vInfo.totalAmount / price, numLength)
                                        let doAmount = Math.min(longPos[0].pa, maxAmount)
                                        if (sAmount < doAmount) {
                                            let amount = doAmount - sAmount
                                            amount = _N(amount, numLength)
                                            pLog(`${symbol} 多单浮亏${longPos[0].up}达标，锁仓开空 记录价格:${price} 下单数量:${amount}`)
                                            OpenOrderDate0[symbol] = Date.now()
                                            sell(client, symbol, amount, -1).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            updatePosAndSymbol(symbol, 'S', doAmount, price, false, true)
                                            // 标记多单浮亏导致锁仓
                                            // 更新数据库
                                            let addcount1 = Math.max(vInfo.lErrorAddCount, vInfo.sErrorAddCount)
                                            let addcount2 = Math.max(vInfo.lRightAddCount, vInfo.sRightAddCount)
                                            let sql2 = 'update `ddlh_coin` set whoLock=?,sPrice=?,lockStatus=1,lErrorAddCount=?,sErrorAddCount=?,lRightAddCount=?,sRightAddCount=?,utime=now() where id=?'
                                            doDb(sql2, ['L', `${price}`, addcount1, addcount1, addcount2, addcount2, `${vInfo.id}`]).then(res2 => {
                                                console.log('多单浮亏达标锁仓开空，更新数据库, ok')
                                            }).catch(e => {
                                                console.error('多单浮亏达标锁仓开空，更新数据库', e)
                                            })
                                        }
                                        return;
                                    }
                                } else {
                                    //未持仓 开首单
                                    if ((OpenForderDate[symbol] == undefined || Date.now() - OpenForderDate[symbol] > 500) && (longPos.length <= 0 || (longPos.length > 0 && longPos[0].pa == 0))) {
                                        //多单开仓
                                        if (ma90m1[symbol] == 'L' && ma90s1[symbol] == 'L') {
                                            OpenForderDate[symbol] = Date.now()
                                            pLog(`${symbol}首单 多单开仓 下单记录价格:${price} 下单数量:${vInfo.fristAmount}`)
                                            buy(client, symbol, vInfo.fristAmount, -1).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            // 持久化更新数据库
                                            let sql2 = 'update `ddlh_coin` set lPrice=?,lRightAddCount=0,lErrorAddCount=0,utime=now() where id=?'
                                            doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                console.log('更新数据库, ok')
                                            }).catch(e => {
                                                console.error('更新数据库', e)
                                            })
                                            updatePosAndSymbol(symbol, 'L', vInfo.fristAmount, price, false)
                                            // 清空高低点
                                            lPriceMax[symbol] = 0
                                            lPriceMin[symbol] = 0
                                            lIncomeMax[symbol] = 0
                                        }
                                    }
                                }
                                //=== ===
                                // 空单完整处理流程
                                let shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                if (shortPos.length > 0 && shortPos[0].pa != 0 && (Date.now() - OpenForderDate[symbol] > 500 || OpenForderDate[symbol] == undefined)) {
                                    // 更新价格高低点 更新收益
                                    {
                                        if (sPriceMax[symbol] == 0 || sPriceMax[symbol] == undefined) {
                                            sPriceMax[symbol] = price
                                        } else {
                                            if (price > sPriceMax[symbol]) {
                                                sPriceMax[symbol] = price
                                            }
                                        }
                                        if (sPriceMin[symbol] == 0 || sPriceMin[symbol] == undefined) {
                                            sPriceMin[symbol] = price
                                        } else {
                                            if (price < lPriceMin[symbol]) {
                                                sPriceMin[symbol] = price
                                            }
                                        }
                                        if (sIncomeMax[symbol] == 0 || sIncomeMax[symbol] == undefined || sIncomeMax[symbol] == NaN) {
                                            sIncomeMax[symbol] = shortPos[0].up
                                        } else {
                                            if (shortPos[0].up > sIncomeMax[symbol]) {
                                                sIncomeMax[symbol] = shortPos[0].up
                                            }
                                        }
                                    }
                                    //持仓价值限制
                                    if (shortPos[0].pp < vInfo.totalAmount) {
                                        //顺势追 逆势加 回调0.1%止盈
                                        if (ma90m1[symbol] == 'S' && ma90s1[symbol] == 'S') {
                                            if (vInfo.sRightAddCount < vInfo.rightAddMax) {
                                                if (vInfo.sPrice > shortPos[0].ep) {
                                                    vInfo.sPrice = shortPos[0].ep
                                                }
                                                if (price < vInfo.sPrice * (1 - 0.001 * vInfo.rightAddBl * vInfo.fkRate) && (Date.now() - OpenOrderDate1[symbol] > nextOrderWait || OpenOrderDate1[symbol] == undefined)) {
                                                    OpenOrderDate1[symbol] = Date.now()
                                                    //追击
                                                    pLog(`${symbol} 空单追仓 下单记录价格:${price} 平铺下单数量:${vInfo.rightPpAmount} 平铺次数:${vInfo.sRightAddCount}`)
                                                    //更新库
                                                    let sql2 = 'update `ddlh_coin` set sPrice=?,sRightAddCount=sRightAddCount+1,utime=now() where id=?'
                                                    doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log(symbol, '空单追击,更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error(symbol, '空单追击,更新数据库', e)
                                                    })
                                                    sell(client, symbol, vInfo.rightPpAmount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    updatePosAndSymbol(symbol, 'S', shortPos[0].pa + vInfo.rightPpAmount, price, false)
                                                    return;
                                                }
                                            }
                                        } else {
                                            //逆势补仓
                                            if (vInfo.sErrorAddCount < vInfo.errorAddMax) {
                                                let rates = vInfo.errorAddBl.split(',')
                                                let rate = rates[vInfo.sErrorAddCount] * 0.001 * vInfo.fkRate
                                                if (vInfo.sPrice < shortPos[0].ep) {
                                                    vInfo.sPrice = shortPos[0].ep
                                                }
                                                if (price > vInfo.sPrice * (1 + rate) && price > shortPos[0].ep && price < sPriceMax[symbol] * (1 - 0.001 * vInfo.backRate) && (Date.now() - OpenOrderDate1[symbol] > nextOrderWait || OpenOrderDate1[symbol] == undefined)) {
                                                    OpenOrderDate1[symbol] = Date.now()
                                                    let amount = vInfo.fristAmount * (2 ** vInfo.sErrorAddCount);
                                                    let numLength = getFloatNum(vInfo.fristAmount)
                                                    amount = _N(amount, numLength)
                                                    pLog(`${symbol} 空单逆势补仓 下单记录价格:${price} 补仓下单数量:${amount} 补仓次数:${vInfo.sErrorAddCount + 1}`)
                                                    //更新库
                                                    let sql2 = 'update `ddlh_coin` set sPrice=?,sErrorAddCount=sErrorAddCount+1,utime=now() where id=?'
                                                    doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log(symbol, '空单逆势补仓，更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error(symbol, '空单逆势补仓，更新数据库', e)
                                                    })
                                                    sell(client, symbol, amount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    updatePosAndSymbol(symbol, 'S', shortPos[0].pa + amount, price, false)
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                    //回调止盈 且 覆盖手续费 (shortPos[0].up < sIncomeMax[symbol] * 0.87 || price > sPriceMin[symbol] * (1 + 0.001 * vInfo.backRate))
                                    if (shortPos[0].pa > 0 && shortPos[0].up < sIncomeMax[symbol] * 0.87 && price < shortPos[0].ep * (1 - 0.001 * 2.65) && (Date.now() - OpenOrderDate1[symbol] > nextOrderWait || OpenOrderDate1[symbol] == undefined)) {
                                        OpenOrderDate1[symbol] = Date.now()
                                        pLog(`${symbol} 空单回调止盈 记录价格:${price} 下单数量:${shortPos[0].pa} 收益:${shortPos[0].up}`)
                                        let addSql = ''
                                        if (vInfo.whoLock == 'S') {
                                            addSql = 'unLockIncome=0,unLockCount=1,whoLock=0,'
                                        }
                                        //更新数据库
                                        let sql2 = `update ddlh_coin set sPrice=?,totalIncome=totalIncome+?,sRightAddCount=0,sErrorAddCount=0,${addSql}utime=now() where id=?`
                                        doDb(sql2, [`${price}`, shortPos[0].up, `${vInfo.id}`]).then(res2 => {
                                            console.log('空单，回调止盈，更新数据库, ok')
                                        }).catch(e => {
                                            console.error('空单，回调止盈，更新数据库', e)
                                        })
                                        sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        updatePosAndSymbol(symbol, 'S', 0, price, false)
                                        sIncomeMax[symbol] = 0
                                        return;
                                    }
                                    //浮亏锁仓 + 解锁收益
                                    if (shortPos[0].up + vInfo.unLockIncome < -vInfo.lockAmount * vInfo.unLockCount && (Date.now() - OpenOrderDate1[symbol] > nextOrderWait || OpenOrderDate1[symbol] == undefined)) {
                                        let lInfo = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                        let lAmount = 0;
                                        if (lInfo.length > 0) {
                                            lAmount = lInfo[0].pa
                                        }
                                        let numLength = getFloatNum(vInfo.fristAmount)
                                        let maxAmount = _N(vInfo.totalAmount / price, numLength)
                                        let doAmount = Math.min(shortPos[0].pa, maxAmount)
                                        if (lAmount < doAmount) {
                                            let amount = doAmount - lAmount
                                            amount = _N(amount, numLength)
                                            pLog(`${symbol} 空单浮亏${shortPos[0].up}达标锁仓，开多 记录价格:${price} 下单数量:${amount}`)
                                            OpenOrderDate1[symbol] = Date.now()
                                            buy(client, symbol, amount, -1).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            updatePosAndSymbol(symbol, 'L', doAmount, price, false, true)
                                            // 更新数据库
                                            let addcount1 = Math.max(vInfo.lErrorAddCount, vInfo.sErrorAddCount)
                                            let addcount2 = Math.max(vInfo.lRightAddCount, vInfo.sRightAddCount)
                                            let sql2 = 'update `ddlh_coin` set whoLock=?,lPrice=?,lockStatus=1,lErrorAddCount=?,sErrorAddCount=?,lRightAddCount=?,sRightAddCount=?,utime=now() where id=?'
                                            doDb(sql2, ['S', `${price}`, addcount1, addcount1, addcount2, addcount2, `${vInfo.id}`]).then(res2 => {
                                                console.log(symbol, '空单浮亏达标锁仓开多，更新数据库, ok')
                                            }).catch(e => {
                                                console.error(symbol, '空单浮亏达标锁仓开多，更新数据库', e)
                                            })
                                            return;
                                        }
                                    }
                                } else {
                                    //未持仓 开首单 空
                                    if ((OpenForderDate[symbol] == undefined || Date.now() - OpenForderDate[symbol] > 500) && (shortPos.length <= 0 || (shortPos.length > 0 && shortPos[0].pa == 0))) {
                                        OpenForderDate[symbol] = Date.now()
                                        if (ma90m1[symbol] == 'S' && ma90s1[symbol] == 'S') {
                                            pLog(`${symbol} 空单开仓 下单记录价格:${price} 下单数量:${vInfo.fristAmount}`)
                                            sell(client, symbol, vInfo.fristAmount, -1).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            updatePosAndSymbol(symbol, 'S', vInfo.fristAmount, price, false)
                                            // 持久化更新数据库
                                            let sql2 = 'update `ddlh_coin` set sPrice=?,sRightAddCount=0,sErrorAddCount=0,utime=now() where id=?'
                                            doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                console.log(symbol, '首单开空,更新数据库, ok')
                                            }).catch(e => {
                                                console.error(symbol, '首单开空,更新数据库', e)
                                            })
                                            // 清空高低点
                                            sPriceMax[symbol] = 0
                                            sPriceMin[symbol] = 0
                                            sIncomeMax[symbol] = 0
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
                // =====监控解锁锁仓的币种=====
                if (DodoDate1[symbol] == undefined || Date.now() - DodoDate1[symbol] > 0.55 * 1000) {
                    DodoDate1[symbol] = Date.now()
                    let coinInfoUnLock = symbolDatas.filter(v => v.status == 1 && v.lockStatus == 1)
                    if (coinInfoUnLock.length > 0) {
                        coinInfoUnLock.forEach(vInfoUnlock => {
                            // 拿出当前锁仓的交易对
                            let lockSymbol = vInfoUnlock.symbol
                            // 锁仓当前正在运行的币种
                            if (lockSymbol == symbol) {
                                let printIncomeInfo = ''
                                // 检测是否满足解锁条件
                                let longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                let shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                if (longPos.length > 0) {
                                    //更新收益                                    
                                    {
                                        if (lIncomeMax[symbol] == 0 || lIncomeMax[symbol] == undefined || lIncomeMax[symbol] == NaN) {
                                            lIncomeMax[symbol] = longPos[0].up
                                        } else {
                                            if (longPos[0].up > lIncomeMax[symbol]) {
                                                lIncomeMax[symbol] = longPos[0].up
                                            }
                                        }
                                        if (lPriceMax[symbol] == 0 || lPriceMax[symbol] == undefined) {
                                            lPriceMax[symbol] = price
                                        } else {
                                            if (price > lPriceMax[symbol]) {
                                                lPriceMax[symbol] = price
                                            }
                                        }
                                        if (lPriceMin[symbol] == 0 || lPriceMin[symbol] == undefined) {
                                            lPriceMin[symbol] = price
                                        } else {
                                            if (price < lPriceMin[symbol]) {
                                                lPriceMin[symbol] = price
                                            }
                                        }
                                    }
                                    let lIncome = longPos[0].up
                                    printIncomeInfo = `多单收益:${lIncome}`
                                    //大于持仓价值既可以解锁
                                    let mIncome = 0
                                    let mPp = longPos[0].pp * 0.0073
                                    mIncome = vInfoUnlock.lockAmount < mPp ? vInfoUnlock.lockAmount : mPp
                                    if (lIncome + vInfoUnlock.gIncome > mIncome && lIncome < lIncomeMax[symbol] * 0.82) {
                                        //解锁多单
                                        pLog(`${symbol} 解锁 多单平仓 记录价格:${price} 收益:${lIncome} 数量:${longPos[0].pa}`)
                                        buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        updatePosAndSymbol(symbol, 'L', 0, price, true, false, mIncome)
                                        let addSql = ''
                                        if (vInfoUnlock.whoLock == 'L') {
                                            addSql = 'unLockIncome=0,unLockCount=1,whoLock=0,'
                                        }
                                        //更新数据库
                                        let sql2 = `update ddlh_coin set lPrice=?,unLockCount=unLockCount+0.53,lRightAddCount=0,lErrorAddCount=0,gIncome=0,gCount=0,unLockIncome=unLockIncome+?,totalIncome=totalIncome+?,lockStatus=0,${addSql}utime=now() where id=?`
                                        doDb(sql2, [`${price}`, lIncome * 0.95, lIncome, `${vInfoUnlock.id}`]).then(res2 => {
                                            console.log('解锁，多单平仓, ok')
                                        }).catch(e => {
                                            console.error('解锁，多单平仓', e)
                                        })
                                        lIncomeMax[symbol] = 0
                                        return
                                    }
                                }
                                if (shortPos.length > 0) {
                                    //更新收益
                                    {
                                        if (sIncomeMax[symbol] == 0 || sIncomeMax[symbol] == undefined || sIncomeMax[symbol] == NaN) {
                                            sIncomeMax[symbol] = shortPos[0].up
                                        } else {
                                            if (shortPos[0].up > sIncomeMax[symbol]) {
                                                sIncomeMax[symbol] = shortPos[0].up
                                            }
                                        }
                                        if (sPriceMax[symbol] == 0 || sPriceMax[symbol] == undefined) {
                                            sPriceMax[symbol] = price
                                        } else {
                                            if (price > sPriceMax[symbol]) {
                                                sPriceMax[symbol] = price
                                            }
                                        }
                                        if (sPriceMin[symbol] == 0 || sPriceMin[symbol] == undefined) {
                                            sPriceMin[symbol] = price
                                        } else {
                                            if (price < lPriceMin[symbol]) {
                                                sPriceMin[symbol] = price
                                            }
                                        }
                                    }
                                    let mIncome = 0
                                    let mPp = shortPos[0].pp * 0.0073
                                    mIncome = vInfoUnlock.lockAmount < mPp ? vInfoUnlock.lockAmount : mPp
                                    let sIncome = shortPos[0].up
                                    printIncomeInfo += ` | 空单收益:${sIncome}`
                                    if (sIncome + vInfoUnlock.gIncome > mIncome && sIncome < sIncomeMax[symbol] * 0.82) {
                                        //解锁空单
                                        pLog(`${symbol} 解锁 空单平仓 记录价格:${price} 收益:${sIncome} 数量:${shortPos[0].pa}`)
                                        sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        updatePosAndSymbol(symbol, 'S', 0, price, true, false, mIncome)
                                        let addSql = ''
                                        if (vInfoUnlock.whoLock == 'S') {
                                            addSql = 'unLockIncome=0,unLockCount=1,whoLock=0,'
                                        }
                                        //更新数据库
                                        let sql2 = `update ddlh_coin set sPrice=?,unLockCount=unLockCount+0.53,sRightAddCount=0,sErrorAddCount=0,gIncome=0,gCount=0,unLockIncome=unLockIncome+?,totalIncome=totalIncome+?,lockStatus=0,${addSql}utime=now() where id=?`
                                        doDb(sql2, [`${price}`, (sIncome + vInfoUnlock.gIncome) * 0.99, sIncome + vInfoUnlock.gIncome, `${vInfoUnlock.id}`]).then(res2 => {
                                            console.log('解锁，空单平仓, ok')
                                        }).catch(e => {
                                            console.error('解锁，空单平仓', e)
                                        })
                                        sIncomeMax[symbol] = 0
                                        return
                                    }
                                }
                                //清仓解锁+网格
                                if ((longPos.length > 0 && longPos[0].pa != 0) && (shortPos.length > 0 && shortPos[0].pa != 0)) {
                                    let lIncome = longPos[0].up
                                    let sIncome = shortPos[0].up
                                    let totalIncome = lIncome + sIncome
                                    if ((totalIncome + vInfoUnlock.unLockIncome + vInfoUnlock.gIncome - (longPos[0].pp * 4 * vInfoUnlock.unLockCount * 0.01 * 0.04)) > vInfoUnlock.lockAmount) {
                                        //持平清仓
                                        pLog(`${symbol} 清仓解锁 持平清仓 记录价格:${price} 多单收益:${lIncome} 多单数量:${longPos[0].pa} 空单收益:${sIncome} 空单数量:${shortPos[0].pa}`)
                                        sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        updatePosAndSymbol(symbol, 'S', 0, price, false)
                                        updatePosAndSymbol(symbol, 'L', 0, price, false)
                                        //更新数据库
                                        let sql2 = 'update `ddlh_coin` set sPrice=?,lPrice=?,unLockCount=1,gIncome=0,gCount=0,gPrice=0,unLockIncome=0,totalIncome=totalIncome+?,lockStatus=0,lRightAddCount=0,lErrorAddCount=0,sRightAddCount=0,sErrorAddCount=0,utime=now() where id=?'
                                        doDb(sql2, [`${price}`, price, totalIncome, `${vInfoUnlock.id}`]).then(res2 => {
                                            console.log('清仓解锁 持平清仓, ok')
                                        }).catch(e => {
                                            console.error('清仓解锁 持平清仓', e)
                                        })
                                        return;
                                    }
                                    // 网格磨                                   
                                    if (Math.abs(vInfoUnlock.gCount) < vInfoUnlock.rightAddMax && vInfoUnlock.isGrid == 1) {
                                        if (vInfoUnlock.gCount == 0) {
                                            //更新数据库
                                            let sql2 = 'update `ddlh_coin` set gPrice=?,gCount=1,utime=now() where id=?'
                                            doDb(sql2, [`${price}`, `${vInfoUnlock.id}`]).then(res2 => {
                                                console.log('记录磨损初始值, ok')
                                            }).catch(e => {
                                                console.error('记录磨损初始值', e)
                                            })
                                            updateGridAndSymbol(symbol, 'L', price, 1)
                                            return
                                        }
                                        let amount = vInfoUnlock.rightPpAmount
                                        let income1 = (vInfoUnlock.rightPpAmount / longPos[0].pa) * longPos[0].up
                                        let income2 = (vInfoUnlock.rightPpAmount / shortPos[0].pa) * shortPos[0].up
                                        let fee = amount * price * 2 * 0.01 * 0.04
                                        let oldGPrice = vInfoUnlock.gPrice
                                        //价格高于gPrice网格距离 发生回调多单止盈 空单加仓 lIncome < lIncomeMax[symbol] * 0.9
                                        if (longPos[0].up > 0 && price > vInfoUnlock.gPrice * (1 + vInfoUnlock.gRate * 0.001) && price < lPriceMax[symbol] * (1 - 0.001)) {
                                            updateGridAndSymbol(symbol, 'L', price, 1, longPos[0].pa - amount, shortPos[0].pa + amount)
                                            //                                            
                                            if (longPos[0].pa < vInfoUnlock.rightPpAmount) {
                                                amount = longPos[0].pa
                                            }
                                            buy_close(client, symbol, amount, -1).then(res => {
                                                console.log(symbol, '网格平多')
                                            }).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            if (shortPos[0].pp < vInfoUnlock.totalAmount) {
                                                sell(client, symbol, amount, -1).then(res => {
                                                    console.log(symbol, '网格开空')
                                                }).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                            }
                                            //更新数据库
                                            let sql2 = 'update `ddlh_coin` set gPrice=?,gCount=gCount+1,gIncome=gIncome+?,totalIncome=totalIncome+?,utime=now() where id=?'
                                            doDb(sql2, [`${price}`, income1 - fee, income1 - fee, `${vInfoUnlock.id}`]).then(res2 => {
                                                pLog(`${symbol},价格:${price},高于gPrice:${oldGPrice},网格距离:${vInfoUnlock.gRate} 数量:${amount},多单收益:${income1}，空单收益:${income2}，手续费:${fee}，发生回调多单止盈 空单加仓, ok`)
                                            }).catch(e => {
                                                console.error('价格高于gPrice网格距离 发生回调多单止盈 空单加仓', e)
                                            })
                                            lPriceMax[symbol] = 0
                                            return
                                        }
                                        //价格低于gPrice网格距离 发生回调空单止盈 多单加仓
                                        if (shortPos[0].up > 0 && price < vInfoUnlock.gPrice * (1 - vInfoUnlock.gRate * 0.001) && price > sPriceMin[symbol] * (1 + 0.001)) {
                                            if (shortPos[0].pa < vInfoUnlock.rightPpAmount) {
                                                amount = shortPos[0].pa
                                            }
                                            sell_close(client, symbol, amount, -1).then(res => {
                                                console.log(symbol, '网格平空')
                                            }).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            if (longPos[0].pp < vInfoUnlock.totalAmount) {
                                                buy(client, symbol, amount, -1).then(res => {
                                                    console.log(symbol, '网格开多')
                                                }).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                            }
                                            //更新数据库
                                            let sql2 = 'update `ddlh_coin` set gPrice=?,gCount=gCount-1,gIncome=gIncome+?,totalIncome=totalIncome+?,utime=now() where id=?'
                                            if (vInfoUnlock.gCount == 1) {
                                                sql2 = 'update `ddlh_coin` set gPrice=?,gCount=gCount-2,gIncome=gIncome+?,totalIncome=totalIncome+?,utime=now() where id=?'
                                                updateGridAndSymbol(symbol, 'S', price, 2, longPos[0].pa - amount, shortPos[0].pa + amount)
                                            } else {
                                                updateGridAndSymbol(symbol, 'S', price, 1, longPos[0].pa - amount, shortPos[0].pa + amount)
                                            }
                                            doDb(sql2, [`${price}`, income2 - fee, income2 - fee, `${vInfoUnlock.id}`]).then(res2 => {
                                                pLog(`${symbol},价格:${price},低于gPrice:${oldGPrice},网格距离:${vInfoUnlock.gRate} 数量:${amount},多单收益:${income1}，空单收益:${income2}，手续费:${fee}，发生回调空单止盈 多单加仓, ok`)
                                            }).catch(e => {
                                                console.error('价格低于gPrice网格距离 发生回调空单止盈 多单加仓', e)
                                            })
                                            sPriceMin[symbol] = 0
                                            return
                                        }
                                    }
                                }
                                //不满足锁仓状态的自动解锁
                                if (((longPos.length > 0 && longPos[0]?.pa > 0) && (shortPos.length <= 0 || shortPos[0]?.pa == 0)) || ((longPos.length <= 0 || longPos[0]?.pa == 0) && (shortPos.length > 0 && shortPos[0]?.pa > 0))) {
                                    let sql2 = 'update `ddlh_coin` set lockStatus=0,gIncome=0,utime=now() where id=?'
                                    doDb(sql2, [`${vInfoUnlock.id}`]).then(res2 => {
                                        console.log('不满足锁仓状态的自动解锁, ok')
                                    }).catch(e => {
                                        console.error('不满足锁仓状态的自动解锁', e)
                                    })
                                }
                                logShow[`待解仓交易对:${lockSymbol}`] = printIncomeInfo
                            }
                        });
                    }
                }
                //日志打印
                if (LogShowDate == null || Date.now() - LogShowDate > 60 * 1000) {
                    LogShowDate = Date.now()
                    // console.log(pos)
                    console.log(logShow, 'lIncomeMax=', lIncomeMax, 'sIncomeMax=', sIncomeMax)
                }
            }
        });
    }).catch(err => {
        console.log(err)
    })
}).catch(e => {
    console.log('e=>', e)
})

//基本页面币种展示
//停止|启动 单币种运行状态
//开多，平多，开空，平空
//一键清仓
//持仓查询

//余额查询

app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})
