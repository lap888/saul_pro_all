// fmz@79940421843a60bc905bd09cc1f44555
const Ct = "swap";//合约类型
let BlackCoin = BlackCoins.split(',');
let OrgAccount = null;//账户信息
let OpAmount = { Amount: 0, Coin: '' };//首仓
let AddTimeDiff = null;//加仓时间
let TradeType = ORDER_TYPE_BUY;//多仓方向
let CoverPrice = 0;//止盈
let Profit = 0;//浮亏/赢
let HistoryMinPrice = 0;
let HistoryReturnRate = 0;
let UnIncomeRate = 0;//为实现盈亏率
let IsHaveLock = false;//是否锁仓
let Action = '';//执行趋势
let SymbolCoin = '';//当前交易对
let quantityPrecision = 0;//获取该币精度
let NowBzjRate = 1;//保证金率
let ReversePrice = 0;
//精度
let pricePrecision = 1;
let NRate = 1;
let FRate = 1;
let AddCoinRate = 1;
let VixRates = [];
let UpDownRates = [];




let Counter = { buy: 0, sell: 0 };
let SymbolsEx = [];

let LastBarTime = 0
let Bra = {}
let LastNbar = {}
let Records = {}

//
Interval *= 1000;
OpRate /= 100;
StopProfit /= 100;
RepairRate /= 100;
RepairReturnRate /= 100;
FristOpRate /= 100;

//成交量
function GetTradesquoteQty(symbol) {
    let trades = exchange.IO("api", "GET", `/fapi/v1/trades`, `symbol=${symbol}&limit=${1000}`, ``)
    let quoteQty = 0
    let tradesquoteQty = { quoteQty: 0, symbol: '' }
    for (let i = 0; i < trades.length; i++) {
        let e = trades[i];
        quoteQty += Number(e.quoteQty)
    }
    tradesquoteQty.quoteQty = quoteQty;
    let newSymbol = symbol.slice(0, symbol.length - 4) + '_' + symbol.slice(symbol.length - 4)
    tradesquoteQty.symbol = newSymbol;
    return tradesquoteQty
}

//波动率
function VixRate(Records, N) {
    // 当每K结束时计算
    if (LastBarTime !== Bar.Time) {
        LastBarTime = Bar.Time
        // 当K达到计算根数开始计算vix_arr
        if (Records && Records.length > N) {
            // 获取vix 当前close自然对数 除以 前90根自然对数
            let vix = Math.log(Bar.Close) / Math.log(LastNbar.Close)
            return vix;
        } else {
            return 0
        }
    } else {
        return 0
    }
}

//自动选币
function AutoSelectCoin() {
    if (IsAutoSelectCoin) {
        // let tradesquoteQtys = []//成交额
        let vixRates = []//波动率
        UpDownRates = [];//24小时涨跌幅
        for (let i = 0; i < SymbolsEx.length; i++) {
            let e = SymbolsEx[i];
            let _symbol = e.symbol;
            let _symbol_l4 = _symbol.slice(-4)
            if (_symbol_l4 == 'USDT') {
                //成交榜
                // let tradesquoteQty = GetTradesquoteQty(_symbol)
                // tradesquoteQtys.push(tradesquoteQty)
                //24小时涨跌幅
                let newSymbol = ''
                let newSymbol1 = _symbol.slice(0, _symbol.length - 4)
                let newSymbol2 = _symbol.slice(_symbol.length - 4)
                newSymbol = newSymbol1 + '_' + newSymbol2;
                exchange.SetCurrency(newSymbol);
                let upDownRate = { rate: 0, symbol: '', VolumeP: 0, close: 0 }
                let Records = exchange.GetRecords(PERIOD_H1)
                if (Records.length < 25) {
                    continue;
                }
                let begin = Records[Records.length - 25]
                let last = Records[Records.length - 1];

                let Open = begin.Open//涨跌=今日开盘价-现价(当前收盘价)
                let Close = last.Close//涨跌幅=涨跌/今日开盘价*100    

                let update = (Close - Open) / Open * 100

                for (let i = 1; i <= 25; i++) {
                    let r = Records[Records.length - i];
                    let volumeP = ((r.Open + r.Close) / 2) * r.Volume
                    upDownRate.VolumeP += volumeP
                }
                upDownRate.rate = update
                upDownRate.symbol = newSymbol
                upDownRate.close = Close;
                let isBlack = BlackCoin.indexOf(newSymbol1.toLocaleUpperCase())
                if (upDownRate.VolumeP >= 100000000 && isBlack < 0 && update > 1) {
                    UpDownRates.push(upDownRate)
                }
            }
        }
        // tradesquoteQtys.sort(function (a, b) { if (a.quoteQty < b.quoteQty) { return 1 } else { return -1 } })
        // tradesquoteQtys = tradesquoteQtys.slice(0, 5)
        UpDownRates.sort(function (a, b) { if (a.rate < b.rate) { return 1 } else { return -1 } });
        UpDownRates = UpDownRates.slice(0, 10)
        //波动率
        let N = 90;
        for (let i = 0; i < UpDownRates.length; i++) {
            let e = UpDownRates[i];
            exchange.SetCurrency(e.symbol);
            let rates = 0;
            let vixRate = { rate: 0, symbol: '' }
            let Records = exchange.GetRecords(PERIOD_M5)

            if (Records && Records.length > 2 * N + 2) {
                // 初始化前N个vix值
                for (let i = -2; i < N - 1; i++) {
                    Bar = Records[Records.length - N + i]
                    LastNbar = Records[Records.length - N + i - N]
                    let rate = VixRate(Records, N)
                    if (rate == 0) {
                        N--
                    }
                    rates += rate;
                }
            }
            rates = rates / N
            vixRate.symbol = e.symbol
            vixRate.rate = rates
            vixRates.push(vixRate)
        }
        vixRates.sort(function (a, b) { if (a.rate < b.rate) { return 1 } else { return -1 } })
        VixRates = [];
        VixRates = vixRates;
        return vixRates[0]
    } else {
        return { symbol: exchange.GetCurrency() }
    }

}

//账户信息
function GetAccount(e) {
    let account = _C(e.GetAccount);
    return account;
}

//持仓信息
function MyGetPosition(e, orderType) {
    let positions = e.GetPosition();
    if (typeof (orderType) == 'undefined') {
        return positions;
    }
    for (let i = 0; i < positions.length; i++) {
        if (positions[i].Type == orderType) {
            return positions[i];
        }
    }
    return [];
}

//获取ticker
function GetTicker(e) {
    while (true) {
        let ticker = _C(e.GetTicker);
        if (ticker.Buy > 0 && ticker.Sell > 0 && ticker.Sell > ticker.Buy) {
            return ticker;
        }
        Sleep(300);
    }
}

//算首仓
function CalFrisOpAmount(coin) {
    let ticker = GetTicker(exchange);
    let assets = OrgAccount.Balance;
    let lastprice = ticker.Last;
    //总下单张数
    let amount = assets * MarginLevel / lastprice;
    amount = _N(amount, 4)
    SymbolsEx.map((v, i) => {
        if (v.symbol == coin) {
            quantityPrecision = v.quantityPrecision;
        }
    });

    OpAmount.Amount = amount * FristOpRate;
    OpAmount.Amount = _N(OpAmount.Amount, quantityPrecision)
    OpAmount.Coin = coin;
    Log(coin, "下单最大张数:", _N(amount, 0), "资金使用率:", OpRate * 100, "%", "首仓资金使用率:", FristOpRate * 100, "%", "首仓张数:", OpAmount.Amount, "#32CD32");
    return OpAmount;
}

//交易
function Trade(e, TradeType, tradeAmount) {
    let nowPositions = [];
    let tradeFunc = TradeType == ORDER_TYPE_BUY ? e.Buy : e.Sell;
    e.SetDirection(TradeType == ORDER_TYPE_BUY ? "buy" : "sell");
    tradeFunc(-1, tradeAmount);
    Sleep(500)
    nowPositions = MyGetPosition(e, TradeType);
    return nowPositions;
}

//战车方向
function M5Action(e) {
    let action = '';
    let records = e.GetRecords(PERIOD_M5)
    let ma90 = TA.MA(records, 90)
    let ema10 = TA.EMA(records, 10)
    let ma90price1 = _N(ma90[ma90.length - 3], 4)
    let ma90price2 = _N(ma90[ma90.length - 2], 4)

    let ema10price1 = _N(ema10[ema10.length - 3], 4)
    let ema10price2 = _N(ema10[ema10.length - 2], 4)
    if ((ma90price1 > ema10price1 && ma90price2 < ema10price2) || (ma90price1 < ema10price1 && ma90price2 < ema10price2)) {
        //上穿 保持上方
        action = 'buy'
    } else {
        action = 'sell'
    }
    return action;
}

//时间差防插针
function TimeFn(d1) {
    //di作为一个变量传进来//如果时间格式是正确的，那下面这一步转化时间格式就可以不用了
    let dateBegin = d1;//new Date(d1.replace(/-/g, "/"));//将-转化为/，使用new Date
    let dateEnd = new Date();//获取当前时间
    let dateDiff = dateEnd.getTime() - dateBegin;//时间差的毫秒数
    let dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000));//计算出相差天数
    let leave1 = dateDiff % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
    let hours = Math.floor(leave1 / (3600 * 1000))//计算出小时数
    //计算相差分钟数
    let leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数
    let minutes = Math.floor(leave2 / (60 * 1000))//计算相差分钟数
    //计算相差秒数
    let leave3 = leave2 % (60 * 1000) //计算分钟数后剩余的毫秒数
    let seconds = Math.round(leave3 / 1000)
    let res = { dayDiff, hours, minutes, seconds, leave1, dateDiff };
    return res;
}

//撤销未成功订单
function CancelNoSucessOrder(e, orderType) {
    let order = null;
    if (typeof (orderId) == 'undefined') {
        orderId = null;
    }
    while (true) {
        let dropped = 0;
        let orders = _C(e.GetOrders);
        let positionSide = orderType == "BUY" ? "LONG" : "SHORT";
        for (let i = 0; i < orders.length; i++) {
            //撤对应平单
            if (orders[i].Info.positionSide == positionSide) {
                if (orders[i].Id == orderId) {
                    order = orders[i];
                } else {
                    if (orders[i].DealAmount > 0) {
                        extra = "成交: " + orders[i].DealAmount;
                    } else {
                        extra = "未成交";
                    }
                    e.SetDirection(orders[i].Type == ORDER_TYPE_BUY ? "buy" : "sell");
                    e.CancelOrder(orders[i].Id, orders[i].Type == ORDER_TYPE_BUY ? "买单" : "卖单", extra);
                    dropped++;
                }
            }
        }
        if (dropped == 0) {
            break;
        }
        Sleep(300);
    }
    return order;
}

//计算当前价与持仓加比率 超过7% 启动移动止盈  低于50% 止损
function CalculatorN(type, nowPrice, myPrice, coin) {
    let rate = 0;
    if (type == ORDER_TYPE_BUY) {
        rate = (nowPrice - myPrice) * MarginLevel / myPrice;
        rate = _N(rate, 4);
        // Log(`${coin} =>当前价与持仓加比率 超过${StopProfit * 100}% 启动移动止盈=>`, "当前价:", nowPrice, "持仓价:", myPrice, "盈亏比率:", _N(rate * 100, 4), "%", "#32CD32");
    } else {
        rate = (nowPrice - myPrice) * MarginLevel / myPrice * -1;
        rate = _N(rate, 4);
        // Log(`${coin} =>当前价与持仓加比率 超过${StopProfit * 100}% 启动移动止盈=>`, "当前价:", nowPrice, "持仓价:", myPrice, "盈亏比率:", _N(rate * 100, 4), "%", "#FF0000");
    }
    UnIncomeRate = rate * 100;
    return rate;
}

//计算回落
function CalculatorSliceN(type, nowPrice, maxPrice, myPrice, coin) {
    let rate = 0;
    if (type == ORDER_TYPE_BUY) {
        // rate = maxPrice * MarginLevel / nowPrice - MarginLevel;
        // （最低价-开仓价）*20*-1/ 开仓价 -（当前价-开仓价）*20*-1/开仓价>=回落比率 则止盈
        rate = (maxPrice - myPrice) * MarginLevel * -1 / myPrice - (nowPrice - myPrice) * MarginLevel * -1 / myPrice;
        rate = _N(rate, 4);
        // let seconds = new Date().getSeconds();
        // if (seconds % 15 == 0) {
        //     Log(`${coin} =>计算最新价格回落幅度 超过${RepairReturnRate * 100}% 补仓=>`, "当前价:", nowPrice, "最低价:", maxPrice, "持仓价:", myPrice, "回落幅度:", _N(rate * 100, 4), "%", "#FF0000");
        // }
    } else {
        // rate = nowPrice * MarginLevel / maxPrice - MarginLevel;
        // （最高价-开仓价）*20 / 开仓价  -（当前价-开仓价）*20 / 开仓价>=回落比率 则回落止盈
        rate = (maxPrice - myPrice) * MarginLevel / myPrice - (nowPrice - myPrice) * MarginLevel / myPrice;
        rate = _N(rate, 4);
        // let seconds = new Date().getSeconds();
        // if (seconds % 15 == 0) {
        //     Log(`${coin} =>计算最新价格回落幅度 超过${RepairReturnRate * 100}% 补仓=>`, "当前价:", nowPrice, "最高价:", maxPrice, "持仓价:", myPrice, "回落幅度:", _N(rate * 100, 4), "%", "#32CD32");
        // }
    }
    HistoryMinPrice = maxPrice;
    HistoryReturnRate = rate * 100;
    return rate;
}

//获取小数点后位数
function GetStringDotAfterLenth(str) {
    let a1 = Number(str).toString();
    let a2 = a1.indexOf('.');
    let a3 = a1.substring(a2 + 1).length;
    return a3;
}

function onexit() {
    Log("Exit");
}

//自动刷新选币
function RefressSetCurrency(exchange, isFrist) {
    let currentSymbol = _G(`symbol`)
    let updownRate = AutoSelectCoin()
    let _currentSymbol = updownRate.symbol.split('_')[0] + updownRate.symbol.split('_')[1];
    exchange.SetMarginLevel(MarginLevel);
    if (currentSymbol == null) {
        _G(`symbol`, updownRate)
        currentSymbol = updownRate
        exchange.SetCurrency(currentSymbol.symbol);
    } else {
        exchange.SetCurrency(currentSymbol.symbol);
        if (isFrist) {
            let positions = MyGetPosition(exchange);
            if (positions.length != 0) {
                _currentSymbol = currentSymbol.symbol.split('_')[0] + currentSymbol.symbol.split('_')[1];
                return _currentSymbol;
            }
        }
        if (currentSymbol.symbol != updownRate.symbol) {
            _G(`symbol`, updownRate)
            currentSymbol = updownRate;
            exchange.SetCurrency(currentSymbol.symbol);
            _currentSymbol = currentSymbol.symbol.split('_')[0] + currentSymbol.symbol.split('_')[1];
            CalFrisOpAmount(_currentSymbol);
        }
        if (OpAmount.Coin != _currentSymbol) {
            CalFrisOpAmount(_currentSymbol);
        }
    }
    return _currentSymbol;
}


//打印状态栏
function PrintStatus(pos, OrgAccount) {
    let tbl = {
        type: "table",
        title: "持仓信息",
        cols: ["当前趋势", "币种", "方向", "杠杆", "持仓量", "持仓价", "浮亏", "止盈价", "标记价", "保证金", "补仓次数", "最大浮亏", `激活浮亏补仓`, `补仓回调率${_N(RepairReturnRate * 100, 2)}%`],
        rows: []
    }
    for (let i = 0; i < pos.length; i++) {
        let e = pos[i];
        tbl.rows.push([Action, e.Info.symbol, e.Type == 0 ? '多' : '空', e.Info.leverage, e.Amount, e.Price, e.Profit, CoverPrice, e.Info.markPrice, _N(e.Margin, 4), Counter.buy, `${_N(FRate * 100, 4)}%`, `${_N(RepairRate * NRate * 100 * -1, 4)}%`, `${_N(HistoryReturnRate, 4)}%`])
    }

    let str = `✱牛蛙量化专注马丁类策略的研究，QQ方式：863368681 微信：niuwa10001 #32CD32
    PS:该算法马丁策略仍在测试稳定性中，联系作者可申请免费试用#ff0000`
    let tbl3 = {
        type: "table",
        title: "联系方式",
        cols: ["QQ", "微信", "提示"],
        rows: []
    }
    tbl3.rows.push(['863368681', 'niuwa10001', '加好友备注:FMZ'])
    let historyIncome = _G('historyIncome') == null ? 0 : _G('historyIncome');
    let initBalance = _G('InitBalance')
    let income = historyIncome - initBalance <= 0 ? 0 : historyIncome - initBalance;
    let incomeRate = income / initBalance * 100;
    let toxh = _G('ToXh') == null ? 0 : _G('ToXh');

    let tbl2 = {
        type: "table",
        title: "账户信息",
        cols: ["当前趋势", "初始资金", "当前总价值", "保证金余额", "划转现货", "总收益", "收益率", "保证金使用率"],
        rows: []
    }
    let base64 = "data:image/jpeg;base64,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"
    let availableBalance = Number(OrgAccount.Info.totalMarginBalance) + Number(OrgAccount.Info.totalUnrealizedProfit)
    tbl2.rows.push([Action, _N(initBalance, 4), _N(Number(OrgAccount.Info.totalMarginBalance), 4), _N(Number(availableBalance), 4), _N(toxh, 4), _N(income, 4), `${_N(incomeRate, 4)}%`, `${NowBzjRate * 100}%`])

    let tbl4 = {
        type: "table",
        title: "涨幅榜",
        cols: ["交易对", "当前价", "涨幅率", "成交额(USDT)"],
        rows: []
    }
    for (let i = 0; i < UpDownRates.length; i++) {
        let e = UpDownRates[i];
        tbl4.rows.push([e.symbol, e.close, _N(e.rate, 2), `${_N(e.VolumeP, 2)}`])
    }

    let tbl5 = {
        type: "table",
        title: "波动榜",
        cols: ["交易对", "波动率"],
        rows: []
    }
    for (let i = 0; i < VixRates.length; i++) {
        let e = VixRates[i];
        tbl5.rows.push([e.symbol, _N(e.rate, 2)])
    }
    LogStatus(_D(), "\n`" + JSON.stringify([tbl, tbl2, tbl3, tbl4, tbl5]) + "`\n" + str + "\n" + "`" + base64 + "`")
}

//收益后打印
function AfterIncomeDo(coin) {
    Counter.buy = 0;
    _G(`${coin}_buy`, null)
    _G(`NewAddCoinprice`, null)
    _G(`minprice_${coin}`, null)
    _G(`pos_amount_${coin}`, null)
    _G('IsHaveAdd', null)
    AddCoinRate = 1;
    if (Profit > 0) {
        let historyIncome = _G('historyIncome') == null ? _G('InitBalance') : _G('historyIncome');
        historyIncome += Profit;
        _G('historyIncome', historyIncome)
        LogProfit(historyIncome);
        let seconds = new Date().getSeconds();
        if (seconds % 10 <= 2) {
            SymbolCoin = RefressSetCurrency(exchange, false);
        }
        Log('Profit', Profit, 'BeforeSymbol', coin, 'AfterSymbol', SymbolCoin, "#ffaa11")
    }
}

//下跌拉大补仓率
function DownGoAddCoinRate(n) {
    let rate = 1 + (n / 3) * n;
    return rate;
}


function OnTick() {
    exchange.SetContractType(Ct)
    let eName = exchange.GetName()
    let patt = /Futures_/;
    if (patt.test(eName)) {
        OrgAccount = GetAccount(exchange);
        let exchangeInfo = exchange.IO("api", "GET", `/fapi/v1/exchangeInfo`, ``, ``)
        SymbolsEx = exchangeInfo.symbols;
        SymbolCoin = RefressSetCurrency(exchange, true);
        Log("启动=>", "交易所:", eName, "类型:", Ct, "交易对:", SymbolCoin, "杠杆:", MarginLevel, "#FF0000")
    } else {
        throw '只支持期货交易...'
    }
    //预算首仓
    CalFrisOpAmount(SymbolCoin);
    while (true) {
        try {
            //获取持仓以及账户信息
            let positions = [];
            positions = MyGetPosition(exchange);
            OrgAccount = GetAccount(exchange);
            if (_G('InitBalance') == null || _G('InitBalance') == 0) {
                _G('InitBalance', OrgAccount.Balance)
            }
            let income = 0;
            let shortIncome = 0
            let longAmount = 0;
            let shortAmount = 0;
            positions.map((v) => {
                if (v.Type == 0) {
                    income += v.Profit
                    longAmount = v.Amount
                }
                if (v.Type == 1) {
                    shortAmount = v.Amount
                    shortIncome += v.Profit;
                }
            })
            if ((income + shortIncome) < -LockAmount && IsLock && !IsHaveLock) {
                let l_s_amount = longAmount - shortAmount;//
                if (l_s_amount > 0) {
                    IsHaveLock = true;
                    let pos = Trade(exchange, ORDER_TYPE_SELL, l_s_amount);
                    if (pos.length == 0) {
                        IsHaveLock = false;
                        throw "出师不利, 锁仓失败";
                    } else {
                        CancelNoSucessOrder(exchange, 'BUY')//撤销委托
                        Log("锁仓=>开空仓完成", "均价:", pos.Price, "数量:", pos.Amount, "#FF0000");
                    }
                } else if (l_s_amount < 0) {
                    IsHaveLock = true;
                    let pos = Trade(exchange, ORDER_TYPE_BUY, -l_s_amount);
                    if (pos.length == 0) {
                        IsHaveLock = false;
                        throw "出师不利, 锁仓失败";
                    } else {
                        Log("锁仓=>开多仓完成", "均价:", pos.Price, "数量:", pos.Amount, "#FF0000");
                    }
                }
                let seconds = new Date().getSeconds();
                if (seconds % 55 == 0) {
                    Log('锁仓中...', "#ffaa11")
                }
                Sleep(Interval * 2);
            }

            if (IsHaveLock && positions.length == 0) {
                IsHaveLock = false;
            }

            let action = Action = M5Action(exchange);
            if (positions.length <= 1 && !IsHaveLock) {
                //多空标记
                let flag = IsOnlyDoUp ? action == 'buy' ? true : false : true;
                if (flag) {
                    //首单
                    let pos = null;
                    let pos_amount = _G(`pos_amount_${SymbolCoin}`);
                    if (positions.length == 0) {
                        //算收益
                        AfterIncomeDo(SymbolCoin);
                        pos_amount = _G(`pos_amount_${SymbolCoin}`)
                        let amount = OpAmount.Amount;
                        pos = Trade(exchange, TradeType, amount);
                        AddTimeDiff = new Date().getTime();
                        if (pos.length == 0) {
                            throw "出师不利, 开仓失败";
                        } else {
                            AddCoinRate = 1;
                            _G('IsHaveAdd', null)
                            _G(`${pos.Info.symbol}_buy`, null)//加仓次数
                            _G(`minprice_${pos.Info.symbol}`, null)//清空标记最新低价
                            _G(`pos_amount_${SymbolCoin}`, pos.Amount)
                            Log("首仓", "开多仓完成", "均价:", pos.Price, "数量:", pos.Amount);
                        }
                    } else {
                        pos = positions[0];
                        if (pos_amount != pos.Amount) {
                            _G(`pos_amount_${SymbolCoin}`, pos.Amount)
                            CancelNoSucessOrder(exchange, 'BUY')
                        }
                    }

                    let coin = pos.Info.symbol;//交易对
                    Counter.buy = _G(`${coin}_buy`) == null ? Counter.buy : _G(`${coin}_buy`);

                    let holdPrice = pos.Price;
                    let holdAmount = pos.Amount;
                    SymbolsEx.map((v, i) => {
                        if (v.symbol == coin) {
                            v.filters.map((v, i) => {
                                if (v.filterType == "PRICE_FILTER") {
                                    pricePrecision = GetStringDotAfterLenth(v.tickSize);
                                }
                            })
                        }
                    });
                    let coverPrice = _N(holdPrice * (1 + StopProfit), pricePrecision);//止盈
                    CoverPrice = coverPrice;
                    let isCz = false;//判断时间差
                    if (AddTimeDiff != null && TimeFn(AddTimeDiff).minutes < 1) {
                        isCz = true;
                    }
                    //有变动更新
                    if (pos_amount != pos.Amount) {
                        let coverId = null;
                        let msg = "持仓价: " + holdPrice + " 止盈价: " + coverPrice;
                        //设置止盈
                        for (let i = 0; i < 2; i++) {
                            if (coverId) {
                                break;
                            }
                            if (TradeType == ORDER_TYPE_BUY) {
                                exchange.SetDirection("closebuy");
                                coverId = exchange.Sell(coverPrice, holdAmount, msg);
                            } else {
                                exchange.SetDirection("closesell");
                                coverId = exchange.Buy(coverPrice, holdAmount, msg);
                            }
                        }
                        if (!coverId) {
                            Sleep(Interval)
                            positions = MyGetPosition(exchange);
                            _G(`pos_amount_${SymbolCoin}`, null)
                            if (positions <= 0) {
                                Log("已经止盈...")
                                continue;
                            } else {
                                throw "设置止盈失败";
                            }

                        }
                    }
                    //设置补仓止盈
                    let ticker = GetTicker(exchange);
                    let minPrice = 0;
                    if (!_G(`minprice_${coin}`)) {
                        _G(`minprice_${coin}`, pos.Price)
                        minPrice = pos.Price;
                    } else {
                        minPrice = Math.min(_G(`minprice_${coin}`), ticker.Last);
                        _G(`minprice_${coin}`, minPrice)
                    }
                    let lastAddCoinPrice = _G(`NewAddCoinprice`) == null ? pos.Price : _G(`NewAddCoinprice`)
                    FRate = CalculatorN(pos.Type, minPrice, lastAddCoinPrice, coin);
                    let sliceN = CalculatorSliceN(pos.Type, ticker.Last, minPrice, pos.Price, coin);
                    NRate = DownGoAddCoinRate(AddCoinRate);
                    NowBzjRate = _N(pos.Amount * ticker.Last / MarginLevel / OrgAccount.Balance, 4);
                    if (FRate < -(RepairRate * NRate)) {
                        //补仓回调 回调买入
                        if (sliceN >= RepairReturnRate) {
                            if (isCz) {
                                Log("1m内连续触发加仓...", TimeFn(AddTimeDiff).minutes);
                                AddCoinRate = AddCoinRate + 0.2;
                                _G(`NewAddCoinprice`, pos.Price)
                                Sleep(Interval);
                                continue;
                            }
                            if (NowBzjRate > OpRate) {
                                Log("持仓保证金大于最大资金使用率...", NowBzjRate, OpRate);
                                Sleep(Interval);
                                continue;
                            }
                            //市价补仓
                            let holdAmount = _N(pos.Amount * ReverseRate, quantityPrecision);
                            exchange.SetDirection("buy");
                            exchange.Buy(-1, holdAmount);
                            _G(`minprice_${coin}`, null)
                            _G(`NewAddCoinprice`, pos.Price)
                            let buyC = Counter.buy = Counter.buy + 1;
                            _G(`${coin}_buy`, buyC)
                            Log(coin, '加仓', buyC)
                            AddTimeDiff = new Date().getTime();
                        }
                    }
                    //止盈检查
                    if (holdAmount > 0) {
                        Profit = _N((CoverPrice - holdPrice) * holdAmount, 4);
                    }
                } else {
                    let seconds = new Date().getSeconds();
                    if (seconds % 55 == 0) {
                        Log('行情下跌,开启保命模式,不开单...', "#ffaa11")
                    }
                    Sleep(Interval * 2);
                }
            } else {
                let seconds = new Date().getSeconds();
                if (seconds % 55 == 0 && IsHaveLock) {
                    Log('当前无自动解仓功能,请去手动解仓...', "#FF0000")
                }
                Sleep(Interval * 2);
            }
            //划转
            if (OrgAccount.Info.totalMarginBalance > ToXh && ToXh > 0) {
                let amount = OrgAccount.Info.totalMarginBalance - ToXh;
                amount = _N(amount, 2);
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
            //打印持仓信息
            PrintStatus(positions, OrgAccount)
            Sleep(Interval)
        } catch (error) {
            Log('系统异常', error)
            Sleep(Interval)
            continue;
        }
    }
}
function main() {
    LogReset(1)
    OnTick()
}