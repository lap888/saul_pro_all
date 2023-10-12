/*
 * @Author: top.brids 
 * @Date: 2022-01-16 11:05:14 
 * @Last Modified by: top.brids
 * @Last Modified time: 2022-01-20 00:10:15
 */
// fmz@55f9364f3389ccfb760b188c06fed630
//1
let exs = "";
let followCoins = [];
let lable = "";
let isFristRun = true;
// 获取用户持仓信息start
let userPositionMessageLong = []
let userPositionMessageShort = []
//精度
let quantityPrecision = 0;
let env = IsDev ? "dev" : "prod";
let M = 20;
let trade_info = {};

//
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
let walletB = 0;
let unrealizedProfit = 0;
let pft = 0;
let ir = 0;

//
function table() {
    account1 = exchanges[1].Go("GetAccount").wait();
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
        "cols": ["初始资金", "钱包余额", "保证金余额", "划转到现货", "划转到合约", "全部未实现盈亏", "全部净利润", "总收益率", "循环延时"],
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
    let jieshao1 = 'wkc19891'
    let jieshao2 = '道式量化[合作添加备注FMZ]'
    let str = "✱策略合作添加备注FMZ #32CD32"
    let str1 = ""
    let str2 = ""
    //往表格里加内容
    tab1.rows.push([`${_N(parseFloat(init_Balance), 6)}U`, `${_N(parseFloat(walletbalance), 6)}U`, `${_N(parseFloat(totalMarginBalance), 6)}U`, `${toxh}U`, `${toHy}U`, `${_N(parseFloat(unrealizedProfit), 6)}U`, `${pft}U`, `${_N(profit_ratio, 6)}%`, `${trade_info.loop_delay}ms #FF0000`])
    tab2.rows.push([`${FSTTime}`, `${NOWTime}`])
    tab4.rows.push([`${jieshao1}`, "2043692042", "https://t.me/aelf_china", `${jieshao2}`])
    for (let i = 0; i < pos.length; i++) {
        let v = pos[i];
        button0[i] = { "type": "button", "name": "平仓", "cmd": `${v.symbol}:平仓:${v.positionSide}:${v.positionAmt}`, "description": "平仓" }
        tabc.rows.push([v.symbol, _N(Number(v.entryPrice), 4), v.positionSide == "LONG" ? `${v.positionSide}#32CD32` : `${v.positionSide}#FF0000`, Math.abs(Number(v.positionAmt)), `${_N(Number(v.initialMargin), 2)}U[${v.leverage}]X`, Number(v.unrealizedProfit) < 0 ? `${_N(Number(v.unrealizedProfit), 4)} #FF0000` : `${_N(Number(v.unrealizedProfit), 4)} #32CD32`, button0[i]])
    }
    //打印广告栏
    LogStatus("`" + JSON.stringify(tab2) + "`\n" + "`" + JSON.stringify(tab1) + "`\n" + "`" + JSON.stringify(tabc) + "`\n" + "`" + JSON.stringify(tab4) + "`\n" + str + "\n" + str1 + "\n" + str2)
}
//
function Coverall() {
    account1 = _C(exchanges[1].GetAccount)
    if (isOk) {
        walletbalance = account1.Info.data[0].details[0].cashBal;
        unrealizedProfit = account1.Info.data[0].details[0].upl;
    }
    if (isBinance) {
        walletbalance = account1.Info.totalWalletBalance;
        unrealizedProfit = account1.Info.totalUnrealizedProfit;
    }
    for (let i = 1; i < exchanges.length; i++) {
        exchanges[i].SetContractType("swap")
        let position1 = _C(exchanges[i].GetPosition)
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
function mainBefor() {
    let eName = exchange.GetName();
    isOk = eName.indexOf("OKCoin") != -1;
    isBinance = eName.indexOf("Binance") != -1;
    if (exchanges.length < 2) {
        throw "请选择跟单和带单交易号"
    }
    // 检测参考交易所
    if (!eName.includes("Futures_")) {
        throw "仅支持期货"
    }
    if (!isBinance) {
        throw "当前策略仅支持币安"
    }
    if (isBinance) {
        let ret = exchanges[1].IO("api", "GET", "/fapi/v1/positionSide/dual")
        if (!ret.dualSidePosition) {
            let ret1 = exchanges[1].IO("api", "POST", "/fapi/v1/positionSide/dual", "dualSidePosition=true")
            Log("更新持仓模式:", ret1)
        }
    }
    followCoins = [];
    for (let i = 1; i < exchanges.length; i++) {
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
            _G('longAddCount', null);
            _G('shortAddCount', null);
            _G('exlengths', exs)
            Log(`run coins changed:${followCoins}`)
        }
    }

    for (let i = 0; i < exchanges.length; i++) {
        button0.push(0)
        Qs[i] = "";
    }
    exchanges[0].SetContractType("swap");
    exchanges[1].SetContractType("swap");
    account1 = exchanges[1].GetAccount();
    if (isOk) {
        let exchangeInfo = exchange.IO("api", "GET", "/api/v5/public/instruments?instType=SWAP");
        SymbolsEx = exchangeInfo.data;
        walletbalance = account1.Info.data[0].details[0].disEq;
    }
    if (isBinance) {
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
            init_Balance = account1.Info.totalWalletBalance;
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
    account1 = exchanges[1].GetAccount();
    lable = exchanges[1].GetLabel()
    getAccountInfo(account1.Info, lable)
}
//
function newOrder(symbol, side, positionSide, quantity, price, type = 'MARKET') {
    SymbolsEx.map((v6) => {
        if (v6.symbol == symbol) {
            quantityPrecision = v6.quantityPrecision;
        }
    });
    let ic = followCoins.indexOf(symbol) + 1;
    // 判断做多还是做空
    if (positionSide == 'LONG' && side == 'BUY') {
        //买入做多
        let isHaveCoin = followCoins.find(i => i == symbol);
        if (isHaveCoin) {
            // 获取该用户所持有币种
            let newArr = []
            userPositionMessageLong.forEach(val => {
                newArr.push(val.symbol)
            })
            let newArr2 = []
            userPositionMessageShort.forEach(val2 => {
                newArr2.push(val2.symbol)
            })
            // 判断有没有该币种
            let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
            let symbolIndex = userPositionMessageLong.findIndex(index => index.symbol == symbol)
            if (env == "dev") {
                Log(`${env}=>做多,${quantity}张,${symbol},下单成功`)
            }
            if (env == "prod") {
                exchanges[ic].SetContractType("swap")
                exchanges[ic].SetDirection("buy")
                exchanges[ic].Buy(-1, quantity)
                Log(`做多,${quantity}张,${symbol},下单成功`)
                LogProfit(pft)
            }
            if (isHaveThisSymbol == undefined) {
                userPositionMessageLong.push({ symbol: symbol, positionAmt: quantity, positionSide: 'LONG' })
                Log(`${symbol},当前多单持仓数量:${quantity}张`)
            } else {
                userPositionMessageLong[symbolIndex].positionAmt = (Number(userPositionMessageLong[symbolIndex].positionAmt) + Number(quantity)).toFixed(quantityPrecision)
                Log(`${symbol},当前多单持仓数量:${userPositionMessageLong[symbolIndex].positionAmt}`)
            }
        } else {
            Log(symbol, "做多",quantity,"没有此币种")
        }
    } else if (positionSide == 'SHORT' && side == 'SELL') {
        // 买入做空
        let isHaveCoin = followCoins.find(i => i == symbol);
        if (isHaveCoin) {
            let newArr = []
            userPositionMessageLong.forEach(val => {
                newArr.push(val.symbol)
            })
            let newArr2 = []
            userPositionMessageShort.forEach(val2 => {
                newArr2.push(val2.symbol)
            })
            let isHaveThisSymbol2 = newArr2.find(item2 => item2 == symbol)
            let symbolIndex2 = userPositionMessageShort.findIndex(index2 => index2.symbol == symbol)
            if (env == "dev") {
                Log(`${env}=>做空,${quantity}张,${symbol},下单成功`)
            }
            if (env == "prod") {
                exchanges[ic].SetContractType("swap")
                exchanges[ic].SetDirection("sell")
                exchanges[ic].Sell(-1, quantity)
                Log(`做空,${quantity}张,${symbol},下单成功`);
                LogProfit(pft)
            }
            if (isHaveThisSymbol2 == undefined) {
                userPositionMessageShort.push({ symbol: symbol, positionAmt: -Number(quantity), positionSide: 'SHORT' })
                Log(`${symbol},空单持仓数量${-quantity}`)
            } else {
                userPositionMessageShort[symbolIndex2].positionAmt = (Number(userPositionMessageShort[symbolIndex2].positionAmt) - Number(quantity)).toFixed(quantityPrecision)
                Log(`${symbol},空单持仓数量${userPositionMessageShort[symbolIndex2].positionAmt}`)
            }
        } else {
            Log(symbol, "做空",quantity,"没有此币种")
        }
    } else if (positionSide == 'LONG' && side == 'SELL') {
        //平做多的仓
        // 获取该用户所持有币种
        let newArr = []
        userPositionMessageLong.forEach(val => {
            newArr.push(val.symbol)
        })
        // 判断有没有该币种
        let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
        let symbolIndex = userPositionMessageLong.findIndex(index => index.symbol == symbol)
        if (isHaveThisSymbol !== undefined) {
            if (env == "dev") {
                Log(`${env}=>多单减仓,${quantity}张,${symbol},成功`)
            }
            if (env == "prod") {
                exchanges[ic].SetContractType("swap")
                exchanges[ic].SetDirection("closebuy")
                exchanges[ic].Sell(-1, quantity)
                Log(`${symbol},多单减仓,${quantity}张,成功`)
                LogProfit(pft)
            }
            userPositionMessageLong[symbolIndex].positionAmt = (Number(userPositionMessageLong[symbolIndex].positionAmt) - Number(quantity)).toFixed(quantityPrecision)
            Log(`当前,${symbol},多单持仓数量:${userPositionMessageLong[symbolIndex].positionAmt}`)
        } else {
            Log(`平多仓,${symbol},没有该币种,数量:${quantity}`)
        }
    } else if (positionSide == 'SHORT' && side == 'BUY') {
        //平做空的仓
        // 获取该用户所持有币种
        let newArr = []
        userPositionMessageShort.forEach(val => {
            newArr.push(val.symbol)
        })
        // 判断有没有该币种
        let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
        let symbolIndex = userPositionMessageShort.findIndex(index => index.symbol == symbol)
        if (isHaveThisSymbol !== undefined) {
            if (env == "dev") {
                Log(`${env}=>${symbol},空单减仓,${quantity}张,成功`)
            }
            if (env == "prod") {
                exchanges[ic].SetContractType("swap")
                exchanges[ic].SetDirection("closesell")
                exchanges[ic].Buy(-1, quantity)
                Log(`${symbol},空单减仓,${quantity}张,成功`)
                LogProfit(pft)
            }
            userPositionMessageShort[symbolIndex].positionAmt = (Number(userPositionMessageShort[symbolIndex].positionAmt) + Number(quantity)).toFixed(quantityPrecision)
            Log(`当前,${symbol},空持仓数量:${userPositionMessageShort[symbolIndex].positionAmt}`)
        } else {
            Log(`平空仓,${symbol},没有该币种,数量:${quantity}`)
        }
    }
}
//
function doScanOrder(pushData, number = 0) {
    if (pushData.levelC) {
        exchanges[1].IO("api", "POST", "/fapi/v1/leverage", "symbol=" + pushData.symbol + "&leverage=" + pushData.levelAmount + "&timestamp=" + Date.now());
    }
    // Log("No:",number, JSON.stringify(pushData))
    newOrder(pushData.symbol, pushData.side, pushData.positionSide, Number(pushData.quantity), -1)
}
//
function getAccountInfo(res, lable) {
    res.positions.forEach((item1) => {
        if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
            userPositionMessageLong.push(item1)
        } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
            userPositionMessageShort.push(item1)
        }
    })
    Log(`获取用户:${lable}持仓信息成功,接口返回余额:${res.totalWalletBalance}`)
}
//
function scan() {
    let userPositionMessageLong1 = [];
    let userPositionMessageShort1 = [];
    let pushData = {}
    let fristAccount = exchanges[0].GetAccount();
    let res = fristAccount.Info;
    res.positions.forEach((item1) => {
        if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
            userPositionMessageLong1.push(item1)
        } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
            userPositionMessageShort1.push(item1)
        }
    })
    if (!isFristRun) {
        let _userPositionMessageLong = JSON.parse(_G('userPositionMessageLong1'))
        let _userPositionMessageShort = JSON.parse(_G('userPositionMessageShort1'))
        //多仓
        if (_userPositionMessageLong.length >= userPositionMessageLong1.length) {
            //1.原来大于 现在
            _userPositionMessageLong.map((v, index) => {
                SymbolsEx.map((v2, i) => {
                    if (v2.symbol == v.symbol) {
                        quantityPrecision = v2.quantityPrecision;
                    }
                });
                let isHave = userPositionMessageLong1.find(item => item.symbol == v.symbol);
                if (isHave) {
                    userPositionMessageLong1.map(v1 => {
                        if (v.symbol == v1.symbol) {
                            if (v.positionAmt != v1.positionAmt) {
                                let amount = Number(v.positionAmt) - Number(v1.positionAmt);
                                if (amount >= 0) {
                                    //减仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "SELL";
                                    pushData.positionSide = "LONG";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                } else {
                                    //加仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "BUY";
                                    pushData.positionSide = "LONG";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                }
                                pushData.levelAmount = v1.leverage
                                v.positionAmt = v1.positionAmt;
                                if (pushData.levelC) {
                                    v.leverage = v1.leverage;
                                }
                                _G('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                                doScanOrder(pushData, 1)
                            }
                        }
                    })
                } else {
                    //多仓清仓
                    pushData.symbol = v.symbol;
                    pushData.side = "SELL";
                    pushData.positionSide = "LONG";
                    pushData.quantity = Number(v.positionAmt).toFixed(quantityPrecision);
                    pushData.levelC = false;
                    _userPositionMessageLong.splice(index, 1)
                    _G('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                    doScanOrder(pushData, 2)
                }
            });
        } else {
            //2.现在大于 原来
            userPositionMessageLong1.map((v) => {
                SymbolsEx.map((v2, i) => {
                    if (v2.symbol == v.symbol) {
                        quantityPrecision = v2.quantityPrecision;
                    }
                });
                let isHave = _userPositionMessageLong.find(item => item.symbol == v.symbol);
                if (isHave) {
                    _userPositionMessageLong.map(v1 => {
                        if (v.symbol == v1.symbol) {
                            if (v.positionAmt != v1.positionAmt) {
                                let amount = Number(v1.positionAmt) - Number(v.positionAmt);
                                if (amount >= 0) {
                                    //减仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "SELL";
                                    pushData.positionSide = "LONG";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                } else {
                                    //加仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "BUY";
                                    pushData.positionSide = "LONG";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                }
                                pushData.levelAmount = v.leverage
                                v1.positionAmt = v.positionAmt;
                                if (pushData.levelC) {
                                    v1.leverage = v.leverage;
                                }
                                _G('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                                doScanOrder(pushData, 3)
                            }
                        }
                    })
                } else {
                    //多仓加仓
                    pushData.symbol = v.symbol;
                    pushData.side = "BUY";
                    pushData.positionSide = "LONG";
                    pushData.quantity = Number(v.positionAmt).toFixed(quantityPrecision);
                    pushData.levelC = false;
                    _userPositionMessageLong.push(v)
                    _G('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                    doScanOrder(pushData, 4)
                }
            });
        }
        //空仓
        if (_userPositionMessageShort.length >= userPositionMessageShort1.length) {
            //1.原来大于 现在
            _userPositionMessageShort.map((v, index) => {
                SymbolsEx.map((v2, i) => {
                    if (v2.symbol == v.symbol) {
                        quantityPrecision = v2.quantityPrecision;
                    }
                });
                let isHave = userPositionMessageShort1.find(item => item.symbol == v.symbol);
                if (isHave) {
                    userPositionMessageShort1.map(v1 => {
                        if (v.symbol == v1.symbol) {
                            if (v.positionAmt != v1.positionAmt) {
                                let amount = Number(v.positionAmt) - Number(v1.positionAmt);
                                if (amount <= 0) {
                                    //减仓 平仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "BUY";
                                    pushData.positionSide = "SHORT";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                } else {
                                    //加仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "SELL";
                                    pushData.positionSide = "SHORT";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                }
                                pushData.levelAmount = v1.leverage
                                v.positionAmt = v1.positionAmt;
                                if (pushData.levelC) {
                                    v.leverage = v1.leverage;
                                }
                                _G('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                                doScanOrder(pushData, 5)
                            }
                        }
                    })
                } else {
                    //空仓清仓
                    pushData.symbol = v.symbol;
                    pushData.side = "BUY";
                    pushData.positionSide = "SHORT";
                    pushData.quantity = Number(v.positionAmt).toFixed(quantityPrecision);
                    pushData.levelC = false;
                    _userPositionMessageShort.splice(index, 1)
                    _G('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                    doScanOrder(pushData, 6)
                }
            });
        } else {
            //2.现在大于 原来
            userPositionMessageShort1.map((v) => {
                SymbolsEx.map((v2, i) => {
                    if (v2.symbol == v.symbol) {
                        quantityPrecision = v2.quantityPrecision;
                    }
                });
                let isHave = _userPositionMessageShort.find(item => item.symbol == v.symbol);
                if (isHave) {
                    _userPositionMessageShort.map(v1 => {
                        if (v.symbol == v1.symbol) {
                            if (v.positionAmt != v1.positionAmt) {
                                let amount = Number(v1.positionAmt) - Number(v.positionAmt);
                                if (amount <= 0) {
                                    //减仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "BUY";
                                    pushData.positionSide = "SHORT";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                } else {
                                    //加仓
                                    pushData.symbol = v.symbol;
                                    pushData.side = "SELL";
                                    pushData.positionSide = "SHORT";
                                    pushData.quantity = Math.abs(amount).toFixed(quantityPrecision);
                                    pushData.levelC = v.leverage == v1.leverage ? false : true;
                                }
                                pushData.levelAmount = v.leverage
                                v1.positionAmt = v.positionAmt;
                                if (pushData.levelC) {
                                    v1.leverage = v.leverage;
                                }
                                _G('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                                doScanOrder(pushData, 7)
                            }
                        }
                    })
                } else {
                    //空仓加仓
                    pushData.symbol = v.symbol;
                    pushData.side = "SELL";
                    pushData.positionSide = "SHORT";
                    pushData.quantity = Number(v.positionAmt).toFixed(quantityPrecision);
                    pushData.levelC = false;
                    _userPositionMessageShort.push(v)
                    _G('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                    doScanOrder(pushData, 8)
                }
            });
        }
    }
    if (isFristRun) {
        _G('userPositionMessageLong1', JSON.stringify(userPositionMessageLong1))
        _G('userPositionMessageShort1', JSON.stringify(userPositionMessageShort1))
        isFristRun = false;
    }
}
//
function main() {
    mainBefor()
    while (true) {
        let loop_start = Date.now();
        try {
            let minutes = new Date().getMinutes();
            let seconds = new Date().getSeconds();
            if (minutes % 5 == 0) {
                if (seconds % 15 == 0) {
                    if (isOk) {
                        let exchangeInfo = exchange.Go("IO", "api", "GET", "/api/v5/public/instruments?instType=SWAP");
                        SymbolsEx = exchangeInfo.wait().data;
                    }
                    if (isBinance) {
                        let exchangeInfo = exchange.Go("IO", "api", "GET", "/fapi/v1/exchangeInfo", "", "")
                        SymbolsEx = exchangeInfo.wait().symbols;
                    }
                }
            }
            table()
            scan()
            if (isBinance) {
                mlist = T0;
            }
            if (isOk) {
                walletB = account1.Info.data[0].details[0].cashBal;
            }
            if (isBinance) {
                walletB = account1.Info.totalWalletBalance + account1.Info.totalUnrealizedProfit;
            }
            if (walletB > mlist) {
                if (isOk) {
                    mlist += T1
                    _G('mlist', mlist)
                    Log('下次阀值更新为:', mlist)
                }
                if (isBinance) {
                    let amount = T1;
                    if (amount > 5) {
                        let timestamp = new Date().getTime();
                        let base = "https://api.binance.com"
                        exchanges[1].SetBase(base)
                        let res = exchanges[1].IO("api", "POST", "/sapi/v1/futures/transfer", `asset=USDT&amount=${amount}&type=2&timestamp=${timestamp}`, "")
                        Log('划转到现货', res, amount)
                        let toxh = _G('ToXh') == null ? 0 : _G('ToXh')
                        toxh += amount
                        _G('ToXh', toxh)
                        base = "https://fapi.binance.com"
                        exchanges[1].SetBase(base)
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
                    currency = exchanges[a].GetCurrency()
                    let data = { coin: currency, amount: n1, msg: '手动停止' }
                    stoplist.push(data)
                    Log('当前停止的币对:', currency)
                }
                if (arr[0] == '转到合约') {
                    if (isBinance) {
                        let amount = parseInt(arr[1]);
                        let timestamp = new Date().getTime();
                        let base = "https://api.binance.com"
                        exchanges[1].SetBase(base)
                        let res = exchanges[1].IO("api", "POST", "/sapi/v1/futures/transfer", `asset=USDT&amount=${amount}&type=1&timestamp=${timestamp}`, "")
                        Log('现货划转到合约', res, amount)
                        let toHy = _G('ToHy') == null ? 0 : _G('ToHy')
                        toHy += amount
                        _G('ToHy', toHy)
                        base = "https://fapi.binance.com"
                        exchanges[1].SetBase(base)
                    } else {
                        Log('OK暂不支持划转')
                    }
                }
                if (arr[0] == '转到现货') {
                    if (isBinance) {
                        let amount = parseInt(arr[1]);
                        let timestamp = new Date().getTime();
                        let base = "https://api.binance.com"
                        exchanges[1].SetBase(base)
                        let res = exchanges[1].IO("api", "POST", "/sapi/v1/futures/transfer", `asset=USDT&amount=${amount}&type=2&timestamp=${timestamp}`, "")
                        Log('合约划转到现货', res, amount)
                        let toxh = _G('ToXh') == null ? 0 : _G('ToXh')
                        toxh += amount
                        _G('ToXh', toxh)
                        base = "https://fapi.binance.com"
                        exchanges[1].SetBase(base)
                    } else {
                        Log('OK暂不支持划转')
                    }
                }
                if (arr[1] == '平仓') {
                    let ic = followCoins.indexOf(arr[0]) + 1;
                    if (ic > 0) {
                        let amount = Math.abs(Number(arr[3]));
                        exchanges[ic].SetContractType("swap")
                        if (arr[2] == 'LONG') {
                            exchanges[ic].SetDirection("closebuy")
                            exchanges[ic].Sell(-1, amount)
                            longAddCount[ic] = 0;
                            _G('longAddCount', longAddCount)
                            lSubP[ir] = 0;
                            _G('lSubP', lSubP);
                            list1[ic] = 0
                            _G('list1', list1)
                        }
                        if (arr[2] == 'SHORT') {
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
                    } else {
                        Log("此币未在监听范畴,请去交易所平仓")
                    }

                }
                if (arr[0] == '清空日志') {
                    LogReset()
                    Log('日志已经清空')
                }
                if (arr[0] == '重置收益') {
                    LogReset()
                    LogProfitReset()
                    Log('已重置收益')
                }
            }
        } catch (e) {
            Log('系统error', e);
        }
        Sleep(S)
        trade_info.loop_delay = Date.now() - loop_start;
    }

}