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

const { Future, XhSpot, records_xh, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
let symbol='PEPEUSDT'
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

 //时间处理
 let d1 = new Date()
 let d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)
 
 console.log(DateFormat(d2.getTime()), symbol,DateFormat(d1.getTime()))
 console.log(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)

// // // let a=2.134679
// // // console.log(_N(a,0))
// // // console.log(_N(a,2))
// // // console.log(_N(a,1))

// console.log(DateFormat(1685869020000), Date.now() > 1685869020000, Date.now())
// console.log(DateFormat(1685868988000))
// console.log(DateFormat(1683191880399))

// let d1 = new Date()
// let d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)

// console.log(d2)

// console.log(DateFormat(d2.getTime()),d2.getTime(),d2.getTime()>Date.now())

// // let d1=new Date()
// // console.log(Date.now())
// // console.log(d1.getTime())

// // console.log(d1.getFullYear())
// // console.log(d1.getMonth())
// // console.log(d1.getDate())

// // console.log(d1.getHours())

// // console.log('m',d1.getMinutes())

// // console.log(d1.getSeconds())

// // console.log(d1.getMilliseconds())

// // console.log(d1.getTime())

// // let d2=new Date(d1.getFullYear(),d1.getMonth()+1,d1.getDate(),d1.getHours(),d1.getMinutes()+1)

// // console.log('m1',d2.getMinutes())
// // console.log(d2.getSeconds())
// // console.log(d2.getMilliseconds())
// // console.log(d2.getTime())

let _price='1000pepeusdt'.includes(1000)
console.log(_price)