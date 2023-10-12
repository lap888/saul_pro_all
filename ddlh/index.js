/* 登顶量化 志在巅峰 漫步人生路
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-05 20:31:31 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-04-07 16:46:23
 */

const prod = false;

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


const apiKey = 'vvXRVrPKg20KgwVMpmHeUtojzyEtruUKyel2SqHIMejUBAmP5T2FxkQY1dcB2ezn'
const apiSecret = 'sAIEaprrhTXMtprVTGANjA35xJg1Wa1SeJIJmRvngbgY7WNWxFISm9mtPJZ8Oi0x'


let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const port = '30019'

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
let pos = []//[{"s":"ETHUSDT","pa":"-1.613","ep":"1860.58286","cr":"-499.34214144","up":"-30.40528948","mt":"cross","iw":"0","ps":"SHORT","ma":"USDT"}]
let symbolDatas = []
let symbolHyPrice = {}
let kTimeDate = {}
let DbDate = null
let UpdatePosDate = null
let OpenOrderDate = {}
let DodoDate = {}
let LogShowDate = null
let logShow = {}
let ma90s = {}
let ma90m = {}
let ma90s1 = {}
let ma90m1 = {}
//价格高低点
let lPriceMax = {}
let lPriceMin = {}

let sPriceMax = {}
let sPriceMin = {}

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
    // console.log('===updateIncome-pos===', pos)
}

function wsGetHyprice(SymbolDataArrys) {
    client.listenKeyPost().then(response => {
        let listenKey = response.data.listenKey;
        setInterval(() => {
            client.listenKeyPut().then(res => {
                pLog(`合约listenKey${listenKey}延长listenkey,25分钟`)
                console.log('res', res)
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
                    //查询替换
                    let index = pos.findIndex(v1 => v1.s == res.a.P[0].s && v1.ps == res.a.P[0].ps)
                    res.a.P[0].pa = Math.abs(Number(res.a.P[0].pa))
                    res.a.P[0].ep = Number(res.a.P[0].ep)
                    res.a.P[0].up = Number(res.a.P[0].up)
                    if (index < 0) {
                        pos.push(res.a.P[0])
                    } else {
                        pos.splice(index, 1)
                        pos.push(res.a.P[0])
                    }
                    pLog(`账户持仓=>${JSON.stringify(pos)}`)
                }
            }
        });
        //更新合约价格
        client.combinedStreams(SymbolDataArrys, {
            message: (msg) => {
                msg = JSON.parse(msg.toString());
                let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
                // let ms = `${msg.data.e} | ${msg.data.s} | ${price} | ${DateFormat(msg.data.E)}`
                // console.log('hy=',ms)
                let symbol = msg.data.s
                price = Number(price)
                symbolHyPrice[symbol] = price
            }
        });
    })
}
sclient.createListenKey().then(response => {
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient.renewListenKey(listenKey).then(res => {
            pLog(`延长listenkey,25分钟`, res)
        })
    }, 25 * 60 * 1000);
    // 查询 配置 全部参数 where status=1 and lockStatus=0
    let sql = "select * from `ddlh_coin`"
    doDb(sql, []).then(dbCoin => {
        // console.log('dbCoin=', dbCoin)
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
        //同步配置币种合约价格
        wsGetHyprice(SymbolDataArrys)
        //现货价格
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
                //=====查询排在最前面的一个未锁仓的币种=====
                let coinInfo = symbolDatas.filter(v => v.status == 1 && v.lockStatus == 0)
                let curSymbol = ''
                //10毫秒过滤
                if (DodoDate[symbol] == undefined || Date.now() - DodoDate[symbol] > 25) {
                    DodoDate[symbol] = Date.now()
                    if (coinInfo.length > 0) {
                        // 实时更新计算持仓价格
                        updateIncome()
                        // 每秒更新持仓
                        if (UpdatePosDate == null || Date.now() - UpdatePosDate > 3000) {
                            UpdatePosDate = Date.now()
                            getAccount(client)
                        }
                        // 拿出当前应该运行的交易对
                        curSymbol = coinInfo[0].symbol
                        if (symbol == curSymbol) {
                            //执行核心逻辑
                            //查询 1s kline 和 1m kline 拿 ma90
                            if (kTimeDate[symbol] == null || Date.now() - kTimeDate[symbol] > 1001) {
                                kTimeDate[symbol] = Date.now()
                                records_xh(sclient, symbol, '1s', 500).then(k => {
                                    ma90s[symbol] = TA.EMA(k, 90)
                                    let ma90sLast = _N(ma90s[symbol][ma90s[symbol].length - 1], 4)
                                    ma90s1[symbol] = price > ma90sLast ? 'L' : 'S'
                                    logShow[`${symbol}_ma90s`] = `ma90sLast=${ma90sLast} | price=${price} | hyPrice=${symbolHyPrice[symbol]} | action=${price > ma90sLast ? 'L' : 'S'}`
                                }).catch(err => {
                                    console.log(symbol, '1s', err)
                                })
                                records_xh(sclient, symbol, '1m', 500).then(k => {
                                    ma90m[symbol] = TA.EMA(k, 90)
                                    let ma90mLast = _N(ma90m[symbol][ma90m[symbol].length - 1], 4)
                                    ma90m1[symbol] = price > ma90mLast ? 'L' : 'S'
                                    logShow[`${symbol}_ma90m`] = `ma90sLast=${ma90mLast} | price=${price} | hyPrice=${symbolHyPrice[symbol]} | action=${price > ma90mLast ? 'L' : 'S'}`
                                }).catch(err => {
                                    console.log(symbol, '1m', err)
                                })
                                // console.log(logShow)
                            }
                            // 多单完整处理流程
                            let longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                            if (longPos.length > 0) {
                                // 更新价格高低点
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
                                //持仓价值限制
                                if (longPos[0].pp < coinInfo[0].totalAmount) {
                                    //顺势追 逆势加 回调0.1%止盈
                                    if (ma90m1[symbol] == 'L' && ma90s1[symbol] == 'L') {
                                        if (coinInfo[0].lRightAddCount < coinInfo[0].rightAddMax) {
                                            if (coinInfo[0].lPrice < longPos[0].ep) {
                                                coinInfo[0].lPrice = longPos[0].ep
                                            }
                                            if (price > coinInfo[0].lPrice * (1 + 0.001 * coinInfo[0].rightAddBl * coinInfo[0].fkRate)) {
                                                //追击
                                                pLog(`${symbol} 多单追仓 下单记录价格:${price} 平铺下单数量:${coinInfo[0].rightPpAmount} 平铺次数:${coinInfo[0].lRightAddCount}`)
                                                //更新库
                                                let sql2 = 'update `ddlh_coin` set lPrice=?,lRightAddCount=lRightAddCount+1,utime=now() where id=?'
                                                doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                                    console.log('追击,更新数据库, ok')
                                                }).catch(e => {
                                                    console.error('追击,更新数据库', e)
                                                })
                                                buy(client, symbol, coinInfo[0].rightPpAmount, -1)
                                                // 清空高低点
                                                lPriceMax[symbol] = 0
                                                lPriceMin[symbol] = 0
                                            }
                                        }
                                    } else {
                                        //逆势补仓
                                        if (coinInfo[0].lErrorAddCount < coinInfo[0].errorAddMax) {
                                            let rates = coinInfo[0].errorAddBl.split(',')
                                            let rate = rates[coinInfo[0].lErrorAddCount] * 0.001 * coinInfo[0].fkRate
                                            if (coinInfo[0].lPrice > longPos[0].ep) {
                                                coinInfo[0].lPrice = longPos[0].ep
                                            }
                                            if (price < coinInfo[0].lPrice * (1 - rate) && price < longPos[0].ep && price > lPriceMin[symbol] * (1 + 0.001 * coinInfo[0].backRate)) {
                                                let amount = coinInfo[0].fristAmount * 2 ** coinInfo[0].lErrorAddCount;
                                                pLog(`${symbol} 多单逆势补仓 下单记录价格:${price} 补仓下单数量:${amount} 补仓次数:${coinInfo[0].lErrorAddCount + 1}`)
                                                //更新库
                                                let sql2 = 'update `ddlh_coin` set lPrice=?,lErrorAddCount=lErrorAddCount+1,utime=now() where id=?'
                                                doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                                    console.log('逆势补仓，更新数据库, ok')
                                                }).catch(e => {
                                                    console.error('逆势补仓，更新数据库', e)
                                                })
                                                buy(client, symbol, amount, -1)
                                                // 清空高低点
                                                lPriceMax[symbol] = 0
                                                lPriceMin[symbol] = 0
                                            }
                                        }
                                    }
                                }
                                //回调止盈 且 覆盖手续费
                                if (price > longPos[0].ep * (1 + 0.001 * coinInfo[0].rightAddBl) && price < lPriceMax[symbol] * (1 - 0.001 * coinInfo[0].backRate)) {
                                    pLog(`${symbol} 多单回调止盈 记录价格:${price} 下单数量:${longPos[0].pa} 收益:${longPos[0].up}`)
                                    let sql2 = 'update `ddlh_coin` set lPrice=?,totalIncome=totalIncome+?,utime=now() where id=?'
                                    doDb(sql2, [`${price}`, longPos[0].up, `${coinInfo[0].id}`]).then(res2 => {
                                        console.log(symbol, '多单，回调止盈，更新数据库, ok')
                                    }).catch(e => {
                                        console.error(symbol, '多单，回调止盈，更新数据库', e)
                                    })
                                    buy_close(client, symbol, longPos[0].pa, -1)
                                }
                                //浮亏锁仓 + 解锁收益
                                if (longPos[0].up < -(coinInfo[0].lockAmount * coinInfo[0].unLockCount + coinInfo[0].unLockIncome)) {
                                    let sInfo = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                    let sAmount = 0;
                                    if (sInfo.lengt > 0) {
                                        sAmount = sInfo[0].pa
                                    }
                                    if (sAmount < longPos[0].pa) {
                                        let amount = longPos[0].pa - sAmount
                                        pLog(`${symbol} 多单浮亏达标锁仓开空 记录价格:${price} 下单数量:${amount}`)
                                        sell(client, symbol, amount, -1)
                                        // 更新数据库
                                        let sql2 = 'update `ddlh_coin` set sPrice=?,lockStatus=1,utime=now() where id=?'
                                        doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                            console.log('多单浮亏达标锁仓开空，更新数据库, ok')
                                        }).catch(e => {
                                            console.error('多单浮亏达标锁仓开空，更新数据库', e)
                                        })
                                    }
                                }
                            } else {
                                //未持仓 开首单
                                if (OpenOrderDate[symbol] == undefined || Date.now() - OpenOrderDate[symbol] > 1000) {
                                    OpenOrderDate[symbol] = Date.now()
                                    //多单开仓
                                    if (ma90m1[symbol] == 'L' && ma90s1[symbol] == 'L') {
                                        pLog(`${symbol} 多单开仓 下单记录价格:${price} 下单数量:${coinInfo[0].fristAmount}`)
                                        buy(client, symbol, coinInfo[0].fristAmount, -1)
                                        // 持久化更新数据库
                                        let sql2 = 'update `ddlh_coin` set lPrice=?,lRightAddCount=0,lErrorAddCount=0,utime=now() where id=?'
                                        doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                            console.log('更新数据库, ok')
                                        }).catch(e => {
                                            console.error('更新数据库', e)
                                        })
                                        // 清空高低点
                                        lPriceMax[symbol] = 0
                                        lPriceMin[symbol] = 0
                                    }
                                }
                            }
                            //=== ===
                            // 空单完整处理流程
                            let shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                            if (shortPos.length > 0) {
                                // 更新价格高低点
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
                                //持仓价值限制
                                if (shortPos[0].pp < coinInfo[0].totalAmount) {
                                    //顺势追 逆势加 回调0.1%止盈
                                    if (ma90m1[symbol] == 'S' && ma90s1[symbol] == 'S') {
                                        if (coinInfo[0].sRightAddCount < coinInfo[0].rightAddMax) {
                                            if (coinInfo[0].sPrice > shortPos[0].ep) {
                                                coinInfo[0].sPrice = shortPos[0].ep
                                            }
                                            if (price < coinInfo[0].sPrice * (1 - 0.001 * coinInfo[0].rightAddBl * coinInfo[0].fkRate)) {
                                                //追击
                                                pLog(`${symbol} 空单追仓 下单记录价格:${price} 平铺下单数量:${coinInfo[0].rightPpAmount} 平铺次数:${coinInfo[0].sRightAddCount}`)
                                                //更新库
                                                let sql2 = 'update `ddlh_coin` set sPrice=?,sRightAddCount=sRightAddCount+1,utime=now() where id=?'
                                                doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                                    console.log(symbol, '空单追击,更新数据库, ok')
                                                }).catch(e => {
                                                    console.error(symbol, '空单追击,更新数据库', e)
                                                })
                                                sell(client, symbol, coinInfo[0].rightPpAmount, -1)
                                                // 清空高低点
                                                sPriceMax[symbol] = 0
                                                sPriceMin[symbol] = 0
                                            }
                                        }
                                    } else {
                                        //逆势补仓
                                        if (coinInfo[0].sErrorAddCount < coinInfo[0].errorAddMax) {
                                            let rates = coinInfo[0].errorAddBl.split(',')
                                            let rate = rates[coinInfo[0].sErrorAddCount] * 0.001 * coinInfo[0].fkRate
                                            if (coinInfo[0].sPrice < shortPos[0].ep) {
                                                coinInfo[0].sPrice = shortPos[0].ep
                                            }
                                            if (price > coinInfo[0].sPrice * (1 + rate) && price > shortPos[0].ep && price < sPriceMax[symbol] * (1 - 0.001 * coinInfo[0].backRate)) {
                                                let amount = coinInfo[0].fristAmount * 2 ** coinInfo[0].lErrorAddCount;
                                                pLog(`${symbol} 空单逆势补仓 下单记录价格:${price} 补仓下单数量:${amount} 补仓次数:${coinInfo[0].sErrorAddCount + 1}`)
                                                //更新库
                                                let sql2 = 'update `ddlh_coin` set sPrice=?,sErrorAddCount=sErrorAddCount+1,utime=now() where id=?'
                                                doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                                    console.log(symbol, '空单逆势补仓，更新数据库, ok')
                                                }).catch(e => {
                                                    console.error(symbol, '空单逆势补仓，更新数据库', e)
                                                })
                                                sell(client, symbol, amount, -1)
                                                // 清空高低点
                                                sPriceMax[symbol] = 0
                                                sPriceMin[symbol] = 0
                                            }
                                        }
                                    }
                                }
                                //回调止盈 且 覆盖手续费
                                if (price < shortPos[0].ep * (1 - 0.001 * coinInfo[0].rightAddBl) && price > sPriceMin[symbol] * (1 + 0.001 * coinInfo[0].backRate)) {
                                    pLog(`${symbol} 多单回调止盈 记录价格:${price} 下单数量:${shortPos[0].pa} 收益:${shortPos[0].up}`)
                                    //更新数据库
                                    let sql2 = 'update `ddlh_coin` set sPrice=?,totalIncome=totalIncome+?,utime=now() where id=?'
                                    doDb(sql2, [`${price}`, shortPos[0].up, `${coinInfo[0].id}`]).then(res2 => {
                                        console.log('空单，回调止盈，更新数据库, ok')
                                    }).catch(e => {
                                        console.error('空单，回调止盈，更新数据库', e)
                                    })
                                    sell_close(client, symbol, shortPos[0].pa, -1)
                                }
                                //浮亏锁仓 + 解锁收益
                                if (shortPos[0].up < -(coinInfo[0].lockAmount * coinInfo[0].unLockCount + coinInfo[0].unLockIncome)) {
                                    let lInfo = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                    let lAmount = 0;
                                    if (lInfo.lengt > 0) {
                                        lAmount = lInfo[0].pa
                                    }
                                    if (lAmount < shortPos[0].pa) {
                                        let amount = shortPos[0].pa - lAmount
                                        pLog(`${symbol} 空单浮亏达标锁仓开多 记录价格:${price} 下单数量:${amount}`)
                                        buy(client, symbol, amount, -1)
                                        // 更新数据库
                                        let sql2 = 'update `ddlh_coin` set lPrice=?,lockStatus=1,utime=now() where id=?'
                                        doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                            console.log(symbol, '空单浮亏达标锁仓开多，更新数据库, ok')
                                        }).catch(e => {
                                            console.error(symbol, '空单浮亏达标锁仓开多，更新数据库', e)
                                        })
                                    }
                                }
                            } else {
                                //未持仓 开首单
                                if (OpenOrderDate[symbol] == undefined || Date.now() - OpenOrderDate[symbol] > 500) {
                                    OpenOrderDate[symbol] = Date.now()
                                    //多单开仓
                                    if (ma90m1[symbol] == 'S' && ma90s1[symbol] == 'S') {
                                        pLog(`${symbol} 空单开仓 下单记录价格:${price} 下单数量:${coinInfo[0].fristAmount}`)
                                        sell(client, symbol, coinInfo[0].fristAmount, -1)
                                        // 持久化更新数据库
                                        let sql2 = 'update `ddlh_coin` set sPrice=?,sRightAddCount=0,sErrorAddCount=0,utime=now() where id=?'
                                        doDb(sql2, [`${price}`, `${coinInfo[0].id}`]).then(res2 => {
                                            console.log(symbol, '首单开空,更新数据库, ok')
                                        }).catch(e => {
                                            console.error(symbol, '首单开空,更新数据库', e)
                                        })
                                        // 清空高低点
                                        sPriceMax[symbol] = 0
                                        sPriceMin[symbol] = 0
                                    }
                                }
                            }
                        }
                    }
                }

                //解锁
                //=====查询排在最前面的一个锁仓的币种=====
                let coinInfoUnLock = symbolDatas.filter(v => v.status == 1 && v.lockStatus == 1)
                if (DodoDate[symbol] == undefined || Date.now() - DodoDate[symbol] > 10) {
                    DodoDate[symbol] = Date.now()
                    if (coinInfoUnLock.length > 0) {
                        // 拿出当前锁仓的交易对
                        let lockSymbol = coinInfoUnLock[0].symbol
                        // 检测是否满足解锁条件
                        // 锁仓当前正在运行的币种

                    }
                }
                //logshow
                if (LogShowDate == null || Date.now() - LogShowDate > 60 * 1000) {
                    LogShowDate = Date.now()
                    console.log(logShow, pos, ma90s1, ma90m1)
                }

            }
        });
    }).catch(err => {
        console.log(err)
    })
})
app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})
