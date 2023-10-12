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

/**
 * 入口
 */
function init() {
    try {
        client.exchangeInfo().then(response => {
            SymbolsEx = response.data.symbols;
            
        })
    } catch (error) {
        console.log(`系统异常:${error}`)
    }
}
//
init();


//监听
app.listen(listenPort, () => {
    console.log(`本地服务监听地址:http://127.0.0.1:${listenPort}`)
})
