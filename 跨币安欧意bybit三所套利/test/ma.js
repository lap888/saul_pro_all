let pos = {}

pos['btc'] = 0
pos['eth'] = 1999

setInterval(() => {
    pos['btc'] = pos['btc'] + 1
    pos['eth'] = pos['eth'] - 1
}, 2000);

// export { pos }

module.exports = pos
