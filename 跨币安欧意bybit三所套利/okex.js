const { WebsocketClient, RestClient, OrderRequest } = require('okx-api');

const API_KEY = process.env.API_KEY_COM || '2f46a8cf-f999-45f8-ae24-4ffd5cc47e15';
const API_SECRET = process.env.API_SECRET_COM || '671C14A852246093C61F789FF0C77074';
const API_PASSPHRASE = process.env.API_PASSPHRASE_COM || 'My123...';

let okfund = []
let posok = []
const okclient = new RestClient({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    apiPass: API_PASSPHRASE
}, 'prod', {});

const wsClient = new WebsocketClient(
    {
        market: 'prod',
        accounts: [
            {
                apiKey: API_KEY,
                apiSecret: API_SECRET,
                apiPass: API_PASSPHRASE,
            }
        ]
    }
);


wsClient.on('update', (data) => {
    // console.log(new Date(),
    //     'ws 更新推送',
    //     JSON.stringify(data, null, 2)
    // );
    let symbolpre = data.arg.instId;
    if (symbolpre != undefined) {
        let symbol = data.arg.instId.split('-')[0] + 'USDT'
        let index = okfund.findIndex(v => v.symbol == symbol)
        if (index == -1) {
            okfund.push({ symbol: symbol, symbolpre: symbolpre, fundingRate: 0, flag: 'okex' })
        } else {
            if (data.arg.channel == 'funding-rate') {
                let fundingRate = Number(data.data[0].fundingRate)
                okfund[index]['fundingRate'] = fundingRate
            }
            // if (data.arg.channel == 'tickers') {
            //     let ticker = Number(data.data[0].last)
            //     okfund[index]['ticker'] = ticker
            // }
        }
    }
    if (data.arg.channel == 'positions') {
        // let _okpos = []
        data.data.map(v => {
            let symbolpre = v.instId.split('-')[0] + 'USDT'
            let index = posok.findIndex(v1 => v1.symbol == symbolpre && v.posSide == v1.posSide)
            if (index == -1) {
                posok.push({ pos: Number(v.pos), symbol: symbolpre, symbolpre: v.instId, posSide: v.posSide, upl: Number(v.upl) })
            } else {
                posok[index]['pos'] = Number(v.pos)
                posok[index]['upl'] = Number(v.upl)
            }
        })
    }
});

wsClient.on('open', (data) => {
    console.log('ws 链接打开:', data.wsKey);
});

wsClient.on('response', (data) => {
    // console.log('ws 订阅响应 ', JSON.stringify(data, null, 2));
});

wsClient.on('reconnect', ({ wsKey }) => {
    console.log('ws 自动断线重连 ', wsKey);
});
wsClient.on('reconnected', (data) => {
    console.log('ws 已经断线重连 ', data?.wsKey);
});
wsClient.on('error', (data) => {
    console.error('ws 异常: ', data);
});

// 获取ok上线的永续币种
okclient.getInstruments('SWAP').then(symbols => {
    let fundingrates = []
    let tickers = []
    symbols.map(v => {
        fundingrates.push({ channel: "funding-rate", instId: v.instId })
        // tickers.push({
        //     channel: 'tickers',
        //     instId: v.instId,
        //     instType: 'SWAP'
        // })
    })
    wsClient.subscribe(fundingrates)
    // wsClient.subscribe(tickers)
    wsClient.subscribe({
        channel: 'positions',
        instType: 'SWAP',
    })
}).catch(err => {
    console.log(err)
})
module.exports = { okclient, okfund, posok }
