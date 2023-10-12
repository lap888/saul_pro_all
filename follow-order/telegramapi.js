const telegram = require('telegram-bot-api') //2.0.0
const fs = require('fs')
const path = require('path')

const Swap = require('./swap')

let configData = fs.readFileSync("config.json");
let configJson = JSON.parse(configData);
let proxyIp = configJson.proxyIp;
let proxy = configJson.proxy;
let apiKey = configJson.beFollowed.apiKey;
let apiSecret = configJson.beFollowed.apiSecret;
const baseURL = configJson.type == "hy" ? configJson.baseURL : configJson.xhBaseUrl;
const wsURL = configJson.type == "hy" ? configJson.wsURL : configJson.xhWsURL;

const client = new Swap(apiKey, apiSecret, { ip: proxyIp, port: proxy, baseURL: baseURL, wsURL: wsURL });



const teleBotToken = "5039617435:AAG9lgyAM-t7LwI-TfVS39pk31W6XlUrz9w" // 换成你的Token
const http_proxy = {
    host: proxyIp,
    port: proxy
}

let tgParams = { token: teleBotToken }

if (proxyIp != '' && proxyIp != undefined && proxy != '' && proxy != undefined) {
    tgParams.http_proxy = http_proxy
}
const api = new telegram(tgParams)
const mp = new telegram.GetUpdateMessageProvider()
api.setMessageProvider(mp)

api.start().then(() => {
    console.log('API is started')
}).catch(console.err)

// api.getMe()
// .then(console.log)
// .catch(console.err)

api.on('update', update => {
    // 处理信息逻辑
    let message = update.message
    console.log(message)
    let info = '';//{symbol: 'XRPBUSD', price: '0.8324', time: 1641230440968}
    let isPrice = message.text.indexOf('price') != -1
    if (isPrice) {
        let sysbom1 = message.text.replace(/\r\n/g, "")
        let sysbom2 = sysbom1.replace("price", "").replace(/\r\n/g, "")
        let sysbom3 = sysbom2.replace(" ", "")
        client.pricev3({ symbol: sysbom3.toUpperCase() }).then(res => {
            if (res.status == 200) {
                info = `symbol:${res.data.symbol}\r\nprice:${res.data.price}`
                // Send
                api.sendAnimation({
                    chat_id: message.chat.id,
                    caption: `welcome aelf's world...\r\n${info}`,
                    animation: fs.createReadStream(path.join(__dirname, './test/assets/aelf.jpg'))
                })
            }
        }).catch(err => {
            info = `${JSON.stringify(err.response.data)}`
            // Send
            api.sendAnimation({
                chat_id: message.chat.id,
                caption: `welcome aelf's world...\r\n${info}`,
                animation: fs.createReadStream(path.join(__dirname, './test/assets/aelf.jpg'))
            })
            console.log(err)
        });
    }
})
