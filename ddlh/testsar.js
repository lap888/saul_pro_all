// // // console.warn(Date.now())
// // // let a = {}
// // // console.log(a['eth'])
// // // console.log(0.0070.toString())
// // // // console.log(10 * 2 ^ 3)

// // // function getFloatNum(num) {
// // //     let numStr = num.toString()
// // //     let arr = numStr.split(".");
// // //     if (arr.length > 1) {
// // //         let decimalCount = arr[1].length;
// // //         return decimalCount
// // //     }
// // //     return 1
// // // }
// // // // console.log(getFloatNum(0.0070))
// // // // console.log(getFloatNum(0.0071))
// // // // console.log(getFloatNum(0.00710))
// // // console.log(getFloatNum(123))

// // // console.warn(-2 > -3)

// // // console.warn(-3.1 > -3)

// // // console.log(5 + +1)

// // let s = ['eth', 'btc', 'xrp', 'ltc', 'bch']
// // // s.forEach(v=>{
// // //     console.log(1,v)
// // //     if (v=='btc'||v=='ltc') {
// // //         return
// // //     }
// // //     console.log(2,v)
// // // })

// // let coinInfo = s.filter((v, i) => i <= 2)
// // console.log(coinInfo)

const apiKey = 'vvXRVrPKg20KgwVMpmHeUtojzyEtruUKyel2SqHIMejUBAmP5T2FxkQY1dcB2ezn'
const apiSecret = 'sAIEaprrhTXMtprVTGANjA35xJg1Wa1SeJIJmRvngbgY7WNWxFISm9mtPJZ8Oi0x'


let proxyIp = ''
let proxy = ''
if (true) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}

let ma90s = {}
let ma90m = {}
let ma144s = {}

let ma90s1 = {}
let ma144s1 = {}
let ma90m1 = {}

let sarm = {}
let sarm1 = {}

const { Future, XhSpot, records_xh, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
let symbol='ETHUSDT'
// records_xh(sclient, symbol, '1m', 100).then(k => {
//     k.map(v=>{
//         v['Tt']=DateFormat(v.Time)
//     })
//     console.log(k)
//     ma90m[symbol] = TA.EMA(k, 90)
//     let ma90mLast = _N(ma90m[symbol][ma90m[symbol].length - 1], 4)
//     console.log(ma90mLast)
// }).catch(err => {
//     console.log(symbol, '1m', err)
// })
records_xh(sclient, symbol, '1m', 1500).then(k => {
    ma90m[symbol] = TA.EMA(k, 90)
    // let ma90mLast = _N(ma90m[symbol][ma90m[symbol].length - 1], 8)
    // ma90m1[symbol] = _price > ma90mLast ? 'L' : 'S'
    // logShow[`${symbol}_ma90m`] = `ma90sLast=${ma90mLast} | price=${_price} | hyPrice=${symbolHyPrice[symbol]} | action=${ma90m1[symbol]}`
    sarm[symbol] = TA.SAR(k)
    let lastsar = sarm[symbol][sarm[symbol].length - 1]
    // sarm1[symbol] = _price > lastsar ? 'L' : 'S'
    console.log(lastsar)
}).catch(err => {
    console.log(symbol, '1m', err)
})