/* 接针策略 1秒上涨1%开空 1秒下跌1% 开多
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-23 15:46:09 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-04-27 21:42:15
 */

//BN
const { Future, TA, _G, _N, LogProfit, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const process = require('process');
const dev = true
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

// { 'rate': 1, 'doType': 1, 'action': 'N','amount':0 } rate=> 对应币种1s内波动百分比 1 指的是1%； doType=> 1 正向 2 反向； action=> N 多空都做 L 做多 S做空； amount=> 开单数量 单位u
let symbolSetting = {
    'BNBUSDT': { 'rate': 0.62, 'doType': 1, 'action': 'N', 'amount': 0, 'doAmount': 20, 'isSet': 0 },
    'BTCUSDT': { 'rate': 0.62, 'doType': 1, 'action': 'N', 'amount': 0, 'doAmount': 50, 'isSet': 0 },
    'ETHUSDT': { 'rate': 0.62, 'doType': 1, 'action': 'N', 'amount': 0, 'doAmount': 50, 'isSet': 0 },
    'TOMOUSDT': { 'rate': 0.62, 'doType': 2, 'action': 'N', 'amount': 0, 'doAmount': 0, 'isSet': 0 },
    'INJUSDT': { 'rate': 0.62, 'doType': 2, 'action': 'N', 'amount': 0, 'doAmount': 0, 'isSet': 0 },

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
let sDtTime = 60;
let sDt2 = {}
let winRate = 0.38;
let lossRate = 0.38;
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

function resetAmount(symbol, amount, price) {
    if (symbolSetting[symbol].isSet == 0) {
        symbolSetting[symbol].isSet = 1
        let _amount = _N(amount / price, quantityPrecision[symbol]);
        symbolSetting[symbol].amount = _amount
    }
}

function getAmount(symbol, amount, price) {
    symbolSetting[`${symbol}`]['amount'] = _N(amount / price, quantityPrecision[symbol]);
    return amount;
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
        if (index == -1 && !e.symbol.includes('BUSD') && !e.symbol.includes('_') && !e.symbol.includes('1') && !e.symbol.includes('10') && !e.symbol.includes('100') && !e.symbol.includes('1000')) {
            symbolDatas.push(e.symbol)
            symbolSetting[`${e.symbol}`] = symbolSetting[symbolDatas[0]]
        }
        if (isDoFlag == isDoNum) {
            client.listenKeyPost().then(response => {
                setInterval(() => {
                    client.listenKeyPut().then(res => {
                        console.log(`延长listenkey,25分钟`)
                    })
                }, 25 * 60 * 1000);
                // ['ethusdt@bookTicker','ethusdt@markPrice','ethusdt@ticker']
                let SymbolDataArrys = []
                symbolDatas.map(v => {
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
                        rPrice[symbol] = price = Number(price)
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
                        if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1 * 250) {
                            if (symbolAction[`${symbol}`].action == 'S' && errorCountS[symbol] < 5) {
                                if (rPrice[symbol] < symbolAction[`${symbol}`].price * (1 - winRate * 0.01)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    {
                                        // //回弹止盈
                                        // if (rPrice[symbol] > symbolPrice[`${symbol}_min`] * (1 + winRate / 5 * 0.01)) {
                                        //     sDt2[`${symbol}`] = -1;
                                        //     symbolPrice[`${symbol}_min`] = 0
                                        //     symbolPrice[`${symbol}_max`] = 0
                                        //     pLog(`${symbol}=>止盈|平空|价格${rPrice[symbol]}`)
                                        //     sell_close(client, symbol, amount)
                                        //     tjOrder(symbol, 1)
                                        //     posNow--
                                        // }
                                    }
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止盈|平空|价格${rPrice[symbol]}`)
                                    sell_close(client, symbol, amount).then(r => {
                                        tjOrder(symbol, 1)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountS[symbol] = errorCountS[symbol] + 1
                                    })
                                }
                                //1
                                if (rPrice[symbol] > symbolAction[`${symbol}`].price * (1 + lossRate * 0.01)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止损|平空|价格${rPrice[symbol]}`)
                                    sell_close(client, symbol, amount).then(r => {
                                        tjOrder(symbol, 2)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountS[symbol] = errorCountS[symbol] + 1
                                    })
                                }
                            }
                            if (symbolAction[`${symbol}`].action == 'L' && errorCountL[symbol] < 5) {
                                if (rPrice[symbol] > symbolAction[`${symbol}`].price * (1 + winRate * 0.01)) {
                                    {
                                        // if (rPrice[symbol] < symbolPrice[`${symbol}_max`] * (1 - winRate / 5 * 0.01)) {
                                        //     sDt2[`${symbol}`] = -1;
                                        //     symbolPrice[`${symbol}_min`] = 0
                                        //     symbolPrice[`${symbol}_max`] = 0
                                        //     pLog(`${symbol}=>止盈|平多|价格${rPrice[symbol]}`)
                                        //     buy_close(client, symbol, amount)
                                        //     tjOrder(symbol, 1)
                                        //     posNow--
                                        // }
                                    }
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止盈|平多|价格${rPrice[symbol]}`)
                                    buy_close(client, symbol, amount).then(r => {
                                        tjOrder(symbol, 1)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountL[symbol] = errorCountL[symbol] + 1
                                    })
                                }
                                if (rPrice[symbol] < symbolAction[`${symbol}`].price * (1 - lossRate * 0.01)) {
                                    let amount = symbolSetting[`${symbol}`]['amount']
                                    sDt2[`${symbol}`] = -1;
                                    symbolPrice[`${symbol}_min`] = 0
                                    symbolPrice[`${symbol}_max`] = 0
                                    pLog(`${symbol}=>止损|平多|价格${rPrice[symbol]}`)
                                    buy_close(client, symbol, amount).then(r => {
                                        tjOrder(symbol, 2)
                                        posNow--
                                    }).catch(e => {
                                        sDt2[`${symbol}`] = 1;
                                        sDt[`${symbol}`] = Date.now()
                                        errorCountL[symbol] = errorCountL[symbol] + 1
                                    })
                                }
                            }
                        }
                        // 监控开仓
                        if (dt[`${symbol}`] == undefined || Date.now() - dt[`${symbol}`] > interValTime * 1000) {
                            //清洗
                            dt[`${symbol}`] = Date.now()
                            if (sDt2[`${symbol}`] == -1 || sDt2[`${symbol}`] == undefined) {
                                symbolPrice[`${symbol}_min`] = 0
                                symbolPrice[`${symbol}_max`] = 0
                            }
                        } else {
                            let btPrice = _N(symbolSetting[`${symbol}`]['rate'] * 0.01 * rPrice[symbol], 8);
                            // console.log(symbol,btPrice)
                            // console.log(`${symbol}=>开仓|价格${rPrice[symbol]} | ${interValTime}秒内,价格波动:${symbolSetting[`${symbol}`]['rate']}% | ${btPrice}U | doType:${symbolSetting[`${symbol}`]['doType']} | doAction:${symbolSetting[`${symbol}`]['action']} 休息${sDtTime}秒`)
                            if (symbolPrice[`${symbol}_max`] - symbolPrice[`${symbol}_min`] > btPrice && posNow < 3) {
                                let mPrice = (symbolPrice[`${symbol}_max`] + symbolPrice[`${symbol}_min`]) / 2;
                                let flag = "";
                                if (symbolSetting[`${symbol}`]['doType'] == 1) {
                                    if (rPrice[symbol] > mPrice) {
                                        flag = "L"
                                    }
                                    if (rPrice[symbol] < mPrice) {
                                        flag = "S"
                                    }
                                }
                                if (symbolSetting[`${symbol}`]['doType'] == 2) {
                                    if (rPrice[symbol] > mPrice) {
                                        flag = "S"
                                    }
                                    if (rPrice[symbol] < mPrice) {
                                        flag = "L"
                                    }
                                }
                                //发送开单信号 休息N分钟
                                if ((symbolSetting[`${symbol}`]['action'] == flag || symbolSetting[`${symbol}`]['action'] == 'N')) {
                                    if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                                        posNow++
                                        sDt[`${symbol}`] = Date.now()//开仓
                                        sDt2[`${symbol}`] = Date.now()//平仓
                                        symbolAction[`${symbol}`] = { action: flag, price: rPrice[symbol] };
                                        getAmount(symbol, symbolSetting[`${symbol}`]['doAmount'], rPrice[symbol]);
                                        if (symbolSetting[`${symbol}`]['amount'] > 0) {
                                            pLog(`${symbol}=>开仓|价格${rPrice[symbol]} |数量${symbolSetting[`${symbol}`]['amount']} | ${interValTime}秒内,价格波动:${symbolSetting[`${symbol}`]['rate']}% | ${btPrice}U | doType:${symbolSetting[`${symbol}`]['doType']} | doAction:${symbolSetting[`${symbol}`]['action']} 休息${sDtTime}秒`)
                                            let amount = symbolSetting[`${symbol}`]['amount']
                                            if (flag == 'L') {
                                                errorCountL[symbol] = 0
                                                buy(client, symbol, amount)
                                                symbolPrice[`${symbol}_min`] = 0
                                                symbolPrice[`${symbol}_max`] = 0
                                            }
                                            if (flag == 'S') {
                                                errorCountS[symbol] = 0
                                                sell(client, symbol, amount)
                                                symbolPrice[`${symbol}_min`] = 0
                                                symbolPrice[`${symbol}_max`] = 0
                                            }
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

