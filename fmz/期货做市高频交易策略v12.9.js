// fmz@4a435ee9dd40becf36200b6f2c9a818c
/*
 * @Author: top.brids 
 * @Date: 2021-12-16 10:53:53 
 * @Last Modified by: top.brids
 * @Last Modified time: 2021-12-19 14:21:51
 * @Desc 
    ["ContractType","合约类型: 周|月|季","","$$$__list__$$$周|月|季|XBT"]
    ["MLevel","杠杆大小: 5倍|10倍|20倍","","$$$__list__$$$5倍|10倍|20倍"]
    ["DepthBuy","买单深度","",5]
    ["DepthSell","卖单深度","",5]
    ["Interval","出错重试间隔(毫秒)","",500]
    ["LoopInterval","轮询间隔(秒)","",2]
    ["SlidePrice","滑点","",0.01]
    ["MinDiff","盘口最小差价","",0.5]
    ["KeepStocksRate","保证金保留倍数","",true]
    ["Lot","开仓手数","",80]
    ["LotCover","平仓手数","",200]
    ["StopLoss","最大亏损波动(元)","",3]
    ["StopProfit","目标利润点(元)","",0.5]
    ["OpType","操作类型: 做多|做空|自动","","$$$__list__$$$做多|做空|自动"]
    ["EMA_Fast","EMA快线周期","",7]
    ["EMA_Slow","EMA慢线周期","",12]
    ["EMAInterval","EMA检测间隔(秒)","",50]
    ["WaitType","K线收集完成前: 做多|做空|等待","","$$$__list__$$$做多|做空|等待"]
    ["DisableLog","关闭订单跟踪","",false]
 */

let DO_IDLE = 0;
let DO_LONG = 1;
let DO_SHORT = 2;

let _MarginLevel = [5, 10, 20, 75][MLevel];
let _ContractType = ["week", "month", "quarter", "swap"][ContractType];
let _CurrentDirection = [DO_LONG, DO_SHORT, DO_IDLE][OpType != 2 ? OpType : WaitType];
let _isAuto = OpType == 2;
let _IsBitVC = false;
let _Is796 = false;
let _IsOKCoin = false;
let _MinAmount = 0;
let _Fee = 0.0003;

let LastOpenPrice = 0;
let LastCoverPrice = 0;
let LastHoldPrice = 0;
let LastRecord = null;
let LastEMATime = 0;
let _prePositions = 0;

function _N(v, precision) {
    if (typeof (precision) != 'number') {
        precision = _IsOKCoin ? 3 : 2;
    }
    let d = parseFloat(v.toFixed(Math.max(10, precision + 5)));
    s = d.toString().split(".");
    if (s.length < 2 || s[1].length <= precision) {
        return d;
    }

    let b = Math.pow(10, precision);
    return Math.floor(d * b) / b;
}

function GetOrders() {
    let orders = null;
    while (!(orders = exchange.GetOrders())) {
        Sleep(Interval);
    }
    return orders;
}

function CancelPendingOrders(orderType) {
    while (true) {
        let orders = GetOrders();
        let count = 0;
        if (typeof (orderType) != 'undefined') {
            for (let i = 0; i < orders.length; i++) {
                if (orders[i].Type == orderType) {
                    count++;
                }
            }
        } else {
            count = orders.length;
        }
        if (count == 0) {
            return;
        }

        for (let j = 0; j < orders.length; j++) {
            if (typeof (orderType) == 'undefined' || (orderType == orders[j].Type)) {
                exchange.CancelOrder(orders[j].Id, orders[j]);
                if (j < (orders.length - 1)) {
                    Sleep(Interval);
                }
            }
        }
    }
}

function GetPosition(orderType) {
    let positions;
    while (!(positions = exchange.GetPosition())) {
        Sleep(Interval);
    }
    for (let i = 0; i < positions.length; i++) {
        if (positions[i].ContractType == _ContractType && positions[i].Type == orderType) {
            return positions[i];
        }
    }
    return null;
}

function GetAccount() {
    let account;
    while (!(account = exchange.GetAccount())) {
        Sleep(Interval);
    }
    return account;
}


function GetDepth() {
    let depth;
    while (true) {
        depth = exchange.GetDepth();
        if (depth && depth.Asks.length > 0 && depth.Bids.length > 0 && depth.Asks[0].Price > depth.Bids[0].Price) {
            break;
        }
        Sleep(Interval);
    }
    return depth;
}

function GetDirection() {
    if (OpType != 2) {
        return _CurrentDirection;
    }
    let n = new Date().getTime();
    if ((n - LastEMATime) < (EMAInterval * 1000)) {
        return _CurrentDirection;
    }
    LastEMATime = n;

    let records = exchange.GetRecords();
    if (!records || records.length < (EMA_Slow + 3)) {
        return _CurrentDirection;
    }
    let newLast = records[records.length - 1];
    if ((!LastRecord) || (LastRecord.Time == newLast.Time && LastRecord.Close == newLast.Close)) {
        if (!LastRecord) {
            LastRecord = newLast;
        }
        return _CurrentDirection;
    }
    LastRecord = newLast;

    let emaFast = TA.EMA(records, EMA_Fast);
    let emaSlow = TA.EMA(records, EMA_Slow);
    return emaFast[emaFast.length - 1] >= emaSlow[emaSlow.length - 1] ? DO_LONG : DO_SHORT;
}

function GetPrice() {
    let buyPrice = 0;
    let buyAmount = 0;
    let sellPrice = 0;
    let sellAmount = 0;
    let depth = GetDepth();
    for (let i = 0; i < depth.Asks.length; i++) {
        sellAmount += depth.Asks[i].Amount;
        if (sellAmount >= DepthSell) {
            sellPrice = depth.Asks[i].Price;
            break;
        }
    }

    for (let i = 0; i < depth.Bids.length; i++) {
        buyAmount += depth.Bids[i].Amount;
        if (buyAmount >= DepthBuy) {
            buyPrice = depth.Bids[i].Price;
            break;
        }
    }

    let diff = MinDiff - (sellPrice - buyPrice);
    if (diff >= 0) {
        buyPrice = buyPrice - (diff / 2);
        sellPrice = sellPrice + (diff / 2);
    } else {
        buyPrice += SlidePrice;
        sellPrice -= SlidePrice;
    }
    return {
        buy: buyPrice,
        sell: sellPrice
    };
}

function updateProfit() {
    let account = GetAccount();
    let walletbalance = account.Info.totalWalletBalance;
    LogProfit(walletbalance);
}

function onTick() {
    let price = GetPrice();

    let openFunc = _CurrentDirection == DO_LONG ? exchange.Buy : exchange.Sell;
    let openDirection = _CurrentDirection == DO_LONG ? "buy" : "sell";
    let openTradeType = _CurrentDirection == DO_LONG ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;

    let coverFunc = _CurrentDirection == DO_LONG ? exchange.Sell : exchange.Buy;
    let coverDirection = _CurrentDirection == DO_LONG ? "closebuy" : "closesell";
    let coverTradeType = _CurrentDirection == DO_LONG ? ORDER_TYPE_SELL : ORDER_TYPE_SELL;

    let openPrice = _N(_CurrentDirection == DO_LONG ? price.buy : price.sell);
    let coverPrice = _N(_CurrentDirection == DO_LONG ? price.sell : price.buy);

    let op = 0;
    let isFighting = false;
    let marketCoverPrice = coverPrice;

    if (LastHoldPrice > 0 && LastCoverPrice > 0) {
        if (_CurrentDirection == DO_LONG) {
            isFighting = (LastHoldPrice - coverPrice) <= StopLoss;
            if (isFighting) {
                coverPrice = _N((LastHoldPrice * (1 + _Fee)) + StopProfit);
            }
        } else {
            isFighting = (coverPrice - LastHoldPrice) <= StopLoss;
            if (isFighting) {
                coverPrice = _N((LastHoldPrice * (1 - _Fee)) - StopProfit);
            }
        }
    }

    if (LastHoldPrice > 0) {
        LogStatus(_CurrentDirection == DO_LONG ? "多仓" : "空仓", isFighting ? "僵持中.." : "止损中..", "持仓均价: ", _N(LastHoldPrice), "盘口平仓价:", marketCoverPrice, isFighting ? "#0000ff" : "#ff0000");
    } else {
        LogStatus(_CurrentDirection == DO_LONG ? "做多" : "做空", "开仓价: ", openPrice, "平仓价:", marketCoverPrice, "抢盘中... #428bca");
    }

    if (openPrice != LastOpenPrice) {
        op = 1;
    }

    if (coverPrice != LastCoverPrice) {
        op = op == 0 ? 2 : 3;
    }

    if (op == 3) {
        CancelPendingOrders();
    } else if (op != 0) {
        CancelPendingOrders(op == 1 ? openTradeType : coverTradeType);
    } else {
        return;
    }

    let position = 0;
    let hold = GetPosition(openTradeType);
    if (hold) {
        position = hold.Amount;
        LastHoldPrice = hold.Price;
    } else {
        LastHoldPrice = 0;
    }

    let coverAmount = Math.max(_N(LotCover), position);
    if ((op == 2 || op == 3) && (coverAmount >= _MinAmount)) {
        exchange.SetDirection(coverDirection);
        if (coverFunc(coverPrice, coverAmount, "上次平仓价格", LastCoverPrice) > 0) {
            LastCoverPrice = coverPrice;
        }
    }

    if (position == 0 && _prePositions != 0) {
        updateProfit();
        _prePositions = 0;
    }

    let d = GetDirection();
    if (_prePositions == 0) {
        _prePositions = position;
    }
    if (_isAuto) {
        if (d != _CurrentDirection) {
            if (position == 0 && GetOrders().length == 0) {
                Log(d == DO_LONG ? "开始做多" : "开始做空");
                _CurrentDirection = d;
            }
            return;
        }
    }
    let openAmount = Lot;
    if ((op == 1 || op == 3) && (openAmount >= _MinAmount)) {
        exchange.SetDirection(openDirection);
        if (openFunc(openPrice, openAmount, "上次建仓价格", LastOpenPrice) > 0) {
            LastOpenPrice = openPrice;
        }
    }
}

function onexit() {
    CancelPendingOrders();
    Log("Exit");
}

function main() {
    let eName = exchange.GetName();
    if (eName.indexOf("Futures") == -1) {
        throw "该策略为期货专用策略";
    }
    if (_IsOKCoin && _MarginLevel == 5) {
        throw "OKCoin期货只支持10倍或20倍杠杆";
    }
    if (DisableLog) {
        EnableLog(false);
    }

    _IsBitVC = eName.indexOf("BitVC") != -1;
    _Is796 = eName.indexOf("796") != -1;
    _IsOKCoin = eName.indexOf("OKCoin") != -1;

    if (_IsBitVC) {
        _MinAmount = 100;
    } else if (_IsOKCoin) {
        _MinAmount = 1;
    } else {
        _MinAmount = exchange.GetMinStock();
    }

    Log(exchange.GetName(), GetAccount());
    CancelPendingOrders();
    LoopInterval = Math.max(LoopInterval, 1);
    EMAInterval = Math.max(EMAInterval, 1);
    if (_IsBitVC || _IsOKCoin) {
        Lot = parseInt(Math.max(1, Lot));
        LotCover = parseInt(Math.max(1, LotCover));
        if (Lot < 1 || LotCover < 1) {
            throw "手数最少为1, BitVC一手相当于100元人民币, OKCoin相当于10美金.";
        }
    }

    if (_IsOKCoin && ContractType == 0) {
        _ContractType = "this_week";
    }
    if (!_IsOKCoin && ContractType == 1) {
        throw "只有OKCoin期货支持月全约";
    }
    if (_Is796 && ContractType != 0) {
        throw "796只支持周合约类型";
    }
    exchange.SetContractType(_ContractType);
    exchange.SetMarginLevel(_MarginLevel);
    if (OpType == 2) {
        Log("开始收集K线信息, 请耐心等待.");
    }
    while (true) {
        if (_CurrentDirection == DO_IDLE) {
            _CurrentDirection = GetDirection();
        } else {
            onTick();
        }
        Sleep(LoopInterval * 1000);
    }
}