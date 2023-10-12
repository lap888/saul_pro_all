/*
 * @Author: top.brids 
 * @Date: 2021-12-08 14:09:47 
 * @Last Modified by: top.brids
 * @Last Modified time: 2021-12-18 00:54:27
 */
//1
let SymbolsEx = [];
let button0 = [];
let button1 = [];
let button2 = [];
let stoplist = [];
let listpft = [];
let listpft2 = [];
let acc = null;
let list1 = [];
let list2 = [];
let longAddCount = [];
let shortAddCount = [];
let longSubP = [];
let shortSubP = [];
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
let mrate = E + 0.118;
let maxAddCount = 9;
let lsRate = 1;
let UpDownRates = [];
let VixRates = [];
let LastBarTime = 0
let LastNbar = {}
let CurrentSymbol = "";

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
function accuracy() {
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
    totalMarginBalance = account1.Info.data[0].details[0].cashBal;
    walletbalance = account1.Info.data[0].details[0].disEq;
    unrealizedProfit = account1.Info.data[0].details[0].upl;

    pft = _N((parseFloat(totalMarginBalance) - parseFloat(init_Balance)), 6);
    //table2内容, USDT
    let NOWTime = _D() //当前时间
    let profit_ratio = 0
    if (init_Balance != 0) {
        profit_ratio = ((parseFloat(totalMarginBalance) - parseFloat(init_Balance)) / parseFloat(init_Balance)) * 100
    }

    ///两个表格的选项
    let tab1 = {
        "type": "table",
        "title": "账户信息",
        "cols": ["初始资金", "钱包余额", "保证金余额", "全部未实现盈亏", "杠杆倍数", "全部净利润", "总收益率"],
        "rows": []
    }
    let tabc = {
        "type": "table",
        "title": "交易对信息",
        "cols": ["币种名称", "持仓方向", "持仓数量", "持仓价值(U)", "持仓成本价", "持仓未实现盈亏(U)", "爆仓价格", '补仓次数', "手动平仓", "操作"],
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

    let jieshao1 = '微信：wkc19891 [添加备注FMZ]'
    let jieshao2 = '策略稳定测试中，可免费试用7天'
    //往表格里加内容
    tab1["rows"].push([`${_N(parseFloat(init_Balance), 6)}U`, `${_N(parseFloat(walletbalance), 6)}U`, `${_N(parseFloat(totalMarginBalance), 6)}U`, `${_N(parseFloat(unrealizedProfit), 6)}U`, `${M}`, `${pft}U`, `${_N(profit_ratio, 6)}%`])
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
        let ctVal = GetCtVal(currency);
        let amount = '无持仓'
        let value = '无持仓'
        let price = '无持仓'
        let pft = '无持仓'
        let direction = '无'
        let baocang = 0;
        let bucang = 0;
        if (position.length > 0) {
            baocang = _N(Number(position[0]["Info"]["liqPx"]), 2)
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
            }
            //仅仅持有空单
            if (position[0]["Type"] == 1) {
                amount = position[0].Amount * ctVal;
                value = _N(parseFloat(amount * ticker.Last), 6)
                price = _N(position[0].Price, 6)
                pft = _N(position[0].Profit, 6)
                direction = '空#FF0000'
                bucang = shortAddCount[ir]
            }
            button0[i] = { "type": "button", "name": "平仓后停止开仓", "cmd": `${i}:0`, "description": "停止策略监听" }
            let button1 = { "type": "button", "name": "平仓", "cmd": `${i}:平仓:${position[0]["Type"]}:${position[0].Amount}`, "description": "平仓" }
            tabc["rows"].push([currency, direction, amount, `${value}U`, price, `${pft}U`, baocang, bucang, button1, button0[i]])
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
            button0[i] = { "type": "button", "name": "平仓后停止开仓", "cmd": `${i}:0`, "description": "停止策略监听" }
            let button1_l = { "type": "button", "name": "平仓", "cmd": `${i}:平仓:${position[0]["Type"]}:${position[0].Amount}`, "description": "平多仓" }
            let button1_s = { "type": "button", "name": "平仓", "cmd": `${i}:平仓:${position[1]["Type"]}:${position[1].Amount}`, "description": "平空仓" }
            tabc["rows"].push([currency, direction, amount, `${value}U`, price, `${pft}U`, baocang, bucang1, button1_l, button0[i]])
            tabc["rows"].push([currency, direction2, amount2, `${value2}U`, price2, `${pft2}U`, baocang, bucang2, button1_s, button0[i]])
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
    walletbalance = account1.Info.data[0].details[0].cashBal;
    unrealizedProfit = account1.Info.data[0].details[0].upl;
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
//获取小数点后位数
function GetStringDotAfterLenth(str) {
    let a1 = str.toString()
    let a2 = a1.indexOf('.');
    let a3 = a1.substring(a2 + 1).length;
    return a3;
}
//
function PriceRate(currency, price) {
    let weishu1 = 0;
    let minQty = 0;
    let quantityPrecision = 0;
    let tickSize = 0;
    let grids = 0;
    let ctVal = 0;
    let minSz = 0;
    currency = `${currency.split('_')[0]}-${currency.split('_')[1]}-SWAP`;
    SymbolsEx.map((v, i) => {
        if (v.instId == currency) {
            quantityPrecision = Number(v.lotSz);
            tickSize = Number(v.tickSz);
            weishu1 = GetStringDotAfterLenth(v.tickSz);
            minQty = Number(v.minSz) * Number(v.ctVal);
            ctVal = Number(v.ctVal);
            minSz = Number(v.minSz);
        }
    });
    if (weishu1 > 2) {
        switch (weishu1) {
            case 3:
                grids = tickSize * 50;
                break;
            default:
                grids = tickSize * 10 ** 2;
                break;
        }
    } else {
        if (price < 500) {
            grids = tickSize * 10 ** 2;
        } else if (price >= 500 && price < 1000) {
            grids = 5;
        } else if (price >= 1000 && price < 10000) {
            grids = 10;
        } else {
            grids = 50;
        }
    }
    let data = { weishu1: weishu1, tickSize: tickSize, minSz: minSz, ctVal: ctVal, quantityPrecision: quantityPrecision, minQty: minQty, grids: grids }
    return data;
}
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
        let ctVal = GetCtVal(currency);
        let r1 = exchanges[ir].GetRecords(PERIOD_M1)
        Sleep(100)
        let r2 = exchanges[ir].GetRecords(PERIOD_M15)
        Sleep(100)
        let r3 = exchanges[ir].GetRecords(PERIOD_M5)
        Sleep(100)
        let MACD1 = TA.MACD(r1, 12, 26, 9)
        let MACD2 = TA.MACD(r2, 12, 26, 9)
        let MACD3 = TA.MACD(r3, 12, 26, 9)
        let UP1 = MACD2[2][MACD2[2].length - 1] > 0;
        let DOWN1 = MACD2[2][MACD2[2].length - 1] <= 0;
        let long1 = MACD1[2][MACD1[2].length - 2] <= 0 && MACD1[2][MACD1[2].length - 1] > 0; //1分钟金叉
        let short1 = MACD1[2][MACD1[2].length - 2] > 0 && MACD1[2][MACD1[2].length - 1] <= 0;//1分钟死叉
        let long2 = MACD3[2][MACD3[2].length - 1] > 0;
        let short2 = MACD3[2][MACD3[2].length - 1] <= 0;
        let long3 = MACD1[2][MACD1[2].length - 1] > 0;
        let short3 = MACD1[2][MACD1[2].length - 1] <= 0;
        let pData = PriceRate(currency, ticker1.Last);
        //交易开始
        if (Zs) {
            if (position1.length == 2) {
                if (ZsLong != 0 && position1[0].Profit < -ZsLong && longAddCount[ir] >= maxLAC) {
                    exchanges[ir].SetDirection('closebuy')
                    exchanges[ir].Sell(-1, position1[0].Amount)
                    list1[ir] = 0
                    _G('list1', list1)
                    longAddCount[ic] = 0;
                    _G('longAddCount', longAddCount)
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
                        Log(currency, '多单止损 卖出平多 清仓')
                        CancelOrderAll(exchanges[ir]);
                        LogProfit(pft)
                    }
                }
                if (ZsShort != 0 && position1[0].Type == 1) {
                    if (position1[0].Profit < -ZsShort && shortAddCount[ir] >= maxSAC) {
                        exchanges[ir].SetDirection('closesell')
                        exchanges[ir].Buy(-1, position1[0].Amount)
                        list2[ir] = 0
                        _G('list2', list2)
                        Log(currency, '空单止损 买入平空 清仓')
                        CancelOrderAll(exchanges[ir]);
                        LogProfit(pft)
                    }
                }
            }
        }
        //网格解套
        if (Jt) {
            let sCount = shortAddCount[ir];
            let lCount = longAddCount[ir];
            let f1 = position1.length == 1 && position1[0].Profit > -JtAmount;
            let f2 = position1.length == 2 && position1[0].Profit > -JtAmount && position1[1].Profit > -JtAmount;
            if (position1.length == 0 || f1 || f2) {
                CancelOrderAll(exchanges[ir])
            }
            if (position1.length == 1) {
                //最大下单格子数量
                let maxPreAmount = position1[0].Amount;
                //自动格子划分
                let autoGrids = _N(Math.abs(position1[0].Price - ticker1.Last) / pData.grids, 0);
                //真实布局格子
                let rGrids = Math.min(maxPreAmount, autoGrids);
                //挂单
                let gO = rGrids > 3 ? 3 : rGrids;
                //每格子下单张数
                let _preAmount = _N(position1[0].Amount * 7 / 10 / rGrids, 0);
                let preAmount = Math.max(_preAmount, pData.minSz)
                if (position1[0].Type == 0) {
                    if (position1[0].Profit < -JtAmount) {
                        let prePrice = (position1[0].Price - ticker1.Last) / rGrids;
                        //获取委托订单
                        let orderMinPrice = 999999;
                        let orders = exchanges[ir].GetOrders();
                        for (let i = 0; i < orders.length; i++) {
                            let v = orders[i];
                            orderMinPrice = Math.min(orderMinPrice, v.Price)
                        }
                        //动态调整网格
                        if (orderMinPrice - ticker1.Last > pData.grids) {
                            if (orders.length != 0) {
                                Log(`${currency},动态调整网格1,OrderMinPrice=${orderMinPrice},NowPrice=${ticker1.Last},Grids=${pData.grids}`)
                            }
                            CancelOrderAll(exchanges[ir])
                        }
                        if (orders.length < gO) {
                            Log(`${currency},多单补仓${lCount}次,浮亏${position1[0].Profit}后被套，空仓布网1`);
                            for (let i = 0; i < orders.length; i++) {
                                let order = orders[i];
                                exchanges[ir].CancelOrder(order.Id)
                            }
                            //向上布置十个网
                            for (let i = 0; i < gO; i++) {
                                exchanges[ir].SetDirection('sell')
                                let price = _N((ticker1.Last + prePrice * i), pData.weishu1);
                                let id = exchanges[ir].Sell(price, preAmount)
                                Log(`${currency},高价卖出布网${i}成功,price:${price}`);
                            }
                        }
                    }
                }
                if (position1[0].Type == 1) {
                    if (position1[0].Profit < -JtAmount) {
                        let prePrice = (ticker1.Last - position1[0].Price) / rGrids;
                        //获取委托订单
                        let orderMaxPrice = 0;
                        let orders = exchanges[ir].GetOrders();
                        for (let i = 0; i < orders.length; i++) {
                            let v = orders[i];
                            orderMaxPrice = Math.max(orderMaxPrice, v.Price)
                        }
                        //动态调整网格
                        if (ticker1.Last - orderMaxPrice > pData.grids) {
                            if (orders.length != 0) {
                                Log(`动态调整网格2,${currency},OrderMaxPrice=${orderMaxPrice},NowPrice=${ticker1.Last},Grids=${pData.grids}`);
                            }
                            CancelOrderAll(exchanges[ir])
                        }
                        if (orders.length < 10) {
                            Log(`${currency},空单补仓${sCount}次,浮亏${position1[0].Profit}后被套，多仓布网1`)
                            for (let i = 0; i < orders.length; i++) {
                                let order = orders[i];
                                exchanges[ir].CancelOrder(order.Id)
                            }
                            //向下布置十个网
                            for (let i = 0; i < gO; i++) {
                                exchanges[ir].SetDirection('buy')
                                let price = _N((ticker1.Last - prePrice * i), pData.weishu1);
                                let id = exchanges[ir].Buy(price, preAmount)
                                Log(`${currency},低价买入布网${i}成功,price:${price}`);
                            }
                        }
                    }
                }
            }
            if (position1.length == 2) {
                let sA = position1[1].Profit < position1[0].Profit;
                let lA = position1[0].Profit < position1[1].Profit;
                if (position1[1].Profit < -JtAmount && sA) {
                    //最大下单格子数量
                    let maxPreAmount = position1[1].Amount - position1[0].Amount;
                    //自动划分
                    let autoGrids = _N(Math.abs(position1[1].Price - ticker1.Last) / pData.grids, 0);
                    //真实布局格子
                    let rGrids = Math.min(maxPreAmount, autoGrids);
                    //挂单
                    let gO = rGrids > 3 ? 3 : rGrids;
                    //每格子下单张数
                    let _preAmount = _N((position1[1].Amount - position1[0].Amount) * 7 / 10 / rGrids, 0);
                    let preAmount = Math.max(_preAmount, pData.minSz)
                    //
                    let prePrice = (ticker1.Last - position1[1].Price) / rGrids;
                    //获取委托订单
                    let orders = exchanges[ir].GetOrders();
                    let pOrders = [];
                    let oOrders = [];
                    if (orders.length > 0) {
                        for (let i = 0; i < orders.length; i++) {
                            let order = orders[i];
                            if (order.Info.positionSide == "LONG" && order.Info.side == "SELL") {
                                pOrders.push(order)
                            } else {
                                oOrders.push(order)
                            }
                        }
                    }
                    //委托平仓单
                    if (pOrders.length == 0) {
                        exchanges[ir].SetDirection('closebuy')
                        let price = _N((position1[0].Price + prePrice), pData.weishu1);
                        let id = exchanges[ir].Sell(price, position1[0].Amount);
                        Log(`${currency},委托平多,成功,price:${price}`);
                    } else {
                        //先撤销再重新挂
                        if (oOrders.length < gO) {
                            for (let i = 0; i < pOrders.length; i++) {
                                let order = pOrders[i];
                                exchanges[ir].CancelOrder(order.Id)
                            }
                            exchanges[ir].SetDirection('closebuy')
                            let price = _N((position1[0].Price + prePrice), pData.weishu1);
                            let id = exchanges[ir].Sell(price, position1[0].Amount);
                            Log(`${currency},委托平多,成功,price:${price}`);
                        }
                    }
                    if (oOrders.length <= 0) {
                        //向下布置十个网
                        for (let i = 0; i < gO; i++) {
                            exchanges[ir].SetDirection('buy')
                            let price = _N((ticker1.Last - prePrice * i), pData.weishu1);
                            let id = exchanges[ir].Buy(price, preAmount)
                            Log(`${currency},低价买入布网${i}成功_1,price:${price}`);
                        }
                    }
                }
                if (position1[0].Profit < -JtAmount && lA) {
                    //最大下单格子数量
                    let maxPreAmount = _N((position1[0].Amount - position1[1].Amount), 0);
                    //
                    let autoGrids = _N(Math.abs(position1[0].Price - ticker1.Last) / pData.grids, 0);
                    //真实布局格子
                    let rGrids = Math.min(maxPreAmount, autoGrids);
                    //挂单
                    let gO = rGrids > 3 ? 3 : rGrids;
                    //每格子下单张数
                    let _preAmount = _N((position1[0].Amount - position1[1].Amount) * 7 / 10 / rGrids, 0);
                    let preAmount = Math.max(_preAmount, pData.minSz)
                    let prePrice = (position1[0].Price - ticker1.Last) / rGrids;
                    //获取委托订单
                    let orders = exchanges[ir].GetOrders();
                    let pOrders = [];
                    let oOrders = [];
                    if (orders.length > 0) {
                        for (let i = 0; i < orders.length; i++) {
                            let order = orders[i];
                            if (order.Info.positionSide == "SHORT" && order.Info.side == "BUY") {
                                pOrders.push(order)
                            } else {
                                oOrders.push(order)
                            }
                        }
                    }
                    //委托平仓单
                    if (pOrders.length == 0) {
                        exchanges[ir].SetDirection('closesell')
                        let price = _N((position1[1].Price - prePrice), pData.weishu1);
                        let id = exchanges[ir].Buy(price, position1[1].Amount);
                        Log(`${currency},委托平空,成功,price:${price}`);
                    } else {
                        //先撤销再重新挂
                        if (oOrders.length < g0) {
                            for (let i = 0; i < pOrders.length; i++) {
                                let order = pOrders[i];
                                exchanges[ir].CancelOrder(order.Id)
                            }
                            exchanges[ir].SetDirection('closesell')
                            let price = _N((position1[1].Price - prePrice), pData.weishu1);
                            let id = exchanges[ir].Buy(price, position1[1].Amount);
                            Log(`${currency},委托平空,成功,price:${price}`);
                        }
                    }
                    //
                    if (oOrders.length <= 0) {
                        for (let i = 0; i < gO; i++) {
                            exchanges[ir].SetDirection('sell')
                            let price = _N((ticker1.Last + prePrice * i), pData.weishu1);
                            let id = exchanges[ir].Sell(price, preAmount)
                            Log(`${currency},高价卖出布网${i}成功_1,price:${price}`);
                        }
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
                    let order = exchanges[ir].GetOrder(id0)
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
                        if (position1[0].Profit > 0.01 * Z * ticker1.Last * position1[0].Amount * ctVal) {
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
                                CancelOrderAll(exchanges[ir]);
                                return true;
                            }
                        }
                        //金叉给多单补仓
                        if (position1[0].Profit < 0 && (long2 || long3) && longAddCount[ir] <= maxLAC) {
                            if (ticker1.Last < (1 - 0.01 * E) * list1[ir]) {
                                GetSelfPos(exchanges[ir])
                                listpft[ir].push(position1[0].Profit)
                                _G('listpft', listpft)
                                let maxpft = Math.min(...listpft[ir])
                                if (position1[0].Profit > (1 - 0.01 * HcK4) * maxpft) {
                                    exchanges[ir].SetDirection('buy')
                                    let id0 = exchanges[ir].Buy(-1, (acc[ir] * lsRate))
                                    Sleep(S)
                                    let order = exchanges[ir].GetOrder(id0)
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
                            let order = exchanges[ir].GetOrder(id0)
                            Sleep(200)
                            list1[ir] = order["AvgPrice"]
                            _G('list1', list1)
                            Log(currency, '进场开多,首单进场价格2:', list1[ir])
                            LogProfit(pft);
                            return true;
                        }
                        if (position1[0].Profit > 0.01 * E * ticker1.Last * position1[0].Amount * ctVal) {
                            exchanges[ir].SetDirection('closesell')
                            exchanges[ir].Buy(-1, position1[0].Amount)
                            list2[ir] = 0
                            _G('list2', list2)
                            shortAddCount[ir] = 0;
                            _G('shortAddCount', shortAddCount);
                            Log(currency, '空单盈利,平空止盈1')
                            LogProfit(pft);
                            CancelOrderAll(exchanges[ir]);
                        }
                    }
                }
                if (position1.length == 2) {
                    //多单模块
                    if (position1[0].Profit > 0.01 * Z * ticker1.Last * position1[0].Amount * ctVal) {
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
                            list1[ir] = 0
                            _G('list1', list1)
                            CancelOrderAll(exchanges[ir]);
                            return true;
                        }
                    }
                    //金叉给多单补仓
                    if (position1[0].Profit < 0 && (long2 || long3) && longAddCount[ir] <= maxLAC) {
                        if (ticker1.Last < (1 - 0.01 * E) * list1[ir]) {
                            GetSelfPos(exchanges[ir])
                            listpft[ir].push(position1[0].Profit)
                            _G('listpft', listpft)
                            let maxpft = Math.min(...listpft[ir])
                            if (position1[0].Profit > (1 - 0.01 * HcK4) * maxpft) {
                                exchanges[ir].SetDirection('buy')
                                let id0 = exchanges[ir].Buy(-1, (acc[ir] * lsRate))
                                Sleep(S)
                                let order = exchanges[ir].GetOrder(id0)
                                list1[ir] = order["AvgPrice"]
                                _G('list1', list1)
                                longAddCount[ir] = _N(parseFloat(longAddCount[ir]), 0) + 1;
                                _G('longAddCount', longAddCount);
                                Log(`${currency},小周期[金叉]满足补仓信号, 浮亏回调${HcK4}%,多单补仓,补仓价格:${list1[ir]},补仓次数:${longAddCount[ir]}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    if (position1[1].Profit > 0.01 * E * ticker1.Last * position1[1].Amount * ctVal) {
                        exchanges[ir].SetDirection('closesell')
                        exchanges[ir].Buy(-1, position1[1].Amount)
                        list2[ir] = 0
                        _G('list2', list2)
                        shortAddCount[ir] = 0;
                        _G('shortAddCount', shortAddCount);
                        Log(currency, '空单盈利,平空止盈2')
                        LogProfit(pft)
                        CancelOrderAll(exchanges[ir]);
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
                    let order = exchanges[ir].GetOrder(id0)
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
                        if (position1[0].Profit > 0.01 * Z * ticker1.Last * position1[0].Amount * ctVal) {
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
                                list2[ir] = 0
                                _G('list2', list2)
                                CancelOrderAll(exchanges[ir]);
                                return true;
                            }
                        }
                        let sCount = shortAddCount[ir];
                        //死叉给空单补仓
                        if (position1[0].Profit < 0 && (short2 || short3) && sCount <= maxSAC) {
                            if (ticker1.Last > (1 + 0.01 * E) * list2[ir]) {
                                GetSelfPos(exchanges[ir])
                                listpft2[ir].push(position1[0].Profit)
                                _G('listpft2', listpft2)
                                let maxpft2 = Math.min(...listpft2[ir])
                                if (position1[0].Profit > (1 - 0.01 * HcK4) * maxpft2) {
                                    exchanges[ir].SetDirection('sell')
                                    let id0 = exchanges[ir].Sell(-1, acc[ir])
                                    let order = exchanges[ir].GetOrder(id0)
                                    Sleep(S)
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
                            let order = exchanges[ir].GetOrder(id0)
                            Sleep(200)
                            list2[ir] = order["AvgPrice"]
                            _G('list2', list2)
                            Log(currency, '进场开空,首单进场价格2:', list2[ir])
                            LogProfit(pft)
                            return true;
                        }
                        if (position1[0].Profit > 0.01 * E * ticker1.Last * position1[0].Amount * ctVal) {
                            exchanges[ir].SetDirection('closebuy')
                            exchanges[ir].Sell(-1, position1[0].Amount)
                            list1[ir] = 0
                            _G('list1', list1)
                            longAddCount[ir] = 0;
                            _G('longAddCount', longAddCount);
                            Log(currency, `多单盈利,平多止盈1`)
                            LogProfit(pft)
                            CancelOrderAll(exchanges[ir]);
                        }
                    }
                }
                if (position1.length == 2) {
                    //空单模块
                    if (position1[1].Profit > 0.01 * Z * ticker1.Last * position1[1].Amount * ctVal) {
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
                            list2[ir] = 0
                            _G('list2', list2)
                            CancelOrderAll(exchanges[ir]);
                            return true;
                        }
                    }
                    //死叉给空单补仓
                    let sCount = shortAddCount[ir];
                    if (position1[1].Profit < 0 && (short2 || short3) && sCount <= maxSAC) {
                        if (ticker1.Last > (1 + 0.01 * E) * list2[ir]) {
                            GetSelfPos(exchanges[ir])
                            listpft2[ir].push(position1[1].Profit)
                            _G('listpft2', listpft2)
                            let maxpft2 = Math.min(...listpft2[ir])
                            if (position1[1].Profit > (1 - 0.01 * HcK4) * maxpft2) {
                                exchanges[ir].SetDirection('sell')
                                let id0 = exchanges[ir].Sell(-1, acc[ir])
                                Sleep(S)
                                let order = exchanges[ir].GetOrder(id0)
                                list2[ir] = order["AvgPrice"]
                                _G('list2', list2)
                                shortAddCount[ir] = sCount + 1;
                                _G('shortAddCount', shortAddCount);
                                Log(`${currency},小周期[死叉]满足补仓信号,浮亏回调${HcK4}%,空单补仓,补仓价格:${list2[ir]},补仓次数:${shortAddCount[ir]}`)
                                LogProfit(pft)
                            }
                        }
                    }
                    if (position1[0].Profit > 0.01 * E * ticker1.Last * position1[0].Amount * ctVal) {
                        exchanges[ir].SetDirection('closebuy')
                        exchanges[ir].Sell(-1, position1[0].Amount)
                        list1[ir] = 0
                        _G('list1', list1)
                        longAddCount[ir] = 0;
                        _G('longAddCount', longAddCount);
                        Log(currency, `多单盈利,平多止盈2`)
                        LogProfit(pft)
                        CancelOrderAll(exchanges[ir]);
                    }
                }
            }
        }
    }
}
function mainBefor() {
    exchange.SetContractType("swap");
    account1 = exchange.GetAccount();
    CurrentSymbol = exchange.GetCurrency()
    let exchangeInfo = exchange.IO("api", "GET", "/api/v5/public/instruments?instType=SWAP");
    SymbolsEx = exchangeInfo.data;
    if (_G('init_Balance') && _G('FSTTime')) {
        Log('成功读取上次进度!')
        init_Balance = _G('init_Balance')
        FSTTime = _G('FSTTime')
    } else {
        Log('程序第一次运行，保存初始资金数据!#3299cc')
        init_Balance = account1.Balance;
        FSTTime = _D()
        _G('init_Balance', init_Balance)
        _G('FSTTime', FSTTime)
    }
    if (_G('acc') && _G('listpft') && _G('listpft2') && _G('list1') && _G('list2') && _G('mlist') && _G('longAddCount') && _G('shortAddCount')) {
        acc = _G('acc')
        listpft = _G('listpft')
        listpft2 = _G('listpft2')
        list1 = _G('list1')
        list2 = _G('list2')
        longAddCount = _G('longAddCount')
        shortAddCount = _G('shortAddCount')
        mlist = _G('mlist')
    } else {
        acc = []
        _G('acc', acc)
        listpft = []
        listpft2 = []
        list1 = []
        list2 = []
        mlist = T0
        for (let i = 0; i < 100; i++) {
            listpft.push([])
            listpft2.push([])
            longAddCount.push([])
            longAddCount[i] = 0
            shortAddCount.push([])
            shortAddCount[i] = 0
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
    }
    for (var i = 0; i < exchanges.length; i++) {
        k = i
        let data = accuracy()
        acc.push(n1)
        _G('acc', acc)
        if (data.amount <= 0) {
            stoplist.push(data)
        }
    }

}
function main() {
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
        button1.push(0)
        button2.push(0)
    }
    mainBefor()
    while (true) {
        try {
            let minutes = new Date().getMinutes();
            let seconds = new Date().getSeconds();
            if (minutes % 5 == 0) {
                if (seconds % 15 == 0) {
                    let exchangeInfo = exchange.IO("api", "GET", "/api/v5/public/instruments?instType=SWAP");
                    SymbolsEx = exchangeInfo.data;
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
                mlist += T1
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
                    Log('当前停止的币对：', currency)
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
                        list1[ic] = 0
                        _G('list1', list1)
                    }
                    if (arr[2] == '1') {
                        exchanges[ic].SetDirection("closesell")
                        exchanges[ic].Buy(-1, amount)
                        shortAddCount[ic] = 0;
                        _G('shortAddCount', shortAddCount)
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