let { cf, cs, configJson, TA } = require('../app/binanceApi')
const telegram = require('telegram-bot-api') //2.0.0
const fs = require('fs');
const path = require('path');
let brokerId = 'ZY3E26JR'
let tgParams = { token: configJson.teleBotToken }
if (configJson.env == "dev") {
    let http_proxy = {
        host: configJson.proxyIp,
        port: configJson.proxy
    }
    tgParams.http_proxy = http_proxy
}
let tgApi = new telegram(tgParams)
let mp = new telegram.GetUpdateMessageProvider()
tgApi.setMessageProvider(mp)

const init_tg = () => {
    tgApi.start().then(() => {
        console.log('initTG API is started')
    }).catch(res => {
        console.log(res)
    })
}
let uuid = (len, radix) => {
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
const send_msg = (msg) => {
    // configJson.chat_id.map(v => {
    //     tgApi.sendMessage({
    //         chat_id: v,
    //         text: msg,
    //         parse_mode: 'Markdown'
    //     });
    // })
    console.log(`tg=>:${msg}`)
}

const msg_on = () => {
    tgApi.on('update', update => {
        // 处理信息逻辑
        let message = update.message
        let info = '';
        let isPrice = message.text.indexOf('price') != -1
        if (isPrice) {
            let sysbom1 = message.text.replace(/\r\n/g, "")
            let sysbom2 = sysbom1.replace("price", "").replace(/\r\n/g, "")
            let sysbom3 = sysbom2.replace(" ", "")
            cf.price({ symbol: sysbom3.toUpperCase() }).then(res => {
                if (res.status == 200) {
                    info = `symbol:${res.data.symbol}\r\nprice:${res.data.price}\r\n${TA.getDate(res.data.time)}`
                    // Send
                    tgApi.sendAnimation({
                        chat_id: message.chat.id,
                        caption: `价格通知📢\r\n${info}`,
                        animation: fs.createReadStream(path.join(__dirname, '../data/img/aelf.jpg'))
                    })
                }
            }).catch(err => {
                info = `${JSON.stringify(err)}`
                // Send
                tgApi.sendAnimation({
                    chat_id: message.chat.id,
                    caption: `异常通知😁\r\n${info}`,
                    animation: fs.createReadStream(path.join(__dirname, '../data/img/aelf.jpg'))
                })
                console.log(err)
            });
        }
    })
}
/**
 * 合约多单买入
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const buy = (symbol, quantity, price = -1) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'BUY', 'LONG', 'MARKET', { quantity: quantity }).then(res => {
                console.log('市价,开多,买入成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log('市价,开多,买入异常', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'BUY', 'LONG', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log('限价,开多,买入成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log('限价,开多,买入异常', err)
                reject(err)
            });
        }
    });
}

/**
 * 合约多单-卖出平多
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const buy_close = (symbol, quantity, price = -1) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'SELL', 'LONG', 'MARKET', { quantity: quantity }).then(res => {
                console.log(symbol, '市价,平多,卖出成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '市价,平多,卖出异常', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'SELL', 'LONG', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log(symbol, '限价,平多,卖出成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '限价,平多,卖出异常', err)
                reject(err)
            });
        }
    });
}

/**
 * 合约卖出开空
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const sell = (symbol, quantity, price = -1) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'SELL', 'SHORT', 'MARKET', { quantity: quantity }).then(res => {
                console.log(symbol, '市价,开空,卖出成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '市价,开空,卖出异常', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'SELL', 'SHORT', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log(symbol, '限价,开空,卖出成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '限价,开空,卖出异常', err)
                reject(err)
            });
        }
    });
}

/**
 * 合约 空单 买入平空
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const sell_close = (symbol, quantity, price = -1) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'BUY', 'SHORT', 'MARKET', { quantity: quantity }).then(res => {
                console.log(symbol, '市价,平空,买入成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '市价,平空,买入异常', err.response.data)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'BUY', 'SHORT', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log(symbol, '限价,平空,买入成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '限价,平空,买入异常', err.response.data)
                reject(err)
            });
        }
    });
}
const spot_order = (symbol, side = 'BUY', type = 'MARKET', options = {}) => {
    let _options = Object.assign(options, {
        newClientOrderId: `x-${brokerId}_${uuid(16)}`
    })
    return new Promise((resolve, reject) => {
        cs.newOrder(symbol, side, type, _options).then(res => {
            console.log(symbol, `spot,${type},${side},买入成功`, res.status)
            resolve(res);
        }).catch(err => {
            console.log(symbol, `spot,${type},${side},买入异常`, err.response.data)
            reject(err)
        });
    });
}

const buy_xh = (symbol, quantity, price = -1) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cs.newOrder(symbol, 'BUY', 'MARKET', { quoteOrderQty: quantity, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                console.log(symbol, '现货,市价,开多,买入成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '现货,市价,开多,买入异常', err.response.data)
                reject(err)
            });
        } else {
            cs.newOrder(symbol, 'BUY', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC', newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                console.log('现货,限价,开多,买入成功', res.status)
                resolive(res);
            }).catch(err => {
                console.log('现货,限价,开多,买入异常', err.response.data)
                reject(err)
            });
        }
    });
}

const sell_xh = (symbol, quantity, price = -1) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cs.newOrder(symbol, 'SELL', 'MARKET', { quantity: quantity, newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                console.log(symbol, '现货,市价,卖出成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '现货,市价,卖出异常', err.response.data)
                reject(err)
            });
        } else {
            cs.newOrder(symbol, 'SELL', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC', newClientOrderId: `x-${brokerId}_${uuid(16)}` }).then(res => {
                console.log(symbol, '现货,限价,卖出成功', res.status)
                resolve(res);
            }).catch(err => {
                console.log(symbol, '现货,限价,卖出异常', err.response.data)
                reject(err)
            });
        }
    });
}
/**
     * 标准的OHLC结构，用来画K线和指标计算分析。由exchange.GetRecords()函数返回此结构的数组。每一个Record结构代表一个K线柱，即一根K线BAR。Record其中的Time为这根K线柱周期的起始时间。
     * @param {*} symbol 
     * @param {*} interval 
     * @param {*} limit 
     * @returns 
     */
const records_xh = (symbol, interval, limit = 1000) => {
    let records = [];
    return new Promise((resolve, reject) => {
        cs.klines(symbol, interval, { limit: limit }).then(res => {
            res.data.map(v => {
                let d = {};
                d.Time = v[0]
                d.Open = Number(v[1])
                d.High = Number(v[2])
                d.Low = Number(v[3])
                d.Close = Number(v[4])
                d.Volume = Number(v[5])
                records.push(d);
            });
            resolve(records)
        }).catch(err => {
            console.log(err)
            reject(records)
        })
    });
}

module.exports = {
    buy,
    buy_close,
    sell,
    sell_close,
    buy_xh,
    sell_xh,
    init_tg,
    send_msg,
    msg_on,
    records_xh
}