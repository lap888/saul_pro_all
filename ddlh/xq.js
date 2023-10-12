/* 登顶量化 滚雪球 小资金
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-05 20:31:31 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-08-16 19:45:23
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
const { Future, XhSpot, axios, records_xh, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')


const apiKey = 'U1eEWSnaLoPldncwQa1LHScMI91uIasAqIUl98hKToAPC3G3lFUv48gPUe7BVWTs'
const apiSecret = 'lVzGE1Z3fDBQOScmUNDh9Ge30zRY5U0JvQUMyzQyblSoWXu68EmtymY1VYo4rEgn'
const myUid = 1005
const doAc = 'S'

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
let symbolDatas2 = []
let symbolDatasBlack = []
let symbolHyPrice = {}
let kTimeDate = {}
let DbDate = null
let UpdatePosDate = null
let OpenOrderDate0 = {}
let OpenOrderDate1 = {}

let OpenForderDate = {}
let DodoDate = {}
let LogShowDate = null
let logShow = {}
let ma90s = {}
let ma90m = {}
let sarm = {}
let sarm1 = {}
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
let pricePrecision = []
let quantityPrecision = []
let SymbolsEx = []
process.on('uncaughtException', (error, source) => {
    console.log('未捕获到的异常=>', '错误信息:', error.message, '堆栈信息:', error.stack)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}

function getAccount(client) {
    client.account().then(response => {
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
                        let dInfo = { "s": item1.symbol, "pa": item1.positionAmt, "pp": 0, "ep": item1.entryPrice, "cr": 0, "up": income, "pp": pp, "mt": "cross", "iw": "0", "ps": "LONG", "ma": "USDT" }
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
                        let dInfo = { "s": item1.symbol, "pa": Math.abs(item1.positionAmt), "pp": 0, "ep": item1.entryPrice, "cr": 0, "up": income, "pp": pp, "mt": "cross", "iw": "0", "ps": "SHORT", "ma": "USDT" }
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
function sendmsg(msg, fromid = '23342514255@chatroom') {
    axios.post(`http://49.233.134.249:30099/api/sendmsg`, {
        msg: msg,
        fromid: fromid
    }).then(r => {
        console.log('推送消息成功')
    }).catch(e => {
        console.log(e)
    })
}
function updatePosAndSymbol(symbol, action, amount, price, lIncome = 0) {
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
                symbolDatas[i].lIncome = lIncome
                symbolDatas[i].lRightAddCount = symbolDatas[i].lRightAddCount + 1
            }
            if (action == 'SHORT') {
                symbolDatas[i].sPrice = price
                symbolDatas[i].sIncome = lIncome
                symbolDatas[i].sRightAddCount = symbolDatas[i].sRightAddCount + 1
            }
        }
    })
}

client.exchangeInfo().then(async response => {
    SymbolsEx = response.data.symbols;
    SymbolsEx.map((v, i) => {
        let index = symbolDatasBlack.findIndex(v => v.symbol == v)
        if (index == -1 && v.symbol.includes('USDT') && !v.symbol.includes('BUSD') && !v.symbol.includes('_') && !v.symbol.includes('1') && !v.symbol.includes('10') && !v.symbol.includes('100') && !v.symbol.includes('1000')) {
            symbolDatas2.push(v.symbol)
        }

        quantityPrecision[v.symbol] = v.quantityPrecision;
        v.filters.map((c) => {
            if (c.filterType == 'LOT_SIZE') {
                // SymbolData[`stepSize_${symbol}`] = Number(c.stepSize)
            }
            if (c.filterType == 'PRICE_FILTER') {
                if (c.tickSize.toString().split('.').length > 1) {
                    pricePrecision[v.symbol] = c.tickSize.toString().split('.')[1].length;

                } else {
                    pricePrecision[v.symbol] = 0

                }
            }
        })
    });

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
                        res.a.P[0]['pp'] = res.a.P[0]['ep'] * res.a.P[0]['pa']
                        if (index < 0) {
                            pos.push(res.a.P[0])
                        } else {
                            pos.splice(index, 1)
                            pos.push(res.a.P[0])
                        }
                        let sql = "insert into xq_pos(`uid`, `symbol`, `ep`, `up`, `pa`, `pp`, `price`) values(?,?,?,?,?,?,?)"
                        let price = Number(symbolHyPrice[res.a.P[0]['s']] == undefined ? 0 : symbolHyPrice[res.a.P[0]['s']])
                        doDb(sql, [myUid, res.a.P[0]['s'], res.a.P[0]['ep'], res.a.P[0]['up'], res.a.P[0]['pa'], res.a.P[0]['pp'], price]).then(dbCoin => {
                            if (res.a.P[0]['pa'] == 0 || res.a.P[0]['ep'] == 0) {
                                let sql2 = 'update `xq_coin` set lIncome=0,sIncome=0,lRightAddCount=0,sRightAddCount=0,utime=now() where id=? and symbol=?'
                                doDb(sql2, [myUid, `${res.a.P[0]['s']}`]).then(res2 => {
                                    console.log('清仓==>,更新数据库, ok')
                                    //撤销订单
                                }).catch(e => {
                                    console.error('清仓==>,更新数据库', e)
                                })
                                client.openOrders({ symbol: res.a.P[0]['s'] }).then(pos_hy => {
                                    pos_hy = pos_hy.data;
                                    if (pos_hy.length > 0) {
                                        pos_hy.map(v => {
                                            client.calAllOrder(res.a.P[0]['s'], { orderId: v.orderId.toString() }).then(res => {
                                                console.log(`清仓撤销订单`)
                                            }).catch(err => {
                                                console.log(`撤销订单异常`, err)
                                            })
                                        })
                                    }
                                })
                            }
                        })
                        console.log('更新持仓=>', res.a.P[0])
                    }
                }
            }
        });
        //
        // 查询 配置 全部参数 where status=1
        let sql = `select * from xq_coin where uId=${myUid} order by ons desc`
        doDb(sql, []).then(dbCoin => {
            let _dbCoin = JSON.stringify(dbCoin)
            if (_dbCoin.startsWith('{')) {
                symbolDatas = []
                symbolDatas.push(dbCoin)
            } else {
                symbolDatas = dbCoin
            }
            let SymbolDataArrys = []
            symbolDatas2.map(v => {
                SymbolDataArrys.push(`${v.toLowerCase()}@ticker`)
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
                    // 每 5秒 更新持仓
                    if (UpdatePosDate == null || Date.now() - UpdatePosDate > 2500) {
                        UpdatePosDate = Date.now()
                        getAccount(client)
                    }
                    // 实时 更新计算 持仓价格
                    // updateIncome()
                    // 核心业务 逻辑处理                         
                    // =====查询排在最前面的一个未锁仓的币种=====       
                    let coinInfo = symbolDatas.filter(v => v.status == 1)
                    coinInfo = coinInfo.filter((v, i) => i < 8)
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
                                    client.records(symbol, '15m', 1000).then(k => {
                                        ma90m[symbol] = TA.EMA(k, 26)
                                        let kp = k[k.length - 2]
                                        let kp2 = k[k.length - 3]
                                        let ma90mLast = _N(ma90m[symbol][ma90m[symbol].length - 1], 8)
                                        ma90m1[symbol] = symbolHyPrice[symbol] > ma90mLast && kp.Close > ma90mLast ? 'L' : symbolHyPrice[symbol] < ma90mLast && kp.Close < ma90mLast ? 'S' : 'N'

                                        sarm[symbol] = TA.SAR(k)
                                        let lastsar = sarm[symbol][sarm[symbol].length - 1]
                                        let lastsar2 = sarm[symbol][sarm[symbol].length - 2]
                                        let lastsar3 = sarm[symbol][sarm[symbol].length - 3]

                                        sarm1[symbol] = kp.Open > lastsar2 && kp2.Close < lastsar3 ? 'L' : kp.Open < lastsar2 && kp2.Close > lastsar3 ? 'S' : 'N'

                                        logShow[`${symbol}_ma90m`] = `ma90sLast=${ma90mLast} | price=${symbolHyPrice[symbol]} | action=${ma90m1[symbol]}`
                                        logShow[`${symbol}_sar1m`] = `kp=${kp.Open} | lastsar=${lastsar} | sarbefor=${lastsar2} | price=${symbolHyPrice[symbol]} | action=${sarm1[symbol]}`
                                    }).catch(err => {
                                        console.log(symbol, '1m', err)
                                    })
                                }
                                // 多单完整处理流程
                                let longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                let shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                if (longPos.length > 0 && longPos[0].pa != 0 && (Date.now() - OpenForderDate[symbol] > nextOrderWait || OpenForderDate[symbol] == undefined)) {
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
                                        //顺势追 逆势加 回调0.1%止盈
                                        if (vInfo.lRightAddCount < vInfo.rightAddMax) {
                                            //计算收益差
                                            //10倍前滚仓
                                            if (vInfo.lPrice < longPos[0].ep) {
                                                vInfo.lPrice = longPos[0].ep
                                            }
                                            let isdol = symbolHyPrice[symbol] > vInfo.lPrice * (1 + 0.0015) && longPos[0].pp < 10 * vInfo.rightPpAmount
                                            if ((longPos[0].up - vInfo.lIncome > vInfo.rightPpAmount / vInfo.level || isdol) && longPos[0].up > 0 && (Date.now() - OpenOrderDate0[symbol] > nextOrderWait || OpenOrderDate0[symbol] == undefined)) {
                                                OpenOrderDate0[symbol] = Date.now()
                                                let amount = _N(vInfo.rightPpAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                //更新缓存
                                                updatePosAndSymbol(symbol, 'L', longPos[0].pa + amount, price, longPos[0].up)
                                                //追击
                                                pLog(`${symbol} 多单追仓 下单记录价格:${price} 平铺下单数量:${amount} 平铺次数:${vInfo.lRightAddCount}`)
                                                buy(client, symbol, amount, -1).then(r => {
                                                    longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                                    sendmsg(`[庆祝]滚仓提醒:${symbol} 多单追仓 \r\n下单记录价格:${price} \r\n下单数量:${amount} \r\n滚仓次数:${vInfo.lRightAddCount} \r\n持仓收益:${_N(longPos[0].up, 4)} \r\n时间:${DateFormat()}`, '43142195603@chatroom')
                                                    //更新库
                                                    let sql2 = 'update `xq_coin` set lIncome=?,lPrice=?,lRightAddCount=lRightAddCount+1,utime=now() where id=?'
                                                    doDb(sql2, [longPos[0].up, `${price}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log('追击,更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error('追击,更新数据库', e)
                                                    })
                                                    //挂止损                                               
                                                    client.openOrders({ symbol: symbol }).then(pos_hy => {
                                                        pos_hy = pos_hy.data;
                                                        let pos_hy_l = []
                                                        pos_hy.map(v => {
                                                            if (v.positionSide == "LONG") {
                                                                v.orderId = (BigInt(v.orderId)).toString()
                                                                pos_hy_l.push(v)
                                                            }
                                                        })
                                                        longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                                        let num = pricePrecision[symbol]
                                                        let addprice = _N(vInfo.lossAmount / longPos[0].pa, num)
                                                        let newprice = _N(Math.abs(longPos[0].ep - addprice), num)
                                                        let newprice2 = _N(longPos[0].ep, num)
                                                        if (longPos[0].up > 2 * vInfo.rightPpAmount) {
                                                            newprice2 = _N(Math.abs(longPos[0].ep + addprice), num)
                                                        }
                                                        if (pos_hy_l.length > 0) {
                                                            pos_hy_l.map(v => {
                                                                client.calAllOrder(symbol, { orderId: v.orderId.toString() }).then(res => {
                                                                    console.log(`撤销订单`)
                                                                    if (newprice < longPos[0].ep) {
                                                                        client.newOrder(symbol, 'SELL', 'LONG', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                            console.log(symbol, `市价,平多,挂止损单成功=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                        }).catch(err => {
                                                                            console.log(symbol, `市价,平多,挂止损单异常=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                        });
                                                                    } else {
                                                                        console.log('无爆仓价')
                                                                    }
                                                                    // 设置保本止盈
                                                                    if (longPos[0].up > vInfo.rightPpAmount) {
                                                                        // TAKE_PROFIT_MARKET
                                                                        client.newOrder(symbol, 'SELL', 'LONG', 'TAKE_PROFIT', { stopPrice: newprice2, quantity: longPos[0].pa }).then(res => {
                                                                            console.log(symbol, `市价,平多,挂止盈单成功=>数量:${longPos[0].pa} | 价格:${newprice2} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                        }).catch(err => {
                                                                            console.log(symbol, `市价,平多,挂止盈单异常=>数量:${longPos[0].pa} | 价格:${newprice2} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                        });
                                                                    }
                                                                }).catch(err => {
                                                                    console.log(`撤销订单异常`, err)
                                                                })
                                                            })
                                                        } else {
                                                            if (newprice < longPos[0].ep) {
                                                                client.newOrder(symbol, 'SELL', 'LONG', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                    console.log(symbol, `市价,平多,挂止损单成功=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                }).catch(err => {
                                                                    console.log(symbol, `市价,平多,挂止损单异常=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                });
                                                            } else {
                                                                console.log('无爆仓价')
                                                            }
                                                            // 设置保本止盈
                                                            if (longPos[0].up > vInfo.rightPpAmount) {
                                                                // TAKE_PROFIT_MARKET
                                                                client.newOrder(symbol, 'SELL', 'LONG', 'TAKE_PROFIT', { stopPrice: newprice2, quantity: longPos[0].pa }).then(res => {
                                                                    console.log(symbol, `市价,平多,挂止盈单成功=>数量:${longPos[0].pa} | 价格:${newprice2} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                }).catch(err => {
                                                                    console.log(symbol, `市价,平多,挂止盈单异常=>数量:${longPos[0].pa} | 价格:${newprice2} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                });
                                                            }
                                                        }
                                                    })
                                                }).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                                return;
                                            }
                                        }
                                    }
                                    //回调50%止盈一半
                                    if (longPos[0].pa > 0 && longPos[0].up < lIncomeMax[symbol] / 2 && (Date.now() - OpenOrderDate0[symbol] > 2 * 1000 || OpenOrderDate0[symbol] == undefined)) {
                                        OpenOrderDate0[symbol] = Date.now()
                                        pLog(`${symbol} 多单回调止盈 记录价格:${price} 下单数量:${longPos[0].pa / 2} 收益:${longPos[0].up / 2}`)
                                        updatePosAndSymbol(symbol, 'L', 0, price, 0)
                                        let sql2 = `update xq_coin set lPrice=?,lIncome=0,utime=now() where id=?`
                                        doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                            console.log(symbol, '多单，回调止盈，更新数据库, ok')
                                        }).catch(e => {
                                            console.error(symbol, '多单，回调止盈，更新数据库', e)
                                        })
                                        buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        lIncomeMax[symbol] = 0
                                        return;
                                    }
                                    //回调止盈 且 覆盖手续费 休息10分钟
                                    if (longPos[0].pa > 0 && longPos[0].up > 5 * vInfo.lossAmount && (Date.now() - OpenOrderDate0[symbol] > 2 * 1000 || OpenOrderDate0[symbol] == undefined)) {
                                        OpenOrderDate0[symbol] = Date.now()
                                        pLog(`${symbol} 多单回调止盈 记录价格:${price} 下单数量:${longPos[0].pa} 收益:${longPos[0].up}`)
                                        updatePosAndSymbol(symbol, 'L', 0, price, 0)
                                        let sql2 = `update xq_coin set lPrice=?,lRightAddCount=0,lErrorAddCount=0,lIncome=0,utime=now() where id=?`
                                        doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                            console.log(symbol, '多单，回调止盈，更新数据库, ok')
                                        }).catch(e => {
                                            console.error(symbol, '多单，回调止盈，更新数据库', e)
                                        })
                                        buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        lIncomeMax[symbol] = 0
                                        return;
                                    }
                                } else {
                                    //未持仓 开首单
                                    if ((OpenForderDate[symbol] == undefined || Date.now() - OpenForderDate[symbol] > 1000 * 15 * 60) && (longPos.length <= 0 || (longPos.length > 0 && longPos[0].pa == 0))) {
                                        //多单开仓 ma90m1[symbol] == 'L' &&
                                        if (sarm1[symbol] == 'L') {
                                            OpenForderDate[symbol] = Date.now()
                                            let amount = _N(vInfo.fristAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                            pLog(`${symbol}首单 多单开仓 下单记录价格:${price} 下单数量:${amount}`)
                                            sendmsg(`[爱心]开仓提醒:${symbol}首单 \r\n多单开仓 \r\n下单记录价格:${price} \r\n下单数量:${amount} \r\n时间:${DateFormat()}`)
                                            updatePosAndSymbol(symbol, 'L', amount, price, 0)
                                            // 持久化更新数据库
                                            let sql2 = 'update `xq_coin` set lIncome=0,lPrice=?,lRightAddCount=0,lErrorAddCount=0,utime=now() where id=?'
                                            doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                console.log('更新数据库, ok')
                                            }).catch(e => {
                                                console.error('更新数据库', e)
                                            })
                                            buy(client, symbol, amount, -1).then(r => {
                                                //挂止损                                               
                                                client.openOrders({ symbol: symbol }).then(pos_hy => {
                                                    pos_hy = pos_hy.data;
                                                    let pos_hy_l = []
                                                    pos_hy.map(v => {
                                                        if (v.positionSide == "LONG") {
                                                            v.orderId = (BigInt(v.orderId)).toString()
                                                            pos_hy_l.push(v)
                                                        }
                                                    })
                                                    longPos = pos.filter(v => v.s == symbol && v.ps == 'LONG')
                                                    let num = pricePrecision[symbol]//getFloatNum(longPos[0].ep)
                                                    let addprice = _N(vInfo.lossAmount / longPos[0].pa, num)
                                                    let newprice = _N(Math.abs(longPos[0].ep - addprice), num)
                                                    if (pos_hy_l.length > 0) {
                                                        pos_hy_l.map(v => {
                                                            client.calAllOrder(symbol, { orderId: v.orderId.toString() }).then(res => {
                                                                console.log(`撤销订单`)
                                                                if (newprice < longPos[0].ep) {
                                                                    client.newOrder(symbol, 'SELL', 'LONG', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                        console.log(symbol, `市价,平多,挂止损单成功=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                    }).catch(err => {
                                                                        console.log(symbol, `市价,平多,挂止损单异常=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                    });
                                                                } else {
                                                                    console.log('无爆仓价')
                                                                }
                                                            }).catch(err => {
                                                                console.log(`撤销订单异常`, err)
                                                            })
                                                        })
                                                    } else {
                                                        if (newprice < longPos[0].ep) {
                                                            client.newOrder(symbol, 'SELL', 'LONG', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                console.log(symbol, `市价,平多,挂止损单成功=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                            }).catch(err => {
                                                                console.log(symbol, `市价,平多,挂止损单异常=>数量:${longPos[0].pa} | 价格:${newprice} | ${longPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                            });
                                                        } else {
                                                            console.log('无爆仓价')
                                                        }
                                                    }
                                                })
                                            }).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            // 空单存在要平空
                                            if (shortPos.length > 0 && shortPos[0].pa != 0) {
                                                sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                            }
                                            // 清空高低点
                                            lPriceMax[symbol] = 0
                                            lPriceMin[symbol] = 0
                                            lIncomeMax[symbol] = 0
                                        }
                                    }
                                }
                                //=== ===
                                // 空单完整处理流程
                                if (shortPos.length > 0 && shortPos[0].pa != 0 && (Date.now() - OpenForderDate[symbol] > nextOrderWait || OpenForderDate[symbol] == undefined)) {
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
                                        if (vInfo.sRightAddCount < vInfo.rightAddMax) {
                                            //收益追加
                                            if (vInfo.sPrice > shortPos[0].ep) {
                                                vInfo.sPrice = shortPos[0].ep
                                            }
                                            let isdos = symbolHyPrice[symbol] < vInfo.sPrice * (1 - 0.0015) && shortPos[0].pp < 10 * vInfo.rightPpAmount
                                            if ((shortPos[0].up - vInfo.sIncome > vInfo.rightPpAmount / vInfo.level || isdos) && shortPos[0].up > 0 && (Date.now() - OpenOrderDate1[symbol] > nextOrderWait || OpenOrderDate1[symbol] == undefined)) {
                                                OpenOrderDate1[symbol] = Date.now()
                                                //追击
                                                let amount = _N(vInfo.rightPpAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                                updatePosAndSymbol(symbol, 'S', shortPos[0].pa + amount, price, shortPos[0].up)
                                                pLog(`${symbol} 空单追仓 下单记录价格:${price} 平铺下单数量:${amount} 平铺次数:${vInfo.sRightAddCount}`)
                                                sell(client, symbol, amount, -1).then(r => {
                                                    shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                                    sendmsg(`[庆祝]滚仓提醒:${symbol} \r\n空单追仓 \r\n下单记录价格:${price} \r\n下单数量:${amount} \r\n滚仓次数:${vInfo.sRightAddCount} \r\n持仓收益:${_N(shortPos[0].up, 4)} \r\n时间:${DateFormat()}`, '43142195603@chatroom')
                                                    //更新库
                                                    let sql2 = 'update `xq_coin` set sIncome=?,sPrice=?,sRightAddCount=sRightAddCount+1,utime=now() where id=?'
                                                    doDb(sql2, [shortPos[0].up, `${price}`, `${vInfo.id}`]).then(res2 => {
                                                        console.log(symbol, '空单追击,更新数据库, ok')
                                                    }).catch(e => {
                                                        console.error(symbol, '空单追击,更新数据库', e)
                                                    })
                                                    //挂止损                                               
                                                    client.openOrders({ symbol: symbol }).then(pos_hy => {
                                                        pos_hy = pos_hy.data;
                                                        let pos_hy_s = []
                                                        pos_hy.map(v => {
                                                            if (v.positionSide == "SHORT") {
                                                                v.orderId = (BigInt(v.orderId)).toString()
                                                                pos_hy_s.push(v)
                                                            }
                                                        })
                                                        shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                                        let num = pricePrecision[symbol]
                                                        let addprice = _N(vInfo.lossAmount / shortPos[0].pa, num)
                                                        let newprice = _N(Math.abs(shortPos[0].ep + addprice), num)
                                                        let newprice2 = _N(shortPos[0].ep, num)
                                                        if (shortPos[0].up > 2 * vInfo.rightPpAmount) {
                                                            if (shortPos[0].ep > addprice) {
                                                                newprice2 = _N(Math.abs(shortPos[0].ep - addprice), num)
                                                            }
                                                        }
                                                        if (pos_hy_s.length > 0) {
                                                            pos_hy_s.map(v => {
                                                                client.calAllOrder(symbol, { orderId: v.orderId.toString() }).then(res => {
                                                                    console.log(`撤销订单`)
                                                                    client.newOrder(symbol, 'BUY', 'SHORT', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                        console.log(symbol, `市价,平空,挂止损单成功=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                    }).catch(err => {
                                                                        console.log(symbol, `市价,平空,挂止损单异常=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                    });
                                                                    // TAKE_PROFIT_MARKET
                                                                    if (shortPos[0].up > vInfo.rightPpAmount) {
                                                                        client.newOrder(symbol, 'BUY', 'SHORT', 'TAKE_PROFIT', { stopPrice: newprice2, quantity: shortPos[0].pa }).then(res => {
                                                                            console.log(symbol, `市价,平空,挂止盈单成功=>数量:${shortPos[0].pa} | 价格:${newprice2} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                        }).catch(err => {
                                                                            console.log(symbol, `市价,平空,挂止盈单异常=>数量:${shortPos[0].pa} | 价格:${newprice2} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                        });
                                                                    }
                                                                }).catch(err => {
                                                                    console.log(`撤销订单异常`, err)
                                                                })
                                                            })
                                                        } else {
                                                            client.newOrder(symbol, 'BUY', 'SHORT', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                console.log(symbol, `市价,平空,挂止损单成功=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                            }).catch(err => {
                                                                console.log(symbol, `市价,平空,挂止损单异常=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                            });
                                                            // 设置保本止盈
                                                            if (shortPos[0].up > vInfo.rightPpAmount) {
                                                                // TAKE_PROFIT_MARKET
                                                                client.newOrder(symbol, 'BUY', 'SHORT', 'TAKE_PROFIT', { stopPrice: newprice2, quantity: shortPos[0].pa }).then(res => {
                                                                    console.log(symbol, `市价,平空,挂止盈单成功=>数量:${shortPos[0].pa} | 价格:${newprice2} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                }).catch(err => {
                                                                    console.log(symbol, `市价,平空,挂止盈单异常=>数量:${shortPos[0].pa} | 价格:${newprice2} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                });
                                                            }
                                                        }
                                                    })
                                                }).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                                return;
                                            }
                                        }
                                    }
                                    //回调50%止盈一半
                                    if (shortPos[0].pa > 0 && shortPos[0].up < sIncomeMax[symbol] / 2 && (Date.now() - OpenOrderDate0[symbol] > 2 * 1000 || OpenOrderDate1[symbol] == undefined)) {
                                        OpenOrderDate1[symbol] = Date.now()
                                        pLog(`${symbol} 空单回调止盈一半 记录价格:${price} 下单数量:${shortPos[0].pa / 2} 收益:${shortPos[0].up / 2}`)
                                        updatePosAndSymbol(symbol, 'S', 0, price, 0)
                                        //更新数据库
                                        let sql2 = `update xq_coin set sPrice=?,sIncome=0,utime=now() where id=?`
                                        doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                            console.log('空单，回调止盈一半，更新数据库, ok')
                                        }).catch(e => {
                                            console.error('空单，回调止盈一半，更新数据库', e)
                                        })
                                        sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        sIncomeMax[symbol] = 0
                                        return;
                                    }
                                    //回调止盈 且 覆盖手续费 
                                    if (shortPos[0].pa > 0 && shortPos[0].up > 5 * vInfo.lossAmount && (Date.now() - OpenOrderDate0[symbol] > 2 * 1000 || OpenOrderDate1[symbol] == undefined)) {
                                        OpenOrderDate1[symbol] = Date.now()
                                        pLog(`${symbol} 空单回调止盈 记录价格:${price} 下单数量:${shortPos[0].pa} 收益:${shortPos[0].up}`)
                                        updatePosAndSymbol(symbol, 'S', 0, price, 0)
                                        //更新数据库
                                        let sql2 = `update xq_coin set sPrice=?,sRightAddCount=0,sErrorAddCount=0,sIncome=0,utime=now() where id=?`
                                        doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                            console.log('空单，回调止盈，更新数据库, ok')
                                        }).catch(e => {
                                            console.error('空单，回调止盈，更新数据库', e)
                                        })
                                        sell_close(client, symbol, shortPos[0].pa, -1).catch(e => {
                                            console.log(symbol, e)
                                        })
                                        sIncomeMax[symbol] = 0
                                        return;
                                    }
                                } else {
                                    //未持仓 开首单 空
                                    if ((OpenForderDate[symbol] == undefined || Date.now() - OpenForderDate[symbol] > 60 * 15 * 1000) && (shortPos.length <= 0 || (shortPos.length > 0 && shortPos[0].pa == 0))) {
                                        if (sarm1[symbol] == 'S') {
                                            OpenForderDate[symbol] = Date.now()
                                            let amount = _N(vInfo.fristAmount / symbolHyPrice[symbol], quantityPrecision[symbol])
                                            updatePosAndSymbol(symbol, 'S', amount, price, 0)
                                            pLog(`${symbol} 空单开仓 下单记录价格:${price} 下单数量:${amount}`)
                                            sendmsg(`[爱心]开仓提醒:${symbol} \r\n空单开仓 \r\n下单记录价格:${price} \r\n下单数量:${amount} \r\n时间:${DateFormat()}`)
                                            // 持久化更新数据库
                                            let sql2 = 'update `xq_coin` set sPrice=?,sIncome=0,sRightAddCount=0,sErrorAddCount=0,utime=now() where id=?'
                                            doDb(sql2, [`${price}`, `${vInfo.id}`]).then(res2 => {
                                                console.log(symbol, '首单开空,更新数据库, ok')
                                            }).catch(e => {
                                                console.error(symbol, '首单开空,更新数据库', e)
                                            })
                                            sell(client, symbol, amount, -1).then(r => {
                                                //挂止损                                               
                                                client.openOrders({ symbol: symbol }).then(pos_hy => {
                                                    pos_hy = pos_hy.data;
                                                    let pos_hy_s = []
                                                    pos_hy.map(v => {
                                                        if (v.positionSide == "SHORT") {
                                                            v.orderId = (BigInt(v.orderId)).toString()
                                                            pos_hy_s.push(v)
                                                        }
                                                    })
                                                    shortPos = pos.filter(v => v.s == symbol && v.ps == 'SHORT')
                                                    let num = pricePrecision[symbol]
                                                    let addprice = _N(vInfo.lossAmount / shortPos[0].pa, num)
                                                    let newprice = _N(Math.abs(shortPos[0].ep + addprice), num)
                                                    if (pos_hy_s.length > 0) {
                                                        pos_hy_s.map(v => {
                                                            client.calAllOrder(symbol, { orderId: v.orderId.toString() }).then(res => {
                                                                console.log(`撤销订单`)
                                                                client.newOrder(symbol, 'BUY', 'SHORT', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                                    console.log(symbol, `市价,平空,挂止损单成功=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                                }).catch(err => {
                                                                    console.log(symbol, `市价,平空,挂止损单异常=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                                });
                                                            }).catch(err => {
                                                                console.log(`撤销订单异常`, err)
                                                            })
                                                        })
                                                    } else {
                                                        client.newOrder(symbol, 'BUY', 'SHORT', 'STOP_MARKET', { stopPrice: newprice, closePosition: true }).then(res => {
                                                            console.log(symbol, `市价,平空,挂止损单成功=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`)

                                                        }).catch(err => {
                                                            console.log(symbol, `市价,平空,挂止损单异常=>数量:${shortPos[0].pa} | 价格:${newprice} | ${shortPos[0].ep} | num=${num} | addprice=${addprice} | newprice=${newprice}`, err)

                                                        });
                                                    }
                                                })
                                            }).catch(e => {
                                                console.log(symbol, e)
                                            })
                                            // 多单存在要平多
                                            if (longPos.length > 0 && longPos[0].pa != 0) {
                                                buy_close(client, symbol, longPos[0].pa, -1).catch(e => {
                                                    console.log(symbol, e)
                                                })
                                            }
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
            });
        }).catch(err => {
            console.log(err)
        })
    }).catch(e => {
        console.log('e=>', e)
    })
})



app.get('/api/notice', (req, res) => {
    let data = { code: 200, message: 'ok' }
    data.pos = pos
    data.log = logShow
    res.json(data)
})
app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})
