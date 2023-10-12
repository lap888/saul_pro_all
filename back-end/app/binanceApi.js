const { Future, TA, XhSpot,Log } = require('binance-futures-connector');

const { LocalStorage } = require("node-localstorage")
let localStorage = new LocalStorage('./root');
const fs = require('fs');
let configData = fs.readFileSync("./data/setting.json");
let configJson = JSON.parse(configData);
let _configJson = {};
let cf = "";
let cs = "";
let proxyIp = '';
let proxy = '';

let root = localStorage.getItem('root')
if (root == null||root=='') {
    localStorage.setItem('root', configData);
    _configJson = configJson;
} else {
    _configJson = JSON.parse(root)
    if (_configJson.isRestart) {
        localStorage.setItem('root', configData);
        _configJson = configJson;
    }
}

if (_configJson.env == "dev") {
    proxyIp = _configJson.proxyIp
    proxy = _configJson.proxy
}
let apiKey = _configJson.apiKey;
let apiSecret = _configJson.apiSecret;
cf = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy });
cs = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy });

module.exports = {
    cf,
    cs,
    TA,
    configJson,
    Log
}