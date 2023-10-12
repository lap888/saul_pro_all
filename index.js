#!/usr/bin/env node
process.env.UV_THREADPOOL_SIZE = 128;

const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const { runBet } = require('../data/runBetData')
const { cf, configJson, TA } = require('../app/binanceApi')
let listenPort = configJson.listenPort;
const { buy, buy_close, send_msg, msg_on, sell, sell_close } = require('../app/message')
let coinList = [];
let buyFlag = false;
let sellFlag = false;
let isFristRun = {};
let isRunCheck = {};
let onPftData2 = {};
let SymbolsEx = [];
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * 获取交易对的data.json基础信息
 * @param {*} cointype 交易对
 */
async function pre_data(cointype) {
    // 当前网格买入价格
    let grid_buy_price = runBet.get_buy_price(cointype);
    // 当前网格卖出价格
    let grid_sell_price = runBet.get_sell_price(cointype);
    // 买入量
    let quantity = runBet.get_quantity(cointype);
    // 当前步数
    let step = runBet.get_step(cointype);
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
    let totalWalletBalance = Number(acc.data.totalWalletBalance);
    acc.data.positions.map(v => {
        if (Number(v.positionAmt) > 0 && v.symbol == cointype) {
            posL = v;
            isFristRun[cointype] = cointype;
        }
        if (Number(v.positionAmt) < 0 && v.symbol == cointype) {
            posS = v;
        }
    });
    //获取boll
    let records = await cf.records(cointype, '15m')
    let boll = TA.BOLL(records, 120)
    let upLine = boll[0]
    let midLine = boll[1]
    let downLine = boll[2]
    let upL = upLine[upLine.length - 1]
    let midL = midLine[midLine.length - 1]
    let downL = downLine[downLine.length - 1];

    return [grid_buy_price, grid_sell_price, posL, posS, upL, midL, downL, quantity, step, cur_market_price, right_size, records, totalWalletBalance]
}

async function loop_run() {
    while (true) {
        try {
            let minutes = new Date().getMinutes();
            let seconds = new Date().getSeconds();
            if (minutes % 5 == 0) {
                if (seconds % 15 == 0) {
                    let exInfo = await cf.exchangeInfo();
                    SymbolsEx = exInfo.data.symbols;
                }
            }
            for (let i = 0; i < coinList.length; i++) {
                let coinType = coinList[i];
                let [grid_buy_price, grid_sell_price, posL, posS, upL, midL, downL, quantity, step, cur_market_price, right_size, records, totalWalletBalance] = await pre_data(coinType);
                let minAmount = Number((10 / cur_market_price).toFixed(right_size));
                quantity = Number((quantity / cur_market_price).toFixed(right_size));
                if ((cur_market_price <= grid_buy_price && !buyFlag && cur_market_price < upL && cur_market_price > downL) || (isFristRun[coinType] == undefined || isFristRun[coinType] == '')) {
                    buyFlag = true;
                    isFristRun[coinType] = coinType;
                    let res = await buy(coinType, quantity, -1);
                    if (res.status == 200) {
                        runBet.set_ratio(coinType);
                        await sleep(500);
                        runBet.set_record_price(coinType, cur_market_price);
                        await sleep(500);
                        runBet.modify_price(coinType, cur_market_price, step + 1, cur_market_price);
                        send_msg(`网格${step}:${posL == null ? '首次开仓' : '补仓'},币种为:${coinType}=>😁买入开多=>买单量为:${quantity}=>😁买单价格为:${cur_market_price}`)
                        await sleep(500);
                        buyFlag = false;
                    } else {
                        buyFlag = false;
                        break;
                    }
                } else if (cur_market_price > grid_sell_price && !sellFlag) {
                    sellFlag = true;
                    if (step == 0) {
                        runBet.modify_price(coinType, grid_sell_price, step, cur_market_price);
                        sellFlag = false;
                        isFristRun[coinType] = '';
                    } else {
                        let last_price = runBet.get_record_price(coinType)
                        let sell_amount = runBet.get_quantity(coinType, false)
                        sell_amount = Number((sell_amount / cur_market_price).toFixed(right_size));
                        let porfit_usdt = ((cur_market_price - last_price) * sell_amount).toFixed(4);
                        let nowHave = Number(posL.positionAmt);
                        let ams = Math.min(nowHave, sell_amount);
                        if (ams > minAmount) {
                            let res = await buy_close(coinType, ams, -1);
                            if (res.status == 200) {
                                send_msg(`网格${step}:币种为:${coinType}=>😁卖出平多=>卖单量为:${ams}=>😁卖单价格为:${cur_market_price}=>😁预计盈利:${porfit_usdt}`)
                                runBet.set_ratio(coinType);//启动动态改变比率
                                await sleep(500)
                                runBet.modify_price(coinType, last_price, step - 1, cur_market_price)
                                await sleep(500)
                                runBet.remove_record_price(coinType)
                                await sleep(500)  // 挂单后，停止运行1分钟
                                sellFlag = false;
                            } else {
                                sellFlag = false;
                                break;
                            }
                        }
                    }
                } else {
                    let s = new Date().getSeconds();
                    if (s % 30 == 0) {
                        console.log(`币种:${coinType},当前市价:${cur_market_price},吃:${grid_buy_price},吐:${grid_sell_price},步长:${step},数量:${quantity},继续运行...`)
                    }
                    if (posL == null) {
                        runBet.modify_price(coinType, cur_market_price, 0, cur_market_price);
                        sellFlag = false;
                        isFristRun[coinType] = '';
                    } else {
                        if (isRunCheck[coinType] == undefined) {
                            isRunCheck[coinType] = coinType;
                            runBet.set_ratio(coinType);//启动动态改变比率
                            runBet.modify_price(coinType, cur_market_price, step, cur_market_price);
                        }
                    }
                    if (posS == null) {
                        let flag = await runBet.calcAngle(coinType, '15m', 'SHORT', right_size, records);
                        let kdj = TA.KDJ(records)
                        let k = kdj[0];
                        let _k = k[k.length - 1]
                        let d = kdj[1];
                        let _d = d[d.length - 1]
                        let flag2 = _k < _d;
                        if (flag && cur_market_price > upL && flag2) {
                            let mmAmount = Number((totalWalletBalance / cur_market_price).toFixed(right_size));
                            sell(coinType, mmAmount, -1)
                            send_msg(`碰触-boll-up,开仓做空,币种为:${coinType}=>😁卖出开空=>卖单量为:${mmAmount}=>😁卖单价格为:${cur_market_price}`)
                        }
                        if (flag && cur_market_price < downL && cur_market_price > (1 - 0.01) * downL && flag2 && posL != null) {
                            let mmAmount1 = Number((totalWalletBalance / cur_market_price).toFixed(right_size));
                            let mmAmount2 = Number(posL.positionAmt);
                            let mmAmount3 = Math.min(mmAmount1, mmAmount2)
                            mmAmount3 = Number((mmAmount3 / 2).toFixed(right_size));
                            if (mmAmount3 > minAmount) {
                                sell(coinType, mmAmount3, -1)
                                send_msg(`趋势-boll-down,开仓做空,币种为:${coinType}=>😁卖出开空=>卖单量为:${mmAmount3}=>😁卖单价格为:${cur_market_price}`)
                            }
                        }
                    }
                    if (posS != null) {
                        //空单移动止盈 触发止盈阀值
                        let p1 = Number(cur_market_price);
                        let p2 = Number(posS.entryPrice) * (1 - configJson.pft);
                        if (p1 < p2) {
                            //回撤止盈
                            let pftData2 = onPftData2[posS.symbol]
                            if (pftData2 == undefined || pftData2 == 0) {
                                onPftData2[posS.symbol] = Number(cur_market_price)
                            } else {
                                let minPrice = Math.min(onPftData2[posS.symbol], Number(cur_market_price))
                                onPftData2[posS.symbol] = minPrice
                            }
                            //回测止盈
                            if (Number(cur_market_price) > onPftData2[posS.symbol] * (1 - configJson.pftBack)) {
                                sell_close(posS.symbol, -Number(posS.positionAmt), -1).then(r3 => {
                                    onPftData2[posS.symbol] = 0;
                                    send_msg(`${posS.symbol}=>空单--回撤止盈平仓=>😁`)
                                    console.log(`${posS.symbol}=>空单--回撤止盈平仓`, r3.status)
                                })
                            }
                        }
                    }
                    await sleep(1000)
                }
            }
        } catch (err) {
            send_msg(`系统异常=>${err.response.data}`)
            console.log('系统异常=>', err)
            await sleep(1000)
        }
    }
}

async function main() {
    runBet.init();
    msg_on()
    coinList = runBet.get_coinList();
    let exInfo = await cf.exchangeInfo();
    SymbolsEx = exInfo.data.symbols;
    await loop_run()
}
// curl -H 'Content-Type: application/json; charset=utf-8' -d '{ "ticker": "ETHUSDT", "position": "long", "action": "buy", "price": 2896.21 }' -X POST http://127.0.0.1:30010/api/botmsg
app.post("/api/botmsg", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.body
        send_msg(`OCC信号提醒:${JSON.stringify(r)}`)
        console.log(r)
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
