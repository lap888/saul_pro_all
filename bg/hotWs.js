/* hot ex 交易所 ws
 * @Author: topbrids@gmail.com 
 * @Date: 2023-02-24 11:24:51 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-02-24 15:44:41
 */
const crypto = require('crypto');
const WebSocket = require('ws')
let url = require('url');
let HttpsProxyAgent = require('https-proxy-agent');
const ACCESS_KEY = "b74629cfabcc466892b38b5573106648"
const SECRET_KEY = "44C14F561BA2468572EE18616616E3A3"
const WSS_HOST = 'wss-ct.hotcoin.fit'
const WSS_URL = 'wss://' + WSS_HOST
let ip = '127.0.0.1'
let port = '1087'

// 签名算法
let hmacSha256 = "HmacSHA256";
// 签名版本号
let version = "2";
// 签名域名
let host = 'api.ws.contract.hotcoin.top'


const stringifyKeyValuePair = ([key, value]) => {
    const valueString = Array.isArray(value) ? `["${value.join('","')}"]` : value
    return `${key}=${encodeURIComponent(valueString)}`
}

const buildQueryString = params => {
    if (!params) return ''
    return Object.entries(params).sort().map(stringifyKeyValuePair)
        .join('&')
}

// let wsRef = subscribe(WSS_URL, {
//     open: () => {
//         console.log('策略启动...')
//         wsRef.ws.send('{"event":"subscribe","params":{"biz":"perpetual","type":"candles","contractCode": "ETHUSDT","granularity": "5min","zip":false,"serialize":false}}')

//         wsRef.ws.send('{"event":"subscribe","params":{"biz":"perpetual","type":"candles","contractCode": "btcUSDT","granularity": "5min","zip":false,"serialize":false}}')
//     },
//     close: () => console.log('策略关闭...'),
//     message: (msg) => {
//         msg = JSON.parse(msg)
//         try {
//             if (!msg.data.result) {
//                 console.log(`${msg.contractCode} | low:${msg.data[0][1]} | high:${msg.data[0][2]} | open:${msg.data[0][3]} | close:${msg.data[0][4]}`)
//             }
//         } catch (error) {
//             console.log(`接收消息:${JSON.stringify(msg)}`)
//         }
//     }
// });

function subscribe(urls, callbacks) {
    let options = {}
    if (ip != '' && ip != undefined && port != '' && port != undefined) {
        let proxy = `http://${ip}:${port}`;
        let agent = new HttpsProxyAgent(url.parse(proxy));
        options.agent = agent;
    }
    const wsRef = {}
    wsRef.closeInitiated = false
    const initConnect = () => {
        const ws = new WebSocket(urls)
        wsRef.ws = ws
        Object.keys(callbacks).forEach((event, _) => {
            console.log(`监听事件: ${event}`)
            ws.on(event, callbacks[event])
        })
        ws.on('open', err => {
            //发送签名
            let httpMethod = "WSS";
            // 接口URI
            let uri = `/wss`;
            let businessData = {}
            businessData["AccessKeyId"] = ACCESS_KEY;
            businessData["SignatureMethod"] = hmacSha256;
            businessData["SignatureVersion"] = version;
            // 当前UTC时间
            businessData["Timestamp"] = new Date().toISOString();
            //拼接业务参数
            let paramPair = buildQueryString(businessData)
            let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
            // console.log('待签名的原始字符串', unSign)
            let signature = crypto.createHmac('sha256', SECRET_KEY).update(unSign).digest("base64");
            // 添加到请求参数
            businessData["Signature"] = signature
            ws.send('{"event": "signin","params": {"apiKey": "' + ACCESS_KEY + '","timestamp": "' + businessData["Timestamp"] + '","signature": "' + businessData["Signature"] + '"}}')
            setInterval(() => {
                ws.send('{"event":"ping"}')
            }, 120 * 1000);
        })
        ws.on('ping', () => {
            console.log('接收到来自服务端的ping')
            ws.pong()
        })

        ws.on('pong', () => {
            console.log('接收到来自服务端的pong')
        })

        ws.on('error', err => {
            console.log(`err=${err}`)
        })

        ws.on('close', (closeEventCode, reason) => {
            if (!wsRef.closeInitiated) {
                console.log(`ws连接关闭,原因:${closeEventCode}: ${reason}`)
                setTimeout(() => {
                    console.log('ws重新链接...')
                    initConnect()
                }, 500)
            } else {
                wsRef.closeInitiated = false
            }
        })
    }
    console.log(`ws连接:${urls}`)
    initConnect()
    return wsRef
}

module.exports = {
    subscribe
}