
const express = require('express')
const { LocalStorage } = require("node-localstorage")
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const { cf, cs, configJson, TA } = require('../app/binanceApi')
let listenPort = configJson.listenPort;

let localStorage = new LocalStorage('./root');
let _g = new LocalStorage('./_G');
const fs = require('fs');
let configData = fs.readFileSync("./data/setting.json");

const { buy, buy_close, send_msg, msg_on, init_tg, sell, sell_close, buy_xh, sell_xh, records_xh } = require('../app/message')
let coinList = [];
let sendTime = {};
let onPftData1 = {};
let onPftData2 = {};
let SymbolsEx = [];
let SymbolsExXh = [];
let symbolFlag = {};
let symbolTimeData = {}
let pos = {};
let posTime = {}
let xh_totalWalletBalance = 0;
let buy_xh_f = false;
let buy_hy_l = false;
let buy_hy_s = false;
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function _G(key, value = '') {
    if (value == '') {
        return _g.getItem(key)
    } else {
        _g.setItem(key, value)
    }
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
        let totalWalletBalance = 0;
        acc.data.balances.map(v => {
            if (v.asset == 'USDT') {
                totalWalletBalance = Number(v.free);//可用U
            }
        })
        totalWalletBalance = totalWalletBalance > xh_totalWalletBalance ? totalWalletBalance : xh_totalWalletBalance;
        acc.data.balances.map(v => {
            if (Number(v.free) == 0 && Number(v.locked) == 0 && v.asset == cointype.replace('USDT', '')) {
                _G('dtSell', null)
            }
            if (Number(v.free) > 0 && v.asset == cointype.replace('USDT', '')) {
                posL = v;
                if (Number(v.free < Number(minQty))) {
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
                let xhAmount_u = totalWalletBalance * coinInfo.orderRate < coinInfo.minAmount ? coinInfo.minAmount : totalWalletBalance * coinInfo.orderRate;
                let xhAmount = Number((xhAmount_u / cur_market_price).toFixed(right_size));
                let dtSell = _G('dtSell')
                if (Number(v.free) < xhAmount && (dtSell == null || dtSell == 'null')) {
                    posL = null;
                    console.log('冰山委托没买够', Number(v.free), xhAmount)
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
        let totalWalletBalance = Number(acc.data.totalWalletBalance);
        acc.data.positions.map(v => {
            if (Number(v.positionAmt) > 0 && v.symbol == cointype) {
                posL = v;
                pos[`${cointype}_posL`] = v;
                if (Math.abs(Number(v.notional)) < totalWalletBalance * coinInfo.orderRate) {
                    posL = null;
                    buy_hy_l = true;
                    console.log('合约-多单-冰山委托没有买够...')
                } else {
                    buy_hy_l = false;
                }
            }
            if (Number(v.positionAmt) < 0 && v.symbol == cointype) {
                posS = v;
                pos[`${cointype}_posS`] = v;
                if (Math.abs(Number(v.notional)) < totalWalletBalance * coinInfo.orderRate) {
                    posS = null;
                    buy_hy_s = true;
                    console.log('合约-空单-冰山委托没有卖够...')
                } else {
                    buy_hy_s = false;
                }
            }
        });
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
/**
 * 特定格式化时间转数字
 * @param {*} time 
 * @returns 
 */
function toTimeToNum(time) {
    let a = time.toString().toUpperCase();
    let baseNum = 1000 * 60 * 5;
    if (a.indexOf('M') >= 0) {
        baseNum = 1000 * 60;
    }
    if (a.indexOf('H') >= 0) {
        baseNum = 1000 * 60 * 60;
    }
    let num = Number(a.substring(0, a.length - 1))
    return num * baseNum;
}
async function loop_run() {
    while (true) {
        try {
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
                    indicator.map((v, i) => {
                        if (v.toUpperCase().includes('KDJ')) {
                            isKdj = i;
                        }
                        if (v.toUpperCase().includes('MA')) {
                            isMa = i;
                        }
                        if (v.toUpperCase().includes('SAR')) {
                            isSar = i;
                        }
                        if (v.toUpperCase().includes('BOLL')) {
                            isBoll = i;
                        }
                    });
                    symbolFlag[coinInfo.coin] = { isKdj: isKdj, isMa: isMa, isSar: isSar, isBoll: isBoll, doLong: doLong, doShort: doShort, doLong1: doLong1, doShort1: doShort1 }
                    if (isKdj >= 0) {
                        let t1 = indicator[isKdj].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }

                        let kdj = TA.KDJ(records, t2[1], t2[2], t2[3]);
                        // let k1 = kdj[0][kdj[0].length - 1]
                        // let k2 = kdj[0][kdj[0].length - 2]
                        // let d1 = kdj[1][kdj[1].length - 1]
                        // let d2 = kdj[1][kdj[1].length - 2]
                        let k1 = kdj[0][kdj[0].length - 2]
                        let k2 = kdj[0][kdj[0].length - 3]
                        let d1 = kdj[1][kdj[1].length - 2]
                        let d2 = kdj[1][kdj[1].length - 3]
                        let tt1 = sendTime[`t_${t2[0]}`]
                        if (tt1 == undefined || Date.now() - tt1 > 1000 * 60) {
                            console.log(coinInfo.coin, kt, '=>', `KDJ${t2[1]}`, 'k', k1, `KDJ${t2[2]}`, 'd', d2, '|', totalWalletBalance, '|', pos)
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
                            // let tt = sendTime[`${coinInfo.coin}_${t2[0]}`]
                            // if (tt == undefined || Date.now() - tt > toTimeToNum(kt)) {
                            //     send_msg(`${coinInfo.coin}|${kt}|金叉=>K${t2[1]}|${k1}|D${t2[2]}|${d1}`)
                            //     sendTime[`${coinInfo.coin}_${t2[0]}`] = Date.now();
                            // }
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
                            // let tt = sendTime[`${coinInfo.coin}_${t2[0]}_1`]
                            // if (tt == undefined || Date.now() - tt > toTimeToNum(kt)) {
                            //     send_msg(`${coinInfo.coin}|${kt}|死叉=>K${t2[1]}|${k1}|D${t2[2]}|${d1}`)
                            //     sendTime[`${coinInfo.coin}_${t2[0]}_1`] = Date.now();
                            // }
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
                    if (isMa >= 0) {
                        let t1 = indicator[isMa].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 1500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 1500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 1500)
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
                                console.log(coinInfo.coin, kt, '=>', `MA${t2[1]}`, ma1[ma1.length - 1], `MA${t21[1]}`, ma2[ma2.length - 1], '|', totalWalletBalance, '|', pos)
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
                                records = await records_xh(coinInfo.coin, kt, 500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }
                        let sar = TA.SAR(records, Number(t2[1]), Number(t2[2]))
                        let tt1 = sendTime[`t_${coinInfo.coin}_${t2[0]}`]
                        if (tt1 == undefined || Date.now() - tt1 > 1000 * 60) {
                            console.log(coinInfo.coin, kt, '=>', 'SAR', sar[sar.length - 1], sar[sar.length - 2], '|', totalWalletBalance, '|', pos)
                            sendTime[`t_${coinInfo.coin}_${t2[0]}`] = Date.now();
                        }
                        if (sar[sar.length - 1] < cur_market_price && sar[sar.length - 2] > cur_market_price) {
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
                        if (sar[sar.length - 1] > cur_market_price && sar[sar.length - 2] < cur_market_price) {
                            if (isSar == 0) {
                                doShort1 = true;
                            } else {
                                doLong1 = doLong1 && false;
                                doShort1 = doShort1 && true;
                            }
                            if (!buy_hy_s) {
                                buy_hy_s = doShort1;
                            }
                            // let tt = sendTime[`${coinInfo.coin}_${t2[0]}_1`]
                            // if (tt == undefined || Date.now() - tt > toTimeToNum(kt)) {
                            //     send_msg(`${coinInfo.coin}|${kt}|死叉=>SAR${sar[sar.length - 1]}|${sar[sar.length - 2]}|curPrice${cur_market_price}`)
                            //     sendTime[`${coinInfo.coin}_${t2[0]}_1`] = Date.now();
                            // }
                        }
                        if (sar[sar.length - 1] < cur_market_price) {
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
                    }
                    if (isBoll >= 0) {
                        let t1 = indicator[isBoll].split('&')
                        let kt = t1[0];
                        let t2 = t1[1].split('|');
                        let doTime = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`];
                        if (doTime == undefined || doTime == null) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else if (Date.now() - doTime > 60000) {
                            if (coinInfo.type == 'xh') {
                                records = await records_xh(coinInfo.coin, kt, 500)
                            } else {
                                records = await cf.records(coinInfo.coin, kt, 500)
                            }
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}`] = Date.now();
                            symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`] = records;
                        } else {
                            records = symbolTimeData[`${coinInfo.coin}_${t2[0]}_${kt}_data`]
                        }
                        let boll = TA.BOLL(records, t2[1], t2[2])
                        let downLine = boll[2]
                        let downL = downLine[downLine.length - 1];
                        if (downL > cur_market_price) {
                            if (isBoll == 0) {
                                doLong1 = doLong = true;
                            } else {
                                doLong1 = doLong = doLong && true;
                                doShort1 = doShort = doShort && false;
                            }
                            symbolFlag[coinInfo.coin].isBoll = true
                        } else {
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
                    //高位回落
                    onPftData1[coinInfo.coin] = coinInfo.onPftData1;
                    if (onPftData1[coinInfo.coin] == undefined || onPftData1[coinInfo.coin] == 0) {
                        onPftData1[coinInfo.coin] = Number(cur_market_price)
                        modify_bcoins(coinInfo.coin, 'onPftData1', onPftData1[coinInfo.coin])
                    } else {
                        let maxPrice = Math.max(onPftData1[coinInfo.coin], Number(cur_market_price))
                        onPftData1[coinInfo.coin] = maxPrice
                        modify_bcoins(coinInfo.coin, 'onPftData1', onPftData1[coinInfo.coin])
                    }
                    //低位反弹
                    onPftData2[coinInfo.coin] = coinInfo.onPftData2;
                    if (onPftData2[coinInfo.coin] == undefined || onPftData2[coinInfo.coin] == 0) {
                        onPftData2[coinInfo.coin] = Number(cur_market_price)
                        modify_bcoins(coinInfo.coin, 'onPftData2', onPftData2[coinInfo.coin])
                    } else {
                        let minPrice = Math.min(onPftData2[coinInfo.coin], Number(cur_market_price))
                        onPftData2[coinInfo.coin] = minPrice
                        modify_bcoins(coinInfo.coin, 'onPftData2', onPftData2[coinInfo.coin])
                    }
                    //core start
                    if (coinInfo.type == 'xh') {
                        //查询挂单
                        let pos_xh = await cs.openOrders(coinInfo.coin)
                        pos_xh = pos_xh.data;
                        if ((posL == null) && pos_xh.length == 0 && coinInfo.status == 1 && (time.getHours() > coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                            if (doLong && (doLong1 || buy_xh_f)) {
                                //开仓
                                if (coinInfo.orderType == "market") {
                                    //市价开仓
                                    await buy_xh(coinInfo.coin, xhAmount_u, -1);
                                    //记录价格
                                    modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                    send_msg(`现货买入=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货买入:${xhAmount_u}U 数量:${xhAmount}个 价格:${cur_market_price} 此次总需买入:${totalWalletBalance * coinInfo.orderRate}U`);
                                } else {
                                    //限价
                                    //获取是否有未成交挂单
                                    if (posS == null) {
                                        //市价开仓
                                        await buy_xh(coinInfo.coin, xhAmount, cur_market_price);
                                        //记录价格
                                        if (coinInfo.posPrice == 0) {
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        } else {
                                            let price = (coinInfo.posPrice + Number(cur_market_price)) / 2;
                                            modify_bcoins(coinInfo.coin, 'posPrice', price)
                                        }
                                        send_msg(`现货分批买入=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货买入:${xhAmount_u}U 数量:${xhAmount}个 价格:${cur_market_price} 此次总需买入:${(totalWalletBalance * coinInfo.orderRate).toFixed(2)}U`);
                                    }
                                }
                                modify_bcoins(coinInfo.coin, 'onPftData1', 0)
                            }
                        } else {
                            if (posL != null) {
                                //动态止盈
                                if (doLong) {
                                    // if (Number(cur_market_price) > Number(coinInfo.posPrice) * (1 + coinInfo.stopPft * 0.01) && Number(cur_market_price) < onPftData1[coinInfo.coin] * (1 - coinInfo.stopPftBack * 0.01)) {
                                    //     //卖出
                                    //     let amount = toSubNum(posL.free, right_size)
                                    //     await sell_xh(coinInfo.coin, amount)
                                    //     send_msg(`${coinInfo.coin} 现货市价卖出-止盈 ${amount} ${cur_market_price}`);
                                    // }
                                    if ((Number(cur_market_price) > Number(coinInfo.posPrice) * (1 + coinInfo.stopPft * 0.01) && Number(coinInfo.posPrice) != 0)) {
                                        //卖出 利润大于 stopPft% sellRate%
                                        if (posL.free * coinInfo.sellRate * 0.01 > xhAmount) {
                                            let amount = toSubNum(posL.free * coinInfo.sellRate * 0.01, right_size)
                                            await sell_xh(coinInfo.coin, amount)
                                            send_msg(`现货动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${amount} 价格:${cur_market_price}`);
                                            _G('dtSell', 1)
                                            //追踪更新价位
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        }
                                    }
                                }
                                if (doShort) {
                                    let amount = toSubNum(posL.free, right_size)
                                    if (coinInfo.stopLoss > 0) {
                                        await sell_xh(coinInfo.coin, amount)
                                        send_msg(`${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货卖出-止损-信号反转卖出 数量:${amount} 价格:${cur_market_price}`);
                                        _G('dtSell', null)
                                    } else {
                                        // 平空 停止
                                        if (Number(cur_market_price) < Number(coinInfo.posPrice) * (1 - Math.abs(coinInfo.stopLoss) * 0.01)) {
                                            await sell_xh(coinInfo.coin, amount)
                                            send_msg(`${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 现货卖出-止损-停止运行 数量:${amount} 价格:${cur_market_price}`);
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
                                console.log(`${coinInfo.cancelTime}秒,未成交,撤销订单`, res.status)
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
                                pos_hy_s.push(v)
                            }
                            if (v.positionSide == "LONG") {
                                pos_hy_l.push(v)
                            }
                        })
                        //合约
                        if (doLong) {
                            if ((doLong1 || buy_hy_l) && posL == null && pos_hy_l.length == 0 && coinInfo.status == 1 && (time.getHours() > coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                                //杠杆
                                await cf.leverage(coinInfo.coin, coinInfo.lever);
                                //开仓
                                if (coinInfo.orderType == "market") {
                                    //市价
                                    await buy(coinInfo.coin, amount, -1)
                                    send_msg(`合约做多=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                    _G('posLCount', 0)
                                } else {
                                    //限价
                                    await buy(coinInfo.coin, amount, cur_market_price)
                                    send_msg(`合约做多|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                    _G('posLCount', 0)
                                }
                                modify_bcoins(coinInfo.coin, 'onPftData1', 0)
                            } else {
                                if (posL != null) {
                                    //高位回落止盈
                                    // if (Number(cur_market_price) > Number(posL.entryPrice) * (1 + coinInfo.stopPft * 0.01) && Number(cur_market_price) < onPftData1[coinInfo.coin] * (1 - coinInfo.stopPftBack * 0.01)) {
                                    //     //平多
                                    //     await buy_close(coinInfo.coin, Number(posL.positionAmt))
                                    //     send_msg(`${coinInfo.coin} 市价平多 ${Number(posL.positionAmt)} ${cur_market_price}`)
                                    //     continue;
                                    // }
                                    //动态止盈
                                    let c1 = _G('posLCount') == null || _G('posLCount') == 0 ? 1 : _G('posLCount') + 1;
                                    if (Number(cur_market_price) > Number(posL.entryPrice) * (1 + coinInfo.stopPft * 0.01) ** c1) {
                                        //卖出 利润大于 stopPft% sellRate%
                                        let _amount = Number((Number(posL.positionAmt) * coinInfo.sellRate * 0.01).toFixed(right_size))
                                        if (_amount > amount) {
                                            await buy_close(coinInfo.coin, _amount)
                                            send_msg(`合约多单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 卖出:${coinInfo.sellRate}% 卖出 数量:${_amount} 价格:${cur_market_price}`);
                                            _G('posLCount', c1)
                                            //追踪更新价位
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        }
                                    }
                                }
                                if (posS != null) {
                                    if (coinInfo.stopLoss > 0) {
                                        // 平空 开多
                                        await sell_close(coinInfo.coin, Math.abs(Number(posS.positionAmt)))
                                        send_msg(`合约空单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`);
                                        // if (posL == null && coinInfo.status == 1 && (time.getHours() > coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                                        //     //市价开仓
                                        //     await buy(coinInfo.coin, amount, -1)
                                        //     send_msg(`${coinInfo.coin} 市价开多单 ${amount} ${cur_market_price}`)
                                        //     onPftData1[coinInfo.coin] = 0;
                                        //     continue;
                                        // }
                                    } else {
                                        // 平空 停止
                                        if (Number(cur_market_price) > Number(posS.entryPrice) * (1 + Math.abs(coinInfo.stopLoss) * 0.01)) {
                                            //平空
                                            await sell_close(coinInfo.coin, Math.abs(Number(posS.positionAmt)))
                                            send_msg(`合约空单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posS.positionAmt))} 价格:${cur_market_price}`);
                                            //停止运行
                                            // modify_bcoins(coinInfo.coin, 'status', 0)
                                        }
                                    }
                                }
                            }
                            if (pos_hy.length > 0) {
                                let time = posTime[`${coinInfo.coin}_hy`]
                                if (time == undefined || Date.now() - time > 1000 * coinInfo.cancelTime) {
                                    //查询订单 撤销订单
                                    pos_hy.map(v => {
                                        cf.calOrder(coinInfo.coin, { orderId: v.orderId }).then(res => {
                                            console.log(`撤销订单`, res.status)
                                        }).catch(err => {
                                            console.log(`撤销订单`, err)
                                        })
                                    })
                                    posTime[`${coinInfo.coin}_hy`] = Date.now();
                                }
                            }
                        }
                        if (doShort) {
                            if ((doShort1 || buy_hy_s) && posS == null && pos_hy_s.length == 0 && coinInfo.status == 1 && (time.getHours() > coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                                //杠杆
                                await cf.leverage(coinInfo.coin, coinInfo.lever);
                                //开仓
                                if (coinInfo.orderType == "market") {
                                    //市价开仓
                                    await sell(coinInfo.coin, amount, -1)
                                    send_msg(`合约做空=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                } else {
                                    //限价
                                    await sell(coinInfo.coin, amount, cur_market_price)
                                    send_msg(`合约做空|分批挂单=>指标:${coinInfo.indicator.join('@')} ${coinInfo.coin} 数量:${amount} 价格${cur_market_price}`)
                                }
                                modify_bcoins(coinInfo.coin, 'onPftData2', 0)
                            } else {
                                if (posS != null) {
                                    let c2 = _G('posSCount') == null || _G('posSCount') == 0 ? 1 : _G('posSCount') + 1;
                                    if (Number(cur_market_price) < Number(posS.entryPrice) * (1 - coinInfo.stopPft * 0.01) ** c2) {
                                        //平空
                                        let _amount = Number((Math.abs(Number(posS.positionAmt)) * coinInfo.sellRate * 0.01).toFixed(right_size))
                                        if (_amount > amount) {
                                            await sell_close(coinInfo.coin, _amount)
                                            send_msg(`合约|空单动态止盈=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 利润大于:${coinInfo.stopPft}% 减持:${coinInfo.sellRate}% 数量:${_amount} 价格:${cur_market_price}`);
                                            _G('posSCount', c2)
                                            modify_bcoins(coinInfo.coin, 'posPrice', Number(cur_market_price))
                                        }
                                    }
                                }
                                if (posL != null) {
                                    if (coinInfo.stopLoss > 0) {
                                        // 平多 开空
                                        await buy_close(coinInfo.coin, Number(posL.positionAmt))
                                        send_msg(`合约多单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posL.positionAmt))} 价格:${cur_market_price}`);
                                        // if (posS == null && coinInfo.status == 1 && (time.getHours() > coinInfo.startTime && time.getHours() <= coinInfo.endTime)) {
                                        //     //市价开仓
                                        //     sell(coinInfo.coin, amount, -1)
                                        //     send_msg(`${coinInfo.coin} 市价开空单 ${amount} ${cur_market_price}`)
                                        //     onPftData2[coinInfo.coin] = 0;
                                        // }
                                    } else {
                                        // 平多 停止
                                        if (Number(cur_market_price) < Number(posL.entryPrice) * (1 - Math.abs(coinInfo.stopLoss) * 0.01)) {
                                            //平多
                                            await buy_close(coinInfo.coin, Number(posL.positionAmt))
                                            send_msg(`合约多单止损=>${coinInfo.coin} 指标:${coinInfo.indicator.join('@')} 数量:${Math.abs(Number(posL.positionAmt))} 价格:${cur_market_price}`);
                                            //停止运行
                                            // modify_bcoins(coinInfo.coin, 'status', 0)                                            
                                        }
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
                                        }).catch(err => {
                                            console.log(`撤销订单2`, err)
                                        })
                                    })
                                    posTime[`${coinInfo.coin}_hy`] = Date.now();
                                }
                            }
                        }
                    }
                }
                //core end
                await sleep(2000)
            }
            await sleep(1000)
        } catch (err) {
            console.log('系统异常=>', err.response == undefined ? err : err.response)
            await sleep(2500)
        }
    }
}

function init_setting_data() {
    let root = localStorage.getItem('root')
    if (root == null) {
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
        init_setting_data()
        let configData = localStorage.getItem('root');
        return JSON.parse(configData);
    }

}

function modify_json_data(data) {
    let _data = JSON.stringify(data);
    localStorage.setItem('root', _data);
}
async function main() {
    init_tg();
    msg_on();
    init_setting_data();

    let exInfo = await cf.exchangeInfo();
    SymbolsEx = exInfo.data.symbols;
    let exInfoxh = await cs.exchangeInfo();
    SymbolsExXh = exInfoxh.data.symbols;
    try {
        let acc = await cs.account({ recvWindow: 5000 });
        acc.data.balances.map(v => {
            if (v.asset == 'USDT') {
                xh_totalWalletBalance = Number(v.free);//可用U
            }
        })
    } catch (error) {
        console.log(`现货权限未开`, error.response)
    }
    await loop_run();

    
    //===TEST===//
    // for (let i = 0; i < 20; i++) {
    //     send_msg("=========clear===========")
    //     await sleep(2 * 1000)
    // }
    // sell_close('ETHUSDT',0.048)
    // sell_close('BTCUSDT',0.002)
    // buy_close('BTCUSDT',0.003)
    // buy_close('ETHUSDT',0.048)
    // sell_xh('ETHUSDT', 0.0238).then(res => console.log(res))
    // sell_xh('BTCUSDT', 0.00368).then(res => console.log(res))
    // let pos_xh = await cs.openOrders('ETHUSDT')
}
// curl -H 'Content-Type: application/json; charset=utf-8' -d '{ "ticker": "ETHUSDT", "position": "long", "action": "buy", "price": 2896.21 }' -X POST http://127.0.0.1:30010/api/botmsg
app.get("/api/config", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.body
        r.data = get_json_data().bCoins;
        res.json(r);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
main()
//监听
app.listen(listenPort, () => {
    console.log(`本地服务监听:${listenPort}`)
})
