/* 策略说明 
   bg vvds mmm
 * @Author: topbrids@gmail.com 
 * @Date: 2022-11-30 09:24:43 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-02-21 12:39:02
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


const { Assets, UserInfo, getHistoryOrderList } = require('./hotOrderScan')

process.on('uncaughtException', (error, source) => {
    console.error('未捕获异常=>', error, source)
})

//获取当前秒单账户
app.get("/api/getAccount", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let history = []
        ExKey.map(v => {
            let d = {};
            d['key'] = v.name
            d['id'] = v.id
            d['name'] = v.name
            history.push(d)
            if (history.length == ExKey.length) {
                data.list = history;
                res.json(data);
            }
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
    let r = req.query;
    let pageNo = r.pageNo == undefined ? 1 : r.pageNo
    let pageSize = r.pageSize == undefined ? 10 : r.pageSize
    try {
        let name = req.query.name;
        let v = ExKey.find(v => v.name == name)
        if (v != undefined) {
            let res1 = await getHistoryOrderList(pageNo, pageSize, v.rToken)
            res1.data.rows.map((v, i) => {
                res1.data.rows[i]['key'] = v.id
            })
            res.json(res1.data);
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

//获取用户资产
app.get("/api/getAssets", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let name = req.query.name;
        let v = ExKey.find(v => v.name == name)
        if (v != undefined) {
            Assets(v.name, v.rToken).then(res1 => {
                if (res1.code == "200") {
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