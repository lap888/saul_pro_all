/* 策略说明 
   bg vvds
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2022-12-28 09:50:56
 */
const express = require('express')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Future, XhSpot, TA, _G, _N, LogProfit, Log, DateFormat, Sleep, buy, sell, buy_close, sell_close } = require('binance-futures-connector')
const process = require('process');
const port = '30015'
let mk = {};
//引入BG
const ExKey = [
    // {
    //     id: 1,
    //     name: 'ZY',
    //     apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
    //     secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
    //     passphrase: 'xh18819513042',
    //     amount: 20,
    //     isDo: true,
    //     pos: 'a|u',
    //     rToken: 'bt_rtoken=upex:session:id:7215d8cce6daf0f57cce0f289a59e7f482093014a9ff59e742d5620bea937a23;',
    //     btSession: 'bt_sessonid=8992ffd4-c31b-4b41-abbb-cd4e4e4e8fab;',
    //     btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJkNjViN2Y0NC0xZjI3LTQ5ZmMtOTM2My03MjRiYTI0YjY1MTMzMTQxMDIzMjAiLCJ1aWQiOiI3WG0rUEVMblhhVjdaKzZvZEF1dzRRPT0iLCJzdWIiOiI4NjMzNioqKipAcXEuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJOazcrU0xWWktPRWRMU2JLc01DV3lDWE1mUjd1TnppakFPenJNTkxmaWNSMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzE4NjgyNDIsImV4cCI6MTY3OTY0NDI0MiwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.AfyPp6GGU_tknoD06eVoiTZGyTlfkgHcdVJV4d1PCxY'
    // },
    {
        id: 2,
        name: 'Qee',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        BTCUSDT: 0.23,
        ETHUSDT: 3.5,
        ADAUSDT: 15174,
        DOGEUSDT: 53184,
        LTCUSDT: 57,
        XRPUSDT: 11052,
        ETCUSDT: 246,
        BCHUSDT: 38,
        MATICUSDT: 4938,
        LINKUSDT: 666,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:220281b35e21a593f2f04a8c89e84ad738828b5f490b0d96a8fa1d74582fc5ac;',
        btSession: 'bt_sessonid=f50a6681-5130-45b5-849b-96c61f63a495;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI2YTg4N2JjNy0wZThhLTRmZGQtODQzZS1lNWJjYmFkZTUwNDA5NjkxNzI0NjUiLCJ1aWQiOiJiS2VMckdPTm9tbklvUEZjcXZ2eE9BPT0iLCJzdWIiOiJxZWVmKioqKkBob3RtYWlsLmNvbSIsImlwIjoiUHJuWm1SYVJqalNUY0owMU9Wd3JTQT09IiwiZGlkIjoibkc1TThOaG9PbXJoWkQrMlc4NVpaM2RtdFJvUVJ3UEMrVjFGK3VDUVh4RjEyUklzWlFLTTVIQmtTNHlUUmhuVyIsInN0cyI6MCwiaWF0IjoxNjcxODcwNTAxLCJleHAiOjE2Nzk2NDY1MDEsInB1c2hpZCI6ImRka1NMR1VDak9Sd1pFdU1rMFlaMWc9PSIsImlzcyI6InVwZXgifQ.HkHZATpPXDLC0_IwhYuX_AhLpq8Y81CCvSG3dpLZJ-g;'
    },
    {
        id: 3,
        name: 'ZY',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        BTCUSDT: 0.1,
        ETHUSDT: 1,
        ADAUSDT: 2000,
        DOGEUSDT: 8000,
        LTCUSDT: 20,
        XRPUSDT: 1714,
        ETCUSDT: 40,
        BCHUSDT: 6,
        MATICUSDT: 750,
        LINKUSDT: 10,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:b4706d8bbf7a95109685e9c19715f5fc94a6b5ffcd57126884dad64264096f99;',
        btSession: 'bt_sessonid=8ddc5591-78ed-49f4-b802-903b9cbe14f3;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwZTkzMDYyMy1jZWI3LTQyMDgtYWRhNC05MTJlNDAwNWRhYWMxODcwNzcwMjEwIiwidWlkIjoiSUZ2WE9xcG5nVnVaWUhGQUJhNUVDQT09Iiwic3ViIjoieGh6ejE4ODE5NTEqKioqQHNpbmEuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzE5Njk1NjIsImV4cCI6MTY3OTc0NTU2MiwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.or9pMTfo5zV_neoS1LzjcUMrjcoc-2tjIf0VUc7BaOg;'
    },
    {
        id: 4,
        name: 'ML',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        BTCUSDT: 0.5,
        ETHUSDT: 7,
        LTCUSDT: 50,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:88c8866236f3b451cbec1e08a95124420e7203632ca0d6d3e4ef94fb1d85f0a4;',
        btSession: 'bt_sessonid=47f0746a-9caf-4b52-af08-f85e0c449bc8;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwNTIyODMzMy00MTZiLTQ5YTItOTBkNy01NzdlMDVhOTkxN2YxMDkyNTM1MzkxIiwidWlkIjoiM0IwRHU0VEkvUGdjZjN5TjMxcDFhdz09Iiwic3ViIjoieHF6KioqKkAxNjMuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzIxMjcxOTAsImV4cCI6MTY3OTkwMzE5MCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.Bvy9oVmDBMqaS3uTrni4QT82kqY6MwbAkdorXLCj6PQ;'
    },
    {
        id: 5,
        name: 'ML1',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        BTCUSDT: 1.7,
        ETHUSDT: 24,
        ADAUSDT: 113895,
        LTCUSDT: 100,
        XRPUSDT: 810810,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:a1dc2cd1ce136a5edfd34fea9141f22bc2515df7be2f1a761c72478420972999;',
        btSession: 'bt_sessonid=28a12eec-66ab-48c9-af6e-777196db5961;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI0MDRlMDllOS1jOTgxLTQ0ZjctOGRiMi0yZGRkMTM1YTZlOTExODEzMDA0MTcwIiwidWlkIjoiNllsNE5HOHJJcHIvaHd4OWFOV3Rpdz09Iiwic3ViIjoiSmh6MTEyMjMzKioqKkAxNjMuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzIxMzE1NjAsImV4cCI6MTY3OTkwNzU2MCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.BhKZJoZu81HDTj6ftLE9RaA4-xw-KbaOiOYHxlPfxeo;'
    }
]

const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
const bgapiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
const passphrase = 'toptoptop';


const { BuyClose, BuyByQ, SellByQ, SellClose, Assets, UserInfo, getHistoryOrderList } = require('./order')

let bgEthPrice = 0;


process.on('uncaughtException', (error, source) => {
    console.error('未捕获异常=>', error, source)
})


// binance
const prod = true;
let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}

//BN
// const apiKey = '6HBfkhKbXMY26knOZBN948NXUMK4Wx4OHtdIVUrWjDjXIGtAZge2XlnlWHRA3g3y'
// const apiSecret = 'DoeGWvvW56cNB1reMkh520hMSSKiaQHfeAH0rTKuJoAhkl7VjWZ5wi7F3ytPVoiL'

const apiKey = 'KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00'
const apiSecret = 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO'
let openPos = {}
let symbolDatas = []
let symbolAction = {}
let interValTime = 0.9;//清洗时间
let _btr = 0.0017;//波动率
let _btr2 = 0.0003;//波动率

let sDt = {}
let sDtTime = 60;
let sDt2 = {}
let sDt3 = {}

let isClose = {}
// let btRate = { 'ETHUSDT': _btr, 'BTCUSDT': _btr, 'DOGEUSDT': _btr, 'LTCUSDT': _btr, 'XRPUSDT': _btr, 'LINKUSDT': _btr, 'MATICUSDT': _btr, 'BCHUSDT': _btr, 'ETCUSDT': _btr }
let btRate = { 'ETHUSDT': _btr, 'BTCUSDT': _btr,'LTCUSDT': _btr+0.00015 }

symbolDatas = Object.keys(btRate)
let symbolAmount = Object.keys(btRate);

//初始化维护二分化数据
// let twoSymbolData = { ETHUSDT: { n: { open: 1, close: 2, high: 2.5, low: 1, time: null }, o: {}, t: null } };
let twoSymbolData = {};
let kLine = _G('MkLine')
if (kLine != null && kLine.startsWith('{')) {
    kLine = JSON.parse(kLine)
} else {
    kLine = null;
}
symbolAmount.map(v => {
    let h = null;
    if (kLine != null) {
        h = kLine[v].history
    }
    twoSymbolData[v] = { n: null, o: null, history: h, min: null, max: null, t: null }
})


function pLog(msg) {
    Log(msg)
    console.log(msg)
}

const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://stream.binance.com:9443' })

sclient.createListenKey().then(response => {
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient.renewListenKey(listenKey).then(res => {
            console.log(`延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);
    let SymbolDataArrys = []
    symbolDatas.map(v => {
        SymbolDataArrys.push(`${v.toLowerCase()}@bookTicker`)
    })
    sclient.combinedStreams(SymbolDataArrys, {
        open: () => {
            console.log('策略启动...')
            setInterval(() => {
                let d = new Date()
                let ms = d.getMilliseconds()
                //清洗数据
                if (ms < 1 || ms >= 999) {
                    symbolAmount.map(v => {
                        twoSymbolData[v].n = null
                        twoSymbolData[v].t = null
                    })
                    // console.log(ms, '清洗数据', DateFormat(Date.now()))
                    if (openPos['Qee'] > 0) {
                        console.log(openPos)
                    }

                }
            }, 1);
        },
        close: () => console.log('策略关闭...'),
        message: (msg) => {
            msg = JSON.parse(msg.toString());
            let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
            let symbol = msg.data.s;
            price = Number(price)
            ExKey.map(e => {
                openPos[e.name] = 0;
                symbolAmount.map(v => {
                    if (isClose[`${e.name}_${v}`] == 1) {
                        openPos[e.name] = openPos[e.name] + 1
                    }
                })
            })
            if (mk[symbol] == undefined) {
                mk[symbol] = Date.now()
                // mixMarketApi.ticker('ETHUSDT_UMCBL').then(res => {
                //     bgEthPrice = res.data.last
                // })
                console.log('接收到推流|监听数据打印', symbol, price, btRate[symbol])
            }
            // console.log('监听数据打印', symbol, price, btRate[symbol])
            // lockPrice.push({ '币安ETH当前价格': price, 'bgETH当前价格': bgEthPrice, '统计时间': DateFormat(Date.now()) })
            //秒K
            if (twoSymbolData[symbol].t == null || Date.now() - twoSymbolData[symbol].t <= interValTime * 1000) {
                if (twoSymbolData[symbol].n == null) {
                    twoSymbolData[symbol].n = {}
                    twoSymbolData[symbol].t = Date.now()
                    twoSymbolData[symbol].n['open'] = price;
                    twoSymbolData[symbol].n['close'] = price;
                    twoSymbolData[symbol].n['heigh'] = price;
                    twoSymbolData[symbol].n['low'] = price;
                    twoSymbolData[symbol].n['time'] = DateFormat(Date.now());
                    twoSymbolData[symbol].n['timeSpan'] = Date.now();

                    twoSymbolData[symbol].n['bgopen'] = bgEthPrice;
                    twoSymbolData[symbol].n['bgclose'] = bgEthPrice;
                    twoSymbolData[symbol].n['bgheigh'] = bgEthPrice;
                    twoSymbolData[symbol].n['bglow'] = bgEthPrice;
                } else {
                    twoSymbolData[symbol].n['close'] = price;
                    twoSymbolData[symbol].n['bgclose'] = bgEthPrice;
                    if (price > twoSymbolData[symbol].n['heigh']) {
                        twoSymbolData[symbol].n['heigh'] = price;
                    }
                    if (price < twoSymbolData[symbol].n['low']) {
                        twoSymbolData[symbol].n['low'] = price;
                    }

                    if (bgEthPrice > twoSymbolData[symbol].n['bgheigh']) {
                        twoSymbolData[symbol].n['bgheigh'] = bgEthPrice;
                    }
                    if (bgEthPrice < twoSymbolData[symbol].n['bglow']) {
                        twoSymbolData[symbol].n['bglow'] = bgEthPrice;
                    }
                }
                if (twoSymbolData[symbol].min == null || twoSymbolData[symbol].max == null) {
                    twoSymbolData[symbol].min = price;
                    twoSymbolData[symbol].max = price;
                } else {
                    if (price < twoSymbolData[symbol].min) {
                        twoSymbolData[symbol].min = price
                    }
                    if (price > twoSymbolData[symbol].max) {
                        twoSymbolData[symbol].max = price
                    }
                }
                //平仓
                if (sDt2[`${symbol}`] != -1 && sDt2[`${symbol}`] != undefined && Date.now() - sDt[`${symbol}`] > 2.5 * 1000) {
                    if (symbolAction[`${symbol}`].action == 'S') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) < symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        sDt3[symbol] = Date.now();
                        pLog(`定时清仓 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平空 | 币安价格:${price} | bg价格:${bgEthPrice} | K数据:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                SellClose(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                    if (res.code == "200") {
                                        console.log(`${v.name}_${symbol}`, '空单平空成功')
                                        isClose[`${v.name}_${symbol}`] = -1
                                    } else {
                                        console.log(`${v.name}_${symbol}`, '空单平空失败', res)
                                    }
                                }).catch(err => {
                                    console.log(`${v.name}_${symbol}`, '空单平空失败', err)
                                })
                            }
                        })
                        return;
                    }
                    if (symbolAction[`${symbol}`].action == 'L') {
                        sDt[`${symbol}`] = Date.now()
                        let isIncome = Number(price) > symbolAction[`${symbol}`].price
                        sDt2[`${symbol}`] = -1;
                        pLog(`定时清仓 | 纯秒K | ${symbol} | ${isIncome ? '止盈' : '止损'} | 平多 | 币安价格:${price} | bg价格:${bgEthPrice} | K数据:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                BuyClose(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                    if (res.code == "200") {
                                        console.log(`${v.name}_${symbol}`, '多单平多成功')
                                        isClose[`${v.name}_${symbol}`] = -1
                                    } else {
                                        console.log(`${v.name}_${symbol}`, '多单平多失败', res)
                                    }
                                }).catch(err => {
                                    console.log(`${v.name}_${symbol}`, '多单平多失败', err)
                                })
                            }
                        })
                        return;
                    }
                } else {
                    //止损&止盈
                    if (sDt3[symbol] == null || Date.now() - sDt3[symbol] > 0.23 * 1000) {
                        sDt3[symbol] = Date.now();
                        let btPrice2 = _N(btRate[`${symbol}`] * Number(price), 8);
                        let btPrice3 = _N(_btr2 * Number(price), 8);
                        ExKey.map(v => {
                            let amount = v[symbol]
                            if (isClose[`${v.name}_${symbol}`] == 1) {
                                if (symbolAction[`${symbol}`].action == 'S') {
                                    if (Number(price) > symbolAction[`${symbol}`].price + btPrice3) {
                                        SellClose(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                            if (res.code == "200") {
                                                pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平空 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                isClose[`${v.name}_${symbol}`] = -1
                                            } else {
                                                console.log(`${v.name}_${symbol}`, '止损|空单平空失败|1', res)
                                            }
                                        }).catch(err => {
                                            console.log(`${v.name}_${symbol}`, '止损|空单平空失败|2', err)
                                        })
                                    } else if (Number(price) < symbolAction[`${symbol}`].price - btPrice2) {
                                        SellClose(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                            if (res.code == "200") {
                                                pLog(`${v.name} | 纯秒K | ${symbol} | 止盈 | 平空 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                isClose[`${v.name}_${symbol}`] = -1
                                            } else {
                                                console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|1', res)
                                            }
                                        }).catch(err => {
                                            console.log(`${v.name}_${symbol}`, '止盈|空单平空失败|2', err)
                                        })
                                    }
                                }
                                if (symbolAction[`${symbol}`].action == 'L') {
                                    if (Number(price) < symbolAction[`${symbol}`].price - btPrice3) {
                                        BuyClose(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                            if (res.code == "200") {
                                                pLog(`${v.name} | 纯秒K | ${symbol} | 止损 | 平多 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                isClose[`${v.name}_${symbol}`] = -1
                                            } else {
                                                console.log(`${v.name}_${symbol}`, '止损|多单平多失败|1', res)
                                            }
                                        }).catch(err => {
                                            console.log(`${v.name}_${symbol}`, '止损|多单平多失败|2', err)
                                        })
                                    } else if (Number(price) > symbolAction[`${symbol}`].price + btPrice2) {
                                        BuyClose(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                            if (res.code == "200") {
                                                pLog(`${v.name} | 纯秒K | ${symbol} | 止盈 | 平多 | 币安价格:${price} | bg价格:${bgEthPrice}`)
                                                isClose[`${v.name}_${symbol}`] = -1
                                            } else {
                                                console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|1', res)
                                            }
                                        }).catch(err => {
                                            console.log(`${v.name}_${symbol}`, '止盈|多单平多失败|2', err)
                                        })
                                    }
                                }
                            }
                        })
                    }
                }
                //开单
                let high = twoSymbolData[symbol].n['heigh'];
                let low = twoSymbolData[symbol].n['low']
                let doL = twoSymbolData[symbol].n['open'] < twoSymbolData[symbol].n['close'];
                let doS = twoSymbolData[symbol].n['open'] > twoSymbolData[symbol].n['close'];
                let diffPrice = high - low;
                let btPrice1 = _N(btRate[`${symbol}`] * Number(price), 8);
                //做多 or 做空 //发送开单信号 休息N分钟
                // interValTime
                let d = new Date()
                let ms = d.getMilliseconds()
                if (diffPrice > btPrice1 && ms <= interValTime * 1000 + 20) {
                    if ((sDt[`${symbol}`] == undefined || Date.now() - sDt[`${symbol}`] > sDtTime * 1000) && (sDt2[`${symbol}`] == undefined || sDt2[`${symbol}`] == -1)) {
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
                        let flag = doL == true ? 'L' : doS == true ? 'S' : ''
                        symbolAction[`${symbol}`] = { action: flag, price: Number(price) };
                        sDt3[symbol] = Date.now();
                        pLog(`纯秒K | ${symbol} | 开仓:${flag} | 币安价格:${price} | bg价格:${bgEthPrice} | ${interValTime}秒内 | 价格波动:${btRate[`${symbol}`]} | ${btPrice1}U | 休息${sDtTime}秒 | K数据:${JSON.stringify(twoSymbolData[symbol].n)}`)
                        if (flag == 'L') {
                            ExKey.map(v => {
                                let amount = v[symbol]
                                if (openPos[v.name] <= 1 && amount != undefined) {
                                    BuyByQ(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                        if (res.code == "200") {
                                            console.log(`${v.name}_${symbol}`, '多单开单成功')
                                            isClose[`${v.name}_${symbol}`] = 1
                                        } else {
                                            console.log(`${v.name}_${symbol}`, '多单开单失败', res)
                                        }
                                    }).catch(err => {
                                        console.log(`${v.name}_${symbol}`, '多单开单失败', err)
                                    })
                                } else {
                                    console.log(`${v.name}`, '当前持仓', openPos[v.name], '单', symbol, '多单暂不开单')
                                }

                            })
                        }
                        if (flag == 'S') {
                            ExKey.map(v => {
                                let amount = v[symbol]
                                if (openPos[v.name] <= 1 && amount != undefined) {
                                    SellByQ(symbol, amount, v.rToken, v.btSession, v.btNewSession).then(res => {
                                        if (res.code == "200") {
                                            console.log(`${v.name}_${symbol}`, '空单开单成功')
                                            isClose[`${v.name}_${symbol}`] = 1
                                        } else {
                                            console.log(`${v.name}_${symbol}`, '空单开单失败', res)
                                        }
                                    }).catch(err => {
                                        console.log(`${v.name}_${symbol}`, '空单开单失败', err)
                                    })
                                } else {
                                    console.log(`${v.name}`, '当前持仓', openPos[v.name], '单', symbol, '空单暂不开单')
                                }
                            })
                        }
                        sDt[`${symbol}`] = Date.now()
                        sDt2[`${symbol}`] = Date.now()
                    }
                }
            } else {
                //超过K周期清洗数据
                twoSymbolData[symbol].o = twoSymbolData[symbol].n
                if (twoSymbolData[symbol].history == null) {
                    twoSymbolData[symbol].history = []
                }
                if (twoSymbolData[symbol].n != null) {
                    twoSymbolData[symbol].history.push(twoSymbolData[symbol].n)
                }
                twoSymbolData[symbol].n = null
                twoSymbolData[symbol].t = null
            }
        }
    });

})

//获取当前秒单账户
app.get("/api/getAccount", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let history = []
        ExKey.map(v => {
            UserInfo(v.name, v.rToken, v.btSession, v.btNewSession).then(u => {
                let d = u.data.userInfo;
                d['key'] = v.name
                history.push(d)
                if (history.length == ExKey.length) {
                    data.total = history.length;
                    data.list = history;
                    res.json(data);
                }
            });
        })
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

//获取用户开单记录
app.get("/api/getOrder", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let name = req.query.name;
        let v = ExKey.find(v => v.name == name)
        let sT = new Date().getTime() - 3 * 30 * 24 * 60 * 60 * 1000;
        let eT = new Date().getTime()
        getHistoryOrderList(1, 100, sT, eT, v.name, v.rToken, v.btSession, v.btNewSession).then(res1 => {
            if (res1.code == "200") {
                data.list = res1.data.orderList
                data.total = data.list.length
                res.json(data);
            } else {
                data.code = -1
                res.json(data);
            }
        }).catch(err => {
            console.log('udo|err=>', err)
            data.code == -1
            data.err = err
            res.json(data);
        })
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
//获取用户资产
app.get("/api/getAssets", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let name = req.query.name;
        let v = ExKey.find(v => v.name == name)
        Assets(v.name, v.rToken, v.btSession, v.btNewSession).then(res1 => {
            if (res1.code == "00000") {
                data.data = res1.data
                res.json(data);
            } else {
                data.code = -1
                res.json(data);
            }
        }).catch(err => {
            console.log('udo|err=>', err)
            data.code == -1
            data.err = err
            res.json(data);
        })
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

app.get("/api/getLog", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        data['log'] = Log().reverse();
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

app.listen(port, () => {
    console.log(`本地服务监听:http://127.0.0.1:${port}`)
})