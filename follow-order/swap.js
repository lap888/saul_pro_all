const APIBase = require('./APIBase')
const { AccountPush, Trade, WebSocket } = require('./modules')
const { flowRight } = require('./helpers/utils')

class swap extends flowRight(AccountPush, Trade, WebSocket)(APIBase) {

    constructor(apiKey = '', apiSecret = '', options = {}) {
        options.baseURL = options.baseURL || 'https://fapi.binance.com'
        super({
            apiKey,
            apiSecret,
            ...options
        })
    }
}

module.exports = swap
