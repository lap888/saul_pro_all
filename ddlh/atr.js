
// ATR

const { Future, XhSpot, records_xh, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')



const apiKey = 'vvXRVrPKg20KgwVMpmHeUtojzyEtruUKyel2SqHIMejUBAmP5T2FxkQY1dcB2ezn'
const apiSecret = 'sAIEaprrhTXMtprVTGANjA35xJg1Wa1SeJIJmRvngbgY7WNWxFISm9mtPJZ8Oi0x'
const myUid = 1001

let prod = false
let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const port = '30021'

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
// let symbol = 'TOMOUSDT'
// let price = 0.87

// let symbol = 'BTCUSDT'
// let price = 29000

// let symbol = 'ETHUSDT'
// let price = 1880

// setInterval(() => {
//     console.log(1)
// }, 10000);

// async function ay() {
//     for (let i = 0; i < 10; i++) {
//         console.log(i)
//         await Sleep(2 * 1000)
//         console.log(i, '|', i)
//         records_xh(sclient, symbol, '5m', 100).then(k => {
//             let atr = TA.ATR(k, 60)
//             let a1 = 0
//             let amin = 0
//             let amax = 0
//             let atotal = 0
//             atr.map(v => {
//                 atotal += v;
//                 let x1 = 1
//                 if (a1 != 0) {
//                     x1 = 2
//                 }
//                 a1 = (a1 + v) / x1
//                 if (amin == 0) {
//                     amin = v
//                 }
//                 if (amax == 0) {
//                     amax = v
//                 }
//                 if (v < amin) {
//                     amin = v
//                 }
//                 if (v > amax) {
//                     amax = v
//                 }
//             })
//             console.log(amin, amax, a1, atotal / 1000, '|', a1 / price, 0.62 * 0.01)
//         }).catch(err => {
//             console.log(symbol, '1s', err)
//         })
//     }
// }
// ay()


client.records("BTCUSDT", "1m", 1500).then(records => {    
    let sar1 = TA.SAR(records, 0.008, 0.2,0.008);
    console.log('sar11', sar1[sar1.length - 2], 'sar21', sar1[sar1.length - 3])
})

