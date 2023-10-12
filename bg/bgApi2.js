const { _N, DateFormat, XhSpot, Future, Log } = require('binance-futures-connector')
const colors = require('colors');
const bitgetApi = require('bitget-openapi');
const { SubscribeReq, PlaceOrderReq, BitgetWsClient } = require('bitget-openapi');
const HttpsProxyAgent = require('https-proxy-agent');
// const apiKey = 'bg_7d9788340578d411cbd63a2a556389ef';
// const secretKey = 'bf91705b96b3c2e07aae2f81326e1528b3738e8bf9a4d096fef6d6845b09e8c7';
// const passphrase = 'toptoptop';

// const apiKey = 'bg_bd1bff02d35c721c1b667a84ae4bda1a';
// const secretKey = '0619831b0e1150b35d17693e292430b6bc23565c15b80d99ab9fc252bfd8e40b';
// const passphrase = 'xh18819513042';


const apiKey = 'bg_8a8063afa063183cdf8973eddb932399';
const secretKey = '31a8ea93cccd5993273bff0ae7ea4a9ebbcf98fc62551238af8618e6188c7c1b';
const passphrase = 'Ay888888';

let exInfo = []
let dt = null
let httpsAgent = new HttpsProxyAgent({ host: '127.0.0.1', port: 1087 })
const mixAccountApi = new bitgetApi.MixAccountApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixPositionApi = new bitgetApi.MixPositionApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixMarketApi = new bitgetApi.MixMarketApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });
const mixOrderApi = new bitgetApi.MixOrderApi(apiKey, secretKey, passphrase, { proxy: false, httpsAgent: httpsAgent });


//websocket
let bgEth = 0
const bitgetWsClient = new BitgetWsClient({
    reveice: (message) => {
        // console.log('>>>' + message, typeof (message), message.startsWith('{'));
        if (message.startsWith('{')) {
            message = JSON.parse(message)
            if (message.action != undefined) {
                bgEth = Number(message.data[0].markPrice)
                // console.log('>>>' + Number(message.data[0].markPrice));
            }
        }
    },
}, apiKey, secretKey, passphrase);

const subArr = new Array();

const subscribeOne = new SubscribeReq('mc', 'ticker', 'ETHUSDT');

subArr.push(subscribeOne);
try {
    bitgetWsClient.subscribe(subArr)

    setInterval(() => {
        bitgetWsClient.send("ping")
        // console.log('12')
    }, 5 * 1000);
} catch (error) {
    console.log('系统异常', error)
}

let sclient1 = new XhSpot('KkVe01GIi7amilEFDr83fmYdQQXuF5UQrJH75Lm5qnyn8VFVu7Jp26CGBfaZ6a00', 'ECeb2IAVFwysRYcrKZ6ThnZqzwjlo3kqiejjE8D06HOdQAdCmPKapVvFl9p8gIMO')
sclient1.createListenKey().then(response => {
    let listenKey = response.data.listenKey
    setInterval(() => {
        sclient1.renewListenKey(listenKey).then(res => {
            console.log(`延长listenkey,25分钟`)
        })
    }, 25 * 60 * 1000);

    sclient1.combinedStreams(['ethusdt@bookTicker'], {
        open: () => {
            console.log('策略启动...')
        },
        close: () => console.log('策略关闭...'),
        message: (msg) => {
            let mm = msg;
            msg = JSON.parse(msg.toString());
            // console.log(1)
            let price = msg.stream.split('@')[1] == 'ticker' ? msg.data.c : msg.stream.split('@')[1] == 'bookTicker' ? msg.data.b : msg.data.p
            let symbol = msg.data.s;
            price = Number(price)
            console.log(`交易对:${symbol} | 币安:${price} | 欧意:${bgEth} | 差值:${_N(price - bgEth, 4)} | 时间:${DateFormat(Date.now())}`.rainbow)
            if (Math.abs(price - bgEth) > 1 && bgEth != 0) {
                if (dt == null || Date.now() - dt > 2 * 1000) {
                    dt = Date.now()
                    Log(mm)
                }

            }

        }
    });

})

module.exports = {
    // Buy,
    // BuyByQ,
    // Sell,
    // SellByQ,
    // BuyClose,
    // SellClose,
    // BuyCloseAll,
    // SellCloseAll
}