const { Future, TA, XhSpot } = require('binance-futures-connector');


const fs = require('fs');
let configData = fs.readFileSync("./data/data.json");
let configJson = JSON.parse(configData);
let cf = "";
let cs = "";
let proxyIp = '';
let proxy = '';

if (configJson.env == "dev") {
    proxyIp = configJson.proxyIp
    proxy = configJson.proxy
}
let apiKey = configJson.apiKey;
let apiSecret = configJson.apiSecret;
cf = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy });
cs = new XhSpot(apiKey, apiSecret, { ip: proxyIp, port: proxy });

module.exports = {
    cf,
    cs,
    TA,
    configJson
}