
let allCoinNotice = {}
console.log('==1==',allCoinNotice)
calNotice('ethusdt', 1810)
console.log('==2==',allCoinNotice)
function calNotice(symbol, price) {
    let d1 = new Date()
    let caltime = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '7d']
    //提示1m,5m,15m,30m,1h,4h,1d,7d 高低点提示 已经当前实时价位处于黄金分割位置
    if (allCoinNotice[symbol] == undefined) {
        allCoinNotice[symbol] = {}
    }
    //
    caltime.map(t => {
        if (allCoinNotice[symbol][t] == undefined) {
            allCoinNotice[symbol][t] = {}
        }
        {
            if (allCoinNotice[symbol][t]['min'] == undefined || allCoinNotice[symbol][t]['min'] == 0) {
                allCoinNotice[symbol][t]['min'] = price
                let d2 = d1
                if (t == '1m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 1)
                }
                if (t == '5m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 5)
                }
                if (t == '15m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 15)
                }
                if (t == '30m') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + 30)
                }
                if (t == '1h') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours() + 1)
                }
                if (t == '4h') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours() + 4)
                }
                if (t == '1d') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 1)
                } if (t == '7d') {
                    d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 1)
                }
                allCoinNotice[symbol][t]['time'] = d2.getTime()
                allCoinNotice[symbol][t]['rate'] = 0
                allCoinNotice[symbol][t]['flag'] = '-'
            }
            if (allCoinNotice[symbol][t]['max'] == undefined || allCoinNotice[symbol][t]['max'] == 0) {
                allCoinNotice[symbol][t]['max'] = price
            }
        }
        {
            if (price > allCoinNotice[symbol][t]['max']) {
                allCoinNotice[symbol][t]['max'] = price
            }
            if (price < allCoinNotice[symbol][t]['min']) {
                allCoinNotice[symbol][t]['min'] = price
            }
            let bprice = (allCoinNotice[symbol][t]['max'] + allCoinNotice[symbol][t]['min']) / 2
            if (price > bprice) {
                allCoinNotice[symbol][t]['flag'] = t + ' | 多头回调| 合适位置做多'
                allCoinNotice[symbol][t]['rate'] = (allCoinNotice[symbol][t]['max'] - price) / (allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min'])
            }
            if (price < bprice) {
                allCoinNotice[symbol][t]['flag'] = t + ' | 空头反弹 | 合适位置做空'
                allCoinNotice[symbol][t]['rate'] = (price - allCoinNotice[symbol][t]['min']) / (allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min'])
            }
            if (Date.now() > allCoinNotice[symbol][t]['time']) {
                allCoinNotice[symbol][t]['min'] = 0
                allCoinNotice[symbol][t]['max'] = 0
            }
        }
        // 短期内波动
        {
            if ((allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min']) > price * 0.01) {
                if (zfRate(`${symbol}-${t}-001`) == undefined) {
                    zfRate(`${symbol}-${t}-001`) = '001'
                    pLog(`波动预警通知:${symbol}-${t}-内波动超过1%`)
                }
            }
            if ((allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min']) > price * 0.02) {
                if (zfRate(`${symbol}-${t}-002`) == undefined) {
                    zfRate(`${symbol}-${t}-002`) = '002'
                    pLog(`波动预警通知:${symbol}-${t}-内波动超过2%`)
                }
            }
            if ((allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min']) > price * 0.03) {
                if (zfRate(`${symbol}-${t}-003`) == undefined) {
                    zfRate(`${symbol}-${t}-003`) = '003'
                    pLog(`波动预警通知:${symbol}-${t}-内波动超过3%`)
                }
            }
            if ((allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min']) > price * 0.04) {
                if (zfRate(`${symbol}-${t}-004`) == undefined) {
                    zfRate(`${symbol}-${t}-004`) = '004'
                    pLog(`波动预警通知:${symbol}-${t}-内波动超过4%`)
                }
            }
            if ((allCoinNotice[symbol][t]['max'] - allCoinNotice[symbol][t]['min']) > price * 0.05) {
                if (zfRate(`${symbol}-${t}-005`) == undefined) {
                    zfRate(`${symbol}-${t}-005`) = '005'
                    pLog(`波动预警通知:${symbol}-${t}-内波动超过5%`)
                }
            }
        }
        // 黄金分割
        {
            if (allCoinNotice[symbol][t]['rate'] > 0.236) {
                if (hjRate(`${symbol}-${t}-236`) == undefined) {
                    hjRate(`${symbol}-${t}-236`) = '236'
                    pLog(`黄金分隔:${symbol}-${t}-内,触及黄金分割|0.236`)
                }
            }
            if (allCoinNotice[symbol][t]['rate'] > 0.382) {
                if (hjRate(`${symbol}-${t}-382`) == undefined) {
                    hjRate(`${symbol}-${t}-382`) = '382'
                    pLog(`黄金分隔:${symbol}-${t}-内,触及黄金分割|0.382`)
                }
            }
            if (allCoinNotice[symbol][t]['rate'] > 0.5) {
                if (hjRate(`${symbol}-${t}-05`) == undefined) {
                    hjRate(`${symbol}-${t}-05`) = '05'
                    pLog(`黄金分隔:${symbol}-${t}-内,触及黄金分割|0.50`)
                }
            }
            if (allCoinNotice[symbol][t]['rate'] > 0.618) {
                if (hjRate(`${symbol}-${t}-618`) == undefined) {
                    hjRate(`${symbol}-${t}-618`) = '618'
                    pLog(`黄金分隔:${symbol}-${t}-内,触及黄金分割|0.618`)
                }
            }
        }
    })

}