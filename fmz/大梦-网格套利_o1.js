/*
 * @Author: topbrids@gmail.com 
 * @Date: 2022-06-07 18:45:07 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2022-08-19 12:37:29
 */
//1
let FmzCallTg = 'https://t.me/aelf_china'
let s_0 = ''
let s0 = ''
let s_1 = ''
let s1 = ''
let symbol1_2 = '';
let brokerId = 'WcsXtG5x';
let totalIncome = 0;
let gridRate = 0.001;
let interval = '5m'
let long_1 = null;
let short_1 = null;
let long_2 = null;
let short_2 = null;
let pos = {};
let nowPrice = 0;
let tmpData = {};
//====
let backRate = 0.01;
let nowPosAmount = 0;
let qk = 0;
let qk2 = "";

let symbolInfo = {};
let priceInfo = {};
let qInfo = {};
let gInfo = {};
let pInfo = {};
let pInfo1 = {};
let onPftData1 = 0;
let onPftData2 = 0;
let gc1 = {};
let gc2 = {};
let symbolQs = {};
let ndgcInfo = {};
let loop_start2 = Date.now();
let upB = 0;
let mB = 0;
let downB = 0;

let exFee = 0.04 * 0.01;
let tickerLast = 0;
let fees = 0;
let feesL = 0;
let feesS = 0;
let curRate = 0;//补仓资金费率

let isOk = false;
let isBinance = false;
let SymbolsEx = [];
let button0 = [];
let button1 = [];
let stoplist = [];
let listpft = [];
let listpft2 = [];
let grid1 = [];
let grid2 = [];
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
let pft2 = 0;
let ir = 0;
let quantityPrecision = 0;
let pricePrecision = 0;

function uuid(len, radix) {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid = [],
        i;
    radix = radix || chars.length;
    if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        let r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}
function _zeros(len) {
    let n = [];
    for (let i = 0; i < len; i++) {
        n.push(0.0);
    }
    return n;
}
/**
* SAR 抛物线指标 标识趋势 以及 趋势反转 TA.SAR(数据,加速步长,最大加速因子) 默认为(0.02,0.2)。
* @param {*} records 
* @param {*} accelerationStep
* @param {*} maxAccelerationFactor
* @returns 
*/
const SAR = (records, accelerationStep, maxAccelerationFactor) => {
    accelerationStep = typeof (accelerationStep) === 'undefined' ? 0.02 : accelerationStep;
    maxAccelerationFactor = typeof (maxAccelerationFactor) === 'undefined' ? 0.2 : maxAccelerationFactor;
    let length = records.length;
    let results = Std._zeros(length);
    let q0 = "";
    if (length == 0) {
        return results;
    } else {
        q0 = records[0]
    }
    let accelerationFactor = accelerationStep;
    let extremePoint = q0.High;
    let priorSar = q0.Low;
    let isRising = true;
    for (let i = 0; i < length; i++) {
        let q = records[i];
        if (isRising) {
            let sar = priorSar + (accelerationFactor * (extremePoint - priorSar));
            // SAR cannot be higher than last two lows
            if (i >= 2) {
                let minLastTwo = Math.min(records[i - 1].Low, records[i - 2].Low);
                sar = Math.min(sar, minLastTwo);
            }
            //turn down
            if (q.Low < sar) {
                results[i] = extremePoint;
                isRising = false;
                accelerationFactor = accelerationStep;
                extremePoint = q.Low;
            } else {
                results[i] = sar;
                // new high extreme point
                if (q.High > extremePoint) {
                    extremePoint = q.High;
                    accelerationFactor = Math.min(accelerationFactor + accelerationStep, maxAccelerationFactor)
                }
            }
        } else {
            //was fail
            let sar = priorSar - (accelerationFactor * (priorSar - extremePoint));
            // SAR cannot be lower than last two highs
            if (i >= 2) {
                let maxLastTwo = Math.max(records[i - 1].High, records[i - 2].High);
                sar = Math.max(sar, maxLastTwo);
            }
            // turn up
            if (q.High > sar) {
                results[i] = extremePoint;
                isRising = true;
                accelerationFactor = accelerationStep;
                extremePoint = q.High;
            }
            // continue falling
            else {
                results[i] = sar;
                // new low extreme point
                if (q.Low < extremePoint) {
                    extremePoint = q.Low;
                    accelerationFactor = Math.min(accelerationFactor + accelerationStep, maxAccelerationFactor);
                }
            }
        }
        priorSar = results[i];
    }
    return results;
}
function Buy(symbol, amount) {
    let ret = exchange.IO("api", "POST", "/fapi/v1/order", `symbol=${symbol}&side=BUY&positionSide=LONG&type=MARKET&quantity=${amount}&newClientOrderId=x-${brokerId}_${uuid(16)}`)
    if (ret == undefined || ret == null) {
        return ''
    }
    let sideAndPos = '';
    if (ret.positionSide == 'LONG') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入开多'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出平多'
        }
    }
    if (ret.positionSide == 'SHORT') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入平空'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出开空'
        }
    }
    let origType = ret.origType == 'MARKET' ? '市价' : '限价';
    Log(`${ret.symbol} | ${origType} | 数量:${ret.origQty} | ${sideAndPos}  #32CD32`);
    LogProfit(pft2)
    return ret;
}
function BuyClose(symbol, amount) {
    let ret = exchange.IO("api", "POST", "/fapi/v1/order", `symbol=${symbol}&side=SELL&positionSide=LONG&type=MARKET&quantity=${amount}&newClientOrderId=x-${brokerId}_${uuid(16)}`)
    if (ret == undefined || ret == null) {
        return ''
    }
    let sideAndPos = '';
    if (ret.positionSide == 'LONG') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入开多'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出平多'
        }
    }
    if (ret.positionSide == 'SHORT') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入平空'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出开空'
        }
    }
    let origType = ret.origType == 'MARKET' ? '市价' : '限价';
    Log(`${ret.symbol} | ${origType} | 数量:${ret.origQty} | ${sideAndPos}  #32CD32`);
    LogProfit(pft2)
    return ret;
}
function Sell(symbol, amount) {
    let ret = exchange.IO("api", "POST", "/fapi/v1/order", `symbol=${symbol}&side=SELL&positionSide=SHORT&type=MARKET&quantity=${amount}&newClientOrderId=x-${brokerId}_${uuid(16)}`)
    if (ret == undefined || ret == null) {
        return ''
    }
    let sideAndPos = '';
    if (ret.positionSide == 'LONG') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入开多'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出平多'
        }
    }
    if (ret.positionSide == 'SHORT') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入平空'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出开空'
        }
    }
    let origType = ret.origType == 'MARKET' ? '市价' : '限价';
    Log(`${ret.symbol} | ${origType} | 数量:${ret.origQty} | ${sideAndPos}  #FF0000`);
    LogProfit(pft2)
    return ret;
}
function SellClose(symbol, amount) {
    let ret = exchange.IO("api", "POST", "/fapi/v1/order", `symbol=${symbol}&side=BUY&positionSide=SHORT&type=MARKET&quantity=${amount}&newClientOrderId=x-${brokerId}_${uuid(16)}`)
    if (ret == undefined || ret == null) {
        return ''
    }
    let sideAndPos = '';
    if (ret.positionSide == 'LONG') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入开多'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出平多'
        }
    }
    if (ret.positionSide == 'SHORT') {
        if (ret.side == 'BUY') {
            sideAndPos = '买入平空'
        }
        if (ret.side == 'SELL') {
            sideAndPos = '卖出开空'
        }
    }
    let origType = ret.origType == 'MARKET' ? '市价' : '限价';
    Log(`${ret.symbol} | ${origType} | 数量:${ret.origQty} | ${sideAndPos}  #FF0000`);
    LogProfit(pft2)
    return ret;
}
//binance
function RefBinance() {
    let data = {}
    acc = []
    for (let i = 0; i < exchanges.length; i++) {
        exchanges[i].SetContractType('swap');
        let coin = '';
        let coin1 = _C(exchanges[i].GetCurrency);
        coin = coin1.split('_')[0] + coin1.split('_')[1];
        let ticker = _C(exchanges[i].GetTicker)
        SymbolsEx.map((v, i) => {
            if (v.symbol == coin) {
                quantityPrecision = v.quantityPrecision;
            }
        });
        if (IsFl) {
            P0 = P1 * _N(Number(account1.Info.totalWalletBalance), 2);
        }
        n1 = _N(P0 / ticker.Last, quantityPrecision)
        let msg = ''
        if (n1 <= 0) {
            msg = `${coin},当前下单面值可开单个数${n1}`
        }
        //网格数量
        data[`g${i}`] = _N(Gp / ticker.Last, quantityPrecision)
        // Log(coin, n1, '底仓下单价值', P0, 'U', '数量', n1)
        acc.push(n1)
        _G('acc', acc)
    }
    return data;
}
function RefBinance1() {
    let data = {}
    acc = []
    for (let i = 0; i < exchanges.length; i++) {
        exchanges[i].SetContractType('swap');
        let coin = '';
        let coin1 = _C(exchanges[i].GetCurrency);
        coin = coin1.split('_')[0] + coin1.split('_')[1];
        let ticker = _C(exchanges[i].GetTicker)
        SymbolsEx.map((v, i) => {
            if (v.symbol == coin) {
                quantityPrecision = v.quantityPrecision;
            }
        });
        if (IsFl) {
            P0 = P1 * _N(Number(account1.Info.totalWalletBalance), 2);
        }
        n1 = _N(P0 / ticker.Last, quantityPrecision)
        if (n1 <= 0) {
            msg = `${coin},当前下单面值可开单个数${n1}`
        }
        //网格数量
        data[`g${i}`] = _N(Gp / ticker.Last, quantityPrecision)
        Log(coin, n1, '底仓下单价值', P0, 'U', '数量', n1)
        acc.push(n1)
        _G('acc', acc)
    }
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
    let fee = _N(lsAmount * exFee, 4);

    pft = _N((parseFloat(walletbalance) + parseFloat(unrealizedProfit) + parseFloat(toxh) - parseFloat(toHy)), 6);
    pft2 = _N((parseFloat(walletbalance) - parseFloat(init_Balance) + parseFloat(toxh) - parseFloat(toHy)), 6);
    //table2内容, USDT
    let NOWTime = _D() //当前时间
    let profit_ratio = 0
    if (init_Balance != 0) {
        profit_ratio = ((parseFloat(walletbalance) + toxh - toHy - parseFloat(init_Balance)) / parseFloat(init_Balance)) * 100
    }

    ///两个表格的选项
    let tab0 = {
        "type": "table",
        "title": "NDGC",
        "cols": ["累计充值/收入", "累计消费", "余额"],
        "rows": []
    }
    let tab1 = {
        "type": "table",
        "title": "账户信息",
        "cols": ["初始资金", "钱包余额", "保证金余额", "划转到现货", "划转到合约", "总利润", "总收益率", "交易流水", "手续费"],
        "rows": []
    }
    let tabc = {
        "type": "table",
        "title": "交易对信息",
        "cols": ["币种名称", "开仓价格", "持仓方向", "持仓数量", "持仓价值", "未实现盈亏", "操作"],
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
    let tab5 = {
        "type": "table",
        "title": "监听运行币种",
        "cols": ['周期', "当前价U", "boll上轨", "boll中轨", "boll下轨"],
        "rows": []
    }
    let jieshao1 = `${FmzCall}`
    let jieshao2 = '量化[合作添加备注FMZ]'

    //往表格里加内容
    tab0.rows.push([`${ndgcInfo.data == undefined ? 0 : ndgcInfo.data.revenue}GC`, `${ndgcInfo.data == undefined ? 0 : ndgcInfo.data.expenses}GC`, `${ndgcInfo.data == undefined ? 0 : ndgcInfo.data.balance}GC`])
    tab1.rows.push([`${_N(parseFloat(init_Balance), 6)}U`, `${_N(parseFloat(walletbalance), 6)}U`, `${_N(parseFloat(totalMarginBalance), 6)}U`, `${toxh}U`, `${toHy}U`, `${pft2}U`, `${_N(profit_ratio, 6)}%`, `${lsAmount}U`, `${fee}U`])
    tab2.rows.push([`${FSTTime}`, `${NOWTime}`])
    tab4.rows.push([`${jieshao1}`, `${FmzCallQq}`, `${FmzCallTg}`, `${jieshao2}`])
    for (let i = 0; i < pos.length; i++) {
        let v = pos[i];
        let ir = followCoins.indexOf(v.symbol);
        if (ir != -1) {
            button0[i] = { "type": "button", "class": "btn btn-xs btn-info", "name": "平仓", "cmd": `${v.symbol}:平仓:${v.positionSide}:${Math.abs(Number(v.positionAmt))}`, "description": "平仓" }
            button1[i] = { "type": "button", "class": "btn btn-xs btn-warning", "name": "停止", "cmd": `${v.symbol}:停止:${v.positionSide}:${Math.abs(Number(v.positionAmt))}`, "description": "停止" }
            let pc = 0;
            let pc2 = 0;
            let tj1 = 0;
            let tj2 = 0;
            let onBc = "0"
            lSubP[ir] = _N(lSubP[ir], 4)
            sSubP[ir] = _N(sSubP[ir], 4)
            tj1 = lSubP[ir] > 0 ? `${lSubP[ir]}` : `${lSubP[ir]}`;
            tj2 = sSubP[ir] > 0 ? `${sSubP[ir]} #32CD32` : `${sSubP[ir]} #FF0000`;
            pc = _N(list1[ir], 4)
            pc2 = _N(list2[ir], 4)
            onBc = longAddCount[0] == 0 ? (shortAddCount[0] == 0 ? 0 : shortAddCount[0]) : longAddCount[0];
            btn1 = button1[i]
            tabc.rows.push([v.symbol, _N(Number(v.entryPrice), 4), v.positionSide == "LONG" ? `${v.positionSide}#32CD32` : `${v.positionSide}#FF0000`, Math.abs(Number(v.positionAmt)), `${_N(Number(v.initialMargin), 2)}U[${v.leverage}]X`, Number(v.unrealizedProfit) < 0 ? `${_N(Number(v.unrealizedProfit), 4)} #FF0000` : `${_N(Number(v.unrealizedProfit), 4)} #32CD32`, button0[i]])
        }

    }
    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    let colors = ["#FFC125", "#FF6A6A", "#9B30FF", "#3299cc", "#32CD32", "#8B658B", "#FF8247", "#90EE90", "#698B22", "#53868B"]
    let color = colors[getRandomInt(colors.length - 1)]
    let str = "✱策略可租用" + colors[getRandomInt(colors.length - 1)]
    let str2 = "✱实盘风险自担" + colors[getRandomInt(colors.length - 1)]
    let str3 = `*S=> ${shortAddCount[0]} | DoSgrid=>${_G('doSgrid')} | Price:${_G('dosPrice')} | Income:${sSubP[0]}` + colors[getRandomInt(colors.length - 1)]
    let str4 = `*L=> ${longAddCount[0]} | DoLgrid=>${_G('doLgrid')} | Price:${_G('dolPrice')} | Income:${lSubP[0]}` + colors[getRandomInt(colors.length - 1)]
    LogStatus("`" + JSON.stringify(tab2) + "`\n" + "`" + JSON.stringify(tab1) + "`\n" + "`" + JSON.stringify(tabc) + "`\n" + "`" + JSON.stringify(tab4) + "`\n" + "`" + JSON.stringify(tab0) + "`\n" + "✱策略启动时间:" + FSTTime + colors[getRandomInt(colors.length - 1)] + "\n" + str + "\n" + str2 + "\n" + JSON.stringify(tmpData) + color + "\n" + str3 + "\n" + str4)
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
                BuyClose(position1[0].Info.symbol, position1[0].Amount)
                let ticker = _C(exchanges[i].GetTicker)
                CalLsAmount(position1[0].Amount, ticker.Last)
            }
            if (position1[0]["Type"] == 1) {
                SellClose(position1[0].Info.symbol, position1[0].Amount)
                let ticker = _C(exchanges[i].GetTicker)
                CalLsAmount(position1[0].Amount, ticker.Last)
            }
        }
        if (position1.length == 2) {
            BuyClose(position1[0].Info.symbol, position1[0].Amount)
            SellClose(position1[1].Info.symbol, position1[1].Amount)
            let ticker = _C(exchanges[i].GetTicker)
            CalLsAmount(position1[0].Amount, ticker.Last)
            CalLsAmount(position1[1].Amount, ticker.Last)
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
    _G('curRate', null)
    _G('longAddCount', null);
    _G('shortAddCount', null);
    Log('您的账户已经全部清仓@')
}
//
function trade() {
    let currency = followCoins[ir];
    totalIncome = 0;
    let notional = 0;
    account1.Info.positions.map(v => {
        if (Number(v.positionAmt) > 0 && v.symbol == currency) {
            totalIncome += Number(v.unrealizedProfit);
            notional = Math.abs(Number(v.notional))
            if (ir == 0) {
                long_1 = v;
                feesL += notional * exFee * 2
            }
            if (ir == 1) {
                long_2 = v;
                feesS += notional * exFee * 2
            }
            nowPosAmount += Number(v.positionAmt) * Number(v.entryPrice);
        }
        if (Number(v.positionAmt) < 0 && v.symbol == currency) {
            totalIncome += Number(v.unrealizedProfit);
            notional = Math.abs(Number(v.notional))
            if (ir == 0) {
                short_1 = v;
                feesS += notional * exFee * 2
            }
            if (ir == 1) {
                short_2 = v;
                feesL += notional * exFee * 2
            }
            nowPosAmount += Math.abs(Number(v.positionAmt)) * Number(v.entryPrice);
        }
        if (Number(v.positionAmt) == 0 && v.symbol == currency) {
            if (ir == 0) {
                if (v.positionSide == 'SHORT') {
                    short_1 = null;
                }
                if (v.positionSide == 'LONG') {
                    long_1 = null;
                }
            }
            if (ir == 1) {
                if (v.positionSide == 'SHORT') {
                    short_2 = null;
                }
                if (v.positionSide == 'LONG') {
                    long_2 = null;
                }
            }
        }
    });
    SymbolsEx.map((v, i) => {
        if (v.symbol == currency) {
            quantityPrecision = v.quantityPrecision;
            pricePrecision = v.pricePrecision;
        }
    });
    tickerLast = (_C(exchanges[ir].GetTicker)).Last;
}
//
function xhPrice(symbol) {
    let priceData = HttpQuery(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    priceData = JSON.parse(priceData);
    nowPrice = _N(Number(priceData.price), 8);
    return nowPrice;
}
//
function xhRecord(symbol, interval = '5m') {
    let kline = HttpQuery(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`)
    if (kline == undefined || kline == '' || !kline.startsWith('[[')) {
        return ''
    }
    kline = JSON.parse(kline)
    let records = [];
    kline.map(v => {
        let d = {};
        d.Time = v[0]
        d.Open = Number(v[1])
        d.High = Number(v[2])
        d.Low = Number(v[3])
        d.Close = Number(v[4])
        d.Volume = Number(v[5])
        records.push(d);
    });
    return records;
}
//
function mainBefor() {
    exchange.SetContractType("swap");
    account1 = exchange.GetAccount();
    let eName = exchange.GetName();
    if (exchanges.length > 2) {
        throw '只支持两个交易对'
    }
    s_0 = exchanges[0].GetCurrency()
    s_1 = exchanges[1].GetCurrency()
    s0 = s_0.replace('_', '')
    s1 = s_1.replace('_', '')
    symbol1_2 = s_0.split('_')[0] + s_1.split('_')[0];
    symbol1_2 = symbol1_2.toUpperCase()

    let info = HttpQuery(`https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol1_2}`)
    info = JSON.parse(info);
    if (info.msg != undefined) {
        throw `${s0},${s1},交易对非法,请联系管理员=>${JSON.stringify(info)}`
    }
    isBinance = eName.indexOf("Binance") != -1;
    if (!isBinance) {
        throw "该策略只支持币安"
    }
    if (isBinance && !IsVirtual()) {
        let ret = exchange.IO("api", "GET", "/fapi/v1/positionSide/dual")
        if (ret != undefined && !ret.dualSidePosition) {
            let ret1 = exchange.IO("api", "POST", "/fapi/v1/positionSide/dual", "dualSidePosition=true")
            Log("修改持仓为双向持仓=>", ret1)
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
    Log("监听交易对:", followCoins, "对标现货交易对:", symbol1_2)
    let exlengths = _G('exlengths')
    if (exlengths == null) {
        _G('exlengths', exs)
    } else {
        if (exlengths != exs) {
            _G('lSubP', null);
            _G('sSubP', null);
            _G('listpft', null);
            _G('listpft2', null);
            _G('exlengths', exs);
            Log('exs changed...', exs)
        }
    }
    let leverageRes = IsVirtual() ? [] : exchange.IO("api", "GET", "/fapi/v1/leverageBracket", "", "");
    for (let i = 0; i < exchanges.length; i++) {
        button0.push(0)
        button1.push(0)
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
    if (isBinance && !IsVirtual()) {
        let exchangeInfo = exchange.IO("api", "GET", `/fapi/v1/exchangeInfo`, ``, ``)
        if (exchangeInfo == undefined) {
            throw '获取系统交易对出错'
        }
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
    if (_G('lSubP') && _G('sSubP') && _G('acc') && _G('listpft') && _G('listpft2') && _G('list1') && _G('list2')) {
        acc = _G('acc')
        listpft = _G('listpft')
        listpft2 = _G('listpft2')
        grid1 = _G('grid1')
        grid2 = _G('grid2')
        curRate = _G('curRate')
        if (grid1 == null || grid2 == null) {
            grid1 = []
            grid2 = []
            for (let i = 0; i < 100; i++) {
                grid1.push([])
                grid2.push([])
            }
            _G('grid1', grid1)
            _G('grid2', grid2)
        }
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
        grid1 = []
        grid2 = []
        list1 = []
        list2 = []
        shortAddCount = []
        longAddCount = []
        lSubP = []
        sSubP = []
        curRate = 0
        for (let i = 0; i < 100; i++) {
            listpft.push([])
            listpft2.push([])
            grid1.push([])
            grid2.push([])
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
        _G('grid1', grid1)
        _G('grid2', grid2)
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
    if (isBinance) {
        RefBinance1()
    }
}
//
function main() {
    mainBefor()
    while (true) {
        let loop_start = Date.now();
        try {
            if (!IsVirtual()) {
                table()
            }
            symbolInfo = {};
            fees = 0;
            feesL = 0;
            feesS = 0;
            nowPosAmount = 0;
            for (let i = 0; i < followCoins.length; i++) {
                ir = i;
                trade()
            }
            feesL = _N(feesL, 4)
            feesS = _N(feesS, 4)
            //CORE
            if (TimeZ == 0) {
                interval = '3m'
            } else if (TimeZ == 1) {
                interval = '5m'
            } else if (TimeZ == 2) {
                interval = '15m'
            } else {
                interval = '5m'
            }
            let record1 = xhRecord(symbol1_2, interval)
            if (record1 == '') {
                Log('未获取到 record1...')
                Sleep(2000)
                continue;
            }
            // let record2 = xhRecord(symbol1_2, '3m')
            // if (record2 == '') {
            //     Log('未获取到 record2...')
            //     Sleep(2000)
            //     continue;
            // }
            let price = xhPrice(symbol1_2);
            let atr = TA.ATR(record1, 66)
            gridRate = _N(atr[atr.length - 2] / price, 8);
            gridRate = gridRate < 0.0016 ? 0.0016 : gridRate;
            gridRate = gridRate > 0.005 ? 0.005 : gridRate;
            //
            // let emaFast = TA.EMA(record1, 14);
            // let emaSlow = TA.EMA(record1, 40);
            // let emaL = emaFast[emaFast.length - 1] > emaSlow[emaSlow.length - 1];
            // let emaS = emaFast[emaFast.length - 1] < emaSlow[emaSlow.length - 1];
            //
            let sar = SAR(record1)
            let _ls = sar[sar.length - 1] > price ? false : true;
            let doUp = false;
            let doDown = false;
            if (OpType == 0) {
                doDown = true;
            } else if (OpType == 1) {
                doUp = true;
            } else {
                doUp = _ls;
                doDown = !_ls;
            }
            let boll = TA.BOLL(record1, 20, 2)
            let upLine = boll[0]
            let midLine = boll[1]
            let downLine = boll[2]
            upB = _N(upLine[upLine.length - 1], 8);
            mB = _N(midLine[midLine.length - 1], 8);
            downB = _N(downLine[downLine.length - 1], 8);
            let mB1 = (upB - mB) / 2;
            let mB2 = (mB - downB) / 2;
            // tmpData['emaL'] = emaL;
            // tmpData['emaS'] = emaS;
            tmpData['sar'] = _N(sar[sar.length - 1], 8) + "|" + price + "|" + _ls;
            tmpData['upB'] = upB
            tmpData['downB'] = downB
            tmpData['gridRate'] = gridRate
            tmpData['doUp'] = doUp
            tmpData['doDown'] = doDown
            tmpData['feesS'] = feesS
            tmpData['feesL'] = feesL

            //命令
            if (!IsVirtual()) {
                walletB = Number(account1.Info.totalWalletBalance) + Number(account1.Info.totalUnrealizedProfit);
                if (walletB > T0) {
                    if (isBinance) {
                        let amount = T1;
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
                let cmd = GetCommand()
                if (cmd) {
                    arr = cmd.split(':')
                    if (arr[0] == '一键平仓') {
                        Coverall()
                        Sleep(1000 * 60 * 60)
                        Log('休息1小时...')
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
                    if (arr[0] == '清空日志') {
                        LogReset()
                        Log('日志已经清空')
                    }
                    if (arr[0] == '重置收益') {
                        LogProfitReset()
                        Log('已重置收益')
                    }
                }
            }
            //止损
            if (IsZs) {
                if (totalIncome < 0 && Math.abs(totalIncome) / walletbalance > LossStop) {
                    Coverall()
                    Log(`止损${totalIncome}|${walletbalance}@`)
                    throw '止损';
                }
            }
            if (long_1 == null && short_2 == null) {
                _G('dolPrice', 0)
                _G('doLgrid', 0)
            }
            if (long_2 == null && short_1 == null) {
                _G('dosPrice', 0)
                _G('doSgrid', 0)
            }
            //异常检测
            if ((long_1 == null && short_2 != null) || (long_1 != null && short_2 == null)) {
                if (long_1 != null) {
                    //清多
                    BuyClose(s0, Number(long_1.positionAmt))
                    Sleep(1000)
                    continue;
                }
                if (short_2 != null) {
                    //清多
                    SellClose(s1, Math.abs(Number(short_2.positionAmt)))
                    Sleep(1000)
                    continue;
                }
            }
            if ((long_2 == null && short_1 != null) || (long_2 != null && short_1 == null)) {
                if (long_2 != null) {
                    //清多
                    BuyClose(s1, Number(long_2.positionAmt))
                    Sleep(1000)
                    continue;
                }
                if (short_1 != null) {
                    //清多
                    SellClose(s0, Math.abs(Number(short_1.positionAmt)))
                    Sleep(1000)
                    continue;
                }
            }

            //做单
            if (doUp) {
                let flag = (nowPrice > downB - mB2 && nowPrice < downB + mB2);
                // let flag1 = (nowPrice > upB - mB1 && nowPrice < upB + mB1);
                if ((_G('dolPrice') == 0 || _G('dolPrice') == null && (flag || (nowPrice >= upB && _G('dosPrice') != 0)))) {
                    //底仓开单 看多 做多 1 做空 2
                    Buy(s0, acc[0])
                    Sell(s1, acc[1])
                    _G('dolPrice', nowPrice);
                    longAddCount[0] = 0;
                    _G('longAddCount', longAddCount)
                    lSubP[0] = 0;
                    _G('lSubP', lSubP)
                    Log(`底仓开单 看多 做多:${s0}|${acc[0]} 做空:${s1}|${acc[1]}__标识:${(nowPrice >= upB && _G('dosPrice') != 0)}`);
                    Sleep(1000)
                    continue;
                }
                //多单不为空 顺势
                if (_G('dolPrice') != 0) {
                    let pft1 = Number(long_1.unrealizedProfit);
                    let pft2 = Number(short_2.unrealizedProfit);
                    let notional = Math.abs(Number(long_1.notional));
                    //浮盈减仓或清仓
                    if (longAddCount[0] == 0) {
                        if ((pft1 + pft2 - feesL + lSubP[0]) > notional * gridRate && nowPrice > upB - mB1) {
                            //清底仓 平多1  平空2
                            BuyClose(s0, Number(long_1.positionAmt))
                            SellClose(s1, Math.abs(Number(short_2.positionAmt)))
                            Log(`清底仓 手续费:${feesL} 平多:${s0}|${Number(long_1.positionAmt)}  平空:${s1}|${Math.abs(Number(short_2.positionAmt))}`)
                        }
                    } else {
                        //网格减仓 平多1  平空2
                        if (nowPrice > _G('dolPrice') * (1 + gridRate)) {
                            let pos = RefBinance()
                            BuyClose(s0, pos.g0)
                            SellClose(s1, pos.g1)

                            let a1 = _N(pft1 * pos.g0 / Number(long_1.positionAmt), 4)
                            let a2 = _N(pft2 * pos.g1 / Math.abs(Number(short_2.positionAmt)), 4)
                            let fee = Gp * 0.01 * 0.04 * 2;
                            lSubP[0] = lSubP[0] + a1 + a2 - fee;
                            _G('lSubP', lSubP)
                            Log(`1-1 多单减仓|${s0},当前未实现盈亏:${pft1},减仓数量:${pos.g0},当前持仓数量:${Number(long_1.positionAmt)},减仓收益:${a1}|${s1},当前未实现盈亏:${pft2},减仓数量:${pos.g1},当前持仓数量:${Math.abs(Number(short_2.positionAmt))},减仓收益:${a2}|本次减仓收益:${a1 + a2},手续费:${fee},多方网格累计收益:${lSubP[0]}`)

                            Log(`1-1 网格减仓 平多:${s0}|${pos.g0}  平空:${s1}|${pos.g1} 减仓前:${longAddCount[0]}|减仓后:${longAddCount[0] - 1}`)
                            longAddCount[0] = longAddCount[0] - 1;
                            _G('longAddCount', longAddCount)
                            _G('doLgrid', 0)
                            _G('dolPrice', nowPrice);
                        }
                    }
                    //浮亏加仓
                    if (shortAddCount[0] < GpCount) {
                        if (nowPrice < _G('dolPrice') * (1 - gridRate)) {
                            //网格加仓 做多1 做空2
                            let pos = RefBinance()
                            Buy(s0, pos.g0)
                            Sell(s1, pos.g1)
                            Log(`1-1 网格加仓 做多:${s0}|${pos.g0} 做空:${s1}|${pos.g1} 加仓前:${longAddCount[0]}|加仓后:${longAddCount[0] + 1}`)
                            longAddCount[0] = longAddCount[0] + 1;
                            _G('longAddCount', longAddCount)
                            _G('dolPrice', nowPrice);
                        }
                    }
                }
                //空单不为空 逆势
                if (_G('dosPrice') != 0) {
                    let pft1 = Number(long_2.unrealizedProfit);
                    let pft2 = Number(short_1.unrealizedProfit);

                    let notional = Math.abs(Number(long_2.notional));
                    //浮盈减仓或清仓
                    if (shortAddCount[0] == 0) {
                        if ((pft1 + pft2 - feesS + sSubP[0]) > notional * gridRate && nowPrice < downB + mB2) {
                            //清底仓 平多2  平空1
                            BuyClose(s1, Number(long_2.positionAmt))
                            SellClose(s0, Math.abs(Number(short_1.positionAmt)))
                            Log(`清底仓 手续费:${feesS} 平多:${s1}|${Number(long_2.positionAmt)}  平空:${s0}|${Math.abs(Number(short_1.positionAmt))}`);
                        }
                    } else {
                        //网格减仓 平多2  平空1
                        if (nowPrice < _G('dosPrice') * (1 - gridRate)) {
                            let pos = RefBinance()
                            BuyClose(s1, pos.g1)
                            SellClose(s0, pos.g0)
                            let fee = Gp * 0.01 * 0.04 * 2;
                            let a1 = _N(pft2 * pos.g0 / Math.abs(Number(short_1.positionAmt)), 4)
                            let a2 = _N(pft1 * pos.g1 / Number(long_2.positionAmt), 4)
                            sSubP[0] = sSubP[0] + a1 + a2 - fee;
                            _G('sSubP', sSubP)
                            Log(`1-2 空单减仓|${s0},当前未实现盈亏:${pft2},减仓数量:${pos.g0},当前持仓数量:${Math.abs(Number(short_1.positionAmt))},减仓收益:${a1}|${s1},当前未实现盈亏:${pft1},减仓数量:${pos.g1},当前持仓数量:${Number(long_2.positionAmt)},减仓收益:${a2}|本次减仓收益:${a1 + a2},手续费:${fee},空方网格累计收益:${sSubP[0]}`)

                            Log(`1-2 网格减仓 平多${s1}|${pos.g1}  平空:${s0}|${pos.g0} 减仓前:${shortAddCount[0]}|减仓后:${shortAddCount[0] - 1}`)
                            shortAddCount[0] = shortAddCount[0] - 1;
                            _G('shortAddCount', shortAddCount)
                            _G('doSgrid', 0)
                            _G('dosPrice', nowPrice)
                        }
                    }
                    //浮亏加仓
                    let cc = _G('doSgrid') == null || _G('doSgrid') == 0 ? 1.5 : _G('doSgrid');
                    if (shortAddCount[0] < GpCount) {
                        //网格加仓 做多2 做空1
                        if (nowPrice > _G('dosPrice') * (1 + (gridRate + 0.001 * cc))) {
                            let pos = RefBinance()
                            Buy(s1, pos.g1)
                            Sell(s0, pos.g0)
                            Log(`1-2 网格加仓 做多:${s1}|${pos.g1} 做空:${s0}|${pos.g0} 加仓前:${shortAddCount[0]}|加仓后:${shortAddCount[0] + 1}`)
                            shortAddCount[0] = shortAddCount[0] + 1;
                            _G('shortAddCount', shortAddCount)
                            _G('doSgrid', cc + 0.2);
                            _G('dosPrice', nowPrice)
                        }
                    }
                }

            }
            //做单
            if (doDown) {
                // let flag = (nowPrice > downB - mB2 && nowPrice < downB + mB2);
                let flag1 = (nowPrice > upB - mB1 && nowPrice < upB + mB1);
                if ((_G('dosPrice') == 0 || _G('dosPrice') == null) && (flag1 || (_G('dolPrice') != 0 && nowPrice < downB))) {
                    //底仓开单 看空 做多 2 做空 1
                    Buy(s1, acc[1])
                    Sell(s0, acc[0])
                    _G('dosPrice', nowPrice);
                    shortAddCount[0] = 0;
                    _G('shortAddCount', shortAddCount)
                    sSubP[0] = 0;
                    _G('sSubP', sSubP)
                    Log(`底仓开单 看空 做多:${s1}|${acc[1]} 做空:${s0}|${acc[0]}_标识:${(_G('dolPrice') != 0 && nowPrice < downB)}`);
                    Sleep(1000);
                    continue;
                }
                //空单不为空 顺势
                if (_G('dosPrice') != 0) {
                    let pft1 = Number(long_2.unrealizedProfit);
                    let pft2 = Number(short_1.unrealizedProfit);
                    let notional = Math.abs(Number(long_2.notional));
                    //浮盈减仓或清仓
                    if (shortAddCount[0] == 0) {
                        //清底仓 平多2  平空1
                        if ((pft1 + pft2 - feesS + sSubP[0]) > notional * gridRate && nowPrice < downB + mB2) {
                            BuyClose(s1, Number(long_2.positionAmt))
                            SellClose(s0, Math.abs(Number(short_1.positionAmt)))
                            Log(`清底仓 手续费:${feesS} 平多:${s1}|${Number(long_2.positionAmt)}  平空:${s0}|${Math.abs(Number(short_1.positionAmt))}`);
                        }
                    } else {
                        //网格减仓 平多2  平空1
                        if (nowPrice < _G('dosPrice') * (1 - gridRate)) {
                            let pos = RefBinance()
                            BuyClose(s1, pos.g1)
                            SellClose(s0, pos.g0)
                            let fee = Gp * 0.01 * 0.04 * 2;
                            let a1 = _N(pft1 * pos.g1 / Number(long_2.positionAmt), 4)
                            let a2 = _N(pft2 * pos.g0 / Math.abs(Number(short_1.positionAmt)), 4)
                            sSubP[0] = sSubP[0] + a1 + a2 - fee;
                            _G('sSubP', sSubP)
                            Log(`2-2 空单减仓|${s0},当前未实现盈亏:${pft2},减仓数量:${pos.g0},当前持仓数量:${Math.abs(Number(short_1.positionAmt))},减仓收益:${a2}|${s1},当前未实现盈亏:${pft1},减仓数量:${pos.g1},当前持仓数量:${Number(long_2.positionAmt)},减仓收益:${a1}|本次减仓收益:${a1 + a2},手续费:${fee},空方网格累计收益:${sSubP[0]}`)

                            Log(`2-1 网格减仓 平多${s1}|${pos.g1} 平多${s1}|${pos.g1}  平空:${s0}|${pos.g0} 减仓前:${shortAddCount[0]}|减仓后:${shortAddCount[0] - 1}`)
                            shortAddCount[0] = shortAddCount[0] - 1;
                            _G('shortAddCount', shortAddCount)
                            _G('doSgrid', 0)
                            _G('dosPrice', nowPrice)
                        }
                    }
                    //浮亏加仓
                    if (shortAddCount[0] < GpCount) {
                        //网格加仓 做多2 做空1
                        if (nowPrice > _G('dosPrice') * (1 + gridRate)) {
                            let pos = RefBinance()
                            Buy(s1, pos.g1)
                            Sell(s0, pos.g0)
                            Log(`2-1 网格加仓 做多:${s1}|${pos.g1} 做空:${s0}|${pos.g0} 加仓前:${shortAddCount[0]}|加仓后:${shortAddCount[0] + 1}`)
                            shortAddCount[0] = shortAddCount[0] + 1;
                            _G('shortAddCount', shortAddCount)
                            _G('dosPrice', nowPrice)
                        }
                    }
                }
                //多单不为空 逆势
                if (_G('dolPrice') != 0) {
                    let pft1 = Number(long_1.unrealizedProfit);
                    let pft2 = Number(short_2.unrealizedProfit);
                    let notional = Math.abs(Number(long_1.notional));
                    //浮盈减仓或清仓
                    if (longAddCount[0] == 0) {
                        if ((pft1 + pft2 - feesL + lSubP[0]) > notional * gridRate && nowPrice > upB - mB1) {
                            //清底仓 平多1  平空2
                            BuyClose(s0, Number(long_1.positionAmt))
                            SellClose(s1, Math.abs(Number(short_2.positionAmt)))
                            Log(`清底仓 手续费:${feesL} 平多:${s0}|${Number(long_1.positionAmt)}  平空:${s1}|${Math.abs(Number(short_2.positionAmt))}`)
                        }
                    } else {
                        //网格减仓 平多1  平空2
                        if (nowPrice > _G('dolPrice') * (1 + gridRate)) {
                            let pos = RefBinance()
                            BuyClose(s0, pos.g0)
                            SellClose(s1, pos.g1)
                            let fee = Gp * 0.01 * 0.04 * 2;
                            let a1 = _N(pft1 * pos.g0 / Number(long_1.positionAmt), 4)
                            let a2 = _N(pft2 * pos.g1 / Math.abs(Number(short_2.positionAmt)), 4)
                            lSubP[0] = lSubP[0] + a1 + a2 - fee;
                            _G('lSubP', lSubP)
                            Log(`2-2 多单减仓|${s0},当前未实现盈亏:${pft1},减仓数量:${pos.g0},当前持仓数量:${Number(long_1.positionAmt)},减仓收益:${a1}|${s1},当前未实现盈亏:${pft2},减仓数量:${pos.g1},当前持仓数量:${Math.abs(Number(short_2.positionAmt))},减仓收益:${a2}|本次减仓收益:${a1 + a2},手续费:${fee},多方网格累计收益:${lSubP[0]}`)

                            Log(`2-2 网格减仓 平多:${s0}|${pos.g0}  平空:${s1}|${pos.g1} 减仓前:${longAddCount[0]}|减仓后:${longAddCount[0] - 1}`)
                            longAddCount[0] = longAddCount[0] - 1;
                            _G('longAddCount', longAddCount)
                            _G('doLgrid', 0)
                            _G('dolPrice', nowPrice)
                        }
                    }
                    //浮亏加仓
                    let cc = _G('doLgrid') == null || _G('doLgrid') == 0 ? 1.5 : _G('doLgrid');
                    if (longAddCount[0] < GpCount) {
                        //网格加仓 做多1 做空2
                        if (nowPrice < _G('dolPrice') * (1 - (gridRate + 0.001 * cc))) {
                            let pos = RefBinance()
                            Buy(s0, pos.g0)
                            Sell(s1, pos.g1)
                            Log(`2-2 网格加仓 做多:${s0}|${pos.g0} 做空:${s1}|${pos.g1} 加仓前:${longAddCount[0]}|加仓后:${longAddCount[0] + 1}`)
                            longAddCount[0] = longAddCount[0] + 1;
                            _G('longAddCount', longAddCount)
                            _G('dolPrice', nowPrice)
                            _G('doLgrid', cc + 0.2)
                        }
                    }
                }

            }
        } catch (e) {
            Log("system err=>", "e.name:", e.name, "e.stack:", e.stack, "e.message:", e.message)
            if (e.name == undefined && e.stack == undefined && e.message == undefined) {
                break;
            }
            Sleep(2000)
        }
        trade_info.loop_delay = Date.now() - loop_start;
        Sleep(S)
    }
}