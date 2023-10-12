let {ticker, pos} = require('./bybit.js')


setInterval(() => {
    console.log(ticker)
}, 1000);