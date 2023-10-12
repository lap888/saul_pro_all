const { _N, DateFormat, XhSpot, Future, Log } = require('binance-futures-connector')

const bitgetApi = require('bitget-openapi');
const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
// const apiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
// const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
// const passphrase = 'toptoptop';

// const apiKey = 'bg_bd1bff02d35c721c1b667a84ae4bda1a';
// const secretKey = '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b';
// const passphrase = 'xh18819513042';


// const apiKey = 'bg_8a8063afa063183cdf8973eddb932399';
// const secretKey = '31a8ea93cccd5993273bff0ae7ea4a9ebbcf98fc62551238af8618e6188c7c1b';
// const passphrase = 'Ay888888';


const apiKey = 'bg_9533b531ac6a36c75b86422eb7e4e272';
const secretKey = '2849a68e39b9605e09072905cabf2ed463bef43c3f8a6d9f167604eb163afed5';
const passphrase = 'toptoptop';
// apiKey: 'bg_9533b531ac6a36c75b86422eb7e4e272',
        // secretKey: '2849a68e39b9605e09072905cabf2ed463bef43c3f8a6d9f167604eb163afed5',
        // passphrase: 'toptoptop',

const ExKey = [
    {
        id: 1,
        name: '卓越',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        amount: 3
    },
    // {
    //     id: 2,
    //     name: 'MirLiu',
    //     apiKey: 'bg_8a8063afa063183cdf8973eddb932399',
    //     secretKey: '31a8ea93cccd5993273bff0ae7ea4a9ebbcf98fc62551238af8618e6188c7c1b',
    //     passphrase: 'Ay888888',
    //     amount: 5
    // },
    // {
    //     id: 3,
    //     name: 'Qee',
    //     apiKey: 'bg_ca1ffdca50e1ac4c74411c584c2d4cea',
    //     secretKey: '6a1a36b6a197ba83936ab0c2662633414c505f967975e18a8210086ad152044a',
    //     passphrase: 'ww123456',
    //     amount: 5
    // }
]

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

// 查询订单
// ExKey.map(v => {
//     let totalProfit = 0;
//     let totalProfit1 = 0;
//     let totalFee = 0
//     let orderArrs = []
//     let t1 = '2022-12-16 00:00:00'
//     let t2 = '2022-12-30 00:00:00'
//     let mixOrderApi = new bitgetApi.MixOrderApi(v.apiKey, v.secretKey, v.passphrase, { proxy: false, httpsAgent: httpsAgent });
//     mixOrderApi.fills2('ETHUSDT_UMCBL', new Date(t1).getTime(), new Date(t2).getTime()).then(res => {

//         // res = JSON.parse(res)
//         let data = res.data.reverse()
//         data.map(v => {
//             let o = {}
//             totalProfit = totalProfit + Number(v.profit) //+ Number(v.fee)
//             totalProfit1 = totalProfit1 + Number(v.profit) + Number(v.fee)*0.5
//             totalFee = totalFee + Math.abs(Number(v.fee))
//             o['操作'] = v.side == 'open_short' ? '开空' : v.side == 'close_short' ? '平空' : v.side == 'open_long' ? '开多' : v.side == 'close_long' ? '平多' : ''
//             o['价格'] = v.price
//             o['单笔手续费'] = v.fee
//             o['单笔收益'] = v.profit
//             o['下单数量'] = v.sizeQty + 'ETH'
//             o['总收益'] = totalProfit
//             o['净收益'] = totalProfit1
//             o['总手续费'] = totalFee
//             o['时间'] = DateFormat(Number(v.cTime))
//             orderArrs.push(o)
//         })
//         let mixAccountApi = new bitgetApi.MixAccountApi(v.apiKey, v.secretKey, v.passphrase, { proxy: false, httpsAgent: httpsAgent });
//         mixAccountApi.account('ETHUSDT_UMCBL', 'USDT').then((data) => {

//             console.log(v.name, `余额:${data.data.available}`, t1, '-', t2, '总计下单:', orderArrs.length / 2, orderArrs)
//         }).catch(err => {
//             console.log(err)
//         });

//     })
// })

// 查询订单

// Buy(mixOrderApi, mixMarketApi, 'ADAUSDT', 20, 1332)
// BuyByQ(mixOrderApi, 'ADAUSDT', 20)
// SellByQ(mixOrderApi, 'ADAUSDT', 20)
// BuyCloseAll(mixOrderApi, mixPositionApi, 'ADAUSDT')
// Sell(mixOrderApi, mixMarketApi, 'ETHUSDT', 50, 1332)
// SellCloseAll(mixOrderApi, mixPositionApi, 'ETHUSDT')


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

mixPositionApi.singlePosition('ADAUSDT_UMCBL', 'USDT').then(r => {
    r.data.map(v=>{
        v['ct']=DateFormat(Number(v.cTime))
    })
    console.log(r)
});


//websocket
// let bgP = {}
// let bitgetWsClient = new BitgetWsClient({
//     reveice: (message) => {
//         // console.log('>>>' + message, typeof (message), message.startsWith('{'));
//         if (message.startsWith('{')) {
//             message = JSON.parse(message)
//             if (message.action != undefined) {
//                 bgP[message.data[0].instId] = Number(message.data[0].markPrice)
//                 console.log(DateFormat(), `${message.data[0].instId} => ` + Number(message.data[0].markPrice), bgP,message);
//             }
//         }
//     },
// }, apiKey, secretKey, passphrase);

// let subArr = new Array();

// let subscribeOne = new SubscribeReq('mc', 'ticker', 'ETHUSDT');
// // let s2 = new SubscribeReq('mc', 'ticker', 'BTCUSDT');
// // let s3 = new SubscribeReq('mc', 'ticker', 'LTCUSDT');

// subArr.push(subscribeOne);
// // subArr.push(s2);
// // subArr.push(s3);

// bitgetWsClient.subscribe(subArr);
// bitgetWsClient.on('open', () => {
//     console.log('open==')
//     setInterval(() => {
//         bitgetWsClient.send("ping")
//     }, 10 * 1000);
// })
// bitgetWsClient.on('close', () => {
//     console.error('close==', '断线重连')
//     bitgetWsClient = new BitgetWsClient({
//         reveice: (message) => {
//             // console.log('>>>' + message, typeof (message), message.startsWith('{'));
//             if (message.startsWith('{')) {
//                 message = JSON.parse(message)
//                 if (message.action != undefined) {
//                     bgP[message.data[0].instId] = Number(message.data[0].markPrice)
//                     console.log(DateFormat(), `${message.data[0].instId} => ` + Number(message.data[0].markPrice), bgP);
//                 }
//             }
//         },
//     }, apiKey, secretKey, passphrase);
//     bitgetWsClient.subscribe(subArr);
// })

// try {
//     setInterval(() => {
//         bitgetWsClient.send("ping")
//         // console.log('12')
//     }, 5 * 1000);
// } catch (error) {
//     console.log('系统异常', error)
// }

// let sclient1 = new XhSpot('KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00', 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO', { ip: '127.0.0.1', port: '1087' })
// sclient1.createListenKey().then(response => {
//     let listenKey = response.data.listenKey
//     setInterval(() => {
//         sclient1.renewListenKey(listenKey).then(res => {
//             console.log(`延长listenkey,25分钟`)
//         })
//     }, 25 * 60 * 1000);

//     sclient1.combinedStreams(['ethusdt@bookTicker'], {
//         open: () => {
//             console.log('策略启动...')
//         },
//         close: () => console.log('策略关闭...'),
//         message: (msg) => {
//             msg = JSON.parse(msg.toString());
//             // console.log(1)
//             let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
//             let symbol = msg.data.s;
//             price = Number(price)
//             console.log(symbol, 'bi an', price, 'bg', bgEth, price - bgEth, price > bgEth)
//             if (price - bgEth > 1 && bgEth != 0) {
//                 Log(msg)
//             }

//         }
//     });

// })

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