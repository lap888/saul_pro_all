/* 扫码下单接口
 * @Author: topbrids@gmail.com 
 * @Date: 2022-12-24 15:07:58 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-02-21 12:53:10
 */
const axios = require('axios');
const ExKey = [
    {
        id: 1,
        name: 'ZY',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        amount: 20,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:7215d8cce6daf0f57cce0f289a59e7f482093014a9ff59e742d5620bea937a23;',
        btSession: 'bt_sessonid=8992ffd4-c31b-4b41-abbb-cd4e4e4e8fab;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJkNjViN2Y0NC0xZjI3LTQ5ZmMtOTM2My03MjRiYTI0YjY1MTMzMTQxMDIzMjAiLCJ1aWQiOiI3WG0rUEVMblhhVjdaKzZvZEF1dzRRPT0iLCJzdWIiOiI4NjMzNioqKipAcXEuY29tIiwiaXAiOiJQcm5abVJhUmpqU1RjSjAxT1Z3clNBPT0iLCJkaWQiOiJOazcrU0xWWktPRWRMU2JLc01DV3lDWE1mUjd1TnppakFPenJNTkxmaWNSMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2NzE4NjgyNDIsImV4cCI6MTY3OTY0NDI0MiwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.AfyPp6GGU_tknoD06eVoiTZGyTlfkgHcdVJV4d1PCxY'
    }
]

/**
 * 生成随机字符串
 * @param {*} len 
 * @returns 
 */
function randomString(len = 32) {
    let str = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
    let maxPos = str.length
    let randomStr = ''
    for (let i = 0; i < len; i++) {
        randomStr += str.charAt(Math.floor(Math.random() * maxPos))
    }
    return randomStr.toLowerCase()
}

//下单接口
const BuyByQ = async (symbol, amount, rToken) => {
    symbol = symbol.toLowerCase()
    let res = {}
    let _res = await axios.post(`https://gw.rebiasia.com/swap/v1/perpetual/products/${symbol}/batch-order?lang=zh_CN&platform=1&client=1&deviceId=${randomString()}&versionCode=3.0.1&token=${rToken}`, [{
        "type": 11, "side": "open_long", "amount": amount, "overrideOrderCondition": false
    }]);
    res = _res['data']
    console.log('扫码|买入开多BYQ', JSON.stringify(res))
    return res;
}
const BuyClose = async (symbol, amount, rToken) => {
    symbol = symbol.toLowerCase()
    let res = {}
    let _res = await axios.post(`https://gw.rebiasia.com/swap/v1/perpetual/products/${symbol}/order?lang=zh_CN&platform=1&client=1&deviceId=${randomString()}&versionCode=3.0.1&token=${rToken}`, {
        "type": 11, "side": "close_long", "amount": amount, "triggerBy": null, "triggerPrice": ""
    });
    res = _res['data']
    console.log('扫码|卖出平多BYQ', JSON.stringify(res))
    return res;
}
const SellByQ = async (symbol, amount, rToken) => {
    symbol = symbol.toLowerCase()
    let res = {}
    let _res = await axios.post(`https://gw.rebiasia.com/swap/v1/perpetual/products/${symbol}/batch-order?lang=zh_CN&platform=1&client=1&deviceId=${randomString()}&versionCode=3.0.1&token=${rToken}`, [{
        "type": 11,
        "side": "open_short",
        "amount": amount,
        "overrideOrderCondition": false
    }]);
    res = _res['data']
    console.log('扫码|卖出开空BYQ', JSON.stringify(res))
    return res;
}
const SellClose = async (symbol, amount, rToken) => {
    symbol = symbol.toLowerCase()
    let res = {}
    let _res = await axios.post(`https://gw.rebiasia.com/swap/v1/perpetual/products/${symbol}/order?lang=zh_CN&platform=1&client=1&deviceId=${randomString()}&versionCode=3.0.1&token=${rToken}`, {
        "type": 11, "side": "close_short", "amount": amount, "triggerBy": null, "triggerPrice": ""
    });
    res = _res['data']
    console.log('扫码|买入平空BYQ', JSON.stringify(res))
    return res;
}
//资产接口
const Assets = async (name, rToken) => {
    let res = {}
    let _res = await axios.get(`https://gw.rebiasia.com/swap/v1/perpetual/account/assets/v1/condition?token=${rToken}&platform=1&client=1&deviceId=${randomString()}&versionCode=3.0.1&lang=zh_CN`);
    res = _res['data']
    console.log(`扫码|查询 ${name} 资产`)
    return res;
}
//登录信息接口
const UserInfo = async (rToken) => {
    let res = {}
    let _res = await axios.post('https://gw.rebiasia.com/hk-web/v2/getUserInfo', { "token": rToken, "platform": 1, "client": 1, "deviceId": randomString(), "versionCode": "3.0.1", "lang": "zh_CN" });
    res = _res['data']
    // console.log(`扫码|查询 ${name} 用户信息`, res)
    return res;
}

//历史委托
const getHistoryOrderList = async (pageNo, pageSize, rToken) => {
    let res = {}
    let _res = await axios.get(`https://gw.rebiasia.com/swap/v2/perpetual/products/history-list?indexBase=&quote=&orderType=0&pageSize=${pageSize}&page=${pageNo}&token=${rToken}&platform=1&client=1&deviceId=${randomString()}&versionCode=3.0.1&lang=zh_CN`);
    res = _res['data']
    // console.log(`扫码 | 合约交易记录|历史委托`, res)
    return res;
}
// let token = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJob3Rjb2luIiwidWlkIjoidmxOaHM5K2s2bWp4SGVrR0tMQllhQT09Iiwic291cmNlIjoiTlVqaUVWREJLRndnVVY4K3dQT1FLQT09IiwiaWF0IjoxNjc2ODUzNjgxLCJqdGkiOiIwMWQwOTdjOC00NmVhLTRmZDAtYmE0NS1mYzdlZDk3ZDRiZGUiLCJpcCI6IllCay9tNDE2cVFySlQxZE4yckRYUXc9PSJ9.WrChamDjyx10pf8DImdhyRZVyZcRFbGanFZ30BETu8k$eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxZGUxZDhhYS0xMWYyLTRlNjQtYjJlMS05NjA4MGI1NDU4ZDA4OTI4NjQzODciLCJ1aWQiOiJ2bE5oczkrazZtanhIZWtHS0xCWWFBPT0iLCJpcCI6IjQ5N1lEQy9IV2JoZEFqM1JSSUJ0bnc9PSIsImRldiI6IkE4b0xOZVJWdkZHb3hMOVBaZWhrcEE9PSIsInN0cyI6MCwiaWF0IjoxNjc2ODUzNjgxLCJleHAiOjE2Nzc0NTg0ODEsImlzcyI6Im5ld2V4In0.5qcGhaDCZJx42oRsfrsLvd6qiqwQtFZ7ClQx7-1rhWw'
// Assets('haha', token)
// BuyByQ('neousdt', 1, token)
// SellByQ('neousdt', 1, token)

// BuyClose('neousdt', 1, token)
// SellClose('neousdt', 1, token)
// BuyClose()
// SellClose()
module.exports = {
    BuyByQ,
    SellByQ,
    BuyClose,
    SellClose,
    Assets,
    UserInfo,
    getHistoryOrderList
}