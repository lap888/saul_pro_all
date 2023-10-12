#!/usr/bin/env node
process.env.UV_THREADPOOL_SIZE = 128;

const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const { runBet } = require('./data/runBetData')
const { cf, cs, configJson, TA } = require('./app/binanceApi')
const { buy, buy_close, send_msg, msg_on, sell, sell_close } = require('./app/message')
let coinList = [];
let buyFlag = false;
let sellFlag = false;
let isFristRun = {};
let isFristRun2 = {};
let onPftData1 = {};
let onPftData2 = {};
let SymbolsEx = [];
let showLog = {}

/**
 * 休眠函数
 * @param {*} ms 
 * @returns 
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * 更改持仓方向
 */
function updatePositionSide() {
    cf.getPositionSide().then(response => {
        let dual = response.data.dualSidePosition;
        if (!dual) {
            cf.updatePositionSide(true).then(res => {
                console.log(`更改持仓方向,${res}`)
            }).catch(err => {
                console.error("更改持仓方向发生错误" + err)
            })
        }
    }).catch(err => {
        console.error("获取持仓方向发生错误" + err)
    })
}
async function refSymbol() {
    let minutes = new Date().getMinutes();
    let seconds = new Date().getSeconds();
    if (minutes % 5 == 0) {
        if (seconds % 15 == 0) {
            let exInfo = await cf.exchangeInfo();
            SymbolsEx = exInfo.data.symbols;
        }
    }
}
/**
 * 获取交易对的data.json基础信息
 * @param {*} cointype 交易对
 */
async function pre_data(cointype) {
    // 当前马丁买入价格
    let grid_buy_price = runBet.get_buy_price(cointype);
    let grid_buy_price_s = runBet.get_buy_price_s(cointype);
    // 当前马丁卖出价格
    let grid_sell_price = runBet.get_sell_price(cointype);
    let grid_sell_price_s = runBet.get_sell_price_s(cointype);
    // 买入量
    let quantity = runBet.get_quantity(cointype);
    let quantity_s = runBet.get_quantity_s(cointype);
    // 当前步数
    let step = runBet.get_step(cointype);
    let step_s = runBet.get_step_s(cointype);
    let tj_l = runBet.get_tj_l(cointype)
    let tj_s = runBet.get_tj_s(cointype)
    // 当前交易对市价
    let _cur_market_price = (await cf.price({ symbol: cointype })).data.price;
    let right_size = 2;
    SymbolsEx.map((v) => {
        if (v.symbol == cointype) {
            right_size = Number(v.quantityPrecision);
        }
    });
    let cur_market_price = Number(_cur_market_price);
    //多单 空单数量
    let acc = await cf.account();
    let posL = null;
    let posS = null;
    // let totalWalletBalance = Number(acc.data.totalWalletBalance);
    acc.data.positions.map(v => {
        if (Number(v.positionAmt) > 0 && v.symbol == cointype) {
            posL = v;
            isFristRun[cointype] = cointype;
        }
        if (Number(v.positionAmt) < 0 && v.symbol == cointype) {
            posS = v;
            isFristRun2[cointype] = cointype;
        }
    });
    //获取boll
    let records = await cf.records(cointype, configJson.kTime)
    //macd
    let MACD1 = TA.MACD(records, 12, 26, 9)
    let macdLong = MACD1[2][MACD1[2].length - 2] <= 0 && MACD1[2][MACD1[2].length - 1] > 0;
    let macdShort = MACD1[2][MACD1[2].length - 2] >= 0 && MACD1[2][MACD1[2].length - 1] < 0;
    let macdLong2 = MACD1[2][MACD1[2].length - 1] > 0;
    let macdShort2 = MACD1[2][MACD1[2].length - 1] <= 0;
    let maQ = await runBet.calcAngle(cointype, '5m', 'LONG', right_size);
    let maS = await runBet.calcAngle(cointype, '5m', 'SHORT', right_size);
    return [grid_buy_price, grid_sell_price, posL, posS, quantity, step, cur_market_price, right_size, macdLong, macdShort, grid_buy_price_s, grid_sell_price_s, quantity_s, step_s, tj_l, tj_s, macdLong2, macdShort2, maQ, maS]
}

async function loop_run() {
    while (true) {
        try {
            await refSymbol()
            for (let i = 0; i < coinList.length; i++) {
                let coinType = coinList[i];
                let [grid_buy_price, grid_sell_price, posL, posS, quantity, step, cur_market_price, right_size, macdLong, macdShort, grid_buy_price_s, grid_sell_price_s, quantity_s, step_s, tj_l, tj_s, macdLong2, macdShort2, maQ, maS] = await pre_data(coinType);
                let minAmount = Number((10 / cur_market_price).toFixed(right_size));
                quantity = Number((quantity / cur_market_price).toFixed(right_size));
                quantity_s = Number((quantity_s / cur_market_price).toFixed(right_size));
                let longBack = false;
                let shortBack = false;
                //回调 反弹
                {
                    //回调
                    let pftData1 = onPftData1[coinType]
                    if (pftData1 == undefined || pftData1 == 0) {
                        onPftData1[coinType] = Number(cur_market_price)
                    } else {
                        let maxPrice = Math.max(onPftData1[coinType], Number(cur_market_price))
                        onPftData1[coinType] = maxPrice
                    }
                    if (Number(cur_market_price) < onPftData1[coinType] * (1 - configJson.pftBack * 0.01)) {
                        longBack = true;
                    }
                    if (posL != null && step == 0) {
                        runBet.modify_price(coinType, cur_market_price, step, cur_market_price);
                    }
                    if (posS != null && step_s == 0) {
                        runBet.modify_price_s(coinType, cur_market_price, step_s, cur_market_price);
                    }
                    //反弹
                    let pftData2 = onPftData2[coinType]
                    if (pftData2 == undefined || pftData2 == 0) {
                        onPftData2[coinType] = Number(cur_market_price)
                    } else {
                        let minPrice = Math.min(onPftData2[coinType], Number(cur_market_price))
                        onPftData2[coinType] = minPrice
                    }
                    if (Number(cur_market_price) > onPftData2[coinType] * (1 + configJson.pftBack * 0.01)) {
                        shortBack = true;
                    }
                }
                //多单
                if (posL == null) {
                    let doF = posS == null ? longBack : true;
                    if (doF && !buyFlag) {
                        buyFlag = true;
                        await buy(coinType, quantity, -1);
                        runBet.reset_record_price(coinType)
                        runBet.set_record_price(coinType, cur_market_price);
                        await sleep(500);
                        runBet.modify_price(coinType, cur_market_price, 1, cur_market_price);
                        send_msg(`马丁=>${posL == null ? '首次开仓' : '补仓'},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                        console.log(`马丁=>${posL == null ? '首次开仓' : '补仓'},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                        await sleep(500);
                        buyFlag = false;
                        onPftData1[coinType] = 0;
                    }
                } else {
                    if (step <= configJson.maxStep) {
                        //滚仓
                        if (step_s > configJson.maxStep - 1) {
                            if (macdLong2 && maQ) {
                                let last_price = runBet.get_record_price(coinType)
                                if (!buyFlag && cur_market_price > last_price * (1 + configJson.pft * 0.01)) {
                                    buyFlag = true;
                                    await buy(coinType, quantity, -1);
                                    runBet.set_record_price(coinType, cur_market_price);
                                    runBet.modify_price(coinType, cur_market_price, step + 1, cur_market_price);
                                    runBet.set_ratio(coinType)
                                    send_msg(`马丁滚仓=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                    console.log(`马丁滚仓=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                    await sleep(500);
                                    buyFlag = false;
                                    onPftData1[coinType] = 0;
                                }
                            } else {
                                //没有趋势满足条件补
                                if (!buyFlag && cur_market_price <= grid_buy_price) {
                                    if (longBack && macdLong) {
                                        buyFlag = true;
                                        await buy(coinType, quantity, -1);
                                        runBet.set_record_price(coinType, cur_market_price);
                                        runBet.modify_price(coinType, cur_market_price, step + 1, cur_market_price);
                                        runBet.set_ratio(coinType)
                                        send_msg(`马丁*=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                        console.log(`马丁*=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                        await sleep(500);
                                        buyFlag = false;
                                        onPftData1[coinType] = 0;
                                    }
                                }
                            }
                            //对冲止盈
                            if (step >= configJson.maxStep - 1 || (!macdLong2 && !maQ)) {
                                //止盈
                                let entryPrice = Number(posL.entryPrice);
                                let unrealizedProfit = Number(posL.unrealizedProfit)
                                if (cur_market_price > entryPrice * (1 + configJson.pft * 0.01) && !sellFlag) {
                                    if (longBack && unrealizedProfit > Math.abs(tj_l)) {
                                        sellFlag = true;
                                        let nowHave = Number(posL.positionAmt);
                                        let porfit_usdt = ((cur_market_price - entryPrice) * nowHave).toFixed(4);
                                        await buy_close(coinType, nowHave, -1);
                                        send_msg(`马丁对冲=>币种为:${coinType}=>😁卖出平多=>卖单量为:${nowHave}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                        console.log(`马丁对冲=>币种为:${coinType}=>😁卖出平多=>卖单量为:${nowHave}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                        runBet.modify_price(coinType, cur_market_price, 0, cur_market_price)
                                        runBet.reset_record_price(coinType)
                                        runBet.set_tj_l(coinType, 0)
                                        runBet.reset_ratio(coinType)
                                        isFristRun[coinType] == ''
                                        await sleep(500)
                                        sellFlag = false;
                                        onPftData1[coinType] = 0;
                                    }
                                }
                            }
                        } else {
                            //不滚仓 补仓 & 金叉
                            if (!buyFlag && cur_market_price <= grid_buy_price) {
                                if (longBack && macdLong) {
                                    buyFlag = true;
                                    await buy(coinType, quantity, -1);
                                    runBet.set_record_price(coinType, cur_market_price);
                                    runBet.modify_price(coinType, cur_market_price, step + 1, cur_market_price);
                                    runBet.set_ratio(coinType)
                                    send_msg(`马丁=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                    console.log(`马丁=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                    await sleep(500);
                                    buyFlag = false;
                                    onPftData1[coinType] = 0;
                                }
                            }
                            //止盈
                            let entryPrice = Number(posL.entryPrice);
                            let unrealizedProfit = Number(posL.unrealizedProfit)
                            if (cur_market_price > entryPrice * (1 + configJson.pft * 0.01) && !sellFlag) {
                                if (longBack && unrealizedProfit > Math.abs(tj_l)) {
                                    sellFlag = true;
                                    let nowHave = Number(posL.positionAmt);
                                    let porfit_usdt = ((cur_market_price - entryPrice) * nowHave).toFixed(4);
                                    await buy_close(coinType, nowHave, -1);
                                    send_msg(`马丁=>币种为:${coinType}=>😁卖出平多=>卖单量为:${nowHave}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                    console.log(`马丁=>币种为:${coinType}=>😁卖出平多=>卖单量为:${nowHave}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                    runBet.modify_price(coinType, cur_market_price, 0, cur_market_price)
                                    runBet.reset_record_price(coinType)
                                    runBet.set_tj_l(coinType, 0)
                                    runBet.reset_ratio(coinType)
                                    isFristRun[coinType] == ''
                                    await sleep(500)
                                    sellFlag = false;
                                    onPftData1[coinType] = 0;
                                }
                            }
                        }
                    } else {
                        //动态调仓 LONG
                        if (isFristRun[coinType] == undefined || isFristRun[coinType] == '') {
                            runBet.set_ratio(coinType);
                            runBet.modify_price(coinType, cur_market_price, step, cur_market_price);
                            isFristRun[coinType] = coinType;
                        } else {
                            if (cur_market_price <= grid_buy_price && !buyFlag) {
                                buyFlag = true;
                                await buy(coinType, quantity, -1);
                                await sleep(500);
                                runBet.set_record_price(coinType, cur_market_price);
                                await sleep(500);
                                runBet.modify_price(coinType, cur_market_price, step + 1, cur_market_price);
                                runBet.set_ratio(coinType);
                                send_msg(`多方=>动态调仓:${step},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                                await sleep(500);
                                buyFlag = false;
                            } else {
                                if (cur_market_price > grid_sell_price && !sellFlag) {
                                    sellFlag = true;
                                    let last_price = runBet.get_record_price(coinType)
                                    let sell_amount = runBet.get_quantity(coinType, false)
                                    sell_amount = Number((sell_amount / cur_market_price).toFixed(right_size));
                                    let porfit_usdt = ((cur_market_price - last_price) * sell_amount).toFixed(4);
                                    let nowHave = Number(posL.positionAmt);
                                    let ams = Math.min(nowHave, sell_amount);
                                    await buy_close(coinType, ams, -1);
                                    send_msg(`多方=>动态调仓:${step}:币种为:${coinType}=>😁卖出平多=>卖单量为:${ams}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                    //记录太极磨损
                                    let unrealizedProfit = Number(posL.unrealizedProfit)
                                    let subTj = Number((ams * unrealizedProfit / nowHave).toFixed(4))
                                    subTj += tj_l
                                    runBet.set_tj_l(coinType, subTj)
                                    await sleep(500)
                                    runBet.modify_price(coinType, last_price, step - 1, cur_market_price)
                                    runBet.set_ratio(coinType);//启动动态改变比率
                                    await sleep(500)
                                    runBet.remove_record_price(coinType)
                                    await sleep(500)  // 挂单后，停止运行1分钟
                                    sellFlag = false;
                                } else {
                                    let entryPrice = Number(posL.entryPrice);
                                    let unrealizedProfit = Number(posL.unrealizedProfit)
                                    if (step <= configJson.maxStep + 1 && cur_market_price > entryPrice * (1 + configJson.pft * 0.01) && !sellFlag) {
                                        if (unrealizedProfit > Math.abs(tj_l)) {
                                            sellFlag = true;
                                            let nowHave = Number(posL.positionAmt);
                                            let porfit_usdt = ((cur_market_price - entryPrice) * nowHave).toFixed(4);
                                            await buy_close(coinType, nowHave, -1);
                                            send_msg(`多方-动态调仓-止盈=>币种为:${coinType}=>😁卖出平多=>卖单量为:${nowHave}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                            console.log(`多方-动态调仓-止盈=>币种为:${coinType}=>😁卖出平多=>卖单量为:${nowHave}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                            runBet.modify_price(coinType, cur_market_price, 0, cur_market_price)
                                            runBet.reset_record_price(coinType)
                                            runBet.set_tj_l(coinType, 0)
                                            runBet.reset_ratio(coinType)
                                            isFristRun[coinType] == ''
                                            await sleep(500)
                                            sellFlag = false;
                                            onPftData1[coinType] = 0;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                //空单
                if (posS == null) {
                    let doF = posL == null ? shortBack : true;
                    if (doF && !buyFlag) {
                        buyFlag = true;
                        await sell(coinType, quantity_s, -1);
                        runBet.reset_record_price_s(coinType)
                        runBet.set_record_price_s(coinType, cur_market_price);
                        runBet.modify_price_s(coinType, cur_market_price, 1, cur_market_price);
                        send_msg(`马丁=>${posS == null ? '首次开仓' : '补仓'},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                        console.log(`马丁=>${posS == null ? '首次开仓' : '补仓'},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                        await sleep(500);
                        buyFlag = false;
                        onPftData2[coinType] = 0;
                    }
                } else {
                    if (step_s <= configJson.maxStep) {
                        if (step > configJson.maxStep - 1) {
                            if (macdShort2 && maS) {
                                let last_price = runBet.get_record_price_s(coinType)
                                if (!buyFlag && cur_market_price < last_price * (1 - configJson.pft * 0.01)) {
                                    buyFlag = true;
                                    await sell(coinType, quantity_s, -1);
                                    runBet.set_record_price_s(coinType, cur_market_price);
                                    runBet.modify_price_s(coinType, cur_market_price, step_s + 1, cur_market_price);
                                    runBet.set_ratio_s(coinType);
                                    send_msg(`马丁滚仓=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${step_s},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                                    console.log(`马丁滚仓=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${step_s},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                                    await sleep(500);
                                    buyFlag = false;
                                    onPftData2[coinType] = 0;
                                }
                            } else {
                                //无趋势满足条件补
                                if (!buyFlag && cur_market_price >= grid_buy_price_s) {
                                    if (shortBack && macdShort) {
                                        buyFlag = true;
                                        await sell(coinType, quantity_s, -1);
                                        runBet.set_record_price_s(coinType, cur_market_price);
                                        runBet.modify_price_s(coinType, cur_market_price, step_s + 1, cur_market_price);
                                        runBet.set_ratio_s(coinType);
                                        send_msg(`马丁*=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${step_s},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                                        console.log(`马丁*=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${step_s},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                                        await sleep(500);
                                        buyFlag = false;
                                        onPftData2[coinType] = 0;
                                    }
                                }
                            }
                            //对冲止盈
                            if (step_s >= configJson.maxStep - 1 || (!macdShort2 && !maS)) {
                                let entryPrice = Number(posS.entryPrice);
                                let unrealizedProfit = Number(posS.unrealizedProfit)
                                if (cur_market_price < entryPrice * (1 - configJson.pft * 0.01) && !sellFlag) {
                                    if (shortBack && unrealizedProfit > Math.abs(tj_s)) {
                                        sellFlag = true;
                                        let nowHave = Math.abs(Number(posS.positionAmt));
                                        let porfit_usdt = ((entryPrice - cur_market_price) * nowHave).toFixed(4);
                                        await sell_close(coinType, nowHave, -1);
                                        send_msg(`马丁对冲=>币种为:${coinType}=>😁买入平空=>数量为:${nowHave}=>😁价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                        console.log(`马丁对冲=>币种为:${coinType}=>😁买入平空=>数量为:${nowHave}=>😁价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                        runBet.modify_price_s(coinType, cur_market_price, 0, cur_market_price)
                                        runBet.reset_record_price_s(coinType)
                                        runBet.set_tj_s(coinType, 0)
                                        runBet.reset_ratio(coinType)
                                        isFristRun2[coinType] == ''
                                        await sleep(500)
                                        sellFlag = false;
                                        onPftData2[coinType] = 0;
                                    }
                                }
                            }
                        } else {
                            //补仓 & 死叉
                            if (!buyFlag && cur_market_price >= grid_buy_price_s) {
                                if (shortBack && macdShort) {
                                    buyFlag = true;
                                    await sell(coinType, quantity_s, -1);
                                    runBet.set_record_price_s(coinType, cur_market_price);
                                    runBet.modify_price_s(coinType, cur_market_price, step_s + 1, cur_market_price);
                                    runBet.set_ratio_s(coinType);
                                    send_msg(`马丁=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${step_s},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                                    console.log(`马丁=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${step_s},币种为:${coinType}=>😁卖出开空=>数量为:${quantity_s}=>😁价格为:${cur_market_price}`)
                                    await sleep(500);
                                    buyFlag = false;
                                    onPftData2[coinType] = 0;
                                }
                            }
                            //止盈
                            let entryPrice = Number(posS.entryPrice);
                            let unrealizedProfit = Number(posS.unrealizedProfit)
                            if (cur_market_price < entryPrice * (1 - configJson.pft * 0.01) && !sellFlag) {
                                if (shortBack && unrealizedProfit > Math.abs(tj_s)) {
                                    sellFlag = true;
                                    let nowHave = Math.abs(Number(posS.positionAmt));
                                    let porfit_usdt = ((entryPrice - cur_market_price) * nowHave).toFixed(4);
                                    await sell_close(coinType, nowHave, -1);
                                    send_msg(`马丁=>币种为:${coinType}=>😁买入平空=>数量为:${nowHave}=>😁价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                    console.log(`马丁=>币种为:${coinType}=>😁买入平空=>数量为:${nowHave}=>😁价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                    runBet.modify_price_s(coinType, cur_market_price, 0, cur_market_price)
                                    runBet.reset_record_price_s(coinType)
                                    runBet.set_tj_s(coinType, 0)
                                    runBet.reset_ratio(coinType)
                                    isFristRun2[coinType] == ''
                                    await sleep(500)
                                    sellFlag = false;
                                    onPftData2[coinType] = 0;
                                }
                            }
                        }
                    } else {
                        //动态调仓 SHORT
                        if (isFristRun2[coinType] == undefined || isFristRun2[coinType] == '') {
                            runBet.set_ratio_s(coinType);
                            runBet.modify_price_s(coinType, cur_market_price, step_s, cur_market_price);
                            isFristRun2[coinType] = coinType;
                        } else {
                            if (cur_market_price >= grid_buy_price_s && !buyFlag) {
                                buyFlag = true;
                                await sell(coinType, quantity_s, -1);
                                runBet.set_record_price_s(coinType, cur_market_price);
                                runBet.modify_price_s(coinType, cur_market_price, step_s + 1, cur_market_price);
                                runBet.set_ratio_s(coinType);
                                send_msg(`空方=>动态调仓:${step_s},币种为:${coinType}=>😁卖出开空=>卖单量为:${quantity_s}=>😁卖单价格为:${cur_market_price}`)
                                await sleep(1000);
                                buyFlag = false;
                            } else {
                                if (cur_market_price < grid_sell_price_s && !sellFlag) {
                                    sellFlag = true;
                                    let last_price = runBet.get_record_price_s(coinType)
                                    let sell_amount = runBet.get_quantity_s(coinType, false)
                                    sell_amount = Number((sell_amount / cur_market_price).toFixed(right_size));
                                    let porfit_usdt = ((last_price - cur_market_price) * sell_amount).toFixed(4);
                                    let nowHave = Math.abs(Number(posS.positionAmt));
                                    let ams = Math.min(nowHave, sell_amount);
                                    await sell_close(coinType, ams, -1);
                                    send_msg(`空方=>动态调仓:${step_s}:币种为:${coinType}=>😁买入平空=>买单量为:${ams}=>😁买单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                    //记录太极磨损
                                    let unrealizedProfit = Number(posS.unrealizedProfit)
                                    let subTj = Number((ams * unrealizedProfit / nowHave).toFixed(4));
                                    subTj += tj_s
                                    runBet.set_tj_s(coinType, subTj)
                                    runBet.modify_price_s(coinType, last_price, step_s - 1, cur_market_price)
                                    runBet.remove_record_price(coinType)
                                    runBet.set_ratio_s(coinType);//启动动态改变比率
                                    await sleep(1000);
                                    sellFlag = false;
                                } else {
                                    let entryPrice = Number(posS.entryPrice);
                                    let unrealizedProfit = Number(posS.unrealizedProfit)
                                    if (step_s <= configJson.maxStep + 1 && cur_market_price < entryPrice * (1 - configJson.pft * 0.01) && !sellFlag) {
                                        if (unrealizedProfit > Math.abs(tj_s)) {
                                            sellFlag = true;
                                            let nowHave = Math.abs(Number(posS.positionAmt));
                                            let porfit_usdt = ((entryPrice - cur_market_price) * nowHave).toFixed(4);
                                            await sell_close(coinType, nowHave, -1);
                                            send_msg(`空方-动态调仓-止盈=>币种为:${coinType}=>😁买入平空=>数量为:${nowHave}=>😁价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                            console.log(`空方-动态调仓-止盈=>币种为:${coinType}=>😁买入平空=>数量为:${nowHave}=>😁价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                            runBet.modify_price_s(coinType, cur_market_price, 0, cur_market_price)
                                            runBet.reset_record_price_s(coinType)
                                            runBet.set_tj_s(coinType, 0)
                                            runBet.reset_ratio(coinType)
                                            isFristRun2[coinType] == ''
                                            await sleep(500)
                                            sellFlag = false;
                                            onPftData2[coinType] = 0;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                let dt = new Date();
                let slog = `|${coinType}|市价:${cur_market_price}|多持:${posL == null ? 'null' : Number(posL.entryPrice).toFixed(4)}|补仓:${step}|多买:${grid_buy_price.toFixed(4)}|回调:${longBack}|盈亏:${posL == null ? 'null' : Number(posL.unrealizedProfit).toFixed(4)}|空持:${posS == null ? 'null' : Number(posS.entryPrice).toFixed(4)}|补仓:${step_s}|空卖:${grid_buy_price_s.toFixed(4)}|回调:${shortBack}|盈亏:${posS == null ? '' : Number(posS.unrealizedProfit).toFixed(4)}|金叉:${macdLong2}|死叉:${macdShort2}|mqL:${maQ}|mqS:${maS}|`;
                if (dt.getSeconds() % 55 == 0) {
                    console.log(slog)
                }
                showLog[coinType] = slog
                await sleep(1000)
            }
        } catch (err) {
            send_msg(`系统异常=>请联系管理员...`)
            console.log('系统异常=>', err)
            await sleep(1000)
        }
    }
}

async function main() {
    runBet.init();
    coinList = runBet.get_coinList();
    let exInfo = await cs.exchangeInfo();
    SymbolsEx = exInfo.data.symbols;

    cs.account().then(response => { console.log(response) }).catch(e => {
        console.log(e)
    })
    console.log(exInfo)
    console.log(`马丁程序启动,监听交易对:${coinList}`)

    // await loop_run()
}

app.get("/api/getXhInfo", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let coinArr = []
        if (r.coins != undefined) {
            coinArr = r.coins.split(',')
            for (let i = 0; i < coinArr.length; i++) {
                coinArr[i] = coinArr[i].toUpperCase();
            }
        }
        let json = runBet.get_json_data()
        data.tjL = json.tjL;
        data.tjS = json.tjS;
        for (let i = 0; i < json.coinList.length; i++) {
            let e = json.coinList[i];
            if (coinArr.length > 0) {
                if (coinArr.indexOf(e) != -1) {
                    data[e] = json[e]
                }
            } else {
                data[e] = json[e]
            }
        }
        data.showLog = showLog;
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});


app.listen(30010, () => {
    console.log(`本地服务监听地址:http://127.0.0.1:${30010}`)
})
main()