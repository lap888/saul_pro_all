/* 登顶量化 志在巅峰 漫步人生路 v3
 * @Author: topbrids@gmail.com 
 * @Date: 2023-04-05 20:31:31 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-04-11 16:22:36
 */

const prod = false;

const process = require('process');
const express = require('express')
const { doDb } = require('./dbMysql')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { Future, XhSpot, records_xh, TA, _G, _N, LogProfit, Log, DateFormat, buy, buy_close, sell, sell_close, Sleep } = require('binance-futures-connector')


const apiKey = 'vvXRVrPKg20KgwVMpmHeUtojzyEtruUKyel2SqHIMejUBAmP5T2FxkQY1dcB2ezn'
const apiSecret = 'sAIEaprrhTXMtprVTGANjA35xJg1Wa1SeJIJmRvngbgY7WNWxFISm9mtPJZ8Oi0x'


let proxyIp = ''
let proxy = ''
if (!prod) {
    proxyIp = '127.0.0.1'
    proxy = '1087'
}
const port = '30021'

const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
const sclient = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy, wsURL: 'wss://fstream.binance.com' })
let pos = []//[{"s":"ETHUSDT","pa":"-1.613","ep":"1860.58286","cr":"-499.34214144","up":"-30.40528948","mt":"cross","iw":"0","ps":"SHORT","ma":"USDT"}]
let symbolDatas = []
let symbolHyPrice = {}
let kTimeDate = {}
let DbDate = null
let UpdatePosDate = null
let UpdateIncomeDate = {}
let OpenOrderDate0 = {}
let OpenOrderDate1 = {}
let OpenOrderDateSc = {}
let OpenOrderDateSc1 = {}

let OpenForderDate = {}
let DodoDate = {}
let DodoDate1 = {}
let LogShowDate = null
let logShow = {}
let ma90s = {}
let ma90m = {}
let ma90s1 = {}
let ma90m1 = {}
//价格高低点
let lPriceMax = {}
let lPriceMin = {}
let lIncomeMax = {}


let sPriceMax = {}
let sPriceMin = {}
let sIncomeMax = {}

let nextOrderWait = 300

process.on('uncaughtException', (error, source) => {
    console.log('未捕获到的异常=>', '错误信息:', error.message, '堆栈信息:', error.stack)
});

function pLog(msg) {
    Log(msg)
    console.log(msg)
}

function getAccount(client) {
    client.account().then(response => {
        // let balance = `${response.data.totalWalletBalance}|${response.data.totalUnrealizedProfit}|${response.data.availableBalance}`
        pos.forEach((p, i) => {
            if (p.ps == 'LONG') {
                let isposL = response.data.positions.filter(v => v.symbol == p.s && v.ps == 'LONG')
                if (isposL.length <= 0) {
                    pos[i].pa = 0
                }
            }
            if (p.ps == 'SHORT') {
                let isposS = response.data.positions.filter(v => v.symbol == p.s && v.ps == 'SHORT')
                if (isposS.length <= 0) {
                    pos[i].pa = 0
                }
            }
        })
        response.data.positions.forEach((item1) => {
            item1.positionAmt = Number(item1.positionAmt)
            item1.entryPrice = Number(item1.entryPrice)
            if (item1.positionAmt != 0) {
                if (item1.positionSide == 'LONG') {
                    let posL = pos.filter(v => v.s == item1.symbol && v.ps == 'LONG')
                    let income = (symbolHyPrice[item1.symbol] - item1.entryPrice) * item1.positionAmt
                    let pp = item1.entryPrice * item1.positionAmt
                    if (posL.length <= 0) {
                        let dInfo = { "s": item1.symbol, "pa": item1.positionAmt, "ep": item1.entryPrice, "cr": 0, "up": income, "pp": pp, "mt": "cross", "iw": "0", "ps": "LONG", "ma": "USDT" }
                        pos.push(dInfo)
                    } else {
                        let posIndex = pos.findIndex(v => v.s == item1.symbol && v.ps == 'LONG')
                        pos[posIndex].pa = item1.positionAmt
                        pos[posIndex].ep = item1.entryPrice
                        pos[posIndex].up = income
                        pos[posIndex].pp = pp
                    }
                } else if (item1.positionSide == 'SHORT') {
                    let posS = pos.filter(v => v.s == item1.symbol && v.ps == 'SHORT')
                    let income = (item1.entryPrice - symbolHyPrice[item1.symbol]) * Math.abs(item1.positionAmt)
                    let pp = item1.entryPrice * Math.abs(item1.positionAmt)
                    if (posS.length <= 0) {
                        let dInfo = { "s": item1.symbol, "pa": Math.abs(item1.positionAmt), "ep": item1.entryPrice, "cr": 0, "up": income, "pp": pp, "mt": "cross", "iw": "0", "ps": "SHORT", "ma": "USDT" }
                        pos.push(dInfo)
                    } else {
                        let posIndex = pos.findIndex(v => v.s == item1.symbol && v.ps == 'SHORT')
                        pos[posIndex].pa = Math.abs(item1.positionAmt)
                        pos[posIndex].ep = item1.entryPrice
                        pos[posIndex].up = income
                        pos[posIndex].pp = pp
                    }
                }
            }
        })
        // console.log('===pos===', pos)
    }).catch(err => {
        console.log('获取account错误', err)
    })
}

function updateIncome() {
    pos.map((v, posIndex) => {
        if (v.ps == 'LONG') {
            let income = (symbolHyPrice[v.s] - v.ep) * v.pa
            let pp = v.ep * v.pa
            pos[posIndex].up = income
            pos[posIndex].pp = pp
        }
        if (v.ps == 'SHORT') {
            let income = (v.ep - symbolHyPrice[v.s]) * v.pa
            let pp = v.ep * Math.abs(v.pa)
            pos[posIndex].up = income
            pos[posIndex].pp = pp
        }
    })
    // console.log('===updateIncome-pos===', pos)
}

function updatePosAndSymbol(symbol, action, amount, price) {
    action = action == 'L' ? 'LONG' : action == 'S' ? 'SHORT' : ''
    pos.forEach((v, i) => {
        if (v.s == symbol && v.ps == action) {
            pos[i].pa = amount
        }
    })
    symbolDatas.forEach((v, i) => {
        if (v.symbol == symbol) {
            if (action == 'LONG') {
                symbolDatas[i].lPrice = price
            }
            if (action == 'SHORT') {
                symbolDatas[i].sPrice = price
            }
        }
    })
}
client.listenKeyPost().then(response => {
    let listenKey = response.data.listenKey;
    setInterval(() => {
        client.listenKeyPut().then(res => {
            pLog(`合约listenKey${listenKey}延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);
    //更新持仓信息
    let wsRef = client.userData(listenKey, {
        open: () => {
            pLog('策略启动完成...')
            setInterval(() => {
                wsRef.ws.send(JSON.stringify({ "ping": "1" }));
            }, 10 * 60 * 1000);
        },
        close: () => pLog('closed'),
        message: (msg) => {
            let res = JSON.parse(msg)
            //判断是否是心跳包返回的数据
            if (res.e == 'ACCOUNT_UPDATE') {
                //查询替换
                // console.log('pos=',pos,'res.a.P=',res.a.P)
                if (res.a.P[0] != undefined) {
                    let index = pos.findIndex(v1 => v1.s == res.a.P[0]?.s && v1.ps == res.a.P[0]?.ps)
                    res.a.P[0]['pa'] = Math.abs(Number(res.a.P[0]?.pa == undefined ? 0 : res.a.P[0].pa))
                    res.a.P[0]['ep'] = Number(res.a.P[0]?.ep == undefined ? 0 : res.a.P[0].ep)
                    res.a.P[0]['up'] = Number(res.a.P[0]?.up == undefined ? 0 : res.a.P[0].up)
                    if (index < 0) {
                        pos.push(res.a.P[0])
                    } else {
                        pos.splice(index, 1)
                        pos.push(res.a.P[0])
                    }
                    console.log(`推送|账户持仓=>${JSON.stringify(pos)}`)
                }
            }
        }
    });
    //
    // 查询 配置 全部参数 where status=1 and lockStatus=0
    let sql = "select * from `ddlh_coin` where uId=1001 order by ons desc"
    doDb(sql, []).then(dbCoin => {
        let _dbCoin = JSON.stringify(dbCoin)
        if (_dbCoin.startsWith('{')) {
            symbolDatas = []
            symbolDatas.push(dbCoin)
        } else {
            symbolDatas = dbCoin
        }
        let SymbolDataArrys = []
        symbolDatas.map(v => {
            SymbolDataArrys.push(`${v.symbol.toLowerCase()}@bookTicker`)
        })

        //更新合约价格
        client.combinedStreams(SymbolDataArrys, {
            open: () => {
                console.log('合约策略启动...')
                UpdatePosDate = Date.now()
                //更新数据库
                let sql2 = 'update `ddlh_coin` set sPrice=?,lPrice=?,unLockCount=unLockCount+0.35,unLockIncome=0,totalIncome=totalIncome+?,lockStatus=0,utime=now() where id=?'
                doDb(sql2, [`${1.3}`, 1.5, 1.72, `${5}`]).then(res2 => {
                    console.log('清仓解锁 持平清仓, ok')
                }).catch(e => {
                    console.error('清仓解锁 持平清仓', e)
                })
            },
            close: () => console.log('合约策略关闭...'),
            message: (msg) => {
                msg = JSON.parse(msg.toString());
                let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
                // let ms = `${msg.data.e} | ${msg.data.s} | ${price} | ${DateFormat(msg.data.E)}`
                // console.log('hy=',ms)
                let symbol = msg.data.s
                price = Number(price)
                symbolHyPrice[symbol] = price
               
                
                //日志打印
                if (LogShowDate == null || Date.now() - LogShowDate > 60 * 1000) {
                    LogShowDate = Date.now()
                    // console.log(logShow, pos)
                    console.log(logShow, 'lIncomeMax=', lIncomeMax, 'sIncomeMax=', sIncomeMax)
                }
            }
        });

    }).catch(err => {
        console.log(err)
    })
}).catch(e => {
    console.log('e=>', e)
})

app.listen(port, () => {
    pLog(`本地服务监听:http://127.0.0.1:${port}`)
})
