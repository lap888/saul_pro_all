/* 币安欧意巴比特三所套利
 * @Author: topbrids@gmail.com 
 * @Date: 2023-08-12 16:14:50 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-08-26 10:14:11
 */
const schedule = require('node-schedule');
const { Future, XhSpot, axios, TA, _G, _N, LogProfit, records_xh, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')

const { okclient, okfund, posok } = require('./okex.js')
const { bybitClient, posbybit, getbybitPos } = require('./bybit.js')

const apiKey = 'U1eEWSnaLoPldncwQa1LHScMI91uIasAqIUl98hKToAPC3G3lFUv48gPUe7BVWTs'
const apiSecret = 'lVzGE1Z3fDBQOScmUNDh9Ge30zRY5U0JvQUMyzQyblSoWXu68EmtymY1VYo4rEgn'
const binanceclient = new Future(apiKey, apiSecret, { wsURL: 'wss://fstream.binance.com' })

//let 变量
let bybitfund = []
let binancefund = []
let poss = ''
let posl = ''

function coincompare(o1, o2) {
    if (o1 != undefined && o2 != undefined && o1.fundingRate != undefined && o2.fundingRate != undefined) {
        let diff = 0
        if (o1.fundingRate > 0 && o2.fundingRate > 0) {
            diff = Math.abs(o1.fundingRate - o2.fundingRate)
        }
        if (o1.fundingRate < 0 && o2.fundingRate < 0) {
            diff = Math.abs(o1.fundingRate - o2.fundingRate)
        }
        if (o1.fundingRate > 0 && o2.fundingRate < 0) {
            diff = o1.fundingRate + Math.abs(o2.fundingRate)
        }
        if (o1.fundingRate < 0 && o2.fundingRate > 0) {
            diff = o2.fundingRate + Math.abs(o1.fundingRate)
        }
        let arrs = [o1, o2].sort((a, b) => a.fundingRate - b.fundingRate)
        return { diff: diff, symbol: o1.symbol, flag: o1.flag + '-' + o2.flag, coins: arrs }
    } else {
        return null
    }
}

let allcoin = []
let posbian = []
let do1 = false
let do2 = false
let do3 = false


async function core() {
    let bybitres = await bybitClient.getTickers({ category: 'linear' })
    bybitres.result.map(v => {
        if (v.funding_rate != '0') {
            bybitfund.push({ flag: 'bybit', symbol: v.symbol, fundingRate: Number(v.funding_rate) })
        }
    })

    let binanceres = await binanceclient.premiumIndex()
    binanceres.data.map(v => {
        if (v.lastFundingRate != '0') {
            binancefund.push({ flag: 'binance', symbol: v.symbol, fundingRate: Number(v.lastFundingRate) })
        }
    })
    allcoin = []
    binancefund.map((v, i) => {
        let symbol = v.symbol
        let symbol2 = okfund.filter(v1 => v1.symbol == symbol)
        if (symbol2.length > 0) {
            let newcoin = coincompare(v, symbol2[0])
            if (newcoin != null) {
                allcoin.push(newcoin)
            }
        }
        if (i == binancefund.length - 1) {
            do1 = true
        }
    })
    binancefund.map((v, i) => {
        let symbol = v.symbol
        let symbol2 = bybitfund.filter(v1 => v1.symbol == symbol)
        if (symbol2.length > 0) {
            let newcoin = coincompare(v, symbol2[0])
            if (newcoin != null) {
                allcoin.push(newcoin)
            }
        }
        if (i == binancefund.length - 1) {
            do2 = true
        }
    })
    okfund.map((v, i) => {
        let symbol = v.symbol
        let symbol2 = bybitfund.filter(v1 => v1.symbol == symbol)
        if (symbol2.length > 0) {
            let newcoin = coincompare(v, symbol2[0])
            if (newcoin != null) {
                allcoin.push(newcoin)
            }
        }
        if (i == okfund.length - 1) {
            do3 = true
        }
    })

}

function getbinancePos(client) {
    client.account().then(response => {
        response.data.positions.forEach((item1) => {
            item1.positionAmt = Math.abs(Number(item1.positionAmt))
            item1.entryPrice = Number(item1.entryPrice)
            if (item1.positionAmt != 0) {
                let index = posbian.findIndex(v => v.symbol == item1.symbol && v.posSide == item1.positionSide)
                if (index == -1) {
                    posbian.push({ ep: item1.entryPrice, pos: item1.positionAmt, symbol: item1.symbol, posSide: item1.positionSide, upl: Number(item1.unrealizedProfit) })
                } else {
                    posbian[index].ep = item1.entryPrice
                    posbian[index].pos = item1.positionAmt
                    posbian[index].posSide = item1.positionSide
                    posbian[index].upl = Number(item1.unrealizedProfit)
                }
            }
        })
    }).catch(err => {
        console.log('获取account错误', err)
    })
}


setInterval(() => {
    console.log('=====================')
    core()
    if (do1 && do2 && do3) {
        allcoin.sort((a, b) => b.diff - a.diff)
        console.log('allcoins', allcoin[0])
    }
    //查询持仓
    console.log('posok=', posok)
    // binanceclient
    getbinancePos(binanceclient)
    console.log('posbian=', posbian)
    //
    getbybitPos()
    console.log('bybit=', posbybit)

}, 2000);

//下单
const scheduleCronstyle = () => {
    //资金费率结算钱一秒执行一次
    let rule = new schedule.RecurrenceRule();
    rule.second = [7, 15, 23]
    // rule.second = 59
    // rule.minute = 59
    // rule.hour = [7, 15, 23]
    schedule.scheduleJob(rule, () => {
        console.log('scheduleCronstyle:' + DateFormat());
    });
}

// scheduleCronstyle();