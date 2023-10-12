/* 线上使用
 * @Author: topbrids@gmail.com 
 * @Date: 2022-12-17 10:21:29 
 * @Last Modified by:   topbrids@gmail.com 
 * @Last Modified time: 2022-12-17 10:21:29 
 */

const { _N, DateFormat } = require('binance-futures-connector')

const bitgetApi = require('bitget-openapi');
const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
// const apiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
// const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
// const passphrase = 'toptoptop';

// const apiKey = 'bg_bd1bff02d35c721c1b667a84ae4bda1a';
// const secretKey = '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b';
// const passphrase = 'xh18819513042';

const apiKey = 'bg_e14c97c637bb1af1e24f884de2d1373d';
const secretKey = 'aa377cb16de74d694d54e8cc23899c346f867ec32d75298089004713cb9bc5fa';
const passphrase = 'Ay181818';

let exInfo = []
let dt = null
let httpsAgent = new HttpsProxyAgent({ host: '127.0.0.1', port: 1087 })
const mixAccountApi = new bitgetApi.MixAccountApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixPositionApi = new bitgetApi.MixPositionApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixMarketApi = new bitgetApi.MixMarketApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixOrderApi = new bitgetApi.MixOrderApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });

//下单接口
const Buy = async (mixOrderApi, mixMarketApi, symbol, amount, nowPrice, price = -1) => {
    if (nowPrice == undefined) {
        return 'nowPrice 不能为空'
    }
    if (dt == null || Date.now() - dt > 10 * 60 * 1000) {
        dt = Date.now()
        let res = await mixMarketApi.contracts('umcbl');
        exInfo = res.data;
    }
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    let volumePlace = 3;
    let minTradeNum = 0;
    exInfo.map(v => {
        if (v.symbol == placeOrderReq.symbol) {
            volumePlace = Number(v.volumePlace)
            minTradeNum = Number(v.minTradeNum)
        }
    })
    if (amount / nowPrice < minTradeNum) {
        amount = minTradeNum
    } else {
        amount = _N(amount / nowPrice, volumePlace)
    }

    placeOrderReq.marginCoin = 'USDT'
    placeOrderReq.size = amount
    placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
    if (price != -1) {
        placeOrderReq.price = price
    }
    placeOrderReq.side = 'open_long'
    let res = await mixOrderApi.placeOrder(placeOrderReq);
    console.log('买入开多', res, JSON.stringify(res), JSON.stringify(placeOrderReq))
    return res;
}

const BuyByQ = async (mixOrderApi, symbol, amount, price = -1) => {
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    placeOrderReq.marginCoin = 'USDT'
    placeOrderReq.size = amount
    placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
    if (price != -1) {
        placeOrderReq.price = price
    }
    placeOrderReq.side = 'open_long'
    let res = await mixOrderApi.placeOrder(placeOrderReq);
    console.log('买入开多BYQ', res, JSON.stringify(res), JSON.stringify(placeOrderReq))
    return res;
}
const BuyClose = async (mixOrderApi, symbol, amount, price = -1) => {
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    placeOrderReq.marginCoin = 'USDT'
    placeOrderReq.size = amount
    placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
    if (price != -1) {
        placeOrderReq.price = price
    }
    placeOrderReq.side = 'close_long'
    let res = await mixOrderApi.placeOrder(placeOrderReq);
    console.log('卖出平多|1|', res, JSON.stringify(res), JSON.stringify(placeOrderReq))
    return res;
}
const BuyCloseAll = async (mixOrderApi, mixPositionApi, symbol, amount, price = -1) => {
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    placeOrderReq.marginCoin = 'USDT'
    let pos = await mixPositionApi.singlePosition(placeOrderReq.symbol, placeOrderReq.marginCoin)
    pos.data.map(v => {
        if (v.holdSide == 'long') {
            amount = Math.abs(Number(v.available))
        }
    })
    if (amount > 0) {
        placeOrderReq.size = amount
        placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
        if (price != -1) {
            placeOrderReq.price = price
        }
        placeOrderReq.side = 'close_long'
        let res = await mixOrderApi.placeOrder(placeOrderReq);
        console.log('卖出平多|2|', res, JSON.stringify(res))
        return res;
    }
    return null
}
const Sell = async (mixOrderApi, mixMarketApi, symbol, amount, nowPrice, price = -1) => {
    if (nowPrice == undefined) {
        return 'nowPrice 不能为空'
    }
    if (dt == null || Date.now() - dt > 10 * 60 * 1000) {
        dt = Date.now()
        let res = await mixMarketApi.contracts('umcbl');
        exInfo = res.data;
    }
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    let volumePlace = 3;
    let minTradeNum = 0;
    exInfo.map(v => {
        if (v.symbol == placeOrderReq.symbol) {
            volumePlace = Number(v.volumePlace)
            minTradeNum = Number(v.minTradeNum)
        }
    })
    if (amount / nowPrice < minTradeNum) {
        amount = minTradeNum
    } else {
        amount = _N(amount / nowPrice, volumePlace)
    }

    placeOrderReq.marginCoin = 'USDT'
    placeOrderReq.size = amount
    placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
    if (price != -1) {
        placeOrderReq.price = price
    }
    placeOrderReq.side = 'open_short'
    let res = await mixOrderApi.placeOrder(placeOrderReq);
    console.log('卖出开空', res, JSON.stringify(res))
    return res;
}
const SellByQ = async (mixOrderApi, symbol, amount, price = -1) => {
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    placeOrderReq.marginCoin = 'USDT'
    placeOrderReq.size = amount
    placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
    if (price != -1) {
        placeOrderReq.price = price
    }
    placeOrderReq.side = 'open_short'
    let res = await mixOrderApi.placeOrder(placeOrderReq);
    console.log('卖出开空BYQ', res, JSON.stringify(res), JSON.stringify(placeOrderReq))
    return res;
}
const SellClose = async (mixOrderApi, symbol, amount, price = -1) => {
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    placeOrderReq.marginCoin = 'USDT'
    placeOrderReq.size = amount
    placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
    if (price != -1) {
        placeOrderReq.price = price
    }
    placeOrderReq.side = 'close_short'
    let res = await mixOrderApi.placeOrder(placeOrderReq);
    console.log('买入平空|1|', res, JSON.stringify(res), JSON.stringify(placeOrderReq))
    return res;
}
const SellCloseAll = async (mixOrderApi, mixPositionApi, symbol, amount, price = -1) => {
    let placeOrderReq = new PlaceOrderReq();
    placeOrderReq.symbol = `${symbol}_UMCBL`
    placeOrderReq.marginCoin = 'USDT'
    let pos = await mixPositionApi.singlePosition(placeOrderReq.symbol, placeOrderReq.marginCoin)
    pos.data.map(v => {
        if (v.holdSide == 'short') {
            amount = Math.abs(Number(v.available))
        }
    })
    if (amount > 0) {
        placeOrderReq.size = amount
        placeOrderReq.orderType = price == -1 ? 'market' : 'limit'
        if (price != -1) {
            placeOrderReq.price = price
        }
        placeOrderReq.side = 'close_short'
        let res = await mixOrderApi.placeOrder(placeOrderReq);
        console.log('买入平空|2|', res, JSON.stringify(res), JSON.stringify(placeOrderReq))
        return res;
    }
    return null;

}

//获取价格

// mixMarketApi.ticker('ETHUSDT_UMCBL').then(res => {
//     console.log(res)
//     console.log(res.data.last)
// })

// 查询历史订单 curl "https://api.bitget.com/api/mix/v1/order/history
//?symbol=BTCUSDT_UMCBL&startTime=1659403328000&endTime=1659410528000&pageSize=20" \

// mixOrderApi.history('ETHUSDT_UMCBL', new Date('2022-12-14 19:14:50').getTime(), new Date('2022-12-16 19:14:50').getTime(), 20).then(res => {
//     console.log(res)
// })
//
// 查询订单
// let totalProfit = 0;
// let totalFee = 0
// let orderArrs = []
// mixOrderApi.fills2('ETHUSDT_UMCBL', new Date('2022-12-16 00:00:00').getTime(), new Date('2022-12-17 19:14:50').getTime()).then(res => {

//     // res = JSON.parse(res)
//     let data = res.data.reverse()
//     data.map(v => {
//         let o = {}
//         totalProfit = totalProfit + Number(v.profit) + Number(v.fee)
//         totalFee = totalFee + Math.abs(Number(v.fee))
//         v['操作'] = v.side == 'open_short' ? '开空' : v.side == 'close_short' ? '平空' : v.side == 'open_long' ? '开多' : v.side == 'close_long' ? '平多' : ''
//         v['价格'] = v.price
//         v['单笔手续费'] = v.fee
//         v['单笔收益'] = v.profit
//         v['下单数量'] = v.sizeQty + 'ETH'
//         v['总收益'] = totalProfit
//         v['总手续费'] = totalFee
//         v['平仓时间'] = DateFormat(Number(v.cTime))

//         o['操作'] = v.side == 'open_short' ? '开空' : v.side == 'close_short' ? '平空' : v.side == 'open_long' ? '开多' : v.side == 'close_long' ? '平多' : ''
//         o['价格'] = v.price
//         o['单笔手续费'] = v.fee
//         o['单笔收益'] = v.profit
//         o['下单数量'] = v.sizeQty + 'ETH'
//         o['总收益'] = totalProfit
//         o['总手续费'] = totalFee
//         o['平仓时间'] = DateFormat(Number(v.cTime))
//         orderArrs.push(o)
//     })
//     console.log(orderArrs, '总计下单:', orderArrs.length / 2)
// })
// 查询订单

// Buy(mixOrderApi, mixMarketApi, 'ETHUSDT', 50, 1332)
// BuyByQ(mixOrderApi, 'ETHUSDT', 0.03)
// SellByQ(mixOrderApi, 'ETHUSDT', 0.03)
BuyCloseAll(mixOrderApi, mixPositionApi, 'ETHUSDT')
// Sell(mixOrderApi, mixMarketApi, 'ETHUSDT', 50, 1332)
SellCloseAll(mixOrderApi, mixPositionApi, 'ETHUSDT')


// console.log('合约信息接口')
// mixMarketApi.contracts('umcbl').then(res => {
//     console.log(res)
// });

//获取单个账户信息

// mixAccountApi.account('BTCUSDT_UMCBL', 'USDT').then((data) => {
//     console.log(data);
// }).catch(err => {
//     console.log(err)
// });

//获取账户信息列表

// mixAccountApi.accounts('umcbl').then((data) => {
//     console.log(data);
// }).catch(err => {
//     console.log(err)
// });

// 获取可开数量--不好用

// let q1 = new bitgetApi.OpenCountReq();
// q1.symbol = 'BTCUSDT_UMCBL'
// q1.marginCoin = 'USDT'
// q1.openPrice = '20000'
// q1.leverage = 20;
// q1.openAmount = 100;
// mixAccountApi.openCount(q1).then(r1 => console.log(r1))

//获取单个合约仓位信息
// mixPositionApi.singlePosition('ETHUSDT_UMCBL', 'USDT').then(r => {
//     console.log(r)
// });


//websocket

// const bitgetWsClient = new BitgetWsClient({
//     reveice: (message) => {
//         // console.log('>>>' + message, typeof (message), message.startsWith('{'));
//         if (message.startsWith('{')) {
//             message = JSON.parse(message)
//             if (message.action != undefined) {
//                 console.log('>>>' + Number(message.data[0].markPrice));
//             }
//         }


//     }
// }, apiKey, secretKey, passphrase);

// const subArr = new Array();

// const subscribeOne = new SubscribeReq('mc', 'ticker', 'ETHUSDT');
// const subscribeTow = new SubscribeReq('SP', 'candle1W', 'BTCUSDT');

// subArr.push(subscribeOne);
// subArr.push(subscribeTow);

// bitgetWsClient.subscribe(subArr)

// setTimeout(() => {
//     bitgetWsClient.send('ping')
//     console.log('1')
// }, 10 * 1000);
// setInterval(() => {
//     bitgetWsClient.send('ping')
//     console.log('12')
// }, 5 * 1000);


module.exports = {
    Buy,
    BuyByQ,
    Sell,
    SellByQ,
    BuyClose,
    SellClose,
    BuyCloseAll,
    SellCloseAll
}