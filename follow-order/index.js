const process = require('process');
const express = require('express')
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const fs = require('fs')
const Swap = require('./swap')
const { LocalStorage } = require("node-localstorage")
const { validateRequiredParameters } = require('./helpers/validation.js')
let configData = fs.readFileSync("config.json");
let configJson = JSON.parse(configData);
let listenPort = configJson.listenPort;
let proxy = configJson.proxy;
let proxyIp = configJson.proxyIp;
let apiKey = configJson.beFollowed.apiKey;
let apiSecret = configJson.beFollowed.apiSecret;
let env = configJson.env;
let brokerId = 'WcsXtG5x'
let isFirst = true;
let time = null;
//跟单人信息
let arr = [];
const baseURL = configJson.baseURL;
const wsURL = configJson.wsURL;

let client = new Swap(apiKey, apiSecret, { ip: proxyIp, port: proxy, baseURL: baseURL, wsURL: wsURL })


//持久化存储
let localStorage = new LocalStorage('./root');
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

process.on('uncaughtException', (error, source) => {
    console.log('uncaughtException',error, source)
    // client = new Swap(apiKey, apiSecret, { ip: proxyIp, port: proxy, baseURL: baseURL, wsURL: wsURL })
    // main()
});

function uuid(len, radix) {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid = [], i;
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
/**
 * 修改跟单人杠杆
 * @param {*} symbol 
 * @param {*} account 
 */
function updateLeverage(symbol, account) {
    arr.forEach((item => {
        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL })
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
    client.account().then(res => {
        console.log(`*${configJson.beFollowed.name}带单账户余额:${Number(res.data.totalWalletBalance).toFixed(4)} U`);
        arr.forEach((item => {
            let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL })
            c.account().then(res => {
                if (item.isRun) {
                    let userid = item.userid
                    let posL = {};
                    let posS = {};
                    res.data.positions.forEach((item1) => {
                        if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
                            posL = { symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'LONG', userid: userid }
                            userPositionMessageLong.push(posL)
                        } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
                            posS = { symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'SHORT', userid: userid }
                            userPositionMessageShort.push(posS)
                        }
                    })
                    console.log(`*跟单用户:${userid},余额:${Number(res.data.totalWalletBalance).toFixed(4)} U \n*跟单用户:${userid},多单持仓:${JSON.stringify(posL)} | 空单持仓:${JSON.stringify(posS)}`)
                }
            }).catch(err => console.error(err));
        }))
    }).catch(err => console.error(err));
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
function doOrder(symbol, side, positionSide, quantity, price, type = 'MARKET') {
    let minAmount = 0;
    let quantity_1 = quantity;
    SymbolsEx.map((v, i) => {
        if (v.symbol == symbol) {
            v.pricePrecision;
            if (price > 0) {
                minAmount = Number(Number(7 / price).toFixed(v.quantityPrecision))
            }
            quantityPrecision = v.quantityPrecision;
        }
    });
    // 1.带单账户资金
    client.account().then(balanceInfo => {
        let balance = Number(balanceInfo.data.totalWalletBalance);
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
                        console.log(`用户:${item.userid},跟单,${symbol}币种超限,最高可跟${item.coinMax}`)
                    } else {
                        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL });
                        c.account().then(balanceInfo1 => {
                            let balance1 = Number(balanceInfo1.data.totalWalletBalance);
                            quantity = Number((quantity_1 * balance1 / balance).toFixed(quantityPrecision))
                            if (quantity < minAmount) {
                                quantity = minAmount;
                            }
                            if (env == "dev") {
                                console.log(`${env}=>用户:${item.userid},做多,${configJson.beFollowed.name}带单开:${quantity_1}张,跟单开:${quantity}张,${symbol},下单成功`)
                            }
                            if (env == "prod") {
                                c.newOrder(symbol, side, positionSide, type, { quantity: quantity, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                                    console.log(`用户:${item.userid},${symbol},下单成功`)
                                }).catch(err => console.error(err));
                            }
                            if (isHaveThisSymbol == undefined) {
                                userPositionMessageLong.push({ symbol: symbol, positionAmt: quantity, positionSide: 'LONG', userid: item.userid })
                                console.log(`用户:${item.userid},${symbol},做多,${configJson.beFollowed.name}带单开:${quantity_1}张,跟单开:${quantity}张,当前多单持仓数量:${quantity}张`)
                            } else {
                                userPositionMessageLong[symbolIndex].positionAmt = (Number(userPositionMessageLong[symbolIndex].positionAmt) + Number(quantity)).toFixed(quantityPrecision)
                                console.log(`用户:${item.userid},${symbol},做多,${configJson.beFollowed.name}带单开:${quantity_1}张,跟单开:${quantity}张,当前多单持仓数量:${userPositionMessageLong[symbolIndex].positionAmt}`)
                            }
                        });
                    }
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
                        console.log(`用户:${item.userid},跟单,${symbol}币种超限,最高可跟${item.coinMax}`)
                    } else {
                        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL })
                        c.account().then(balanceInfo1 => {
                            let balance1 = Number(balanceInfo1.data.totalWalletBalance);
                            quantity = Number((quantity_1 * balance1 / balance).toFixed(quantityPrecision))
                            if (quantity < minAmount) {
                                quantity = minAmount;
                            }
                            if (env == "dev") {
                                console.log(`${env}=>用户:${item.userid},做空,${configJson.beFollowed.name}带单开:${quantity_1}张,跟单开:${quantity}张,${symbol},下单成功`)
                            }
                            if (env == "prod") {
                                c.newOrder(symbol, side, positionSide, type, { quantity: quantity, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                                    console.log(`用户:${item.userid},${symbol},下单成功`)
                                }).catch(err => console.error(err));
                            }
                            if (isHaveThisSymbol2 == undefined) {
                                userPositionMessageShort.push({ symbol: symbol, positionAmt: -Number(quantity), positionSide: 'SHORT', userid: item.userid })
                                console.log(`用户:${item.userid},${symbol},做空,${configJson.beFollowed.name}带单开:${quantity_1}张,跟单开:${quantity}张,空单持仓数量${-quantity}`)
                            } else {
                                userPositionMessageShort[symbolIndex2].positionAmt = (Number(userPositionMessageShort[symbolIndex2].positionAmt) - Number(quantity)).toFixed(quantityPrecision)
                                console.log(`用户:${item.userid},${symbol},做空,${configJson.beFollowed.name}带单开:${quantity_1}张,跟单开:${quantity}张,空单持仓数量${userPositionMessageShort[symbolIndex2].positionAmt}`)
                            }
                        });
                    }
                }
            })
        } else if (positionSide == 'LONG' && side == 'SELL') {
            //平做多的仓
            arr.forEach(item => {
                // 获取该用户所持有币种
                if (item.isRun) {
                    let newArr = []
                    userPositionMessageLong.forEach(val => {
                        if (val.userid == item.userid) {
                            newArr.push(val.symbol)
                        }
                    })
                    // 判断有没有该币种
                    let isHaveThisSymbol = newArr.find(item1 => item1 == symbol)
                    let symbolIndex = userPositionMessageLong.findIndex(index => index.userid == item.userid && index.symbol == symbol)
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL })
                    c.account().then(balanceInfo1 => {
                        let balance1 = Number(balanceInfo1.data.totalWalletBalance);
                        quantity = Number((quantity_1 * balance1 / balance).toFixed(quantityPrecision))
                        balanceInfo1.data.positions.forEach((item1) => {
                            if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
                                userPositionMessageLong[symbolIndex] = { symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'LONG', userid: item.userid }
                            } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
                                userPositionMessageShort[symbolIndex] = { symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'SHORT', userid: item.userid }
                            }
                        });
                        if (isHaveThisSymbol !== undefined) {
                            let flag = ''
                            let number = 0;
                            if (Math.abs(Number(userPositionMessageLong[symbolIndex].positionAmt)) <= Math.abs(Number(quantity))) {
                                flag = '平多清仓'
                                //清仓
                                number = Number(userPositionMessageLong[symbolIndex].positionAmt)

                                if (env == "dev") {
                                    console.log(`${env}=>用户:${item.userid},平多清仓,${number}张,带单清:${quantity_1}张,${symbol},成功`)
                                }
                                if (env == "prod") {
                                    c.newOrder(symbol, side, positionSide, type, { quantity: number, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                                        console.log(`用户:${item.userid},${symbol},下单成功`)
                                    }).catch(err => client.logger.error(err));
                                }
                                userPositionMessageLong.splice(symbolIndex, 1)
                            } else {
                                flag = '多单减仓'
                                if (env == "dev") {
                                    console.log(`${env}=>用户:${item.userid},多单减仓,${quantity}张,带单减:${quantity_1}张,${symbol},成功`)
                                }
                                if (env == "prod") {
                                    c.newOrder(symbol, side, positionSide, type, { quantity: quantity, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                                        console.log(`用户:${item.userid},${symbol},下单成功`)
                                    }).catch(err => console.error(err));
                                }
                                number = quantity;
                                userPositionMessageLong[symbolIndex].positionAmt = (Number(userPositionMessageLong[symbolIndex].positionAmt) - Number(quantity)).toFixed(quantityPrecision)
                            }
                            console.log(`用户:${item.userid},${flag},${number}张,带单减:${quantity_1}张,当前,${symbol},多单持仓数量:${userPositionMessageLong[symbolIndex].positionAmt}`)
                        } else {
                            console.log(`用户:${item.userid},平多仓,${symbol},没有该币种`)
                        }
                    })
                }
            })
        } else if (positionSide == 'SHORT' && side == 'BUY') {
            //平做空的仓
            arr.forEach(item => {
                if (item.isRun) {
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
                    let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL })
                    c.account().then(balanceInfo1 => {
                        let balance1 = Number(balanceInfo1.data.totalWalletBalance);
                        quantity = Number((quantity_1 * balance1 / balance).toFixed(quantityPrecision));
                        balanceInfo1.data.positions.forEach((item1) => {
                            if (Number(item1.positionAmt) > 0 && item1.positionSide == 'LONG') {
                                userPositionMessageLong[symbolIndex] = { symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'LONG', userid: item.userid }
                            } else if (Number(item1.positionAmt) < 0 && item1.positionSide == 'SHORT') {
                                userPositionMessageShort[symbolIndex] = { symbol: item1.symbol, positionAmt: item1.positionAmt, positionSide: 'SHORT', userid: item.userid }
                            }
                        });
                        if (isHaveThisSymbol !== undefined) {
                            let flag = ''
                            let number1 = 0;
                            if (Math.abs(Number(userPositionMessageShort[symbolIndex].positionAmt)) <= Math.abs(Number(quantity))) {
                                //清仓
                                flag = '平空清仓'
                                number = Number(userPositionMessageShort[symbolIndex].positionAmt)
                                number1 = -number;
                                if (env == "dev") {
                                    console.log(`${env}=>用户:${item.userid},${symbol},平空清仓,${-number}张,带单清:${quantity_1}张,成功`)
                                }
                                if (env == "prod") {
                                    c.newOrder(symbol, side, positionSide, type, { quantity: -number, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                                        console.log(`用户:${item.userid},${symbol},下单成功`)
                                    }).catch(err => client.logger.error(err));
                                }
                                userPositionMessageShort.splice(symbolIndex, 1)
                            } else {
                                flag = '空单减仓'
                                if (env == "dev") {
                                    console.log(`${env}=>用户:${item.userid},${symbol},空单减仓,${quantity}张,带单减:${quantity_1}张,成功`)
                                }
                                if (env == "prod") {
                                    c.newOrder(symbol, side, positionSide, type, { quantity: quantity, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                                        console.log(`用户:${item.userid},${symbol},成功`)
                                    }).catch(err => console.error(err));
                                }
                                number1 = quantity;
                                userPositionMessageShort[symbolIndex].positionAmt = (Number(userPositionMessageShort[symbolIndex].positionAmt) + Number(quantity)).toFixed(quantityPrecision)
                            }
                            console.log(`用户:${item.userid},${flag},${number1}张,带单减:${quantity_1}张,当前,${symbol},空持仓数量:${userPositionMessageShort[symbolIndex].positionAmt}`)
                        } else {
                            console.log(`平空仓,${symbol},用户:${item.userid},没有该币种`)
                        }
                    });
                }
            })
        }
    }).catch(err => {
        console.log(`下单err:${err}`)
    });
}

/**
 * 获取配置用户
 */
function updateUser() {
    localStorage.setItem('user', JSON.stringify(configJson.follower))
    arr = configJson.follower;
}
/**
 * 更改持仓方向
 */
function updatePositionSide() {
    arr.forEach((item => {
        let c = new Swap(item.userapikey, item.usersecretkey, { ip: item.ip, port: proxy, baseURL: baseURL, wsURL: wsURL })
        c.getPositionSide().then(response => {
            let dual = response.data.dualSidePosition;
            if (!dual) {
                c.updatePositionSide(true).then(res => {
                    console.log(`更改持仓方向:${item.userid}`)
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
                    console.log(`延长listenkey,25分钟`)
                })
                client.exchangeInfo().then(res => {
                    console.log('刷新交易所币种精度')
                    SymbolsEx = res.data.symbols;
                });
            }, 25 * 60 * 1000);
            //连接ws
            let wsRef = client.userData(listenKey, {
                open: () => {
                    console.log('策略启动完成...')
                    setInterval(() => {
                        wsRef.ws.send(JSON.stringify({ "ping": "1" }));
                    }, 8 * 60 * 1000);
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
                        if (order_id !== res.o.c && res.o.x == 'TRADE' && obj[`${obj.o.s}`] != res.T) {
                            obj[`${obj.o.s}`] = res.T;
                            order_id = res.o.c
                            obj.o.c = res.o.c
                            obj.o.s = res.o.s
                            obj.o.S = res.o.S
                            obj.o.ps = res.o.ps
                            obj.o.q = res.o.q
                            doOrder(obj.o.s, obj.o.S, obj.o.ps, Number(obj.o.q), Number(res.o.ap))
                            console.log(`${configJson.beFollowed.name}`, res.o.s, res.o.S, res.o.ps, res.o.q, res.o.ot, res.o.ap)
                        } 
                        // else {
                        //     console.log(`NoCare=>${configJson.beFollowed.name}`, res.o.s, res.o.S, res.o.ps, res.o.q, res.o.ot, res.o.ap)
                        // }
                    }
                }
            });
            // client.combinedStreams(['ethusdt@ticker'], {
            //     open: () => {
            //         console.log(`ethusdt@ticker订阅`)
            //     },
            //     close: () => console.log('ethusdt@ticker订阅 关闭'),
            //     message: (msg) => {
            //         if (time == null || Date.now() - time > 5 * 60 * 1000) {
            //             msg = JSON.parse(msg)
            //             time = Date.now()
            //             console.log(`ethusdt@ticker订阅:${msg.data.s}:${msg.data.c}U`)
            //         }
            //     }
            // })
            setInterval(() => {
                console.log('主动断线重连')
                wsRef.ws.close()
            }, 60 * 60 * 1000);
        })
    });
}
/**
 * 入口
 */
function init() {
    try {
        updateUser()
        updatePositionSide()
        main()
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
 * 更新币种数量
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
