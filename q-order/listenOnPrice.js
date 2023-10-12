const { cf, configJson, TA } = require('./app/binanceApi')
const { buy, buy_close, send_msg, msg_on, sell, sell_close } = require('./app/message')


//监听5分钟内币种波动 5 * 60 * 1000
let symbolArrL = {};
let symbolArrS = {};
let trueSymbolArr = [];
let symbolPrices = []
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
let startTime = Date.now();
let startTimeBoll = Date.now();
async function core() {
    if (Date.now() - startTime < (10 * 60 * 1000)) {
        cf.price().then(res => {
            symbolPrices = res.data;
            bollTouch()
            res.data.map(v => {
                let isHaveSymbol = symbolArrL[v.symbol]
                if (isHaveSymbol == undefined || isHaveSymbol == 0) {
                    symbolArrL[v.symbol] = v.price
                    symbolArrS[v.symbol] = v.price
                } else {
                    let minPrice = Math.min(v.price, symbolArrS[v.symbol])
                    symbolArrS[v.symbol] = minPrice;
                    let maxPrice = Math.max(v.price, symbolArrL[v.symbol])
                    symbolArrL[v.symbol] = maxPrice;
                }
                //波动范围 0.03
                let rate = configJson.btRate;
                if (symbolArrL[v.symbol] > v.price * (1 + rate) || symbolArrS[v.symbol] < v.price * (1 - rate)) {
                    let r1 = ((symbolArrL[v.symbol] - v.price) * 100 / v.price).toFixed(4)
                    let r2 = ((v.price - symbolArrS[v.symbol]) * 100 / v.price).toFixed(4)
                    let msg = `波动预警=>😁\r\nsymbol:${v.symbol},当前价:${v.price}\r\n5分钟内波动超过${rate * 100}%,高位回撤:${r1}%,低位反弹:${r2}%\r\n`;
                    if (trueSymbolArr.indexOf(v.symbol) == -1) {
                        trueSymbolArr.push(v.symbol)
                        console.log(msg)
                        send_msg(msg)
                    }

                }
            });
        });
    } else {
        startTime = Date.now()
        symbolArrL = {}
        symbolArrS = {}
        trueSymbolArr = []
    }
}
let bollSymbol = []
//监听boll碰触
function bollTouch() {
    configJson.listenSymbol.map(v => {
        let cIndex = symbolPrices.findIndex(c => c.symbol == v[0])
        let pData = symbolPrices[cIndex]
        cf.records(v[0], v[1]).then(records => {
            let boll = null;
            if (v[1] == '1h') {
                boll = TA.BOLL(records, 30)
            }
            if (v[1] == '15m') {
                boll = TA.BOLL(records, 120)
            }
            let up = boll[0]
            let down = boll[2]
            let upPrice = (up[up.length - 1]).toFixed(2)
            let downPrice = (down[down.length - 1]).toFixed(2)
            if (Number(pData.price) <= downPrice || Number(pData.price) >= upPrice) {
                if (bollSymbol[`${pData.symbol}_${v[1]}`] == undefined || bollSymbol[`${pData.symbol}_${v[1]}`] == '') {
                    bollSymbol[`${pData.symbol}_${v[1]}`] = pData.symbol
                    //发消息提醒
                    let msg = `boll touch=>😁\r\nsymbol:${pData.symbol}\r\nnow price:${pData.price}\r\nup:${upPrice}\r\ndown:${downPrice}\r\nremark:${v[1]}\r\n`
                    if (Date.now() - startTimeBoll > (3 * 10 * 1000)) {
                        startTimeBoll = Date.now();
                        console.log(msg)
                        send_msg(msg)
                    }
                }
            } else {
                bollSymbol[`${pData.symbol}_${v[1]}`] = ''
            }
        });
    })
}

async function run() {
    console.log("boll rate listen run...")
    while (true) {
        try {
            core()
        } catch (err) {
            console.log(err)
        }
        await sleep(2500)
    }
}
run()
