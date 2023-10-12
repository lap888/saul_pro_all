const { LocalStorage } = require("node-localstorage");
let { cf, cs, TA } = require('../app/binanceApi')
const { init_tg } = require('../app/message')
let localStorage = new LocalStorage('./root');
const fs = require('fs');
let configData = fs.readFileSync("./data/data.json");
/**
 * 初始化数据在入口处调用一次
 */
function init() {
    let root = localStorage.getItem('root')
    if (root == null) {
        localStorage.setItem('root', configData);
    } else {
        let _configJson = JSON.parse(configData)
        if (_configJson.isRestart) {
            localStorage.setItem('root', configData);
        }
    }
    //对接tg bot 初始化
    init_tg()
}

function get_json_data() {
    let configData = localStorage.getItem('root');
    return JSON.parse(configData);
}

function modify_json_data(data) {
    let _data = JSON.stringify(data);
    localStorage.setItem('root', _data);
}

const get_coinList = () => {
    let data_json = get_json_data()
    return data_json.coinList;
}

const get_buy_price = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].runBet.next_buy_price;
}

const get_buy_price_s = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].runBet.next_buy_price_s;
}

const get_sell_price = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].runBet.grid_sell_price;
}

const get_sell_price_s = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].runBet.grid_sell_price_s;
}

const get_cointype = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].config.cointype;
}

const get_step = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].runBet.step;
}
const get_step_s = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].runBet.step_s;
}
/**
 * 太极损益
 * @param {*} symbol 
 * @param {*} value 
 * @returns 
 */
const set_tj_l = (symbol, value) => {
    let data_json = get_json_data()
    data_json.tjL[symbol] = Number(value)
    return modify_json_data(data_json);
}

const get_tj_l = (symbol) => {
    let data_json = get_json_data()
    if (data_json.tjL[symbol] == undefined) {
        data_json.tjL[symbol] = 0
        modify_json_data(data_json)
        return 0
    }
    return data_json.tjL[symbol];
}

/**
 * 太极S
 * @param {*} symbol 
 * @param {*} value 
 * @returns 
 */
const set_tj_s = (symbol, value) => {
    let data_json = get_json_data()
    data_json.tjS[symbol] = Number(value)
    return modify_json_data(data_json);
}

const get_tj_s = (symbol) => {
    let data_json = get_json_data()
    if (data_json.tjS[symbol] == undefined) {
        data_json.tjS[symbol] = 0
        modify_json_data(data_json)
        return 0
    }
    return data_json.tjS[symbol];
}
/**
 * 
 * @param {*} symbol 
 * @param {*} exchange_method exchange: True 代表买入，取买入的仓位 False：代表卖出，取卖出应该的仓位
 * @returns 
 */
const get_quantity = (symbol, exchange_method = true) => {
    let data_json = get_json_data()
    let cur_step = 0;
    if (exchange_method) {
        cur_step = data_json[symbol].runBet.step;
    } else {
        cur_step = data_json[symbol].runBet.step - 1;
    }
    let quantity_arr = data_json[symbol].config.quantity;
    let quantity = 0;
    if (cur_step < quantity_arr.length) {
        if (cur_step == 0) {
            quantity = quantity_arr[0]
        } else {
            quantity = quantity_arr[cur_step]
        }
    } else {
        quantity = quantity_arr[quantity_arr.length - 1]
    }
    return quantity
}

const get_quantity_s = (symbol, exchange_method = true) => {
    let data_json = get_json_data()
    let cur_step = 0;
    if (exchange_method) {
        cur_step = data_json[symbol].runBet.step_s;
    } else {
        cur_step = data_json[symbol].runBet.step_s - 1;
    }
    let quantity_arr = data_json[symbol].config.quantity;
    let quantity = 0;
    if (cur_step < quantity_arr.length) {
        if (cur_step == 0) {
            quantity = quantity_arr[0]
        } else {
            quantity = quantity_arr[cur_step]
        }
    } else {
        quantity = quantity_arr[quantity_arr.length - 1]
    }
    return quantity
}

/**
 * 获取交易价格
 * @param {*} symbol 
 * @returns 
 */
const get_record_price = (symbol) => {
    let data_json = get_json_data()
    // 卖出后，step减一后，再读取上次买入的价格
    let cur_step = get_step(symbol) - 1
    return data_json[symbol].runBet.recorded_price[cur_step];
}

const get_record_price_s = (symbol) => {
    let data_json = get_json_data()
    // 卖出后，step减一后，再读取上次买入的价格
    let cur_step = get_step_s(symbol) - 1
    return data_json[symbol].runBet.recorded_price_s[cur_step];
}

/**
 * 记录交易价格
 * @param {*} symbol 
 * @returns 
 */
const set_record_price = (symbol, value) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.recorded_price.push(value)
    return modify_json_data(data_json);
}

const set_record_price_s = (symbol, value) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.recorded_price_s.push(value)
    return modify_json_data(data_json);
}


/**
 * 移除交易价格
 * @param {*} symbol 
 * @returns 
 */
const remove_record_price = (symbol) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.recorded_price.pop()
    return modify_json_data(data_json);
}

const remove_record_price_s = (symbol) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.recorded_price_s.pop()
    return modify_json_data(data_json);
}

const reset_record_price = (symbol) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.recorded_price = [];
    return modify_json_data(data_json);
}

const reset_record_price_s = (symbol) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.recorded_price_s = [];
    return modify_json_data(data_json);
}

/**
 * 获取补仓比率
 * @param {*} symbol 
 * @returns 
 */
const get_profit_ratio = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].config.profit_ratio;
}

/**
 * 获取止盈比率
 * @param {*} symbol 
 * @returns 
 */
const get_double_throw_ratio = (symbol) => {
    let data_json = get_json_data()
    return data_json[symbol].config.double_throw_ratio;
}

const get_atr = (symbol, interval = '4h', kline_num = 20) => {
    return new Promise((resolve, reject) => {
        let percent_total = 0;
        cf.klines(symbol, interval, { limit: kline_num }).then(res => {
            let data = res.data;
            for (let i = 0; i < data.length; i++) {
                let e = data[i];
                percent_total += Math.abs((Number(e[3]) - Number(e[2])) / Number(e[4]))
            }
            let atr = (percent_total / kline_num * 100).toFixed(2);
            resolve(atr)
        }).catch(err => {
            reject(err)
        })
    });
}

/**
 * 修改补仓止盈比率
 * @param {*} symbol 
 */
const set_ratio2 = async (symbol) => {
    let data_json = get_json_data()
    let atr_value = await get_atr(symbol, '5m', 20);
    data_json[symbol].config.double_throw_ratio = atr_value
    data_json[symbol].config.profit_ratio = atr_value
    console.log(`set_ratio:${atr_value}`)
    modify_json_data(data_json)
}
/**
 * 修改补仓止盈比率
 * @param {*} symbol 
 */
const set_ratio = async (symbol) => {
    let data_json = get_json_data()
    let ratio_24hr = (await cf.price24hr({ symbol: symbol })).data.priceChangePercent;
    ratio_24hr = Number(ratio_24hr)
    let index = Math.abs(ratio_24hr)
    let _step = get_step(symbol);
    if (index > 6) {
        if (ratio_24hr > 0) {
            // 单边上涨，补仓比率不变
            data_json[symbol].config.double_throw_ratio = Number((0.3 + _step / 10).toFixed(4));
            data_json[symbol].config.profit_ratio = Number((0.3 + _step / 10).toFixed(4));
        } else {
            data_json[symbol].config.double_throw_ratio = Number((0.5 + _step / 10).toFixed(4));
            data_json[symbol].config.profit_ratio = Number((0.3 + _step / 6).toFixed(4));
        }
    } else {
        // 系数内震荡行情
        data_json[symbol].config.double_throw_ratio = Number((0.3 + _step / 10).toFixed(4));
        data_json[symbol].config.profit_ratio = Number((0.3 + _step / 10).toFixed(4));
    }
    console.log(`set_ratio:${data_json[symbol].config.profit_ratio}`)
    modify_json_data(data_json)
}

const reset_ratio = async (symbol) => {
    let data_json = get_json_data()
    data_json[symbol].config.double_throw_ratio = 0.3;
    data_json[symbol].config.profit_ratio = 0.3;
    console.log(`reset_ratio:${data_json[symbol].config.profit_ratio}`)
    modify_json_data(data_json)
}

const set_ratio_s = async (symbol) => {
    let data_json = get_json_data()
    let ratio_24hr = (await cf.price24hr({ symbol: symbol })).data.priceChangePercent;
    ratio_24hr = Number(ratio_24hr)
    let index = Math.abs(ratio_24hr)
    let _step = get_step_s(symbol);
    // _step = Math.min(_step, data_json.maxStep)
    if (index > 6) {
        if (ratio_24hr > 0) {
            // 单边上涨，补仓比率不变
            data_json[symbol].config.double_throw_ratio = Number((0.3 + _step / 10).toFixed(4));
            data_json[symbol].config.profit_ratio = Number((0.3 + _step / 10).toFixed(4));
        } else {
            data_json[symbol].config.double_throw_ratio = Number((0.5 + _step / 10).toFixed(4));
            data_json[symbol].config.profit_ratio = Number((0.3 + _step / 10).toFixed(4));
        }
    } else {
        // 系数内震荡行情
        data_json[symbol].config.double_throw_ratio = Number((0.3 + _step / 10).toFixed(4));
        data_json[symbol].config.profit_ratio = Number((0.3 + _step / 10).toFixed(4));

    }
    console.log(`set_ratios:${data_json[symbol].config.profit_ratio}`)
    modify_json_data(data_json)
}

/**
 * 斜率
 * @param {*} symbol 
 * @param {*} interval 
 * @param {*} point 
 * @param {*} records 
 * @returns 
 */
const calcSlopeMA5 = async (symbol, interval, point, records = '') => {
    let last_ma5 = 0
    let next_ma5 = 0
    let data = []
    if (records == '') {
        data = await cf.records(symbol, interval, 6)
    } else {
        data = records.slice(-6)
    }
    for (let i = 0; i < data.length; i++) {
        let e = data[i];
        if (i == 0) {
            last_ma5 += e.Close
        } else if (i == 6) {
            next_ma5 += e.Close
        } else {
            last_ma5 += e.Close
            next_ma5 += e.Close
        }
    }
    last_ma5 = Number((last_ma5 / 5).toFixed(point))
    next_ma5 = Number((next_ma5 / 5).toFixed(point))
    return [last_ma5, next_ma5]
}
/**
 * 趋势判断 direction=LONG return ture 正在上升，direction=SHORT return ture 正在下降
 * @param {*} symbol 
 * @param {*} interval 
 * @param {*} direction 
 * @param {*} point 
 * @param {*} records 
 * @returns 
 */
const calcAngle = async (symbol, interval, direction, point, records = '') => {
    let [lastMA5, next_ma5] = await calcSlopeMA5(symbol, interval, point, records);

    if (direction == "LONG")
        return next_ma5 > lastMA5
    else
        return next_ma5 < lastMA5
}

/**
 * 买入后，修改 补仓价格 和 网格平仓价格以及步数
 * @param {*} symbol 
 * @param {*} deal_price 
 * @param {*} step 
 * @param {*} market_price 
 */
const modify_price = (symbol, deal_price, step, market_price) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.next_buy_price = Number((deal_price * (1 - data_json[symbol].config.double_throw_ratio / 100)).toFixed(6))
    data_json[symbol].runBet.grid_sell_price = Number((deal_price * (1 + data_json[symbol].config.profit_ratio / 100)).toFixed(6))

    if (data_json[symbol].runBet.next_buy_price > market_price) {
        data_json[symbol].runBet.next_buy_price = Number((market_price * (1 - data_json[symbol].config.double_throw_ratio / 100)).toFixed(6))
    } else if (data_json[symbol].runBet.grid_sell_price < market_price) {
        data_json[symbol].runBet.grid_sell_price = Number((market_price * (1 + data_json[symbol].config.profit_ratio / 100)).toFixed(6))
    }
    data_json[symbol].runBet.step = step
    modify_json_data(data_json)
    console.log(`Long=>${symbol}=>,当前价:${market_price},修改后的补仓价格为:${data_json[symbol].runBet.next_buy_price}`);
}

const modify_price_s = (symbol, deal_price, step, market_price) => {
    let data_json = get_json_data()
    data_json[symbol].runBet.next_buy_price_s = Number((deal_price * (1 + data_json[symbol].config.double_throw_ratio / 100)).toFixed(6))
    data_json[symbol].runBet.grid_sell_price_s = Number((deal_price * (1 - data_json[symbol].config.profit_ratio / 100)).toFixed(6))

    if (data_json[symbol].runBet.next_buy_price_s < market_price) {
        data_json[symbol].runBet.next_buy_price_s = Number((market_price * (1 + data_json[symbol].config.double_throw_ratio / 100)).toFixed(6))
    } else if (data_json[symbol].runBet.grid_sell_price_s > market_price) {
        data_json[symbol].runBet.grid_sell_price_s = Number((market_price * (1 - data_json[symbol].config.profit_ratio / 100)).toFixed(6))
    }
    data_json[symbol].runBet.step_s = step
    modify_json_data(data_json)
    console.log(`Short=>${symbol}=>,当前价:${market_price},修改后的补仓价格为:${data_json[symbol].runBet.next_buy_price_s}`);
}



module.exports.runBet = {
    init,
    get_coinList,
    get_buy_price,
    get_sell_price,
    get_cointype,
    get_record_price,
    get_quantity,
    remove_record_price,
    get_profit_ratio,
    get_double_throw_ratio,
    set_record_price,
    get_atr,
    set_ratio,
    modify_price,
    get_step,
    modify_json_data,
    get_json_data,
    calcAngle,
    reset_record_price,
    set_record_price_s,
    modify_price_s,
    reset_record_price_s,
    get_step_s,
    get_quantity_s,
    get_buy_price_s,
    get_sell_price_s,
    set_ratio_s,
    get_record_price_s,
    remove_record_price_s,
    set_tj_s,
    set_tj_l,
    get_tj_s,
    get_tj_l,
    reset_ratio
}
