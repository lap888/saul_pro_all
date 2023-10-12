//引入BG
// const proxyIp = '127.0.0.1'
// const proxy = '1087'
const proxyIp = ''
const proxy = ''

const action = ''
const doType = 1

//BN
const { Future, TA, _G, _N, LogProfit, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const process = require('process');
// const apiKey = '6HBfkhKbXMY26knOZBN948NXUMK4Wx4OHtdIVUrWjDjXIGtAZge2XlnlWHRA3g3y'
// const apiSecret = 'DoeGWvvW56cNB1reMkh520hMSSKiaQHfeAH0rTKuJoAhkl7VjWZ5wi7F3ytPVoiL'

const apiKey = 'KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00'
const apiSecret = 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO'

let symbolDatas = ['BTCUSDT', 'ETHUSDT', 'APTUSDT', 'DOGEUSDT']
let dtRun = null;
let dtRun2 = null;
let dt = {}
let symbolPrice = {}
let symbolPrice2 = {}
let symbolAction = {}
let interValTime = 10;//清洗时间
let _btr = 0.002;//波动率

let btRate = { 'SUSHIUSDT': _btr, 'ZILUSDT': _btr, 'ATOMUSDT': _btr, 'MATICUSDT': _btr, 'ETCUSDT': _btr, 'XRPUSDT': _btr, 'ETHUSDT': _btr, 'BTCUSDT': _btr, 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
// let btRate = { 'DOGEUSDT': _btr, 'MASKUSDT': _btr }
symbolDatas = Object.keys(btRate)
let symbolAmount = Object.keys(btRate);
let doRecord = _G('doRecord')
if (doRecord == undefined || doRecord == null) {
    doRecord = {}
} else {
    doRecord = JSON.parse(doRecord)
}
let exInfo = [];
let exDt = null;
let sDt = {}
let sDtTime = 300;
let sDt2 = {}
let cDt = {}
let cDo = {}
let lossDt = {}
let incomeDt = {}
let winRate = 0.1;

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })

process.on('uncaughtException', (error, source) => {
    console.log('未捕获异常=>', error, source)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}
function doAction(price, symbol, ktime = '1m', limit = 100) {
    client.records(symbol, ktime, limit).then(record => {
        let _ma14 = TA.MA(record, 14)
        let ma14 = _N(_ma14[_ma14.length - 2], 8)
        let ma14_2 = _N(_ma14[_ma14.length - 3], 8)
        let ma14_3 = _N(_ma14[_ma14.length - 4], 8)
        let ma14_4 = _N(_ma14[_ma14.length - 5], 8)

        let _ma30 = TA.MA(record, 30)
        let ma30 = _N(_ma30[_ma30.length - 2], 8)
        let ma30_2 = _N(_ma30[_ma30.length - 3], 8)
        let ma30_3 = _N(_ma30[_ma30.length - 4], 8)
        let ma30_4 = _N(_ma30[_ma30.length - 5], 8)
        let _ma40 = TA.MA(record, 40)
        let ma40 = _N(_ma40[_ma40.length - 2], 8)
        let ma40_2 = _N(_ma40[_ma40.length - 3], 8)
        let ma40_3 = _N(_ma40[_ma40.length - 4], 8)
        let ma40_4 = _N(_ma40[_ma40.length - 5], 8)
        let _ma60 = TA.MA(record, 60)
        let ma60 = _N(_ma60[_ma60.length - 2], 8)
        let ma60_2 = _N(_ma60[_ma60.length - 3], 8)
        let ma60_3 = _N(_ma60[_ma60.length - 4], 8)
        let ma60_4 = _N(_ma60[_ma60.length - 5], 8)
        let ma99 = TA.MA(record, 99)
        let ma99_1 = _N(ma99[ma99.length - 2], 8)
        let ma99_2 = _N(ma99[ma99.length - 3], 8)
        let ma99_3 = _N(ma99[ma99.length - 4], 8)
        let ma99_4 = _N(ma99[ma99.length - 5], 8)
        //第一种指标算法
        let l = price >= ma99_1 && ma14 >= ma99_1 && ma30 >= ma40 && ma40 >= ma60;
        let s = price <= ma99_1 && ma14 <= ma99_1 && ma30 <= ma40 && ma40 <= ma60;
        if (l) {
            cDo[`${symbol}`] = 'L'
        } else if (s) {
            cDo[`${symbol}`] = 'S'
        } else {
            cDo[`${symbol}`] = ''
        }
    })

}
async function getAccount(client) {
    client.account().then(response => {
        let balance = `${response.data.totalWalletBalance}|${response.data.totalUnrealizedProfit}|${response.data.availableBalance}`
        if (dtRun2 == null || Date.now() - dtRun2 > 60 * 1000) {
            dtRun2 = Date.now()
            pLog(`*刷新账户余额=>${balance}`)
        }
    }).catch(err => {
        console.log('获取账户信息|err=>', err)
    })

}
function getAmount(symbol, amount, price) {
    if (exDt == null || Date.now() - exDt > 5 * 60 * 1000) {
        exDt = Date.now()
        client.exchangeInfo().then(ex => {
            exInfo = ex.data.symbols
        });
    }
    let pricePrecision = 0;
    let quantityPrecision = 0;
    let tickerLen = 0;
    exInfo.map((v, i) => {
        if (v.symbol == symbol) {
            quantityPrecision = v.quantityPrecision;
            pricePrecision = tickerLen;
        }
    });
    amount = _N(amount / price, quantityPrecision);
    return amount;
}
client.exchangeInfo().then(ex => {
    exInfo = ex.data.symbols;
    exDt = Date.now()
    client.account().then(account => {
        console.log(`账户余额:${account.data.totalWalletBalance}|${account.data.totalUnrealizedProfit}|${account.data.availableBalance}`)
    })
    client.listenKeyPost().then(response => {
        setInterval(() => {
            client.listenKeyPut().then(res => {
                console.log(`延长listenkey,25分钟`)
            })
        }, 25 * 60 * 1000);
        // ['ethusdt@bookTicker','ethusdt@markPrice','ethusdt@ticker']
        let SymbolDataArrys = []
        symbolDatas.map(v => {
            // SymbolDataArrys.push(`${v.toLowerCase()}@markPrice@1s`)
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
                price = Number(price)
                // let ms = `${msg.data.e} | ${msg.data.s} | ${price} | ${DateFormat(msg.data.E)}`
                // console.log(ms)
                if (dtRun == null || Date.now() - dtRun > 10 * 1000) {
                    dtRun = Date.now()
                    getAccount(client).catch(err => console.log(err))
                }
                if (symbolPrice2[`${symbol}_min`] == 0 || symbolPrice2[`${symbol}_min`] == undefined) {
                    symbolPrice2[`${symbol}_min`] = price
                }
                if (symbolPrice2[`${symbol}_max`] == 0 || symbolPrice2[`${symbol}_max`] == undefined) {
                    symbolPrice2[`${symbol}_max`] = price
                }
                //
                if (price > symbolPrice2[`${symbol}_max`]) {
                    symbolPrice2[`${symbol}_max`] = price
                }
                if (price < symbolPrice2[`${symbol}_min`]) {
                    symbolPrice2[`${symbol}_min`] = price
                }
                //秒单4
                if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 1 * 1000) {
                    if (symbolAction[`${symbol}`].action == 'S') {
                        if (price < symbolAction[`${symbol}`].price * (1 - winRate * 0.01 * 3)) {
                            if (price > symbolPrice2[`${symbol}_min`] * (1 + winRate * 0.01)) {
                                sDt2[`${symbol}`] = -1;
                                symbolPrice2[`${symbol}_min`] = 0
                                symbolPrice2[`${symbol}_max`] = 0
                                pLog(`${symbol}=>止盈|平空|价格${price}`)
                                sell_close(client, symbol, symbolAmount[`${symbol}`])
                                let r1 = doRecord[`${symbol}_1`]
                                if (r1 == null || r1 == undefined) {
                                    r1 = 1
                                } else {
                                    r1 += 1
                                }
                                doRecord[`${symbol}_1`] = r1
                                _G('doRecord', JSON.stringify(doRecord))
                            }
                        }
                        //1
                        if (price > symbolAction[`${symbol}`].price * (1 + winRate * 0.01 * 2)) {
                            if (lossDt[`${symbol}`] != undefined && lossDt[`${symbol}`] != -1 && Date.now() - lossDt[`${symbol}`] > 2 * 1000) {
                                sDt2[`${symbol}`] = -1;
                                lossDt[`${symbol}`] = -1
                                symbolPrice2[`${symbol}_min`] = 0
                                symbolPrice2[`${symbol}_max`] = 0
                                pLog(`${symbol}=>止损|平空|价格${price}`)
                                sell_close(client, symbol, symbolAmount[`${symbol}`])
                                let r1 = doRecord[`${symbol}_2`]
                                if (r1 == null || r1 == undefined) {
                                    r1 = 1
                                } else {
                                    r1 += 1
                                }
                                doRecord[`${symbol}_2`] = r1
                                _G('doRecord', JSON.stringify(doRecord))
                            }
                        } else {
                            lossDt[`${symbol}`] = Date.now()
                        }

                    }
                    if (symbolAction[`${symbol}`].action == 'L') {
                        if (price > symbolAction[`${symbol}`].price * (1 + winRate * 0.01 * 3)) {
                            if (price < symbolPrice2[`${symbol}_max`] * (1 - winRate * 0.01)) {
                                sDt2[`${symbol}`] = -1;
                                symbolPrice2[`${symbol}_min`] = 0
                                symbolPrice2[`${symbol}_max`] = 0
                                pLog(`${symbol}=>止盈|平多|价格${price}`)
                                buy_close(client, symbol, symbolAmount[`${symbol}`])
                                let r1 = doRecord[`${symbol}_1`]
                                if (r1 == null || r1 == undefined) {
                                    r1 = 1
                                } else {
                                    r1 += 1
                                }
                                doRecord[`${symbol}_1`] = r1
                                _G('doRecord', JSON.stringify(doRecord))
                            }
                        }
                        //1
                        if (price < symbolAction[`${symbol}`].price * (1 - winRate * 0.01 * 2)) {
                            if (lossDt[`${symbol}`] != undefined && lossDt[`${symbol}`] != -1 && Date.now() - lossDt[`${symbol}`] > 2 * 1000) {
                                sDt2[`${symbol}`] = -1;
                                lossDt[`${symbol}`] = -1
                                symbolPrice2[`${symbol}_min`] = 0
                                symbolPrice2[`${symbol}_max`] = 0
                                pLog(`${symbol}=>止损|平多|价格${price}`)
                                buy_close(client, symbol, symbolAmount[`${symbol}`])
                                let r1 = doRecord[`${symbol}_2`]
                                if (r1 == null || r1 == undefined) {
                                    r1 = 1
                                } else {
                                    r1 += 1
                                }
                                doRecord[`${symbol}_2`] = r1
                                _G('doRecord', JSON.stringify(doRecord))
                            }
                        } else {
                            lossDt[`${symbol}`] = Date.now()
                        }

                    }
                }


                //指标趋势 TODO
                // if (cDt[`${symbol}`] == undefined || Date.now() - cDt[`${symbol}`] > 60 * 1000) {
                //     cDt[`${symbol}`] = Date.now();
                //     // doAction(price, symbol)
                // }

                if (dt[`${symbol}`] == undefined || Date.now() - dt[`${symbol}`] > interValTime * 1000) {
                    //清洗
                    dt[`${symbol}`] = Date.now()
                    symbolPrice[`${symbol}_min`] = 0
                    symbolPrice[`${symbol}_max`] = 0
                } else {
                    if (symbolPrice[`${symbol}_min`] == 0 || symbolPrice[`${symbol}_min`] == undefined) {
                        symbolPrice[`${symbol}_min`] = price
                    }
                    if (symbolPrice[`${symbol}_max`] == 0 || symbolPrice[`${symbol}_max`] == undefined) {
                        symbolPrice[`${symbol}_max`] = price
                    }
                    //
                    if (price > symbolPrice[`${symbol}_max`]) {
                        symbolPrice[`${symbol}_max`] = price
                    }
                    if (price < symbolPrice[`${symbol}_min`]) {
                        symbolPrice[`${symbol}_min`] = price
                    }
                    //
                    let btPrice1 = _N(btRate[`${symbol}`] * price, 8);
                    if (symbolPrice[`${symbol}_max`] - symbolPrice[`${symbol}_min`] > btPrice1) {
                        let mPrice = (symbolPrice[`${symbol}_max`] + symbolPrice[`${symbol}_min`]) / 2;
                        let flag = ""
                        if (doType == 1) {
                            if (price > mPrice) {
                                flag = "L"
                            }
                            if (price < mPrice) {
                                flag = "S"
                            }
                        }
                        if (doType == 2) {
                            if (price > mPrice) {
                                flag = "S"
                            }
                            if (price < mPrice) {
                                flag = "L"
                            }
                        }

                        //发送开单信号 休息N分钟
                        if (action == flag || action == '') {
                            if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                                sDt[`${symbol}`] = Date.now()
                                sDt2[`${symbol}`] = Date.now()
                                symbolAction[`${symbol}`] = { action: flag, price: price };
                                let amount = getAmount(symbol, 50, price)
                                pLog(`${symbol}=>开仓|价格${price} | ${interValTime}秒内,价格波动:${btRate[`${symbol}`]} | ${btPrice1}U,趋势DO:${flag} | 趋势DO2:${cDo[`${symbol}`] == undefined ? ' ' : cDo[`${symbol}`]} | 休息${sDtTime}秒`)
                                if (flag == 'L') {
                                    buy(client, symbol, amount)
                                    symbolAmount[`${symbol}`] = amount
                                    symbolPrice2[`${symbol}_min`] = 0
                                    symbolPrice2[`${symbol}_max`] = 0
                                }
                                if (flag == 'S') {
                                    sell(client, symbol, amount)
                                    symbolAmount[`${symbol}`] = amount
                                    symbolPrice2[`${symbol}_min`] = 0
                                    symbolPrice2[`${symbol}_max`] = 0
                                }
                            }
                        }

                    }
                }
            }
        });
    })
})
