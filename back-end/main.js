const process = require('process');
const express = require('express')
let { LocalStorage } = require("node-localstorage")
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
let { Future, XhSpot, buy, buy_close, sell, sell_close, buy_xh, sell_xh, records_xh, _G, _N, DateFormat, Sleep } = require('binance-futures-connector');
let { cf, cs, configJson, TA, Log } = require('./app/binanceApi')
let listenPort = configJson.listenPort;
let xh_pos = {}
let hy_pos_l = {}
let hy_pos_s = {}
let localStorage = new LocalStorage('./root');
const fs = require('fs');
let configData = fs.readFileSync("./data/setting.json");

const { send_msg, msg_on, init_tg } = require('./app/message')
let stopTime = null;
let isFristRun = true;
let coinList = [];
let sendTime = {};
let SymbolsEx = [];
let SymbolsExXh = [];
let symbolFlag = {};
let symbolTimeData = {}
let pos = {};
let posTime = {}
let xh_totalWalletBalance = 0;
let xh_totalWalletBalance_b = 0;
let totalWalletBalance = 0;
let buy_xh_f = false;
let buy_hy_l = false;
let buy_hy_s = false;
process.on('uncaughtException', (error, source) => {
    console.log('uncaughtException',error, source)
});
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function printLog(msg) {
    Log(msg)
    console.log(msg)
}
/**
 * 获取交易对的data.json基础信息
 * @param {*} cointype 交易对
 * @param {*} coinInfo 交易对配置信息
 */
async function pre_data(cointype, coinInfo) {
    if (coinInfo.type == 'xh') {
        pos = {}
        // 当前交易对市价
        let cur_market_price = Number((await cs.tickerPrice(cointype, { recvWindow: 5000 })).data.price);
        let right_size = 2;
        let minQty = 0;
        SymbolsExXh.map((v) => {
            if (v.symbol == cointype) {
                let filter = v.filters.find(x => x.filterType == 'LOT_SIZE')
                let a = filter.minQty;
                minQty = Number(a);
                let a1 = a.split('.')[1]
                let a2 = a1.indexOf(1)
                right_size = Number(a2 + 1)
            }
        });
        //多单 空单数量
        let acc = await cs.account({ recvWindow: 5000 });
        let posL = null;
        let posS = null;
        xh_pos = {}
        let totalWalletBalance = 0;
        acc.data.balances.map(v => {
            if (v.asset == 'USDT' && (cointype.indexOf('USDT') != -1)) {
                totalWalletBalance = Number(v.free);//可用U
            }
            if (v.asset == 'BUSD' && (cointype.indexOf('BUSD') != -1)) {
                totalWalletBalance = Number(v.free);//可用U
            }
        })
        totalWalletBalance = totalWalletBalance > xh_totalWalletBalance ? totalWalletBalance : xh_totalWalletBalance;
        acc.data.balances.map(v => {
            if (Number(v.free) == 0 && Number(v.locked) == 0 && v.asset == cointype.replace('USDT', '')) {
                _G('dtSell', null)
            }
            if ((Number(v.free) > minQty || Number(v.free) == 0) && v.asset == cointype.replace('USDT', '')) {
                posL = v;
                xh_pos[cointype] = v;
                if (Number(v.free < Number(minQty)) && Number(v.free) != 0) {
                    //小资产转换BNB
                    cs.dustTransfer(cointype.replace('USDT', '')).then(res => {
                        console.log('小资产转换BNB', res.status)
                    }).catch(err => {
                        console.log('小资产转换BNB', err)
                    })
                    posL = null;
                    _G('dtSell', null)
                }
                //此币需要买多少个
                let xhAmount_u = totalWalletBalance * coinInfo.orderRate * 0.01 < coinInfo.minAmount ? coinInfo.minAmount : totalWalletBalance * coinInfo.orderRate * 0.01;
                let xhAmount = Number((xhAmount_u / cur_market_price).toFixed(right_size));
                let dtSell = _G('dtSell')
                if (Number(v.free) < xhAmount && (dtSell == null || dtSell == 'null')) {
                    posL = null;
                    // console.log('冰山委托没买够', Number(v.free), xhAmount)
                } else {
                    buy_xh_f = false;
                }
            }
            if (Number(v.locked) > 0 && v.asset == cointype.replace('USDT', '')) {
                posL = v;
            }

            if (Number(v.locked) > 0 || Number(v.free) > 0) {
                pos[`${v.asset}`] = v;
            }
        })
        return [posL, posS, cur_market_price, right_size, totalWalletBalance]
    } else {
        // 当前交易对市价
        let cur_market_price = Number((await cf.price({ symbol: cointype, recvWindow: 5000 })).data.price);
        let right_size = 2;
        SymbolsEx.map((v) => {
            if (v.symbol == cointype) {
                right_size = Number(v.quantityPrecision);
            }
        });
        //多单 空单数量
        let acc = await cf.account({ recvWindow: 5000 });
        let posL = null;
        let posS = null;
        let posL1 = [];
        let posS1 = [];
        // hy_pos_l = {}
        // hy_pos_s = {}
        // totalWalletBalance = Number(acc.data.totalWalletBalance);
        // acc.data.assets.map((v) => {
        //     if (v.asset == 'BUSD') {
        //         totalWalletBalance += Number(v.walletBalance);
        //     }
        // })
        let usdt = Number(acc.data.totalWalletBalance);
        let busd = 0;
        acc.data.assets.map((v) => {
            if (v.asset == 'BUSD') {
                busd = Number(v.walletBalance);
            }
        })
        if (cointype.indexOf('BUSD') > 0) {
            totalWalletBalance = busd
        } else {
            totalWalletBalance = usdt
        }
        acc.data.positions.map(v => {
            // if (Number(v.positionAmt) > 0 && v.symbol == cointype && _G(`posLCount_${cointype}`) == 0) {
            if (Number(v.positionAmt) > 0 && v.symbol == cointype) {
                posL = v;
                hy_pos_l[cointype] = v;
                pos[`${cointype}_posL`] = v;
                posL1.push(v.symbol)
                if (Math.abs(Number(v.notional)) < totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01) {
                    posL = null;
                    buy_hy_l = true;
                    // console.log('合约-多单-冰山委托没有买够...')
                } else {
                    buy_hy_l = false;
                }
            }
            // if (Number(v.positionAmt) < 0 && v.symbol == cointype && _G(`posSCount_${cointype}`) == 0) {
            if (Number(v.positionAmt) < 0 && v.symbol == cointype) {
                posS = v;
                hy_pos_s[cointype] = v;
                posS1.push(v.symbol)
                pos[`${cointype}_posS`] = v;
                if (Math.abs(Number(v.notional)) < totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01) {
                    posS = null;
                    buy_hy_s = true;
                    // console.log('合约-空单-冰山委托没有卖够...')
                } else {
                    buy_hy_s = false;
                }
            }
            // if (v.symbol == cointype && Number(v.positionAmt) == 0) {
            //     _G(`posLCount_${cointype}`, '0')
            //     _G(`posSCount_${cointype}`, '0')
            // }
        });
        let l1 = posL1.findIndex(v => v == cointype)
        if (l1 < 0) {
            hy_pos_l[cointype] = null;
        }
        let s1 = posS1.findIndex(v => v == cointype)
        if (s1 < 0) {
            hy_pos_s[cointype] = null;
        }
        return [posL, posS, cur_market_price, right_size, totalWalletBalance]
    }

}

let modify_bcoins = (coin, key, value) => {
    let dataInfo = get_json_data();
    dataInfo.bCoins.forEach(v => {
        if (v.coin == coin) {
            v[key] = value
        }
    })
    modify_json_data(dataInfo)
}
let modify_bcoins_byId = (key, name, value) => {
    let dataInfo = get_json_data();
    dataInfo.bCoins.forEach(v => {
        if (v.key == key) {
            v[name] = value
        }
    })
    modify_json_data(dataInfo)
}
async function loop_run() {
    while (true) {
        try {
            //
            if (isFristRun) {
                try {
                    // init_tg();
                    // msg_on();
                    init_setting_data();
                    // updatePositionSide();
                    let exInfo = await cf.exchangeInfo();
                    SymbolsEx = exInfo.data.symbols;
                    let exInfoxh = await cs.exchangeInfo();
                    SymbolsExXh = exInfoxh.data.symbols;
                    let acc1 = await cf.account({ recvWindow: 5000 });
                    let totalWalletBalance = Number(acc1.data.totalWalletBalance);
                    let busd = 0;
                    acc1.data.assets.map((v) => {
                        if (v.asset == 'BUSD') {
                            busd = v.walletBalance
                        }
                    })
                    printLog(`合约余额:usdt=>${totalWalletBalance},busd=>${busd}`)
                    try {
                        let acc = await cs.account({ recvWindow: 5000 });
                        acc.data.balances.map(v => {
                            if (v.asset == 'USDT') {
                                xh_totalWalletBalance = Number(v.free);//可用U
                            }
                            if (v.asset == 'BUSD') {
                                xh_totalWalletBalance_b = Number(v.free);//可用U
                            }
                        })
                    } catch (error) {
                        printLog(`现货权限未开=>${error.response}`)
                    }
                    printLog(`现货余额:usdt=>${xh_totalWalletBalance},busd=>${xh_totalWalletBalance_b}`)
                    isFristRun = false;
                    cf.ifNewUser('WcsXtG5x').then(res => {
                        printLog(`1.${res.data.rebateWorking}  2.${res.data.ifNewUser}`)
                    }).catch(err => {
                        console.log(err)
                    })
                    printLog(`策略服务启动`)
                } catch (err) {
                    isFristRun = true;
                    console.log('API异常')
                    await sleep(5000)
                    continue;
                }

            }
            coinList = get_json_data().bCoins;
            let minutes = new Date().getMinutes();
            let seconds = new Date().getSeconds();
            if (minutes % 5 == 0) {
                if (seconds % 15 == 0) {
                    let exInfo = await cf.exchangeInfo();
                    SymbolsEx = exInfo.data.symbols;
                    let exInfoxh = await cs.exchangeInfo();
                    SymbolsExXh = exInfoxh.data.symbols;
                }
            }
            for (let i = 0; i < coinList.length; i++) {
                let coinInfo = coinList[i];
                if (coinInfo.status == 1) {
                    let [posL, posS, cur_market_price, right_size, totalWalletBalance] = await pre_data(coinInfo.coin, coinInfo)
                    let records = [];
                    let time = new Date();
                    //计算指标
                    let doLong1 = false;
                    let doShort1 = false;
                    let doLong = false;
                    let doShort = false;
                    let indicator = coinInfo.indicator;
                    let isKdj = -1;
                    let isMa = -1;
                    let isSar = -1;
                    let isBoll = -1;
                    let isMacd = -1;
                    indicator.map((v, i) => {
                        if (v.toUpperCase().includes('KDJ')) {
                            isKdj = i;
                        }
                        if (v.toUpperCase().includes('MA') && !v.toUpperCase().includes('CD')) {
                            isMa = i;
                        }
                        if (v.toUpperCase().includes('SAR')) {
                            isSar = i;
                        }
                        if (v.toUpperCase().includes('BOLL')) {
                            isBoll = i;
                        }
                        if (v.toUpperCase().includes('MACD')) {
                            isMacd = i;
                        }
                    });
                    symbolFlag[coinInfo.coin] = { isKdj: isKdj, isMacd: isMacd, isMa: isMa, isSar: isSar, isBoll: isBoll, doLong: doLong, doShort: doShort, doLong1: doLong1, doShort1: doShort1 }
                    if (isKdj >= 0) {
                        let t1 = indicator[isKdj].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }

                        let kdj = TA.KDJ(records, t2[1], t2[2], t2[3]);
                        let k1 = kdj[0][kdj[0].length - 2]
                        let k2 = kdj[0][kdj[0].length - 3]
                        let d1 = kdj[1][kdj[1].length - 2]
                        let d2 = kdj[1][kdj[1].length - 3]
                        let tt1 = sendTime[`t_${t2[0]}`]
                        if (tt1 == undefined || Date.now() - tt1 > 1000 * 60) {
                            // console.log(coinInfo.coin, kt, '=>', `KDJ${t2[1]}`, 'k', k1, `KDJ${t2[2]}`, 'd', d2, '|', totalWalletBalance, '|', pos)
                            sendTime[`t_${t2[0]}`] = Date.now();
                        }
                        if (k2 <= d2 && k1 > d1) {
                            if (isKdj == 0) {
                                doLong1 = true;
                            } else {
                                doLong1 = doLong1 && true;
                            }
                            if (!buy_xh_f) {
                                buy_xh_f = doLong1;
                            }
                            if (!buy_hy_l) {
                                buy_hy_l = doLong1;
                            }
                        }
                        if (k2 >= d2 && k1 < d1) {
                            if (isKdj == 0) {
                                doShort1 = true;
                            } else {
                                doShort1 = doShort1 && true;
                            }
                            if (!buy_hy_s) {
                                buy_hy_s = doShort1;
                            }
                        }
                        if (k1 > d1) {
                            if (isKdj == 0) {
                                doLong = true;
                            } else {
                                doLong = doLong && true;
                            }
                            symbolFlag[coinInfo.coin].isKdj = true
                        } else {
                            if (k1 < d1) {
                                if (isKdj == 0) {
                                    doShort = true;
                                } else {
                                    doShort = doShort && true;
                                }
                                symbolFlag[coinInfo.coin].isKdj = false
                            }
                        }
                    }
                    if (isMacd >= 0) {
                        let t1 = indicator[isMacd].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }

                        let macd = TA.MACD(records, t2[1], t2[2], t2[3]);
                        let k1 = macd[0][macd[1].length - 1]
                        let k2 = macd[0][macd[1].length - 2]
                        let d1 = macd[1][macd[2].length - 1]
                        let d2 = macd[1][macd[2].length - 2]
                        let tt1 = sendTime[`t_${t2[0]}`]
                        if (tt1 == undefined || Date.now() - tt1 > 1000 * 60) {
                            sendTime[`t_${t2[0]}`] = Date.now();
                        }
                        if (k2 <= d2 && k1 > d1) {
                            if (isMacd == 0) {
                                doLong1 = true;
                            } else {
                                doLong1 = doLong1 && true;
                            }
                            if (!buy_xh_f) {
                                buy_xh_f = doLong1;
                            }
                            if (!buy_hy_l) {
                                buy_hy_l = doLong1;
                            }
                        }
                        if (k2 >= d2 && k1 < d1) {
                            if (isMacd == 0) {
                                doShort1 = true;
                            } else {
                                doShort1 = doShort1 && true;
                            }
                            if (!buy_hy_s) {
                                buy_hy_s = doShort1;
                            }
                        }
                        if (k1 > d1) {
                            if (isMacd == 0) {
                                doLong = true;
                            } else {
                                doLong = doLong && true;
                            }
                            symbolFlag[coinInfo.coin].isMacd = true
                        } else {
                            if (k1 < d1) {
                                if (isMacd == 0) {
                                    doShort = true;
                                } else {
                                    doShort = doShort && true;
                                }
                                symbolFlag[coinInfo.coin].isMacd = false
                            }
                        }
                    }
                    if (isMa >= 0) {
                        let t1 = indicator[isMa].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }
                        if (t1.length == 2) {
                            let ma = TA.MA(records, t2[1])
                            let _ma = ma[ma.length - 1];
                            if (_ma < cur_market_price) {
                                if (isMa == 0) {
                                    doLong = true;
                                } else {
                                    doLong = doLong && true;
                                    doShort = doShort && false;
                                }
                                symbolFlag[coinInfo.coin].isMa = true
                            } else {
                                if (isMa == 0) {
                                    doShort = true;
                                } else {
                                    doLong = doLong && false;
                                    doShort = doShort && true;
                                }
                                symbolFlag[coinInfo.coin].isMa = false
                            }
                        } else if (t1.length > 2) {
                            //金叉死叉
                            let t21 = t1[2].split('|');
                            let ma1 = TA.MA(records, t2[1])
                            let ma2 = TA.MA(records, t21[1])
                            let tt1 = sendTime[`t_${t2[0]}`]
                            if (tt1 == undefined || Date.now() - tt1 > 1000 * 60) {
                                // console.log(coinInfo.coin, kt, '=>', `MA${t2[1]}`, ma1[ma1.length - 1], `MA${t21[1]}`, ma2[ma2.length - 1], '|', totalWalletBalance, '|', pos)
                                sendTime[`t_${t2[0]}`] = Date.now();
                            }
                            if (ma1[ma1.length - 1] > ma2[ma2.length - 1] && ma1[ma1.length - 2] <= ma2[ma2.length - 2]) {
                                if (isMa == 0) {
                                    doLong1 = true;
                                } else {
                                    doLong1 = doLong1 && true;
                                    doShort1 = doShort1 && false;
                                }
                                if (!buy_xh_f) {
                                    buy_xh_f = doLong1;
                                }
                                if (!buy_hy_l) {
                                    buy_hy_l = doLong1;
                                }
                            }
                            if (ma1[ma1.length - 1] < ma2[ma2.length - 1] && ma1[ma1.length - 2] >= ma2[ma2.length - 2]) {
                                if (isMa == 0) {
                                    doShort1 = true;
                                } else {
                                    doLong1 = doLong1 && false;
                                    doShort1 = doShort1 && true;
                                }
                                if (!buy_hy_s) {
                                    buy_hy_s = doShort1;
                                }
                            }

                            if (ma1[ma1.length - 1] > ma2[ma2.length - 1]) {
                                if (isMa == 0) {
                                    doLong = true;
                                } else {
                                    doLong = doLong && true;
                                    doShort = doShort && false;
                                }
                                symbolFlag[coinInfo.coin].isMa = true
                            } else {
                                if (isMa == 0) {
                                    doShort = true;
                                } else {
                                    doLong = doLong && false;
                                    doShort = doShort && true;
                                }
                                symbolFlag[coinInfo.coin].isMa = false
                            }
                        }

                    }
                    if (isSar >= 0) {
                        let t1 = indicator[isSar].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1000)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1000)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 5 * 1000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1000)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1000)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }
                        let sar = TA.SAR(records, Number(t2[2]), Number(t2[3]), Number(t2[1]))
                        let tt1 = sendTime[`t_${coinInfo.coin}_${t2[0]}`]
                        let oPrice = records[records.length - 1].Open;
                        
                        if (sar[sar.length - 1] <= oPrice && sar[sar.length - 2] >= oPrice) {
                            if (isSar == 0) {
                                doLong1 = true;
                            } else {
                                doLong1 = doLong1 && true;
                                doShort1 = doShort1 && false;
                            }
                            if (!buy_xh_f) {
                                buy_xh_f = doLong1;
                            }
                            if (!buy_hy_l) {
                                buy_hy_l = doLong1;
                            }
                        }
                        if (sar[sar.length - 1] >= oPrice && sar[sar.length - 2] <= oPrice) {
                            if (isSar == 0) {
                                doShort1 = true;
                            } else {
                                doLong1 = doLong1 && false;
                                doShort1 = doShort1 && true;
                            }
                            if (!buy_hy_s) {
                                buy_hy_s = doShort1;
                            }
                        }
                        if (sar[sar.length - 1] < oPrice) {
                            if (isSar == 0) {
                                doLong = true;
                            } else {
                                doLong = doLong && true;
                                doShort = doShort && false;
                            }
                            symbolFlag[coinInfo.coin].isSar = sar[sar.length - 1]
                        } else {
                            if (isSar == 0) {
                                doShort = true;
                            } else {
                                doLong = doLong && false;
                                doShort = doShort && true;
                            }
                            symbolFlag[coinInfo.coin].isSar = sar[sar.length - 1]
                        }
                        if (tt1 == undefined || Date.now() - tt1 > 1000 * 59) {
                            // console.log(Number(t2[2]), Number(t2[3]), Number(t2[1]), coinInfo.coin, kt, '=>', 'SAR', 'sar0=', sar[sar.length - 1], 'sar1=', sar[sar.length - 2], 'sar2=', sar[sar.length - 3], 'nowp=', oPrice)
                            // printLog(`${doLong},${doLong1},${doShort},${doShort1},${coinInfo.coin} | k周期:${kt} | sar(${Number(t2[1])},${Number(t2[2])},${Number(t2[3])}) | 当前k线开盘价=${oPrice} | 当根K时间${DateFormat(records[records.length - 1].Time)} | 当前k线sar=${sar[sar.length - 1]} | 上一根k线sar=${sar[sar.length - 2]} | 上上根k线sar=${sar[sar.length - 3]}`)
                            sendTime[`t_${coinInfo.coin}_${t2[0]}`] = Date.now();
                        }
                    }
                    if (isBoll >= 0) {
                        let t1 = indicator[isBoll].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(cs, coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }
                        let boll = TA.BOLL(records, t2[1], t2[2])
                        let downLine = boll[2]
                        let downUp = boll[0]
                        let downL = downLine[downLine.length - 1];//下轨
                        let downU = downUp[downUp.length - 1];//上轨
                        if (downL > cur_market_price) {
                            if (isBoll == 0) {
                                doLong1 = doLong = true;
                            } else {
                                doLong1 = doLong = doLong && true;
                                doShort1 = doShort = doShort && false;
                            }
                            symbolFlag[coinInfo.coin].isBoll = true
                        }
                        if (downU < cur_market_price) {
                            if (isBoll == 0) {
                                doShort1 = doShort = true;
                            } else {
                                doLong1 = doLong = doLong && false;
                                doShort1 = doShort = doShort && true;
                            }
                            symbolFlag[coinInfo.coin].isBoll = false
                        }
                    }
                    //下单数量
                    let amount_u = coinInfo.minAmount;
                    let amount = Number((amount_u / cur_market_price).toFixed(right_size));
                    let xhAmount_u = coinInfo.minAmount;
                    let xhAmount = Number((xhAmount_u / cur_market_price).toFixed(right_size));
                    //core start
                    if (coinInfo.type == 'xh') {
                        //查询挂单
                        let pos_xh = await cs.openOrders({ symbol: coinInfo.coin })
                        pos_xh = pos_xh.data;
                        // console.log('pos_xh', pos_xh, JSON.stringify(pos_xh))
                        if ((posL == null) && pos_xh.length == 0 && coinInfo.status == 1 && (time.getHours() > coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                            if (doLong && (doLong1 || buy_xh_f || coinInfo.startNowDo == 'true')) {
                                //开仓
                                if (coinInfo.orderType == "market") {
                                    //市价开仓
                                    await buy_xh(cs, coinInfo.coin, xhAmount_u, -1);
                                    //记录价格
                                    modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                    send_msg(`现货买入=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货买入:${xhAmount_u}U 数量:${xhAmount}个 价格:${cur_market_price} 此次总需买入:${totalWalletBalance * coinInfo.orderRate * 0.01}U`);
                                    printLog(`现货买入=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货买入:${xhAmount_u}U 数量:${xhAmount}个 价格:${cur_market_price} 此次总需买入:${totalWalletBalance * coinInfo.orderRate * 0.01}U`)
                                } else {
                                    //限价
                                    //获取是否有未成交挂单
                                    if (posS == null) {
                                        //市价开仓
                                        await buy_xh(cs, coinInfo.coin, xhAmount, cur_market_price);
                                        //记录价格
                                        if (coinInfo.posPrice == 0) {
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        } else {
                                            let price = (coinInfo.posPrice + Number(cur_market_price)) / 2;
                                            modify_bcoins(coinInfo.coin, 'posPrice', price)
                                        }
                                        send_msg(`现货分批买入=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货买入:${xhAmount_u}U 数量:${xhAmount}个 价格:${cur_market_price} 此次总需买入:${(totalWalletBalance * coinInfo.orderRate * 0.01).toFixed(2)}U`);
                                        printLog(`现货分批买入=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货买入:${xhAmount_u}U 数量:${xhAmount}个 价格:${cur_market_price} 此次总需买入:${(totalWalletBalance * coinInfo.orderRate * 0.01).toFixed(2)}U`)
                                    }
                                }
                                modify_bcoins(coinInfo.coin, 'onPftData1', 0)
                            }
                        } else {
                            if (posL != null) {
                                //动态止盈
                                if (doLong) {
                                    if ((Number(cur_market_price) > Number(coinInfo.posPrice) * (1 + coinInfo.stopPft * 0.01) && Number(coinInfo.posPrice) != 0)) {
                                        //卖出 利润大于 stopPft% sellRate%
                                        if (posL.free * coinInfo.sellRate * 0.01 > xhAmount) {
                                            let amount = toSubNum(posL.free * coinInfo.sellRate * 0.01, right_size)
                                            await sell_xh(cs, coinInfo.coin, amount)
                                            send_msg(`现货动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${amount} 价格:${cur_market_price}`);
                                            printLog(`现货动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${amount} 价格:${cur_market_price}`)
                                            _G('dtSell', '1')
                                            //追踪更新价位
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        }
                                    }
                                }
                                if (doShort) {
                                    let amount = toSubNum(posL.free, right_size)
                                    if (coinInfo.stopLoss > 0) {
                                        await sell_xh(cs, coinInfo.coin, amount)
                                        send_msg(`${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货卖出-止损-信号反转卖出 数量:${amount} 价格:${cur_market_price}`);
                                        printLog(`${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货卖出-止损-信号反转卖出 数量:${amount} 价格:${cur_market_price}`)
                                        _G('dtSell', null)
                                    } else {
                                        // 平空 停止
                                        if (Number(cur_market_price) < Number(coinInfo.posPrice) * (1 - Math.abs(coinInfo.stopLoss) * 0.01)) {
                                            await sell_xh(cs, coinInfo.coin, amount)
                                            send_msg(`${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货卖出-止损-停止运行 数量:${amount} 价格:${cur_market_price}`);
                                            printLog(`${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货卖出-止损-停止运行 数量:${amount} 价格:${cur_market_price}`)
                                            //停止运行
                                            // modify_bcoins(coinInfo.coin, 'status', 0)
                                            _G('dtSell', null)
                                        }
                                    }
                                }
                            }
                        }
                        if (pos_xh.length > 0) {
                            let time = posTime[`${coinInfo.coin}`]
                            if (time == undefined || Date.now() - time > 1000 * coinInfo.cancelTime) {
                                //查询订单 撤销订单
                                let res = await cs.cancelOpenOrders(coinInfo.coin)
                                printLog(`${coinInfo.cancelTime}秒,未成交,撤销订单,${res.status}`)
                                posTime[`${coinInfo.coin}`] = Date.now();
                            }
                        }
                    } else {
                        let pos_hy = await cf.openOrders({ symbol: coinInfo.coin })
                        pos_hy = pos_hy.data;
                        let pos_hy_l = [];
                        let pos_hy_s = [];
                        pos_hy.map(v => {
                            if (v.positionSide == "SHORT") {
                                v.orderId = (BigInt(v.orderId)).toString()
                                pos_hy_s.push(v)
                            }
                            if (v.positionSide == "LONG") {
                                v.orderId = (BigInt(v.orderId)).toString()
                                pos_hy_l.push(v)
                            }
                        })
                        //合约
                        if (doLong && coinInfo.status == 1) {
                            if ((doLong1 || buy_hy_l || coinInfo.startNowDo == 'true') && posL == null && pos_hy_l.length == 0 && (time.getHours() >= coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                                //杠杆
                                await cf.leverage(coinInfo.coin, coinInfo.lever);
                                if (hy_pos_l[coinInfo.coin] == null) {
                                    //市价
                                    if (doLong1 || coinInfo.startNowDo == 'true') {
                                        let am1 = totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01 * coinInfo.fOrderRate * 0.01
                                        let amount_u1 = coinInfo.minAmount > am1 ? coinInfo.minAmount : am1;
                                        let amount1 = Number((amount_u1 / cur_market_price).toFixed(right_size));
                                        await buy(cf, coinInfo.coin, amount1, -1)
                                        send_msg(`首单合约做多=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount1} 价格${cur_market_price}`)
                                        printLog(`首单合约做多=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount1} 价格${cur_market_price}`)
                                        _G(`posLCount_${coinInfo.coin}`, '0')
                                        modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'onPftData1', 0)
                                        modify_bcoins(coinInfo.coin, 'lCount', 1)
                                        modify_bcoins(coinInfo.coin, 'lCount1', 1)
                                        await Sleep(2000)
                                    }
                                } else {
                                    if (Number(cur_market_price) < Number(hy_pos_l[coinInfo.coin].entryPrice)) {
                                        //开仓
                                        if (amount > 0) {
                                            if (coinInfo.orderType == "market") {
                                                //市价
                                                await buy(cf, coinInfo.coin, amount, -1)
                                                send_msg(`合约做多=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                printLog(`合约做多=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                _G(`posLCount_${coinInfo.coin}`, '0')
                                            } else {
                                                if (coinInfo.orderType == "maker") {
                                                    //只做maker
                                                    await buy(cf, coinInfo.coin, amount, cur_market_price, cur_market_price, 'GTX')
                                                    send_msg(`合约做多|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    printLog(`合约做多|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    _G(`posLCount_${coinInfo.coin}`, '0')
                                                } else {
                                                    //限价
                                                    await buy(cf, coinInfo.coin, amount, cur_market_price)
                                                    send_msg(`合约做多|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    printLog(`合约做多|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    _G(`posLCount_${coinInfo.coin}`, '0')
                                                }
                                            }
                                            modify_bcoins(coinInfo.coin, 'onPftData1', 0)
                                            modify_bcoins(coinInfo.coin, 'lCount', 1)
                                            modify_bcoins(coinInfo.coin, 'lCount1', 1)
                                        }
                                    }
                                }
                            }
                            if (hy_pos_l[coinInfo.coin] != null) {
                                posL = hy_pos_l[coinInfo.coin];
                            }
                            if (posL != null || hy_pos_l[coinInfo.coin] != null) {
                                //动态止盈
                                let c1 = _G(`posLCount_${coinInfo.coin}`) == null || _G(`posLCount_${coinInfo.coin}`) == 0 ? 1 : Number(_G(`posLCount_${coinInfo.coin}`)) + 1;
                                // if (Number(cur_market_price) > Number(posL.entryPrice) * (1 + coinInfo.stopPft * 0.01) ** c1) {
                                let lC = Number(coinInfo.lCount);
                                if (Number(cur_market_price) > Number(posL.entryPrice) * (1 + coinInfo.stopPft * 0.01 * lC)) {
                                    // if (Number(cur_market_price) > Number(coinInfo.posPrice) * (1 + coinInfo.stopPft * 0.01)) {
                                    // if (Number(cur_market_price) > Number(posL.entryPrice) * (1 + coinInfo.stopPft * 0.01)) {
                                    //卖出 利润大于 stopPft% sellRate%
                                    if (Number(posL.positionAmt) <= amount) {
                                        //清仓
                                        await buy_close(cf, coinInfo.coin, Number(posL.positionAmt))
                                        send_msg(`合约多单清仓=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${Number(posL.positionAmt)} 价格:${cur_market_price}`);
                                        printLog(`合约多单清仓=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${Number(posL.positionAmt)} 价格:${cur_market_price}`)
                                        _G(`posLCount_${coinInfo.coin}`, c1.toString())
                                        modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'lCount', 1)
                                    } else {
                                        let _amount = Number((Number(posL.positionAmt) * coinInfo.sellRate * 0.01).toFixed(right_size))
                                        if (_amount > amount) {
                                            await buy_close(cf, coinInfo.coin, _amount)
                                            send_msg(`合约多单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${_amount} 价格:${cur_market_price}`);
                                            printLog(`合约多单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${_amount} 价格:${cur_market_price}`)
                                            _G(`posLCount_${coinInfo.coin}`, c1.toString())
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                            modify_bcoins(coinInfo.coin, 'lCount', lC + 1)
                                        } else {
                                            await buy_close(cf, coinInfo.coin, amount)
                                            send_msg(`合约多单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${amount} 价格:${cur_market_price}`);
                                            printLog(`合约多单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${amount} 价格:${cur_market_price}`)
                                            _G(`posLCount_${coinInfo.coin}`, c1.toString())
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                            modify_bcoins(coinInfo.coin, 'lCount', lC + 1)
                                        }
                                    }
                                }
                            }
                            if (hy_pos_s[coinInfo.coin] != null) {
                                posS = hy_pos_s[coinInfo.coin]
                            }
                            if (posS != null) {
                                pos_hy_s.map(v => {
                                    cf.calAllOrder(coinInfo.coin, { orderId: v.orderId.toString() }).then(res => {
                                        printLog(`撤销订单`)
                                    }).catch(err => {
                                        console.log(`撤销订单异常`, err)
                                        printLog(`撤销订单异常`)
                                    })
                                })
                                if (coinInfo.stopLoss > 0) {
                                    // 平空 开多
                                    await sell_close(cf, coinInfo.coin, Math.abs(Number(posS.positionAmt)))
                                    send_msg(`合约空单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`);
                                    printLog(`合约空单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`)
                                    let am1 = totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01 * coinInfo.fOrderRate * 0.01
                                    let amount_u1 = coinInfo.minAmount > am1 ? coinInfo.minAmount : am1;
                                    let amount1 = Number((amount_u1 / cur_market_price).toFixed(right_size));
                                    // if ((coinInfo.isNowDo == true || coinInfo.isNowDo == "true") && posL == null) {
                                    //     await buy(cf, coinInfo.coin, amount1, -1)
                                    // }
                                    // else {
                                    //     if (posL == null) {
                                    //         await buy(cf, coinInfo.coin, amount1, -1)
                                    //     }
                                    // }
                                    modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                    modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                    modify_bcoins(coinInfo.coin, 'lCount', 1)
                                    modify_bcoins(coinInfo.coin, 'lCount1', 1)
                                    await Sleep(2000)

                                } else {
                                    // 平空 停止
                                    if (Number(cur_market_price) > Number(posS.entryPrice) * (1 + Math.abs(coinInfo.stopLoss) * 0.01)) {
                                        //平空
                                        await sell_close(cf, coinInfo.coin, Math.abs(Number(posS.positionAmt)))
                                        send_msg(`合约空单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`);
                                        printLog(`合约空单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`)
                                        let am1 = totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01 * coinInfo.fOrderRate * 0.01
                                        let amount_u1 = coinInfo.minAmount > am1 ? coinInfo.minAmount : am1;
                                        let amount1 = Number((amount_u1 / cur_market_price).toFixed(right_size));
                                        // if ((coinInfo.isNowDo == true || coinInfo.isNowDo == "true") && posL == null) {
                                        //     await buy(cf, coinInfo.coin, amount1, -1)
                                        // } else {
                                        //     if (posL == null) {
                                        //         await buy(cf, coinInfo.coin, amount1, -1)
                                        //     }
                                        // }
                                        modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'lCount', 1)
                                        modify_bcoins(coinInfo.coin, 'lCount1', 1)
                                        await Sleep(2000)
                                    }
                                }
                            }
                            if (pos_hy.length > 0) {
                                let time = posTime[`${coinInfo.coin}_hy`]
                                if (time == undefined || Date.now() - time > 1000 * coinInfo.cancelTime) {
                                    //查询订单 撤销订单
                                    pos_hy.map(v => {
                                        cf.calAllOrder(coinInfo.coin, { orderId: v.orderId }).then(res => {
                                            console.log(`撤销订单`, res.status)
                                            printLog(`撤销订单`)
                                        }).catch(err => {
                                            console.log(`撤销订单`, err)
                                            printLog(`撤销订单异常`)
                                        })
                                    })
                                    posTime[`${coinInfo.coin}_hy`] = Date.now();
                                }
                            }
                        }
                        if (doShort && coinInfo.status == 1) {
                            if ((doShort1 || buy_hy_s || coinInfo.startNowDo == 'true') && posS == null && pos_hy_s.length == 0 && (time.getHours() >= coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                                //杠杆
                                await cf.leverage(coinInfo.coin, coinInfo.lever);
                                if (hy_pos_s[coinInfo.coin] == null) {
                                    if (doShort1 || coinInfo.startNowDo == 'true') {
                                        let am1 = totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01 * coinInfo.fOrderRate * 0.01
                                        let amount_u1 = coinInfo.minAmount > am1 ? coinInfo.minAmount : am1;
                                        let amount1 = Number((amount_u1 / cur_market_price).toFixed(right_size));
                                        //市价开仓
                                        await sell(cf, coinInfo.coin, amount1, -1)
                                        send_msg(`首单合约做空=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount1} 价格${cur_market_price}`)
                                        printLog(`首单合约做空=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount1} 价格${cur_market_price}`)
                                        modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                        _G(`posSCount_${coinInfo.coin}`, '0')
                                        modify_bcoins(coinInfo.coin, 'onPftData2', 0)
                                        modify_bcoins(coinInfo.coin, 'sCount', 1)
                                        modify_bcoins(coinInfo.coin, 'sCount1', 1)
                                        await Sleep(2000)
                                    }
                                } else {
                                    if (Number(cur_market_price) > Number(hy_pos_s[coinInfo.coin].entryPrice)) {
                                        if (amount > 0) {
                                            //开仓
                                            if (coinInfo.orderType == "market") {
                                                //市价开仓
                                                send_msg(`合约做空=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                printLog(`合约做空=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                await sell(cf, coinInfo.coin, amount, -1)
                                                _G(`posSCount_${coinInfo.coin}`, '0')
                                            } else {
                                                if (coinInfo.orderType == "maker") {
                                                    //只做maker
                                                    send_msg(`合约做空|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    printLog(`合约做空|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    await sell(cf, coinInfo.coin, amount, cur_market_price, cur_market_price, 'GTX')
                                                    _G(`posSCount_${coinInfo.coin}`, '0')
                                                } else {
                                                    //限价
                                                    send_msg(`合约做空|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    printLog(`合约做空|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                                    await sell(cf, coinInfo.coin, amount, cur_market_price)
                                                    _G(`posSCount_${coinInfo.coin}`, '0')
                                                }
                                            }
                                            modify_bcoins(coinInfo.coin, 'onPftData2', 0)
                                            modify_bcoins(coinInfo.coin, 'sCount', 1)
                                            modify_bcoins(coinInfo.coin, 'sCount1', 1)
                                        }
                                    }
                                }
                            }
                            if (hy_pos_s[coinInfo.coin] != null) {
                                posS = hy_pos_s[coinInfo.coin]
                            }
                            if (posS != null || hy_pos_s[coinInfo.coin] != null) {
                                let c2 = _G(`posSCount_${coinInfo.coin}`) == null || _G(`posSCount_${coinInfo.coin}`) == 0 ? 1 : Number(_G(`posSCount_${coinInfo.coin}`)) + 1;
                                // if (Number(cur_market_price) < Number(posS.entryPrice) * (1 - coinInfo.stopPft * 0.01)) {
                                // if (Number(cur_market_price) < Number(posS.entryPrice) * (1 - coinInfo.stopPft * 0.01) ** c2) {
                                let sC = Number(coinInfo.sCount)
                                if (Number(cur_market_price) < Number(posS.entryPrice) * (1 - coinInfo.stopPft * 0.01 * sC)) {
                                    // if (Number(cur_market_price) < Number(coinInfo.posPrice) * (1 - coinInfo.stopPft * 0.01)) {
                                    //平空
                                    if (Math.abs(Number(posS.positionAmt)) <= amount) {
                                        //清仓
                                        await sell_close(cf, coinInfo.coin, Math.abs(Number(posS.positionAmt)))
                                        send_msg(`合约|空单清仓=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`);
                                        printLog(`合约|空单清仓=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`)
                                        _G(`posSCount_${coinInfo.coin}`, c2.toString())
                                        modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'sCount', 1)
                                    } else {
                                        let _amount = Number((Math.abs(Number(posS.positionAmt)) * coinInfo.sellRate * 0.01).toFixed(right_size))
                                        if (_amount > amount) {
                                            await sell_close(cf, coinInfo.coin, _amount)
                                            send_msg(`合约|空单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${_amount} 价格:${cur_market_price}`);
                                            printLog(`合约|空单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${_amount} 价格:${cur_market_price}`)
                                            _G(`posSCount_${coinInfo.coin}`, c2.toString())
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                            modify_bcoins(coinInfo.coin, 'sCount', sC + 1)
                                        } else {
                                            await sell_close(cf, coinInfo.coin, amount)
                                            send_msg(`合约|空单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${amount} 价格:${cur_market_price}`);
                                            printLog(`合约|空单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${amount} 价格:${cur_market_price}`)
                                            _G(`posSCount_${coinInfo.coin}`, c2.toString())
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                            modify_bcoins(coinInfo.coin, 'sCount', sC + 1)
                                        }
                                    }
                                }
                            }
                            if (hy_pos_l[coinInfo.coin] != null) {
                                posL = hy_pos_l[coinInfo.coin]
                            }
                            if (posL != null) {
                                pos_hy_l.map(v => {
                                    cf.calAllOrder(coinInfo.coin, { orderId: v.orderId.toString() }).then(res => {
                                        printLog(`撤销订单`)
                                    }).catch(err => {
                                        console.log(`撤销订单异常`, err)
                                        printLog(`撤销订单异常`)
                                    })
                                })
                                if (coinInfo.stopLoss > 0) {
                                    // 平多 开空
                                    await buy_close(cf, coinInfo.coin, Number(posL.positionAmt))
                                    send_msg(`合约多单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posL.positionAmt))} 价格:${cur_market_price}`);
                                    printLog(`合约多单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posL.positionAmt))} 价格:${cur_market_price}`)

                                    let am1 = totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01 * coinInfo.fOrderRate * 0.01
                                    let amount_u1 = coinInfo.minAmount > am1 ? coinInfo.minAmount : am1;
                                    let amount1 = Number((amount_u1 / cur_market_price).toFixed(right_size));
                                    // if ((coinInfo.isNowDo == true || coinInfo.isNowDo == "true") && posS == null) {
                                    //     await sell(cf, coinInfo.coin, amount1, -1)
                                    // } else {
                                    //     if (posS == null) {
                                    //         await sell(cf, coinInfo.coin, amount1, -1)
                                    //     }
                                    // }
                                    modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                    modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                    modify_bcoins(coinInfo.coin, 'sCount', 1)
                                    modify_bcoins(coinInfo.coin, 'sCount1', 1)
                                    await Sleep(2000)
                                } else {
                                    // 平多 停止
                                    if (Number(cur_market_price) < Number(posL.entryPrice) * (1 - Math.abs(coinInfo.stopLoss) * 0.01)) {
                                        //平多
                                        await buy_close(cf, coinInfo.coin, Number(posL.positionAmt))
                                        send_msg(`合约多单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posL.positionAmt))} 价格:${cur_market_price}`);
                                        printLog(`合约多单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posL.positionAmt))} 价格:${cur_market_price}`)
                                        let am1 = totalWalletBalance * (coinInfo.lever - 1) * coinInfo.orderRate * 0.01 * coinInfo.fOrderRate * 0.01
                                        let amount_u1 = coinInfo.minAmount > am1 ? coinInfo.minAmount : am1;
                                        let amount1 = Number((amount_u1 / cur_market_price).toFixed(right_size));
                                        // if ((coinInfo.isNowDo == true || coinInfo.isNowDo == "true") && posS == null) {
                                        //     await sell(cf, coinInfo.coin, amount1, -1)
                                        // } else {
                                        //     if (posS == null) {
                                        //         await sell(cf, coinInfo.coin, amount1, -1)
                                        //     }
                                        // }
                                        modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                        modify_bcoins(coinInfo.coin, 'sCount', 1)
                                        modify_bcoins(coinInfo.coin, 'sCount1', 1)
                                        await Sleep(2000)
                                    }
                                }
                            }
                            if (pos_hy.length > 0) {
                                let time = posTime[`${coinInfo.coin}_hy`]
                                if (time == undefined || Date.now() - time > 1000 * coinInfo.cancelTime) {
                                    //查询订单 撤销订单
                                    pos_hy.map(v => {
                                        cf.calAllOrder(coinInfo.coin, { orderId: v.orderId.toString() }).then(res => {
                                            printLog(`撤销订单`)
                                        }).catch(err => {
                                            console.log(`撤销订单异常`, err)
                                            printLog(`撤销订单异常`)
                                        })
                                    })
                                    posTime[`${coinInfo.coin}_hy`] = Date.now();
                                }
                            }
                        }
                        if (posS != null && coinInfo.stopLoss > 0) {
                            let sC1 = Number(coinInfo.sCount1)
                            if (Number(cur_market_price) > Number(posS.entryPrice) * (1 + Math.abs(coinInfo.stopLoss) * 0.01 * sC1)) {
                                // if (Number(cur_market_price) > Number(coinInfo.posPrice2) * (1 + Math.abs(coinInfo.stopLoss) * 0.01)) {
                                //平空
                                let am = coinInfo.stopLossRate * 0.01 * Math.abs(Number(posS.positionAmt))
                                am = _N(am, right_size)
                                if (am > amount) {
                                    await sell_close(cf, coinInfo.coin, am)
                                    send_msg(`2|合约空单止损${coinInfo.stopLossRate}%=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${am} 价格:${cur_market_price}`);
                                    printLog(`2|合约空单止损${coinInfo.stopLossRate}%=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${am} 价格:${cur_market_price}`)
                                    modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                    modify_bcoins(coinInfo.coin, 'sCount1', sC1 + 1)

                                }

                            }
                        }
                        if (posL != null && coinInfo.stopLoss > 0) {
                            let lC1 = Number(coinInfo.lCount1)
                            if (Number(cur_market_price) < Number(posL.entryPrice) * (1 - Math.abs(coinInfo.stopLoss) * 0.01 * lC1)) {
                                // if (Number(cur_market_price) < Number(coinInfo.posPrice2) * (1 - Math.abs(coinInfo.stopLoss) * 0.01)) {
                                //平多
                                let am = coinInfo.stopLossRate * 0.01 * Number(posL.positionAmt)
                                am = _N(am, right_size)
                                if (am > amount) {
                                    await buy_close(cf, coinInfo.coin, am)
                                    send_msg(`2|合约多单止损${coinInfo.stopLossRate}%=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${am} 价格:${cur_market_price}`);
                                    printLog(`2|合约多单止损${coinInfo.stopLossRate}%=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${am} 价格:${cur_market_price}`)
                                    modify_bcoins(coinInfo.coin, 'posPrice2', Number(cur_market_price))
                                    modify_bcoins(coinInfo.coin, 'sCount1', lC1 + 1)
                                }

                            }
                        }
                        // console.log(`${coinInfo.coin}|posPrice2=${Number(coinInfo.posPrice2)}|posPrice=${Number(coinInfo.posPrice)}`)
                    }
                }
                //core end
                await sleep(2000)
            }
            await sleep(1000)
        } catch (err) {
            console.log('系统异常=>', err.response == undefined ? err : err.response)
            printLog(`${err.response == undefined ? '' : err.response.data == undefined ? '' : JSON.stringify(err.response.data)}`)
            await sleep(2500)
        }
    }
}

function init_setting_data() {
    let root = localStorage.getItem('root')
    if (root == null || root == '') {
        localStorage.setItem('root', configData);
    } else {
        let _configJson = JSON.parse(configData)
        if (_configJson.isRestart) {
            localStorage.setItem('root', configData);
        }
    }
}
/**
 * 截取小数位
 * @param {*} subStr 
 * @param {*} len 
 * @returns 
 */
function toSubNum(subStr, len) {
    let a1 = subStr.toString().split('.')
    let a2 = a1[1].substring(0, len)
    let a3 = Number(`${a1[0]}.${a2}`)
    return a3;
}
function get_json_data() {
    try {
        let configData = localStorage.getItem('root');
        return JSON.parse(configData);
    } catch {
        // 创建
        fs.mkdirSync('root')
        fs.writeFile('./root/root', '', err => {
            if (err) {
                console.error(err)
                return;
            }
        })
        init_setting_data()
        let configData = localStorage.getItem('root');
        return JSON.parse(configData);
    }

}

function modify_json_data(data) {
    let _data = JSON.stringify(data);
    localStorage.setItem('root', _data);
}
function updatePositionSide() {
    cf.getPositionSide().then(response => {
        let dual = response.data.dualSidePosition;
        if (!dual) {
            cf.updatePositionSide(true).then(res => {
                printLog(`更改持仓方向:${JSON.stringify(res.data)}`)
            }).catch(err => {
                printLog(`更改持仓方向发生错误=>${err}`)
            })
        }
    }).catch(err => {
        // console.error("获取持仓方向发生错误" + err)
        printLog(`获取持仓方向发生错误=>${err}`)
    })
}
async function main() {
    await loop_run();
}
app.get("/api/account", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        if (r.type == 'xh') {
            let acc = await cs.account({ recvWindow: 5000 });
            data.list = acc.data;
        } else {
            let acc1 = await cf.account({ recvWindow: 5000 });
            data.list = acc1.data;
        }
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
});
app.get("/api/dlog", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        Log(null)
        printLog(`日志已清空`)
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
});
app.get("/api/logs", function (req, res) {
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
        printLog(`系统异常`)
        res.json(data)
    }
});

app.get("/api/config", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        r.data = get_json_data().bCoins;
        r.page = Number(r.page);
        r.pageSize = Number(r.pageSize);
        r.total = r.data.length;
        res.json(r);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
});

app.get("/api/configKey", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let data = get_json_data();
        let _env = data.env == 'dev' ? true : false;
        res.json({ apiKey: data.apiKey, env: _env, apiSecret: data.apiSecret, proxyIp: data.proxyIp, proxy: data.proxy });
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
});
app.get("/api/setConfigKey", async function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query;
        let _data = get_json_data();
        if (r.apiKey != undefined) {
            _data.apiKey = r.apiKey;
        }
        if (r.apiSecret != undefined) {
            _data.apiSecret = r.apiSecret;
        }
        if (r.apiSecret != undefined && r.apiKey != undefined) {
            cf = new Future(r.apiKey, r.apiSecret, { ip: _data.proxyIp, port: _data.proxy });
            cs = new XhSpot(r.apiKey, r.apiSecret, { ip: _data.proxyIp, port: _data.proxy });
        }
        if (r.proxy != undefined) {
            _data.proxy = r.proxy;
        }
        if (r.proxyIp != undefined) {
            _data.proxyIp = r.proxyIp;
        }
        if (r.env != undefined) {
            _data.env = r.env == 'true' ? 'dev' : 'prod';
        }
        if (r.env != 'true') {
            cf = new Future(_data.apiKey, _data.apiSecret, { ip: r.proxyIp, port: r.proxy });
            cs = new XhSpot(_data.apiKey, _data.apiSecret, { ip: r.proxyIp, port: r.proxy });
        }
        modify_json_data(_data)
        updatePositionSide();
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
});

app.get('/api/coin/del', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let _data = get_json_data();
        let symbolIndex = _data.bCoins.findIndex(index => index.key == r.key)
        if (symbolIndex != undefined && symbolIndex != -1) {
            _data.bCoins.splice(symbolIndex, 1)
            modify_json_data(_data)
            data.data = true;
            res.json(data)
        } else {
            data.code = -2;
            data.message = '策略编号有误'
            printLog(`策略编号有误`)
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
})
app.get('/api/coin/startOrStop', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let status = r.status == '1' ? 0 : 1;
        //
        let _data = get_json_data();
        let proxy = ''
        let proxyIp = ''
        if (_data.env == 'dev') {
            proxyIp = _data.proxyIp
            proxy = _data.proxy
        }
        let symbolIndex = _data.bCoins.filter(index => index.type == r.type && index.key != r.key && index.status == 1 && index.coin == r.coin)
        if (symbolIndex.length > 0) {
            data.code = -3;
            data.message = '请先停止该币种运行中的策略'
            res.json(data)
        } else {
            modify_bcoins_byId(r.key, 'status', status)
            modify_bcoins_byId(r.key, 'lCount', 1)
            modify_bcoins_byId(r.key, 'sCount', 1)
            modify_bcoins_byId(r.key, 'lCount1', 1)
            modify_bcoins_byId(r.key, 'sCount1', 1)
            printLog(`策略已${status == 0 ? '停止' : '启动'}`)
            stopTime = Date.now();
            if (r.type == 'hy' && status == 1) {
                cf = new Future(_data.apiKey, _data.apiSecret, { ip: proxyIp, port: proxy });
                //交易检查
                let acc1 = await cf.account({ recvWindow: 5000 });
                let totalWalletBalance = Number(acc1.data.totalWalletBalance);
                let busd = 0;
                acc1.data.assets.map((v) => {
                    if (v.asset == 'BUSD') {
                        busd = v.walletBalance
                    }
                })
                printLog(`合约余额:usdt=>${totalWalletBalance},busd=>${busd}`)
            } else {
                if (status == 1) {
                    cs = new XhSpot(_data.apiKey, _data.apiSecret, { ip: proxyIp, port: proxy });
                    let acc = await cs.account({ recvWindow: 5000 });
                    acc.data.balances.map(v => {
                        if (v.asset == 'USDT') {
                            xh_totalWalletBalance = Number(v.free);//可用U
                        }
                        if (v.asset == 'BUSD') {
                            xh_totalWalletBalance_b = Number(v.free);//可用U
                        }
                    })
                    printLog(`现货余额:usdt=>${xh_totalWalletBalance},busd=>${xh_totalWalletBalance_b}`)
                }
            }
            res.json(data)
        }
    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        printLog(`API异常`)
        res.json(data)
    }
})
/**
 * 
 */
app.get('/api/coin/addOrUpdate', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let _data = get_json_data();
        if (r.key != undefined) {
            if (r.status == '1') {
                data.code = -2;
                data.message = '当前策略运行中,请停止后修改'
                res.json(data)
            } else {
                //修改
                _data.bCoins.forEach(v => {
                    if (v.key == r.key) {
                        v.status = Number(r.status);
                        v.type = r.type
                        v.orderRate = Number(r.orderRate)
                        v.fOrderRate = Number(r.fOrderRate)
                        v.lever = Number(r.lever)
                        v.margin = Number(r.margin)
                        v.minAmount = Number(r.minAmount)
                        v.stopPft = Number(r.stopPft)
                        v.sellRate = Number(r.sellRate)
                        v.stopLoss = Number(r.stopLoss)
                        v.stopLossRate = Number(r.stopLossRate)

                        v.startTime = Number(r.startTime)
                        v.endTime = Number(r.endTime)
                        v.cancelTime = Number(r.cancelTime)

                        v.startNowDo = r.startNowDo
                        v.isNowDo = r.isNowDo
                        v.coin = r.coin
                        v.indicator = r.indicator
                        v.orderType = r.orderType
                    }
                })
                modify_json_data(_data)
                res.json(data)
            }

        } else {
            //新增
            // let symbolIndex = _data.bCoins.findIndex(index => index.type == r.type && index.coin == r.coin)
            let symbolIndex = _data.bCoins.findIndex(index => index.type == r.type && r.indicator.toString() == index.indicator.toString() && index.coin == r.coin)

            if (symbolIndex != undefined && symbolIndex != -1) {
                data.code = -2;
                data.message = '该币种已经添加无需重复添加'
                res.json(data)
            } else {
                let key = _data.bCoins.map((v) => {
                    return v.key
                })
                let keyLast = (key.sort((a, b) => b - a))[0]
                if (keyLast == undefined) keyLast = 0;
                let _data2 = {
                    key: keyLast + 1,
                    status: 0,
                    type: r.type,
                    orderRate: Number(r.orderRate),
                    fOrderRate: Number(r.fOrderRate),
                    lever: Number(r.lever),
                    margin: Number(r.margin),
                    minAmount: Number(r.minAmount),
                    stopPft: Number(r.stopPft),
                    sellRate: Number(r.sellRate),
                    stopLoss: Number(r.stopLoss),
                    stopLossRate: Number(r.stopLossRate),
                    startTime: Number(r.startTime),
                    endTime: Number(r.endTime),
                    cancelTime: Number(r.cancelTime),
                    coin: r.coin,
                    startNowDo: r.startNowDo,
                    isNowDo: r.isNowDo,
                    indicator: r.indicator,
                    orderType: r.orderType,
                }
                _data.bCoins.push(_data2)
                modify_json_data(_data)
                res.json(data)
            }
        }
    } catch (error) {
        data.code = -3;
        data.message = '系统异常'
        printLog(`系统异常`)
        res.json(data)
    }
})

app.get('/api/coin/sellOne', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        if (stopTime != null && Date.now() - stopTime < 10 * 1000) {
            printLog(`策略刚刚停止,请10秒后再执行平仓`)
            data.code = -5;
            data.message = '策略刚刚停止,请10秒后再执行平仓'
            res.json(data)
        } else {
            let r = req.query
            let coin = r.symbol;
            if (r.type == 'hy') {
                printLog(`${coin}合约平仓`)
                //多单 空单数量
                let acc = await cf.account({ recvWindow: 5000 });
                acc.data.positions.map(v => {
                    if (v.symbol == coin) {
                        if (Number(v.positionAmt) > 0) {
                            buy_close(cf, v.symbol, Math.abs(Number(v.positionAmt)))
                        }
                        if (Number(v.positionAmt) < 0) {
                            sell_close(cf, v.symbol, Math.abs(Number(v.positionAmt)))
                        }
                    }
                });
            } else {
                printLog(`${coin}现货平仓`)
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
        }

    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        printLog(`API异常`)
        res.json(data)
    }
})

/**
 * 
 */
app.get('/api/coin/sellAll', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        if (stopTime != null && Date.now() - stopTime < 10 * 1000) {
            printLog(`策略刚刚停止,请10秒后再执行平仓`)
            data.code = -5;
            data.message = '策略刚刚停止,请10秒后再执行平仓'
            res.json(data)
        } else {
            let r = req.query
            if (r.type == 'hy') {
                //多单 空单数量
                let acc = await cf.account({ recvWindow: 5000 });
                acc.data.positions.map(v => {
                    if (Number(v.positionAmt) > 0) {
                        buy_close(cf, v.symbol, Math.abs(Number(v.positionAmt)))
                    }
                    if (Number(v.positionAmt) < 0) {
                        sell_close(cf, v.symbol, Math.abs(Number(v.positionAmt)))
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
        }

    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        printLog(`API异常`)
        res.json(data)
    }
})
/**
 * 
 */
app.get('/api/coin/getPos', async (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        if (r.type == 'hy') {
            let _list = []
            if (hy_pos_l[r.coin] != null) {
                let d = hy_pos_l[r.coin];
                let _d = `交易对:${d.symbol} | 未实现盈亏:${d.unrealizedProfit} | 持仓价:${d.entryPrice} | 持仓方向:${d.positionSide} | 持仓数量:${Math.abs(d.positionAmt)}`;
                _list.push(_d)
            }
            if (hy_pos_s[r.coin] != null) {
                let d = hy_pos_s[r.coin];
                let _d = `交易对:${d.symbol} | 未实现盈亏:${d.unrealizedProfit} | 持仓价:${d.entryPrice} | 持仓方向:${d.positionSide} | 持仓数量:${Math.abs(d.positionAmt)}`;
                _list.push(_d)
            }
            data.list = _list;
        }
        if (r.type == 'xh') {
            let _list1 = []
            if (xh_pos[r.coin] != null) {
                let d = xh_pos[r.coin];
                let _d = `交易对:${d.asset} | 数量:${d.free} | 锁定:${d.locked}`;
                _list1.push(_d)
            }
            data.list = _list1;
        }
        res.json(data)
    } catch (error) {
        data.code = -3;
        data.message = 'API异常'
        printLog(`API异常`)
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
                let pos_hy1 = await cf.openOrders({ symbol: r.coin, limit: 500 })
                pos_hy1.data.sort((a, b) => b.time - a.time)
                data.total = pos_hy1.length;
                data.list = JSON.parse(JSON.stringify(pos_hy1.data).replace(/orderId/g, 'key'));
            } else {
                // let pos_hy = await cf.allOrders(r.coin, { limit: 500 })
                let pos_hy = await cf.userTrades(r.coin, { limit: 500 })

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
        printLog(`API异常`)
        res.json(data)
    }
})

main()
//监听
app.listen(listenPort, () => {
    printLog(`Ep服务监听:http://127.0.0.1:${listenPort}`)
})
