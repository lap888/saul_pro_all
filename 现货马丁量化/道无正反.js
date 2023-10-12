/*
 * @Author: top.brids 
 * @Date: 2022-03-07 13:01:09 
 * @Last Modified by: top.brids
 * @Last Modified time: 2022-03-10 18:17:20
 */
// fmz@4c0d3b4755e9605df68f4d675237cb12
//1
let onPftData1 = {};
let onPftData2 = {};

K4 = 0.01 * K4;
Z = 0.01 * Z;
let isOk = false;
let isBinance = false;
let SymbolsEx = [];
let button0 = [];
let stoplist = [];
let listpft = [];
let listpft2 = [];
let Qs = [];
let doLong = false;
let doShort = false;
let followCoins = [];
let exs = "";
let trade_info = {};

let acc = null;
let list1 = [];
let list2 = [];
let longAddCount = [];
let shortAddCount = [];
let lSubP = [];
let sSubP = [];
let mlist = 0;
let initMacd30 = { isSame: null, flag: '', coin: '' }
//2
let init_Balance = null;
let FSTTime = null;
//3
let k = 0;
//5
let n1 = 0;
let account1 = null;
let position1 = null;
//6
let walletbalance = 0;
let walletB = 0;
let unrealizedProfit = 0;
let pft = 0;
let ir = 0;


//获取合约面值
function GetCtVal(coin1) {
    let coin = `${coin1.split('_')[0]}-${coin1.split('_')[1]}-SWAP`;
    let ctVal = 1;
    SymbolsEx.map((v, i) => {
        if (v.instId == coin) {
            ctVal = Number(v.ctVal);
        }
    });
    return ctVal;
}
//获取交易所精度 算首仓
function accuracyOk() {
    exchanges[k].SetContractType('swap');
    let coin = '';
    let coin1 = _C(exchanges[k].GetCurrency);
    coin = `${coin1.split('_')[0]}-${coin1.split('_')[1]}-SWAP`;
    let ticker1 = _C(exchanges[k].GetTicker)
    let quantityPrecision = 0;
    account1 = _C(exchanges[k].GetAccount)
    let minSz = 0;
    let ctVal = 1;
    SymbolsEx.map((v, i) => {
        if (v.instId == coin) {
            quantityPrecision = Number(v.lotSz);//下单数量精度
            minSz = Number(v.minSz) * Number(v.ctVal);
            ctVal = Number(v.ctVal);
        }
    });
    n1 = _N(P / ticker1.Last, quantityPrecision)
    let msg = ''
    if (n1 <= 0 || n1 < minSz) {
        n1 = 0;
        msg = `当前下单面值可开单个数${n1},${coin}=>最小下单数量:${minSz}`
    }

    n1 = _N(n1 / ctVal, 0)
    let data = { coin: coin1, amount: n1, msg: msg }
    Log(coin, '下单价值', P, 'U', '开单张数', n1, '合约面值', ctVal)
    return data;
}
//binance
function accuracyBinance() {
    exchanges[k].SetContractType('swap');
    let coin = '';
    let coin1 = _C(exchanges[k].GetCurrency);
    coin = coin1.split('_')[0] + coin1.split('_')[1];
    let ticker1 = _C(exchanges[k].GetTicker)
    let quantityPrecision = 0;
    account1 = _C(exchanges[k].GetAccount)
    SymbolsEx.map((v, i) => {
        if (v.symbol == coin) {
            quantityPrecision = v.quantityPrecision;
        }
    });
    n1 = _N(P / ticker1["Last"], quantityPrecision)
    let msg = ''
    if (n1 <= 0) {
        msg = `${coin},当前下单面值可开单个数${n1}`
    }
    let data = { coin: coin1, amount: n1, msg: msg }
    Log(coin, n1, '下单价值', P, 'U', '开单个数', n1)
    return data;
}
//
function table() {
    account1 = _C(exchange.GetAccount)
    let pos = []
    account1.Info.positions.map(v => {
        if (Number(v.positionAmt) != 0) {
            pos.push(v)
        }
    })
    //USDT保证金余额
    let totalMarginBalance = 0;
    let walletbalance = 0;
    unrealizedProfit = 0;
    if (isOk) {
        totalMarginBalance = account1.Info.data[0].details[0].cashBal;
        walletbalance = account1.Info.data[0].details[0].disEq;
        unrealizedProfit = account1.Info.data[0].details[0].upl;
    }
    if (isBinance) {
        totalMarginBalance = account1.Info.totalMarginBalance;
        walletbalance = account1.Info.totalWalletBalance;
        unrealizedProfit = account1.Info.totalUnrealizedProfit;
    }
    let toxh = _G('ToXh') == null ? 0 : _G('ToXh');
    let toHy = _G('ToHy') == null ? 0 : _G('ToHy');
    let lsAmount = _G("lsAmount") == null ? 0 : _G("lsAmount");
    let fee = _N(lsAmount * 0.01 * 0.075, 4);

    pft = _N((parseFloat(walletbalance) - parseFloat(init_Balance) + parseFloat(toxh) - parseFloat(toHy)), 6);
    //table2内容, USDT
    let NOWTime = _D() //当前时间
    let profit_ratio = 0
    if (init_Balance != 0) {
        profit_ratio = ((parseFloat(walletbalance) + toxh - parseFloat(init_Balance)) / parseFloat(init_Balance)) * 100
    }

    ///两个表格的选项
    let tab1 = {
        "type": "table",
        "title": "账户信息",
        "cols": ["初始资金", "钱包余额", "保证金余额", "划转到现货", "划转到合约", "全部未实现盈亏", "杠杆倍数", "全部净利润", "总收益率", "交易流水", "手续费", "循环延时"],
        "rows": []
    }
    let tabc = {
        "type": "table",
        "title": "交易对信息",
        "cols": ["币种名称", "趋势", "补仓", "开仓价格", "持仓方向", "持仓数量", "持仓价值", "未实现盈亏", "L | S | I | II", "操作"],
        "rows": []
    }
    let tab2 = {
        "type": "table",
        "title": "时间",
        "cols": ["初始时间", "当前时间"],
        "rows": []
    }
    let tab4 = {
        "type": "table",
        "title": "联系方式",
        "cols": ["微信", "QQ", "Telegram", "说明"],
        "rows": []
    }
    let jieshao1 = 'wkc19891'
    let jieshao2 = '道式量化[合作添加备注FMZ]'
    let str = "✱策略可租用 #32CD32"
    let str2 = "✱实盘风险自担 #007FFF"
    //往表格里加内容
    tab1.rows.push([`${_N(parseFloat(init_Balance), 6)}U`, `${_N(parseFloat(walletbalance), 6)}U`, `${_N(parseFloat(totalMarginBalance), 6)}U`, `${toxh}U`, `${toHy}U`, `${_N(parseFloat(unrealizedProfit), 6)}U`, `${M}`, `${pft}U`, `${_N(profit_ratio, 6)}%`, `${lsAmount}U`, `${fee}U`, `${trade_info.loop_delay}ms #FF0000`])
    tab2.rows.push([`${FSTTime}`, `${NOWTime}`])
    tab4.rows.push([`${jieshao1}`, "2043692042", "https://t.me/aelf_china", `${jieshao2}`])
    for (let i = 0; i < pos.length; i++) {
        let v = pos[i];
        let ir = followCoins.indexOf(v.symbol);
        let qs = Qs[ir] == "Long" ? "Long #00FF00" : Qs[ir] == "Short" ? "Short #FF0000" : "震荡中 #3299cc"
        button0[i] = { "type": "button", "name": "平仓", "cmd": `${v.symbol}:平仓:${v.positionSide}:${v.positionAmt}`, "description": "平仓" }
        let pc = 0;
        let pc2 = 0;
        let tj1 = 0;
        let tj2 = 0;
        let onBc = "0"
        if (ir != -1) {
            lSubP[ir] = _N(lSubP[ir], 4)
            sSubP[ir] = _N(sSubP[ir], 4)
            tj1 = lSubP[ir] > 0 ? `${lSubP[ir]}` : `${lSubP[ir]}`;
            tj2 = sSubP[ir] > 0 ? `${sSubP[ir]} #00FF00` : `${sSubP[ir]} #FF0000`;
            pc = _N(list1[ir], 4)
            pc2 = _N(list2[ir], 4)
            onBc = v.positionSide == "LONG" ? longAddCount[ir] : shortAddCount[ir]
        }
        tabc.rows.push([v.symbol, qs, onBc, _N(Number(v.entryPrice), 4), v.positionSide == "LONG" ? `${v.positionSide}#32CD32` : `${v.positionSide}#FF0000`, Math.abs(Number(v.positionAmt)), `${_N(Number(v.initialMargin), 2)}U[${v.leverage}]X`, Number(v.unrealizedProfit) < 0 ? `${_N(Number(v.unrealizedProfit), 4)} #FF0000` : `${_N(Number(v.unrealizedProfit), 4)} #32CD32`, `${pc} | ${pc2} | ${tj1} | ${tj2}`, button0[i]])
    }
    //打印栏
    LogStatus("`" + JSON.stringify(tab2) + "`\n" + "`" + JSON.stringify(tab1) + "`\n" + "`" + JSON.stringify(tabc) + "`\n" + "`" + JSON.stringify(tab4) + "`\n" + "策略启动时间:" + FSTTime + "\n" + str + "\n" + str2)
}
//
function CalLsAmount(amount, price) {
    let lsUsdt = parseFloat(amount) * parseFloat(price) * 2;
    let lsAmount = _G("lsAmount") == null ? 0 : _G("lsAmount");
    lsAmount += lsUsdt;
    lsAmount = _N(lsAmount, 4)
    _G("lsAmount", lsAmount)
}
//
function Coverall() {
    account1 = _C(exchange.GetAccount)
    if (isOk) {
        walletbalance = account1.Info.data[0].details[0].cashBal;
        unrealizedProfit = account1.Info.data[0].details[0].upl;
    }
    if (isBinance) {
        walletbalance = account1.Info.totalWalletBalance;
        unrealizedProfit = account1.Info.totalUnrealizedProfit;
    }
    for (let i = 0; i < exchanges.length; i++) {
        exchanges[i].SetContractType("swap")
        let position1 = _C(exchanges[i].GetPosition)
        if (position1.length == 1) {
            if (position1[0]["Type"] == 0) {
                exchanges[i].SetDirection("closebuy")
                exchanges[i].Sell(-1, position1[0].Amount)
                let ticker1 = _C(exchanges[i].GetTicker)
                CalLsAmount(position1[0].Amount, ticker1.Last)
            }
            if (position1[0]["Type"] == 1) {
                exchanges[i].SetDirection("closesell")
                exchanges[i].Buy(-1, position1[0].Amount)
                let ticker1 = _C(exchanges[i].GetTicker)
                CalLsAmount(position1[0].Amount, ticker1.Last)
            }
        }
        if (position1.length == 2) {
            exchanges[i].SetDirection("closebuy")
            exchanges[i].Sell(-1, position1[0].Amount)
            let ticker1 = _C(exchanges[i].GetTicker)
            CalLsAmount(position1[0].Amount, ticker1.Last)
            exchanges[i].SetDirection("closesell")
            exchanges[i].Buy(-1, position1[1].Amount)
            CalLsAmount(position1[1].Amount, ticker1.Last)
        }
    }
    _G('lSubP', null);
    _G('sSubP', null);
    _G('acc', null);
    _G('listpft', null);
    _G('listpft2', null)
    _G('list1', null);
    _G('list2', null);
    _G('mlist', null);
    _G('longAddCount', null);
    _G('shortAddCount', null);
    Log('您的账户已经全部清仓@')
}
//
function CancelOrderAll(e) {
    let orders = e.GetOrders()
    if (orders.length > 0) {
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i];
            e.CancelOrder(order.Id)
        }
        Log("撤销所有未成功订单")
    }
}

//trade
function trade() {
    let currency = followCoins[ir];
    let posL = null;
    let posS = null;
    account1.Info.positions.map(v => {
        if (Number(v.positionAmt) > 0 && v.symbol == currency) {
            posL = v;
        }
        if (Number(v.positionAmt) < 0 && v.symbol == currency) {
            posS = v;
        }
    });
    let ticker1 = _C(exchanges[ir].GetTicker)
    let long1 = false;
    let short1 = false;
    let qsL = false;
    let qsS = false;
    if (OpType == 0) {
        doLong = true;
    } else if (OpType == 1) {
        doShort = true;
    } else {
        doLong = true;
        doShort = true;
    }
    //趋势方向
    let r1 = exchanges[ir].GetRecords(PERIOD_M1);
    let MACD1 = TA.MACD(r1, 12, 26, 9)
    long1 = MACD1[2][MACD1[2].length - 2] <= 0 && MACD1[2][MACD1[2].length - 1] > 0;
    short1 = MACD1[2][MACD1[2].length - 2] >= 0 && MACD1[2][MACD1[2].length - 1] < 0;
    let r2 = exchanges[ir].GetRecords(PERIOD_M5);
    let emaFast = TA.EMA(r2, 7);
    let emaSlow = TA.EMA(r2, 12);
    qsL = emaFast[emaFast.length - 1] > emaSlow[emaSlow.length - 1];
    qsS = emaFast[emaFast.length - 1] < emaSlow[emaSlow.length - 1];
    let MACD2 = TA.MACD(r2, 12, 26, 9)
    let qsL1 = MACD2[2][MACD2[2].length - 1] > 0;
    let qsS1 = MACD2[2][MACD2[2].length - 1] < 0;
    Qs[ir] = qsL ? "Long" : qsS ? "Short" : ""
    //止损
    if (Zs) {
        if (posL != null) {
            let unrealizedProfit = Number(posL.unrealizedProfit);
            let positionAmt = Number(posL.positionAmt);
            if (ZsLong != 0 && unrealizedProfit < -ZsLong && longAddCount[ir] >= maxLAC) {
                exchanges[ir].SetDirection('closebuy')
                exchanges[ir].Sell(-1, positionAmt)
                CalLsAmount(positionAmt, ticker1.Last)
                list1[ir] = 0
                _G('list1', list1)
                longAddCount[ic] = 0;
                _G('longAddCount', longAddCount)
                lSubP[ir] = 0;
                _G('lSubP', lSubP);
                SendTgLog(`${currency}`, '多单止损 卖出平多 清仓')
                LogProfit(pft)
            }
        }
        if (posS != null) {
            let unrealizedProfit = Number(posS.unrealizedProfit);
            let positionAmt = Math.abs(Number(posS.positionAmt));
            if (ZsShort != 0 && unrealizedProfit < -ZsShort && shortAddCount[ir] >= maxSAC) {
                exchanges[ir].SetDirection('closesell')
                exchanges[ir].Buy(-1, positionAmt)
                CalLsAmount(positionAmt, ticker1.Last)
                list2[ir] = 0
                _G('list2', list2)
                shortAddCount[ir] = 0;
                _G('shortAddCount', shortAddCount)
                sSubP[ir] = 0;
                _G('sSubP', sSubP);
                SendTgLog(`${currency}`, '空单止损 买入平空 清仓')
                LogProfit(pft)
            }
        }
    }
    let longBack = false;
    let shortBack = false;
    //回调 反弹
    {
        //回调
        let pftData1 = onPftData1[currency]
        if (pftData1 == undefined || pftData1 == 0) {
            onPftData1[currency] = ticker1.Last
        } else {
            let maxPrice = Math.max(onPftData1[currency], ticker1.Last)
            onPftData1[currency] = maxPrice
        }
        if (ticker1.Last < onPftData1[currency] * (1 - 0.1 * 0.01)) {
            longBack = true;
        }
        //反弹
        let pftData2 = onPftData2[currency]
        if (pftData2 == undefined || pftData2 == 0) {
            onPftData2[currency] = ticker1.Last
        } else {
            let minPrice = Math.min(onPftData2[currency], ticker1.Last)
            onPftData2[currency] = minPrice
        }
        if (ticker1.Last > onPftData2[currency] * (1 + 0.1 * 0.01)) {
            shortBack = true;
        }
    }
    //多
    if (doLong) {
        if (posL == null) {
            let doF = posS == null ? longBack : true;
            if (doF) {
                exchanges[ir].SetDirection('buy')
                exchanges[ir].Buy(-1, acc[ir])
                list1[ir] = ticker1.Last;
                _G('list1', list1)
                longAddCount[ir] = longAddCount[ir] + 1;
                _G('longAddCount', longAddCount);
                SendTgLog(`马丁=>${posL == null ? '首次开仓' : '补仓'},币种为:${currency}=>买入开多=>买单量为:${acc[ir]}=>买单价格为:${list1[ir]}`)
                LogProfit(pft)
                Sleep(100)
            }
        } else {
            let entryPrice = Number(posL.entryPrice);
            let unrealizedProfit = Number(posL.unrealizedProfit);
            let positionAmt = Number(posL.positionAmt);
            if (longAddCount[ir] < maxLAC) {
                if (shortAddCount[ir] >= maxSAC - 1 || (qsL && qsL1)) {
                    //滚仓
                    if (qsL || qsL1) {
                        if (ticker1.Last > list1[ir] * (1 + Z)) {
                            exchanges[ir].SetDirection('buy')
                            let amount = acc[ir] * Math.pow(2, longAddCount[ir])
                            exchanges[ir].Buy(-1, amount);
                            list1[ir] = ticker1.Last;
                            _G('list1', list1)
                            longAddCount[ir] = longAddCount[ir] + 1;
                            _G('longAddCount', longAddCount);
                            SendTgLog(`马丁滚仓=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${longAddCount[ir]},币种为:${currency}=>买入开多=>买单量为:${amount}=>买单价格为:${list1[ir]}`)
                            LogProfit(pft)
                        }
                    } else {
                        //常规补仓
                        if (list1[ir] == 0 || list1[ir] == undefined) {

                            list1[ir] = entryPrice
                        }
                        if (ticker1.Last < (1 - GetE(ir, 0)) * list1[ir]) {
                            listpft[ir].push(unrealizedProfit)
                            _G('listpft', listpft)
                            let minpft = Math.min(...listpft[ir])
                            if (unrealizedProfit > (1 - K4) * minpft && long1) {
                                exchanges[ir].SetDirection('buy')
                                let amount = acc[ir] * Math.pow(2, longAddCount[ir])
                                exchanges[ir].Buy(-1, amount);
                                list1[ir] = ticker1.Last;
                                _G('list1', list1)
                                longAddCount[ir] = longAddCount[ir] + 1;
                                _G('longAddCount', longAddCount);
                                SendTgLog(`对冲=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${longAddCount[ir]},币种为:${currency}=>买入开多=>买单量为:${amount}=>买单价格为:${list1[ir]}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    //马丁对冲止盈
                    if (longAddCount[ir] >= maxSAC - 1 || !qsL || !qsL1) {
                        if (ticker1.Last > entryPrice * (1 + Z)) {
                            let _lSubP = lSubP[ir] > 0 ? 0 : Math.abs(lSubP[ir])
                            if (unrealizedProfit > _lSubP) {
                                listpft[ir].push(unrealizedProfit)
                                _G('listpft', listpft)
                                let maxpft = Math.max(...listpft[ir])
                                if (unrealizedProfit < (1 - K4) * maxpft) {
                                    exchanges[ir].SetDirection('closebuy')
                                    exchanges[ir].Sell(-1, positionAmt)
                                    CalLsAmount(positionAmt, ticker1.Last)
                                    listpft[ir] = []
                                    _G('listpft', listpft)
                                    longAddCount[ir] = 0;
                                    _G('longAddCount', longAddCount);
                                    list1[ir] = 0
                                    _G('list1', list1)
                                    lSubP[ir] = 0;
                                    _G('lSubP', lSubP);
                                    let porfit_usdt = ((ticker1.Last - entryPrice) * positionAmt).toFixed(4);
                                    SendTgLog(`滚仓止盈=>币种为:${currency}=>卖出平多=>卖单量为:${positionAmt}=>卖单价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                                    LogProfit(pft)
                                }
                            }
                        }
                    }
                } else {
                    //金叉给多单补仓 正常补仓 金叉 回撤
                    if (unrealizedProfit < 0) {
                        if (list1[ir] == 0 || list1[ir] == undefined) {
                            list1[ir] = entryPrice
                        }
                        if (ticker1.Last < (1 - GetE(ir, 0)) * list1[ir]) {
                            listpft[ir].push(unrealizedProfit)
                            _G('listpft', listpft)
                            let minpft = Math.min(...listpft[ir])
                            if (unrealizedProfit > (1 - K4) * minpft && long1) {
                                exchanges[ir].SetDirection('buy')
                                let amount = acc[ir] * Math.pow(2, longAddCount[ir])
                                exchanges[ir].Buy(-1, amount);
                                list1[ir] = ticker1.Last;
                                _G('list1', list1)
                                longAddCount[ir] = longAddCount[ir] + 1;
                                _G('longAddCount', longAddCount);
                                SendTgLog(`马丁=>${posL == null ? '首次开仓' : '补仓'},=>补仓次数=>${longAddCount[ir]},币种为:${currency}=>买入开多=>买单量为:${amount}=>买单价格为:${list1[ir]}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    //止盈
                    if (ticker1.Last > entryPrice * (1 + Z)) {
                        let _lSubP = lSubP[ir] > 0 ? 0 : Math.abs(lSubP[ir])
                        if (unrealizedProfit > _lSubP) {
                            listpft[ir].push(unrealizedProfit)
                            _G('listpft', listpft)
                            let maxpft = Math.max(...listpft[ir])
                            if (unrealizedProfit < (1 - K4) * maxpft) {
                                exchanges[ir].SetDirection('closebuy')
                                exchanges[ir].Sell(-1, positionAmt)
                                CalLsAmount(positionAmt, ticker1.Last)
                                listpft[ir] = []
                                _G('listpft', listpft)
                                longAddCount[ir] = 0;
                                _G('longAddCount', longAddCount);
                                list1[ir] = 0
                                _G('list1', list1)
                                lSubP[ir] = 0;
                                _G('lSubP', lSubP);
                                let porfit_usdt = ((ticker1.Last - entryPrice) * positionAmt).toFixed(4);
                                SendTgLog(`马丁=>币种为:${currency}=>卖出平多=>卖单量为:${positionAmt}=>卖单价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                                LogProfit(pft)
                            }
                        }
                    }
                }
            } else {
                //动态调仓
                if (list1[ir] == 0 || list1[ir] == undefined) {
                    list1[ir] = entryPrice
                }
                if (ticker1.Last < (1 - GetE(ir, 0)) * list1[ir] && long1 && qsL) {
                    listpft[ir].push(unrealizedProfit)
                    _G('listpft', listpft)
                    exchanges[ir].SetDirection('buy')
                    let amount = acc[ir] * Math.pow(2, maxLAC)
                    exchanges[ir].Buy(-1, amount);
                    list1[ir] = ticker1.Last;
                    _G('list1', list1)
                    longAddCount[ir] = longAddCount[ir] + 1;
                    _G('longAddCount', longAddCount);
                    SendTgLog(`多方=>动态调仓:${longAddCount[ir]},币种为:${currency}=>买入开多=>买单量为:${amount}=>买单价格为:${list1[ir]}`)
                    LogProfit(pft)
                } else {
                    if (ticker1.Last > (1 + GetE(ir, 0)) * list1[ir]) {
                        //卖出 磨损记录
                        listpft[ir].push(unrealizedProfit)
                        _G('listpft', listpft)
                        exchanges[ir].SetDirection('closebuy')
                        let amount = acc[ir] * Math.pow(2, maxLAC - 1)
                        exchanges[ir].Sell(-1, amount)
                        CalLsAmount(amount, ticker1.Last)
                        longAddCount[ir] = longAddCount[ir] - 1;
                        _G('longAddCount', longAddCount);
                        let porfit_usdt = ((ticker1.Last - list1[ir]) * amount).toFixed(4);
                        list1[ir] = ticker1.Last
                        _G('list1', list1)
                        lSubP[ir] = lSubP[ir] + unrealizedProfit * amount / positionAmt;
                        _G('lSubP', lSubP);
                        SendTgLog(`多方-动态调仓:${longAddCount[ir]}=>币种为:${currency}=>卖出平多=>卖单量为:${amount}=>卖单价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                        LogProfit(pft)
                    } else {
                        if (longAddCount[ir] <= maxLAC + 1) {
                            if (ticker1.Last > entryPrice * (1 + Z)) {
                                let _lSubP = lSubP[ir] > 0 ? 0 : Math.abs(lSubP[ir])
                                if (unrealizedProfit > _lSubP) {
                                    listpft[ir].push(unrealizedProfit)
                                    _G('listpft', listpft)
                                    let maxpft = Math.max(...listpft[ir])
                                    if (unrealizedProfit < (1 - K4) * maxpft) {
                                        exchanges[ir].SetDirection('closebuy')
                                        exchanges[ir].Sell(-1, positionAmt)
                                        CalLsAmount(positionAmt, ticker1.Last)
                                        listpft[ir] = []
                                        _G('listpft', listpft)
                                        longAddCount[ir] = 0;
                                        _G('longAddCount', longAddCount);
                                        list1[ir] = 0
                                        _G('list1', list1)
                                        lSubP[ir] = 0;
                                        _G('lSubP', lSubP);
                                        let porfit_usdt = ((ticker1.Last - entryPrice) * positionAmt).toFixed(4);
                                        SendTgLog(`多方-止盈=>币种为:${currency}=>卖出平多=>卖单量为:${positionAmt}=>卖单价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                                        LogProfit(pft)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    //空
    if (doShort) {
        if (posS == null) {
            let doF = posL == null ? shortBack : true;
            if (doF) {
                exchanges[ir].SetDirection('sell')
                exchanges[ir].Sell(-1, acc[ir])
                list2[ir] = ticker1.Last;
                _G('list2', list2)
                shortAddCount[ir] = shortAddCount[ir] + 1;
                _G('shortAddCount', shortAddCount);
                SendTgLog(`马丁=>${posS == null ? '首次开仓' : '补仓'},币种为:${currency}=>卖出开空=>数量为:${acc[ir]}=>价格为:${list2[ir]}`)
                LogProfit(pft)
                Sleep(100)
            }
        } else {
            let entryPrice1 = Number(posS.entryPrice);
            let unrealizedProfit1 = Number(posS.unrealizedProfit);
            let positionAmt1 = Math.abs(Number(posS.positionAmt));
            if (shortAddCount[ir] < maxSAC) {
                if (longAddCount[ir] >= maxLAC - 1 || (qsS && qsS1)) {
                    if (qsS || qsS1) {
                        //滚仓
                        if (ticker1.Last < list2[ir] * (1 - Z)) {
                            listpft2[ir].push(unrealizedProfit1)
                            _G('listpft2', listpft2)
                            exchanges[ir].SetDirection('sell')
                            let amount = acc[ir] * Math.pow(2, shortAddCount[ir]);
                            exchanges[ir].Sell(-1, amount)
                            list2[ir] = ticker1.Last;
                            _G('list2', list2)
                            shortAddCount[ir] = shortAddCount[ir] + 1;
                            _G('shortAddCount', shortAddCount);
                            SendTgLog(`滚仓=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${shortAddCount[ir]},币种为:${currency}=>卖出开空=>数量为:${amount}=>价格为:${ticker1.Last}`)
                            LogProfit(pft)
                        }
                    } else {
                        //对冲补仓
                        if (list2[ir] == 0 || list2[ir] == undefined) {
                            list2[ir] = entryPrice1
                        }
                        if (ticker1.Last > (1 + GetE(ir, 1)) * list2[ir] && short1) {
                            listpft2[ir].push(unrealizedProfit1)
                            _G('listpft2', listpft2)
                            let minpft2 = Math.min(...listpft2[ir])
                            if (unrealizedProfit1 > (1 - K4) * minpft2) {
                                exchanges[ir].SetDirection('sell')
                                let amount = acc[ir] * Math.pow(2, shortAddCount[ir]);
                                exchanges[ir].Sell(-1, amount)
                                list2[ir] = ticker1.Last;
                                _G('list2', list2)
                                shortAddCount[ir] = shortAddCount[ir] + 1;
                                _G('shortAddCount', shortAddCount);
                                SendTgLog(`对冲=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${shortAddCount[ir]},币种为:${currency}=>卖出开空=>数量为:${amount}=>价格为:${ticker1.Last}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    //止盈
                    if (shortAddCount[ir] >= maxSAC - 1 || !qsS || !qsS1) {
                        if (ticker1.Last <= entryPrice1 * (1 - Z)) {
                            let _sSubP = sSubP[ir] > 0 ? 0 : Math.abs(sSubP[ir])
                            if (unrealizedProfit1 > _sSubP) {
                                listpft2[ir].push(unrealizedProfit1)
                                _G('listpft2', listpft2)
                                let maxpft2 = Math.max(...listpft2[ir])
                                if (unrealizedProfit1 < (1 - K4) * maxpft2) {
                                    exchanges[ir].SetDirection('closesell')
                                    exchanges[ir].Buy(-1, positionAmt1)
                                    CalLsAmount(positionAmt1, ticker1.Last)
                                    let porfit_usdt = ((entryPrice1 - ticker1.Last) * positionAmt1).toFixed(4);
                                    SendTgLog(`滚仓止盈=>币种为:${currency}=>买入平空=>数量为:${positionAmt1}=>价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                                    LogProfit(pft)
                                    listpft2[ir] = []
                                    _G('listpft2', listpft2)
                                    shortAddCount[ir] = 0;
                                    _G('shortAddCount', shortAddCount);
                                    sSubP[ir] = 0;
                                    _G('sSubP', sSubP);
                                    list2[ir] = 0
                                    _G('list2', list2)
                                }
                            }
                        }
                    }
                } else {
                    //常规补仓
                    if (unrealizedProfit1 < 0) {
                        if (list2[ir] == 0 || list2[ir] == undefined) {
                            list2[ir] = entryPrice1
                        }
                        if (ticker1.Last > (1 + GetE(ir, 1)) * list2[ir] && short1) {
                            listpft2[ir].push(unrealizedProfit1)
                            _G('listpft2', listpft2)
                            let minpft2 = Math.min(...listpft2[ir])
                            if (unrealizedProfit1 > (1 - K4) * minpft2) {
                                exchanges[ir].SetDirection('sell')
                                let amount = acc[ir] * Math.pow(2, shortAddCount[ir]);
                                exchanges[ir].Sell(-1, amount)
                                list2[ir] = ticker1.Last;
                                _G('list2', list2)
                                shortAddCount[ir] = shortAddCount[ir] + 1;
                                _G('shortAddCount', shortAddCount);
                                SendTgLog(`马丁=>${posS == null ? '首次开仓' : '补仓'},=>补仓次数=>${shortAddCount[ir]},币种为:${currency}=>卖出开空=>数量为:${amount}=>价格为:${ticker1.Last}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    //止盈
                    if (ticker1.Last <= entryPrice1 * (1 - Z)) {
                        let _sSubP = sSubP[ir] > 0 ? 0 : Math.abs(sSubP[ir])
                        if (unrealizedProfit1 > _sSubP) {
                            listpft2[ir].push(unrealizedProfit1)
                            _G('listpft2', listpft2)
                            let maxpft2 = Math.max(...listpft2[ir])
                            if (unrealizedProfit1 < (1 - K4) * maxpft2) {
                                exchanges[ir].SetDirection('closesell')
                                exchanges[ir].Buy(-1, positionAmt1)
                                CalLsAmount(positionAmt1, ticker1.Last)
                                let porfit_usdt = ((entryPrice1 - ticker1.Last) * positionAmt1).toFixed(4);
                                SendTgLog(`马丁=>币种为:${currency}=>买入平空=>数量为:${positionAmt1}=>价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                                LogProfit(pft)
                                listpft2[ir] = []
                                _G('listpft2', listpft2)
                                shortAddCount[ir] = 0;
                                _G('shortAddCount', shortAddCount);
                                sSubP[ir] = 0;
                                _G('sSubP', sSubP);
                                list2[ir] = 0
                                _G('list2', list2)
                            }
                        }
                    }
                }
            } else {
                //动态调仓
                if (list2[ir] == 0 || list2[ir] == undefined) {
                    list2[ir] = entryPrice1
                }
                if (ticker1.Last > (1 + GetE(ir, 1)) * list2[ir] && short1 && qsS) {
                    listpft2[ir].push(unrealizedProfit1)
                    _G('listpft2', listpft2)
                    exchanges[ir].SetDirection('sell')
                    let amount = acc[ir] * Math.pow(2, maxSAC);
                    exchanges[ir].Sell(-1, amount)
                    list2[ir] = ticker1.Last;
                    _G('list2', list2)
                    shortAddCount[ir] = shortAddCount[ir] + 1;
                    _G('shortAddCount', shortAddCount);
                    SendTgLog(`空方-动态调仓:${shortAddCount[ir]}=>币种为:${currency}=>卖出开空=>数量为:${amount}=>价格为:${ticker1.Last}`)
                    LogProfit(pft)
                } else {
                    if (ticker1.Last <= (1 - GetE(ir, 1)) * list2[ir]) {
                        listpft2[ir].push(unrealizedProfit1)
                        _G('listpft2', listpft2)
                        exchanges[ir].SetDirection('closesell')
                        let amount = acc[ir] * Math.pow(2, maxSAC - 1);
                        exchanges[ir].Buy(-1, amount)
                        CalLsAmount(amount, ticker1.Last)
                        shortAddCount[ir] = shortAddCount[ir] - 1;
                        _G('shortAddCount', shortAddCount);
                        let porfit_usdt = ((list2[ir] - ticker1.Last) * amount).toFixed(4);
                        SendTgLog(`空方-动态调仓:${shortAddCount[ir]}=>币种为:${currency}=>买入平空=>数量为:${amount}=>价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                        LogProfit(pft)
                        sSubP[ir] = sSubP[ir] + unrealizedProfit1 * amount / positionAmt1;
                        _G('sSubP', sSubP);
                        list2[ir] = ticker1.Last
                        _G('list2', list2)
                    } else {
                        if (shortAddCount[ir] <= maxSAC + 1) {
                            if (ticker1.Last <= entryPrice1 * (1 - Z)) {
                                let _sSubP = sSubP[ir] > 0 ? 0 : Math.abs(sSubP[ir])
                                if (unrealizedProfit1 > _sSubP) {
                                    listpft2[ir].push(unrealizedProfit1)
                                    _G('listpft2', listpft2)
                                    let maxpft2 = Math.max(...listpft2[ir])
                                    if (unrealizedProfit1 < (1 - K4) * maxpft2) {
                                        exchanges[ir].SetDirection('closesell')
                                        exchanges[ir].Buy(-1, positionAmt1)
                                        CalLsAmount(positionAmt1, ticker1.Last)
                                        let porfit_usdt = ((entryPrice1 - ticker1.Last) * positionAmt1).toFixed(4);
                                        SendTgLog(`空方-止盈=>币种为:${currency}=>买入平空=>数量为:${positionAmt1}=>价格为:${ticker1.Last}=>预计盈利:${porfit_usdt}`)
                                        LogProfit(pft)
                                        listpft2[ir] = []
                                        _G('listpft2', listpft2)
                                        shortAddCount[ir] = 0;
                                        _G('shortAddCount', shortAddCount);
                                        sSubP[ir] = 0;
                                        _G('sSubP', sSubP);
                                        list2[ir] = 0
                                        _G('list2', list2)
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
//
function mainBefor() {
    exchange.SetContractType("swap");
    account1 = exchange.GetAccount();
    if (isOk) {
        let exchangeInfo = exchange.IO("api", "GET", "/api/v5/public/instruments?instType=SWAP");
        SymbolsEx = exchangeInfo.data;
        walletbalance = account1.Info.data[0].details[0].disEq;
    }
    if (isBinance && !IsVirtual()) {
        let exchangeInfo = exchange.IO("api", "GET", `/fapi/v1/exchangeInfo`, ``, ``)
        SymbolsEx = exchangeInfo.symbols;
        walletbalance = account1.Info.totalWalletBalance;
    }
    if (_G('init_Balance') && _G('FSTTime')) {
        Log('成功读取上次进度!')
        init_Balance = _G('init_Balance')
        FSTTime = _G('FSTTime')
    } else {
        Log('程序第一次运行，保存初始资金数据!#3299cc')
        if (isOk) {
            init_Balance = account1.Info.data[0].details[0].disEq;
        }
        if (isBinance) {
            init_Balance = IsVirtual() ? account1.Balance : account1.Info.totalWalletBalance;
        }
        FSTTime = _D()
        _G('init_Balance', init_Balance)
        _G('FSTTime', FSTTime)
    }
    if (_G('lSubP') && _G('sSubP') && _G('acc') && _G('listpft') && _G('listpft2') && _G('list1') && _G('list2') && _G('mlist')) {
        acc = _G('acc')
        listpft = _G('listpft')
        listpft2 = _G('listpft2')
        list1 = _G('list1')
        list2 = _G('list2')
        longAddCount = _G('longAddCount')
        shortAddCount = _G('shortAddCount')
        lSubP = _G('lSubP')
        sSubP = _G('sSubP')
        mlist = _G('mlist')
    } else {
        acc = []
        _G('acc', acc)
        listpft = []
        listpft2 = []
        list1 = []
        list2 = []
        shortAddCount = []
        longAddCount = []
        lSubP = []
        sSubP = []
        mlist = T0
        for (let i = 0; i < 100; i++) {
            listpft.push([])
            listpft2.push([])
            longAddCount.push([])
            longAddCount[i] = 0
            shortAddCount.push([])
            shortAddCount[i] = 0
            lSubP.push([])
            lSubP[i] = 0;
            sSubP.push([])
            sSubP[i] = 0;
            list1.push(0)
            list2.push(0)

        }
        _G('listpft', listpft)
        _G('listpft2', listpft2)
        if (!_G('longAddCount')) {
            _G('longAddCount', longAddCount)
        } else {
            longAddCount = _G('longAddCount')
        }
        if (!_G('shortAddCount')) {
            _G('shortAddCount', shortAddCount)
        } else {
            shortAddCount = _G('shortAddCount')
        }
        _G('list1', list1)
        _G('list2', list2)
        _G('mlist', mlist)
        _G('lSubP', lSubP)
        _G('sSubP', sSubP)
    }
    for (let i = 0; i < exchanges.length; i++) {
        k = i
        let data = null;
        if (isOk) {
            data = accuracyOk()
        }
        if (isBinance) {
            data = accuracyBinance()
        }
        acc.push(n1)
        _G('acc', acc)
        if (data.amount <= 0) {
            stoplist.push(data)
        }
    }
}
/**
 * 获取补仓动态率
 * @param {*} ir coin ir
 * @param {*} type 0 多 1 空
 * @returns 
 */
function GetE(ir, type) {
    let count = 0;
    let rate = 0.3;
    if (type == 0) {
        count = longAddCount[ir]
    }
    if (type == 1) {
        count = longAddCount[ir]
    }
    rate = rate + count / 8;
    rate = rate * 0.01;
    return rate;
}
function SendTgLog(msg) {
    HttpQuery("http://tv.52expo.top/api/tgmsg", `msg=${msg}&token=${TgToken}`)
}
//
function main() {
    let eName = exchange.GetName();
    isOk = eName.indexOf("OKCoin") != -1;
    isBinance = eName.indexOf("Binance") != -1;
    if (!isBinance) {
        throw "该策略只支持币安"
    }
    if (isBinance && !IsVirtual()) {
        let ret = exchange.IO("api", "GET", "/fapi/v1/positionSide/dual")
        if (!ret.dualSidePosition) {
            let ret1 = exchange.IO("api", "POST", "/fapi/v1/positionSide/dual", "dualSidePosition=true")
            Log("修改持仓=>", ret1)
        }
    }
    followCoins = [];
    for (let i = 0; i < exchanges.length; i++) {
        let coin = exchanges[i].GetCurrency();
        let _coin = coin.split('_');
        let c = _coin[0] + _coin[1];
        followCoins.push(c)
        exs += c;
    }
    Log("run coins:", followCoins)
    let exlengths = _G('exlengths')
    if (exlengths == null) {
        _G('exlengths', exs)
    } else {
        if (exlengths != exs) {
            _G('lSubP', null);
            _G('sSubP', null);
            _G('acc', null);
            _G('listpft', null);
            _G('listpft2', null)
            _G('list1', null);
            _G('list2', null);
            _G('mlist', null);
            _G('exlengths', exs)
            Log('exs changed...', exs)
        }
    }
    let leverageRes = exchange.IO("api", "GET", "/fapi/v1/leverageBracket", "", "");
    for (let i = 0; i < exchanges.length; i++) {
        button0.push(0)
        Qs[i] = "";
        if (MaxM) {
            let c = _C(exchanges[i].GetCurrency)
            let symbol = c.replace('_', '')
            leverageRes.map(v => {
                if (v.symbol == symbol) {
                    exchanges[i].SetContractType('swap')
                    let leverage = v.brackets[0].initialLeverage;
                    exchanges[i].SetMarginLevel(leverage)
                }
            });
        } else {
            exchanges[i].SetContractType('swap')
            exchanges[i].SetMarginLevel(M)
        }
    }
    mainBefor()
    while (true) {
        let loop_start = Date.now();
        try {
            if (!IsVirtual()) {
                table()
            }

            for (let i = 0; i < followCoins.length; i++) {
                ir = i;
                trade()
                Sleep(S)
            }
            if (!IsVirtual()) {
                mlist = T0;
                walletB = Number(account1.Info.totalWalletBalance) + Number(account1.Info.totalUnrealizedProfit);
                if (walletB > mlist) {
                    if (isBinance) {
                        let amount = T1;
                        if (amount > 5) {
                            let timestamp = new Date().getTime();
                            let base = "https://api.binance.com"
                            exchange.SetBase(base)
                            let res = exchange.IO("api", "POST", "/sapi/v1/futures/transfer", `asset=USDT&amount=${amount}&type=2&timestamp=${timestamp}`, "")
                            Log('划转到现货', res, amount)
                            let toxh = _G('ToXh') == null ? 0 : _G('ToXh')
                            toxh += amount
                            _G('ToXh', toxh)
                            base = "https://fapi.binance.com"
                            exchange.SetBase(base)
                        }
                    }
                    Log('盈利达到设定值,全部清仓')
                    Coverall()
                }
                let cmd = GetCommand()
                if (cmd) {
                    arr = cmd.split(':')
                    if (arr[0] == '一键平仓') {
                        Coverall()
                        Sleep(100000000000)
                    }
                    if (arr[1] == '0') {
                        let a = parseInt(arr[0])
                        let _currency = followCoins[a]//.GetCurrency()
                        let data = { coin: _currency, amount: n1, msg: '手动停止' }
                        stoplist.push(data)
                        Log('当前停止的币对:', _currency)
                    }
                    if (arr[0] == '转到合约') {
                        if (isBinance) {
                            let amount = parseInt(arr[1]);
                            let timestamp = new Date().getTime();
                            let base = "https://api.binance.com"
                            exchange.SetBase(base)
                            let res = exchange.IO("api", "POST", "/sapi/v1/futures/transfer", `asset=USDT&amount=${amount}&type=1&timestamp=${timestamp}`, "")
                            Log('现货划转到合约', res, amount)
                            let toHy = _G('ToHy') == null ? 0 : _G('ToHy')
                            toHy += amount
                            _G('ToHy', toHy)
                            base = "https://fapi.binance.com"
                            exchange.SetBase(base)
                        } else {
                            Log('OK暂不支持划转')
                        }
                    }
                    if (arr[0] == '转到现货') {
                        if (isBinance) {
                            let amount = parseInt(arr[1]);
                            let timestamp = new Date().getTime();
                            let base = "https://api.binance.com"
                            exchange.SetBase(base)
                            let res = exchange.IO("api", "POST", "/sapi/v1/futures/transfer", `asset=USDT&amount=${amount}&type=2&timestamp=${timestamp}`, "")
                            Log('合约划转到现货', res, amount)
                            let toxh = _G('ToXh') == null ? 0 : _G('ToXh')
                            toxh += amount
                            _G('ToXh', toxh)
                            base = "https://fapi.binance.com"
                            exchange.SetBase(base)
                        } else {
                            Log('OK暂不支持划转')
                        }
                    }
                    if (arr[1] == '平仓') {
                        let ic = followCoins.indexOf(arr[0]);
                        if (ic > -1) {
                            let amount = Number(arr[3]);
                            exchanges[ic].SetContractType("swap")
                            if (arr[2] == 'LONG') {
                                exchanges[ic].SetDirection("closebuy")
                                let ticker1 = _C(exchanges[ic].GetTicker)
                                exchanges[ic].Sell(-1, amount)
                                CalLsAmount(amount, ticker1.Last)
                                longAddCount[ic] = 0;
                                _G('longAddCount', longAddCount)
                                lSubP[ir] = 0;
                                _G('lSubP', lSubP);
                                list1[ic] = 0
                                _G('list1', list1)
                            }
                            if (arr[2] == 'SHORT') {
                                exchanges[ic].SetDirection("closesell")
                                amount = Math.abs(amount)
                                exchanges[ic].Buy(-1, amount)
                                let ticker1 = _C(exchanges[ic].GetTicker)
                                CalLsAmount(amount, ticker1.Last)
                                shortAddCount[ic] = 0;
                                _G('shortAddCount', shortAddCount)
                                sSubP[ir] = 0;
                                _G('sSubP', sSubP);
                                list2[ic] = 0
                                _G('list2', list2)
                            }
                            LogProfit(pft)
                        } else {
                            Log(arr[0], "该交易对未监听请去交易所平仓")
                        }
                    }
                    if (arr[0] == '清空日志') {
                        LogReset()
                        Log('日志已经清空')
                    }
                    if (arr[0] == '重置收益') {
                        _G(null)
                        LogReset()
                        stoplist = [];
                        LogProfitReset()
                        mainBefor()
                        Log('已重置收益')
                    }
                }
            }
        } catch (e) {
            Log('系统error', e);
            Sleep(2000)
        }
        trade_info.loop_delay = Date.now() - loop_start;
    }
}