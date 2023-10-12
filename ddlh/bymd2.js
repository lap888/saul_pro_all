/* 登顶量化 志在巅峰 漫步人生路 v5 + 盈利网格 + 多币种最多16个 4个一波运行
 * 变异马丁
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-05 20:31:31 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-07-27 21:05:09
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

const apiKey = 'U1eEWSnaLoPldncwQa1LHScMI91uIasAqIUl98hKToAPC3G3lFUv48gPUe7BVWTs'
const apiSecret = 'lVzGE1Z3fDBQOScmUNDh9Ge30zRY5U0JvQUMyzQyblSoWXu68EmtymY1VYo4rEgn'

const myUid = 1001
let quantityPrecision = []
let pricePrecision = []
let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const port = '30022'

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
let sarm = {}
let sarm1 = {}
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
                    symbolDatas[i].unLockCount = symbolDatas[i].unLockCount + 0.6
                    symbolDatas[i].unLockIncome = symbolDatas[i].unLockIncome + unLockIncome
                }
                if (lockStatus) {
                    symbolDatas[i].lockStatus = 1
                }
            }
            if (action == 'SHORT') {
                symbolDatas[i].sPrice = price
                if (isJs) {
                    symbolDatas[i].unLockCount = symbolDatas[i].unLockCount + 0.6
                    symbolDatas[i].unLockIncome = symbolDatas[i].unLockIncome + unLockIncome
                }
                if (lockStatus) {
                    symbolDatas[i].lockStatus = 1
                }
            }
        }
    })
}


client.exchangeInfo().then(ex => {
    let exInfo = ex.data.symbols
    exInfo.forEach(e => {
        quantityPrecision[e.symbol] = e.quantityPrecision;
        e.filters.map((c) => {
            if (c.filterType == 'PRICE_FILTER') {
                if (c.tickSize.toString().split('.').length > 1) {
                    pricePrecision[e.symbol] = c.tickSize.toString().split('.')[1].length;

                } else {
                    pricePrecision[e.symbol] = 0
                }
            }
        })
    })
    //
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
        let sql = `select * from md_coin where uId=${myUid} order by id`
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
                SymbolDataArrys.push(`${v.symbol.toLowerCase()}@ticker`)
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
                    // 查询 库里配置 变化
                    if (DbDate == null || Date.now() - DbDate > 1000) {
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
                    // 实时 更新计算 持仓价格
                    updateIncome()
                    // 每 5秒 更新持仓
                    if (UpdatePosDate == null || Date.now() - UpdatePosDate > 5000) {
                        UpdatePosDate = Date.now()
                        getAccount(client)
                    }
                    // 核心业务 逻辑处理                         
                    if (DodoDate[symbol] == undefined || Date.now() - DodoDate[symbol] > 50) {
                        DodoDate[symbol] = Date.now()
                        // =====查询排在最前面的一个未锁仓的币种=====       
                        let coinInfo = symbolDatas.filter(v => v.status == 1 && v.lockStatus == 0)
                        coinInfo = coinInfo.filter((v, i) => i < 1)
                        let curSymbol = ''
                        if (coinInfo.length > 0) {
                            coinInfo.forEach(vInfo => {
                                // 拿出当前应该运行的交易对
                                curSymbol = vInfo.symbol
                                if (symbol == curSymbol) {
                                    //查询 1s kline 和 1m kline 拿 ma90
                                    if (kTimeDate[symbol] == undefined || Date.now() - kTimeDate[symbol] > 0) {
                                        let d1 = new Date()
                                        let d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)
                                        kTimeDate[symbol] = d2.getTime()
                                        let _symbol = symbol.replace(1000, '')
                                        let ishave1000 = symbol.includes(1000)
                                        let _price = symbolHyPrice[symbol]
                                        if (ishave1000) {
                                            _price = _price / 1000
                                        }
                                        records_xh(sclient, _symbol, '1m', 1000).then(k => {
                                            ma90m[symbol] = TA.EMA(k, 90)
                                            let ma90mLast = _N(ma90m[symbol][ma90m[symbol].length - 1], 8)
                                            ma90m1[symbol] = _price > ma90mLast ? 'L' : 'S'

                                            sarm[symbol] = TA.SAR(k)
                                            let lastsar = sarm[symbol][sarm[symbol].length - 1]
                                            sarm1[symbol] = _price > lastsar ? 'L' : 'S'
                                            logShow[`${symbol}_ma90m`] = `ma90sLast=${ma90mLast} | symbolHyPrice[symbol]=${_price} | hyPrice=${symbolHyPrice[symbol]} | action=${ma90m1[symbol]}`
                                        }).catch(err => {
                                            console.log(symbol, '1m', err)
                                        })
                                    }
                                    // 多单完整处理流程
                                    if (vInfo.doAction == 'L') {
                                        let longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                        if (longPos.length > 0 && longPos[0].pa != 0) {
                                            // 更新价格高低点 + 更新收益
                                            {
                                                if (lPriceMax[symbol] == 0 || lPriceMax[symbol] == undefined) {
                                                    lPriceMax[symbol] = symbolHyPrice[symbol]
                                                } else {
                                                    if (symbolHyPrice[symbol] > lPriceMax[symbol]) {
                                                        lPriceMax[symbol] = symbolHyPrice[symbol]
                                                    }
                                                }
                                                if (lPriceMin[symbol] == 0 || lPriceMin[symbol] == undefined) {
                                                    lPriceMin[symbol] = symbolHyPrice[symbol]
                                                } else {
                                                    if (symbolHyPrice[symbol] < lPriceMin[symbol]) {
                                                        lPriceMin[symbol] = symbolHyPrice[symbol]
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
                                                if (vInfo.lErrorAddCount < vInfo.errorAddMax) {
                                                    let rates = vInfo.errorAddBl.split(',')
                                                    let rate = rates[vInfo.lErrorAddCount] * 0.001 * vInfo.fkRate
                                                    if (vInfo.lPrice > longPos[0].ep) {
                                                        vInfo.lPrice = longPos[0].ep
                                                    }
                                                    if (symbolHyPrice[symbol] < vInfo.lPrice * (1 - rate) && symbolHyPrice[symbol] > lPriceMin[symbol] * (1 + 0.001 * vInfo.backRate)) {
                                                        OpenOrderDate0[symbol] = Date.now()
                                                        let _amount = vInfo.fristAmount * 2 ** vInfo.lErrorAddCount;
                                                        let amount = _N(_amount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                        pLog(`${symbol} 多单补仓 下单记录价格:${symbolHyPrice[symbol]} 补仓下单数量:${amount} 补仓价值:${_amount} 补仓次数:${vInfo.lErrorAddCount + 1}`)
                                                        //更新库
                                                        let sql2 = 'update `md_coin` set lPrice=?,lErrorAddCount=lErrorAddCount+1,utime=now() where id=?'
                                                        doDb(sql2, [`${symbolHyPrice[symbol]}`, `${vInfo.id}`]).then(res2 => {
                                                            console.log('补仓，更新数据库, ok')
                                                        }).catch(e => {
                                                            console.error('补仓，更新数据库', e)
                                                        })
                                                        updatePosAndSymbol(symbol, 'L', longPos[0].pa + amount, symbolHyPrice[symbol], false)
                                                        buy(client, symbol, amount, -1).catch(e => {
                                                            console.log(symbol, e)
                                                        })
                                                        return;
                                                    }
                                                }
                                            }
                                            //回调止盈 且 覆盖手续费 
                                            if (longPos[0].pa > 0 && symbolHyPrice[symbol] > longPos[0].ep * (1 + 0.001 * vInfo.incomeRate) && (Date.now() - OpenOrderDate0[symbol] > nextOrderWait || OpenOrderDate0[symbol] == undefined)) {
                                                OpenOrderDate0[symbol] = Date.now()
                                                pLog(`${symbol} 多单止盈 记录价格:${symbolHyPrice[symbol]} 下单数量:${longPos[0].pa} 收益:${longPos[0].up}`)
                                                let sql2 = `update md_coin set lPrice=?,totalIncome=totalIncome+?,lErrorAddCount=0,utime=now() where id=?`
                                                doDb(sql2, [`${symbolHyPrice[symbol]}`, longPos[0].up, `${vInfo.id}`]).then(res2 => {
                                                    console.log(symbol, '多单，止盈，更新数据库, ok')
                                                }).catch(e => {
                                                    console.error(symbol, '多单，止盈，更新数据库', e)
                                                })
                                                buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                                updatePosAndSymbol(symbol, 'L', 0, symbolHyPrice[symbol], false)

                                                lIncomeMax[symbol] = 0
                                                return;
                                            }
                                            //浮亏锁仓 + 解锁收益
                                            if (longPos[0].up + vInfo.unLockIncome < -vInfo.lockAmount * vInfo.unLockCount && (Date.now() - OpenOrderDate0[symbol] > 1000 * 5 || OpenOrderDate0[symbol] == undefined)) {
                                                let sInfo = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                                let sAmount = 0;
                                                if (sInfo.length > 0) {
                                                    sAmount = sInfo[0].pa
                                                }
                                                // let maxAmount = _N(vInfo.totalAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                let doAmount = longPos[0].pa //Math.min(longPos[0].pa, maxAmount)
                                                if (sAmount < doAmount) {
                                                    let amount = doAmount - sAmount
                                                    amount = _N(amount, quantityPrecision[symbol])
                                                    pLog(`${symbol} 多单浮亏${longPos[0].up}达标，锁仓开空 | unLockCount=${vInfo.unLockCount}|lockAmount=${vInfo.lockAmount} 记录价格:${symbolHyPrice[symbol]} 下单数量:${amount}`)
                                                    OpenOrderDate0[symbol] = Date.now()
                                                    updatePosAndSymbol(symbol, 'S', doAmount, symbolHyPrice[symbol], false, true)
                                                    // 标记多单浮亏导致锁仓
                                                    let sql2 = 'update `md_coin` set sPrice=?,lockStatus=1,lErrorAddCount=?,sErrorAddCount=?,utime=now() where id=?'
                                                    doDb(sql2, [`${symbolHyPrice[symbol]}`, 0, 0, `${vInfo.id}`]).then(res2 => {
                                                        console.log('多单浮亏达标锁仓开空，更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error('多单浮亏达标锁仓开空，更新数据库', e)
                                                    })
                                                    sell(client, symbol, amount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                }
                                                return;
                                            }
                                        } else {
                                            //未持仓 开首单
                                            if ((OpenForderDate[symbol] == undefined || Date.now() - OpenForderDate[symbol] > 1000) && (longPos.length <= 0 || (longPos.length > 0 && longPos[0].pa == 0))) {
                                                //多单开仓
                                                if (vInfo.doAction == 'L') {
                                                    OpenForderDate[symbol] = Date.now()
                                                    let amount = _N(vInfo.fristAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                    pLog(`${symbol} 多单开仓 下单记录价格:${symbolHyPrice[symbol]} 下单数量:${amount} 下单价值:${vInfo.fristAmount}`)
                                                    // 持久化更新数据库
                                                    let sql2 = 'update `md_coin` set lPrice=?,lErrorAddCount=0,utime=now() where id=?'
                                                    doDb(sql2, [`${symbolHyPrice[symbol]}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log('更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error('更新数据库', e)
                                                    })
                                                    updatePosAndSymbol(symbol, 'L', amount, symbolHyPrice[symbol], false)
                                                    buy(client, symbol, amount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    // 清空高低点
                                                    lPriceMax[symbol] = 0
                                                    lPriceMin[symbol] = 0
                                                    lIncomeMax[symbol] = 0
                                                }
                                            }
                                        }
                                    }
                                    //=== ===
                                    // 空单完整处理流程
                                    if (vInfo.doAction == 'S') {
                                        let shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                        if (shortPos.length > 0 && shortPos[0].pa != 0) {
                                            // 更新价格高低点 更新收益
                                            {
                                                if (sPriceMax[symbol] == 0 || sPriceMax[symbol] == undefined) {
                                                    sPriceMax[symbol] = symbolHyPrice[symbol]
                                                } else {
                                                    if (symbolHyPrice[symbol] > sPriceMax[symbol]) {
                                                        sPriceMax[symbol] = symbolHyPrice[symbol]
                                                    }
                                                }
                                                if (sPriceMin[symbol] == 0 || sPriceMin[symbol] == undefined) {
                                                    sPriceMin[symbol] = symbolHyPrice[symbol]
                                                } else {
                                                    if (symbolHyPrice[symbol] < lPriceMin[symbol]) {
                                                        sPriceMin[symbol] = symbolHyPrice[symbol]
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
                                                if (vInfo.sErrorAddCount < vInfo.errorAddMax) {
                                                    let rates = vInfo.errorAddBl.split(',')
                                                    let rate = rates[vInfo.sErrorAddCount] * 0.001 * vInfo.fkRate
                                                    if (vInfo.sPrice < shortPos[0].ep) {
                                                        vInfo.sPrice = shortPos[0].ep
                                                    }
                                                    if (symbolHyPrice[symbol] > vInfo.sPrice * (1 + rate) && symbolHyPrice[symbol] < sPriceMax[symbol] * (1 - 0.001 * vInfo.backRate)) {
                                                        OpenOrderDate1[symbol] = Date.now()
                                                        let _amount = vInfo.fristAmount * (2 ** vInfo.sErrorAddCount);
                                                        let amount = _N(_amount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                        pLog(`${symbol} 空单补仓 下单记录价格:${symbolHyPrice[symbol]} 补仓数量:${amount} 补仓价值:${_amount}u 补仓次数:${vInfo.sErrorAddCount + 1}`)
                                                        //更新库
                                                        let sql2 = 'update `md_coin` set sPrice=?,sErrorAddCount=sErrorAddCount+1,utime=now() where id=?'
                                                        doDb(sql2, [`${symbolHyPrice[symbol]}`, `${vInfo.id}`]).then(res2 => {
                                                            console.log(symbol, '空单逆势补仓，更新数据库, ok')
                                                        }).catch(e => {
                                                            console.error(symbol, '空单逆势补仓，更新数据库', e)
                                                        })
                                                        updatePosAndSymbol(symbol, 'S', shortPos[0].pa + amount, symbolHyPrice[symbol], false)
                                                        sell(client, symbol, amount, -1).catch(e => {
                                                            console.log(symbol, e)
                                                        })
                                                        return;
                                                    }
                                                }
                                            }
                                            //回调止盈
                                            if (shortPos[0].pa > 0 && symbolHyPrice[symbol] < shortPos[0].ep * (1 - 0.001 * vInfo.incomeRate) && (Date.now() - OpenOrderDate1[symbol] > nextOrderWait || OpenOrderDate1[symbol] == undefined)) {
                                                OpenOrderDate1[symbol] = Date.now()
                                                pLog(`${symbol} 空单止盈 记录价格:${symbolHyPrice[symbol]} 下单数量:${shortPos[0].pa} 收益:${shortPos[0].up}`)

                                                //更新数据库
                                                let sql2 = `update md_coin set sPrice=?,totalIncome=totalIncome+?,sErrorAddCount=0,utime=now() where id=?`
                                                doDb(sql2, [`${symbolHyPrice[symbol]}`, shortPos[0].up, `${vInfo.id}`]).then(res2 => {
                                                    console.log('空单，回调止盈，更新数据库, ok')
                                                }).catch(e => {
                                                    console.error('空单，回调止盈，更新数据库', e)
                                                })
                                                sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                                updatePosAndSymbol(symbol, 'S', 0, symbolHyPrice[symbol], false)

                                                sIncomeMax[symbol] = 0
                                                return;
                                            }
                                            //浮亏锁仓 + 解锁收益
                                            if (shortPos[0].up + vInfo.unLockIncome < -vInfo.lockAmount * vInfo.unLockCount && (Date.now() - OpenOrderDate1[symbol] > 1000 * 5 || OpenOrderDate1[symbol] == undefined)) {
                                                let lInfo = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                                let lAmount = 0;
                                                if (lInfo.length > 0) {
                                                    lAmount = lInfo[0].pa
                                                }
                                                let doAmount = shortPos[0].pa
                                                if (lAmount < doAmount) {
                                                    let amount = doAmount - lAmount
                                                    amount = _N(amount, quantityPrecision[symbol])
                                                    pLog(`${symbol} 空单浮亏${shortPos[0].up}达标锁仓 |unLockCount=${vInfo.unLockCount}|lockAmount=${vInfo.lockAmount}，开多 记录价格:${symbolHyPrice[symbol]} 下单数量:${amount}`)
                                                    OpenOrderDate1[symbol] = Date.now()
                                                    updatePosAndSymbol(symbol, 'L', doAmount, symbolHyPrice[symbol], false, true)
                                                    // 更新数据库
                                                    let sql2 = 'update `md_coin` set lPrice=?,lockStatus=1,lErrorAddCount=?,sErrorAddCount=?,utime=now() where id=?'
                                                    doDb(sql2, [`${symbolHyPrice[symbol]}`, 0, 0, `${vInfo.id}`]).then(res2 => {
                                                        console.log(symbol, '空单浮亏达标锁仓开多，更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error(symbol, '空单浮亏达标锁仓开多，更新数据库', e)
                                                    })
                                                    buy(client, symbol, amount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    return;
                                                }
                                            }
                                        } else {
                                            //未持仓 开首单 空
                                            if ((OpenForderDate[symbol] == undefined || Date.now() - OpenForderDate[symbol] > 1000) && (shortPos.length <= 0 || (shortPos.length > 0 && shortPos[0].pa == 0))) {
                                                OpenForderDate[symbol] = Date.now()
                                                if (vInfo.doAction == 'S') {
                                                    let amount = _N(vInfo.fristAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                    pLog(`${symbol} 空单开仓 下单记录价格:${symbolHyPrice[symbol]} 下单数量:${amount} 下单价值:${vInfo.fristAmount}u`)
                                                    updatePosAndSymbol(symbol, 'S', amount, symbolHyPrice[symbol], false)
                                                    // 持久化更新数据库
                                                    let sql2 = 'update `md_coin` set sPrice=?,sErrorAddCount=0,utime=now() where id=?'
                                                    doDb(sql2, [`${symbolHyPrice[symbol]}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log(symbol, '首单开空,更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error(symbol, '首单开空,更新数据库', e)
                                                    })
                                                    sell(client, symbol, amount, -1).catch(e => {
                                                        console.log(symbol, e)
                                                    })
                                                    // 清空高低点
                                                    sPriceMax[symbol] = 0
                                                    sPriceMin[symbol] = 0
                                                    sIncomeMax[symbol] = 0
                                                }
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    }
                    // =====监控 解锁锁仓 的 币种=====
                    if (DodoDate1[symbol] == undefined || Date.now() - DodoDate1[symbol] > 0.55 * 1000) {
                        DodoDate1[symbol] = Date.now()
                        let coinInfoUnLock = symbolDatas.filter(v => v.status == 1 && v.lockStatus == 1)
                        if (coinInfoUnLock.length > symbolDatas.length - 1) {
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
                                        let lIncome = longPos[0].up
                                        printIncomeInfo = `多单收益:${lIncome}`
                                        //大于持仓价值既可以解锁
                                        let mIncome = vInfoUnlock.lockAmount
                                        if (lIncome > mIncome) {
                                            OpenOrderDate1[symbol] = Date.now()
                                            //解锁多单
                                            pLog(`${symbol} 解锁 多单平仓 记录价格:${symbolHyPrice[symbol]} 收益:${lIncome} 数量:${longPos[0].pa}`)
                                            buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            updatePosAndSymbol(symbol, 'L', 0, symbolHyPrice[symbol], true, false, mIncome * 0.9)
                                            //更新数据库
                                            let sql2 = `update md_coin set lPrice=?,unLockCount=unLockCount+0.6,unLockIncome=unLockIncome+?,totalIncome=totalIncome+?,lockStatus=0,utime=now() where id=?`
                                            doDb(sql2, [`${symbolHyPrice[symbol]}`, lIncome * 0.9, lIncome, `${vInfoUnlock.id}`]).then(res2 => {
                                                console.log('解锁，多单平仓, ok')
                                            }).catch(e => {
                                                console.error('解锁，多单平仓', e)
                                            })

                                            lIncomeMax[symbol] = 0
                                            return
                                        }
                                    }
                                    if (shortPos.length > 0) {
                                        let mIncome = 0
                                        mIncome = vInfoUnlock.lockAmoun
                                        let sIncome = shortPos[0].up
                                        printIncomeInfo += ` | 空单收益:${sIncome}`
                                        if (sIncome > mIncome) {
                                            OpenOrderDate0[symbol] = Date.now()
                                            //解锁空单
                                            pLog(`${symbol} 解锁 空单平仓 记录价格:${symbolHyPrice[symbol]} 收益:${sIncome} 数量:${shortPos[0].pa}`)
                                            sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            updatePosAndSymbol(symbol, 'S', 0, symbolHyPrice[symbol], true, false, mIncome * 0.9)
                                            //更新数据库
                                            let sql2 = `update md_coin set sPrice=?,unLockCount=unLockCount+0.6,sErrorAddCount=0,unLockIncome=unLockIncome+?,totalIncome=totalIncome+?,lockStatus=0,utime=now() where id=?`
                                            doDb(sql2, [`${symbolHyPrice[symbol]}`, sIncome * 0.9, sIncome, `${vInfoUnlock.id}`]).then(res2 => {
                                                console.log('解锁，空单平仓, ok')
                                            }).catch(e => {
                                                console.error('解锁，空单平仓', e)
                                            })

                                            sIncomeMax[symbol] = 0
                                            return
                                        }
                                    }
                                    logShow[`待解仓交易对:${lockSymbol}`] = printIncomeInfo
                                }
                            });
                        }
                    }
                    // 日志 打印
                    if (LogShowDate == null || Date.now() - LogShowDate > 60 * 1000) {
                        LogShowDate = Date.now()
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
})



app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})
