
let FirstTradeType = [ORDER_TYPE_BUY, ORDER_TYPE_SELL, "ORDER_TYPE_BUY_SELL"][OpType];
let OrgAccount = null;
let Counter = { s: 0, f: 0 };
let AddCounter = { buy: 0, sell: 0 };
let LastProfit = 0;
let AllProfit = 0;
let _Failed = 0;
let OpAmount = 0;//开仓数量
let ReverseRate = 1;//加仓倍数
let StopLoss = 0.005;//补仓百分比

let Ct = "swap"//合约类型
let addTimeDiff = null;//加仓时间

let TVMessage = null;//TV信号

function StripOrders(e, orderId) {
    let order = null;
    if (typeof (orderId) == 'undefined') {
        orderId = null;
    }
    while (true) {
        let dropped = 0;
        let orders = _C(e.GetOrders);
        for (let i = 0; i < orders.length; i++) {
            if (orders[i].Id == orderId) {
                order = orders[i];
            } else {
                let extra = "";
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
        if (dropped == 0) {
            break;
        }
        Sleep(300);
    }
    return order;
}


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

function StripOrdersNoCancel(e, orderId, orderType) {
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
            if (orders[i].Info.side == orderType && orders[i].Info.positionSide == positionSide) {
                if (orders[i].Id == orderId) {
                    order = orders[i];
                } else {
                    if (orders[i].DealAmount > 0) {
                        extra = "成交: " + orders[i].DealAmount;
                    } else {
                        extra = "未成交";
                    }
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


let preMsg = "";
function GetAccount(e, waitFrozen) {
    if (typeof (waitFrozen) == 'undefined') {
        waitFrozen = false;
    }
    let account = _C(e.GetAccount);
    msg = "成功: " + Counter.s + " 次, 失败: " + Counter.f + " 次, 当前账户 币: " + account.Balance;
    if (account.FrozenStocks > 0) {
        msg += " 冻结的币: " + account.FrozenStocks;
    }
    if (msg != preMsg) {
        preMsg = msg;
        LogStatus(msg, "#ff0000");
    }
    return account;
}

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
    return null;
}

function MyGetPositionAmount(e, orderType) {
    let positions = e.GetPosition();
    if (typeof (orderType) == 'undefined') {
        return positions.Amount;
    }
    for (let i = 0; i < positions.length; i++) {
        if (positions[i].Type == orderType) {
            return positions[i].Amount;
        }
    }
    return null;
}

function GetTicker(e) {
    while (true) {
        let ticker = _C(e.GetTicker);
        if (ticker.Buy > 0 && ticker.Sell > 0 && ticker.Sell > ticker.Buy) {
            return ticker;
        }
        Sleep(100);
    }
}

function Trade(e, tradeType, tradeAmount, mode, slidePrice, maxSpace, retryDelay) {
    let initPosition = MyGetPosition(e, tradeType);
    let nowPosition = initPosition;
    let orderId = null;
    let prePrice = 0;
    let dealAmount = 0;
    let isFirst = true;
    let tradeFunc = tradeType == ORDER_TYPE_BUY ? e.Buy : e.Sell;
    let isBuy = tradeType == ORDER_TYPE_BUY;
    while (true) {
        let ticker = GetTicker(e);
        let tradePrice = 0;
        if (isBuy) {
            tradePrice = _N((mode == 0 ? ticker.Sell : ticker.Buy) + slidePrice, 4);
        } else {
            tradePrice = _N((mode == 0 ? ticker.Buy : ticker.Sell) - slidePrice, 4);
        }
        if (orderId == null) {
            if (isFirst) {
                isFirst = false;
            } else {
                nowPosition = MyGetPosition(e, tradeType);
            }
            dealAmount = _N((nowPosition && nowPosition != null ? nowPosition.Amount : 0) - (initPosition && initPosition != null ? initPosition.Amount : 0), 6);
            let doAmount = tradeAmount - dealAmount;
            if (doAmount < MinStock) {
                break;
            }
            prePrice = tradePrice;
            e.SetDirection(tradeType == ORDER_TYPE_BUY ? "buy" : "sell");
            orderId = tradeFunc(tradePrice, doAmount);
        } else {
            if (mode == 0 || Math.abs(tradePrice - prePrice) > maxSpace) {
                orderId = null;
            }
            if (FirstTradeType == "ORDER_TYPE_BUY_SELL") {
                let strTradeType = tradeType == ORDER_TYPE_BUY ? "BUY" : "SELL";
                let order = StripOrdersNoCancel(exchange, orderId, strTradeType);
                if (order == null) {
                    orderId = null;
                }
            } else {
                let order = StripOrders(exchange, orderId);
                if (order == null) {
                    orderId = null;
                }
            }

        }
        Sleep(retryDelay);
    }

    if (dealAmount <= 0 && nowPosition == null) {
        return null;
    }
    return nowPosition;
}

function coverFutures(e, orderType) {
    let coverAmount = 0;
    while (true) {
        let positions = _C(e.GetPosition);
        let ticker = GetTicker(e);
        let found = 0;
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].Type == orderType) {
                if (coverAmount == 0) {
                    coverAmount = positions[i].Amount;
                }
                if (positions[i].Type == ORDER_TYPE_BUY) {
                    e.SetDirection("closebuy");
                    e.Sell(ticker.Buy, positions[i].Amount);
                } else {
                    e.SetDirection("closesell");
                    e.Buy(ticker.Sell, positions[i].Amount);
                }
                found++;
            }
        }
        if (found == 0) {
            break;
        }
        Sleep(Interval);
        StripOrders(e);
    }
    return coverAmount;
}

function timeFn(d1) {//di作为一个变量传进来
    //如果时间格式是正确的，那下面这一步转化时间格式就可以不用了
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
function _ComputerBuyOrSellCount(totalAmount) {
    let count = 0;
    let _totalAmount = OpAmount;
    while (_totalAmount < totalAmount) {
        if (count <= MaxLoss / 3) {
            ReverseRate = OneRate.split("&")[1];
            _totalAmount += ReverseRate * _totalAmount;
        } else if (count > MaxLoss / 3 && count <= (MaxLoss * 2 / 3)) {
            ReverseRate = TwoRate.split("&")[1];
            _totalAmount += ReverseRate * _totalAmount;
        } else {
            ReverseRate = ThreeRate.split("&")[1];
            _totalAmount += ReverseRate * _totalAmount;
        }
        if (_totalAmount == 0) {
            break;
        }
        if (_totalAmount <= totalAmount) {
            count++;
        }

    }
    return count;
}
//更具持仓算加仓次数
function ComputerBuyOrSellCount(pos) {
    let count = _ComputerBuyOrSellCount(pos.Amount);
    if (pos.Type == ORDER_TYPE_BUY) {
        AddCounter.buy = count;
        Log("当前多仓持有:", pos.Amount, "张", " 多仓加仓次数:" + AddCounter.buy, "#32CD32")
    } else {
        AddCounter.sell = count;
        Log("当前空仓持有:", pos.Amount, "张", " 空仓加仓次数:" + AddCounter.sell, "#32CD32")
    }
}
//计算当前价与持仓加比率 超过7% 启动移动止盈  低于50% 止损
function CalculatorN(type, nowPrice, myPrice, coin) {
    let rate = 0;
    if (type == ORDER_TYPE_BUY) {
        rate = (nowPrice - myPrice) * MarginLevel / myPrice;
        rate = _N(rate, 4);
        Log(`${coin} =>当前价与持仓加比率 =>`, "当前价:", nowPrice, "持仓价:", myPrice, "盈亏比率:", _N(rate * 100, 4), "%", "#32CD32");
    } else {
        rate = (nowPrice - myPrice) * MarginLevel / myPrice * -1;
        rate = _N(rate, 4);
        Log(`${coin} =>当前价与持仓加比率 =>`, "当前价:", nowPrice, "持仓价:", myPrice, "盈亏比率:", _N(rate * 100, 4), "%", "#FF0000");
    }
    return rate;
}
function loop(pos) {
    let tradeType = null;
    if (FirstTradeType == "ORDER_TYPE_BUY_SELL") {
        let cmd = GetCommand();// 监听TV信号
        if (cmd && TVMessage == null) {
            let arr = cmd.split(":")
            if (arr.length != 2) {
                Log("TV信号1有误：", cmd, "#FF0000")
            }
            let action = arr[1];
            let coin = arr[0];
            //单信号 信号不对不开单
            let contractType = exchange.SetContractType(Ct);
            if (coin != contractType.instrument) {
                //无信号不开单
                Log("TV信号1与监听交易所不匹配：", cmd, "#FF0000")
                return null;
            }
            TVMessage = tradeType = action == "buy" ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
            Log("1.", cmd, "#FF0000")
        } else {
            if (TVMessage == null) {
                //无信号不开单
                return null;
            }
            //循环老信号
            tradeType = TVMessage;
            //判断该方向有没有持仓
            let positions = [];
            positions = MyGetPosition(exchange);
            for (let i = 0; i < positions.length; i++) {
                //重算开仓次数
                ComputerBuyOrSellCount(positions[i]);
                if (positions[i].Type == TVMessage) {
                    pos = positions[i];
                    //撤销当前未成交委托单
                    let strTradeType = tradeType == ORDER_TYPE_BUY ? "BUY" : "SELL";
                    CancelNoSucessOrder(exchange, strTradeType);
                    Sleep(300);
                } else {
                    if (StopLossProfit > 0) {
                        //亏损率
                        let ticker = GetTicker(exchange);
                        let rate = CalculatorN(positions[i].Type, ticker.Last, positions[i].Price, positions[i].Info.symbol);
                        if (rate <= -StopLossProfit) {
                            //平掉反向单
                            coverFutures(exchange, positions[i].Type);
                        }
                    }
                }
            }
        }
    }
    //K周期--矫正方向
    let period = exchange.GetPeriod();
    let _coin = `DOGEUSDT_${period / 60}`;
    let info = HttpQuery(`https://swordsman.mbmmbm.com//api/getActionByCoin?coin=${_coin}`)
    if (info != 404) {
        let _romoteMessage = info == "buy" ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
        if (_romoteMessage != TVMessage) {
            TVMessage = _romoteMessage;
            Log("同步信号", _romoteMessage, "#FF0000")
        }
    }

    if (typeof (pos) == 'undefined' || !pos) {
        tradeType = FirstTradeType == "ORDER_TYPE_BUY_SELL" ? tradeType : FirstTradeType;
        pos = Trade(exchange, tradeType, OpAmount, OpMode, SlidePrice, MaxSpace, Interval);
        ComputerBuyOrSellCount(pos);
        addTimeDiff = new Date().getTime();
        if (!pos) {
            throw "出师不利, 开仓失败";
        } else {
            Log(tradeType == ORDER_TYPE_BUY ? "开多仓完成" : "开空仓完成", "均价:", pos.Price, "数量:", pos.Amount);
        }
    } else {
        tradeType = pos.Type;
    }

    let holdPrice = pos.Price;
    let holdAmount = pos.Amount;

    let reversePrice = 0;//止损
    let coverPrice = 0;//止盈
    let isCz = false;
    //判断时间差
    if (addTimeDiff != null && timeFn(addTimeDiff).seconds <= 30) {
        isCz = true;
    }

    if (tradeType == ORDER_TYPE_BUY) {
        if (AddCounter.buy <= MaxLoss / 3) {
            ReverseRate = OneRate.split("&")[1];
            StopLoss = OneRate.split("&")[0];
        } else if (AddCounter.buy > MaxLoss / 3 && AddCounter.buy <= (MaxLoss * 2 / 3)) {
            ReverseRate = TwoRate.split("&")[1];
            StopLoss = TwoRate.split("&")[0];

        } else {
            ReverseRate = ThreeRate.split("&")[1];
            StopLoss = ThreeRate.split("&")[0];
        }
        reversePrice = _N(holdPrice * (1 - StopLoss), 4);//补仓率
        coverPrice = _N(holdPrice * (1 + StopProfit), 4);
    } else {
        if (AddCounter.sell <= (MaxLoss / 3)) {
            ReverseRate = OneRate.split("&")[1];
            StopLoss = OneRate.split("&")[0];
        } else if (AddCounter.sell > (MaxLoss / 3) && AddCounter.sell <= (MaxLoss * 2 / 3)) {
            ReverseRate = TwoRate.split("&")[1];
            StopLoss = TwoRate.split("&")[0];

        } else {
            ReverseRate = ThreeRate.split("&")[1];
            StopLoss = ThreeRate.split("&")[0];
        }
        let _a1 = 1 + parseFloat(StopLoss);
        let _a2 = 1 - parseFloat(StopProfit);
        reversePrice = _N(holdPrice * _a1, 4);
        coverPrice = _N(holdPrice * _a2, 4);
    }

    let coverId = null;
    let msg = "持仓价: " + holdPrice + " 补仓价: " + reversePrice + " 止盈价: " + coverPrice //" 多仓加仓次数:" + AddCounter.buy + " 空仓加仓次数:" + AddCounter.sell; + " 多仓张数:" + buyAmount + " 空仓张数:" + sellAmount;

    //设置止盈
    for (let i = 0; i < 10; i++) {
        if (coverId) {
            break;
        }
        if (tradeType == ORDER_TYPE_BUY) {
            exchange.SetDirection("closebuy");
            coverId = exchange.Sell(coverPrice, holdAmount, msg);
        } else {
            exchange.SetDirection("closesell");
            coverId = exchange.Buy(coverPrice, holdAmount, msg);
        }
        Sleep(Interval);
    }
    if (!coverId) {
        StripOrders(exchange);
        throw "下单失败";
    }
    while (true) {
        Sleep(Interval);
        //尝试解决信号阻塞问题
        if (FirstTradeType == "ORDER_TYPE_BUY_SELL") {
            let cmd = GetCommand();// TV信号
            if (cmd) {
                let arr = cmd.split(":")
                if (arr.length != 2) {
                    Log("TV信号2信息有误：", cmd, "#FF0000")
                }
                let action = arr[1];
                let coin = arr[0];
                //单信号 信号不对不开单
                let contractType = exchange.SetContractType(Ct);
                if (coin != contractType.instrument) {
                    //无信号不开单
                    // Log("TV信号2与监听交易所不匹配：", cmd, "#FF0000")
                } else {
                    TVMessage = tradeType = action == "buy" || action == "strong-sell" ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
                    Log("2.", cmd, tradeType, "#FF0000");
                    break;
                }
            }
        }
        let ticker = GetTicker(exchange);
        if ((tradeType == ORDER_TYPE_BUY && ticker.Last < reversePrice) || (tradeType == ORDER_TYPE_SELL && _N(ticker.Last, 4) > reversePrice)) {
            let coverAmount = MyGetPositionAmount(exchange, tradeType);
            let reverseAmount = _N(coverAmount * ReverseRate, 4);
            reverseAmount = parseInt(reverseAmount);
            let reverseType = tradeType;
            //
            if (isCz) {
                Log("1分钟内连续触发加仓...");
                break;
            }
            //计算加仓次数
            if (tradeType == ORDER_TYPE_BUY) {
                AddCounter.buy++;
                if (AddCounter.buy > MaxLoss) {
                    Counter.f++;
                    Log("超过最大失败次数", MaxLoss);
                    break;
                }
            } else {
                AddCounter.sell++;
                if (AddCounter.sell > MaxLoss) {
                    Counter.f++;
                    Log("超过最大失败次数", MaxLoss);
                    break;
                }
            }
            //加仓时间记录
            addTimeDiff = new Date().getTime();
            let _reverseType = ""
            //是否及时反向
            if (ReverseMode) {
                let _flag = false;
                if (tradeType == ORDER_TYPE_BUY && AddCounter.buy == MaxLoss - 1) {
                    _flag = true;
                } else if (tradeType == ORDER_TYPE_SELL && AddCounter.sell == MaxLoss - 1) {
                    _flag = true;
                } else {
                    _flag = false;
                }
                if (_flag) {
                    //查看持仓 加仓 重算价格
                    _reverseType = tradeType == ORDER_TYPE_BUY ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
                    let _reverseAmount = MyGetPositionAmount(exchange, _reverseType);
                    if (_reverseAmount == null) {
                        _reverseAmount = reverseAmount;
                    }
                    let _count = 0;
                    if (_reverseType == ORDER_TYPE_BUY) {
                        _count = AddCounter.buy;
                    } else {
                        _count = AddCounter.sell;
                    }
                    if (_count < MaxLoss && _reverseAmount < reverseAmount) {
                        let _pos = Trade(exchange, _reverseType, _reverseAmount, OpMode, SlidePrice, MaxSpace, Interval);
                        if (_pos) {
                            Log(_reverseType == ORDER_TYPE_BUY ? "多仓" : "空仓", "反仓开仓完成", "#6600aa");
                            ComputerBuyOrSellCount(_pos);
                            let strTradeType = _pos.Type == ORDER_TYPE_BUY ? "BUY" : "SELL";
                            ComputerBuyOrSellCount(_pos);
                            CancelNoSucessOrder(exchange, strTradeType);
                            let _holdPrice = _pos.Price;
                            let _holdAmount = _pos.Amount;
                            if (_reverseType == ORDER_TYPE_BUY) {
                                let _a1 = 1 + parseFloat(StopProfit);
                                coverPrice = _N(_holdPrice * _a1, 4);
                                let _msg1 = "持仓价: " + _holdPrice + " 止盈价: " + coverPrice;
                                exchange.SetDirection("closebuy");
                                exchange.Sell(coverPrice, _holdAmount, "锁仓:多", _msg1, "#6600aa");
                            } else {
                                let _a2 = 1 - parseFloat(StopProfit);
                                coverPrice = _N(_holdPrice * _a2, 4);
                                let _msg2 = "持仓价: " + _holdPrice + " 止盈价: " + coverPrice;
                                exchange.SetDirection("closesell");
                                exchange.Buy(coverPrice, _holdAmount, "锁仓:空", _msg2, "#6600aa");
                            }
                        }
                    }
                }
            }

            let pos = Trade(exchange, reverseType, reverseAmount, OpMode, SlidePrice, MaxSpace, Interval);
            if (pos) {
                Log(reverseType == ORDER_TYPE_BUY ? "多仓" : "空仓", "加倍开仓完成");
            }
            return pos;
        } else {
            let orders = _C(exchange.GetOrders);
            if (FirstTradeType == "ORDER_TYPE_BUY_SELL") {
                let positionSide = tradeType == ORDER_TYPE_BUY ? "LONG" : "SHORT";
                let flag = 0;
                for (let index = 0; index < orders.length; index++) {
                    if (orders[index].Info.positionSide == positionSide) {
                        flag = 1;
                    }
                }
                if (flag == 0) {
                    Counter.s++;
                    //清除计时器
                    if (tradeType == ORDER_TYPE_BUY) {
                        AddCounter.buy = 0;
                    } else {
                        AddCounter.sell = 0;
                    }
                    let account = GetAccount(exchange, true);
                    LogProfit(account.Balance);
                    break;
                }
            } else {
                if (orders.length == 0) {
                    Counter.s++;
                    let account = GetAccount(exchange, true);
                    LogProfit(account.Balance);
                    break;
                }
            }
        }
    }
    return null;
}

function onexit() {
    Log("Exit");
}


//算首仓
function FrisCreateOrder(assets, lastprice, coin) {
    //总下单张数
    let amount = assets * OpRate * MarginLevel / lastprice;
    amount = _N(amount, 4)
    let count = 1;
    for (let i = 1; i <= MaxLoss; i++) {
        if (i <= MaxLoss / 3) {
            ReverseRate = OneRate.split("&")[1];
            count += ReverseRate * count;
        } else if (i > MaxLoss / 3 && i <= (MaxLoss * 2 / 3)) {
            ReverseRate = TwoRate.split("&")[1];
            count += ReverseRate * count;
        } else {
            ReverseRate = ThreeRate.split("&")[1];
            count += ReverseRate * count;
        }
    }
    //获取该币精度
    let quantityPrecision = 0;
    let sysbomls = exchange.IO("api", "GET", "/fapi/v1/exchangeInfo", "", "");
    if (sysbomls != '' && sysbomls != undefined) {
        let symbolsEx = sysbomls.symbols;
        symbolsEx.map((v, i) => {
            if (v.symbol == coin) {
                quantityPrecision = v.quantityPrecision;
            }
        });
    }

    OpAmount = amount / count;
    OpAmount = _N(OpAmount, quantityPrecision)
    Log("下单最大张数", amount, "首仓张数", OpAmount, "总加仓次数", MaxLoss, "加仓倍数", count, "#32CD32");
    return OpAmount;
}

function main() {
    // 清空日志，如不需要，可以删除
    LogReset(1)
    let eName = exchange.GetName()
    let patt = /Futures_/;
    let contractType = "";
    if (patt.test(eName)) {
        Log("添加的交易所为期货交易所：", eName, "#FF0000")
        if (Ct == "") {
            //
            throw "Ct 合约设置为空"
        } else {
            contractType = exchange.SetContractType(Ct)
            Log(contractType.InstrumentID, "设置合约：", Ct, "#FF0000")
        }
    } else {
        Log("添加的交易所为现货交易所：", eName, "#32CD32")
    }
    StopProfit /= 100;
    Interval *= 1000;
    SetErrorFilter("502:|503:|unexpected|network|timeout|WSARecv|Connect|GetAddr|no such|reset|http|received|EOF");
    OrgAccount = GetAccount(exchange, true);
    exchange.SetMarginLevel(MarginLevel);
    Log("启动成功", "杠杆", MarginLevel, "频率", Interval, "#32CD32");
    //首仓预算
    let ticker = GetTicker(exchange);
    FrisCreateOrder(OrgAccount.Balance, ticker.Last, contractType.InstrumentID);

    let pos = null;
    let positions = [];
    positions = MyGetPosition(exchange);
    if (positions.length == 1) {
        pos = positions[0];
        ComputerBuyOrSellCount(pos);
        Log("发现一个仓位, 等信号出现开单...");
    } else if (positions.length > 1) {
        for (let i = 0; i < positions.length; i++) {
            pos = positions[i];
            ComputerBuyOrSellCount(pos)
        }
        Log(`发现${positions.length}个仓位,等信号出现开单...`);
    }
    while (true) {
        pos = loop(pos);
        if (!pos) {
            _Failed = 0;
        } else {
            _Failed++;
        }
        Sleep(Interval);
    }
}
