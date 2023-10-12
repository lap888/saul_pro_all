// fmz@7d565c2771ddf7622256cbcad4415fcc
/*
 * @Author: top.brids 
 * @Date: 2021-12-08 14:09:47 
 * @Last Modified by: top.brids
 * @Last Modified time: 2021-12-20 14:39:06
 */
//1
let isOk = false;
let isBinance = false;
let SymbolsEx = [];
let button0 = [];
let stoplist = [];
let listpft = [];
let listpft2 = [];

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
//4
let BV1 = 0;
let CV1 = 0;
//5
let n1 = 0;
let account1 = null;
let position1 = null;
//6
let walletbalance = 0;
let unrealizedProfit = 0;
let pft = 0;
//
let ir = 0;
let list_currency = [];
//
let Tj = E - 0.318;
let maxAddCount = 9;
let lsRate = 1;
let UpDownRates = [];
let VixRates = [];
let LastBarTime = 0
let LastNbar = {}
//


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
        msg = `当前下单面值可开单个数${n1},${coin}=>最小下单数量:${10 ** -quantityPrecision}`
    }
    let data = { coin: coin1, amount: n1, msg: msg }
    Log(coin, n1, '下单价值', P, 'U', '开单个数', n1)
    return data;
}
//
function table() {
    exchange.SetContractType('swap')
    account1 = _C(exchange.GetAccount)
    //USDT保证金余额
    let totalMarginBalance = 0;
    let walletbalance = 0;
    unrealizedProfit = 0;
    //获取账户基本信息
    position1 = _C(exchange.GetPosition)
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


    pft = _N((parseFloat(walletbalance) - parseFloat(init_Balance)), 6);
    //table2内容, USDT
    let NOWTime = _D() //当前时间
    let profit_ratio = 0
    if (init_Balance != 0) {
        profit_ratio = ((parseFloat(walletbalance) - parseFloat(init_Balance)) / parseFloat(init_Balance)) * 100
    }

    ///两个表格的选项
    let tab1 = {
        "type": "table",
        "title": "账户信息",
        "cols": ["初始资金", "钱包余额", "保证金余额", "划转到现货", "全部未实现盈亏", "杠杆倍数", "全部净利润", "总收益率"],
        "rows": []
    }
    let tabc = {
        "type": "table",
        "title": "交易对信息",
        "cols": ["币种名称", "持仓方向", "持仓数量", "持仓价值(U)", "持仓成本价", "持仓未实现盈亏(U)", "爆仓价格", "补仓次数", "太极磨损", "手动平仓", "操作"],
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
        "cols": ["联系方式", "交流群"],
        "rows": []
    }
    let tab5 = {
        "type": "table",
        "title": "停止运行币种",
        "cols": ["币种", "原因"],
        "rows": []
    }

    let jieshao1 = '微信:wkc19891 [添加备注FMZ]'
    let jieshao2 = '策略稳定测试中，可免费试用7天'
    let toxh = _G('ToXh') == null ? 0 : _G('ToXh');
    //往表格里加内容
    tab1["rows"].push([`${_N(parseFloat(init_Balance), 6)}U`, `${_N(parseFloat(walletbalance), 6)}U`, `${_N(parseFloat(totalMarginBalance), 6)}U`, `${toxh}U`, `${_N(parseFloat(unrealizedProfit), 6)}U`, `${M}`, `${pft}U`, `${_N(profit_ratio, 6)}%`])
    tab2["rows"].push([`${FSTTime}`, `${NOWTime}`])
    tab4["rows"].push([`${jieshao1}`, `${jieshao2}`])
    ir = 0
    for (var i = 0; i < exchanges.length; i++) {
        ir = i
        exchanges[ir].SetContractType('swap')
        let _position1 = _C(exchanges[i].GetPosition)
        let position = []
        let sPos = "";
        let lPos = "";
        for (let i = 0; i < _position1.length; i++) {
            let v = _position1[i];
            if (v.Type == 0) {
                lPos = v;
            }
            if (v.Type == 1) {
                sPos = v;
            }
        }
        if (lPos != "") {
            position.push(lPos)
        }
        if (sPos != "") {
            position.push(sPos)
        }
        let currency = _C(exchanges[i].GetCurrency)
        let ticker = _C(exchanges[i].GetTicker)
        let ctVal = 1;
        if (isOk) {
            ctVal = GetCtVal(currency);
        }
        let amount = '无持仓'
        let value = '无持仓'
        let price = '无持仓'
        let pft = '无持仓'
        let direction = '无'
        let baocang = 0;
        let bucang = 0;
        let taiji = 0;
        if (position.length > 0) {
            if (isOk) {
                baocang = _N(Number(position[0]["Info"]["liqPx"]), 2)
            }
            if (isBinance) {
                baocang = _N(parseFloat(position[0]["Info"]["liquidationPrice"]), 2)
            }
        }
        if (position.length == 1) {
            //仅仅持有多单
            if (position[0]["Type"] == 0) {
                amount = position[0].Amount * ctVal
                value = _N(amount * ticker.Last, 6)  //多单
                price = _N(position[0].Price, 6) //多单成本价格
                pft = _N(position[0].Profit, 6) //多单未实现盈亏
                direction = '多#00FF00'
                bucang = longAddCount[ir]
                taiji = lSubP[ir]
            }
            //仅仅持有空单
            if (position[0]["Type"] == 1) {
                amount = position[0].Amount * ctVal;
                value = _N(parseFloat(amount * ticker.Last), 6)
                price = _N(position[0].Price, 6)
                pft = _N(position[0].Profit, 6)
                direction = '空#FF0000'
                bucang = shortAddCount[ir]
                taiji = sSubP[ir]
            }
            button0[i] = { "type": "button", "name": "平仓后停止开仓", "cmd": `${i}:0`, "description": "停止策略监听" }
            let button1 = { "type": "button", "name": "平仓", "cmd": `${i}:平仓:${position[0]["Type"]}:${position[0].Amount}`, "description": "平仓" }
            tabc["rows"].push([currency, direction, amount, `${value}U`, price, `${pft}U`, baocang, bucang, taiji, button1, button0[i]])
        }
        if (position.length == 2) {
            amount = position[0].Amount * ctVal;
            value = Math.round(amount * ticker.Last, 6)  //多单
            price = _N(position[0].Price, 6) //多单成本价格
            pft = _N(position[0].Profit, 6) //多单未实现盈亏
            direction = '多#00FF00'
            amount2 = position[1].Amount * ctVal;
            value2 = _N(parseFloat(amount2 * ticker.Last), 6)  //多单持仓数量
            price2 = _N(position[1].Price, 6) //多单成本价格
            pft2 = _N(position[1].Profit, 6) //多单未实现盈亏
            direction2 = '空#FF0000'
            let bucang1 = longAddCount[ir]
            let bucang2 = shortAddCount[ir]
            let taiji1 = _N(lSubP[ir], 4)
            let taiji2 = _N(sSubP[ir], 4)
            button0[i] = { "type": "button", "name": "平仓后停止开仓", "cmd": `${i}:0`, "description": "停止策略监听" }
            let button1_l = { "type": "button", "name": "平仓", "cmd": `${i}:平仓:${position[0]["Type"]}:${position[0].Amount}`, "description": "平多仓" }
            let button1_s = { "type": "button", "name": "平仓", "cmd": `${i}:平仓:${position[1]["Type"]}:${position[1].Amount}`, "description": "平空仓" }
            tabc["rows"].push([currency, direction, amount, `${value}U`, price, `${pft}U`, baocang, bucang1, taiji1, button1_l, button0[i]])
            tabc["rows"].push([currency, direction2, amount2, `${value2}U`, price2, `${pft2}U`, baocang, bucang2, taiji2, button1_s, button0[i]])
        }
        Sleep(200)
    }
    for (let i = 0; i < stoplist.length; i++) {
        let e = stoplist[i];
        tab5["rows"].push([e.coin, `${e.msg}#FF0000`])
    }
    //打印广告栏
    LogStatus("`" + JSON.stringify(tab2) + "`\n" + "`" + JSON.stringify([tab5]) + "`\n" + "`" + JSON.stringify(tab1) + "`\n" + "`" + JSON.stringify(tabc) + "`\n" + "`" + JSON.stringify(tab4) + "`")
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
    for (var i = 0; i < exchanges.length; i++) {
        exchanges[i].SetContractType("swap")
        let _position1 = _C(exchanges[i].GetPosition)
        let position1 = []
        let sPos = "";
        let lPos = "";
        for (let i = 0; i < _position1.length; i++) {
            let v = _position1[i];
            if (v.Type == 0) {
                lPos = v;
            }
            if (v.Type == 1) {
                sPos = v;
            }
        }
        if (lPos != "") {
            position1.push(lPos)
        }
        if (sPos != "") {
            position1.push(sPos)
        }
        if (position1.length == 1) {
            if (position1[0]["Type"] == 0) {
                exchanges[i].SetDirection("closebuy")
                exchanges[i].Sell(-1, position1[0].Amount)
            }
            if (position1[0]["Type"] == 1) {
                exchanges[i].SetDirection("closesell")
                exchanges[i].Buy(-1, position1[0].Amount)
            }
        }
        if (position1.length == 2) {
            exchanges[i].SetDirection("closebuy")
            exchanges[i].Sell(-1, position1[0].Amount)
            exchanges[i].SetDirection("closesell")
            exchanges[i].Buy(-1, position1[1].Amount)
        }
    }
    _G(null)
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
//
function GetSelfPos(e) {
    let _position1 = _C(e.GetPosition)
    position1 = [];
    let sPos = "";
    let lPos = "";
    for (let i = 0; i < _position1.length; i++) {
        let v = _position1[i];
        if (v.Type == 0) {
            lPos = v;
        }
        if (v.Type == 1) {
            sPos = v;
        }

    }
    if (lPos != "") {
        position1.push(lPos)
    }
    if (sPos != "") {
        position1.push(sPos)
    }
    return position1;
}
//
function GetSelfOrder(e, id) {
    let order = e.GetOrder(id);
    let i = 0;
    while (order["AvgPrice"] == 0) {
        order = e.GetOrder(id);
        i++;
        if (i > 3) {
            break;
        }
        Sleep(200);
    }
    return order;
}
//trade
function trade() {
    exchanges[ir].SetContractType('swap')
    let currency = _C(exchanges[ir].GetCurrency)
    let _stopList = [];
    stoplist.map((v, i) => _stopList.push(v.coin))
    if (_stopList.indexOf(currency) < 0) {
        exchanges[ir].SetMarginLevel(M)
        GetSelfPos(exchanges[ir])
        let ticker1 = _C(exchanges[ir].GetTicker)
        let ctVal = 1;
        if (isOk) {
            ctVal = GetCtVal(currency)
        }
        let r1 = exchanges[ir].GetRecords(PERIOD_M1)
        Sleep(100)
        let r2 = exchanges[ir].GetRecords(PERIOD_M15)
        // Sleep(100)
        // let r3 = exchanges[ir].GetRecords(PERIOD_H1)
        let MACD1 = TA.MACD(r1, 12, 26, 9)
        let MACD2 = TA.MACD(r2, 12, 26, 9)
        // let MACD3 = TA.MACD(r3, 12, 26, 9)
        let UP1 = MACD2[2][MACD2[2].length - 1] > 0;
        let DOWN1 = MACD2[2][MACD2[2].length - 1] <= 0;
        let long1 = MACD1[2][MACD1[2].length - 2] <= 0 && MACD1[2][MACD1[2].length - 1] > 0; //1分钟金叉
        let short1 = MACD1[2][MACD1[2].length - 2] > 0 && MACD1[2][MACD1[2].length - 1] <= 0;//1分钟死叉
        // let long2 = MACD3[2][MACD3[2].length - 1] > 0;
        // let short2 = MACD3[2][MACD3[2].length - 1] <= 0;
        // let long3 = MACD1[2][MACD1[2].length - 1] > 0;
        // let short3 = MACD1[2][MACD1[2].length - 1] <= 0;
        //止损
        if (Zs) {
            if (position1.length == 2) {
                if (ZsLong != 0 && position1[0].Profit < -ZsLong && longAddCount[ir] >= maxLAC) {
                    exchanges[ir].SetDirection('closebuy')
                    exchanges[ir].Sell(-1, position1[0].Amount)
                    list1[ir] = 0
                    _G('list1', list1)
                    longAddCount[ic] = 0;
                    _G('longAddCount', longAddCount)
                    lSubP[ir] = 0;
                    _G('lSubP', lSubP);
                    Log(currency, '多单止损 卖出平多 清仓')
                    LogProfit(pft)
                }
                if (ZsShort != 0 && position1[1].Profit < -ZsShort && shortAddCount[ir] >= maxSAC) {
                    exchanges[ir].SetDirection('closesell')
                    exchanges[ir].Buy(-1, position1[1].Amount)
                    list2[ir] = 0
                    _G('list2', list2)
                    shortAddCount[ir] = 0;
                    _G('shortAddCount', shortAddCount)
                    sSubP[ir] = 0;
                    _G('sSubP', sSubP);
                    Log(currency, '空单止损 买入平空 清仓')
                    LogProfit(pft)
                }
            }
            if (position1.length == 1) {
                if (ZsLong != 0 && position1[0].Type == 0) {
                    if (position1[0].Profit < -ZsLong && longAddCount[ir] >= maxLAC) {
                        exchanges[ir].SetDirection('closebuy')
                        exchanges[ir].Sell(-1, position1[0].Amount)
                        list1[ir] = 0
                        _G('list1', list1)
                        longAddCount[ic] = 0;
                        _G('longAddCount', longAddCount)
                        lSubP[ir] = 0;
                        _G('lSubP', lSubP);
                        Log(currency, '多单止损 卖出平多 清仓')
                        LogProfit(pft)
                    }
                }
                if (ZsShort != 0 && position1[0].Type == 1) {
                    if (position1[0].Profit < -ZsShort && shortAddCount[ir] >= maxSAC) {
                        exchanges[ir].SetDirection('closesell')
                        exchanges[ir].Buy(-1, position1[0].Amount)
                        list2[ir] = 0
                        _G('list2', list2)
                        shortAddCount[ir] = 0;
                        _G('shortAddCount', shortAddCount)
                        sSubP[ir] = 0;
                        _G('sSubP', sSubP);
                        Log(currency, '空单止损 买入平空 清仓')
                        LogProfit(pft)
                    }
                }
            }
        }
        //解套
        if (Jt) {
            if (position1.length == 1) {
                let haveAmount = _N(position1[0].Amount / 4, 0);
                haveAmount = haveAmount < 1 ? 1 : haveAmount;
                let subProfit = position1[0].Profit * haveAmount / position1[0].Amount;
                //
                if (position1[0].Type == 0) {
                    if (ticker1.Last < (1 - 0.01 * Tj) * list1[ir]) {
                        let jtA1 = JtAmount - lSubP[ir];
                        if (position1[0].Profit < -jtA1 && longAddCount[ir] >= 3) {
                            //加仓&减仓&记录减去收益
                            exchanges[ir].SetDirection('closebuy')
                            exchanges[ir].Sell(-1, haveAmount)
                            Sleep(100)
                            exchanges[ir].SetDirection('buy')
                            let id1 = exchanges[ir].Buy(-1, haveAmount)
                            let order = GetSelfOrder(exchanges[ir], id1);
                            list1[ir] = order["AvgPrice"]
                            _G('list1', list1)
                            lSubP[ir] = lSubP[ir] + subProfit;
                            _G('lSubP', lSubP);
                            Log(`${currency},太极解套,多单磨损1,磨损价位:${list1[ir]},磨损:${subProfit}U,累计磨损:${lSubP[ir]}U`)
                            exchanges[ir].SetDirection('sell')
                            let id2 = exchanges[ir].Sell(-1, haveAmount)
                            Log(`${currency},太极对冲,空单压制1`)
                            let order1 = GetSelfOrder(exchanges[ir], id2);
                            list2[ir] = order1["AvgPrice"]
                            _G('list2', list2)
                        }
                    }
                }
                if (position1[0].Type == 1) {
                    if (ticker1.Last > (1 + 0.01 * Tj) * list2[ir]) {
                        let jtA2 = JtAmount - sSubP[ir];
                        if (position1[0].Profit < -jtA2 && shortAddCount[ir] >= 3) {
                            //加仓&减仓&记录减去收益
                            exchanges[ir].SetDirection('closesell')
                            exchanges[ir].Buy(-1, haveAmount)
                            Sleep(100)
                            exchanges[ir].SetDirection('sell')
                            let id1 = exchanges[ir].Sell(-1, haveAmount)
                            let order = GetSelfOrder(exchanges[ir], id1);
                            list2[ir] = order["AvgPrice"]
                            _G('list2', list2)
                            sSubP[ir] = sSubP[ir] + subProfit;
                            _G('sSubP', sSubP);
                            Log(`${currency},太极解套,空单磨损1,磨损价位:${list2[ir]},磨损:${subProfit}U,累计磨损:${sSubP[ir]}U`)
                            exchanges[ir].SetDirection('buy')
                            let id2 = exchanges[ir].Buy(-1, haveAmount)
                            Log(`${currency},太极对冲,多单压制1`)
                            let order1 = GetSelfOrder(exchanges[ir], id2);
                            list1[ir] = order1["AvgPrice"]
                            _G('list1', list1)
                        }
                    }
                }
            }
            if (position1.length == 2) {
                //多单
                if (ticker1.Last < (1 - 0.01 * Tj) * list1[ir]) {
                    let jtA1 = JtAmount - lSubP[ir];
                    if (position1[0].Profit < -jtA1 && longAddCount[ir] >= 3) {
                        let haveAmount = _N(position1[0].Amount / 4, 0);
                        haveAmount = haveAmount < 1 ? 1 : haveAmount;
                        let lSubProfit = position1[0].Profit * haveAmount / position1[0].Amount;
                        //加仓&减仓&记录减去收益
                        exchanges[ir].SetDirection('closebuy')
                        exchanges[ir].Sell(-1, haveAmount)
                        Sleep(100)
                        exchanges[ir].SetDirection('buy')
                        let id1 = exchanges[ir].Buy(-1, haveAmount)
                        let order = GetSelfOrder(exchanges[ir], id1);
                        list1[ir] = order["AvgPrice"]
                        _G('list1', list1)
                        lSubP[ir] = lSubP[ir] + lSubProfit;
                        _G('lSubP', lSubP);
                        Log(`${currency},太极解套,多单磨损2,磨损价位:${list1[ir]},磨损:${lSubProfit}U,累计磨损:${lSubP[ir]}U`)
                    }
                }
                //空单
                if (ticker1.Last > (1 + 0.01 * Tj) * list2[ir]) {
                    let jtA2 = JtAmount - sSubP[ir];
                    if (position1[1].Profit < -jtA2 && shortAddCount[ir] >= 3) {
                        let haveAmount = _N(position1[1].Amount / 4, 0);
                        haveAmount = haveAmount < 1 ? 1 : haveAmount;
                        let sSubProfit = position1[1].Profit * haveAmount / position1[1].Amount;
                        //加仓&减仓&记录减去收益
                        exchanges[ir].SetDirection('closesell')
                        exchanges[ir].Buy(-1, haveAmount)
                        Sleep(100)
                        exchanges[ir].SetDirection('sell')
                        let id1 = exchanges[ir].Sell(-1, haveAmount)
                        let order = GetSelfOrder(exchanges[ir], id1);
                        list2[ir] = order["AvgPrice"]
                        _G('list2', list2)
                        sSubP[ir] = sSubP[ir] + sSubProfit;
                        _G('sSubP', sSubP);
                        Log(`${currency},太极解套,空单磨损1,磨损价位:${list2[ir]},磨损:${sSubProfit}U,累计磨损:${sSubP[ir]}U`)
                    }
                }
            }
        }
        //大周期上升
        if (UP1) {
            if (position1.length == 0) {
                //1分钟金叉开多
                if (long1) {
                    exchanges[ir].SetDirection('buy')
                    let id0 = exchanges[ir].Buy(-1, (acc[ir] * lsRate))
                    let order = GetSelfOrder(exchanges[ir], id0);
                    list1[ir] = order["AvgPrice"]
                    _G('list1', list1)
                    Log(currency, '进场开多,首单进场价格1:', list1[ir])
                    LogProfit(pft)
                    GetSelfPos(exchanges[ir])
                }
            }
            if (position1.length > 0) {
                // 只持有1单
                if (position1.length == 1) {
                    // 只持有多单
                    if (position1[0].Type == 0) {
                        if ((position1[0].Profit + lSubP[ir]) > 0.01 * Z * ticker1.Last * position1[0].Amount * ctVal) {
                            GetSelfPos(exchanges[ir])
                            listpft[ir].push(position1[0].Profit)
                            _G('listpft', listpft)
                            let maxpft = Math.max(...listpft[ir])
                            if (position1[0].Profit < (1 - 0.01 * K4) * maxpft) {
                                exchanges[ir].SetDirection('closebuy')
                                exchanges[ir].Sell(-1, position1[0].Amount)
                                Log(currency, '多单利润回撤达到1:', K4, '%,平多止盈')
                                LogProfit(pft)
                                listpft[ir] = []
                                _G('listpft', listpft)
                                longAddCount[ir] = 0;
                                _G('longAddCount', longAddCount);
                                list1[ir] = 0
                                _G('list1', list1)
                                lSubP[ir] = 0;
                                _G('lSubP', lSubP);
                                return true;
                            }
                        }
                        //金叉给多单补仓
                        if (position1[0].Profit < 0 && longAddCount[ir] <= maxLAC) {
                            if (ticker1.Last < (1 - 0.01 * E) * list1[ir]) {
                                GetSelfPos(exchanges[ir])
                                listpft[ir].push(position1[0].Profit)
                                _G('listpft', listpft)
                                let maxpft = Math.min(...listpft[ir])
                                if (position1[0].Profit > (1 - 0.01 * HcK4) * maxpft) {
                                    exchanges[ir].SetDirection('buy')
                                    let id0 = exchanges[ir].Buy(-1, (acc[ir] * lsRate))
                                    let order = GetSelfOrder(exchanges[ir], id0);
                                    list1[ir] = order["AvgPrice"]
                                    _G('list1', list1)
                                    longAddCount[ir] = longAddCount[ir] + 1;
                                    _G('longAddCount', longAddCount);
                                    Log(`${currency},小周期[金叉]满足补仓信号, 浮亏回调${HcK4}%,多单补仓,补仓价格:${list1[ir]},补仓次数:${longAddCount[ir]}`)
                                    LogProfit(pft)
                                }
                            }
                        }
                    }
                    //只持有空单
                    if (position1[0].Type == 1) {
                        //1分钟金叉开多
                        if (long1) {
                            exchanges[ir].SetDirection('buy')
                            let id0 = exchanges[ir].Buy(-1, acc[ir])
                            let order = GetSelfOrder(exchanges[ir], id0);
                            list1[ir] = order["AvgPrice"]
                            _G('list1', list1)
                            Log(currency, '进场开多,首单进场价格2:', list1[ir])
                            LogProfit(pft);
                            return true;
                        }
                        if ((position1[0].Profit + sSubP[ir]) > 0.01 * E * ticker1.Last * position1[0].Amount * ctVal) {
                            exchanges[ir].SetDirection('closesell')
                            exchanges[ir].Buy(-1, position1[0].Amount)
                            list2[ir] = 0
                            _G('list2', list2)
                            shortAddCount[ir] = 0;
                            _G('shortAddCount', shortAddCount);
                            sSubP[ir] = 0;
                            _G('sSubP', sSubP);
                            Log(currency, '空单盈利,平空止盈1')
                            LogProfit(pft);
                        }
                    }
                }
                if (position1.length == 2) {
                    //多单模块
                    if ((position1[0].Profit + lSubP[ir]) > 0.01 * Z * ticker1.Last * position1[0].Amount * ctVal) {
                        GetSelfPos(exchanges[ir])
                        listpft[ir].push(position1[0].Profit)
                        _G('listpft', listpft)
                        let maxpft = Math.max(...listpft[ir])
                        if (position1[0].Profit < (1 - 0.01 * K4) * maxpft) {
                            exchanges[ir].SetDirection('closebuy')
                            exchanges[ir].Sell(-1, position1[0].Amount)
                            Log(currency, '多单利润回撤达到2:', K4, '%,平多止盈')
                            LogProfit(pft)
                            listpft[ir] = []
                            _G('listpft', listpft)
                            longAddCount[ir] = 0;
                            _G('longAddCount', longAddCount);
                            lSubP[ir] = 0;
                            _G('lSubP', lSubP);
                            list1[ir] = 0
                            _G('list1', list1)
                            return true;
                        }
                    }
                    //金叉给多单补仓
                    if (position1[0].Profit < 0 && longAddCount[ir] <= maxLAC) {
                        if (ticker1.Last < (1 - 0.01 * E) * list1[ir]) {
                            GetSelfPos(exchanges[ir])
                            listpft[ir].push(position1[0].Profit)
                            _G('listpft', listpft)
                            let maxpft = Math.min(...listpft[ir])
                            if (position1[0].Profit > (1 - 0.01 * HcK4) * maxpft) {
                                exchanges[ir].SetDirection('buy')
                                let id0 = exchanges[ir].Buy(-1, (acc[ir] * lsRate))
                                let order = GetSelfOrder(exchanges[ir], id0);
                                list1[ir] = order["AvgPrice"]
                                _G('list1', list1)
                                longAddCount[ir] = _N(parseFloat(longAddCount[ir]), 0) + 1;
                                _G('longAddCount', longAddCount);
                                Log(`${currency},小周期[金叉]满足补仓信号, 浮亏回调${HcK4}%,多单补仓,补仓价格:${list1[ir]},补仓次数:${longAddCount[ir]}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    if ((position1[1].Profit + sSubP[ir]) > 0.01 * E * ticker1.Last * position1[1].Amount * ctVal) {
                        exchanges[ir].SetDirection('closesell')
                        exchanges[ir].Buy(-1, position1[1].Amount)
                        list2[ir] = 0
                        _G('list2', list2)
                        shortAddCount[ir] = 0;
                        _G('shortAddCount', shortAddCount);
                        sSubP[ir] = 0
                        _G('sSubP', sSubP);
                        Log(currency, '空单盈利,平空止盈2')
                        LogProfit(pft)
                    }
                }
            }
        }
        //大周期下降
        if (DOWN1) {
            if (position1.length == 0) {
                //1分钟死叉开空
                if (short1) {
                    exchanges[ir].SetDirection('sell')
                    let id0 = exchanges[ir].Sell(-1, acc[ir])
                    let order = GetSelfOrder(exchanges[ir], id0);
                    list2[ir] = order["AvgPrice"]
                    _G('list2', list2)
                    Log(currency, '进场开空,首单进场价格1:', list2[ir])
                    LogProfit(pft)
                    GetSelfPos(exchanges[ir])
                }
            }
            if (position1.length > 0) {
                // 只持有1单
                if (position1.length == 1) {
                    // 只持有空
                    if (position1[0].Type == 1) {
                        if ((position1[0].Profit + sSubP[ir]) > 0.01 * Z * ticker1.Last * position1[0].Amount * ctVal) {
                            GetSelfPos(exchanges[ir])
                            listpft2[ir].push(position1[0].Profit)
                            _G('listpft2', listpft2)
                            let maxpft2 = Math.max(...listpft2[ir])
                            if (position1[0].Profit < (1 - 0.01 * K4) * maxpft2) {
                                exchanges[ir].SetDirection('closesell')
                                exchanges[ir].Buy(-1, position1[0].Amount)
                                Log(currency, '空单利润回撤达到:', K4, '%,平空止盈')
                                LogProfit(pft)
                                listpft2[ir] = []
                                _G('listpft2', listpft2)
                                shortAddCount[ir] = 0;
                                _G('shortAddCount', shortAddCount);
                                sSubP[ir] = 0;
                                _G('sSubP', sSubP);
                                list2[ir] = 0
                                _G('list2', list2)
                                return true;
                            }
                        }
                        let sCount = shortAddCount[ir];
                        //死叉给空单补仓
                        if (position1[0].Profit < 0 && sCount <= maxSAC) {
                            if (ticker1.Last > (1 + 0.01 * E) * list2[ir]) {
                                GetSelfPos(exchanges[ir])
                                listpft2[ir].push(position1[0].Profit)
                                _G('listpft2', listpft2)
                                let maxpft2 = Math.min(...listpft2[ir])
                                if (position1[0].Profit > (1 - 0.01 * HcK4) * maxpft2) {
                                    exchanges[ir].SetDirection('sell')
                                    let id0 = exchanges[ir].Sell(-1, acc[ir])
                                    let order = GetSelfOrder(exchanges[ir], id0);
                                    list2[ir] = order["AvgPrice"]
                                    _G('list2', list2)
                                    shortAddCount[ir] = sCount + 1;
                                    _G('shortAddCount', shortAddCount);
                                    Log(`${currency},小周期[死叉]满足补仓信号1,浮亏回调${HcK4}%,空单补仓,补仓价格:${list2[ir]},补仓次数:${shortAddCount[ir]}`)
                                    LogProfit(pft)
                                }
                            }
                        }
                    }
                    //只持有多单
                    if (position1[0].Type == 0) {
                        //1分钟死叉开空
                        if (short1) {
                            exchanges[ir].SetDirection('sell')
                            let id0 = exchanges[ir].Sell(-1, acc[ir])
                            let order = GetSelfOrder(exchanges[ir], id0);
                            list2[ir] = order["AvgPrice"]
                            _G('list2', list2)
                            Log(currency, '进场开空,首单进场价格2:', list2[ir])
                            LogProfit(pft)
                            return true;
                        }
                        if ((position1[0].Profit + lSubP[ir]) > 0.01 * E * ticker1.Last * position1[0].Amount * ctVal) {
                            exchanges[ir].SetDirection('closebuy')
                            exchanges[ir].Sell(-1, position1[0].Amount)
                            list1[ir] = 0
                            _G('list1', list1)
                            longAddCount[ir] = 0;
                            _G('longAddCount', longAddCount);
                            lSubP[ir] = 0;
                            _G('lSubP', lSubP);
                            Log(currency, `多单盈利,平多止盈1`)
                            LogProfit(pft)
                        }
                    }
                }
                if (position1.length == 2) {
                    //空单模块
                    if ((position1[1].Profit + sSubP[ir]) > 0.01 * Z * ticker1.Last * position1[1].Amount * ctVal) {
                        GetSelfPos(exchanges[ir])
                        listpft2[ir].push(position1[1].Profit)
                        _G('listpft2', listpft2)
                        let maxpft2 = Math.max(...listpft2[ir])
                        if (position1[1].Profit < (1 - 0.01 * K4) * maxpft2) {
                            exchanges[ir].SetDirection('closesell')
                            exchanges[ir].Buy(-1, position1[1].Amount)
                            Log(currency, '空单利润回撤达到:', K4, '%,平空止盈')
                            LogProfit(pft)
                            listpft2[ir] = []
                            _G('listpft2', listpft2)
                            shortAddCount[ir] = 0;
                            _G('shortAddCount', shortAddCount);
                            sSubP[ir] = 0;
                            _G('sSubP', sSubP);
                            list2[ir] = 0
                            _G('list2', list2)
                            return true;
                        }
                    }
                    //死叉给空单补仓
                    let sCount = shortAddCount[ir];
                    if (position1[1].Profit < 0 && sCount <= maxSAC) {
                        if (ticker1.Last > (1 + 0.01 * E) * list2[ir]) {
                            GetSelfPos(exchanges[ir])
                            listpft2[ir].push(position1[1].Profit)
                            _G('listpft2', listpft2)
                            let maxpft2 = Math.min(...listpft2[ir])
                            if (position1[1].Profit > (1 - 0.01 * HcK4) * maxpft2) {
                                exchanges[ir].SetDirection('sell')
                                let id0 = exchanges[ir].Sell(-1, acc[ir])
                                let order = GetSelfOrder(exchanges[ir], id0);
                                list2[ir] = order["AvgPrice"]
                                _G('list2', list2)
                                shortAddCount[ir] = sCount + 1;
                                _G('shortAddCount', shortAddCount);
                                Log(`${currency},小周期[死叉]满足补仓信号,浮亏回调${HcK4}%,空单补仓,补仓价格:${list2[ir]},补仓次数:${shortAddCount[ir]}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    if ((position1[0].Profit + lSubP[ir]) > 0.01 * E * ticker1.Last * position1[0].Amount * ctVal) {
                        exchanges[ir].SetDirection('closebuy')
                        exchanges[ir].Sell(-1, position1[0].Amount)
                        list1[ir] = 0
                        _G('list1', list1)
                        longAddCount[ir] = 0;
                        _G('longAddCount', longAddCount);
                        lSubP[ir] = 0;
                        _G('lSubP', lSubP);
                        Log(currency, `多单盈利,平多止盈2`)
                        LogProfit(pft)
                    }
                }
            }
        }
    }
}
function mainBefor() {
    exchange.SetContractType("swap");
    account1 = exchange.GetAccount();
    if (isOk) {
        let exchangeInfo = exchange.IO("api", "GET", "/api/v5/public/instruments?instType=SWAP");
        SymbolsEx = exchangeInfo.data;
    }
    if (isBinance) {
        let exchangeInfo = exchange.IO("api", "GET", `/fapi/v1/exchangeInfo`, ``, ``)
        SymbolsEx = exchangeInfo.symbols;
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
            init_Balance = account1.Balance;
        }
        FSTTime = _D()
        _G('init_Balance', init_Balance)
        _G('FSTTime', FSTTime)
    }
    if (_G('lSubP') && _G('sSubP') && _G('acc') && _G('listpft') && _G('listpft2') && _G('list1') && _G('list2') && _G('mlist') && _G('longAddCount') && _G('shortAddCount')) {
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
        _G('longAddCount', longAddCount)
        _G('shortAddCount', shortAddCount)
        _G('list1', list1)
        _G('list2', list2)
        _G('mlist', mlist)
        _G('lSubP', lSubP)
        _G('sSubP', sSubP)
    }
    for (var i = 0; i < exchanges.length; i++) {
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

function main() {
    let eName = exchange.GetName();
    isOk = eName.indexOf("OKCoin") != -1;
    isBinance = eName.indexOf("Binance") != -1;
    if (isBinance) {
        var ret = exchange.IO("api", "GET", "/fapi/v1/positionSide/dual")
        if (!ret.dualSidePosition) {
            var ret1 = exchange.IO("api", "POST", "/fapi/v1/positionSide/dual", "dualSidePosition=true")
            Log(ret1)
        }
    }
    let exlength = _G('exlength')
    if (exlength == null) {
        _G('exlength', exchanges.length)
    } else {
        if (exchanges.length != exlength) {
            _G('acc', null)
            _G('exlength', exchanges.length)
            Log(`exchanges changed...`)
        }
    }
    for (var i = 0; i < exchanges.length; i++) {
        button0.push(0)
    }
    mainBefor()
    while (true) {
        try {
            let minutes = new Date().getMinutes();
            let seconds = new Date().getSeconds();
            if (minutes % 5 == 0) {
                if (seconds % 15 == 0) {
                    if (isOk) {
                        let exchangeInfo = exchange.IO("api", "GET", "/api/v5/public/instruments?instType=SWAP");
                        SymbolsEx = exchangeInfo.data;
                    }
                    if (isBinance) {
                        let exchangeInfo = exchange.IO("api", "GET", `/fapi/v1/exchangeInfo`, ``, ``)
                        SymbolsEx = exchangeInfo.symbols;
                    }
                }
            }
            table()
            for (var i = 0; i < exchanges.length; i++) {
                ir = i;
                trade()
                Sleep(S)
            }
            if (init_Balance + pft + unrealizedProfit > mlist) {
                Log('盈利达到设定值,全部清仓')
                Coverall()
                if (isOk) {
                    mlist += T1
                }
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

                _G('mlist', mlist)
                Log('下次阀值更新为:', mlist)
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
                    currency = exchanges[a].GetCurrency()
                    let data = { coin: currency, amount: n1, msg: '手动停止' }
                    stoplist.push(data)
                    Log('当前停止的币对:', currency)
                }
                if (arr[1] == '平仓') {
                    let ic = Number(arr[0]);
                    let amount = Number(arr[3]);
                    exchanges[ic].SetContractType("swap")
                    if (arr[2] == '0') {
                        exchanges[ic].SetDirection("closebuy")
                        exchanges[ic].Sell(-1, amount)
                        longAddCount[ic] = 0;
                        _G('longAddCount', longAddCount)
                        lSubP[ir] = 0;
                        _G('lSubP', lSubP);
                        list1[ic] = 0
                        _G('list1', list1)
                    }
                    if (arr[2] == '1') {
                        exchanges[ic].SetDirection("closesell")
                        exchanges[ic].Buy(-1, amount)
                        shortAddCount[ic] = 0;
                        _G('shortAddCount', shortAddCount)
                        sSubP[ir] = 0;
                        _G('sSubP', sSubP);
                        list2[ic] = 0
                        _G('list2', list2)
                    }
                    LogProfit(pft)
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
        } catch (e) {
            Log('系统error', e);
        }
        Sleep(S)
    }
}