/* 扫码下单接口
 * @Author: topbrids@gmail.com 
 * @Date: 2022-12-24 15:07:58 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-01-10 22:30:55
 */
const axios = require('axios');
const { DateFormat, Sleep } = require('binance-futures-connector');
const crypto = require('crypto');
const secret = '11cba7c904c94668ab3adea326693ff4';
const orderno = 'ZF202212267805OcnDHY';
const ExKey = [
    // {
    //     id: 2,
    //     name: 'Qee',
    //     apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
    //     secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
    //     passphrase: 'xh18819513042',
    //     BTCUSDT: 0.1,
    //     ETHUSDT: 1,
    //     ADAUSDT: 20,
    //     DOGEUSDT: 8000,
    //     LTCUSDT: 9,
    //     XRPUSDT: 1714,
    //     ETCUSDT: 40,
    //     BCHUSDT: 6,
    //     MATICUSDT: 750,
    //     LINKUSDT: 10,
    //     isDo: false,
    //     pos: 'l',
    //     rToken: 'bt_rtoken=upex:session:id:220281b35e21a593f2f04a8c89e84ad738828b5f490b0d96a8fa1d74582fc5ac;',
    //     btSession: 'bt_sessonid=f50a6681-5130-45b5-849b-96c61f63a495;',
    //     btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI2YTg4N2JjNy0wZThhLTRmZGQtODQzZS1lNWJjYmFkZTUwNDA5NjkxNzI0NjUiLCJ1aWQiOiJiS2VMckdPTm9tbklvUEZjcXZ2eE9BPT0iLCJzdWIiOiJxZWVmKioqKkBob3RtYWlsLmNvbSIsImlwIjoiUHJuWm1SYVJqalNUY0owMU9Wd3JTQT09IiwiZGlkIjoibkc1TThOaG9PbXJoWkQrMlc4NVpaM2RtdFJvUVJ3UEMrVjFGK3VDUVh4RjEyUklzWlFLTTVIQmtTNHlUUmhuVyIsInN0cyI6MCwiaWF0IjoxNjcxODcwNTAxLCJleHAiOjE2Nzk2NDY1MDEsInB1c2hpZCI6ImRka1NMR1VDak9Sd1pFdU1rMFlaMWc9PSIsImlzcyI6InVwZXgifQ.HkHZATpPXDLC0_IwhYuX_AhLpq8Y81CCvSG3dpLZJ-g;'
    // },
    // {
    //     id: 3,
    //     name: 'ZY',
    //     apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
    //     secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
    //     passphrase: 'xh18819513042',
    //     BTCUSDT: 0.1,
    //     ETHUSDT: 1,
    //     ADAUSDT: 30,
    //     DOGEUSDT: 8000,
    //     LTCUSDT: 9,
    //     XRPUSDT: 1714,
    //     ETCUSDT: 40,
    //     BCHUSDT: 6,
    //     MATICUSDT: 750,
    //     LINKUSDT: 10,
    //     isDo: true,
    //     pos: 'c',
    //     rToken: 'bt_rtoken=upex:session:id:b4706d8bbf7a95109685e9c19715f5fc94a6b5ffcd57126884dad64264096f99;',
    //     btSession: 'bt_sessonid=8ddc5591-78ed-49f4-b802-903b9cbe14f3;',
    //     btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwZTkzMDYyMy1jZWI3LTQyMDgtYWRhNC05MTJlNDAwNWRhYWMxODcwNzcwMjEwIiwidWlkIjoiSUZ2WE9xcG5nVnVaWUhGQUJhNUVDQT09Iiwic3ViIjoieGh6ejE4ODE5NTEqKioqQHNpbmEuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzE5Njk1NjIsImV4cCI6MTY3OTc0NTU2MiwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.or9pMTfo5zV_neoS1LzjcUMrjcoc-2tjIf0VUc7BaOg'
    // },
    // {
    //     id: 4,
    //     name: 'ML',
    //     apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
    //     secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
    //     passphrase: 'xh18819513042',
    //     BTCUSDT: 0.5,
    //     ETHUSDT: 6,
    //     LTCUSDT: 60,
    //     ADAUSDT: 20,
    //     isDo: false,
    //     pos: 'l',
    //     rToken: 'bt_rtoken=upex:session:id:88c8866236f3b451cbec1e08a95124420e7203632ca0d6d3e4ef94fb1d85f0a4;',
    //     btSession: 'bt_sessonid=47f0746a-9caf-4b52-af08-f85e0c449bc8;',
    //     btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwNTIyODMzMy00MTZiLTQ5YTItOTBkNy01NzdlMDVhOTkxN2YxMDkyNTM1MzkxIiwidWlkIjoiM0IwRHU0VEkvUGdjZjN5TjMxcDFhdz09Iiwic3ViIjoieHF6KioqKkAxNjMuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJuRzVNOE5ob09tcmhaRCsyVzg1WlozZG10Um9RUndQQytWMUYrdUNRWHhGMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzIxMjcxOTAsImV4cCI6MTY3OTkwMzE5MCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.Bvy9oVmDBMqaS3uTrni4QT82kqY6MwbAkdorXLCj6PQ;'
    // },
    {
        id: 5,
        name: 'ML1',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        ADAUSDT: 20,
        isDo: true,
        pos: 'l',
        rToken: 'bt_rtoken=upex:session:id:2d79bc68706e91a6dddbc3d136d85b1fd6e88d44fd952543201ca47433ff0088;',
        btSession: 'bt_sessonid=5194a76a-c86f-4311-9f6d-ae44b98fead7;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1NmJkZGQwYy00MGRmLTRlNzQtOTZiOC0zYjA3OWY0NTJiYTgyMTQ3MzQ3Njk1IiwidWlkIjoiL3JVQ3hyUFZMMzV1bHAwcThzVzRSQT09Iiwic3ViIjoiSmh6NTIwNSoqKipAMTYzLmNvbSIsImlwIjoiUHJuWm1SYVJqalNUY0owMU9Wd3JTQT09IiwiZGlkIjoibkc1TThOaG9PbXJoWkQrMlc4NVpaM2RtdFJvUVJ3UEMrVjFGK3VDUVh4RjEyUklzWlFLTTVIQmtTNHlUUmhuVyIsInN0cyI6MCwiaWF0IjoxNjczMzYwMzg0LCJleHAiOjE2ODExMzYzODQsInB1c2hpZCI6ImRka1NMR1VDak9Sd1pFdU1rMFlaMWc9PSIsImlzcyI6InVwZXgifQ.KRgZ8MtHA0CO-hzk_Z7WhEr2Q2UAjf_9SKgk1MUd3RQ;'
    }

]
const bitgetApi = require('bitget-openapi');
const mixOrderApi = new bitgetApi.MixOrderApi('bg_bd1bff02d35c721c1b667a84ae4bda1a', '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b', 'xh18819513042');

//下单接口
const BuyByQ = async (symbol, amount, rToken, btSession, btNewSession) => {
    let timestamp = parseInt(new Date().getTime() / 1000);
    let plantext = 'orderno=' + orderno + ',secret=' + secret + ',timestamp=' + timestamp;
    let md5 = crypto.createHash('md5');
    md5.update(plantext);
    let sign = md5.digest('hex');
    sign = sign.toUpperCase();

    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/openContract', {
        "tokenId": "USDT",
        "symbolId": `${symbol}_UMCBL`,
        "businessLine": 10,
        "businessSource": 10,
        "enterPointSource": 1,
        "secondBusinessLine": "N/A",
        "timeInForceValue": 0,
        "delegateCount": amount,
        "orderType": 1,
        "delegateType": 1,
        "languageType": 1
    }, {
        // "proxy": 'http://forward.xdaili.cn:80',
        "headers": {
            "Cookie": `${rToken}${btSession}${btNewSession}`,
            // 'Proxy-Authorization': 'sign=' + sign + '&orderno=' + orderno + "&timestamp=" + timestamp
        }
    });
    res = _res['data']
    console.log('扫码|买入开多BYQ', JSON.stringify(res))
    return res;
}
const BuyClose = async (symbol, amount, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/closeContract', {
        "tokenId": "USDT",
        "symbolId": `${symbol}_UMCBL`,
        "businessLine": 10,
        "businessSource": 10,
        "enterPointSource": 1,
        "secondBusinessLine": "N/A",
        "timeInForceValue": 0,
        "delegateCount": amount,
        "orderType": 1,
        "cancelOrder": true,
        "delegateType": 3,
        "languageType": 1
    }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    console.log('扫码|卖出平多BYQ', JSON.stringify(res))
    return res;
}
const SellByQ = async (symbol, amount, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/openContract', {
        "tokenId": "USDT",
        "symbolId": `${symbol}_UMCBL`,
        "businessLine": 10,
        "businessSource": 10,
        "enterPointSource": 1,
        "secondBusinessLine": "N/A",
        "timeInForceValue": 0,
        "delegateCount": amount,
        "orderType": 1,
        "delegateType": 2,
        "languageType": 1
    }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    console.log('扫码|卖出开空BYQ', JSON.stringify(res))
    return res;
}
const SellClose = async (symbol, amount, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/closeContract', {
        "tokenId": "USDT",
        "symbolId": `${symbol}_UMCBL`,
        "businessLine": 10,
        "businessSource": 10,
        "enterPointSource": 1,
        "secondBusinessLine": "N/A",
        "timeInForceValue": 0,
        "delegateCount": amount,
        "orderType": 1,
        "cancelOrder": true,
        "delegateType": 4,
        "languageType": 1
    }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    console.log('扫码|买入平空BYQ', JSON.stringify(res))
    return res;
}
//资产接口
const Assets = async (name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mix/assets', { "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    console.log(`扫码 | ${name} 资产`, res)
    return res;
}
//登录信息接口
const UserInfo = async (name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/user/overview/userinfo', { "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    console.log(`扫码 | ${name} 用户信息`, res)
    return res;
}
// 
const getHistoryOrderList = async (pageNo, pageSize, startTime, endTime, name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/getHistoryOrderList', { "businessLine": 10, "pageNo": pageNo, "pageSize": pageSize, "startTime": startTime, "endTime": endTime, "delegateType": 0, "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    console.log(`扫码 | ${name} 合约交易记录|历史委托`, res)
    return res;
}
// 
const getDealRecordList = async (pageNo, pageSize, startTime, endTime, name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/getDealRecordList', { "businessLine": 10, "pageNo": pageNo, "pageSize": pageSize, "startTime": startTime, "endTime": endTime, "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    // console.log(`扫码 | ${name} 合约交易记录|成交明细`, res)
    return res;
}
let orderList = []
ExKey.map(async v => {
    if (v.isDo) {
        let _p = v.pos.split('|')
        if (_p.indexOf('o') != -1) {
            BuyByQ('ADAUSDT', v['ADAUSDT'], v.rToken, v.btSession, v.btNewSession).then(async res => {
                if (res.code == "200") {
                    console.log('cdo=>', '开多成功')
                    let orderId = res.data.orderId
                    mixOrderApi.fills('ADAUSDT_UMCBL', '992664447836921858').then(res => {

                        console.log('mixOrderApi', res)
                        // let data = res.data.reverse()
                        // data.map(v => {
                        //     let o = {}
                        //     totalProfit = totalProfit + Number(v.profit) //+ Number(v.fee)
                        //     totalProfit1 = totalProfit1 + Number(v.profit) + Number(v.fee) * 0.5
                        //     totalFee = totalFee + Math.abs(Number(v.fee))
                        //     o['操作'] = v.side == 'open_short' ? '开空' : v.side == 'close_short' ? '平空' : v.side == 'open_long' ? '开多' : v.side == 'close_long' ? '平多' : ''
                        //     o['价格'] = v.price
                        //     o['单笔手续费'] = v.fee
                        //     o['单笔收益'] = v.profit
                        //     o['下单数量'] = v.sizeQty + 'ETH'
                        //     o['总收益'] = totalProfit
                        //     o['净收益'] = totalProfit1
                        //     o['总手续费'] = totalFee
                        //     o['时间'] = DateFormat(Number(v.cTime))
                        //     orderArrs.push(o)
                        // })

                    })

                    let sT = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
                    let eT = new Date().getTime()
                    let as = []
                    // await Sleep(1000)
                    // getDealRecordList(1, 10, sT, eT, v.name, v.rToken, v.btSession, v.btNewSession).then(res => {
                    //     // console.log('getDealRecordList=>', res, '|', res.data.dealRecordList)
                    //     if (res.code == "200") {
                    //         res.data.dealRecordList.map(v => {
                    //             v['ctime'] = DateFormat(Number(v['createTime']))
                    //             if (v['symbolDisplayName'] == 'ADAUSDT' && (v['delegateTypeDesc'] == '开多')) {
                    //                 as.push(v)
                    //             }
                    //         })

                    //         console.log('查单=|=udo=>', 'L-Y', as[0]['positionAverage'], as[0]['ctime'])
                    //         // console.log('udo=>', res.data.dealRecordList)
                    //     }
                    // }).catch(err => {
                    //     console.log('udo|err=>', err)
                    // })
                }
            }).catch(err => {
                console.log('do|err=>', err)
            })
            SellByQ('ADAUSDT', v['ADAUSDT'], v.rToken, v.btSession, v.btNewSession).then(res => {
                if (res.code == "200") {
                    console.log('cdo=>', '开空成功')
                    let sT = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
                    let eT = new Date().getTime()
                    let as = []
                    // getDealRecordList(1, 10, sT, eT, v.name, v.rToken, v.btSession, v.btNewSession).then(res => {
                    //     // console.log('getDealRecordList=>', res, '|', res.data.dealRecordList)
                    //     if (res.code == "200") {
                    //         res.data.dealRecordList.map(v => {
                    //             v['ctime'] = DateFormat(Number(v['createTime']))
                    //             if (v['symbolDisplayName'] == 'ADAUSDT' && (v['delegateTypeDesc'] == '开空')) {
                    //                 as.push(v)
                    //             }
                    //         })

                    //         console.log('查单=|=udo=>', 'S', as[0]['positionAverage'], as[0]['ctime'])
                    //         // console.log('udo=>', res.data.dealRecordList)
                    //     }
                    // }).catch(err => {
                    //     console.log('udo|err=>', err)
                    // })
                }
            }).catch(err => {
                console.log('do|err=>', err)
            })
        }
        if (_p.indexOf('c') != -1) {
            BuyClose('ADAUSDT', v['ADAUSDT'], v.rToken, v.btSession, v.btNewSession).then(res => {
                if (res.code == "200") {
                    console.log('cdo=>', '平多成功')
                } else {
                    console.log('cdo=>', '平多异常', res)
                }

            }).catch(err => {
                console.log('cdo|err=>', err)
            })
            SellClose('ADAUSDT', v['ADAUSDT'], v.rToken, v.btSession, v.btNewSession).then(res => {
                if (res.code == "200") {
                    console.log('cdo=>', '平空成功')
                } else {
                    console.log('cdo=>', '平空异常', res)
                }
            }).catch(err => {
                console.log('cdo|err=>', err)
            })
        }
        if (_p.indexOf('a') != -1) {
            //查询资产
            Assets(v.name, v.rToken, v.btSession, v.btNewSession).then(res => {
                console.log('ado=>', res)
            }).catch(err => {
                console.log('ado|err=>', err)
            })
        }
        if (_p.indexOf('u') != -1) {
            //用户信息
            UserInfo(v.name, v.rToken, v.btSession, v.btNewSession).then(res => {
                console.log('udo=>', res)
            }).catch(err => {
                console.log('udo|err=>', err)
            })
        }
        if (_p.indexOf('l') != -1) {
            //近三个月订单
            let sT = new Date().getTime() - 3 * 24 * 60 * 60 * 1000;
            let eT = new Date().getTime()
            let as = []
            getHistoryOrderList(1, 10, sT, eT, v.name, v.rToken, v.btSession, v.btNewSession).then(res => {
                if (res.code == "200") {
                    res.data.orderList.map(v => {
                        v['ctime'] = DateFormat(Number(v['createTime']))
                        v['utime'] = DateFormat(Number(v['updateTime']))
                        if (v['symbolDisplayName'] == 'MATICUSDT' && (v['delegateTypeDesc'] == '开多' || v['delegateTypeDesc'] == '开空')) {
                            as.push(v)
                        }
                    })
                    // console.log('udo=>', res.data.orderList)
                    console.log('udo=>', as, as[0]['averageDealPrice'])
                }
            }).catch(err => {
                console.log('udo|err=>', err)
            })

            // getHistOrder(1, 100, sT, eT, v.name, v.rToken, v.btSession, v.btNewSession).then(res => {
            //     console.log(`${res.length}条数据`)
            //     let newOrder = uniqueFunc(res, 'orderNo');
            //     console.log(`3第${newOrder.length}条数据`)
            //     console.log(`o第${orderList.length}条数据`)
            // }).catch(err => {
            //     console.log('err', err)
            // })


        }
    }

})
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
                if (orderList.length == 0) {
                    res.data.orderList.map(function (value, index, array) {
                        orderList = orderList.concat(value);
                    });
                    getHistOrder(pageNo, pageSize, st, Number(res.data.orderList[res.data.orderList.length - 1]['createTime']), name, rToken, btSession, btNewSession)
                    console.log(`1第${orderList.length}条数据`)
                    await Sleep(1000)
                } else {
                    if (res.data.orderList[res.data.orderList.length - 1]['createTime'] != orderList[orderList.length - 1]['createTime']) {
                        res.data.orderList.map(function (value, index, array) {
                            orderList = orderList.concat(value);
                        });
                        getHistOrder(pageNo, pageSize, st, Number(res.data.orderList[res.data.orderList.length - 1]['createTime']), name, rToken, btSession, btNewSession)
                        console.log(`2第${orderList.length}条数据`)
                        await Sleep(1000)
                    } else {
                        console.log('===xxx===')

                        let newOrder = uniqueFunc(orderList, 'orderNo');
                        console.log(`3第${newOrder.length}条数据`)
                        resolve(orderList)
                    }
                }
            }
        }).catch(err => {
            console.log('udo|err=>', err)
            reject(err)
        })
    });

}
module.exports = {
    BuyByQ,
    SellByQ,
    BuyClose,
    SellClose,
    Assets,
    UserInfo
}