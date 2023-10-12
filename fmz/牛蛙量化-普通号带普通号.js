// fmz@36220f7ed7315736e425048d13a43493

let refCt = "swap";//永续合约

let MarginLevel = 20;

let nowCurrency = refCurrency.split("&");

let StartTime = 1623921936723//new Date().getTime();

let tbl = {
    type: "table",
    title: "持仓",
    cols: ["交易所", "交易员_币种", "杠杆", "多仓", "空仓", "未实现盈亏", "账户资产", "可用余额"],
    rows: []
}

function onexit() {
    Log("Exit");
}
function getPosAmount(pos, ct) {
    let longPosAmount = 0
    let shortPosAmount = 0
    let price = 0

    _.each(pos, function (ele) {
        if (ele.ContractType == ct && ele.Type == PD_LONG) {
            longPosAmount = ele.Amount
            price = ele.Price
        } else if (ele.ContractType == ct && ele.Type == PD_SHORT) {
            shortPosAmount = ele.Amount
            price = ele.Price
        }
    })
    return { long: longPosAmount, short: shortPosAmount, price: price }
}

function trade(e, ct, type, delta, rate, coin) {
    let _acc = _C(e.GetAccount)
    let acceset = 0;
    if (e.GetName() == 'Futures_Bitget') {
        acceset = _acc.Info.fixed_balance;
    } else {
        acceset = _acc.Balance;
    }
    let ticker = _C(e.GetTicker);
    let nowPosAmount = getPosAmount(_C(e.GetPosition), ct)
    let nowAmount = type == PD_LONG ? nowPosAmount.long : nowPosAmount.short;
    let opAmount = CaculatorCreateOrderAmount(e, acceset, ticker.Last, rate, coin);
    if (delta > 0) {
        e.SetMarginLevel(MarginLevel)
        // 开仓
        if (opAmount <= 0) {
            Log("账户余额不足...")
            return;
        }
        let tradeFunc = type == PD_LONG ? e.Buy : e.Sell
        e.SetDirection(type == PD_LONG ? "buy" : "sell")
        tradeFunc(-1, opAmount)
    } else if (delta < 0) {
        //平仓
        if (nowAmount <= 0) {
            Log("未检测到持仓")
            return;
        }
        // 平仓
        var tradeFunc = type == PD_LONG ? e.Sell : e.Buy
        e.SetDirection(type == PD_LONG ? "closebuy" : "closesell")
        tradeFunc(-1, Math.min(Math.abs(nowAmount), Math.abs(opAmount)))
    } else {
        throw "错误"
    }
}

//根据仓位和本金算开仓比例
function CaculatorCreateOrderRate(assets, lastprice, OpAmount, coin) {
    //总下单张数
    let openCount = 0;
    coin = coin.split("_")[0] + coin.split("_")[1];
    if (exchange.GetName() == 'Futures_Bitget') {
        openCount = exchange.IO("api", "GET", `/api/swap/v3/market/open_count`, `symbol=cmt_${coin}&amount=${assets}&openPrice=${lastprice}&leverage=${MarginLevel}`, "");
    } else {
        openCount = _N(assets * MarginLevel / lastprice, 3);
    }
    let rate = OpAmount / openCount;
    rate = _N(rate, 4)
    Log(coin, " =>全仓可开张数:", openCount, "当前持有:", OpAmount, "开仓比率:", rate, "#3333aa");
    return rate;
}

//根据仓位和本金算开仓数量
function CaculatorCreateOrderAmount(e, assets, lastprice, rate, coin) {
    let opAmount = 0;
    let openCount = 0;
    rate = Math.abs(rate)
    coin = coin.split("_")[0] + coin.split("_")[1];
    //总下单张数
    if (e.GetName() == 'Futures_Bitget') {
        openCount = exchange.IO("api", "GET", `/api/swap/v3/market/open_count`, `symbol=cmt_${coin}&amount=${assets}&openPrice=${lastprice}&leverage=${MarginLevel}`, "");
        opAmount = openCount * rate;
        opAmount = _N(opAmount, 0)
    } else {
        openCount = assets * MarginLevel / lastprice;
        opAmount = openCount * rate;
        opAmount = _N(opAmount < 0.001 ? 0.001 : opAmount, 0)
    }

    Log(coin, " =>全仓可开张数:", openCount, "建议开仓:", opAmount, "开仓比率:", rate, "#32CD32");
    return opAmount;
}

//打印状态栏
function PrintStatus() {
    _.each(exchanges, function (e) {
        let position = _C(e.GetPosition);
        let fixed_balance = 0;
        let unrealized_pnl = 0;
        let pos = getPosAmount(position, refCt)
        let acc = _C(e.GetAccount)
        let coin = "";
        if (e.GetName() == 'Futures_Bitget') {
            coin = acc.Info.symbol
            unrealized_pnl = acc.Info.unrealized_pnl;
            fixed_balance = acc.Info.fixed_balance;
        } else {
            coin = e.SetContractType(refCt).InstrumentID
            if (position.length > 0) {
                unrealized_pnl = position[0].Profit
                fixed_balance = acc.Balance + unrealized_pnl
            }

        }
        FindAndDel(`${e.GetLabel()}_${coin}`, tbl.rows)
        tbl.rows.push([e.GetName(), `${e.GetLabel()}_${coin}`, MarginLevel, pos.long, pos.short, unrealized_pnl, fixed_balance, acc.Balance])
    })
    LogStatus(_D(), "\n`" + JSON.stringify(tbl) + "`")
}

//刷新用户最新持仓
function RefresInitRefPosAmount(coin) {
    //
    coin = (coin.split('_')[0] + coin.split('_')[1]).toUpperCase()
    for (let i = 0; i < nowCurrency.length; i++) {
        //
        let v = nowCurrency[i];
        // 设置交易对、合约
        _.each(exchanges, function (e) {
            e.SetContractType(refCt)
            e.SetCurrency(v);
        });
        //保障平仓
        for (let i = 1; i < exchanges.length; i++) {
            let e = exchanges[i];
            let pos = _C(e.GetPosition);
            pos.map((v) => {
                if (v.Info.symbol == coin) {
                    // 平仓
                    var tradeFunc = v.Type == 0 ? e.Sell : e.Buy
                    e.SetDirection(v.Type == 0 ? "closebuy" : "closesell")
                    tradeFunc(-1, v.Amount)
                }
            })
        }
        PrintStatus();
    }
}
/**
 *
 * @param {number} target
 * @param {number[][]} array
 */
function FindAndDel(target, array) {
    const rowNum = array.length;
    if (!rowNum) {
        return -1;
    }
    const colNum = array[0].length;
    for (let i = 0; i < rowNum; i++) {
        for (let j = 0; j < colNum; j++) {
            if (array[i][j] == target) {
                tbl.rows.splice(i, 1);
                return i;
            }
        }
    }
    return -1;
}

//发送邮箱
function sendEmail(mes) {
    Log(mes + "@"); //微信通知
}
function main() {
    LogReset(1)
    if (exchanges.length < 2) {
        throw "没有跟单的交易所"
    }
    let exName = exchange.GetName()
    // 检测参考交易所
    if (!exName.includes("Futures_")) {
        throw "仅支持期货跟单"
    }
    Log("开始监控", exName, "交易所", "#FF0000")

    while (true) {
        for (let i = 0; i < nowCurrency.length; i++) {
            let v = nowCurrency[i];
            // 设置交易对、合约
            _.each(exchanges, function (e) {
                e.SetContractType(refCt)
                e.SetCurrency(v);
            });
            //===Start===//            
            let _initRefPosAmount = _C(exchange.GetPosition);
            let _amount = 0;
            for (let i = 0; i < _initRefPosAmount.length; i++) {
                let e = _initRefPosAmount[i];
                _amount += e.Amount;
            }
            let _beforeAmount = 0
            if (_G(`beforePosAmount_${v}`) != null) {
                let beforePosAmount = JSON.parse(_G(`beforePosAmount_${v}`));
                for (let i = 0; i < beforePosAmount.length; i++) {
                    let e = beforePosAmount[i];
                    _beforeAmount += e.Amount;
                }
            }
            let changeFlag = _G(`beforePosAmount_${v}`) == null ? true : _initRefPosAmount.length > 0 ? _beforeAmount != _amount : false
            if (_initRefPosAmount.length > 0 && changeFlag) {
                let _acc = _C(exchange.GetAccount)
                let acceset = exchange.GetName() == 'Futures_Bitget' ? _acc.Info.fixed_balance : _acc.Balance;
                MarginLevel = _initRefPosAmount[0].MarginLevel;

                if (_G(`beforePosAmount_${v}`) == null) {
                    // 计算仓位变动量
                    let initRefPosAmount = getPosAmount(_initRefPosAmount, refCt)
                    let longPosDelta = initRefPosAmount.long
                    let shortPosDelta = initRefPosAmount.short
                    for (let i = 1; i < exchanges.length; i++) {
                        // 执行多头动作
                        if (longPosDelta != 0) {
                            let rate = CaculatorCreateOrderRate(acceset, initRefPosAmount.price, longPosDelta, v);
                            Log(exchanges[i].GetName(), exchanges[i].GetLabel(), "1.执行多头跟单，变动量：", longPosDelta)
                            trade(exchanges[i], refCt, PD_LONG, longPosDelta, rate, v)
                        }
                        // 执行空头动作
                        if (shortPosDelta != 0) {
                            let rate = CaculatorCreateOrderRate(acceset, initRefPosAmount.price, shortPosDelta, v);
                            Log(exchanges[i].GetName(), exchanges[i].GetLabel(), "1.执行空头跟单，变动量：", shortPosDelta)
                            trade(exchanges[i], refCt, PD_SHORT, shortPosDelta, rate, v)
                        }
                    }
                    let beforePosAmount = JSON.stringify(_initRefPosAmount[0])
                    _G(`beforePosAmount_${v}`, beforePosAmount)
                } else {
                    // 计算仓位变动量
                    let beforePosAmounts = []
                    let initRefPosAmount = getPosAmount(_initRefPosAmount, refCt)
                    let beforePosAmount = JSON.parse(_G(`beforePosAmount_${v}`))
                    beforePosAmounts.push(beforePosAmount)
                    beforePosAmount = getPosAmount(beforePosAmounts, refCt)

                    let longPosDelta = initRefPosAmount.long - beforePosAmount.long
                    let shortPosDelta = initRefPosAmount.short - beforePosAmount.short

                    for (let i = 1; i < exchanges.length; i++) {
                        // 执行多头动作
                        if (longPosDelta != 0) {
                            Log(exchanges[i].GetName(), exchanges[i].GetLabel(), "2.执行多头跟单，变动量：", longPosDelta)
                            let rate = CaculatorCreateOrderRate(acceset, initRefPosAmount.price, longPosDelta, v);
                            trade(exchanges[i], refCt, PD_LONG, longPosDelta, rate, v)
                        }
                        // 执行空头动作
                        if (shortPosDelta != 0) {
                            Log(exchanges[i].GetName(), exchanges[i].GetLabel(), "2.执行空头跟单，变动量：", shortPosDelta)
                            let rate = CaculatorCreateOrderRate(acceset, initRefPosAmount.price, shortPosDelta, v);
                            trade(exchanges[i], refCt, PD_SHORT, shortPosDelta, rate, v)
                        }
                    }
                    //
                    let _beforePosAmount = JSON.stringify(_initRefPosAmount)
                    _G(`beforePosAmount_${v}`, _beforePosAmount)
                    PrintStatus()
                }

            } else if (_initRefPosAmount.length > 0 && _beforeAmount == _amount) {
                let seconds = new Date().getSeconds();
                if (seconds % 15 == 0) {
                    Log(`${v} =>跟随者仓位未发生变化...`, "#ffaa11");
                }
                PrintStatus()
            } else {
                //空仓
                let seconds = new Date().getSeconds();
                if (seconds % 15 == 0) {
                    Log(`${v} =>当前跟随者空仓...`, "#ffaacc");
                }
                _G(`beforePosAmount_${v}`, null)
                RefresInitRefPosAmount(v);
            }
            Sleep(1000)
            //===END===//

        }
    }
}
