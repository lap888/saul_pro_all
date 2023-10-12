/* 扫码下单接口
 * @Author: topbrids@gmail.com 
 * @Date: 2022-12-24 15:07:58 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2022-12-31 10:08:38
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
    },
    {
        id: 1,
        name: 'Qee',
        apiKey: 'bg_bd1bff02d35c721c1b667a84ae4bda1a',
        secretKey: '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b',
        passphrase: 'xh18819513042',
        amount: 20,
        isDo: true,
        pos: 'a|u',
        rToken: 'bt_rtoken=upex:session:id:220281b35e21a593f2f04a8c89e84ad738828b5f490b0d96a8fa1d74582fc5ac;',
        btSession: 'bt_sessonid=f50a6681-5130-45b5-849b-96c61f63a495;',
        btNewSession: 'bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI2YTg4N2JjNy0wZThhLTRmZGQtODQzZS1lNWJjYmFkZTUwNDA5NjkxNzI0NjUiLCJ1aWQiOiJiS2VMckdPTm9tbklvUEZjcXZ2eE9BPT0iLCJzdWIiOiJxZWVmKioqKkBob3RtYWlsLmNvbSIsImlwIjoiUHJuWm1SYVJqalNUY0owMU9Wd3JTQT09IiwiZGlkIjoibkc1TThOaG9PbXJoWkQrMlc4NVpaM2RtdFJvUVJ3UEMrVjFGK3VDUVh4RjEyUklzWlFLTTVIQmtTNHlUUmhuVyIsInN0cyI6MCwiaWF0IjoxNjcxODcwNTAxLCJleHAiOjE2Nzk2NDY1MDEsInB1c2hpZCI6ImRka1NMR1VDak9Sd1pFdU1rMFlaMWc9PSIsImlzcyI6InVwZXgifQ.HkHZATpPXDLC0_IwhYuX_AhLpq8Y81CCvSG3dpLZJ-g;'
    }
]

//下单接口
const BuyByQ = async (symbol, amount, rToken, btSession, btNewSession) => {
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
    }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
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
    // console.log(`扫码|查询 ${name} 资产`, res)
    return res;
}
//登录信息接口
const UserInfo = async (name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/user/overview/userinfo', { "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    // console.log(`扫码|查询 ${name} 用户信息`, res)
    return res;
}
//历史委托
const getHistoryOrderList = async (pageNo, pageSize, startTime, endTime, name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/getHistoryOrderList', { "businessLine": 10, "pageNo": pageNo, "pageSize": pageSize, "startTime": startTime, "endTime": endTime, "delegateType": 0, "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    // console.log(`扫码 | ${name} 合约交易记录|历史委托`, res)
    return res;
}
const getDealRecordList = async (pageNo, pageSize, startTime, endTime, name, rToken, btSession, btNewSession) => {
    let res = {}
    let _res = await axios.post('https://www.bitget.com/v1/mcp/order/getDealRecordList', { "businessLine": 10, "pageNo": pageNo, "pageSize": pageSize, "startTime": startTime, "endTime": endTime, "languageType": 1 }, { "headers": { "Cookie": `${rToken}${btSession}${btNewSession}` } });
    res = _res['data']
    // console.log(`扫码 | ${name} 合约交易记录|成交明细`, res)
    return res;
}

module.exports = {
    BuyByQ,
    SellByQ,
    BuyClose,
    SellClose,
    Assets,
    UserInfo,
    getHistoryOrderList,
    getDealRecordList
}