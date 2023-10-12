// let btRate = { 'SUSHIUSDT': 0.001,'ZILUSDT': 0.001,'ATOMUSDT': 0.001,'MATICUSDT': 0.001,'SOLUSDT': 0.001,'ETCUSDT': 0.001,'XRPUSDT': 0.001,'ETHUSDT': 0.001, 'BTCUSDT': 0.001, 'APTUSDT': 0.001, 'DOGEUSDT': 0.001, 'MASKUSDT': 0.001 }
// let a=Object.keys(btRate)
// console.log(a)
// a['SUSHIUSDT']=123;
const express = require('express')
const app = express()
let cors = require('cors')
app.use(express.static('wwwroot'));
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const port = '30016'
const { DateFormat, _G, Sleep } = require("binance-futures-connector");

// let d = new Date()

// let as = []
// for (let i = 0; i < 10; i++) {

//     as.push(i)
//     // await Sleep(10)
// }

// as.map(async v=>{
//     let ms = d.getMilliseconds()
//     await Sleep(10)
//     console.log(v, ms)

// })

// setInterval(function () {
//     let d = new Date()
//     let ms = d.getMilliseconds()
//     console.log(ms, DateFormat(Date.now()))
// }, 1);

// console.log(a)

// console.log(a['SUSHIUSDT'])

// console.log(a['ZILUSDT'])

// let a = [];
// a.push(1)
// a.push(5)
// a.push(3)
// console.log(a)
// console.log(a[0])
// console.log(a[a.length - 1])

// var myDate = new Date();
// var myDateS = myDate.getSeconds() * 1000;
// var myDateMs = myDate.getMilliseconds();//获取到毫秒以减少误差
// console.log(myDate, myDateS, myDateMs)
// let i=0
// setTimeout(function () {
//     console.log(i++,DateFormat(Date.now()))
// },60000-myDateS-myDateMs);
console.log(DateFormat(1672289165699))
let skline1 = _G('MKline1')
skline1 = JSON.parse(skline1)

// let sk = skline1[`ETHUSDT`].history.find(v => new Date(v.time).getTime() > new Date('2022-12-14 08:35:57').getTime())
// console.log(sk)
// let d = Date.now()
// for (let i = 0; i < 10000; i++) {
//     if (i == 2) {
//         console.log('a',DateFormat(d))
//     }else if (i == 10000 - 2) {
//         console.log('b',DateFormat(d))
//     }else{
//         console.log('c')
//     }

// }


// let _sk = []
// let startTime = '2022-12-14 08:30:57'
// let endTime = '2022-12-14 08:36:57'
// skline1[`ETHUSDT`].history.map(v => {

//     if (new Date(v.time).getTime() > new Date(startTime).getTime() && new Date(v.time).getTime() < new Date(endTime).getTime()) {
//         _sk.push(v)
//     }
// });
// console.log(_sk)
let d1 = [
    {
        averageDealPrice: '0.070984',
        baseTokenId: 'DOGE',
        businessLine: 10,
        businessSource: 10,
        businessSourceDesc: '最优价普通',
        clientOid: '992265169855488000',
        controlType: 0,
        controlTypeDesc: 'GTC',
        createTime: '1672300372565',
        dealAmount: '567.8720',
        dealCount: '8000',
        delegateCount: '8000',
        delegateLeverage: '20',
        delegateType: 3,
        delegateTypeDesc: '平多',
        forceTime: '1672300372565',
        marginMode: 2,
        onlyLow: true,
        orderNo: '992265169851293696',
        orderType: 1,
        positionAverage: '0.070930',
        quoteTokenId: 'USDT',
        secondBusinessLine: 'N/A',
        status: 4,
        statusDesc: '完全成交',
        symbolDisplayName: 'DOGEUSDT',
        symbolId: 'DOGEUSDT_UMCBL',
        tokenDisplayName: 'USDT',
        tokenId: 'USDT',
        totalFee: '-0.34072320',
        totalProfits: '0.43200000',
        updateTime: '1672300372683',
        userId: '5646171396',
        ctime: '2022-12-29 15:52:52'
    },
    {
        averageDealPrice: '0.070930',
        baseTokenId: 'DOGE',
        businessLine: 10,
        businessSource: 10,
        businessSourceDesc: '最优价普通',
        clientOid: '992265153954881537',
        controlType: 0,
        controlTypeDesc: 'GTC',
        createTime: '1672300368774',
        dealAmount: '567.4400',
        dealCount: '8000',
        delegateCount: '8000',
        delegateLeverage: '20',
        delegateType: 1,
        delegateTypeDesc: '开多',
        forceTime: '1672300368774',
        marginMode: 2,
        onlyLow: false,
        orderNo: '992265153929715713',
        orderType: 1,
        quoteTokenId: 'USDT',
        secondBusinessLine: 'N/A',
        status: 4,
        statusDesc: '完全成交',
        symbolDisplayName: 'DOGEUSDT',
        symbolId: 'DOGEUSDT_UMCBL',
        tokenDisplayName: 'USDT',
        tokenId: 'USDT',
        totalFee: '-0.34046400',
        totalProfits: '0.00000000',
        updateTime: '1672300368905',
        userId: '5646171396',
        ctime: '2022-12-29 15:52:48'
    }
]

let d2 = [
    {
        averageDealPrice: '0.070984',
        baseTokenId: 'DOGE',
        businessLine: 10,
        businessSource: 10,
        businessSourceDesc: '最优价普通',
        clientOid: '992265169855488000',
        controlType: 0,
        controlTypeDesc: 'GTC',
        createTime: '1672300372565',
        dealAmount: '567.8720',
        dealCount: '8000',
        delegateCount: '8000',
        delegateLeverage: '20',
        delegateType: 3,
        delegateTypeDesc: '平多',
        forceTime: '1672300372565',
        marginMode: 2,
        onlyLow: true,
        orderNo: '992265169851293696',
        orderType: 1,
        positionAverage: '0.070930',
        quoteTokenId: 'USDT',
        secondBusinessLine: 'N/A',
        status: 4,
        statusDesc: '完全成交',
        symbolDisplayName: 'DOGEUSDT',
        symbolId: 'DOGEUSDT_UMCBL',
        tokenDisplayName: 'USDT',
        tokenId: 'USDT',
        totalFee: '-0.34072320',
        totalProfits: '0.43200000',
        updateTime: '1672300372683',
        userId: 'xxxx',
        ctime: '2022-12-29 15:52:52'
    }
]

const ExKey = [
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
        BTCUSDT: 1,
        ETHUSDT: 20,
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
        BTCUSDT: 2,
        ETHUSDT: 30,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:a1dc2cd1ce136a5edfd34fea9141f22bc2515df7be2f1a761c72478420972999;',
        btSession: 'bt_sessonid=28a12eec-66ab-48c9-af6e-777196db5961;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI0MDRlMDllOS1jOTgxLTQ0ZjctOGRiMi0yZGRkMTM1YTZlOTExODEzMDA0MTcwIiwidWlkIjoiNllsNE5HOHJJcHIvaHd4OWFOV3Rpdz09Iiwic3ViIjoiSmh6MTEyMjMzKioqKkAxNjMuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzIxMzE1NjAsImV4cCI6MTY3OTkwNzU2MCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.BhKZJoZu81HDTj6ftLE9RaA4-xw-KbaOiOYHxlPfxeo;'
    }
]
// let v = ExKey.find(v => v.name == 'ML')
// console.log('v1',v)

// let v1 = ExKey.find(v => v.name == 'ML2')
// console.log('v2',v1)


// let d3 = []
// console.log('1', d3)
// d3.concat(d1)
// d1.map(function (value, index, array) {
//     d3 = d3.concat(value);
// });
// console.log('2', d3)
// // d3.concat(d2)
// d2.map(function (value, index, array) {
//     d3 = d3.concat(value);
// });
// console.log('3', d3)
app.get("/api/getKline", function (req, res) {
    let data = { code: 200, message: 'ok' }
    try {
        let r = req.query
        let startTime = r.t1
        let endTime = r.t2
        let _sk = []
        skline1[`ETHUSDT`].history.map(v => {
            if (new Date(v.time).getTime() > new Date(startTime).getTime() && new Date(v.time).getTime() < new Date(endTime).getTime()) {
                _sk.push(v)
            }
        });
        data.kline = _sk
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
