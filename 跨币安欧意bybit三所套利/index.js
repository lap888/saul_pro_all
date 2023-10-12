/* 跨所资金费率套利 binance ok bybit
 * @Author: topbrids@gmail.com 
 * @Date: 2023-07-13 15:48:50 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-08-14 16:35:15
 */
const { Future, XhSpot, axios, TA, _G, _N, LogProfit, records_xh, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const fs = require('fs')
let okexData = fs.readFileSync("okex.json");
let okexJson = JSON.parse(okexData);

//======
let _binance = []
let _ok = []
let _bybit = []
let dysymbol = []

//======
let fundrateok = []
let fundratebian = []
let posok = []
let posbian = []


const { WebsocketClient, RestClient, OrderRequest } = require('okx-api');
//欧意
const API_KEY = process.env.API_KEY_COM || '19484284-9786-437b-9e0a-103e16a25614';
const API_SECRET = process.env.API_SECRET_COM || '22D2560BD17D0E0E2CFCE955809C04EF';
const API_PASSPHRASE = process.env.API_PASSPHRASE_COM || 'My123---';
//币安
const apiKey = 'U1eEWSnaLoPldncwQa1LHScMI91uIasAqIUl98hKToAPC3G3lFUv48gPUe7BVWTs'
const apiSecret = 'lVzGE1Z3fDBQOScmUNDh9Ge30zRY5U0JvQUMyzQyblSoWXu68EmtymY1VYo4rEgn'
const dev = true;

if (!API_KEY) {
    throw new Error('API_KEY is missing');
}

if (!API_SECRET) {
    throw new Error('API_SECRET is missing');
}

if (!API_PASSPHRASE) {
    throw new Error('API_PASSPHRASE is missing');
}
let proxyIp=''
let proxy=''
if (dev) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })

const okclient = new RestClient({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    apiPass: API_PASSPHRASE
}, 'prod', {}, {
    proxy: '127.0.0.1:1087'
});

const wsClient = new WebsocketClient(
    {
        market: 'prod',
        accounts: [
            {
                apiKey: API_KEY,
                apiSecret: API_SECRET,
                apiPass: API_PASSPHRASE,
            }
        ]
    }
);

wsClient.on('update', (data) => {
    // console.log(new Date(),
    //     'ws 更新推送',
    //     JSON.stringify(data, null, 2)
    // );
    let symbol = data.arg.instId;
    if (symbol != undefined) {
        let symbolpre = data.arg.instId.split('-')[0] + 'USDT'
        let index = fundrateok.findIndex(v => v.symbol == symbol)
        if (index == -1) {
            fundrateok.push({ symbol: symbol, symbolpre: symbolpre, ticker: 0, fundingRate: 0 })
        } else {
            if (data.arg.channel == 'funding-rate') {
                let fundingRate = Number(data.data[0].fundingRate)
                fundrateok[index]['fundingRate'] = fundingRate
            }
            if (data.arg.channel == 'tickers') {
                let ticker = Number(data.data[0].last)
                fundrateok[index]['ticker'] = ticker
            }
        }
    }
    if (data.arg.channel == 'positions') {
        let _posok = []
        data.data.map(v => {
            let symbolpre = v.instId.split('-')[0] + 'USDT'
            _posok.push({ pos: Number(v.pos), symbol: v.instId, symbolpre: symbolpre, posSide: v.posSide, upl: Number(v.upl) })
        })
        posok = _posok
    }
});

wsClient.on('open', (data) => {
    console.log('ws 链接打开:', data.wsKey);
});

wsClient.on('response', (data) => {
    console.log('ws 订阅响应 ', JSON.stringify(data, null, 2));
});

wsClient.on('reconnect', ({ wsKey }) => {
    console.log('ws 自动断线重连 ', wsKey);
});
wsClient.on('reconnected', (data) => {
    console.log('ws 已经断线重连 ', data?.wsKey);
});
wsClient.on('error', (data) => {
    console.error('ws 异常: ', data);
});

function getAccount(client) {
    client.account().then(response => {
        response.data.positions.forEach((item1) => {
            item1.positionAmt = Math.abs(Number(item1.positionAmt))
            item1.entryPrice = Number(item1.entryPrice)
            if (item1.positionAmt != 0) {
                let index = posbian.findIndex(v => v.symbol == item1.symbol && v.posSide == item1.positionSide)
                if (index == -1) {
                    posbian.push({ ep: item1.entryPrice, pos: item1.positionAmt, symbol: item1.symbol, posSide: item1.positionSide, upl: item1.unrealizedProfit })
                } else {
                    posbian[index].ep = item1.entryPrice
                    posbian[index].pos = item1.positionAmt
                    posbian[index].posSide = item1.positionSide
                    posbian[index].upl =  item1.unrealizedProfit
                }
            }
        })
    }).catch(err => {
        console.log('获取account错误', err)
    })
}

function updateIncome(price, symbol) {
    posbian.map((v, posIndex) => {
        if (v.posSide == 'LONG' && v.symbol == symbol) {
            let income = (price - v.ep) * v.pos
            posbian[posIndex].upl = income
        }
        if (v.posSide == 'SHORT' && v.symbol == symbol) {
            let income = (v.ep - price) * v.pos
            posbian[posIndex].upl = income
        }
    })
}
let binancecoin = []
let okcoin = []
let binancecoindy = []
let fundingrates = []
let tickers = []

// okexJson.data.map((v) => {
//     fundingrates.push({ channel: "funding-rate", instId: v.instId })
//     tickers.push({
//         channel: 'tickers',
//         instId: v.instId,
//         instType: 'SWAP'
//     })
// })

client.exchangeInfo().then(ex => {
    let exInfo = ex.data.symbols
    exInfo.map(e => {
        if (e.symbol.includes('USDT') && !e.symbol.includes('BUSD') && !e.symbol.includes('_') && !e.symbol.includes('1') && !e.symbol.includes('10') && !e.symbol.includes('100') && !e.symbol.includes('1000')) {
            binancecoin.push(e.symbol.replace('USDT', ''))
        }
    })

    //统一订阅 多平台 拿相同交易对 TODO
    okexJson.data.map((v) => {
        let dv = v.instId.split('-')
        okcoin.push(`${dv[0]}`)
    })
    let newcoins = binancecoin.filter(v => okcoin.includes(v))
    newcoins.map(v => {
        binancecoindy.push(`${v.toLowerCase()}usdt@markPrice@1s`)
        fundingrates.push({ channel: "funding-rate", instId: `${v}-USDT-SWAP` })
        tickers.push({
            channel: 'tickers',
            instId: `${v}-USDT-SWAP`,
            instType: 'SWAP'
        })
    })
    console.log(newcoins.length, okcoin.length, binancecoin.length)
    //欧意订阅
    {
        console.log('订阅欧意资金费率')
        wsClient.subscribe(fundingrates)
        console.log('订阅欧意ticker')
        wsClient.subscribe(tickers)
        console.log('订阅欧意pos')
        wsClient.subscribe({
            channel: 'positions',
            instType: 'SWAP',
        })
    }
    //币安订阅
    client.listenKeyPost().then(response => {
        let listenKey = response.data.listenKey;
        setInterval(async () => {
            client.listenKeyPut().then(res => {
                console.log(`延长listenkey`)
            })
        }, 10 * 60 * 1000);
        //
        getAccount(client)
        //更新持仓信息
        let wsRef = client.userData(listenKey, {
            open: () => {
                setInterval(() => {
                    wsRef.ws.send(JSON.stringify({ "ping": "1" }));
                }, 10 * 60 * 1000);
            },
            close: () => console.log('closed'),
            message: (msg) => {
                let res = JSON.parse(msg)
                //判断是否是心跳包返回的数据
                if (res.e == 'ACCOUNT_UPDATE') {
                    let v = res.a.P[0]
                    if (v != undefined) {
                        let eprice = Number(v?.ep == undefined ? 0 : v.ep)
                        let symbol = v?.s
                        let index = posbian.findIndex(v1 => v1.symbol == symbol && v1.posSide == v.ps)
                        if (index == -1) {
                            posbian.push({ ep: eprice, pos: Math.abs(Number(v.pa)), symbol: v.s, posSide: v.ps, upl: Number(v.up) })
                        } else {
                            posbian[index].ep = eprice
                            posbian[index].pos = Math.abs(Number(v.pa))
                            posbian[index].posSide = v.ps
                            posbian[index].upl = Number(v.up)
                        }
                    }
                }
            }
        });
        //
        client.combinedStreams(binancecoindy, {
            open: () => {
                console.log('币安 订阅 启动...')
            },
            close: () => console.log('策略关闭...'),
            message: (msg) => {
                msg = JSON.parse(msg.toString());
                let symbol = msg.data.s;
                let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
                updateIncome(Number(price), symbol)
                let index = fundratebian.findIndex(v => v.symbol == symbol)
                if (index == -1) {
                    fundratebian.push({ symbol: symbol, ticker: 0, fundingRate: 0 })
                } else {
                    let fundingRate = Number(msg.data.r)
                    fundratebian[index]['fundingRate'] = fundingRate
                    fundratebian[index]['ticker'] = Number(price)
                }
            }
        })
    })
})

// 获取ok上线的永续币种
// okclient.getInstruments('SWAP').then(symbol => {
//     console.log(symbol)
// }).catch(err => {
//     console.log(err)
// })
setInterval(() => {
    // console.log('fund=>', fundrateok[0], fundrateok.length)
    // console.log('posok',posok)
    // console.log('fundratebian', fundratebian[0], fundratebian.length)
    // console.log('bianpos', posbian)
    let ccoins = []
    fundrateok.map(v => {
        let symbol = v.symbolpre
        let bv = fundratebian.filter(v1 => v1.symbol == symbol)
        let ccoin = coincompare(bv[0], v)
        ccoins.push(ccoin)
    })
    let newcoins=ccoins.sort(compare("diff"))
    console.log('======',newcoins[0],newcoins[1],newcoins[2])
}, 2000);

function compare(p) { //这是比较函数
    return function (m, n) {
        var a = m[p];
        var b = n[p];
        return b - a; //降序
    }
}
/**
 * 
 * @param {*} o1 币安
 * @param {*} o2 ok
 * @returns 
 */
function coincompare(o1, o2) {
    let diff = 0
    if (o1.fundingRate > 0 && o2.fundingRate > 0) {
        diff = Math.abs(o1.fundingRate - o2.fundingRate)
    }
    if (o1.fundingRate > 0 && o2.fundingRate < 0) {
        diff = o1.fundingRate + Math.abs(o2.fundingRate)
    }
    if (o1.fundingRate < 0 && o2.fundingRate > 0) {
        diff = o2.fundingRate + Math.abs(o1.fundingRate)
    }
    return { diff: diff, symbol: o1.symbol, oksymbol: o2.symbol, okrate: o2.fundingRate, bianrate: o1.fundingRate }
}