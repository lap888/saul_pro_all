/* 策略说明 
   bg vvds mmm
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-01-07 17:54:53
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
let orderList = []
let isFinishOrder = {}
let data = require('./constant')
let ExKey = data.ExKey
ExKey.sort((m, n) => m['id'] - n['id'])
// const ExKey = [
//     {
//         id: 2,
//         name: 'Qee',
//         apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
//         secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
//         passphrase: 'xh18819513042',
//         BTCUSDT: 0.23,
//         ETHUSDT: 3.5,
//         ADAUSDT: 15174,
//         DOGEUSDT: 11184,
//         LTCUSDT: 57,
//         XRPUSDT: 11052,
//         ETCUSDT: 246,
//         BCHUSDT: 38,
//         MATICUSDT: 4938,
//         LINKUSDT: 666,
//         ATOMUSDT: 160,
//         isDo: true,
//         pos: 'a|u',
//         rToken: 'bt_rtoken=upex:session:id:220281b35e21a593f2f04a8c89e84ad738828b5f490b0d96a8fa1d74582fc5ac;',
//         btSession: 'bt_sessonid=f50a6681-5130-45b5-849b-96c61f63a495;',
//         btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI2YTg4N2JjNy0wZThhLTRmZGQtODQzZS1lNWJjYmFkZTUwNDA5NjkxNzI0NjUiLCJ1aWQiOiJiS2VMckdPTm9tbklvUEZjcXZ2eE9BPT0iLCJzdWIiOiJxZWVmKioqKkBob3RtYWlsLmNvbSIsImlwIjoiUHJuWm1SYVJqalNUY0owMU9Wd3JTQT09IiwiZGlkIjoibkc1TThOaG9PbXJoWkQrMlc4NVpaM2RtdFJvUVJ3UEMrVjFGK3VDUVh4RjEyUklzWlFLTTVIQmtTNHlUUmhuVyIsInN0cyI6MCwiaWF0IjoxNjcxODcwNTAxLCJleHAiOjE2Nzk2NDY1MDEsInB1c2hpZCI6ImRka1NMR1VDak9Sd1pFdU1rMFlaMWc9PSIsImlzcyI6InVwZXgifQ.HkHZATpPXDLC0_IwhYuX_AhLpq8Y81CCvSG3dpLZJ-g;'
//     },
//     {
//         id: 3,
//         name: 'ZY',
//         apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
//         secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
//         passphrase: 'xh18819513042',
//         BTCUSDT: 0.1,
//         ETHUSDT: 1,
//         ADAUSDT: 2000,
//         DOGEUSDT: 8000,
//         LTCUSDT: 20,
//         XRPUSDT: 1714,
//         ETCUSDT: 40,
//         BCHUSDT: 6,
//         MATICUSDT: 750,
//         LINKUSDT: 10,
//         ATOMUSDT: 160,
//         isDo: true,
//         pos: 'a|u',
//         rToken: 'bt_rtoken=upex:session:id:b4706d8bbf7a95109685e9c19715f5fc94a6b5ffcd57126884dad64264096f99;',
//         btSession: 'bt_sessonid=8ddc5591-78ed-49f4-b802-903b9cbe14f3;',
//         btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwZTkzMDYyMy1jZWI3LTQyMDgtYWRhNC05MTJlNDAwNWRhYWMxODcwNzcwMjEwIiwidWlkIjoiSUZ2WE9xcG5nVnVaWUhGQUJhNUVDQT09Iiwic3ViIjoieGh6ejE4ODE5NTEqKioqQHNpbmEuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzE5Njk1NjIsImV4cCI6MTY3OTc0NTU2MiwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.or9pMTfo5zV_neoS1LzjcUMrjcoc-2tjIf0VUc7BaOg;'
//     },
//     {
//         id: 4,
//         name: 'ML',
//         apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
//         secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
//         passphrase: 'xh18819513042',
//         BTCUSDT: 1,
//         ETHUSDT: 20,
//         LTCUSDT: 150,
//         isDo: true,
//         pos: 'a|u',
//         rToken: 'bt_rtoken=upex:session:id:88c8866236f3b451cbec1e08a95124420e7203632ca0d6d3e4ef94fb1d85f0a4;',
//         btSession: 'bt_sessonid=47f0746a-9caf-4b52-af08-f85e0c449bc8;',
//         btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwNTIyODMzMy00MTZiLTQ5YTItOTBkNy01NzdlMDVhOTkxN2YxMDkyNTM1MzkxIiwidWlkIjoiM0IwRHU0VEkvUGdjZjN5TjMxcDFhdz09Iiwic3ViIjoieHF6KioqKkAxNjMuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzIxMjcxOTAsImV4cCI6MTY3OTkwMzE5MCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.Bvy9oVmDBMqaS3uTrni4QT82kqY6MwbAkdorXLCj6PQ;'
//     },
//     {
//         id: 5,
//         name: 'ML1',
//         apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
//         secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
//         passphrase: 'xh18819513042',
//         BTCUSDT: 2,
//         ETHUSDT: 30,
//         LTCUSDT: 300,
//         isDo: true,
//         pos: 'a|u',
//         rToken: 'bt_rtoken=upex:session:id:a1dc2cd1ce136a5edfd34fea9141f22bc2515df7be2f1a761c72478420972999;',
//         btSession: 'bt_sessonid=28a12eec-66ab-48c9-af6e-777196db5961;',
//         btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI0MDRlMDllOS1jOTgxLTQ0ZjctOGRiMi0yZGRkMTM1YTZlOTExODEzMDA0MTcwIiwidWlkIjoiNllsNE5HOHJJcHIvaHd4OWFOV3Rpdz09Iiwic3ViIjoiSmh6MTEyMjMzKioqKkAxNjMuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzIxMzE1NjAsImV4cCI6MTY3OTkwNzU2MCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.BhKZJoZu81HDTj6ftLE9RaA4-xw-KbaOiOYHxlPfxeo;'
//     }
// ]

const { BuyClose, BuyByQ, SellByQ, SellClose, Assets, UserInfo, getHistoryOrderList } = require('./order')

process.on('uncaughtException', (error, source) => {
    console.error('未捕获异常=>', error, source)
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
app.get("/api/getOrder", async function (req, res) {
    let data = { code: 200, message: 'ok' }

    let totalFee = 0;
    let totalIncome = 0;
    let s = req.query.s
    let e = req.query.e
    if (e == undefined) {
        e = new Date().getTime()
    } else {
        e = new Date(e).getTime()
    }
    if (s == undefined) {
        s = e - 24 * 60 * 60 * 1000;
    } else {
        s = new Date(s).getTime()
    }
    if (e - s < 24 * 60 * 60 * 1000) {
        s = e - 24 * 60 * 60 * 1000
    }
    try {
        let name = req.query.name;
        let v = ExKey.find(v => v.name == name)
        if (v != undefined) {
            // console.log(DateFormat(s))
            // console.log(DateFormat(e))

            if (isFinishOrder[v.name] == undefined || isFinishOrder[v.name] == -1) {
                orderList = []
                isFinishOrder[v.name] = 2
                getHistOrder(1, 100, s, e, v.name, v.rToken, v.btSession, v.btNewSession)
            }
            for (let i = 0; i < orderList.length; i++) {
                let e = orderList[i];
                totalFee = totalFee + Math.abs(Number(e.totalFee))
                totalIncome = totalIncome + Number(e.totalProfits)
            }
            data.isFinishOrder = isFinishOrder[v.name] == 1 ? '查询完成' : isFinishOrder[name] = 2 ? '查询中' : ''
            data.totalFee = totalFee
            data.totalIncome = totalIncome
            data.list = orderList
            data.s = DateFormat(s)
            data.e = DateFormat(e)
            data.total = data.list.length


            let d = groupBy(orderList, function (item) {
                return [item.symbolDisplayName]
            })
            let print = []
            d.map(v => {
                let totalFee = 0;
                let totalIncome = 0;
                for (let i = 0; i < v.length; i++) {
                    let e = v[i];
                    totalFee = totalFee + Math.abs(Number(e['totalFee']))
                    totalIncome = totalIncome + Number(e['totalProfits'])
                }
                let str = `${v[0]['baseTokenId']} | 交易:${v.length / 2}笔 | 手续费:${totalFee}u | 收益:${totalIncome}u `
                print.push(str)
            })
            data.print = print.join('=||= ')

            if (isFinishOrder[v.name] != 1) {
                data.code = -1
                data.msg = '查询中'
            }
            if (isFinishOrder[v.name] == 1) {
                orderList = []
                isFinishOrder[v.name] = -1
            }

            res.json(data);
        } else {
            data.code = -1
            data.msg = '用户不存在'
            res.json(data);
        }

    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
function groupBy(array, f) {
    let groups = {}
    array.forEach(function (o) {
        let group = JSON.stringify(f(o))
        groups[group] = groups[group] || []
        groups[group].push(o)
    })
    return Object.keys(groups).map(function (group) {
        return groups[group]
    })

}
function uniqueFunc(arr, uniId) {
    const res = new Map();
    return arr.filter((item) => !res.has(item[uniId]) && res.set(item[uniId], 1));
}

function getHistOrder(pageNo, pageSize, st, et, name, rToken, btSession, btNewSession) {
    return new Promise((resolve, reject) => {
        getHistoryOrderList(pageNo, pageSize, st, et, name, rToken, btSession, btNewSession).then(async res => {
            if (res.code == "200") {
                res.data.orderList.map(v => {
                    v['ctime'] = DateFormat(Number(v['createTime']))
                })
                await Sleep(1000)

                if (res.data.orderList[res.data.orderList.length - 1] == undefined) {
                    console.log('===查询完成,没有数据===')
                    isFinishOrder[name] = 1
                    resolve(orderList)
                } else {
                    if (orderList.length == 0) {
                        res.data.orderList.map(function (value, index, array) {
                            orderList = orderList.concat(value);
                        });
                        if (res.data.orderList.length > 0) {
                            getHistOrder(pageNo, pageSize, st, Number(res.data.orderList[res.data.orderList.length - 1]['createTime']), name, rToken, btSession, btNewSession)
                        }

                        // console.log(`1第${orderList.length}条数据`)
                        isFinishOrder[name] = 2
                        await Sleep(1000)
                    } else {
                        if (res.data.orderList[res.data.orderList.length - 1]['createTime'] != orderList[orderList.length - 1]['createTime']) {
                            res.data.orderList.map(function (value, index, array) {
                                orderList = orderList.concat(value);
                            });
                            if (res.data.orderList.length > 0) {
                                getHistOrder(pageNo, pageSize, st, Number(res.data.orderList[res.data.orderList.length - 1]['createTime']), name, rToken, btSession, btNewSession)
                            }

                            // console.log(`2第${orderList.length}条数据`)
                            isFinishOrder[name] = 2
                            await Sleep(1000)
                        } else {

                            let newOrder = uniqueFunc(orderList, 'orderNo');
                            // console.log(`3第${newOrder.length}条数据`)
                            isFinishOrder[name] = 1
                            console.log('===查询完成===')
                            resolve(orderList)
                        }
                    }
                }

            }
        }).catch(err => {
            console.log('udo|err=>', err)
            reject(err)
        })
    });

}
//获取用户资产
app.get("/api/getAssets", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let name = req.query.name;
        let v = ExKey.find(v => v.name == name)
        if (v != undefined) {
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
        } else {
            data.code = -3;
            data.message = 'name 不存在'
            res.json(data)
        }

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
        data['log'] = Log()?.reverse();
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});
app.get("/api/delLog", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        // data['log'] = Log()?.reverse();
        Log(null)
        res.json(data);
    } catch (error) {
        console.log(error)
        data.code = -3;
        data.message = '系统异常'
        res.json(data)
    }
});

app.get("/api/kline", function (req, res) {
    // let skline1 = _G('MKline')
    // skline1 = JSON.parse(skline1)
    let data = { code: 200, message: 'ok' }
    try {
        // let r = req.query
        // let startTime = r.t1
        // let endTime = r.t2
        // let _sk = []
        // skline1[`ETHUSDT`].history.map(v => {
        //     if (new Date(v.time).getTime() > new Date(startTime).getTime() && new Date(v.time).getTime() < new Date(endTime).getTime()) {
        //         _sk.push(v)
        //     }
        // });
        data.kline = twoSymbolData
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