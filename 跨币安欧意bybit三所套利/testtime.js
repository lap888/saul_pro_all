const { Future, XhSpot, axios, TA, _G, _N, LogProfit, records_xh, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
let t=new Date()
t.setHours(8)
t.setMinutes(8)

console.log(DateFormat(t.getTime()))