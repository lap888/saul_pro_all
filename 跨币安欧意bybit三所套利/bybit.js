const { WebsocketClient, LinearClient, RestClientV5,LinearPositionIdx } = require('bybit-api');

const API_KEY = '0MxeC2PQ4VaTDTIhEO';
const PRIVATE_KEY = '6oPrxTw7g9WkC5Gw7qeOrpxh7v3qBGSQRNVv';

const wsConfig = {
    key: API_KEY,
    secret: PRIVATE_KEY,
    market: 'v5',
};

const ws = new WebsocketClient(wsConfig);
let ticker = []
let posbybit = []


const bybitClient = new LinearClient({
    key: API_KEY,
    secret: PRIVATE_KEY
})

function getbybitPos() {
    // bybitClient.getPosition()
    bybitClient.getPosition().then(response => {
        // console.log('response',response.result[0].data)
        response.result.forEach((item1) => {
            item1.size = Math.abs(Number(item1.data.size))
            item1.entry_price = Number(item1.data.entry_price)
            if (item1.data.size != 0) {
                let index = posbybit.findIndex(v => v.symbol == item1.data.symbol && v.posSide == item1.data.side)
                if (index == -1) {
                    posbybit.push({ ep: item1.data.entry_price, pos: item1.data.size, symbol: item1.data.symbol, posSide: item1.data.side, upl: Number(item1.data.unrealised_pnl) })
                } else {
                    posbybit[index].ep = item1.data.entry_price
                    posbybit[index].pos = item1.data.size
                    posbybit[index].posSide = item1.data.side
                    posbybit[index].upl = Number(item1.data.unrealised_pnl)
                }
            }
        })
    }).catch(err => {
        console.log('获取account错误', err)
    })
}


module.exports = { ticker, posbybit, bybitClient, getbybitPos }