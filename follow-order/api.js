const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Console } = require('console')
const fs = require('fs')
const Swap = require('./swap')
const { LocalStorage } = require("node-localstorage")
const output = fs.createWriteStream('./logs/out.log')
const errorOutput = fs.createWriteStream('./logs/err.log')
const { validateRequiredParameters } = require('./helpers/validation.js')
const logger = new Console({
    stdout: output,
    stderr: errorOutput
})
let isFristRun = true;
let configData = fs.readFileSync("config.json");
let configJson = JSON.parse(configData);
let listenPort = configJson.listenPort;
let proxy = configJson.proxy;
let proxyIp = configJson.proxyIp;
let apiKey = configJson.beFollowed.apiKey;
let apiSecret = configJson.beFollowed.apiSecret;
let env = configJson.env;
//跟单人信息
let arr = [];
const baseURL = configJson.baseURL;
const wsURL = configJson.wsURL;

const client = new Swap(apiKey, apiSecret, { ip: proxyIp, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })

//持久化存储
let localStorage = new LocalStorage('./scratch');
// 获取用户持仓信息start
let userPositionMessageLong = []
let userPositionMessageShort = []

//ws
let obj = { o: { c: '', s: '', S: '', ps: '', q: '', type: 'MARKET' }, T: '' }
//
let order_id = ''
//杠杆
let account = 10
//交易对
let SymbolsEx = [];
//精度
let quantityPrecision = 0;

/**
 * 修改跟单人杠杆
 * @param {*} symbol 
 * @param {*} account 
 */
function updateLeverage(symbol, account) {
    arr.forEach((item => {
        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
        c.leverage(symbol, account).then(res => {
            console.log(`修改跟单Id:${item.userid},${symbol},杠杆:${account}`)
        });
    }))
}
/**
 * 获取持仓信息
 */
function getAccountInfo() {
    userPositionMessageLong = []
    userPositionMessageShort = []
    arr.forEach((item => {
        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
        c.account().then(res => {
            let userid = item.userid
            res.data.positions.forEach((item1) => {
                if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
                    userPositionMessageLong.push({ symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'LONG', userid: userid })
                } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
                    userPositionMessageShort.push({ symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'SHORT', userid: userid })
                }
            })
            console.log(`获取用户${userid}持仓信息成功,最高可跟单${item.coinMax}币种,接口返回余额:${res.data.totalWalletBalance}`)
        }).catch(err => console.error(err));
    }))
}

/**
 * 下单
 * @param {*} symbol 
 * @param {*} side 买卖方向 SELL, BUY
 * @param {*} positionSide 持仓方向，单向持仓模式下非必填，默认且仅可填BOTH;在双向持仓模式下必填,且仅可选择 LONG 或 SHORT
 * @param {*} quantity 
 * @param {*} price 
 * @param {*} type 
 */
function newOrder(symbol, side, positionSide, quantity, price, type = 'MARKET') {
    SymbolsEx.map((v6) => {
        if (v6.symbol == symbol) {
            quantityPrecision = v6.quantityPrecision;
        }
    });
    // 判断做多还是做空
    if (positionSide == 'LONG' && side == 'BUY') {
        //买入做多
        arr.forEach((item => {
            let isHaveCoin = item.coins.find(i => i == symbol);
            if (item.isRun && isHaveCoin) {
                // 获取该用户所持有币种
                let newArr = []
                userPositionMessageLong.forEach(val => {
                    if (val.userid == item.userid) {
                        newArr.push(val.symbol)
                    }
                })
                let newArr2 = []
                userPositionMessageShort.forEach(val2 => {
                    if (val2.userid == item.userid) {
                        newArr2.push(val2.symbol)
                    }
                })
                let newArr3 = newArr.concat(newArr2.filter(v => !newArr.includes(v)))
                let newArr3Symbol = newArr3.find(item1 => item1 == symbol)
                // 判断有没有该币种
                let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
                let symbolIndex = userPositionMessageLong.findIndex(index => index.userid == item.userid && index.symbol == symbol)
                //当前带单有没有超额
                if (newArr3.length >= item.coinMax && !newArr3Symbol) {
                    console.log(`userid:${item.userid},跟单,${symbol}币种超限,最高可跟${item.coinMax}`)
                } else {
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
                    if (env == "dev") {
                        console.log(`${env}=>userid:${item.userid},做多,${quantity}张,${symbol},下单成功`)
                    }
                    if (env == "prod") {
                        c.newOrder(symbol, side, positionSide, type, { quantity: quantity }).then(res => {
                            console.log(`userid:${item.userid},做多,${quantity}张,${symbol},下单成功`)
                        }).catch(err => console.error(err));
                    }
                    if (isHaveThisSymbol == undefined) {
                        userPositionMessageLong.push({ symbol: symbol, positionAmt: quantity, positionSide: 'LONG', userid: item.userid })
                        console.log(`userid:${item.userid},${symbol},当前多单持仓数量:${quantity}张`)
                    } else {
                        userPositionMessageLong[symbolIndex].positionAmt = (Number(userPositionMessageLong[symbolIndex].positionAmt) + Number(quantity)).toFixed(quantityPrecision)
                        console.log(`userid:${item.userid},${symbol},当前多单持仓数量:${userPositionMessageLong[symbolIndex].positionAmt}`)
                    }
                }
            } else {
                console.log("isHaveCoin", isHaveCoin, "item.isRun", item.isRun)
            }
        }))
    } else if (positionSide == 'SHORT' && side == 'SELL') {
        // 买入做空
        arr.forEach(item => {
            let isHaveCoin = item.coins.find(i => i == symbol);
            if (item.isRun && isHaveCoin) {
                let newArr = []
                userPositionMessageLong.forEach(val => {
                    if (val.userid == item.userid) {
                        newArr.push(val.symbol)
                    }
                })
                let newArr2 = []
                userPositionMessageShort.forEach(val2 => {
                    if (val2.userid == item.userid) {
                        newArr2.push(val2.symbol)
                    }
                })
                let newArr3 = newArr.concat(newArr2.filter(v => !newArr.includes(v)))
                let newArr3Symbol = newArr3.find(item1 => item1 == symbol)
                let isHaveThisSymbol2 = newArr2.find(item2 => item2 == symbol)
                let symbolIndex2 = userPositionMessageShort.findIndex(index2 => index2.userid == item.userid && index2.symbol == symbol)
                if (newArr3.length >= item.coinMax && !newArr3Symbol) {
                    console.log(`userid:${item.userid},跟单,${symbol}币种超限,最高可跟${item.coinMax}`)
                } else {
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
                    if (env == "dev") {
                        console.log(`${env}=>userid:${item.userid},做空,${quantity}张,${symbol},下单成功`)
                    }
                    if (env == "prod") {
                        c.newOrder(symbol, side, positionSide, type, { quantity: quantity }).then(res => {
                            console.log(`userid:${item.userid},做空,${quantity}张,${symbol},下单成功`)
                        }).catch(err => console.error(err));
                    }
                    if (isHaveThisSymbol2 == undefined) {
                        userPositionMessageShort.push({ symbol: symbol, positionAmt: -Number(quantity), positionSide: 'SHORT', userid: item.userid })
                        console.log(`userid:${item.userid},${symbol},空单持仓数量${-quantity}`)
                    } else {
                        userPositionMessageShort[symbolIndex2].positionAmt = (Number(userPositionMessageShort[symbolIndex2].positionAmt) - Number(quantity)).toFixed(quantityPrecision)
                        console.log(`userid:${item.userid},${symbol},空单持仓数量${userPositionMessageShort[symbolIndex2].positionAmt}`)
                    }
                }
            } else {
                console.log("isHaveCoin", isHaveCoin, "item.isRun", item.isRun)
            }
        })
    } else if (positionSide == 'LONG' && side == 'SELL') {
        //平做多的仓
        arr.forEach(item => {
            // 获取该用户所持有币种
            let newArr = []
            userPositionMessageLong.forEach(val => {
                if (val.userid == item.userid) {
                    newArr.push(val.symbol)
                }
            })
            // 判断有没有该币种
            let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
            let symbolIndex = userPositionMessageLong.findIndex(index => index.userid == item.userid && index.symbol == symbol)
            if (isHaveThisSymbol !== undefined) {
                if (Math.abs(Number(userPositionMessageLong[symbolIndex].positionAmt)) <= Math.abs(Number(quantity))) {
                    //清仓
                    let number = Number(userPositionMessageLong[symbolIndex].positionAmt)
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
                    if (env == "dev") {
                        client.logger.log(`${env}=>userid:${item.userid},平多清仓,${number}张,${symbol},成功`)
                    }
                    if (env == "prod") {
                        client.logger.log(`1.userid:${item.userid},平多清仓,${number}张,${symbol},触发`)
                        c.newOrder(symbol, side, positionSide, type, { quantity: number }).then(res => {
                            client.logger.log(`2.userid:${item.userid},平多清仓,${number}张,${symbol},成功`)
                        }).catch(err => client.logger.error(err));
                    }
                    userPositionMessageLong.splice(symbolIndex, 1)
                } else {
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL });
                    if (env == "dev") {
                        console.log(`${env}=>userid:${item.userid},多单减仓,${quantity}张,${symbol},成功`)
                    }
                    if (env == "prod") {
                        console.log(`1.userid:${item.userid},多单减仓,${quantity}张,${symbol}触发`)
                        c.newOrder(symbol, side, positionSide, type, { quantity: quantity }).then(res => {
                            console.log(`2.userid:${item.userid},多单减仓,${quantity}张,${symbol},成功`)
                        }).catch(err => console.error(err));
                    }
                    userPositionMessageLong[symbolIndex].positionAmt = (Number(userPositionMessageLong[symbolIndex].positionAmt) - Number(quantity)).toFixed(quantityPrecision)
                    console.log(`userid:${item.userid},当前,${symbol},多单持仓数量:${userPositionMessageLong[symbolIndex].positionAmt}`)
                }

            } else {
                console.log(`userid:${item.userid},平多仓,${symbol},没有该币种,数量:${quantity}`)
            }
        })
    } else if (positionSide == 'SHORT' && side == 'BUY') {
        //平做空的仓
        arr.forEach(item => {
            // 获取该用户所持有币种
            let newArr = []
            userPositionMessageShort.forEach(val => {
                if (val.userid == item.userid) {
                    newArr.push(val.symbol)
                }
            })
            // 判断有没有该币种
            let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
            let symbolIndex = userPositionMessageShort.findIndex(index => index.userid == item.userid && index.symbol == symbol)
            if (isHaveThisSymbol !== undefined) {
                if (Math.abs(Number(userPositionMessageShort[symbolIndex].positionAmt)) <= Math.abs(Number(quantity))) {
                    //清仓
                    let number = Number(userPositionMessageShort[symbolIndex].positionAmt)
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
                    if (env == "dev") {
                        client.logger.log(`${env}=>userid${item.userid},${symbol},平空清仓,${-number}张,成功`)
                    }
                    if (env == "prod") {
                        client.logger.log(`1.userid:${item.userid},${symbol},平空清仓,${-number}张,触发`)
                        c.newOrder(symbol, side, positionSide, type, { quantity: -number }).then(res => {
                            client.logger.log(`2.userid:${item.userid},${symbol},平空清仓,${-number}张,成功`)
                        }).catch(err => client.logger.error(err));
                    }
                    userPositionMessageShort.splice(symbolIndex, 1)
                } else {
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
                    if (env == "dev") {
                        console.log(`${env}=>userid:${item.userid},${symbol},空单减仓,${quantity}张,成功`)
                    }
                    if (env == "prod") {
                        console.log(`1.userid:${item.userid},${symbol},空单减仓,${quantity}张,触发`)
                        c.newOrder(symbol, side, positionSide, type, { quantity: quantity }).then(res => {
                            console.log(`2.userid:${item.userid},${symbol},空单减仓,${quantity}张,成功`)
                        }).catch(err => console.error(err));
                    }
                    userPositionMessageShort[symbolIndex].positionAmt = (Number(userPositionMessageShort[symbolIndex].positionAmt) + Number(quantity)).toFixed(quantityPrecision)
                    console.log(`userid:${item.userid},当前,${symbol},空持仓数量:${userPositionMessageShort[symbolIndex].positionAmt}`)
                }
            } else {
                console.log(`userid:${item.userid},平空仓,${symbol},没有该币种,数量:${quantity}`)
            }
        })
    }
}

/**
 * 获取配置用户
 */
function updateUser() {
    let user = localStorage.getItem('user')
    if (user == null) {
        localStorage.setItem('user', JSON.stringify(configJson.follower))
        arr = configJson.follower;
    } else {
        arr = JSON.parse(user)
    }
}
/**
 * 更改持仓方向
 */
function updatePositionSide() {
    arr.forEach((item => {
        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, logger, baseURL: baseURL, wsURL: wsURL })
        c.getPositionSide().then(response => {
            let dual = response.data.dualSidePosition;
            if (!dual) {
                c.updatePositionSide(true).then(res => {
                    console.log(`更改持仓方向:${item.userid},${res}`)
                }).catch(err => {
                    console.error("更改持仓方向发生错误" + err)
                })
            }
        }).catch(err => {
            console.error("获取持仓方向发生错误" + err)
        })
    }))
}
/**
 * 主要逻辑
 */
function main() {
    getAccountInfo();
    // 获取交易所交易对
    client.exchangeInfo().then(response => {
        SymbolsEx = response.data.symbols;
        //获取listenkey
        client.listenKeyPost().then(response => {
            let listenKey = response.data.listenKey;
            setInterval(() => {
                client.listenKeyPut().then(res => {
                    console.log(`延长listenkey,60分钟`)
                })
                client.exchangeInfo().then(res => {
                    console.log('刷新交易所币种精度')
                    SymbolsEx = res.data.symbols;
                });
            }, 3000000);
            //连接ws
            const wsRef = client.userData(listenKey, {
                open: () => {
                    console.log('连接已开启')
                    setInterval(() => {
                        wsRef.ws.send(JSON.stringify({ "ping": "1" }))
                    }, 10000);
                },
                close: () => console.log('closed'),
                message: (msg) => {
                    let res = JSON.parse(msg)
                    //判断是否是心跳包返回的数据
                    if (res.e == null) {
                        obj = { o: { c: '', s: '', S: '', ps: '', q: '', type: 'MARKET' } }
                    } else if (res.e == 'ACCOUNT_CONFIG_UPDATE') {
                        // 如果修改杠杆倍数 则以修改过的杠杆倍数为准
                        account = res.ac.l
                        let symbol = res.ac.s
                        updateLeverage(symbol, account)
                    } else if (res.e == 'ORDER_TRADE_UPDATE') {
                        // 如果订单id发生改变 则保存至本地 并发起交易
                        if (order_id !== res.o.c && res.o.x == 'NEW' && obj[`${obj.o.s}`] != res.T) {
                            obj[`${obj.o.s}`] = res.T;
                            order_id = res.o.c
                            obj.o.c = res.o.c
                            obj.o.s = res.o.s
                            obj.o.S = res.o.S
                            obj.o.ps = res.o.ps
                            obj.o.q = res.o.q
                            newOrder(obj.o.s, obj.o.S, obj.o.ps, Number(obj.o.q), -1, res.o.ot)
                        };
                    }
                }
            });
        })
    });
}
function doScanOrder(pushData) {
    if (pushData.levelC) {
        updateLeverage(pushData.symbol, pushData.levelAmount)
    }
    console.log(JSON.stringify(pushData))
    newOrder(pushData.symbol, pushData.side, pushData.positionSide, Number(pushData.quantity), -1)
}

function scan() {
    let userPositionMessageLong1 = [];
    let userPositionMessageShort1 = [];
    let pushData = {}
    client.account().then(res => {
        res.data.positions.forEach((item1) => {
            if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
                userPositionMessageLong1.push(item1)
            } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
                userPositionMessageShort1.push(item1)
            }
        })
        if (!isFristRun) {
            let _userPositionMessageLong = JSON.parse(localStorage.getItem('userPositionMessageLong1'))
            let _userPositionMessageShort = JSON.parse(localStorage.getItem('userPositionMessageShort1'))
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
                                    localStorage.setItem('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                                    doScanOrder(pushData)
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
                        localStorage.setItem('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                        doScanOrder(pushData)
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
                                    localStorage.setItem('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                                    doScanOrder(pushData)
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
                        localStorage.setItem('userPositionMessageLong1', JSON.stringify(_userPositionMessageLong));
                        doScanOrder(pushData)
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
                                    localStorage.setItem('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                                    doScanOrder(pushData)
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
                        localStorage.setItem('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                        doScanOrder(pushData)
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
                                    localStorage.setItem('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                                    doScanOrder(pushData)
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
                        localStorage.setItem('userPositionMessageShort1', JSON.stringify(_userPositionMessageShort));
                        doScanOrder(pushData)
                    }
                });
            }
        }
        if (isFristRun) {
            localStorage.setItem('userPositionMessageLong1', JSON.stringify(userPositionMessageLong1))
            localStorage.setItem('userPositionMessageShort1', JSON.stringify(userPositionMessageShort1))
            isFristRun = false;
        }
    }).catch(err => console.error(err));
}
/**
 * 入口
 */
function init() {
    try {
        updateUser();
        updatePositionSide();
        getAccountInfo();
        client.exchangeInfo().then(response => {
            SymbolsEx = response.data.symbols;
            setInterval(() => {
                scan()
            }, 500);
            setInterval(() => {
                client.exchangeInfo().then(res => {
                    console.log('刷新交易所币种精度')
                    SymbolsEx = res.data.symbols;
                });
            }, 3000000);
        })
    } catch (error) {
        console.log(`系统异常:${error}`)
    }
}
//
init();

/**
 * 添加策略|将这个用户的信息加入到跟单队列
 */
app.get('/api/followuser/add', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query;
        let { userapikey, usersecretkey, userid, isRun, coinMax, ip, oderNo } = r;
        try {
            validateRequiredParameters({ userapikey, usersecretkey, userid, isRun, coinMax, ip, oderNo })
        } catch (error) {
            data.code = -1;
            data.message = error.message
            res.json(data)
            return;
        }
        r.userid = parseInt(userid)
        r.coinMax = parseInt(coinMax)
        r.isRun = isRun == 'true' ? true : false
        let symbolIndex = arr.findIndex(index => index.oderNo == r.oderNo)
        if (symbolIndex == undefined || symbolIndex == -1) {
            arr.push(r)
            let user = JSON.stringify(arr);
            localStorage.setItem('user', user)
            getAccountInfo()
            updatePositionSide()
            data.data = r;
            console.log(`添加策略成功${user}`)
            res.json(data)
        } else {
            data.code = -1;
            data.message = '该策略已经存在'
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
})

/**
 * 重启策略（重新加入跟单多列）
 */
app.get('/api/followuser/restart', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query;
        try {
            let { oderNo } = r;
            validateRequiredParameters({ oderNo })
        } catch (error) {
            data.code = -1;
            data.message = error.message
            res.json(data)
            return;
        }
        let symbolIndex = arr.findIndex(index => index.oderNo == r.oderNo)
        if (symbolIndex != undefined && symbolIndex != -1) {
            arr[symbolIndex].isRun = true;
            localStorage.setItem('user', JSON.stringify(arr))
            data.data = true;
            getAccountInfo()
            updatePositionSide()
            console.log(`重启策略成功${JSON.stringify(arr[symbolIndex])}`)
            res.json(data)
        } else {
            data.code = -2;
            data.message = '该策略不存在'
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
})

/**
 * 停止策略（停止跟单）
 */
app.get('/api/followuser/stop', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query;
        try {
            let { oderNo } = r;
            validateRequiredParameters({ oderNo })
        } catch (error) {
            data.code = -1;
            data.message = error.message
            res.json(data)
            return;
        }
        let symbolIndex = arr.findIndex(index => index.oderNo == r.oderNo)
        if (symbolIndex != undefined && symbolIndex != -1) {
            arr[symbolIndex].isRun = false;
            localStorage.setItem('user', JSON.stringify(arr))
            data.data = true;
            console.log(`停止策略成功${JSON.stringify(arr[symbolIndex])}`)
            res.json(data)
        } else {
            data.code = -2;
            data.message = '该策略不存在'
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
})

/**
 * 更新带单币种数量
 */
app.get('/api/followuser/updateCoinMax', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query;
        try {
            let { oderNo, coinMax } = r;
            validateRequiredParameters({ oderNo, coinMax })
        } catch (error) {
            data.code = -1;
            data.message = error.message
            res.json(data)
            return;
        }
        let symbolIndex = arr.findIndex(index => index.oderNo == r.oderNo)
        if (symbolIndex != undefined && symbolIndex != -1) {
            arr[symbolIndex].coinMax = parseInt(r.coinMax);
            localStorage.setItem('user', JSON.stringify(arr))
            data.data = arr[symbolIndex];
            console.log(`更新带单币种数量${JSON.stringify(arr[symbolIndex])}`)
            res.json(data)
        } else {
            data.code = -2;
            data.message = '该策略不存在'
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
})

/**
 * 策略列表 目前在跟单的用户
 */
app.get('/api/followuser/nowlists', (req, res) => {
    let data = { code: 200, message: 'ok' }
    let user = localStorage.getItem('user')
    user = JSON.parse(user)
    data.data = user
    res.json(data)
})

/**
 * 策略详情
 */
app.get('/api/followuser/detail', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        try {
            let { oderNo } = r;
            validateRequiredParameters({ oderNo })
        } catch (error) {
            data.code = -1;
            data.message = error.message
            res.json(data)
            return;
        }
        let symbolIndex = arr.findIndex(index => index.oderNo == r.oderNo)
        if (symbolIndex != undefined && symbolIndex != -1) {
            let newArr = []
            userPositionMessageLong.forEach(val => {
                if (val.userid == arr[symbolIndex].userid) {
                    newArr.push(val.symbol)
                }
            })
            let newArr2 = []
            userPositionMessageShort.forEach(val2 => {
                if (val2.userid == arr[symbolIndex].userid) {
                    newArr2.push(val2.symbol)
                }
            })
            let newArr3 = newArr.concat(newArr2.filter(v => !newArr.includes(v)))
            data.data = arr[symbolIndex];
            data.symbols = newArr3

            res.json(data)
        } else {
            data.code = -2;
            data.message = '策略编号有误'
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
})

/**
 * 移除跟单用户
 */
app.get('/api/followuser/del', (req, res) => {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        try {
            let { oderNo } = r;
            validateRequiredParameters({ oderNo })
        } catch (error) {
            data.code = -1;
            data.message = error.message
            res.json(data)
            return;
        }
        let symbolIndex = arr.findIndex(index => index.oderNo == r.oderNo)
        if (symbolIndex != undefined && symbolIndex != -1) {
            arr.splice(symbolIndex, 1)
            localStorage.setItem('user', JSON.stringify(arr))
            data.data = true;
            res.json(data)
        } else {
            data.code = -2;
            data.message = '策略编号有误'
            res.json(data)
        }
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
})

//监听
app.listen(listenPort, () => {
    console.log(`本地服务监听地址:http://127.0.0.1:${listenPort}`)
})
