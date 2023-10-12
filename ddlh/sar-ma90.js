/* sar & ma90 暴富策略
 * @Author: topbrids@gmail.com 
 * @Date: 2022-12-04 17:14:08 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-04-05 20:42:50
 */
const prod = false;
const express = require('express')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Future, XhSpot, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')
const process = require('process');

// const apiKey = 'bN6n50Jjc8R50ob0qwQimgn74zCOXanRMAZbXluYDghfBnUWju59lVCD2Be4zqfQ'
// const apiSecret = 'nc5DDcgE1tPPnVthi2hio63smc4eVdkhsYbnkI1GLOfslTdYElBpEZtn54SHXh4H'

// const apiKey = '6HBfkhKbXMY26knOZBN948NXUMK4Wx4OHtdIVUrWjDjXIGtAZge2XlnlWHRA3g3y'
// const apiSecret = 'DoeGWvvW56cNB1reMkh520hMSSKiaQHfeAH0rTKuJoAhkl7VjWZ5wi7F3ytPVoiL'

const apiKey = 'KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00'
const apiSecret = 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO'


let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const port = '30019'

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const cs = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })

let backLog = {}
let isFristRun = true
let isFristRun2 = true
let isFristRun3 = true
let account = 0

let dt = {};
let dt2 = {};
let dt3 = null;
let SymbolsEx = [];
let SymbolData = {}
let SymbolDatas = ['ETHUSDT']
let gridCount = 20;
let userPositionLong = []
let userPositionShort = []
let doOrderAmount = 20
let doOrderRate = 10

let stopLossRate = 0.01 * 0.01;//千分之三五止损

let refSarSymbol = {}

let isFl = true

let gridPosL1 = _G('gridPosL1') == undefined ? {} : JSON.parse(_G('gridPosL1'))
let gridPosL2 = _G('gridPosL2') == undefined ? {} : JSON.parse(_G('gridPosL2'))
let gridPosS1 = _G('gridPosS1') == undefined ? {} : JSON.parse(_G('gridPosS1'))
let gridPosS2 = _G('gridPosS2') == undefined ? {} : JSON.parse(_G('gridPosS2'))

process.on('uncaughtException', (error, source) => {
    console.log('未捕获到的异常=>', '错误信息:', error.message, '堆栈信息:', error.stack)
});
/**
 * 
 * @param {*} msg 
 */
function pLog(msg) {
    Log(msg)
    console.log(msg)
}
/**
 * 
 * @param {*} client 
 */
async function getAccount(client, symbol = '', isPrint = true) {
    userPositionLong = []
    userPositionShort = []
    let response = await client.account()
    let balance = `${response.data.totalWalletBalance}|${response.data.totalUnrealizedProfit}|${response.data.availableBalance}`
    response.data.positions.forEach((item1) => {
        if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
            let posL = { symbol: item1.symbol, positionAmt: Number(item1.positionAmt), entryPrice: Number(item1.entryPrice), positionSide: 'LONG' }
            userPositionLong.push(posL)
        } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
            let posS = { symbol: item1.symbol, positionAmt: Number(item1.positionAmt), entryPrice: Number(item1.entryPrice), positionSide: 'SHORT' }
            userPositionShort.push(posS)
        }
    })
    if (symbol != '') {
        SymbolDatas.map(vs => {
            let uL = userPositionLong.findIndex(v => v.symbol == vs)
            if (uL < 0) {
                gridPosL1[vs] = []
                gridPosL2[vs] = []
                _G('gridPosL1', JSON.stringify(gridPosL1))
                _G('gridPosL2', JSON.stringify(gridPosL2))
            }
            let uS = userPositionShort.findIndex(v => v.symbol == vs)
            if (uS < 0) {
                gridPosS1[vs] = []
                gridPosS2[vs] = []
                _G('gridPosS1', JSON.stringify(gridPosS1))
                _G('gridPosS2', JSON.stringify(gridPosS2))
            }
        })
    } else {
        gridPosL1 = {}
        gridPosL2 = {}
        _G('gridPosL1', JSON.stringify(gridPosL1))
        _G('gridPosL2', JSON.stringify(gridPosL2))

        gridPosS1 = {}
        gridPosS2 = {}
        _G('gridPosS1', JSON.stringify(gridPosS1))
        _G('gridPosS2', JSON.stringify(gridPosS2))
    }
    _G('userPositionLong', JSON.stringify(userPositionLong))
    _G('userPositionShort', JSON.stringify(userPositionShort))
    if (isFl) {
        doOrderAmount = parseInt(Number(response.data.totalWalletBalance) * doOrderRate)
    } else {
        doOrderAmount = parseInt(Number(response.data.totalWalletBalance))
    }
    let pft = LogProfit() == null || LogProfit() == 'null' ? [{ income: 0 }] : LogProfit()
    if (Number(response.data.totalWalletBalance) >= (pft[pft.length - 1]).income) {
        account = _G('initAccount') == null || _G('initAccount') == 'null' ? response.data.totalWalletBalance : _G('initAccount');
        LogProfit(Number(response.data.totalWalletBalance) - account)
    }
    if (isPrint) {
        pLog(`${symbol} | 账户余额=>${balance}`)
    }

    return response;
}
/**
 * 
 * @param {*} ex 
 * @returns 
 */
function Refresh(ex, symbol) {
    let pricePrecision = 0;
    let quantityPrecision = 0;
    let tickerLen = 0;
    ex.map((v, i) => {
        if (v.symbol == symbol) {

            quantityPrecision = v.quantityPrecision;
            v.filters.map((c) => {
                if (c.filterType == 'LOT_SIZE') {
                    SymbolData[`stepSize_${symbol}`] = Number(c.stepSize)
                }
                if (c.filterType == 'PRICE_FILTER') {
                    tickerLen = (Number(c.tickSize).toString().split('.')[1]).length;
                    SymbolData[`tickSize_${symbol}`] = Number(c.tickSize)
                }
            })
            pricePrecision = tickerLen;
            SymbolData[`pricePrecision_${symbol}`] = tickerLen
            SymbolData[`quantityPrecision_${symbol}`] = quantityPrecision
        }
    });
    return SymbolData;
}
/**
 * 获取sar
 * @param {*} client 
 * @returns 
 */
async function getSar(client, price, symbol) {
    let record = await client.records(symbol, '15m', 500)
    let sar = TA.SAR(record, 0.02, 0.2, 0.02)
    let ma = TA.MA(record, 90)
    let ma90 = ma[ma.length - 1]
    let ema = TA.MA(record, 9)
    let ema9 = ema[ema.length - 1]
    let sar_data = [];
    // let ema_ma_data = [];
    // let es_count_l = [];
    // let es_count_s = [];
    for (let i = record.length; i > 20; i--) {
        if (sar[i - 1] > record[i - 1].Open && sar[i - 2] < record[i - 1].Open) {
            //多转空=>
            let data = { sar: sar[i - 1], diff: sar[i - 1] - sar[i - 2], low: record[i - 1].Low, high: record[i - 1].High, open: record[i - 1].Open, close: record[i - 1].Close, action: 'SELL', time: DateFormat(record[i - 1].Time), timeSpan: record[i - 1].Time }
            sar_data.push(data)
        }
        if (sar[i - 1] < record[i - 1].Open && sar[i - 2] > record[i - 1].Open) {
            //空转多=>
            let data = { sar: sar[i - 1], diff: sar[i - 2] - sar[i - 1], low: record[i - 1].Low, high: record[i - 1].High, open: record[i - 1].Open, close: record[i - 1].Close, action: 'BUY', time: DateFormat(record[i - 1].Time), timeSpan: record[i - 1].Time }
            sar_data.push(data)
        }
        // //ema ma交叉点
        // if (ema[i - 1] > ma[i - 1] && ema[i - 2] <= ma[i - 2]) {
        //     //多
        //     let data = { low: record[i - 2].Low, high: record[i - 2].High, action: 'BUY', time: DateFormat(record[i - 1].Time), timeSpan: record[i - 1].Time }
        //     ema_ma_data.push(data)
        // }
        // if (ema[i - 1] < ma[i - 1] && ema[i - 2] >= ma[i - 2]) {
        //     //空
        //     let data = { low: record[i - 2].Low, high: record[i - 2].High, action: 'SELL', time: DateFormat(record[i - 1].Time), timeSpan: record[i - 1].Time }
        //     ema_ma_data.push(data)
        // }
    }
    // let nowema = ema_ma_data[0]
    // for (let i = 0; i < sar_data.length; i++) {
    //     let s = sar_data[i];
    //     if (s.timeSpan > nowema.timeSpan && s.action == nowema.action) {
    //         if (s.action == 'BUY') {
    //             es_count_l.push(s)
    //         }
    //         if (s.action == 'SELL') {
    //             es_count_s.push(s)
    //         }
    //     }
    // }
    let totalDiff = _N(sar_data[0].diff, 6);
    SymbolData[`totalDiff_${symbol}`] = totalDiff;
    SymbolData[`gridStep_${symbol}`] = _N(totalDiff / gridCount, 6) < price * 0.0006 ? _N(price * 0.0006, 6) : _N(totalDiff / gridCount, 6) > price * 0.001 ? _N(price * 0.001, 6) : _N(totalDiff / gridCount, 6)
    //ma 多
    // let _long = nowema.action == 'BUY' ? es_count_l.length <= 1 : true
    let long = sar[sar.length - 3] > record[record.length - 2].Open && sar[sar.length - 2] < record[record.length - 2].Open //&& sar_data[0].open < sar_data[0].close; //&& ema9 > ma90;//|| (price > sar[sar.length - 1] && sar[sar.length - 1] < ma90 && ema9 > ma90 && ema91 <= ma901);
    //ma 空
    // let _short = nowema.action == 'SELL' ? es_count_s.length <= 1 : true
    let short = sar[sar.length - 3] < record[record.length - 2].Open && sar[sar.length - 2] > record[record.length - 2].Open //&& sar_data[0].open > sar_data[0].close;//&& ema9 < ma90;//|| (price < sar[sar.length - 1] && sar[sar.length - 1] > ma90 && ema9 < ma90 && ema91 >= ma901);
    let action = ''
    if (long) {
        action = 'BUY'
    } else if (short) {
        action = 'SELL'
    } else {
        action = '震荡'
    }
    // backLog[symbol] = `${symbol}=>sar:${sar_data[0].action} | action:${action} | 当前价:${_N(price, 2)} | 距离:${SymbolData[`gridStep_${symbol}`]} | diff:${totalDiff} | _long:${_long}&${es_count_l.length} | _short:${_short}&${es_count_s.length} | mm1:${_N(ma90, 2)} | mm2:${_N(ema9, 2)} | sard:${JSON.stringify(sar_data[0])}`
    backLog[symbol] = `${symbol}=>sar:${sar_data[0].action} | action:${action} | 当前价:${_N(price, 2)} | 距离:${SymbolData[`gridStep_${symbol}`]} | diff:${totalDiff} | mm1:${_N(ma90, 2)} | mm2:${_N(ema9, 2)} | sard:${JSON.stringify(sar_data[0])}`
    _G(`backLog`, JSON.stringify(backLog))
    let ddd = { action: action, price: price, ma90: ma90, ema9: ema9, sard: sar_data[0], sar: sar[sar.length - 1], time: record[record.length - 1].Time }
    refSarSymbol[`${symbol}`] = ddd;
    return ddd;
}
/**
 * 修改跟单人杠杆
 * @param {*} symbol 
 * @param {*} account 
 */
async function updateLeverage(symbol, account) {
    await client.leverage(symbol, account)
    pLog(`updateLeverage=>修改${symbol},杠杆:${account}`)
}
/**
 * 
 * @param {*} price 
 */
async function coreDo(client, symbol, price) {
    if (isFristRun) {
        isFristRun = false;
        if (isFristRun2) {
            isFristRun2 = false;
            //验证
            let newUser = await client.ifNewUser('WcsXtG5x');
            dt3 = Date.now()
            let acc = await getAccount(client, symbol)
            pLog(JSON.stringify(newUser.data))
            if (_G('initAccount') == null || _G('initAccount') == 'null') {
                let totalWalletBalance = Number(acc.data.totalWalletBalance);
                account = _G('initAccount') == null || _G('initAccount') == 'null' ? totalWalletBalance : _G('initAccount');
                _G('initAccount', totalWalletBalance)
                account = totalWalletBalance;
            } else {
                account = Number(_G('initAccount'));
            }
        }
    } else {
        if (!isFristRun) {
            Refresh(SymbolsEx, symbol)
            if (dt3 == null || Date.now() - dt3 > 60 * 1000) {
                dt3 = Date.now()
                //1m 刷新一次
                await getAccount(client, symbol, false)
            }
            let posL = userPositionLong.find(v => v.symbol == symbol && v.positionAmt != 0)
            let posS = userPositionShort.find(v => v.symbol == symbol && v.positionAmt != 0)
            if (posL != null) {
                if (gridPosL1[symbol] == undefined) {
                    gridPosL1[symbol] = []
                }
                if (gridPosL2[symbol] == undefined) {
                    gridPosL2[symbol] = []
                }
                _G('gridPosL1', JSON.stringify(gridPosL1))
                _G('gridPosL2', JSON.stringify(gridPosL2))
            }
            if (posS != null) {
                if (gridPosS1[symbol] == undefined) {
                    gridPosS1[symbol] = []
                }
                if (gridPosS2[symbol] == undefined) {
                    gridPosS2[symbol] = []
                }
                _G('gridPosS1', JSON.stringify(gridPosS1))
                _G('gridPosS2', JSON.stringify(gridPosS2))
            }
            //开单
            if (dt[`${symbol}`] == null || Date.now() - dt[`${symbol}`] > 1000) {
                dt[`${symbol}`] = Date.now();
                await getSar(client, price, symbol)
                //开仓
                if (dt2[`${symbol}`] == null || Date.now() - dt2[`${symbol}`] > 6 * 1000) {
                    if (refSarSymbol[`${symbol}`].action == 'BUY') {
                        if (posS != undefined && isFristRun3) {
                            isFristRun3 = false
                            pLog(`${symbol} | 空单 | 清仓 | ${price} | ${Math.abs(posS.positionAmt)}`)
                            await sell_close(client, symbol, Math.abs(posS.positionAmt), -1, price)
                            gridPosS1[symbol] = []
                            gridPosS2[symbol] = []
                            _G('gridPosS1', JSON.stringify(gridPosS1))
                            _G('gridPosS2', JSON.stringify(gridPosS2))
                            isFristRun3 = true
                        }
                        if (posL == undefined && isFristRun3) {
                            dt2[`${symbol}`] = Date.now();
                            //BUY
                            isFristRun3 = false;
                            let amount = doOrderAmount / price;
                            amount = amount < SymbolData[`stepSize_${symbol}`] ? SymbolData[`stepSize_${symbol}`] : amount;
                            amount = _N(amount, SymbolData[`quantityPrecision_${symbol}`])
                            pLog(`${symbol} | 多单 | 开仓 | ${price} | ${amount} | sp ${refSarSymbol[`${symbol}`].price}`)
                            await buy(client, symbol, amount, -1, price);
                            gridPosL1[symbol] = []
                            gridPosL2[symbol] = []
                            _G('gridPosL1', JSON.stringify(gridPosL1))
                            _G('gridPosL2', JSON.stringify(gridPosL2))
                            isFristRun3 = true;
                        }
                        dt[`${symbol}`] = Date.now();
                        return;
                    }
                    if (refSarSymbol[`${symbol}`].action == 'SELL') {
                        if (posL != undefined && isFristRun3) {
                            isFristRun3 = false
                            pLog(`${symbol} | 多单 | 清仓 | ${price} | ${Math.abs(posL.positionAmt)}`)
                            await buy_close(client, symbol, Math.abs(posL.positionAmt), -1, price)
                            gridPosL1[symbol] = []
                            gridPosL2[symbol] = []
                            _G('gridPosL1', JSON.stringify(gridPosL1))
                            _G('gridPosL2', JSON.stringify(gridPosL2))
                            isFristRun3 = true
                        }
                        if (posS == undefined && isFristRun3) {
                            dt2[`${symbol}`] = Date.now();
                            isFristRun3 = false
                            let amount = doOrderAmount / price;
                            amount = amount < SymbolData[`stepSize_${symbol}`] ? SymbolData[`stepSize_${symbol}`] : amount;
                            amount = _N(amount, SymbolData[`quantityPrecision_${symbol}`])
                            pLog(`${symbol} | 空单 | 开仓 | ${price} | ${amount} | sp ${refSarSymbol[`${symbol}`].price}`)
                            await sell(client, symbol, amount, -1, price);
                            gridPosS1[symbol] = []
                            gridPosS2[symbol] = []
                            _G('gridPosS1', JSON.stringify(gridPosS1))
                            _G('gridPosS2', JSON.stringify(gridPosS2))
                            isFristRun3 = true
                        }
                        dt[`${symbol}`] = Date.now();
                        return;
                    }
                }
                //持仓
                if (posL != undefined && refSarSymbol[`${symbol}`] != undefined) {
                    //保本清仓
                    if (price < Number(posL.entryPrice) && gridPosL1[symbol].length > 4) {
                        await getAccount(client, symbol)
                        posL = userPositionLong.find(v => v.symbol == symbol && v.positionAmt != 0)
                        if (posL != undefined && Math.abs(posL.positionAmt) > 0) {
                            pLog(`${symbol} | 多单 保本清仓 | ${price} | ${Math.abs(posL.positionAmt)}`)
                            await buy_close(client, symbol, Math.abs(posL.positionAmt), -1, price)
                            gridPosL1[symbol] = []
                            gridPosL2[symbol] = []
                            _G('gridPosL1', JSON.stringify(gridPosL1))
                            _G('gridPosL2', JSON.stringify(gridPosL2))
                            dt[`${symbol}`] = refSarSymbol[`${symbol}`].time + 15 * 60 * 1000;
                            return;
                        }
                    }

                    posL = userPositionLong.find(v => v.symbol == symbol && v.positionAmt != 0)
                    if (posL != undefined) {
                        let nowMyPrice = 0;
                        nowMyPrice = posL.entryPrice;
                        if (gridPosL1[symbol].length > 0) {
                            nowMyPrice = gridPosL1[symbol][gridPosL1[symbol].length - 1].price;
                        }
                        if (price > nowMyPrice + SymbolData[`gridStep_${symbol}`]) {
                            //正向减仓
                            let amount = _N((doOrderAmount / gridCount) / price, SymbolData[`quantityPrecision_${symbol}`]);
                            amount = amount < SymbolData[`stepSize_${symbol}`] ? SymbolData[`stepSize_${symbol}`] : amount;
                            amount = _N(amount, SymbolData[`quantityPrecision_${symbol}`])
                            // await getAccount(client, symbol)
                            // posL = userPositionLong.find(v => v.symbol == symbol && v.positionAmt != 0)
                            if (posL != undefined && Math.abs(Number(posL.positionAmt)) > amount) {
                                pLog(`${symbol} | 多单 | 正向减仓 | ${price} | ${amount}`)
                                if (gridPosS1[symbol].length > gridCount / 2 - 1) {
                                    let _amount = _N(Math.abs(Number(posL.positionAmt)) / 2, SymbolData[`quantityPrecision_${symbol}`])
                                    await buy_close(client, symbol, _amount, -1, price)
                                }

                                let gCount = gridPosL1[symbol].length + 1
                                gridPosL1[symbol].push({ symbol: symbol, gCount: gCount, amount: amount, price: price })
                                _G('gridPosL1', JSON.stringify(gridPosL1))
                                dt[`${symbol}`] = Date.now();
                                return;
                            }
                        }
                        if (gridPosL1[symbol].length > 4) {
                            //逆向减仓
                            let g2 = [];
                            gridPosL1[symbol].map(v => {
                                if (price <= v.price - SymbolData[`gridStep_${symbol}`]) {
                                    g2.push(v)
                                }
                            })
                            if (price > posL.entryPrice) {
                                if (g2.length > 0) {
                                    let _g2 = g2[0]
                                    let g3 = gridPosL2[symbol].find(v => v.gCount == _g2.gCount)
                                    if (g3 == undefined) {
                                        let amount = _N((doOrderAmount / gridCount) / price, SymbolData[`quantityPrecision_${symbol}`]) * 2;
                                        amount = amount < SymbolData[`stepSize_${symbol}`] ? SymbolData[`stepSize_${symbol}`] : amount;
                                        amount = _N(amount, SymbolData[`quantityPrecision_${symbol}`])
                                        // await getAccount(client, symbol)
                                        // posL = userPositionLong.find(v => v.symbol == symbol && v.positionAmt != 0)
                                        if (posL != undefined && Math.abs(Number(posL.positionAmt)) > amount) {
                                            pLog(`${symbol} | 多单 | 逆向减仓 | ${price} | ${amount}`)
                                            buy_close(client, symbol, amount, -1, price)
                                            let gCount = _g2.gCount
                                            gridPosL2[symbol].push({ symbol: symbol, gCount: gCount, amount: amount, price: price })
                                            _G('gridPosL2', JSON.stringify(gridPosL2))
                                            dt[`${symbol}`] = Date.now();
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (posS != undefined && refSarSymbol[`${symbol}`] != undefined) {
                    //保本清仓
                    if (price > Number(posS.entryPrice) && gridPosS1[symbol].length > 4) {
                        await getAccount(client, symbol)
                        posS = userPositionShort.find(v => v.symbol == symbol && v.positionAmt != 0)
                        if (posS != undefined && Math.abs(posS.positionAmt) > 0) {
                            pLog(`${symbol} | 空单 保本清仓 | ${price} | ${Math.abs(posS.positionAmt)}`)
                            await sell_close(client, symbol, Math.abs(posS.positionAmt), -1, price)
                            gridPosS1[symbol] = []
                            gridPosS2[symbol] = []
                            _G('gridPosS1', JSON.stringify(gridPosS1))
                            _G('gridPosS2', JSON.stringify(gridPosS2))
                            dt[`${symbol}`] = refSarSymbol[`${symbol}`].time + 15 * 60 * 1000;
                            return;
                        }
                    }

                    posS = userPositionShort.find(v => v.symbol == symbol && v.positionAmt != 0)
                    if (posS != undefined) {
                        let nowMyPrice = 0;
                        nowMyPrice = posS.entryPrice;
                        if (gridPosS1[symbol].length > 0) {
                            nowMyPrice = gridPosS1[symbol][gridPosS1[symbol].length - 1].price;
                        }
                        if (price < nowMyPrice - SymbolData[`gridStep_${symbol}`]) {
                            //正向减仓
                            let amount = _N((doOrderAmount / gridCount) / price, SymbolData[`quantityPrecision_${symbol}`]);
                            amount = amount < SymbolData[`stepSize_${symbol}`] ? SymbolData[`stepSize_${symbol}`] : amount;
                            amount = _N(amount, SymbolData[`quantityPrecision_${symbol}`])
                            // await getAccount(client, symbol)
                            // posS = userPositionShort.find(v => v.symbol == symbol && v.positionAmt != 0)
                            if (posS != undefined && Math.abs(Number(posS.positionAmt)) > amount) {
                                pLog(`${symbol} | 空单 | 正向减仓 | ${price} | ${amount}`)
                                // await sell_close(client, symbol, amount, -1, price)
                                if (gridPosS1[symbol].length > gridCount / 2 - 1) {
                                    let _amount = _N(Math.abs(Number(posS.positionAmt)) / 2, SymbolData[`quantityPrecision_${symbol}`])
                                    await sell_close(client, symbol, _amount, -1, price)
                                }
                                let gCount = gridPosS1[symbol].length + 1
                                gridPosS1[symbol].push({ symbol: symbol, gCount: gCount, amount: amount, price: price })
                                _G('gridPosS1', JSON.stringify(gridPosS1))
                                dt[`${symbol}`] = Date.now();
                                return;
                            }
                        }
                        if (gridPosS1[symbol].length > 4) {
                            //逆向减仓
                            let g2 = [];
                            gridPosS1[symbol].map(v => {
                                if (price >= v.price + SymbolData[`gridStep_${symbol}`]) {
                                    g2.push(v)
                                }
                            })
                            if (price < posS.entryPrice) {
                                if (g2.length > 0) {
                                    let _g2 = g2[0]
                                    let g3 = gridPosS2[symbol].find(v => v.gCount == _g2.gCount)
                                    if (g3 == undefined) {
                                        let amount = _N((doOrderAmount / gridCount) / price, SymbolData[`quantityPrecision_${symbol}`]) * 2;
                                        amount = amount < SymbolData[`stepSize_${symbol}`] ? SymbolData[`stepSize_${symbol}`] : amount;
                                        amount = _N(amount, SymbolData[`quantityPrecision_${symbol}`])
                                        // await getAccount(client, symbol)
                                        // posS = userPositionShort.find(v => v.symbol == symbol && v.positionAmt != 0)
                                        if (posS != undefined && Math.abs(Number(posS.positionAmt)) > amount) {
                                            pLog(`${symbol} | 空单 | 逆向减仓 | ${price} | ${amount}`)
                                            await sell_close(client, symbol, amount, -1, price)
                                            let gCount = _g2.gCount
                                            gridPosS2[symbol].push({ symbol: symbol, gCount: gCount, amount: amount, price: price })
                                            _G('gridPosS2', JSON.stringify(gridPosS2))
                                            dt[`${symbol}`] = Date.now();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    }
}

client.exchangeInfo().then(async response => {
    SymbolsEx = response.data.symbols;
    client.listenKeyPost().then(response => {
        let listenKey = response.data.listenKey;
        setInterval(() => {
            client.listenKeyPut().then(res => {
                // pLog(`延长listenkey,25分钟`)
            })
            client.exchangeInfo().then(res => {
                // pLog('刷新交易所币种精度')
                SymbolsEx = res.data.symbols;
            });
        }, 25 * 60 * 1000);
        //连接ws
        let wsRef = client.userData(listenKey, {
            open: () => {
                pLog('策略启动完成...')
                setInterval(() => {
                    wsRef.ws.send(JSON.stringify({ "ping": "1" }));
                }, 3 * 60 * 1000);
            },
            close: () => pLog('closed'),
            message: (msg) => {
                let res = JSON.parse(msg)
                //判断是否是心跳包返回的数据
                if (res.e == 'ACCOUNT_UPDATE') {
                    LogProfit(Number(res.a.B[0].wb) - account)
                    // pLog(`收益:${Number(res.a.B[0].wb) - account}`)
                    // pLog(`账户更新=>${JSON.stringify(res.a.B)}`)
                    res.a.P.map(v => {
                        if (Number(v.pa) >= 0 && v.ps == 'LONG') {
                            let posL = { symbol: v.s, positionAmt: Number(v.pa), entryPrice: Number(v.ep), positionSide: 'LONG' }
                            let isPos = userPositionLong.findIndex(v1 => v1.symbol == v.s)
                            if (isPos < 0) {
                                userPositionLong.push(posL)
                            } else {
                                userPositionLong.splice(isPos, 1)
                                userPositionLong.push(posL)
                            }
                            if (Number(v.pa) == 0) {
                                gridPosL1[v.s] = []
                                gridPosL2[v.s] = []
                                _G('gridPosL1', JSON.stringify(gridPosL1))
                                _G('gridPosL2', JSON.stringify(gridPosL2))
                            }

                        }
                        if (Number(v.pa) <= 0 && v.ps == 'SHORT') {
                            let posS = { symbol: v.s, positionAmt: Number(v.pa), entryPrice: Number(v.ep), positionSide: 'SHORT' }
                            let isPos = userPositionShort.findIndex(v1 => v1.symbol == v.s)
                            if (isPos < 0) {
                                userPositionShort.push(posS)
                            } else {
                                userPositionShort.splice(isPos, 1)
                                userPositionShort.push(posS)
                            }
                            if (Number(v.pa) == 0) {
                                gridPosS1[v.s] = []
                                gridPosS2[v.s] = []
                                _G('gridPosS1', JSON.stringify(gridPosS1))
                                _G('gridPosS2', JSON.stringify(gridPosS2))
                            }
                        }
                    })
                }
            }
        });
        // let dt1 = Date.now()
        // ['ethusdt@bookTicker','ethusdt@markPrice','ethusdt@ticker']
        let SymbolDataArrys = []
        SymbolDatas.map(v => {
            SymbolDataArrys.push(`${v.toLowerCase()}@markPrice@1s`)
        })
        // client.combinedStreams([`${SymbolData.symbol.toLowerCase()}@markPrice@1s`], {
        client.combinedStreams(SymbolDataArrys, {
            message: (msg) => {
                msg = JSON.parse(msg.toString());
                let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
                // let ms = `${msg.data.e} | ${msg.data.s} | ${price} | ${DateFormat(msg.data.E)}`
                // console.log(ms)
                coreDo(client, msg.data.s, Number(price))
            }
        });
    })
});

app.get("/api/dlog", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        Log(null)
        pLog(`日志已清空`)
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        pLog(`系统异常`)
        res.json(data)
    }
});
app.get("/api/logs", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let log = Log();
        r.data = log == null || log == 'null' ? [] : log.sort((a, b) => b.key - a.key);
        r.page = Number(r.page);
        r.pageSize = Number(r.pageSize);
        r.total = r.data.length;
        res.json(r);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        pLog(`系统异常`)
        res.json(data)
    }
});

app.get("/api/setLevel", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        await updateLeverage(r.symbol, r.account)
        res.json(r);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        pLog(`系统异常`)
        res.json(data)
    }
});

app.get("/api/profit", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        // let r = req.query
        data.data = LogProfit() == null ? [] : LogProfit()
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
app.get("/api/backLog", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        // let r = req.query
        data.data = _G('backLog') == null ? '' : _G('backLog')
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
app.get("/api/resetPft", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        _G('initAccount', null)
        LogProfit(null)
        if (_G('initAccount') == null || _G('initAccount') == 'null') {
            let acc = await getAccount(client)
            let totalWalletBalance = Number(acc.data.totalWalletBalance);
            account = _G('initAccount') == null || _G('initAccount') == 'null' ? totalWalletBalance : _G('initAccount');
            _G('initAccount', totalWalletBalance)
            account = totalWalletBalance;
        } else {
            account = Number(_G('initAccount'));
        }
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

//
app.get("/api/account", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        if (r.type == 'xh') {
            let acc = await cs.account({ recvWindow: 5000 });
            data.list = acc.data;
        } else {
            let acc1 = await client.account({ recvWindow: 5000 });
            data.list = acc1.data;
        }
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        pLog(`系统异常`)
        res.json(data)
    }
});

app.get('/api/coin/sellOne', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let coin = r.symbol;
        if (r.type == 'hy') {
            pLog(`${coin}合约平仓`)
            //多单 空单数量
            let acc = await client.account({ recvWindow: 5000 });
            acc.data.positions.map(v => {
                if (v.symbol == coin) {
                    if (Number(v.positionAmt) > 0) {
                        buy_close(client, v.symbol, Math.abs(Number(v.positionAmt)))
                    }
                    if (Number(v.positionAmt) < 0) {
                        sell_close(client, v.symbol, Math.abs(Number(v.positionAmt)))
                    }
                }
            });
        } else {
            pLog(`${coin}现货平仓`)
            let acc = await cs.account({ recvWindow: 5000 });
            acc.data.balances.map(async v1 => {
                coin = coin.replace('USDT', '')
                coin = coin.replace('BUSD', '')
                if (coin == v.asset && Number(v1.free) > 0 && Number(v1.locked) == 0 && v1.asset != 'USDT' && v1.asset != 'BNB') {
                    let right_size = 2;
                    let minQty = 0;
                    let MIN_NOTIONAL = 0;
                    SymbolsExXh.map((v) => {
                        if (v.symbol == `${v1.asset}USDT`) {
                            let filter = v.filters.find(x => x.filterType == 'LOT_SIZE')
                            let a = filter.minQty;
                            minQty = Number(a);
                            let filter1 = v.filters.find(x => x.filterType == 'MIN_NOTIONAL')
                            MIN_NOTIONAL = Number(filter1.minNotional);
                            let a1 = a.split('.')[1]
                            let a2 = a1.indexOf(1)
                            right_size = Number(a2 + 1)
                        }
                    });
                    let cur_market_price = Number((await cs.tickerPrice(`${v1.asset}USDT`, { recvWindow: 5000 })).data.price);
                    let amount = toSubNum(v1.free, right_size)
                    if (amount > minQty && cur_market_price * amount > MIN_NOTIONAL) {
                        sell_xh(cs, `${v1.asset}USDT`, amount).then(res => console.log(res))
                    }
                    await sleep(1000)
                }
            })
        }
        res.json(data)

    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        pLog(`API异常`)
        res.json(data)
    }
})

/**
 * 
 */
app.get('/api/coin/sellAll', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        if (r.type == 'hy') {
            //多单 空单数量
            let acc = await client.account({ recvWindow: 5000 });
            acc.data.positions.map(v => {
                if (Number(v.positionAmt) > 0) {
                    buy_close(client, v.symbol, Math.abs(Number(v.positionAmt)))
                }
                if (Number(v.positionAmt) < 0) {
                    sell_close(client, v.symbol, Math.abs(Number(v.positionAmt)))
                }
            });
        } else {
            let acc = await cs.account({ recvWindow: 5000 });
            acc.data.balances.map(async v1 => {
                if (Number(v1.free) > 0 && Number(v1.locked) == 0 && v1.asset != 'USDT' && v1.asset != 'BNB') {
                    let right_size = 2;
                    let minQty = 0;
                    let MIN_NOTIONAL = 0;
                    SymbolsExXh.map((v) => {
                        if (v.symbol == `${v1.asset}USDT`) {
                            let filter = v.filters.find(x => x.filterType == 'LOT_SIZE')
                            let a = filter.minQty;
                            minQty = Number(a);
                            let filter1 = v.filters.find(x => x.filterType == 'MIN_NOTIONAL')
                            MIN_NOTIONAL = Number(filter1.minNotional);
                            let a1 = a.split('.')[1]
                            let a2 = a1.indexOf(1)
                            right_size = Number(a2 + 1)
                        }
                    });
                    let cur_market_price = Number((await cs.tickerPrice(`${v1.asset}USDT`, { recvWindow: 5000 })).data.price);
                    let amount = toSubNum(v1.free, right_size)
                    if (amount > minQty && cur_market_price * amount > MIN_NOTIONAL) {
                        sell_xh(cs, `${v1.asset}USDT`, amount).then(res => console.log(res))
                    }
                    await sleep(1000)
                }
            })
        }
        res.json(data)

    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        pLog(`API异常`)
        res.json(data)
    }
})
/**
 * 
 */
app.get('/api/coin/getOrders', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        if (r.type == 'hy') {
            if (r.flag == '1') {
                let pos_hy1 = await client.openOrders({ symbol: r.coin, limit: 500 })
                pos_hy1.data.sort((a, b) => b.time - a.time)
                data.total = pos_hy1.length;
                data.list = JSON.parse(JSON.stringify(pos_hy1.data).replace(/orderId/g, 'key'));
            } else {
                // let pos_hy = await client.allOrders(r.coin, { limit: 500 })
                let pos_hy = await client.userTrades(r.coin, { limit: 500 })

                pos_hy.data.sort((a, b) => b.time - a.time)
                data.total = pos_hy.data.length;
                data.list = JSON.parse(JSON.stringify(pos_hy.data).replace(/id/g, 'key').replace(/skeye/g, 'side').replace(/positionSkeye/g, 'positionSide'));
            }
        }
        if (r.type == 'xh') {
            if (r.flag == '1') {
                let openOrders = await cs.openOrders({ symbol: r.coin })
                data.list = JSON.parse(JSON.stringify(openOrders.data).replace(/orderId/g, 'key'));
            } else {
                let allOrders = await cs.allOrders(r.coin, { limit: 500 })
                // let allOrders = await cs.myTrades(r.coin, { limit: 500 })
                allOrders.data.sort((a, b) => b.time - a.time)
                data.list = JSON.parse(JSON.stringify(allOrders.data).replace(/orderId/g, 'key'));
            }
        }
        res.json(data)
    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        pLog(`API异常`)
        res.json(data)
    }
})
app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})
